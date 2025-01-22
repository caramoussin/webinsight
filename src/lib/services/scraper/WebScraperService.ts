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
	extractedLinks: z
		.array(
			z.object({
				selector: z.string(),
				href: z.string()
			})
		)
		.optional(),
	metadata: z.record(z.string(), z.unknown()).optional()
});

export class WebScraperService {
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
	 * @returns Parsed and extracted content
	 */
	static async scrape(config: z.infer<typeof ScraperConfigSchema>) {
		const validatedConfig = ScraperConfigSchema.parse(config);
		const url = new URL(validatedConfig.url);

		// Optional delay to mimic human-like behavior
		await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));

		try {
			const response = await this.fetchWithProxy(validatedConfig.url, {
				method: 'GET',
				headers: {
					'User-Agent': validatedConfig.userAgent || this.getRandomUserAgent(),
					Accept: this.getAcceptHeader(validatedConfig.contentType),
					...this.getAdditionalHeaders(url),
					// Add more headers to appear more like a real browser
					'Cache-Control': 'max-age=0',
					Pragma: 'no-cache'
				},
				signal: AbortSignal.timeout(validatedConfig.timeout)
			});

			// More detailed error handling
			if (response.status === 403) {
				throw new Error(`Access Forbidden (403): Unable to scrape ${validatedConfig.url}. 
					Consider using a different proxy, VPN, or checking website's scraping policies.`);
			}
			if (response.status === 429) {
				throw new Error(`Rate Limited (429): Slow down requests to ${validatedConfig.url}. 
					Implement exponential backoff or use a proxy service.`);
			}
			if (response.status === 401 || response.status === 407) {
				throw new Error(`Authentication Required (${response.status}): 
					This website might require login or proxy authentication.`);
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
					throw new Error(
						`Scraping timeout for ${validatedConfig.url}. The request took too long.`
					);
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
