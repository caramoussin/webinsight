/**
 * Crawl4AI MCP API Endpoints
 *
 * This file provides dedicated API endpoints for the Crawl4AI MCP provider,
 * allowing direct access to web content extraction capabilities.
 *
 * This implementation supports both direct provider calls and SDK-based calls
 * for official MCP connections using the centralized MCP host service.
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { Effect as E, pipe, Option } from 'effect';
import { ServiceError } from '$lib/utils/effect';

import { Crawl4AIProvider } from '$lib/server/mcp/crawl4ai';
import { Crawl4AIMCPError } from '$lib/server/mcp/crawl4ai/errors';
import { MCPHostServiceLive } from '$lib/server/mcp/host';

/**
 * GET /api/mcp/crawl4ai
 *
 * List all available tools from the Crawl4AI provider
 */
export const GET: RequestHandler = async () => {
  const result = await pipe(
    Crawl4AIProvider.listTools(),
    E.map((tools) => json({ tools })),
    E.catchAll((error) => {
      console.error('Error listing Crawl4AI tools:', error);
      const status =
        error instanceof ServiceError && error.code.startsWith('CRAWL4AI_MCP_') ? 400 : 500;
      return E.succeed(
        json({ error: 'Failed to list Crawl4AI tools', details: error.message }, { status })
      );
    }),
    E.runPromise
  );
  return result;
};

/**
 * POST /api/mcp/crawl4ai
 *
 * Call a Crawl4AI tool directly
 *
 * This endpoint supports both:
 * 1. Direct provider calls (when useSDK=false or not specified)
 * 2. Official MCP SDK server calls (when useSDK=true)
 */
export const POST: RequestHandler = async ({ request }) => {
  const effect: E.Effect<Response, ServiceError> = pipe(
    // 1. Try to parse the request body
    E.tryPromise({
      try: () =>
        request.json() as Promise<{
          tool?: string;
          params?: unknown;
          useSDK?: boolean;
          name?: string; // For SDK format
          arguments?: unknown; // For SDK format
        }>,
      catch: (unknown) =>
        new ServiceError({
          code: 'REQUEST_PARSE_ERROR',
          message: 'Failed to parse request body',
          cause: unknown
        })
    }),
    // 2. Validate and process the request
    E.flatMap((body) => {
      // If using SDK format, use the centralized MCP host service
      if (body.useSDK === true) {
        const toolName = body.name || body.tool; // Support both formats
        const toolArgs = body.arguments || body.params || {};

        if (!toolName) {
          return E.fail(
            new ServiceError({
              code: 'MISSING_TOOL_FIELD',
              message: 'Missing or invalid required field: name or tool'
            })
          );
        }

        // Use the MCPHostServiceLive to process the tool call
        return pipe(
          MCPHostServiceLive.callToolAcrossProviders(toolName, toolArgs),
          E.map((result) => json({ result }, { status: 200 }))
        );
      }

      // For direct provider calls, validate the tool field
      if (!body || typeof body.tool !== 'string' || body.tool.trim() === '') {
        return E.fail(
          new ServiceError({
            code: 'MISSING_TOOL_FIELD',
            message: 'Missing or invalid required field: tool'
          })
        );
      }

      // Use the direct provider call
      return pipe(
        Crawl4AIProvider.callTool(body.tool, (body.params as Record<string, unknown>) || {}),
        E.map((result) => json({ result }, { status: 200 }))
      );
    }),
    // 3. Catch specific Crawl4AI errors and map to 400/500 responses
    E.catchSome((error) => {
      if (error instanceof Crawl4AIMCPError) {
        console.error(`Crawl4AI MCP Error (${error.code}):`, error.message, error.cause);
        const status =
          error.code === 'CRAWL4AI_MCP_NOT_FOUND' ||
          error.code === 'CRAWL4AI_MCP_INVALID_PARAMETERS'
            ? 400
            : 500;
        return Option.some(E.succeed(json({ error: error.message, code: error.code }, { status })));
      }
      return Option.none(); // Let other errors fall through
    }),
    // 4. Catch any remaining ServiceErrors (like parsing or missing field)
    E.catchSome((error) => {
      if (error instanceof ServiceError) {
        console.error(`Service Error (${error.code}):`, error.message, error.cause);
        const status =
          error.code === 'MISSING_TOOL_FIELD' || error.code === 'REQUEST_PARSE_ERROR' ? 400 : 500;
        return Option.some(E.succeed(json({ error: error.message, code: error.code }, { status })));
      }
      return Option.none(); // Let other errors fall through
    }),
    // 5. Catch any unexpected errors
    E.catchAll((error) => {
      console.error('Unexpected error calling Crawl4AI tool:', error);
      const message = error instanceof Error ? error.message : String(error);
      return E.succeed(
        json({ error: 'An unexpected error occurred', details: message }, { status: 500 })
      );
    })
  );

  // Execute the effect and return the response
  return E.runPromise(effect);
};
