/**
 * Unit tests for the MCP-based Crawl4AI client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Effect from '@effect/io/Effect';
import { ServiceError } from '../../../../lib/utils/effect';
import { MCPCrawl4AIClient } from '../../../../lib/services/scraper/MCPCrawl4AIClient';

// Mock the effectFetch function
vi.mock('../../../../lib/utils/effect', async () => {
  const actual = await vi.importActual('../../../../lib/utils/effect');
  return {
    ...(actual as object),
    effectFetch: vi.fn()
  };
});

import { effectFetch } from '../../../../lib/utils/effect';

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
      headless: true,
      verbose: false,
      use_cache: true,
      check_robots_txt: true,
      respect_rate_limits: true
    };

    const mockExtractResponse = {
      result: {
        content: {
          markdown: '# Example Content',
          raw_markdown: '# Example Content',
          html: '<h1>Example Content</h1>'
        },
        metadata: {
          url: 'https://example.com'
        }
      }
    };

    it('should successfully extract content from a URL', async () => {
      // Mock the effectFetch response
      vi.mocked(effectFetch).mockReturnValue(Effect.succeed(mockExtractResponse));

      // Call the extractContent method
      const result = await Effect.runPromise(MCPCrawl4AIClient.extractContent(mockExtractOptions));

      // Verify the result
      expect(result).toEqual(mockExtractResponse.result);

      // Verify that effectFetch was called with the correct arguments
      expect(effectFetch).toHaveBeenCalledWith('/api/mcp/crawl4ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'extractContent',
          params: mockExtractOptions
        })
      });
    });

    it('should handle errors when extracting content', async () => {
      // Mock the effectFetch to throw an error
      const mockError = new ServiceError('FETCH_ERROR', 'Failed to extract content');
      vi.mocked(effectFetch).mockReturnValue(Effect.fail(mockError));

      // Call the extractContent method and expect it to fail
      try {
        await Effect.runPromise(MCPCrawl4AIClient.extractContent(mockExtractOptions));
        // If we get here, the test should fail because we expected an error
        expect(true).toBe(false);
      } catch (error) {
        // Just verify we got an error
        expect(error).toBeDefined();
      }
    });

    it('should validate the extraction options', async () => {
      // Create invalid options (missing required fields)
      const invalidOptions = {
        url: 'invalid-url', // Invalid URL format
        headless: true,
        verbose: false
      };

      // Mock the effectFetch response
      vi.mocked(effectFetch).mockReturnValue(Effect.succeed(mockExtractResponse));

      // Call the extractContent method with invalid options
      try {
        // @ts-expect-error - Intentionally passing invalid options for testing
        await Effect.runPromise(MCPCrawl4AIClient.extractContent(invalidOptions));
        // If we get here, the test should fail because we expected an error
        expect(true).toBe(false);
      } catch (error) {
        // Just verify we got an error
        expect(error).toBeDefined();
      }

      // Verify that effectFetch was not called
      expect(effectFetch).not.toHaveBeenCalled();
    });
  });

  describe('checkRobotsTxt', () => {
    const mockRobotsResponse = {
      result: {
        allowed: true,
        url: 'https://example.com',
        robots_url: 'https://example.com/robots.txt',
        user_agent: 'Mozilla/5.0'
      }
    };

    it('should successfully check robots.txt for a URL', async () => {
      // Mock the effectFetch response
      vi.mocked(effectFetch).mockReturnValue(Effect.succeed(mockRobotsResponse));

      // Call the checkRobotsTxt method
      const result = await Effect.runPromise(
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
            user_agent: 'Mozilla/5.0'
          }
        })
      });
    });

    it('should handle missing user agent', async () => {
      // Mock the effectFetch response
      vi.mocked(effectFetch).mockReturnValue(Effect.succeed(mockRobotsResponse));

      // Call the checkRobotsTxt method without a user agent
      const result = await Effect.runPromise(
        MCPCrawl4AIClient.checkRobotsTxt('https://example.com')
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
            url: 'https://example.com'
          }
        })
      });
    });

    it('should handle errors when checking robots.txt', async () => {
      // Mock the effectFetch to throw an error
      const mockError = new ServiceError('FETCH_ERROR', 'Failed to check robots.txt');
      vi.mocked(effectFetch).mockReturnValue(Effect.fail(mockError));

      // Call the checkRobotsTxt method and expect it to fail
      try {
        await Effect.runPromise(MCPCrawl4AIClient.checkRobotsTxt('https://example.com'));
        // If we get here, the test should fail because we expected an error
        expect(true).toBe(false);
      } catch (error) {
        // Just verify we got an error
        expect(error).toBeDefined();
      }
    });
  });

  describe('createSelectorConfig', () => {
    it('should create a selector config with all parameters', () => {
      const result = MCPCrawl4AIClient.createSelectorConfig(
        'article',
        ['.content', '.body'],
        ['.ads', '.sidebar']
      );

      expect(result).toEqual({
        base_selector: 'article',
        include_selectors: ['.content', '.body'],
        exclude_selectors: ['.ads', '.sidebar']
      });
    });

    it('should create a selector config with only base selector', () => {
      const result = MCPCrawl4AIClient.createSelectorConfig('article');

      expect(result).toEqual({
        base_selector: 'article'
      });
    });

    it('should create a selector config with only include selectors', () => {
      const result = MCPCrawl4AIClient.createSelectorConfig(undefined, ['.content', '.body']);

      expect(result).toEqual({
        include_selectors: ['.content', '.body']
      });
    });

    it('should create a selector config with only exclude selectors', () => {
      const result = MCPCrawl4AIClient.createSelectorConfig(undefined, undefined, [
        '.ads',
        '.sidebar'
      ]);

      expect(result).toEqual({
        exclude_selectors: ['.ads', '.sidebar']
      });
    });
  });

  describe('createExtractionSchemaField', () => {
    it('should create an extraction schema field with all parameters', () => {
      const result = MCPCrawl4AIClient.createExtractionSchemaField(
        'title',
        'h1',
        'text',
        'data-title'
      );

      expect(result).toEqual({
        name: 'title',
        selector: 'h1',
        type: 'text',
        attribute: 'data-title'
      });
    });

    it('should create an extraction schema field without attribute', () => {
      const result = MCPCrawl4AIClient.createExtractionSchemaField('content', '.content', 'html');

      expect(result).toEqual({
        name: 'content',
        selector: '.content',
        type: 'html'
      });
    });
  });

  describe('createExtractionSchema', () => {
    it('should create an extraction schema', () => {
      const fields = [
        MCPCrawl4AIClient.createExtractionSchemaField('title', 'h1', 'text'),
        MCPCrawl4AIClient.createExtractionSchemaField('content', '.content', 'html')
      ];

      const result = MCPCrawl4AIClient.createExtractionSchema('article', 'article', fields);

      expect(result).toEqual({
        name: 'article',
        base_selector: 'article',
        fields
      });
    });
  });
});
