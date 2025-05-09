import { describe, expect, vi, beforeEach } from 'vitest';
import { test } from '@effect/vitest';
import { Effect as E, pipe, type Effect } from 'effect';
import * as EffectUtils from '$lib/utils/effect';
import type { ServiceError } from '$lib/utils/effect';
import { Crawl4AIMCPError } from '$lib/server/mcp/crawl4ai/errors';

// Mock the effectFetch function
vi.mock('$lib/utils/effect', async () => {
  const actual = await vi.importActual('$lib/utils/effect');
  return {
    ...actual,
    effectFetch: vi.fn(),
    validateWithSchema: vi.fn().mockImplementation((schema, data) => E.succeed(data)),
    createServiceTag: vi.fn().mockImplementation((name) => Symbol.for(name))
  };
});

// Create mock functions for the service
const mockExtractContent = vi.fn();
const mockCheckRobotsTxt = vi.fn();
const mockListTools = vi.fn();
const mockCallTool = vi.fn();

// Mock the Crawl4AI service
vi.mock('$lib/server/mcp/crawl4ai/service', () => {
  return {
    makeCrawl4AILayer: () => ({
      build: () =>
        E.succeed({
          extractContent: mockExtractContent,
          checkRobotsTxt: mockCheckRobotsTxt,
          listTools: mockListTools,
          callTool: mockCallTool
        })
    })
  };
});

// Get the mocked functions
const mockedEffectFetch = vi.mocked(EffectUtils.effectFetch);

// Mock API responses
const mockExtractContentResponse = {
  content: {
    markdown: 'Test markdown content',
    raw_markdown: 'Test raw content',
    html: '<p>Test HTML content</p>'
  },
  extracted_data: {
    title: 'Test Title'
  },
  metadata: {}
};

const mockCheckRobotsTxtResponse = {
  allowed: true,
  url: 'https://example.com',
  robots_url: 'https://example.com/robots.txt',
  user_agent: 'webinsight',
  error: undefined
};

const mockListToolsResponse = [
  {
    name: 'extractContent',
    description: 'Extract content from a URL'
  },
  {
    name: 'checkRobotsTxt',
    description: 'Check if a URL is allowed by robots.txt'
  }
];

const mockCallToolResponse = {
  result: 'Success',
  data: {}
};

describe('Crawl4AI MCP Provider', () => {
  // const apiUrl = 'http://test-api:8002';
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up mock implementations
    mockExtractContent.mockImplementation(() => E.succeed(mockExtractContentResponse));
    mockCheckRobotsTxt.mockImplementation(() => E.succeed(mockCheckRobotsTxtResponse));
    mockListTools.mockImplementation(() => E.succeed(mockListToolsResponse));
    mockCallTool.mockImplementation(() => E.succeed(mockCallToolResponse));

    // Mock effectFetch
    mockedEffectFetch.mockImplementation(() => E.succeed(mockExtractContentResponse));
  });

  describe('extractContent', () => {
    test('should extract content from a URL', () =>
      pipe(
        E.gen(function* (_) {
          const params = {
            url: 'https://example.com',
            mode: 'article',
            includeMetadata: true,
            respect_rate_limits: true
          };

          const result = yield* _(mockExtractContent(params));

          expect(result).toEqual(mockExtractContentResponse);
          expect(mockExtractContent).toHaveBeenCalledWith(params);
        })
      ));

    test('should handle validation errors', () =>
      pipe(
        E.gen(function* (_) {
          const params = {
            url: 'invalid-url',
            mode: 'article',
            includeMetadata: true,
            respect_rate_limits: true
          };

          const result = yield* _(mockExtractContent(params));

          expect(result).toEqual(mockExtractContentResponse);
          expect(mockExtractContent).toHaveBeenCalledWith(params);
        })
      ));

    test('should handle API errors', () =>
      pipe(
        E.gen(function* (_) {
          const params = {
            url: 'https://example.com',
            mode: 'article',
            includeMetadata: true,
            respect_rate_limits: true
          };

          // Mock API error
          mockExtractContent.mockImplementationOnce(() =>
            E.fail(new Crawl4AIMCPError('API_ERROR', 'API error'))
          );

          try {
            yield* _(mockExtractContent(params));
            throw new Error('Should have failed');
          } catch (error) {
            expect(error).toBeInstanceOf(Crawl4AIMCPError);
            expect((error as Crawl4AIMCPError).message).toBe('API error');
          }
        })
      ));
  });

  describe('checkRobotsTxt', () => {
    test('should check robots.txt rules', () =>
      pipe(
        E.gen(function* (_) {
          const params = {
            url: 'https://example.com'
          };

          const result = yield* _(mockCheckRobotsTxt(params));

          expect(result).toEqual(mockCheckRobotsTxtResponse);
          expect(mockCheckRobotsTxt).toHaveBeenCalledWith(params);
        })
      ));

    test('should include user agent when provided', () =>
      pipe(
        E.gen(function* (_) {
          const params = {
            url: 'https://example.com',
            user_agent: 'Custom-Bot'
          };

          yield* _(mockCheckRobotsTxt(params));

          expect(mockCheckRobotsTxt).toHaveBeenCalledWith(params);
        })
      ));

    test('should handle API errors', () =>
      pipe(
        E.gen(function* (_) {
          const url = 'https://example.com';
          const userAgent = 'webinsight';
          const params = { url, user_agent: userAgent };

          // Mock API error
          mockCheckRobotsTxt.mockImplementationOnce(() =>
            E.fail(new Crawl4AIMCPError('API_ERROR', 'API error'))
          );

          try {
            yield* _(mockCheckRobotsTxt(params));
            throw new Error('Should have failed');
          } catch (error) {
            expect(error).toBeInstanceOf(Crawl4AIMCPError);
            expect((error as Crawl4AIMCPError).message).toBe('API error');
          }
        })
      ));
  });

  describe('listTools', () => {
    test('should return list of available tools', () =>
      pipe(
        E.gen(function* (_) {
          const tools = yield* _(mockListTools());

          // Should have 2 tools
          expect(tools).toHaveLength(2);
          expect(tools).toContainEqual({
            name: 'extractContent',
            description: expect.any(String)
          });
          expect(tools).toContainEqual({
            name: 'checkRobotsTxt',
            description: expect.any(String)
          });
          expect(mockListTools).toHaveBeenCalled();
        })
      ));
  });

  describe('callTool', () => {
    test('should handle validation errors', () =>
      pipe(
        E.gen(function* (_) {
          const params = {
            url: 'invalid-url',
            mode: 'article',
            includeMetadata: true,
            respect_rate_limits: true
          };

          const result = yield* _(mockExtractContent(params));

          expect(result).toEqual(mockExtractContentResponse);
          expect(mockExtractContent).toHaveBeenCalledWith(params);
        })
      ));

    test('should call checkRobotsTxt tool successfully', () =>
      pipe(
        E.gen(function* (_) {
          mockedEffectFetch.mockImplementationOnce(
            () =>
              E.succeed(mockCheckRobotsTxtResponse) as Effect.Effect<
                typeof mockCheckRobotsTxtResponse,
                ServiceError
              >
          );
          const params = {
            url: 'https://example.com'
          };

          const result = yield* _(mockCallTool('checkRobotsTxt', params));

          expect(result).toEqual(mockCheckRobotsTxtResponse);
          expect(EffectUtils.effectFetch).toHaveBeenCalledTimes(1);
        })
      ));

    test('should fail when tool name is invalid', () =>
      pipe(
        E.gen(function* (_) {
          const result = yield* _(E.either(mockCallTool('invalidTool', {})));

          expect(result._tag).toBe('Left');
          if (result._tag === 'Left') {
            expect(result.left).toBeInstanceOf(Crawl4AIMCPError);
            expect((result.left as Crawl4AIMCPError).code).toContain('NOT_FOUND');
            expect((result.left as Crawl4AIMCPError).message).toContain('invalidTool');
          }
        })
      ));
  });
});
