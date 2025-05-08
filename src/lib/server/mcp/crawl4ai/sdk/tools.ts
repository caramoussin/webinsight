import { z } from 'zod';
import { Effect as E } from 'effect';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Crawl4AIServiceTag, Crawl4AIServiceLive } from '../service';

// Define the extract content tool for Crawl4AI
export const defineExtractContentTool = (server: McpServer) => {
  // Tool specification for extracting content from a URL
  const toolSpec = {
    name: 'extractContent',
    description: 'Extracts content from a given URL',
    paramSchema: {
      url: z.string().url(),
      options: z
        .object({
          mode: z.enum(['raw', 'markdown', 'text']).default('markdown'),
          includeMetadata: z.boolean().default(true)
        })
        .optional()
    },
    handler: async ({
      url,
      options
    }: {
      url: string;
      options?: { mode: 'raw' | 'markdown' | 'text'; includeMetadata: boolean };
    }) => {
      // Use the core service to extract content
      const result = await E.runPromise(
        E.gen(function* () {
          const service = yield* Crawl4AIServiceTag;
          return yield* service.extractContent({
            url
            // Use appropriate selectors based on the schema definition
          });
        }).pipe(E.provide(Crawl4AIServiceLive))
      );
      
      return {
        content: [{ 
          type: 'text', 
          text: options?.mode === 'raw' ? 
            result.content.html || result.content.raw_markdown : 
            result.content.markdown 
        }]
      };
    }
  };

  // Register tool with server (placeholder due to SDK export issue)
  // In a correct implementation, we would use server.tool() here
  if ('tool' in server) {
    // @ts-expect-error - Property 'tool' does not exist on type 'McpServer'
    server.tool(toolSpec.name, toolSpec.paramSchema, toolSpec.handler);
  } else {
    console.warn('MCP SDK does not support tool registration in this version');
  }

  return toolSpec;
};
