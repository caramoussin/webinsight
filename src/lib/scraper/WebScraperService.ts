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
	metadata: z.record(z.string(), z.unknown()).optional()
});

export class WebScraperService {
	private static DEFAULT_USER_AGENT =
		'FluxRSSFabricAI/1.0 (+https://github.com/caramoussin/flux-rss-fabric-ai)';

	/**
	 * Fetch and scrape web content with intelligent handling
	 * @param config Scraping configuration
	 * @returns Parsed and extracted content
	 */
	static async scrape(config: z.infer<typeof ScraperConfigSchema>) {
		// Validate input configuration
		const validatedConfig = ScraperConfigSchema.parse(config);

		try {
			// Fetch the content with intelligent defaults
			const response = await fetch(validatedConfig.url, {
				method: 'GET',
				headers: {
					'User-Agent': validatedConfig.userAgent || this.DEFAULT_USER_AGENT,
					Accept: this.getAcceptHeader(validatedConfig.contentType)
				},
				signal: AbortSignal.timeout(validatedConfig.timeout)
			});

			// Check for successful response
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const contentType = response.headers.get('content-type') || 'text/html';
			const rawContent = await response.text();

			// Parse content based on type
			switch (validatedConfig.contentType) {
				case 'html':
					return this.parseHtmlContent(rawContent, validatedConfig.selector);
				case 'json':
					return this.parseJsonContent(rawContent);
				case 'rss':
					return this.parseRssContent(rawContent);
				default:
					throw new Error('Unsupported content type');
			}
		} catch (error) {
			console.error('Web scraping error:', error);
			throw new Error(
				`Scraping failed for ${validatedConfig.url}: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Parse HTML content using Cheerio
	 * @param htmlContent Raw HTML content
	 * @param selector Optional CSS selector to extract specific elements
	 */
	private static parseHtmlContent(htmlContent: string, selector?: string) {
		const $ = cheerio.load(htmlContent);

		// If selector is provided, extract specific elements
		const extractedText = selector
			? $(selector)
					.map((_, el) => $(el).text().trim())
					.get()
			: [];

		return ScraperResultSchema.parse({
			url: '', // URL should be passed from original config
			content: htmlContent,
			contentType: 'text/html',
			extractedText: extractedText,
			metadata: {
				textLength: htmlContent.length,
				extractedElementCount: extractedText.length
			}
		});
	}

	/**
	 * Parse JSON content
	 * @param jsonContent Raw JSON content
	 */
	private static parseJsonContent(jsonContent: string) {
		try {
			const parsedJson = JSON.parse(jsonContent);
			return ScraperResultSchema.parse({
				url: '', // URL should be passed from original config
				content: jsonContent,
				contentType: 'application/json',
				metadata: {
					jsonKeys: Object.keys(parsedJson)
				}
			});
		} catch (error) {
			throw new Error('Invalid JSON content');
		}
	}

	/**
	 * Parse RSS content (basic implementation)
	 * @param rssContent Raw RSS XML content
	 */
	private static parseRssContent(rssContent: string) {
		// Basic RSS parsing - can be expanded with a dedicated RSS parser
		const $ = cheerio.load(rssContent, { xmlMode: true });

		const items = $('item')
			.map((_, el) => ({
				title: $(el).find('title').text(),
				link: $(el).find('link').text(),
				description: $(el).find('description').text(),
				pubDate: $(el).find('pubDate').text()
			}))
			.get();

		return ScraperResultSchema.parse({
			url: '', // URL should be passed from original config
			content: rssContent,
			contentType: 'application/rss+xml',
			extractedText: items.map((item) => item.title),
			metadata: {
				itemCount: items.length,
				items: items
			}
		});
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
