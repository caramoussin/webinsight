import * as E from '@effect/io/Effect';
import * as S from '@effect/schema/Schema';
import { ServiceError, validateWithSchema, effectFetch } from '../../utils/effect';

// Define schemas using Effect Schema
const SelectorConfigSchema = S.Struct({
	base_selector: S.optional(S.String),
	include_selectors: S.optional(S.Array(S.String)),
	exclude_selectors: S.optional(S.Array(S.String))
});

const ExtractionSchemaFieldSchema = S.Struct({
	name: S.String,
	selector: S.String,
	type: S.Union(S.Literal('text'), S.Literal('attribute'), S.Literal('html')),
	attribute: S.optional(S.String)
});

const ExtractionSchemaSchema = S.Struct({
	name: S.String,
	base_selector: S.String,
	fields: S.Array(ExtractionSchemaFieldSchema)
});

const ExtractionOptionsSchema = S.Struct({
	url: S.String.pipe(S.pattern(/^https?:\/\/.+/)),
	selectors: S.optional(SelectorConfigSchema),
	extraction_schema: S.optional(ExtractionSchemaSchema),

	// Browser configuration
	headless: S.Boolean,
	verbose: S.Boolean,
	user_agent: S.optional(S.String),

	// Content filtering
	filter_type: S.optional(S.Union(S.Literal('pruning'), S.Literal('bm25'))),
	threshold: S.optional(S.Number),
	query: S.optional(S.String),

	// Caching and performance
	use_cache: S.Boolean,
	js_scripts: S.optional(S.Array(S.String)),
	wait_selectors: S.optional(S.Array(S.String)),

	// Ethical scraping
	check_robots_txt: S.Boolean,
	respect_rate_limits: S.Boolean
});

const ExtractionResponseSchema = S.Struct({
	content: S.Struct({
		markdown: S.String,
		raw_markdown: S.String,
		html: S.optional(S.String)
	}),
	extracted_data: S.optional(S.Unknown),
	metadata: S.Struct({})
});

const RobotsCheckResponseSchema = S.Struct({
	allowed: S.Boolean,
	url: S.String,
	robots_url: S.String,
	user_agent: S.String,
	error: S.optional(S.String)
});

// Type inference from schemas
type ExtractionOptions = S.Schema.Type<typeof ExtractionOptionsSchema>;
type ExtractionResponse = S.Schema.Type<typeof ExtractionResponseSchema>;
type RobotsCheckResponse = S.Schema.Type<typeof RobotsCheckResponseSchema>;

// Error types
export type Crawl4AIError = {
	code: string;
	message: string;
	details?: unknown;
};

/**
 * Crawl4AI client for web content extraction
 * Follows functional programming principles with pure functions and Either types for error handling
 */
export class Crawl4AIClient {
	private static readonly API_BASE_URL = 'http://localhost:8002';

	/**
	 * Extract content from a URL using Crawl4AI
	 * @param options Extraction options
	 * @returns Either an error or the extraction response
	 */
	static extractContent(
		options: ExtractionOptions
	): E.Effect<never, ServiceError, ExtractionResponse> {
		return E.gen(function* ($) {
			// Validate options
			const validatedOptions = yield* $(validateWithSchema(ExtractionOptionsSchema, options));

			// Make request
			const response = yield* $(
				effectFetch<unknown>(`${Crawl4AIClient.API_BASE_URL}/extract`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(validatedOptions)
				})
			);

			// Validate response
			return yield* $(
				validateWithSchema(
					ExtractionResponseSchema,
					response as S.Schema.Type<typeof ExtractionResponseSchema>
				)
			);
		});
	}

	/**
	 * Check if scraping is allowed by robots.txt for a given URL
	 * @param url URL to check
	 * @param userAgent User agent to check against
	 * @returns Either an error or the robots check response
	 */
	static checkRobotsTxt(
		url: string,
		userAgent?: string
	): E.Effect<never, ServiceError, RobotsCheckResponse> {
		return E.gen(function* ($) {
			const queryParams = new URLSearchParams({
				url,
				...(userAgent ? { user_agent: userAgent } : {})
			});

			const response = yield* $(
				effectFetch<unknown>(`${Crawl4AIClient.API_BASE_URL}/robots-check?${queryParams}`, {
					method: 'GET'
				})
			);

			return yield* $(
				validateWithSchema(
					RobotsCheckResponseSchema,
					response as S.Schema.Type<typeof RobotsCheckResponseSchema>
				)
			);
		});
	}

	/**
	 * Create a selector configuration object
	 * @param baseSelector Base CSS selector
	 * @param includeSelectors CSS selectors to include
	 * @param excludeSelectors CSS selectors to exclude
	 * @returns Selector configuration
	 */
	static createSelectorConfig(
		baseSelector?: string,
		includeSelectors?: string[],
		excludeSelectors?: string[]
	): E.Effect<never, ServiceError, S.Schema.Type<typeof SelectorConfigSchema>> {
		return validateWithSchema(SelectorConfigSchema, {
			base_selector: baseSelector,
			include_selectors: includeSelectors,
			exclude_selectors: excludeSelectors
		});
	}

	/**
	 * Create an extraction schema for structured data extraction
	 * @param name Schema name
	 * @param baseSelector Base CSS selector
	 * @param fields Fields to extract
	 * @returns Extraction schema
	 */
	static createExtractionSchema(
		name: string,
		baseSelector: string,
		fields: S.Schema.Type<typeof ExtractionSchemaFieldSchema>[]
	): E.Effect<never, ServiceError, S.Schema.Type<typeof ExtractionSchemaSchema>> {
		return validateWithSchema(ExtractionSchemaSchema, {
			name,
			base_selector: baseSelector,
			fields
		});
	}
}

// Example usage with Effect
export const exampleCrawl4AIExtraction = E.gen(function* ($) {
	const selectorConfig = yield* $(
		Crawl4AIClient.createSelectorConfig(
			'article.content',
			['h1.title', '.article-body'],
			['.advertisement', '.related-articles']
		)
	);

	const result = yield* $(
		Crawl4AIClient.extractContent({
			url: 'https://example.com/article',
			selectors: selectorConfig,
			filter_type: 'pruning',
			threshold: 0.48,
			headless: true,
			verbose: false,
			use_cache: true,
			check_robots_txt: true,
			respect_rate_limits: true
		})
	);

	console.log('Extraction successful');
	console.log('Markdown content:', result.content.markdown.substring(0, 100) + '...');
	return result;
});
