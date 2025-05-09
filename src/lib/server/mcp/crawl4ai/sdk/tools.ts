import { Effect as E } from 'effect';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Crawl4AIServiceTag, Crawl4AIServiceLive } from '../service';

/**
 * Define the extract content tool for Crawl4AI
 *
 * This registers the extractContent tool with the MCP server using the official SDK.
 * The tool extracts content from a given URL and returns it in the requested format.
 *
 * @param server The MCP server instance to register the tool with
 * @returns A boolean indicating whether the registration was successful
 */
export const defineExtractContentTool = (server: McpServer) => {
  try {
    // Register the tool with the MCP server using the correct API format
    server.tool(
      'extractContent',
      'Extracts content from a given URL and returns it in the requested format',
      {
        url: z.string().url(),
        options: z.object({
          mode: z.enum(['raw', 'markdown', 'text']).default('markdown'),
          includeMetadata: z.boolean().default(true)
        }).optional()
      },
      async (args) => {
        const { url, options } = args;

        // Use the core service to extract content
        const result = await E.runPromise(
          E.gen(function* () {
            const service = yield* Crawl4AIServiceTag;
            return yield* service.extractContent({ url });
          }).pipe(E.provide(Crawl4AIServiceLive))
        );

        // Format the response according to the MCP standard
        return {
          content: [
            {
              type: 'text',
              text:
                options?.mode === 'raw'
                  ? result.content.html || result.content.raw_markdown
                  : result.content.markdown
            }
          ],
          // Include metadata if requested
          ...(options?.includeMetadata && {
            metadata: {
              // Include only available metadata fields
              ...(result.metadata || {})
            }
          })
        };
      }
    );

    console.log('Successfully registered extractContent tool with MCP server');
    return true;
  } catch (error) {
    console.error('Failed to register extractContent tool with MCP server:', error);
    return false;
  }
};
