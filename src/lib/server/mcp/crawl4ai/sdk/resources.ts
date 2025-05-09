import { Effect as E } from 'effect';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Crawl4AIServiceTag, Crawl4AIServiceLive } from '../service';

/**
 * Define the check robots.txt resource for Crawl4AI
 *
 * This registers the checkRobotsTxt resource with the MCP server using the official SDK.
 * The resource checks if a URL is allowed by the site's robots.txt file.
 *
 * @param server The MCP server instance to register the resource with
 * @returns A boolean indicating whether the registration was successful
 */
export const defineCheckRobotsTxtResource = (server: McpServer) => {
  try {
    // Register the resource with the MCP server using the correct API format
    server.resource(
      'checkRobotsTxt',
      'robots://{url}',
      {
        description: 'Checks if a URL is allowed by robots.txt'
      },
      async (uri) => {
        // Extract the URL from the URI
        const urlMatch = uri.href.match(/robots:\/\/(.+)/);
        const url = urlMatch ? urlMatch[1] : '';
        
        // Use the core service to check robots.txt
        const result = await E.runPromise(
          E.gen(function* () {
            const service = yield* Crawl4AIServiceTag;
            return yield* service.checkRobotsTxt({
              url: url
            });
          }).pipe(E.provide(Crawl4AIServiceLive))
        );

        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify({
                allowed: result.allowed,
                robots_url: result.robots_url,
                user_agent: result.user_agent,
                error: result.error
              }),
              metadata: { contentType: 'application/json' }
            }
          ]
        };
      }
    );

    console.log('Successfully registered checkRobotsTxt resource with MCP server');
    return true;
  } catch (error) {
    console.error('Failed to register checkRobotsTxt resource with MCP server:', error);
    return false;
  }
};
