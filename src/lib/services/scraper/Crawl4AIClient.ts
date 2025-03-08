import { z } from 'zod';
import { type Either, left, right } from 'fp-ts/Either';

// Define schemas for the Crawl4AI API
const SelectorConfigSchema = z.object({
	base_selector: z.string().optional(),
	include_selectors: z.array(z.string()).optional(),
	exclude_selectors: z.array(z.string()).optional()
});

const ExtractionSchemaFieldSchema = z.object({
	name: z.string(),
	selector: z.string(),
	type: z.enum(['text', 'attribute', 'html']),
	attribute: z.string().optional()
});

const ExtractionSchemaSchema = z.object({
	name: z.string(),
	base_selector: z.string(),
	fields: z.array(ExtractionSchemaFieldSchema)
});

const ExtractionOptionsSchema = z.object({
	url: z.string().url('Invalid URL'),
	selectors: SelectorConfigSchema.optional(),
	extraction_schema: ExtractionSchemaSchema.optional(),

	// Browser configuration
	headless: z.boolean().default(true),
	verbose: z.boolean().default(false),
	user_agent: z.string().optional(),

	// Content filtering
	filter_type: z.enum(['pruning', 'bm25']).optional(),
	threshold: z.number().optional(),
	query: z.string().optional(),

	// Caching and performance
	use_cache: z.boolean().default(true),
	js_scripts: z.array(z.string()).optional(),
	wait_selectors: z.array(z.string()).optional(),

	// Ethical scraping
	check_robots_txt: z.boolean().default(true),
	respect_rate_limits: z.boolean().default(true)
});

const ExtractionResponseSchema = z.object({
	content: z.object({
		markdown: z.string(),
		raw_markdown: z.string(),
		html: z.string().optional()
	}),
	extracted_data: z.any().optional(),
	metadata: z.record(z.string(), z.any())
});

const RobotsCheckResponseSchema = z.object({
	allowed: z.boolean(),
	url: z.string(),
	robots_url: z.string(),
	user_agent: z.string(),
	error: z.string().optional()
});

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
	static async extractContent(
		options: z.infer<typeof ExtractionOptionsSchema>
	): Promise<Either<Crawl4AIError, z.infer<typeof ExtractionResponseSchema>>> {
		try {
			const validatedOptions = ExtractionOptionsSchema.parse(options);

			const response = await fetch(`${this.API_BASE_URL}/extract`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(validatedOptions)
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
				return left({
					code: `HTTP_${response.status}`,
					message: errorData.detail || `HTTP error ${response.status}`,
					details: errorData
				});
			}

			const data = await response.json();
			const validatedData = ExtractionResponseSchema.parse(data);

			return right(validatedData);
		} catch (error) {
			if (error instanceof z.ZodError) {
				return left({
					code: 'VALIDATION_ERROR',
					message: 'Invalid extraction options',
					details: error.format()
				});
			}

			if (error instanceof Error) {
				return left({
					code: 'REQUEST_ERROR',
					message: error.message,
					details: error
				});
			}

			return left({
				code: 'UNKNOWN_ERROR',
				message: 'An unknown error occurred',
				details: error
			});
		}
	}

	/**
	 * Check if scraping is allowed by robots.txt for a given URL
	 * @param url URL to check
	 * @param userAgent User agent to check against
	 * @returns Either an error or the robots check response
	 */
	static async checkRobotsTxt(
		url: string,
		userAgent?: string
	): Promise<Either<Crawl4AIError, z.infer<typeof RobotsCheckResponseSchema>>> {
		try {
			const queryParams = new URLSearchParams({
				url,
				...(userAgent ? { user_agent: userAgent } : {})
			});

			const response = await fetch(`${this.API_BASE_URL}/robots-check?${queryParams}`, {
				method: 'GET'
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
				return left({
					code: `HTTP_${response.status}`,
					message: errorData.detail || `HTTP error ${response.status}`,
					details: errorData
				});
			}

			const data = await response.json();
			const validatedData = RobotsCheckResponseSchema.parse(data);

			return right(validatedData);
		} catch (error) {
			if (error instanceof Error) {
				return left({
					code: 'REQUEST_ERROR',
					message: error.message,
					details: error
				});
			}

			return left({
				code: 'UNKNOWN_ERROR',
				message: 'An unknown error occurred',
				details: error
			});
		}
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
	): z.infer<typeof SelectorConfigSchema> {
		return SelectorConfigSchema.parse({
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
		fields: z.infer<typeof ExtractionSchemaFieldSchema>[]
	): z.infer<typeof ExtractionSchemaSchema> {
		return ExtractionSchemaSchema.parse({
			name,
			base_selector: baseSelector,
			fields
		});
	}
}

// Example usage with functional error handling
export async function exampleCrawl4AIExtraction() {
	const result = await Crawl4AIClient.extractContent({
		url: 'https://example.com/article',
		selectors: Crawl4AIClient.createSelectorConfig(
			'article.content',
			['h1.title', '.article-body'],
			['.advertisement', '.related-articles']
		),
		filter_type: 'pruning',
		threshold: 0.48,
		// Add required properties with default values
		headless: true,
		verbose: false,
		use_cache: true,
		check_robots_txt: true,
		respect_rate_limits: true
	});

	// Use proper Either handling instead of fold
	if ('left' in result) {
		// Handle error case
		const error = result.left;
		console.error('Extraction failed:', error.message);
		return { success: false, error };
	} else {
		// Handle success case
		const data = result.right;
		console.log('Extraction successful');
		return { success: true, data };
	}
}
