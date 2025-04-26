import { describe, beforeEach, vi, expect } from 'vitest';
import * as Effect from '@effect/io/Effect';
import { pipe } from '@effect/data/Function';
import { test } from '@effect/vitest';

import { makeLiveService } from '../../../../../lib/server/mcp/crawl4ai/service';
import * as Errors from '../../../../../lib/server/mcp/crawl4ai/errors';
import * as EffectUtils from '../../../../../lib/utils/effect';

// Mock effectFetch and validateWithSchema
vi.mock('../../../../../lib/utils/effect', () => ({
	effectFetch: vi.fn(),
	validateWithSchema: vi.fn((schema, data) => Effect.succeed(data)),
	ServiceError: vi.fn().mockImplementation((code, message, cause) => ({
		code,
		message,
		cause,
		_tag: 'ServiceError'
	})),
	createServiceTag: vi.fn().mockImplementation((name) => Symbol.for(name))
}));

// Get the mocked functions
const mockedEffectFetch = vi.mocked(EffectUtils.effectFetch);
const mockedValidateWithSchema = vi.mocked(EffectUtils.validateWithSchema);

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

describe('Crawl4AI MCP Provider', () => {
	// Test service instance
	const apiUrl = 'http://test-api:8002';
	const service = makeLiveService(apiUrl);

	beforeEach(() => {
		vi.clearAllMocks();
		mockedEffectFetch.mockImplementation(() =>
			Effect.succeed(mockExtractContentResponse)
		);
	});

	describe('extractContent', () => {
		test('should successfully extract content from a URL', () =>
			pipe(
				Effect.gen(function* (_) {
					const params = {
						url: 'https://example.com',
						headless: true,
						verbose: false,
						use_cache: true,
						check_robots_txt: true,
						respect_rate_limits: true
					};

					const result = yield* _(service.extractContent(params));

					expect(result).toEqual(mockExtractContentResponse);
					expect(EffectUtils.effectFetch).toHaveBeenCalledTimes(1);
					expect(EffectUtils.effectFetch).toHaveBeenCalledWith(
						`${apiUrl}/extract`,
						expect.objectContaining({
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: expect.any(String)
						})
					);
					expect(EffectUtils.validateWithSchema).toHaveBeenCalledTimes(2); // Validates input and output
				})
			));

		test('should handle validation errors for invalid URL', () =>
			pipe(
				Effect.gen(function* (_) {
					const invalidParams = {
						url: 'invalid-url', // Invalid URL format
						headless: true,
						verbose: false,
						use_cache: true
					};

					// Mock validation to throw for invalid params
					mockedValidateWithSchema.mockImplementationOnce(() =>
						Effect.fail(new EffectUtils.ServiceError('VALIDATION_ERROR', 'Validation failed'))
					);

					const result = yield* _(Effect.either(service.extractContent(invalidParams)));

					expect(result._tag).toBe('Left');
					if (result._tag === 'Left') {
						expect(result.left).toBeInstanceOf(Errors.InvalidParametersError);
						expect(result.left.code).toContain('INVALID_PARAMETERS');
					}

					// Reset mock for other tests
					mockedValidateWithSchema.mockImplementation((schema, data) =>
						Effect.succeed(data)
					);
				})
			));

		test('should handle server errors', () =>
			pipe(
				Effect.gen(function* (_) {
					// Mock fetch to fail
					mockedEffectFetch.mockImplementationOnce(() =>
						Effect.fail(new EffectUtils.ServiceError('FETCH_ERROR', 'Failed to fetch data'))
					);

					const params = {
						url: 'https://example.com',
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

	describe('checkRobotsTxt', () => {
		test('should successfully check robots.txt rules', () =>
			pipe(
				Effect.gen(function* (_) {
					// Override the mock for this specific test
					mockedEffectFetch.mockImplementationOnce(() =>
						Effect.succeed(mockCheckRobotsTxtResponse)
					);

					const params = {
						url: 'https://example.com'
					};

					const result = yield* _(service.checkRobotsTxt(params));

					expect(result).toEqual(mockCheckRobotsTxtResponse);
					expect(EffectUtils.effectFetch).toHaveBeenCalledTimes(1);
					expect(EffectUtils.effectFetch).toHaveBeenCalledWith(
						expect.stringContaining(`${apiUrl}/robots-check?url=https%3A%2F%2Fexample.com`),
						expect.objectContaining({
							method: 'GET'
						})
					);
				})
			));

		test('should include user agent when provided', () =>
			pipe(
				Effect.gen(function* (_) {
					mockedEffectFetch.mockImplementationOnce(() =>
						Effect.succeed(mockCheckRobotsTxtResponse)
					);

					const params = {
						url: 'https://example.com',
						user_agent: 'Custom-Bot'
					};

					yield* _(service.checkRobotsTxt(params));

					expect(EffectUtils.effectFetch).toHaveBeenCalledWith(
						expect.stringContaining('user_agent=Custom-Bot'),
						expect.any(Object)
					);
				})
			));

		test('should handle server errors for robots.txt check', () =>
			pipe(
				Effect.gen(function* (_) {
					// Mock fetch to fail
					mockedEffectFetch.mockImplementationOnce(() =>
						Effect.fail(
							new EffectUtils.ServiceError('ROBOTS_CHECK_ERROR', 'Failed to check robots.txt')
						)
					);

					const params = {
						url: 'https://example.com'
					};

					const result = yield* _(Effect.either(service.checkRobotsTxt(params)));

					expect(result._tag).toBe('Left');
					if (result._tag === 'Left') {
						expect(result.left).toBeInstanceOf(Errors.Crawl4AIServiceError);
						expect(result.left.code).toContain('SERVICE_ERROR');
					}
				})
			));
	});

	describe('listTools', () => {
		test('should return list of available tools', () =>
			pipe(
				Effect.gen(function* (_) {
					const tools = yield* _(service.listTools());

					// Should have 2 tools
					expect(tools.length).toBe(2);

					// Check tool properties
					expect(tools[0].name).toBe('extractContent');
					expect(tools[1].name).toBe('checkRobotsTxt');

					// Each tool should have a description and parameters
					expect(tools[0].description).toBeTruthy();
					expect(tools[1].description).toBeTruthy();
				})
			));
	});

	describe('callTool', () => {
		test('should call extractContent tool successfully', () =>
			pipe(
				Effect.gen(function* (_) {
					const params = {
						url: 'https://example.com',
						headless: true
					};

					const result = yield* _(service.callTool('extractContent', params));

					expect(result).toEqual(mockExtractContentResponse);
					expect(EffectUtils.effectFetch).toHaveBeenCalledTimes(1);
				})
			));

		test('should call checkRobotsTxt tool successfully', () =>
			pipe(
				Effect.gen(function* (_) {
					mockedEffectFetch.mockImplementationOnce(() =>
						Effect.succeed(mockCheckRobotsTxtResponse)
					);

					const params = {
						url: 'https://example.com'
					};

					const result = yield* _(service.callTool('checkRobotsTxt', params));

					expect(result).toEqual(mockCheckRobotsTxtResponse);
					expect(EffectUtils.effectFetch).toHaveBeenCalledTimes(1);
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
						expect(result.left.message).toContain('invalidTool');
					}
				})
			));
	});
});
