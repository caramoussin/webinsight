/**
 * Integration tests for the MCP Host with the Crawl4AI provider
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as Effect from '@effect/io/Effect';
import { Server } from 'http';
import express from 'express';

import { MCPHostService, makeMCPHostService } from '../../../../lib/server/mcp/host';
import { createCrawl4AIProvider } from '../../../../lib/server/mcp/crawl4ai/provider';
import * as Schemas from '../../../../lib/server/mcp/crawl4ai/schemas';
import * as Errors from '../../../../lib/server/mcp/crawl4ai/errors';

describe('MCP Host Integration', () => {
  let mockServer: Server;
  let host: MCPHostService;
  const mockServerPort = 3001;

  // Set up a mock Crawl4AI server and MCP host with the Crawl4AI provider
  beforeAll(async () => {
    // Create a mock Crawl4AI server
    const app = express();

    // Mock the extract content endpoint
    app.post('/extract', (req, res) => {
      res.json({
        content: {
          markdown: '# Mock Content',
          raw_markdown: '# Mock Content',
          html: '<h1>Mock Content</h1>'
        },
        metadata: {
          url: 'https://example.com'
        }
      });
    });

    // Mock the robots.txt check endpoint
    app.post('/robots', (req, res) => {
      res.json({
        allowed: true,
        url: 'https://example.com',
        robots_url: 'https://example.com/robots.txt',
        user_agent: 'Mozilla/5.0'
      });
    });

    // Start the mock server
    mockServer = app.listen(mockServerPort);

    // Create the MCP host
    host = makeMCPHostService();

    // Create and register the Crawl4AI provider
    // Create a custom Crawl4AI service that uses our mock server URL
    const mockService = {
      // Direct implementation of extractContent
      extractContent: (params: Schemas.ExtractContentInput) => {
        return Effect.succeed({
          content: {
            markdown: '# Mock Content',
            raw_markdown: '# Mock Content',
            html: '<h1>Mock Content</h1>'
          },
          metadata: {
            url: params.url || 'https://example.com'
          }
        }) as Effect.Effect<never, Errors.Crawl4AIMCPError, Schemas.ExtractContentOutput>;
      },

      // Direct implementation of checkRobotsTxt
      checkRobotsTxt: (params: Schemas.CheckRobotsTxtInput) => {
        return Effect.succeed({
          allowed: true,
          url: params.url || 'https://example.com',
          robots_url: 'https://example.com/robots.txt',
          user_agent: params.user_agent || 'Mozilla/5.0'
        }) as Effect.Effect<never, Errors.Crawl4AIMCPError, Schemas.CheckRobotsTxtOutput>;
      },

      // List available tools
      listTools: () => {
        // Create a properly typed array of tools
        const tools = [
          {
            name: 'extractContent' as const,
            description: 'Extract content from a URL',
            parameters: { url: 'string' }
          },
          {
            name: 'checkRobotsTxt' as const,
            description: 'Check if a URL is allowed by robots.txt',
            parameters: { url: 'string', user_agent: 'string' }
          }
        ];

        // Cast to the expected return type
        // Using inline type definition instead of Tool type
        return Effect.succeed(tools) as unknown as Effect.Effect<
          never,
          Errors.Crawl4AIMCPError,
          Array<
            | {
                name: 'extractContent';
                description: string;
                parameters: Schemas.ExtractContentInput;
              }
            | {
                name: 'checkRobotsTxt';
                description: string;
                parameters: Schemas.CheckRobotsTxtInput;
              }
          >
        >;
      },

      // Generic tool caller
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      callTool: <N extends string, P, R>(name: N, params: P) => {
        // Use the mock server URL for API calls
        if (name === 'extractContent') {
          // For extractContent, return the mock content response with a result wrapper
          const response = {
            result: {
              content: {
                markdown: '# Mock Content',
                raw_markdown: '# Mock Content',
                html: '<h1>Mock Content</h1>'
              },
              metadata: {
                url: 'https://example.com'
              }
            }
          };
          return Effect.succeed(response) as unknown as Effect.Effect<
            never,
            Errors.Crawl4AIMCPError,
            R
          >;
        } else if (name === 'checkRobotsTxt') {
          // For checkRobotsTxt, return the mock robots.txt response with a result wrapper
          const response = {
            result: {
              allowed: true,
              url: 'https://example.com',
              robots_url: 'https://example.com/robots.txt',
              user_agent: 'Mozilla/5.0'
            }
          };
          return Effect.succeed(response) as unknown as Effect.Effect<
            never,
            Errors.Crawl4AIMCPError,
            R
          >;
        } else {
          return Effect.fail(
            new Errors.Crawl4AIMCPError('TOOL_NOT_FOUND', `Tool ${name} not found`)
          );
        }
      }
    };

    const provider = createCrawl4AIProvider(mockService);
    await Effect.runPromise(host.registerProvider(provider));
  });

  afterAll(() => {
    // Close the mock server
    mockServer.close();
  });

  describe('Provider Registration', () => {
    it('should register the Crawl4AI provider', async () => {
      const providers = await Effect.runPromise(host.listProviders());
      expect(providers).toContain('crawl4ai');
    });

    it('should list tools from the Crawl4AI provider', async () => {
      const tools = await Effect.runPromise(host.listProviderTools('crawl4ai'));
      expect(tools.length).toBe(2);

      // Type assertion for tools
      const toolNames = tools.map((t: { name: string }) => t.name);
      expect(toolNames).toContain('extractContent');
      expect(toolNames).toContain('checkRobotsTxt');
    });
  });

  describe('Tool Execution', () => {
    it('should call the extractContent tool', async () => {
      const result = await Effect.runPromise(
        host.callTool('extractContent', 'crawl4ai', {
          url: 'https://example.com',
          headless: true,
          verbose: false,
          use_cache: true,
          check_robots_txt: true,
          respect_rate_limits: true
        })
      );

      expect(result).toBeDefined();
      // Type assertion to access result properties safely
      const typedResult = result as { result: { content: { markdown: string }; metadata: object } };
      expect(typedResult.result).toHaveProperty('content');
      expect(typedResult.result).toHaveProperty('metadata');
      expect(typedResult.result.content).toHaveProperty('markdown', '# Mock Content');
    });

    it('should call the checkRobotsTxt tool', async () => {
      const result = await Effect.runPromise(
        host.callTool('checkRobotsTxt', 'crawl4ai', {
          url: 'https://example.com',
          user_agent: 'Mozilla/5.0'
        })
      );

      expect(result).toBeDefined();
      // Type assertion to access result properties safely
      const typedResult = result as { result: { allowed: boolean; url: string } };
      expect(typedResult.result).toHaveProperty('allowed', true);
      expect(typedResult.result).toHaveProperty('url', 'https://example.com');
    });

    it('should call tools across providers', async () => {
      const result = await Effect.runPromise(
        host.callToolAcrossProviders('extractContent', {
          url: 'https://example.com',
          headless: true,
          verbose: false,
          use_cache: true,
          check_robots_txt: true,
          respect_rate_limits: true
        })
      );

      expect(result).toBeDefined();
      // Type assertion to access result properties safely
      const typedResult = result as { result: { content: { markdown: string } } };
      expect(typedResult.result).toHaveProperty('content');
      expect(typedResult.result.content).toHaveProperty('markdown', '# Mock Content');
    });
  });
});
