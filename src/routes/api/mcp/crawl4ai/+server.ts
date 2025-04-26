/**
 * Crawl4AI MCP API Endpoints
 *
 * This file provides dedicated API endpoints for the Crawl4AI MCP provider,
 * allowing direct access to web content extraction capabilities.
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import * as Effect from '@effect/io/Effect';

import { Crawl4AIProvider } from '$lib/server/mcp/crawl4ai';

/**
 * GET /api/mcp/crawl4ai
 *
 * List all available tools from the Crawl4AI provider
 */
export const GET: RequestHandler = async () => {
  const tools = await Effect.runPromise(Crawl4AIProvider.listTools());

  return json({ tools });
};

/**
 * POST /api/mcp/crawl4ai
 *
 * Call a Crawl4AI tool directly
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { tool, params } = body;

    if (!tool) {
      return json({ error: 'Missing required field: tool' }, { status: 400 });
    }

    const result = await Effect.runPromise(Crawl4AIProvider.callTool(tool, params || {}));

    return json({ result }, { status: 200 });
  } catch (error) {
    console.error('Error calling Crawl4AI tool:', error);

    return json(
      {
        error: 'Failed to call Crawl4AI tool',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
};
