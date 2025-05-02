/**
 * MCP API Endpoints
 *
 * This file provides API endpoints for the Model Context Protocol (MCP) host,
 * allowing clients to discover and call MCP tools from various providers.
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { Effect as E, pipe, Option } from 'effect';
import { ServiceError } from '$lib/utils/effect';

import { MCPHostServiceLive } from '$lib/server/mcp/host';
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
 */
export const POST: RequestHandler = async ({ request }) => {
  const effect: E.Effect<Response, never> = pipe(
    // 1. Parse request body
    E.tryPromise({
      try: () => request.json() as Promise<{ tool?: string; provider?: string; params?: unknown }>,
      catch: (unknown) => new ServiceError({ code: 'REQUEST_PARSE_ERROR', message: 'Failed to parse request body', cause: unknown })
    }),
    // 2. Validate required fields
    E.flatMap((body) => {
      if (!body || typeof body.tool !== 'string' || body.tool.trim() === '' || typeof body.provider !== 'string' || body.provider.trim() === '') {
        return E.fail(new ServiceError({ code: 'MISSING_TOOL_PROVIDER_FIELDS', message: 'Missing or invalid required fields: tool and provider' }));
      }
      return E.succeed({ tool: body.tool, provider: body.provider, params: body.params || {} });
    }),
    // 3. Call the MCP Host service tool
    E.flatMap(({ tool, provider, params }) => MCPHostServiceLive.callTool(tool, provider, params)),
    // 4. Map success to JSON response
    E.map((result) => json({ result }, { status: 200 })),
    // 5. Catch ServiceErrors (including specific MCP errors like NOT_FOUND, PROVIDER_ERROR)
    E.catchSome((error) => {
      if (error instanceof ServiceError) {
        console.error(`MCP Service Error (${error.code}):`, error.message, error.cause);
        // Determine status: 400 for client-like errors, 500 otherwise
        const status = ['MISSING_TOOL_PROVIDER_FIELDS', 'REQUEST_PARSE_ERROR', 'NOT_FOUND', 'INVALID_PARAMETERS'].includes(error.code)
          ? 400
          : 500;
        return Option.some(E.succeed(json({ error: error.message, code: error.code }, { status })));
      }
      return Option.none();
    }),
    // 6. Catch any unexpected errors
    E.catchAll((error) => {
      console.error('Unexpected error calling MCP tool:', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      return E.succeed(json({ error: 'An unexpected error occurred', details: message }, { status: 500 }));
    })
  );

  // Execute the effect and return the response
  return E.runPromise(effect);
};
