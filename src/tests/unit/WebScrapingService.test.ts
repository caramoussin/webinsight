import { describe, beforeEach, vi, expect, type Mock } from 'vitest';
import * as Effect from '@effect/io/Effect';
import { pipe } from '@effect/data/Function';
import { test } from '@effect/vitest';
import {
  WebScrapingService,
  type ScraperConfig
} from '../../lib/services/scraper/WebScrapingService';
import { Crawl4AIClient } from '../../lib/services/scraper/Crawl4AIClient';
import * as EffectUtils from '../../lib/utils/effect';

// Mock dependencies
vi.mock('../../lib/utils/effect', () => ({
  ServiceError: class ServiceError extends Error {
    constructor(
      readonly code: string,
      readonly message: string,
      readonly cause?: Error
    ) {
      super(message);
      this.name = 'ServiceError';
    }
  },
  validateWithSchema: vi.fn((schema, data) => Effect.succeed(data))
}));

vi.mock('../../lib/services/scraper/Crawl4AIClient', () => ({
  Crawl4AIClient: {
    extractContent: vi.fn(),
    createSelectorConfig: vi.fn(),
    checkRobotsTxt: vi.fn()
  }
}));

// Mock fetch globally
const mockFetchResponse = vi.fn();
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    headers: new Headers({
      'content-type': 'text/html'
    }),
    text: mockFetchResponse
  })
) as unknown as typeof fetch;

// Mock AbortSignal.timeout
global.AbortSignal = {
  ...global.AbortSignal,
  timeout: vi.fn(() => new AbortSignal())
} as unknown as typeof AbortSignal;

// Test configuration
const TEST_CONFIG: ScraperConfig = {
  url: 'https://example.com',
  contentType: 'html',
  timeout: 5000,
  useCrawl4AI: false
};

// Mock successful HTML response
const HTML_CONTENT = `
<!DOCTYPE html>
<html>
<head><title>Test Page</title></head>
<body>
  <h1>Test Heading</h1>
  <p>Test paragraph content</p>
  <a href="https://example.com/page1">Link 1</a>
  <a href="/page2">Link 2</a>
</body>
</html>
`;

// Mock successful Crawl4AI response
const CRAWL4AI_RESPONSE = {
  content: {
    html: HTML_CONTENT,
    markdown:
      '# Test Heading\n\nTest paragraph content\n\n[Link 1](https://example.com/page1)\n\n[Link 2](/page2)',
    raw_markdown:
      '# Test Heading\n\nTest paragraph content\n\n[Link 1](https://example.com/page1)\n\n[Link 2](/page2)'
  },
  metadata: {
    title: 'Test Page',
    language: 'en'
  },
  extracted_data: {
    links: [
      { text: 'Link 1', url: 'https://example.com/page1' },
      { text: 'Link 2', url: '/page2' }
    ]
  }
};

describe('WebScrapingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchResponse.mockResolvedValue(HTML_CONTENT);
    (Crawl4AIClient.extractContent as Mock).mockImplementation(() =>
      Effect.succeed(CRAWL4AI_RESPONSE)
    );
    (Crawl4AIClient.createSelectorConfig as Mock).mockImplementation(() =>
      Promise.resolve({ type: 'css', selector: 'h1' })
    );
    (Crawl4AIClient.checkRobotsTxt as Mock).mockImplementation(() =>
      Effect.succeed({
        allowed: true,
        url: 'https://example.com',
        robots_url: 'https://example.com/robots.txt',
        user_agent: 'default'
      })
    );
  });

  describe('scrape', () => {
    test('should scrape content with default method when useCrawl4AI is false', () =>
      pipe(
        Effect.gen(function* (_) {
          const result = yield* _(WebScrapingService.scrape(TEST_CONFIG));

          expect(result).toBeDefined();
          expect(result.url).toBe(TEST_CONFIG.url);
          expect(result.content).toBe(HTML_CONTENT);
          expect(result.contentType).toBe('text/html');
          expect(global.fetch).toHaveBeenCalledTimes(1);
          expect(global.fetch).toHaveBeenCalledWith(
            TEST_CONFIG.url,
            expect.objectContaining({
              method: 'GET',
              headers: expect.any(Object),
              signal: expect.any(AbortSignal)
            })
          );
        })
      ));

    test('should scrape content with Crawl4AI when useCrawl4AI is true', () =>
      pipe(
        Effect.gen(function* (_) {
          const crawl4AIConfig = {
            ...TEST_CONFIG,
            useCrawl4AI: true,
            selector: 'h1',
            crawl4AIOptions: {
              useCache: true,
              checkRobotsTxt: true,
              respectRateLimits: true
            }
          };

          const result = yield* _(WebScrapingService.scrape(crawl4AIConfig));

          expect(result).toBeDefined();
          expect(result.url).toBe(crawl4AIConfig.url);
          expect(result.content).toBe(HTML_CONTENT);
          expect(result.markdown).toBe(CRAWL4AI_RESPONSE.content.markdown);
          expect(Crawl4AIClient.extractContent).toHaveBeenCalledTimes(1);
          expect(Crawl4AIClient.createSelectorConfig).toHaveBeenCalledWith('h1');
        })
      ));

    test('should handle fetch errors properly', () =>
      pipe(
        Effect.gen(function* (_) {
          // Mock fetch to throw an error
          global.fetch = vi.fn(() =>
            Promise.reject(new Error('Network error'))
          ) as unknown as typeof fetch;

          const result = yield* _(Effect.either(WebScrapingService.scrape(TEST_CONFIG)));

          expect(result._tag).toBe('Left');
          if (result._tag === 'Left') {
            expect(result.left.code).toBe('FETCH_ERROR');
            expect(result.left.message).toBe('Failed to fetch content');
          }
        })
      ));

    test('should handle HTTP error responses', () =>
      pipe(
        Effect.gen(function* (_) {
          // Mock fetch to return a 404
          global.fetch = vi.fn(() =>
            Promise.resolve({
              ok: false,
              status: 404,
              headers: new Headers({
                'content-type': 'text/html'
              })
            })
          ) as unknown as typeof fetch;

          const result = yield* _(Effect.either(WebScrapingService.scrape(TEST_CONFIG)));

          expect(result._tag).toBe('Left');
          if (result._tag === 'Left') {
            expect(result.left.code).toBe('HTTP_404');
            expect(result.left.message).toContain('HTTP error! status: 404');
          }
        })
      ));

    test('should handle Crawl4AI errors', () =>
      pipe(
        Effect.gen(function* (_) {
          const crawl4AIConfig = {
            ...TEST_CONFIG,
            useCrawl4AI: true
          };

          // Mock Crawl4AI to fail
          (Crawl4AIClient.extractContent as Mock).mockImplementation(() =>
            Effect.fail(new EffectUtils.ServiceError('CRAWL4AI_ERROR', 'Failed to extract content'))
          );

          const result = yield* _(Effect.either(WebScrapingService.scrape(crawl4AIConfig)));

          expect(result._tag).toBe('Left');
          if (result._tag === 'Left') {
            expect(result.left.code).toBe('CRAWL4AI_ERROR');
            expect(result.left.message).toBe('Failed to extract content');
          }
        })
      ));
  });

  describe('checkRobotsTxt', () => {
    test('should return true when robots.txt allows access for default user agent', () =>
      pipe(
        Effect.gen(function* (_) {
          // Setup mock response
          (Crawl4AIClient.checkRobotsTxt as Mock).mockImplementation(() =>
            Effect.succeed({
              allowed: true,
              url: 'https://example.com',
              robots_url: 'https://example.com/robots.txt',
              user_agent: '*'
            })
          );

          const result = yield* _(WebScrapingService.checkRobotsTxt('https://example.com'));

          expect(result).toBe(true);
          expect(Crawl4AIClient.checkRobotsTxt).toHaveBeenCalledTimes(1);
          expect(Crawl4AIClient.checkRobotsTxt).toHaveBeenCalledWith(
            'https://example.com',
            undefined
          );
        })
      ));

    test('should return false when robots.txt disallows access for default user agent', () =>
      pipe(
        Effect.gen(function* (_) {
          // Setup mock response
          (Crawl4AIClient.checkRobotsTxt as Mock).mockImplementation(() =>
            Effect.succeed({
              allowed: false,
              url: 'https://example.com',
              robots_url: 'https://example.com/robots.txt',
              user_agent: '*'
            })
          );

          const result = yield* _(WebScrapingService.checkRobotsTxt('https://example.com'));

          expect(result).toBe(false);
          expect(Crawl4AIClient.checkRobotsTxt).toHaveBeenCalledTimes(1);
        })
      ));

    test('should respect specific user agent', () =>
      pipe(
        Effect.gen(function* (_) {
          const userAgent = 'TestUserAgent';

          // Setup mock response
          (Crawl4AIClient.checkRobotsTxt as Mock).mockImplementation(() =>
            Effect.succeed({
              allowed: true,
              url: 'https://example.com',
              robots_url: 'https://example.com/robots.txt',
              user_agent: userAgent
            })
          );

          const result = yield* _(
            WebScrapingService.checkRobotsTxt('https://example.com', userAgent)
          );

          expect(result).toBe(true);
          expect(Crawl4AIClient.checkRobotsTxt).toHaveBeenCalledTimes(1);
          expect(Crawl4AIClient.checkRobotsTxt).toHaveBeenCalledWith(
            'https://example.com',
            userAgent
          );
        })
      ));

    test('should handle service errors', () =>
      pipe(
        Effect.gen(function* (_) {
          // Setup mock error response
          (Crawl4AIClient.checkRobotsTxt as Mock).mockImplementation(() =>
            Effect.fail(new EffectUtils.ServiceError('ROBOTS_ERROR', 'Failed to check robots.txt'))
          );

          const result = yield* _(
            Effect.either(WebScrapingService.checkRobotsTxt('https://example.com'))
          );

          expect(result._tag).toBe('Left');
          if (result._tag === 'Left') {
            expect(result.left.code).toBe('ROBOTS_ERROR');
            expect(result.left.message).toBe('Failed to check robots.txt');
          }
          expect(Crawl4AIClient.checkRobotsTxt).toHaveBeenCalledTimes(1);
        })
      ));

    test('should handle robots.txt not found', () =>
      pipe(
        Effect.gen(function* (_) {
          // Setup mock response with error indicating robots.txt not found
          (Crawl4AIClient.checkRobotsTxt as Mock).mockImplementation(() =>
            Effect.succeed({
              allowed: true, // By convention, no robots.txt means access is allowed
              url: 'https://example.com',
              robots_url: 'https://example.com/robots.txt',
              user_agent: '*',
              error: 'Robots.txt not found (404)'
            })
          );

          const result = yield* _(WebScrapingService.checkRobotsTxt('https://example.com'));

          expect(result).toBe(true); // Should be allowed when robots.txt not found
          expect(Crawl4AIClient.checkRobotsTxt).toHaveBeenCalledTimes(1);
        })
      ));
  });

  // Add more tests for other methods as needed
});
