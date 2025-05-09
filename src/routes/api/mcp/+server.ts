/**
 * MCP API Endpoints
 *
 * This file provides API endpoints for the Model Context Protocol (MCP) host,
 * allowing clients to discover and call MCP tools from various providers.
 *
 * This implementation uses both the custom WebInsight MCP host service and
 * the official MCP SDK server for standardized integration.
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { Effect as E, pipe, Option } from 'effect';
import { ServiceError } from '$lib/utils/effect';

import { MCPHostServiceLive, MCPServerLive } from '$lib/server/mcp/host';
import { Crawl4AIProvider } from '$lib/server/mcp/crawl4ai';

// Register the Crawl4AI provider with the MCP host
// This is done at server startup
E.runSync(MCPHostServiceLive.registerProvider(Crawl4AIProvider));

/**
 * GET /api/mcp
 *
 * List all available MCP tools from all providers
 */
export const GET: RequestHandler = async () => {
  const effect: E.Effect<Response, never> = pipe(
    E.all({
      tools: MCPHostServiceLive.listAllTools(),
      providers: MCPHostServiceLive.listProviders()
    }),
    E.map(({ tools, providers }) => json({ tools, providers })),
    E.catchAll((error) => {
      console.error('Error listing MCP tools/providers:', error);
      // Assume ServiceError might be thrown, otherwise default to 500
      const status = error instanceof ServiceError ? 400 : 500;
      const message = error instanceof Error ? error.message : 'Failed to list MCP resources';
      return E.succeed(json({ error: message }, { status }));
    })
  );

  return E.runPromise(effect);
};

/**
 * POST /api/mcp
 *
 * Call an MCP tool by name and provider
 *
 * This endpoint supports both:
 * 1. Legacy WebInsight MCP host service calls (when useSDK=false or not specified)
 * 2. Official MCP SDK server calls (when useSDK=true)
 */
export const POST: RequestHandler = async ({ request }) => {
  const effect: E.Effect<Response, ServiceError> = pipe(
    // 1. Parse request body
    E.tryPromise({
      try: () =>
        request.json() as Promise<{
          tool?: string;
          provider?: string;
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
    // 2. Process based on whether to use SDK or legacy format
    E.flatMap((body) => {
      // Check if using SDK format
      if (body.useSDK === true) {
        // SDK format uses the official MCP server
        try {
          // Handle the request using the MCP SDK server
          // @ts-expect-error - The McpServer type definition might be outdated
          const result = MCPServerLive.handleRequest({
            type: 'tool_call',
            tool_call: {
              name: body.name || body.tool, // Support both formats
              arguments: body.arguments || body.params || {}
            }
          });

          return E.succeed(json(result, { status: 200 }));
        } catch (error) {
          console.error('Error handling MCP SDK tool call:', error);
          const message = error instanceof Error ? error.message : 'An unexpected error occurred';
          return E.succeed(json({ error: message }, { status: 500 }));
        }
      } else {
        // Legacy format - validate required fields
        if (
          !body ||
          typeof body.tool !== 'string' ||
          body.tool.trim() === '' ||
          typeof body.provider !== 'string' ||
          body.provider.trim() === ''
        ) {
          return E.fail(
            new ServiceError({
              code: 'MISSING_TOOL_PROVIDER_FIELDS',
              message: 'Missing or invalid required fields: tool and provider'
            })
          );
        }

        // Use the legacy MCP Host service
        return pipe(
          MCPHostServiceLive.callTool(body.tool, body.provider, body.params || {}),
          E.map((result) => json({ result }, { status: 200 })),
          E.catchSome((error) => {
            if (error instanceof ServiceError) {
              console.error(`MCP Service Error (${error.code}):`, error.message, error.cause);
              // Determine status: 400 for client-like errors, 500 otherwise
              const status = [
                'MISSING_TOOL_PROVIDER_FIELDS',
                'REQUEST_PARSE_ERROR',
                'NOT_FOUND',
                'INVALID_PARAMETERS'
              ].includes(error.code)
                ? 400
                : 500;
              return Option.some(
                E.succeed(json({ error: error.message, code: error.code }, { status }))
              );
            }
            return Option.none();
          }),
          E.catchAll((error) => {
            console.error('Unexpected error calling MCP tool:', error);
            const message = error instanceof Error ? error.message : 'An unexpected error occurred';
            return E.succeed(
              json({ error: 'An unexpected error occurred', details: message }, { status: 500 })
            );
          })
        );
      }
    })
  );

  // Execute the effect and return the response
  return E.runPromise(effect);
};
