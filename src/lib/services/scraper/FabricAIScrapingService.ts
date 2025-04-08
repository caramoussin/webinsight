import { z } from 'zod';
import { type Either, left, right } from 'fp-ts/Either';
import { Crawl4AIClient } from './Crawl4AIClient';
import { MCPClient } from '../mcp/MCPClient';

// Define a schema for Fabric AI scraping configuration
const FabricAIScrapingConfigSchema = z.object({
	url: z.string().url('Invalid URL'),
	selector: z.string().optional(),
	contentType: z.enum(['html', 'json', 'rss']).default('html'),
	timeout: z.number().min(1000).max(30000).default(10000),
	userAgent: z.string().optional(),

	// Crawl4AI specific options
	crawl4AIOptions: z
		.object({
			filterType: z.enum(['pruning', 'bm25']).optional(),
			threshold: z.number().optional(),
			query: z.string().optional(),
			useCache: z.boolean().default(true),
			checkRobotsTxt: z.boolean().default(true),
			respectRateLimits: z.boolean().default(true)
		})
		.optional(),

	// MCP specific options
	mcpOptions: z
		.object({
			enabled: z.boolean().default(true),
			connectionConfig: z.object({
				url: z.string().url('Invalid MCP server URL'),
				vendor: z.enum(['ollama', 'openai', 'anthropic', 'local']),
				model: z.string(),
				apiKey: z.string().optional(),
				timeout: z.number().min(1000).max(60000).default(30000)
			}),
			patterns: z.array(z.string()).min(1),
			patternConfigs: z
				.record(
					z.string(),
					z.object({
						name: z.string(),
						systemPrompt: z.string().optional(),
						userPrompt: z.string().optional(),
						temperature: z.number().min(0).max(2).default(0.7),
						maxTokens: z.number().min(1).max(8192).default(2048)
					})
				)
				.optional()
		})
		.optional()
});

// Define a result schema
const FabricAIScrapingResultSchema = z.object({
	url: z.string().url(),
	content: z.string(),
	contentType: z.string(),
	extractedText: z.array(z.string()).optional(),
	extractedLinks: z
		.array(
			z.object({
				selector: z.string(),
				href: z.string()
			})
		)
		.optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),

	// Crawl4AI specific fields
	markdown: z.string().optional(),
	rawMarkdown: z.string().optional(),
	extractedData: z.any().optional(),

	// Fabric AI specific fields
	fabricAnalysis: z
		.object({
			summary: z.string().optional(),
			entities: z.array(z.string()).optional(),
			sentiment: z.string().optional(),
			topics: z.array(z.string()).optional(),
			keywords: z.array(z.string()).optional(),
			aiGeneratedContent: z.record(z.string(), z.string()).optional()
		})
		.optional()
});

// Error type for FabricAIScrapingService
export type FabricAIScrapingError = {
	code: string;
	message: string;
	details?: unknown;
};

/**
 * FabricAIScrapingService integrates Crawl4AI with Fabric AI via MCP
 * for intelligent content extraction and analysis
 */
export class FabricAIScrapingService {
	/**
	 * Scrape and analyze content using Crawl4AI and Fabric AI via MCP
	 * @param config Scraping configuration
	 * @returns Either an error or the scraped and analyzed content
	 */
	static async scrapeAndAnalyze(
		config: z.infer<typeof FabricAIScrapingConfigSchema>
	): Promise<Either<FabricAIScrapingError, z.infer<typeof FabricAIScrapingResultSchema>>> {
		try {
			const validatedConfig = FabricAIScrapingConfigSchema.parse(config);

			// Step 1: Extract content using Crawl4AI
			const crawl4AIResult = await Crawl4AIClient.extractContent({
				url: validatedConfig.url,
				selectors: validatedConfig.selector
					? Crawl4AIClient.createSelectorConfig(validatedConfig.selector)
					: undefined,
				filter_type: validatedConfig.crawl4AIOptions?.filterType,
				threshold: validatedConfig.crawl4AIOptions?.threshold,
				query: validatedConfig.crawl4AIOptions?.query,
				// Ensure required properties have default values
				use_cache: validatedConfig.crawl4AIOptions?.useCache ?? true,
				check_robots_txt: validatedConfig.crawl4AIOptions?.checkRobotsTxt ?? true,
				respect_rate_limits: validatedConfig.crawl4AIOptions?.respectRateLimits ?? true,
				headless: true,
				verbose: false,
				user_agent: validatedConfig.userAgent
			});

			// Handle Crawl4AI error
			if ('left' in crawl4AIResult) {
				const error = crawl4AIResult.left;
				return left({
					code: `CRAWL4AI_${error.code}`,
					message: error.message,
					details: error.details
				});
			}

			// Extract content from Crawl4AI result
			const extractedContent = crawl4AIResult.right;
			const markdown = extractedContent.content.markdown;

			// Prepare base result without Fabric AI analysis
			const baseResult: z.infer<typeof FabricAIScrapingResultSchema> = {
				url: validatedConfig.url,
				content: extractedContent.content.html || markdown,
				contentType: 'text/html',
				extractedText: [markdown],
				extractedLinks: this.extractLinksFromMarkdown(markdown),
				metadata: extractedContent.metadata,
				markdown: markdown,
				rawMarkdown: extractedContent.content.raw_markdown,
				extractedData: extractedContent.extracted_data
			};

			// Step 2: If MCP is enabled, analyze content using Fabric AI via MCP
			if (validatedConfig.mcpOptions?.enabled && validatedConfig.mcpOptions.connectionConfig) {
				return await this.analyzeThroughFabricAI(markdown, baseResult, validatedConfig.mcpOptions);
			}

			// If MCP is not enabled, return the base result
			return right(FabricAIScrapingResultSchema.parse(baseResult));
		} catch (error) {
			if (error instanceof z.ZodError) {
				return left({
					code: 'VALIDATION_ERROR',
					message: 'Invalid scraping configuration',
					details: error.format()
				});
			}

			if (error instanceof Error) {
				return left({
					code: 'SCRAPING_ERROR',
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
	 * Analyze content through Fabric AI via MCP
	 * @param content Content to analyze
	 * @param baseResult Base result to extend with analysis
	 * @param mcpOptions MCP options
	 * @returns Either an error or the analyzed content
	 */
	private static async analyzeThroughFabricAI(
		content: string,
		baseResult: z.infer<typeof FabricAIScrapingResultSchema>,
		mcpOptions: NonNullable<z.infer<typeof FabricAIScrapingConfigSchema>['mcpOptions']>
	): Promise<Either<FabricAIScrapingError, z.infer<typeof FabricAIScrapingResultSchema>>> {
		try {
			// Execute pattern sequence through MCP
			const mcpResult = await MCPClient.executePatternSequence(
				mcpOptions.patterns,
				content,
				mcpOptions.connectionConfig,
				mcpOptions.patternConfigs
			);

			// Handle MCP error
			if ('left' in mcpResult) {
				const error = mcpResult.left;
				return left({
					code: `MCP_${error.code}`,
					message: error.message,
					details: error.details
				});
			}

			// Parse MCP response as JSON if possible
			let fabricAnalysis;
			try {
				fabricAnalysis = JSON.parse(mcpResult.right.content);
			} catch {
				// If not valid JSON, use as plain text
				fabricAnalysis = {
					aiGeneratedContent: {
						analysis: mcpResult.right.content
					}
				};
			}

			// Extend base result with Fabric AI analysis
			return right(
				FabricAIScrapingResultSchema.parse({
					...baseResult,
					fabricAnalysis
				})
			);
		} catch (error) {
			if (error instanceof Error) {
				return left({
					code: 'FABRIC_AI_ERROR',
					message: error.message,
					details: error
				});
			}

			return left({
				code: 'UNKNOWN_ERROR',
				message: 'An unknown error occurred during Fabric AI analysis',
				details: error
			});
		}
	}

	/**
	 * Extract links from markdown content
	 * @param markdown Markdown content
	 * @returns Array of extracted links
	 */
	private static extractLinksFromMarkdown(markdown: string): { selector: string; href: string }[] {
		const links: { selector: string; href: string }[] = [];
		const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
		let match;

		while ((match = linkRegex.exec(markdown)) !== null) {
			links.push({
				selector: `markdown-link-${links.length}`,
				href: match[2]
			});
		}

		return links;
	}
}

// Example usage with functional error handling
export async function exampleFabricAIScraping() {
	const result = await FabricAIScrapingService.scrapeAndAnalyze({
		url: 'https://example.com/article',
		selector: 'article.content',
		contentType: 'html',
		timeout: 15000,
		crawl4AIOptions: {
			filterType: 'pruning',
			threshold: 0.5,
			useCache: true,
			checkRobotsTxt: true,
			respectRateLimits: true
		},
		mcpOptions: {
			enabled: true,
			connectionConfig: {
				url: 'http://localhost:11434',
				vendor: 'ollama',
				model: 'llama2',
				timeout: 30000
			},
			patterns: ['summarize', 'extract-entities'],
			patternConfigs: {
				summarize: {
					name: 'summarize',
					temperature: 0.3,
					maxTokens: 1024
				},
				'extract-entities': {
					name: 'extract-entities',
					temperature: 0.1,
					maxTokens: 512
				}
			}
		}
	});

	// Use proper Either handling
	if ('left' in result) {
		// Handle error case
		const error = result.left;
		console.error('Fabric AI scraping failed:', error.message);
		return { success: false, error };
	} else {
		// Handle success case
		const data = result.right;
		console.log('Fabric AI scraping successful');
		return { success: true, data };
	}
}
