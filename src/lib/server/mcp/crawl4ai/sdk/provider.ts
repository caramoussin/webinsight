import { Effect } from 'effect';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { defineExtractContentTool } from './tools';
import { defineCheckRobotsTxtResource } from './resources';

/**
 * Register Crawl4AI provider with the MCP server
 *
 * This function registers the Crawl4AI tools and resources with the MCP server,
 * using the core Crawl4AI service for implementation.
 *
 * @param server The MCP server instance
 * @returns An Effect that registers the provider and returns the server
 */
export const registerCrawl4AIProvider = (server: McpServer) => {
  return Effect.gen(function* (_) {
    // Ensure the Crawl4AI service is available
    yield* _(Effect.succeed('Using Crawl4AIServiceLive'));

    // Register tools
    yield* _(Effect.sync(() => defineExtractContentTool(server)));

    // Register resources
    yield* _(Effect.sync(() => defineCheckRobotsTxtResource(server)));

    return server;
  });
};
