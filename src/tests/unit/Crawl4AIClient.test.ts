import { describe, beforeEach, vi, expect, type Mock } from 'vitest';
import * as Effect from '@effect/io/Effect';
import { pipe } from '@effect/data/Function';
import { test } from '@effect/vitest';
import { Crawl4AIClient } from '../../lib/services/scraper/Crawl4AIClient';
import * as EffectUtils from '../../lib/utils/effect';

// Mock effectFetch
vi.mock('../../lib/utils/effect', () => ({
	effectFetch: vi.fn(),
	validateWithSchema: vi.fn((schema, data) => Effect.succeed(data))
}));

// Mock successful content extraction response
const mockExtractionResponse = {
	content: {
		markdown: 'Test markdown content',
		raw_markdown: 'Test raw markdown content',
		html: '<p>Test HTML content</p>'
	},
	extracted_data: {
		title: 'Test Title',
		content: 'Test Content'
	},
	metadata: {}
};

// Mock successful robots.txt check response
const mockRobotsResponse = {
	allowed: true,
	url: 'https://example.com',
	robots_url: 'https://example.com/robots.txt',
	user_agent: 'Flux-RSS-Fabric-AI'
};

describe('Crawl4AIClient', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(EffectUtils.effectFetch as Mock).mockImplementation(() =>
			Effect.succeed(mockExtractionResponse)
		);
	});

	describe('extractContent', () => {
		test('should successfully extract content from a URL', () =>
			pipe(
				Effect.gen(function* (_) {
					const options = {
						url: 'https://example.com',
						headless: true,
						verbose: false,
						use_cache: true,
						check_robots_txt: true,
						respect_rate_limits: true
					};

					const result = yield* _(Crawl4AIClient.extractContent(options));

					expect(result).toEqual(mockExtractionResponse);
					expect(EffectUtils.effectFetch).toHaveBeenCalledTimes(1);
					expect(EffectUtils.effectFetch).toHaveBeenCalledWith(
						'http://localhost:8002/extract',
						expect.objectContaining({
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: expect.any(String)
						})
					);
				})
			));

		test('should handle validation errors for invalid options', () =>
			pipe(
				Effect.gen(function* (_) {
					const invalidOptions = {
						url: 'invalid-url', // Invalid URL format
						headless: true,
						verbose: false,
						use_cache: true,
						check_robots_txt: true,
						respect_rate_limits: true
					};

					const result = yield* _(Effect.either(Crawl4AIClient.extractContent(invalidOptions)));

					expect(result._tag).toBe('Left');
					if (result._tag === 'Left') {
						expect(result.left.code).toBe('VALIDATION_ERROR');
					}
				})
			));
	});

	describe('checkRobotsTxt', () => {
		test('should successfully check robots.txt rules', () =>
			pipe(
				Effect.gen(function* (_) {
					(EffectUtils.effectFetch as Mock).mockImplementation(() =>
						Effect.succeed(mockRobotsResponse)
					);

					const result = yield* _(Crawl4AIClient.checkRobotsTxt('https://example.com'));

					expect(result).toEqual(mockRobotsResponse);
					expect(EffectUtils.effectFetch).toHaveBeenCalledTimes(1);
					expect(EffectUtils.effectFetch).toHaveBeenCalledWith(
						expect.stringContaining(
							'http://localhost:8002/robots-check?url=https%3A%2F%2Fexample.com'
						),
						expect.objectContaining({
							method: 'GET'
						})
					);
				})
			));

		test('should include user agent when provided', () =>
			pipe(
				Effect.gen(function* (_) {
					(EffectUtils.effectFetch as Mock).mockImplementation(() =>
						Effect.succeed(mockRobotsResponse)
					);

					const result = yield* _(
						Crawl4AIClient.checkRobotsTxt('https://example.com', 'Custom-Bot')
					);

					expect(result).toEqual(mockRobotsResponse);
					expect(EffectUtils.effectFetch).toHaveBeenCalledWith(
						expect.stringContaining('user_agent=Custom-Bot'),
						expect.any(Object)
					);
				})
			));

		test('should handle server errors', () =>
			pipe(
				Effect.gen(function* (_) {
					(EffectUtils.effectFetch as Mock).mockImplementation(() =>
						Effect.fail(
							new EffectUtils.ServiceError('ROBOTS_CHECK_ERROR', 'Failed to check robots.txt')
						)
					);

					const result = yield* _(
						Effect.either(Crawl4AIClient.checkRobotsTxt('https://example.com'))
					);

					expect(result._tag).toBe('Left');
					if (result._tag === 'Left') {
						expect(result.left.code).toBe('ROBOTS_CHECK_ERROR');
					}
				})
			));
	});

	describe('createSelectorConfig', () => {
		test('should create a valid selector configuration', () =>
			pipe(
				Effect.gen(function* (_) {
					const result = yield* _(
						Crawl4AIClient.createSelectorConfig(
							'article',
							['h1', 'p.content'],
							['.ads', '.comments']
						)
					);

					expect(result).toEqual({
						base_selector: 'article',
						include_selectors: ['h1', 'p.content'],
						exclude_selectors: ['.ads', '.comments']
					});
				})
			));
	});

	describe('createExtractionSchema', () => {
		test('should create a valid extraction schema', () =>
			pipe(
				Effect.gen(function* (_) {
					const fields = [
						{
							name: 'title',
							selector: 'h1',
							type: 'text' as const
						},
						{
							name: 'image',
							selector: 'img',
							type: 'attribute' as const,
							attribute: 'src'
						}
					];

					const result = yield* _(
						Crawl4AIClient.createExtractionSchema('article', 'article.main', fields)
					);

					expect(result).toEqual({
						name: 'article',
						base_selector: 'article.main',
						fields
					});
				})
			));
	});
});
