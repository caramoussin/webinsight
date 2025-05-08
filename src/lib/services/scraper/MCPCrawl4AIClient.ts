/**
 * MCP-based Crawl4AI client for web content extraction
 *
 * This client uses the MCP infrastructure to access Crawl4AI capabilities via API routes,
 * providing the same API as the original Crawl4AIClient but leveraging
 * the standardized MCP architecture.
 *
 * This implementation follows WebInsight's layered architecture principles:
 * - Uses API routes as an interface to the MCP host
 * - Leverages Effect TS for functional programming patterns
 * - Maintains local-first and profile-based principles
 */

import { Effect, Schema as S, pipe } from 'effect';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ServiceError, effectFetch } from '$lib/utils/effect';
import type {
  ExtractContentInput,
  ExtractContentOutput,
  CheckRobotsTxtOutput
} from '$lib/server/mcp/crawl4ai/schemas';

// Define client-facing schemas using Effect Schema

/**
 * Schema for extraction options in the client API
 */
export const ExtractionOptionsSchema = S.Struct({
  url: S.String.pipe(S.pattern(/^https?:\/\/.+/)),
  mode: S.Union(S.Literal('raw'), S.Literal('markdown'), S.Literal('text')).pipe(
    S.propertySignature,
    S.withConstructorDefault(() => 'markdown' as const)
  ),
  includeMetadata: S.Boolean.pipe(
    S.propertySignature,
    S.withConstructorDefault(() => true)
  )
});

export type ExtractionOptions = S.Schema.Type<typeof ExtractionOptionsSchema>;

/**
 * Schema for robots check options in the client API
 */
export const RobotsCheckOptionsSchema = S.Struct({
  url: S.String.pipe(S.pattern(/^https?:\/\/.+/)),
  userAgent: S.optional(S.String)
});

export type RobotsCheckOptions = S.Schema.Type<typeof RobotsCheckOptionsSchema>;

/**
 * Schema for extraction response in the client API
 */
export const ExtractionResponseSchema = S.Struct({
  content: S.String,
  metadata: S.optional(S.Record({ key: S.String, value: S.String }))
});

export type ExtractionResponse = S.Schema.Type<typeof ExtractionResponseSchema>;

/**
 * Schema for robots check response in the client API
 */
export const RobotsCheckResponseSchema = S.Struct({
  allowed: S.Boolean,
  message: S.optional(S.String)
});

export type RobotsCheckResponse = S.Schema.Type<typeof RobotsCheckResponseSchema>;

/**
 * MCP-based implementation of Crawl4AI client
 *
 * This class provides access to the Crawl4AI MCP provider capabilities
 * using the unified MCP structure and Effect Schema for validation.
 */
export class MCPCrawl4AIClient {
  // Use the main MCP API route instead of the Crawl4AI-specific route
  private static readonly MCP_API_URL = '/api/mcp';
  private static readonly MCP_SERVER_URL = 'http://localhost:3000/api/mcp'; // For SDK client

  // No constructor needed as we're using static methods with Effect TS patterns

  /**
   * Create an SDK-based MCP client for official MCP connections
   * @returns Effect with the MCP client
   */
  static createSDKClient(): Effect.Effect<Client, ServiceError> {
    return Effect.try({
      try: () => {
        return new Client({
          name: 'WebInsight Crawl4AI Client',
          version: '1.0.0',
          serverUrl: this.MCP_SERVER_URL
        });
      },
      catch: (error) =>
        new ServiceError({
          code: 'MCP_CLIENT_ERROR',
          message: 'Failed to create MCP SDK client',
          cause: error
        })
    });
  }

  /**
   * Extract content from a URL using Crawl4AI via MCP API route
   *
   * This method calls the MCP API route, which interfaces with the MCP host
   * to access the Crawl4AI provider. This maintains the layered architecture
   * while leveraging the unified MCP structure.
   *
   * @param options The extraction options
   * @returns Effect with extraction response or error
   */
  static extractContent(
    options: ExtractionOptions
  ): Effect.Effect<ExtractionResponse, ServiceError> {
    return pipe(
      // Parse and validate options with Effect Schema
      S.decode(ExtractionOptionsSchema)(options),
      Effect.mapError(
        (error) =>
          new ServiceError({
            code: 'INVALID_PARAMETERS',
            message: 'Invalid extraction options',
            cause: error
          })
      ),

      // Map client options to MCP service options
      Effect.map(
        (validOptions) =>
          ({
            url: validOptions.url,
            selectors: validOptions.mode === 'raw' ? { include_html: true } : undefined
          }) as ExtractContentInput
      ),

      // Make request to MCP API
      Effect.flatMap((serviceParams) =>
        effectFetch<{ result: ExtractContentOutput }>(`${MCPCrawl4AIClient.MCP_API_URL}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'extractContent',
            provider: 'crawl4ai', // Specify the provider for the main MCP API route
            params: serviceParams
          })
        })
      ),

      // Map service response to client response
      Effect.map(
        (response) =>
          ({
            content: response.result.content.markdown,
            metadata: {}
          }) as ExtractionResponse
      )
    );
  }

  /**
   * Check if a URL is allowed by robots.txt using Crawl4AI via MCP API route
   *
   * This method calls the MCP API route, which interfaces with the MCP host
   * to access the Crawl4AI provider. This maintains the layered architecture
   * while leveraging the unified MCP structure.
   *
   * @param url The URL to check
   * @param userAgent Optional user agent string
   * @returns Effect with robots check response or error
   */
  static checkRobotsTxt(
    url: string,
    userAgent?: string
  ): Effect.Effect<RobotsCheckResponse, ServiceError> {
    return pipe(
      // Create and validate parameters
      S.decode(RobotsCheckOptionsSchema)({
        url,
        userAgent
      }),
      Effect.mapError(
        (error) =>
          new ServiceError({
            code: 'INVALID_PARAMETERS',
            message: 'Invalid robots.txt check parameters',
            cause: error
          })
      ),

      // Make request to MCP API
      Effect.flatMap((params) =>
        effectFetch<{ result: CheckRobotsTxtOutput }>(`${MCPCrawl4AIClient.MCP_API_URL}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'checkRobotsTxt',
            provider: 'crawl4ai', // Specify the provider for the main MCP API route
            params
          })
        })
      ),

      // Map service response to client response and ensure type safety
      Effect.map((response) => {
        return {
          allowed: response.result.allowed,
          message: response.result.error
        } as RobotsCheckResponse;
      })
    );
  }

  // Instance methods for direct MCP client usage with the official SDK

  /**
   * Extract content from a URL using MCP tool (API route approach)
   * @param url The URL to extract content from
   * @param mode The mode of content extraction
   * @param includeMetadata Whether to include metadata in the response
   * @returns Effect with the extracted content or error
   */
  extractContent = (
    url: string,
    mode: 'raw' | 'markdown' | 'text' = 'markdown',
    includeMetadata = true
  ): Effect.Effect<ExtractionResponse, ServiceError> =>
    pipe(
      // Create options object
      S.decode(ExtractionOptionsSchema)({ url, mode, includeMetadata }),
      Effect.mapError(
        (error) =>
          new ServiceError({
            code: 'INVALID_PARAMETERS',
            message: 'Invalid extraction options',
            cause: error
          })
      ),

      // Call the static method to handle the request
      Effect.flatMap((options) => MCPCrawl4AIClient.extractContent(options))
    );

  /**
   * Extract content from a URL using the official MCP SDK
   * @param url The URL to extract content from
   * @param mode The mode of content extraction
   * @param includeMetadata Whether to include metadata in the response
   * @returns Effect with the extracted content or error
   */
  extractContentWithSDK = (
    url: string,
    mode: 'raw' | 'markdown' | 'text' = 'markdown',
    includeMetadata = true
  ): Effect.Effect<ExtractionResponse, ServiceError> =>
    pipe(
      // Create options object
      S.decode(ExtractionOptionsSchema)({ url, mode, includeMetadata }),
      Effect.mapError(
        (error) =>
          new ServiceError({
            code: 'INVALID_PARAMETERS',
            message: 'Invalid extraction options',
            cause: error
          })
      ),

      // Create SDK client
      Effect.flatMap(() => MCPCrawl4AIClient.createSDKClient()),

      // Call the tool using the SDK client
      Effect.flatMap((client) =>
        Effect.tryPromise({
          try: async () => {
            const result = await client.callTool({
              name: 'extractContent',
              arguments: {
                url,
                mode,
                includeMetadata
              }
            });

            // Convert SDK response to ExtractionResponse
            return {
              content: result.content,
              metadata: result.metadata || {}
            } as ExtractionResponse;
          },
          catch: (error) =>
            new ServiceError({
              code: 'SDK_CALL_ERROR',
              message: 'Error calling extractContent with MCP SDK',
              cause: error
            })
        })
      )
    );

  /**
   * Check if URL is allowed by robots.txt (API route approach)
   * @param url The URL to check
   * @param userAgent Optional user agent string
   * @returns Effect with the robots.txt check result or error
   */
  checkRobotsTxt = (
    url: string,
    userAgent?: string
  ): Effect.Effect<RobotsCheckResponse, ServiceError> =>
    MCPCrawl4AIClient.checkRobotsTxt(url, userAgent);

  /**
   * Check if URL is allowed by robots.txt using the official MCP SDK
   * @param url The URL to check
   * @param userAgent Optional user agent string
   * @returns Effect with the robots.txt check result or error
   */
  checkRobotsTxtWithSDK = (
    url: string,
    userAgent?: string
  ): Effect.Effect<RobotsCheckResponse, ServiceError> =>
    pipe(
      // Create SDK client
      MCPCrawl4AIClient.createSDKClient(),

      // Call the tool using the SDK client
      Effect.flatMap((client) =>
        Effect.tryPromise({
          try: async () => {
            const result = await client.callTool({
              name: 'checkRobotsTxt',
              arguments: {
                url,
                userAgent
              }
            });

            // Convert SDK response to RobotsCheckResponse
            return {
              allowed: result.allowed,
              message: result.message
            } as RobotsCheckResponse;
          },
          catch: (error) =>
            new ServiceError({
              code: 'SDK_CALL_ERROR',
              message: 'Error calling checkRobotsTxt with MCP SDK',
              cause: error
            })
        })
      )
    );
}

export const createMCPCrawl4AIClient = () => new MCPCrawl4AIClient();
