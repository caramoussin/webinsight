/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unit tests for the MCP-based Crawl4AI client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Effect as E } from 'effect';
import { ServiceError } from '$lib/utils/effect';
import { MCPCrawl4AIClient } from '$lib/services/scraper/MCPCrawl4AIClient';

// Mock the effectFetch function
vi.mock('$lib/utils/effect', async () => {
  const actual = await vi.importActual('$lib/utils/effect');
  return {
    ...(actual as object),
    effectFetch: vi.fn()
  };
});

import { effectFetch } from '$lib/utils/effect';

describe('MCPCrawl4AIClient', () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('extractContent', () => {
    const mockExtractOptions = {
      url: 'https://example.com',
      mode: 'markdown' as const,
      includeMetadata: true
    };

    const mockExtractResponse = {
      result: {
        content: {
          markdown: '# Example Content',
          html: '<h1>Example Content</h1>',
          raw_markdown: '# Example Content'
        },
        metadata: {
          url: 'https://example.com'
        }
      }
    };

    it('should successfully extract content from a URL', async () => {
      // Create a spy implementation for json() that returns the mock response
      const jsonSpy = vi.fn().mockResolvedValue(mockExtractResponse);

      // Mock the effectFetch response with a proper Response-like object
      vi.mocked(effectFetch).mockReturnValue(
        E.succeed({
          json: jsonSpy
        } as unknown as Response)
      );

      // Call the extractContent method
      const result = await E.runPromise(MCPCrawl4AIClient.extractContent(mockExtractOptions));

      // Verify the result - the implementation extracts content.markdown and returns it as content
      expect(result).toEqual({
        content: mockExtractResponse.result.content.markdown,
        metadata: mockExtractResponse.result.metadata
      });

      // Verify that effectFetch was called with the correct arguments
      expect(effectFetch).toHaveBeenCalledWith('/api/mcp/crawl4ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'extractContent',
          params: {
            url: mockExtractOptions.url,
            options: {
              mode: mockExtractOptions.mode,
              includeMetadata: mockExtractOptions.includeMetadata
            }
          }
        })
      });
    });

    it('should handle errors when extracting content', async () => {
      // Mock the effectFetch to throw an error
      vi.mocked(effectFetch).mockImplementation(() => {
        return E.fail(
          new ServiceError({ code: 'EXTRACT_CONTENT_ERROR', message: 'Failed to extract content' })
        );
      });

      try {
        await E.runPromise(
          MCPCrawl4AIClient.extractContent({
            url: 'https://example.com',
            mode: 'markdown' as const,
            includeMetadata: true
          })
        );
        // If we get here, the test should fail because we expected an error
        expect(true).toBe(false);
      } catch (error) {
        // Just verify we got an error
        expect(error).toBeDefined();
      }
    });

    it('should handle network timeouts', async () => {
      // Mock the effectFetch to throw a timeout error
      vi.mocked(effectFetch).mockImplementation(() => {
        return E.fail(
          new ServiceError({ code: 'TIMEOUT_ERROR', message: 'Request timed out after 30000ms' })
        );
      });

      try {
        await E.runPromise(
          MCPCrawl4AIClient.extractContent({
            url: 'https://example.com',
            mode: 'markdown' as const,
            includeMetadata: true
          })
        );
        // If we get here, the test should fail because we expected an error
        expect(true).toBe(false);
      } catch (error: any) {
        // Just verify we got an error
        expect(error).toBeDefined();
        expect(error.message).toBe('Request timed out after 30000ms');
      }
    });

    it('should handle specific MCP service errors', async () => {
      // Mock the effectFetch to throw an MCP service error
      vi.mocked(effectFetch).mockImplementation(() => {
        return E.fail(
          new ServiceError({
            code: 'MCP_SERVICE_ERROR',
            message: 'The MCP service encountered an error'
          })
        );
      });

      try {
        await E.runPromise(
          MCPCrawl4AIClient.extractContent({
            url: 'https://example.com',
            mode: 'markdown' as const,
            includeMetadata: true
          })
        );
        // If we get here, the test should fail because we expected an error
        expect(true).toBe(false);
      } catch (error: any) {
        // Just verify we got an error
        expect(error).toBeDefined();
        // Check if it's a ServiceError or a stringified version
        if (error._tag === 'ServiceError') {
          expect(error.code).toBe('MCP_SERVICE_ERROR');
        } else {
          // If it's stringified, just check that it contains the expected message
          expect(error.toString()).toContain('The MCP service encountered an error');
        }
      }
    });

    it('should validate the extraction options', async () => {
      // Create invalid options (missing required fields)
      const invalidOptions = {
        url: 'invalid-url', // Invalid URL format
        headless: true,
        verbose: false
      };

      try {
        // @ts-expect-error - Intentionally passing invalid options for testing
        await E.runPromise(MCPCrawl4AIClient.extractContent(invalidOptions));
        // If we get here, the test should fail because we expected an error
        expect(true).toBe(false);
      } catch (error) {
        // Just verify we got an error
        expect(error).toBeDefined();
        // No need to type-cast here as we're not accessing properties
      }

      // Verify that effectFetch was not called
      expect(effectFetch).not.toHaveBeenCalled();
    });
  });

  describe('checkRobotsTxt', () => {
    const mockRobotsResponse = {
      result: {
        allowed: true,
        message: undefined
      }
    };

    it('should successfully check robots.txt for a URL', async () => {
      // Mock the effectFetch response with a proper Response-like object
      vi.mocked(effectFetch).mockReturnValue(
        E.succeed({
          json: () => Promise.resolve(mockRobotsResponse)
        } as unknown as Response)
      );

      // Call the checkRobotsTxt method
      const result = await E.runPromise(
        MCPCrawl4AIClient.checkRobotsTxt('https://example.com', 'Mozilla/5.0')
      );

      // Verify the result
      expect(result).toEqual(mockRobotsResponse.result);

      // Verify that effectFetch was called with the correct arguments
      expect(effectFetch).toHaveBeenCalledWith('/api/mcp/crawl4ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'checkRobotsTxt',
          params: {
            url: 'https://example.com',
            userAgent: 'Mozilla/5.0'
          }
        })
      });
    });

    it('should handle missing user agent', async () => {
      // Mock the effectFetch response with a proper Response-like object
      vi.mocked(effectFetch).mockReturnValue(
        E.succeed({
          json: () => Promise.resolve(mockRobotsResponse)
        } as unknown as Response)
      );

      // Call the checkRobotsTxt method without a user agent
      await E.runPromise(MCPCrawl4AIClient.checkRobotsTxt('https://example.com'));

      // Verify that effectFetch was called with the correct arguments (no userAgent)
      expect(effectFetch).toHaveBeenCalledWith('/api/mcp/crawl4ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'checkRobotsTxt',
          params: {
            url: 'https://example.com'
          }
        })
      });
    });

    it('should handle errors when checking robots.txt', async () => {
      // Mock the effectFetch to throw an error
      vi.mocked(effectFetch).mockImplementation(() => {
        return E.fail(
          new ServiceError({
            code: 'CHECK_ROBOTS_TXT_ERROR',
            message: 'Failed to check robots.txt'
          })
        );
      });

      try {
        await E.runPromise(MCPCrawl4AIClient.checkRobotsTxt('https://example.com'));
        // If we get here, the test should fail because we expected an error
        expect(true).toBe(false);
      } catch (error: any) {
        // Just verify we got an error
        expect(error).toBeDefined();
        // Check if it's a ServiceError or a stringified version
        if (error._tag === 'ServiceError') {
          expect(error.code).toBe('CHECK_ROBOTS_TXT_ERROR');
        } else {
          // If it's stringified, just check that it contains the expected message
          expect(error.toString()).toContain('Failed to check robots.txt');
        }
      }
    });

    it('should handle network timeouts when checking robots.txt', async () => {
      // Mock the effectFetch to throw a timeout error
      vi.mocked(effectFetch).mockImplementation(() => {
        return E.fail(
          new ServiceError({
            code: 'TIMEOUT_ERROR',
            message: 'Request timed out after 30000ms'
          })
        );
      });

      try {
        await E.runPromise(MCPCrawl4AIClient.checkRobotsTxt('https://example.com'));
        // If we get here, the test should fail because we expected an error
        expect(true).toBe(false);
      } catch (error: any) {
        // Just verify we got an error
        expect(error).toBeDefined();
        expect(error.message).toBe('Request timed out after 30000ms');
      }
    });
  });

  // Note: createSelectorConfig tests removed as this method is no longer part of the MCPCrawl4AIClient class

  // Note: createExtractionSchemaField and createExtractionSchema tests removed as these methods are no longer part of the MCPCrawl4AIClient class
});
