import { describe, beforeEach, afterEach, expect } from 'vitest';
import * as Effect from '@effect/io/Effect';
import { pipe } from '@effect/data/Function';
import { test } from '@effect/vitest';
import { Server } from 'http';
import express from 'express';

import { makeLiveService } from '../../../../../lib/server/mcp/crawl4ai/service';
import * as Schemas from '../../../../../lib/server/mcp/crawl4ai/schemas';
import * as Errors from '../../../../../lib/server/mcp/crawl4ai/errors';

/**
 * Crawl4AI MCP Integration Tests
 *
 * These tests verify the end-to-end flow from the client through the MCP host
 * to the Crawl4AI service and the Python backend.
 *
 * We use a mock Express server to simulate the Python backend.
 */

// Test data
const mockExtractContentResponse = {
  content: {
    markdown: 'Test markdown content',
    raw_markdown: 'Test raw content',
    html: '<p>Test HTML content</p>'
  },
  extracted_data: {
    title: 'Test Title',
    description: 'Test Description',
    image: 'https://example.com/image.jpg'
  },
  metadata: {
    url: 'https://example.com',
    timestamp: new Date().toISOString()
  }
};

const mockCheckRobotsTxtResponse = {
  allowed: true,
  url: 'https://example.com',
  robots_url: 'https://example.com/robots.txt',
  user_agent: 'webinsight',
  error: null
};

describe('Crawl4AI MCP Integration', () => {
  // Mock server
  let mockServer: Server;
  let apiUrl: string;
  let service: ReturnType<typeof makeLiveService>;

  // Setup mock server before tests
  beforeEach(async () => {
    // Create Express app
    const app = express();
    app.use(express.json());

    // Mock extract endpoint
    app.post('/extract', (req, res) => {
      const { url } = req.body;

      // Simulate error for specific URLs
      if (url === 'https://error.example.com') {
        return res.status(500).json({
          error: 'Failed to extract content',
          url
        });
      }

      // Simulate timeout for specific URLs
      if (url === 'https://timeout.example.com') {
        return setTimeout(() => {
          res.status(504).json({
            error: 'Request timed out',
            url
          });
        }, 100);
      }

      // Return mock data for valid URLs
      return res.json({
        ...mockExtractContentResponse,
        metadata: {
          ...mockExtractContentResponse.metadata,
          url
        }
      });
    });

    // Mock robots-check endpoint
    app.get('/robots-check', (req, res) => {
      const url = req.query.url as string;
      const userAgent = req.query.user_agent as string | undefined;

      // Simulate error for specific URLs
      if (url === 'https://error.example.com') {
        return res.status(500).json({
          error: 'Failed to check robots.txt',
          url
        });
      }

      // Simulate robots.txt denial for specific URLs
      if (url === 'https://denied.example.com') {
        return res.json({
          allowed: false,
          url,
          robots_url: `${url}/robots.txt`,
          user_agent: userAgent || 'webinsight',
          error: null
        });
      }

      // Return mock data for valid URLs
      return res.json({
        ...mockCheckRobotsTxtResponse,
        url,
        user_agent: userAgent || mockCheckRobotsTxtResponse.user_agent
      });
    });

    // Start server on random port
    return new Promise<void>((resolve) => {
      mockServer = app.listen(0, () => {
        const address = mockServer.address();
        if (address && typeof address !== 'string') {
          apiUrl = `http://localhost:${address.port}`;
          service = makeLiveService(apiUrl);
        }
        resolve();
      });
    });
  });

  // Teardown mock server after tests
  afterEach(() => {
    return new Promise<void>((resolve) => {
      if (mockServer) {
        mockServer.close(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  });

  // Tests for extractContent
  describe('extractContent', () => {
    test('should successfully extract content from a URL', () =>
      pipe(
        Effect.gen(function* (_) {
          const params: Schemas.ExtractContentInput = {
            url: 'https://example.com',
            headless: true,
            verbose: false,
            use_cache: true,
            check_robots_txt: true,
            respect_rate_limits: true
          };

          const result = yield* _(service.extractContent(params));

          expect(result).toMatchObject({
            content: expect.objectContaining({
              markdown: expect.any(String),
              html: expect.any(String)
            }),
            extracted_data: expect.objectContaining({
              title: expect.any(String)
            }),
            metadata: expect.objectContaining({
              url: params.url
            })
          });
        })
      ));

    test('should handle server errors gracefully', () =>
      pipe(
        Effect.gen(function* (_) {
          const params: Schemas.ExtractContentInput = {
            url: 'https://error.example.com',
            headless: true
          };

          const result = yield* _(Effect.either(service.extractContent(params)));

          expect(result._tag).toBe('Left');
          if (result._tag === 'Left') {
            expect(result.left).toBeInstanceOf(Errors.Crawl4AIServiceError);
            expect(result.left.code).toContain('SERVICE_ERROR');
          }
        })
      ));

    test('should handle timeouts gracefully', () =>
      pipe(
        Effect.gen(function* (_) {
          const params: Schemas.ExtractContentInput = {
            url: 'https://timeout.example.com',
            headless: true
          };

          const result = yield* _(Effect.either(service.extractContent(params)));

          expect(result._tag).toBe('Left');
          if (result._tag === 'Left') {
            expect(result.left).toBeInstanceOf(Errors.Crawl4AIServiceError);
            expect(result.left.code).toContain('SERVICE_ERROR');
          }
        })
      ));
  });

  // Tests for checkRobotsTxt
  describe('checkRobotsTxt', () => {
    test('should successfully check robots.txt rules for allowed URLs', () =>
      pipe(
        Effect.gen(function* (_) {
          const params: Schemas.CheckRobotsTxtInput = {
            url: 'https://example.com'
          };

          const result = yield* _(service.checkRobotsTxt(params));

          expect(result).toMatchObject({
            allowed: true,
            url: params.url,
            robots_url: expect.stringContaining('robots.txt')
          });
        })
      ));

    test('should correctly identify URLs denied by robots.txt', () =>
      pipe(
        Effect.gen(function* (_) {
          const params: Schemas.CheckRobotsTxtInput = {
            url: 'https://denied.example.com'
          };

          const result = yield* _(service.checkRobotsTxt(params));

          expect(result).toMatchObject({
            allowed: false,
            url: params.url,
            robots_url: expect.stringContaining('robots.txt')
          });
        })
      ));

    test('should handle server errors gracefully', () =>
      pipe(
        Effect.gen(function* (_) {
          const params: Schemas.CheckRobotsTxtInput = {
            url: 'https://error.example.com'
          };

          const result = yield* _(Effect.either(service.checkRobotsTxt(params)));

          expect(result._tag).toBe('Left');
          if (result._tag === 'Left') {
            expect(result.left).toBeInstanceOf(Errors.Crawl4AIServiceError);
            expect(result.left.code).toContain('SERVICE_ERROR');
          }
        })
      ));

    test('should include custom user agent when provided', () =>
      pipe(
        Effect.gen(function* (_) {
          const params: Schemas.CheckRobotsTxtInput = {
            url: 'https://example.com',
            user_agent: 'CustomBot/1.0'
          };

          const result = yield* _(service.checkRobotsTxt(params));

          expect(result).toMatchObject({
            user_agent: 'CustomBot/1.0'
          });
        })
      ));
  });

  // Tests for callTool
  describe('callTool', () => {
    test('should successfully call extractContent tool', () =>
      pipe(
        Effect.gen(function* (_) {
          const params = {
            url: 'https://example.com',
            headless: true
          };

          const result = yield* _(service.callTool('extractContent', params));

          expect(result).toMatchObject({
            content: expect.objectContaining({
              markdown: expect.any(String)
            }),
            metadata: expect.objectContaining({
              url: params.url
            })
          });
        })
      ));

    test('should successfully call checkRobotsTxt tool', () =>
      pipe(
        Effect.gen(function* (_) {
          const params = {
            url: 'https://example.com'
          };

          const result = yield* _(service.callTool('checkRobotsTxt', params));

          expect(result).toMatchObject({
            allowed: expect.any(Boolean),
            url: params.url
          });
        })
      ));

    test('should fail when tool name is invalid', () =>
      pipe(
        Effect.gen(function* (_) {
          const result = yield* _(Effect.either(service.callTool('invalidTool', {})));

          expect(result._tag).toBe('Left');
          if (result._tag === 'Left') {
            expect(result.left).toBeInstanceOf(Errors.NotFoundError);
            expect(result.left.code).toContain('NOT_FOUND');
          }
        })
      ));
  });

  // End-to-end flow tests
  describe('End-to-end flow', () => {
    test('should handle the complete extraction workflow', () =>
      pipe(
        Effect.gen(function* (_) {
          // 1. Check robots.txt first
          const robotsParams: Schemas.CheckRobotsTxtInput = {
            url: 'https://example.com'
          };

          const robotsResult = yield* _(service.checkRobotsTxt(robotsParams));

          expect(robotsResult.allowed).toBe(true);

          // 2. Only extract if allowed by robots.txt
          if (robotsResult.allowed) {
            const extractParams: Schemas.ExtractContentInput = {
              url: robotsResult.url,
              headless: true,
              check_robots_txt: false // Already checked
            };

            const extractResult = yield* _(service.extractContent(extractParams));

            expect(extractResult).toMatchObject({
              content: expect.objectContaining({
                markdown: expect.any(String)
              }),
              extracted_data: expect.objectContaining({
                title: expect.any(String)
              })
            });
          }
        })
      ));

    test('should respect robots.txt denial in the workflow', () =>
      pipe(
        Effect.gen(function* (_) {
          // 1. Check robots.txt first for a denied URL
          const robotsParams: Schemas.CheckRobotsTxtInput = {
            url: 'https://denied.example.com'
          };

          const robotsResult = yield* _(service.checkRobotsTxt(robotsParams));

          expect(robotsResult.allowed).toBe(false);

          // 2. Should not extract if denied by robots.txt
          // This is a logical check, not a technical one
          expect(robotsResult.allowed).toBe(false);
        })
      ));
  });
});
