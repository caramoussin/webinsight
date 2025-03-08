import { z } from 'zod';
import { type Either, left, right } from 'fp-ts/Either';
import { Crawl4AIClient } from './Crawl4AIClient';
import * as cheerio from 'cheerio';

// Define a schema for scraping configuration
const ScraperConfigSchema = z.object({
	url: z.string().url('Invalid URL'),
	selector: z.string().optional(),
	contentType: z.enum(['html', 'json', 'rss']).default('html'),
	timeout: z.number().min(1000).max(30000).default(10000),
	userAgent: z.string().optional(),
	// Crawl4AI specific options
	useCrawl4AI: z.boolean().default(false),
	crawl4AIOptions: z
		.object({
			filterType: z.enum(['pruning', 'bm25']).optional(),
			threshold: z.number().optional(),
			query: z.string().optional(),
			useCache: z.boolean().default(true),
			checkRobotsTxt: z.boolean().default(true),
			respectRateLimits: z.boolean().default(true)
		})
		.optional()
});

// Define a result schema
const ScraperResultSchema = z.object({
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
	extractedData: z.any().optional()
});

// Error type for WebScrapingService
export type ScrapingError = {
	code: string;
	message: string;
	details?: unknown;
};

export class WebScrapingService {
	private static USER_AGENTS = [
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
		'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
	];

	private static PROXY_LIST: string[] = [
		// Example proxy list - replace with actual proxies
		'http://proxy1.example.com:8080',
		'http://proxy2.example.com:8080',
		'http://proxy3.example.com:8080'
	];

	private static getRandomUserAgent(): string {
		return this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)];
	}

	private static getRandomProxy(): string | null {
		return this.PROXY_LIST.length > 0
			? this.PROXY_LIST[Math.floor(Math.random() * this.PROXY_LIST.length)]
			: null;
	}

	private static getAdditionalHeaders(url: URL): Record<string, string> {
		return {
			'Accept-Language': 'en-US,en;q=0.9',
			'Accept-Encoding': 'gzip, deflate, br',
			'Sec-Fetch-Dest': 'document',
			'Sec-Fetch-Mode': 'navigate',
			'Sec-Fetch-Site': 'none',
			'Sec-Fetch-User': '?1',
			Referer: url.origin,
			DNT: '1',
			Accept:
				'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
			Connection: 'keep-alive',
			'Upgrade-Insecure-Requests': '1'
		};
	}

	private static async fetchWithProxy(url: string, options: RequestInit): Promise<Response> {
		const proxy = this.getRandomProxy();

		if (!proxy) {
			return fetch(url, options);
		}

		// Note: This is a placeholder. Actual proxy implementation requires
		// additional libraries or more complex fetch configuration
		console.warn('Proxy usage is a placeholder and not fully implemented');
		return fetch(url, options);
	}

	/**
	 * Fetch and scrape web content with intelligent handling
	 * @param config Scraping configuration
	 * @returns Either an error or the parsed and extracted content
	 */
	static async scrape(
		config: z.infer<typeof ScraperConfigSchema>
	): Promise<Either<ScrapingError, z.infer<typeof ScraperResultSchema>>> {
		try {
			const validatedConfig = ScraperConfigSchema.parse(config);

			// If Crawl4AI is enabled, use it for content extraction
			if (validatedConfig.useCrawl4AI) {
				return this.scrapWithCrawl4AI(validatedConfig);
			}

			// Otherwise use the default scraping method
			return this.scrapeWithDefault(validatedConfig);
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
	 * Scrape content using Crawl4AI
	 * @param config Validated scraping configuration
	 * @returns Either an error or the scraped content
	 */
	private static async scrapWithCrawl4AI(
		config: z.infer<typeof ScraperConfigSchema>
	): Promise<Either<ScrapingError, z.infer<typeof ScraperResultSchema>>> {
		try {
			// Convert WebScrapingService config to Crawl4AI options
			const crawl4AIResult = await Crawl4AIClient.extractContent({
				url: config.url,
				selectors: config.selector
					? Crawl4AIClient.createSelectorConfig(config.selector)
					: undefined,
				filter_type: config.crawl4AIOptions?.filterType,
				threshold: config.crawl4AIOptions?.threshold,
				query: config.crawl4AIOptions?.query,
				// Ensure required properties have default values
				use_cache: config.crawl4AIOptions?.useCache ?? true,
				check_robots_txt: config.crawl4AIOptions?.checkRobotsTxt ?? true,
				respect_rate_limits: config.crawl4AIOptions?.respectRateLimits ?? true,
				headless: true,
				verbose: false,
				user_agent: config.userAgent || this.getRandomUserAgent()
			});

			// Handle Crawl4AI error
			if ('left' in crawl4AIResult) {
				const error = crawl4AIResult.left;
				return left({
					code: error.code,
					message: error.message,
					details: error.details
				});
			}

			// Handle Crawl4AI success
			const data = crawl4AIResult.right;
			// Extract links from markdown content if available
			const extractedLinks = this.extractLinksFromMarkdown(data.content.markdown);

			return right(
				ScraperResultSchema.parse({
					url: config.url,
					content: data.content.html || data.content.markdown,
					contentType: 'text/html',
					extractedText: [data.content.markdown],
					extractedLinks,
					metadata: data.metadata,
					markdown: data.content.markdown,
					rawMarkdown: data.content.raw_markdown,
					extractedData: data.extracted_data
				})
			);
		} catch (error) {
			if (error instanceof Error) {
				return left({
					code: 'CRAWL4AI_ERROR',
					message: error.message,
					details: error
				});
			}

			return left({
				code: 'UNKNOWN_ERROR',
				message: 'An unknown error occurred with Crawl4AI',
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

	/**
	 * Scrape content using the default method
	 * @param config Validated scraping configuration
	 * @returns Either an error or the scraped content
	 */
	private static async scrapeWithDefault(
		config: z.infer<typeof ScraperConfigSchema>
	): Promise<Either<ScrapingError, z.infer<typeof ScraperResultSchema>>> {
		const url = new URL(config.url);

		// Optional delay to mimic human-like behavior
		await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));

		try {
			const response = await this.fetchWithProxy(config.url, {
				method: 'GET',
				headers: {
					'User-Agent': config.userAgent || this.getRandomUserAgent(),
					Accept: this.getAcceptHeader(config.contentType),
					...this.getAdditionalHeaders(url),
					// Add more headers to appear more like a real browser
					'Cache-Control': 'max-age=0',
					Pragma: 'no-cache'
				},
				signal: AbortSignal.timeout(config.timeout)
			});

			// More detailed error handling
			if (response.status === 403) {
				return left({
					code: 'FORBIDDEN',
					message: `Access Forbidden (403): Unable to scrape ${config.url}. Consider using a different proxy, VPN, or checking website's scraping policies.`
				});
			}
			if (response.status === 429) {
				return left({
					code: 'RATE_LIMITED',
					message: `Rate Limited (429): Slow down requests to ${config.url}. Implement exponential backoff or use a proxy service.`
				});
			}
			if (response.status === 401 || response.status === 407) {
				return left({
					code: 'AUTHENTICATION_REQUIRED',
					message: `Authentication Required (${response.status}): This website might require login or proxy authentication.`
				});
			}
			if (!response.ok) {
				return left({
					code: `HTTP_${response.status}`,
					message: `HTTP error! status: ${response.status}, url: ${config.url}`
				});
			}

			const contentType = response.headers.get('content-type') || 'text/html';
			const content = await response.text();

			// Use Cheerio for HTML parsing
			const $ = cheerio.load(content);

			// Extract text based on selector
			const extractedText: string[] = [];
			const extractedLinks: { selector: string; href: string }[] = [];

			if (config.selector) {
				$(config.selector).each((index, element) => {
					const text = $(element).text().trim();
					if (text) {
						extractedText.push(text);

						// Try to find a link within or near the selected element
						const link = $(element).find('a').first().attr('href');
						if (link) {
							extractedLinks.push({
								selector: `${config.selector}:nth-child(${index + 1})`,
								href: this.normalizeUrl(link, config.url)
							});
						}
					}
				});
			}

			return right(
				ScraperResultSchema.parse({
					url: config.url,
					content,
					contentType,
					extractedText,
					extractedLinks
				})
			);
		} catch (error) {
			if (error instanceof Error) {
				if (error.name === 'AbortError') {
					return left({
						code: 'TIMEOUT',
						message: `Scraping timeout for ${config.url}. The request took too long.`
					});
				}

				return left({
					code: 'REQUEST_ERROR',
					message: error.message,
					details: error
				});
			}

			return left({
				code: 'UNKNOWN_ERROR',
				message: `Unexpected scraping error for ${config.url}`,
				details: error
			});
		}
	}

	// Helper method to normalize relative URLs
	private static normalizeUrl(url: string, baseUrl: string): string {
		try {
			return new URL(url, baseUrl).toString();
		} catch {
			return url;
		}
	}

	/**
	 * Get appropriate Accept header based on content type
	 */
	private static getAcceptHeader(contentType: string): string {
		switch (contentType) {
			case 'html':
				return 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
			case 'json':
				return 'application/json,text/plain;q=0.9,*/*;q=0.8';
			case 'rss':
				return 'application/rss+xml,application/xml;q=0.9,*/*;q=0.8';
			default:
				return '*/*';
		}
	}

	/**
	 * Respect robots.txt (basic implementation)
	 * @param url URL to check
	 * @returns Either an error or the robots check result
	 */
	static async checkRobotsTxt(
		url: string,
		userAgent?: string
	): Promise<Either<ScrapingError, boolean>> {
		try {
			// If Crawl4AI is available, use its robots.txt checker
			const crawl4AIResult = await Crawl4AIClient.checkRobotsTxt(
				url,
				userAgent || this.getRandomUserAgent()
			);

			// Use proper Either handling instead of fold
			if ('left' in crawl4AIResult) {
				// Handle Crawl4AI error - fall back to basic implementation
				return this.basicRobotsTxtCheck(url);
			} else {
				// Handle Crawl4AI success
				const data = crawl4AIResult.right;
				return right(data.allowed);
			}
		} catch (error) {
			// Fall back to basic implementation if Crawl4AI fails
			return this.basicRobotsTxtCheck(url);
		}
	}

	/**
	 * Basic robots.txt checking implementation
	 * @param url URL to check
	 * @returns Either an error or the robots check result
	 */
	private static async basicRobotsTxtCheck(url: string): Promise<Either<ScrapingError, boolean>> {
		try {
			// Parse the URL to get the origin
			const parsedUrl = new URL(url);
			const robotsUrl = new URL('/robots.txt', parsedUrl.origin).toString();

			// Fetch the robots.txt file
			const response = await fetch(robotsUrl);

			// If robots.txt doesn't exist or can't be accessed, assume scraping is allowed
			if (!response.ok) {
				return right(true);
			}

			// Get robots.txt content and check if it disallows all paths
			const robotsTxtContent = await response.text();
			return right(!robotsTxtContent.includes('Disallow: /'));
		} catch (error: unknown) {
			// Handle specific errors
			if (error instanceof Error) {
				return left({
					code: 'ROBOTS_CHECK_ERROR',
					message: error.message,
					details: error
				});
			}

			// If checking fails for unknown reasons, default to allowing
			return right(true);
		}
	}
}

// Example usage with functional error handling
export async function exampleScrape() {
	const result = await WebScrapingService.scrape({
		url: 'https://nitter.poast.org/soushi888/rss',
		contentType: 'rss',
		timeout: 10000,
		useCrawl4AI: false // Set to true to use Crawl4AI
	});

	if ('left' in result) {
		// Handle error case
		const error = result.left;
		console.error('RSS Scraping failed:', error.message);
		return { success: false, error };
	} else {
		// Handle success case
		const data = result.right;
		console.log('RSS Feed Metadata:');
		console.log('Total Items:', data.metadata?.itemCount);
		console.log('Feed Items:', data.metadata?.items);
		return { success: true, data };
	}
}

// Example usage with Crawl4AI
export async function exampleCrawl4AIScrape() {
	const result = await WebScrapingService.scrape({
		url: 'https://example.com/article',
		contentType: 'html',
		timeout: 10000,
		useCrawl4AI: true,
		crawl4AIOptions: {
			filterType: 'pruning',
			threshold: 0.48,
			useCache: true,
			checkRobotsTxt: true,
			respectRateLimits: true
		}
	});

	// Handle the Either type result
	if ('left' in result) {
		// Handle error case
		const error = result.left;
		console.error('Crawl4AI Scraping failed:', error.message);
		return { success: false, error };
	} else {
		// Handle success case
		const data = result.right;
		console.log('Crawl4AI Scraping successful');
		console.log('Markdown content:', data.markdown?.substring(0, 100) + '...');
		return { success: true, data };
	}
}
