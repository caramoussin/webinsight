import { z } from 'zod';
import { Effect as E } from 'effect';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Crawl4AIServiceTag, Crawl4AIServiceLive } from '../service';

// This file defines the resource specification for Crawl4AI integration

// Define the check robots.txt resource for Crawl4AI
export const defineCheckRobotsTxtResource = (server: McpServer) => {
  // Resource specification for checking robots.txt allowance
  const resourceSpec = {
    name: 'checkRobotsTxt',
    description: 'Checks if a URL is allowed by robots.txt',
    uriTemplate: 'robots://{url}',
    paramSchema: {
      url: z.string().url()
    },
    handler: async (uri: string, params: { url: string }) => {
      // Use the core service to check robots.txt
      const result = await E.runPromise(
        E.gen(function* () {
          const service = yield* Crawl4AIServiceTag;
          return yield* service.checkRobotsTxt({
            url: params.url
          });
        }).pipe(E.provide(Crawl4AIServiceLive))
      );
      
      return {
        contents: [{
          uri,
          text: JSON.stringify({
            allowed: result.allowed,
            robots_url: result.robots_url,
            user_agent: result.user_agent,
            error: result.error
          }),
          metadata: { contentType: 'application/json' }
        }]
      };
    }
  };

  // Register resource with server (placeholder due to SDK export issue)
  // In a correct implementation, we would use server.resource() here
  if ('resource' in server) {
    // @ts-expect-error - Property 'resource' does not exist on type 'McpServer'
    server.resource(resourceSpec.name, resourceSpec.uriTemplate, resourceSpec.handler);
  } else {
    console.warn('MCP SDK does not support resource registration in this version');
  }

  return resourceSpec;
};
