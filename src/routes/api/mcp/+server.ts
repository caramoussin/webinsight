/**
 * MCP API Endpoints
 *
 * This file provides API endpoints for the Model Context Protocol (MCP) host,
 * allowing clients to discover and call MCP tools from various providers.
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import * as Effect from '@effect/io/Effect';

import { MCPHostServiceLive } from '$lib/server/mcp/host';
import { Crawl4AIProvider } from '$lib/server/mcp/crawl4ai';

// Register the Crawl4AI provider with the MCP host
// This is done at server startup
Effect.runSync(MCPHostServiceLive.registerProvider(Crawl4AIProvider));

/**
 * GET /api/mcp
 *
 * List all available MCP tools from all providers
 */
export const GET: RequestHandler = async () => {
  const tools = await Effect.runPromise(MCPHostServiceLive.listAllTools());

  return json({
    tools,
    providers: await Effect.runPromise(MCPHostServiceLive.listProviders())
  });
};

/**
 * POST /api/mcp
 *
 * Call an MCP tool by name and provider
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { tool, provider, params } = body;

    if (!tool || !provider) {
      return json({ error: 'Missing required fields: tool and provider' }, { status: 400 });
    }

    const result = await Effect.runPromise(
      MCPHostServiceLive.callTool(tool, provider, params || {})
    );

    return json({ result });
  } catch (error) {
    console.error('Error calling MCP tool:', error);

    return json(
      {
        error: 'Failed to call MCP tool',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
};
