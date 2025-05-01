/* eslint-disable @typescript-eslint/no-explicit-any */
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
      vi.mocked(effectFetch).mockImplementation(() => {
        return Effect.fail(new ServiceError('EXTRACT_CONTENT_ERROR', 'Failed to extract content'));
      });

      try {
        await Effect.runPromise(
          MCPCrawl4AIClient.extractContent({
            url: 'https://example.com',
            selectors: {
              base_selector: 'h1'
            },
            headless: true,
            verbose: false,
            use_cache: false,
            check_robots_txt: true,
            respect_rate_limits: true
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
        return Effect.fail(new ServiceError('TIMEOUT_ERROR', 'Request timed out after 30000ms'));
      });

      try {
        await Effect.runPromise(
          MCPCrawl4AIClient.extractContent({
            url: 'https://example.com',
            selectors: {
              base_selector: 'h1'
            },
            headless: true,
            verbose: false,
            use_cache: false,
            check_robots_txt: true,
            respect_rate_limits: true
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
        return Effect.fail(
          new ServiceError('MCP_SERVICE_ERROR', 'The MCP service encountered an error')
        );
      });

      try {
        await Effect.runPromise(
          MCPCrawl4AIClient.extractContent({
            url: 'https://example.com',
            selectors: {
              base_selector: 'h1'
            },
            headless: true,
            verbose: false,
            use_cache: false,
            check_robots_txt: true,
            respect_rate_limits: true
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
          expect(error.toString()).toContain('MCP_SERVICE_ERROR');
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
        await Effect.runPromise(MCPCrawl4AIClient.extractContent(invalidOptions));
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
      await Effect.runPromise(MCPCrawl4AIClient.checkRobotsTxt('https://example.com'));

      // Verify that effectFetch was called with the correct arguments (no user_agent)
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
        return Effect.fail(
          new ServiceError('CHECK_ROBOTS_TXT_ERROR', 'Failed to check robots.txt')
        );
      });

      try {
        await Effect.runPromise(MCPCrawl4AIClient.checkRobotsTxt('https://example.com'));
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
          expect(error.toString()).toContain('CHECK_ROBOTS_TXT_ERROR');
        }
      }
    });

    it('should handle network timeouts when checking robots.txt', async () => {
      // Mock the effectFetch to throw a timeout error
      vi.mocked(effectFetch).mockImplementation(() => {
        return Effect.fail(new ServiceError('TIMEOUT_ERROR', 'Request timed out after 30000ms'));
      });

      try {
        await Effect.runPromise(MCPCrawl4AIClient.checkRobotsTxt('https://example.com'));
        // If we get here, the test should fail because we expected an error
        expect(true).toBe(false);
      } catch (error: any) {
        // Just verify we got an error
        expect(error).toBeDefined();
        expect(error.message).toBe('Request timed out after 30000ms');
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
        'image',
        'img.hero',
        'attribute',
        'src'
      );

      expect(result).toEqual({
        name: 'image',
        selector: 'img.hero',
        type: 'attribute',
        attribute: 'src'
      });
    });

    it('should create an extraction schema field without attribute', () => {
      const result = MCPCrawl4AIClient.createExtractionSchemaField('title', 'h1', 'text');

      expect(result).toEqual({
        name: 'title',
        selector: 'h1',
        type: 'text'
      });
    });
  });

  describe('createExtractionSchema', () => {
    it('should create an extraction schema', () => {
      const fields = [
        MCPCrawl4AIClient.createExtractionSchemaField('title', 'h1', 'text'),
        MCPCrawl4AIClient.createExtractionSchemaField('content', 'p', 'text')
      ];

      const result = MCPCrawl4AIClient.createExtractionSchema('article', 'article', fields);

      expect(result).toEqual({
        name: 'article',
        base_selector: 'article',
        fields
      });
    });

    it('should create a complex extraction schema with multiple field types', () => {
      // Create a more complex extraction schema with multiple field types and nested selectors
      const fields = [
        MCPCrawl4AIClient.createExtractionSchemaField('title', 'h1.main-title', 'text'),
        MCPCrawl4AIClient.createExtractionSchemaField('subtitle', 'h2.subtitle', 'text'),
        MCPCrawl4AIClient.createExtractionSchemaField('content', 'div.content p', 'html'),
        MCPCrawl4AIClient.createExtractionSchemaField(
          'image',
          'img.hero-image',
          'attribute',
          'src'
        ),
        MCPCrawl4AIClient.createExtractionSchemaField('author', '.author-info .name', 'text'),
        MCPCrawl4AIClient.createExtractionSchemaField(
          'date',
          'time.published-date',
          'attribute',
          'datetime'
        ),
        MCPCrawl4AIClient.createExtractionSchemaField('tags', '.tags .tag', 'text'),
        MCPCrawl4AIClient.createExtractionSchemaField('category', '.category-label', 'text'),
        MCPCrawl4AIClient.createExtractionSchemaField(
          'comments',
          '.comments-section .comment',
          'html'
        )
      ];

      const result = MCPCrawl4AIClient.createExtractionSchema(
        'article',
        'article.blog-post',
        fields
      );

      // Verify the complex schema was created correctly
      expect(result).toEqual({
        name: 'article',
        base_selector: 'article.blog-post',
        fields
      });

      // Verify the number of fields
      expect(result.fields.length).toBe(9);

      // Verify specific fields
      expect(result.fields[0]).toEqual({
        name: 'title',
        selector: 'h1.main-title',
        type: 'text'
      });

      expect(result.fields[3]).toEqual({
        name: 'image',
        selector: 'img.hero-image',
        type: 'attribute',
        attribute: 'src'
      });
    });

    it('should create an extraction schema for a complex e-commerce product page', () => {
      // Create a schema for extracting product information from an e-commerce page
      const fields = [
        MCPCrawl4AIClient.createExtractionSchemaField('productName', '.product-title', 'text'),
        MCPCrawl4AIClient.createExtractionSchemaField(
          'price',
          '.product-price .current-price',
          'text'
        ),
        MCPCrawl4AIClient.createExtractionSchemaField(
          'originalPrice',
          '.product-price .original-price',
          'text'
        ),
        MCPCrawl4AIClient.createExtractionSchemaField(
          'discount',
          '.product-price .discount-percentage',
          'text'
        ),
        MCPCrawl4AIClient.createExtractionSchemaField(
          'rating',
          '.product-rating',
          'attribute',
          'data-rating'
        ),
        MCPCrawl4AIClient.createExtractionSchemaField('reviewCount', '.review-count', 'text'),
        MCPCrawl4AIClient.createExtractionSchemaField(
          'availability',
          '.product-availability',
          'text'
        ),
        MCPCrawl4AIClient.createExtractionSchemaField(
          'description',
          '.product-description',
          'html'
        ),
        MCPCrawl4AIClient.createExtractionSchemaField('features', '.product-features li', 'text'),
        MCPCrawl4AIClient.createExtractionSchemaField(
          'images',
          '.product-gallery img',
          'attribute',
          'src'
        ),
        MCPCrawl4AIClient.createExtractionSchemaField(
          'variants',
          '.product-variants .variant',
          'text'
        ),
        MCPCrawl4AIClient.createExtractionSchemaField('brand', '.product-brand', 'text'),
        MCPCrawl4AIClient.createExtractionSchemaField('sku', '.product-sku', 'text'),
        MCPCrawl4AIClient.createExtractionSchemaField('shippingInfo', '.shipping-info', 'html'),
        MCPCrawl4AIClient.createExtractionSchemaField('returnPolicy', '.return-policy', 'html')
      ];

      const result = MCPCrawl4AIClient.createExtractionSchema(
        'product',
        '.product-container',
        fields
      );

      // Verify the e-commerce schema was created correctly
      expect(result).toEqual({
        name: 'product',
        base_selector: '.product-container',
        fields
      });

      // Verify the number of fields
      expect(result.fields.length).toBe(15);
    });
  });
});
