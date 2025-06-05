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
import { ServiceError, effectFetch } from '$lib/utils/effect';
import type { CheckRobotsTxtOutput, ExtractContentOutput } from '$lib/server/mcp/crawl4ai/schemas';

// Define content-type headers for API requests
const JSON_HEADERS = {
  'Content-Type': 'application/json'
} as const;

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
  // Use the Crawl4AI-specific MCP API route
  private static readonly MCP_API_URL = '/api/mcp/crawl4ai';

  // No constructor needed as we're using static methods with Effect TS patterns

  /**
   * Extract content from a URL using Crawl4AI via MCP API route
   *
   * This method calls the Crawl4AI-specific MCP API route, which interfaces with the MCP host
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

      // Call the MCP API route
      Effect.flatMap((validOptions) =>
        effectFetch(MCPCrawl4AIClient.MCP_API_URL, {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify({
            tool: 'extractContent',
            params: {
              url: validOptions.url,
              options: {
                mode: validOptions.mode,
                includeMetadata: validOptions.includeMetadata
              }
            }
          })
        })
      ),

      // Parse the response
      Effect.flatMap((response) =>
        Effect.tryPromise({
          try: () => (response as Response).json(),
          catch: (error) =>
            new ServiceError({
              code: 'RESPONSE_PARSE_ERROR',
              message: 'Failed to parse API response',
              cause: error
            })
        })
      ),

      // Extract the result from the response
      Effect.flatMap((data: { result?: ExtractContentOutput; error?: string }) => {
        if (data.error) {
          return Effect.fail(
            new ServiceError({
              code: 'API_ERROR',
              message: data.error
            })
          );
        }

        if (!data.result) {
          return Effect.fail(
            new ServiceError({
              code: 'MISSING_RESULT',
              message: 'API response missing result field'
            })
          );
        }

        // Extract content and metadata from the result
        const content = data.result.content.markdown || '';
        const metadata = data.result.metadata || {};

        // Return the extraction response
        return Effect.succeed({
          content,
          metadata
        });
      })
    );
  }

  /**
   * Check if a URL is allowed by robots.txt using Crawl4AI via MCP API route
   *
   * This method calls the Crawl4AI-specific MCP API route, which interfaces with the MCP host
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
      // Validate URL with Effect Schema
      S.decode(S.String.pipe(S.pattern(/^https?:\/\/.+/)))(url),
      Effect.mapError(
        (error) =>
          new ServiceError({
            code: 'INVALID_URL',
            message: 'Invalid URL format',
            cause: error
          })
      ),

      // Call the MCP API route
      Effect.flatMap((validUrl) =>
        effectFetch(MCPCrawl4AIClient.MCP_API_URL, {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify({
            tool: 'checkRobotsTxt',
            params: {
              url: validUrl,
              userAgent: userAgent
            }
          })
        })
      ),

      // Parse the response
      Effect.flatMap((response) =>
        Effect.tryPromise({
          try: () =>
            (response as Response).json() as Promise<{
              result?: CheckRobotsTxtOutput;
              error?: string;
            }>,
          catch: (error) =>
            new ServiceError({
              code: 'RESPONSE_PARSE_ERROR',
              message: 'Failed to parse API response',
              cause: error
            })
        })
      ),

      // Extract the result from the response
      Effect.flatMap((data: { result?: CheckRobotsTxtOutput; error?: string }) => {
        if (data.error) {
          return Effect.fail(
            new ServiceError({
              code: 'API_ERROR',
              message: data.error
            })
          );
        }

        if (!data.result) {
          return Effect.fail(
            new ServiceError({
              code: 'MISSING_RESULT',
              message: 'API response missing result field'
            })
          );
        }

        // Return the robots check response
        return Effect.succeed({
          allowed: data.result.allowed,
          message: data.result.error
        });
      })
    );
  }

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
}

export const createMCPCrawl4AIClient = () => new MCPCrawl4AIClient();
