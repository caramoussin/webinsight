import { z } from 'zod';
import * as cheerio from 'cheerio';

// Define a schema for scraping configuration
const ScraperConfigSchema = z.object({
	url: z.string().url('Invalid URL'),
	selector: z.string().optional(),
	contentType: z.enum(['html', 'json', 'rss']).default('html'),
	timeout: z.number().min(1000).max(30000).default(10000),
	userAgent: z.string().optional()
});

// Define a result schema
const ScraperResultSchema = z.object({
	url: z.string().url(),
	content: z.string(),
	contentType: z.string(),
	extractedText: z.array(z.string()).optional(),
	extractedLinks: z.array(z.object({
		selector: z.string(),
		href: z.string()
	})).optional(),
	metadata: z.record(z.string(), z.unknown()).optional()
});

export class WebScraperService {
	private static DEFAULT_USER_AGENT =
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

	private static getAdditionalHeaders(url: URL): Record<string, string> {
		return {
			'Accept-Language': 'en-US,en;q=0.9',
			'Accept-Encoding': 'gzip, deflate, br',
			'Sec-Fetch-Dest': 'document',
			'Sec-Fetch-Mode': 'navigate',
			'Sec-Fetch-Site': 'none',
			'Sec-Fetch-User': '?1',
			'Referer': url.origin,
			'DNT': '1'
		};
	}

	/**
	 * Fetch and scrape web content with intelligent handling
	 * @param config Scraping configuration
	 * @returns Parsed and extracted content
	 */
	static async scrape(config: z.infer<typeof ScraperConfigSchema>) {
		// Validate input configuration
		const validatedConfig = ScraperConfigSchema.parse(config);
		const url = new URL(validatedConfig.url);

		try {
			// Fetch the content with intelligent defaults
			const response = await fetch(validatedConfig.url, {
				method: 'GET',
				headers: {
					'User-Agent': validatedConfig.userAgent || this.DEFAULT_USER_AGENT,
					'Accept': this.getAcceptHeader(validatedConfig.contentType),
					...this.getAdditionalHeaders(url)
				},
				signal: AbortSignal.timeout(validatedConfig.timeout)
			});

			// More detailed error handling for different HTTP status codes
			if (response.status === 403) {
				throw new Error(`Access Forbidden (403): Unable to scrape ${validatedConfig.url}. The website may be blocking scraping attempts.`);
			}
			if (response.status === 429) {
				throw new Error(`Too Many Requests (429): Rate limit exceeded for ${validatedConfig.url}. Consider adding delays between requests.`);
			}
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}, url: ${validatedConfig.url}`);
			}

			const contentType = response.headers.get('content-type') || 'text/html';
			const content = await response.text();

			// Use Cheerio for HTML parsing
			const $ = cheerio.load(content);

			// Extract text based on selector
			const extractedText: string[] = [];
			const extractedLinks: { selector: string; href: string }[] = [];

			if (validatedConfig.selector) {
				$(validatedConfig.selector).each((index, element) => {
					const text = $(element).text().trim();
					if (text) {
						extractedText.push(text);

						// Try to find a link within or near the selected element
						const link = $(element).find('a').first().attr('href');
						if (link) {
							extractedLinks.push({
								selector: `${validatedConfig.selector}:nth-child(${index + 1})`,
								href: this.normalizeUrl(link, validatedConfig.url)
							});
						}
					}
				});
			}

			return ScraperResultSchema.parse({
				url: validatedConfig.url,
				content,
				contentType,
				extractedText,
				extractedLinks
			});
		} catch (error) {
			console.error('Scraping error:', error);
			
			// More informative error logging
			if (error instanceof Error) {
				if (error.name === 'AbortError') {
					throw new Error(`Scraping timeout for ${validatedConfig.url}. The request took too long.`);
				}
				throw error;
			}
			
			throw new Error(`Unexpected scraping error for ${validatedConfig.url}`);
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
	 */
	static async checkRobotsTxt(url: string): Promise<boolean> {
		try {
			const robotsTxtUrl = new URL('/robots.txt', url).toString();
			const response = await fetch(robotsTxtUrl);

			if (!response.ok) {
				// If no robots.txt, assume scraping is allowed
				return true;
			}

			const robotsTxtContent = await response.text();
			// Basic robots.txt parsing - can be expanded with a dedicated library
			return !robotsTxtContent.includes('Disallow: /');
		} catch {
			// If checking fails, default to allowing
			return true;
		}
	}
}

// Example usage
export async function exampleScrape() {
	try {
		const result = await WebScraperService.scrape({
			url: 'https://nitter.poast.org/soushi888/rss',
			contentType: 'rss',
			timeout: 10000
		});
		
		console.log('RSS Feed Metadata:');
		console.log('Total Items:', result.metadata?.itemCount);
		console.log('Feed Items:', result.metadata?.items);
		
		return result;
	} catch (error) {
		console.error('RSS Scraping failed:', error);
		throw error;
	}
}
