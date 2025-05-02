import { Effect as E, Duration, Schema as S } from 'effect';
import { ServiceError, validateWithSchema } from '../../utils/effect';
import { MCPCrawl4AIClient } from './MCPCrawl4AIClient';
import * as cheerio from 'cheerio';

// Define schemas for scraping configuration
const ScraperConfigSchema = S.Struct({
  url: S.String.pipe(S.pattern(/^https?:\/\/.+/)),
  selector: S.optional(S.String),
  contentType: S.Union(S.Literal('html'), S.Literal('json'), S.Literal('rss')),
  timeout: S.Number.pipe(S.between(1000, 30000)),
  userAgent: S.optional(S.String),
  // Crawl4AI specific options
  useCrawl4AI: S.Boolean,
  crawl4AIOptions: S.optional(
    S.Struct({
      filterType: S.optional(S.Union(S.Literal('pruning'), S.Literal('bm25'))),
      threshold: S.optional(S.Number),
      query: S.optional(S.String),
      useCache: S.Boolean,
      checkRobotsTxt: S.Boolean,
      respectRateLimits: S.Boolean
    })
  )
});

const LinkSchema = S.Struct({
  selector: S.String,
  href: S.String
});

const MetadataSchema = S.Record({ key: S.String, value: S.Unknown });

const ScraperResultSchema = S.Struct({
  url: S.String.pipe(S.pattern(/^https?:\/\/.+/)),
  content: S.String,
  contentType: S.String,
  extractedText: S.optional(S.Array(S.String)),
  extractedLinks: S.optional(S.Array(LinkSchema)),
  metadata: S.optional(MetadataSchema),
  markdown: S.optional(S.String),
  rawMarkdown: S.optional(S.String),
  extractedData: S.optional(S.Unknown)
});

// Type inference from schemas
export type ScraperConfig = S.Schema.Type<typeof ScraperConfigSchema>;
export type ScraperResult = S.Schema.Type<typeof ScraperResultSchema>;

export class WebScrapingService {
  private static readonly USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
  ];

  private static getRandomUserAgent(): string {
    return this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)];
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

  /**
   * Fetch and scrape web content with intelligent handling
   */
  static scrape(config: ScraperConfig): E.Effect<ScraperResult, ServiceError> {
    return E.gen(function* (_) {
      const validatedConfig = yield* _(validateWithSchema(ScraperConfigSchema, config));

      // If Crawl4AI is enabled, use it for content extraction
      if (validatedConfig.useCrawl4AI) {
        return yield* _(WebScrapingService.scrapeWithCrawl4AI(validatedConfig));
      }

      // Otherwise use the default scraping method
      return yield* _(WebScrapingService.scrapeWithDefault(validatedConfig));
    });
  }

  private static createSelectorConfig(selector: string) {
    return MCPCrawl4AIClient.createSelectorConfig(selector);
  }

  /**
   * Scrape content using Crawl4AI
   */
  private static scrapeWithCrawl4AI(config: ScraperConfig): E.Effect<ScraperResult, ServiceError> {
    return E.gen(function* (_) {
      const selectorConfig = config.selector
        ? WebScrapingService.createSelectorConfig(config.selector)
        : undefined;

      const crawl4AIOptions = config.crawl4AIOptions || {
        useCache: true,
        checkRobotsTxt: true,
        respectRateLimits: true
      };

      const extractionResult = yield* _(
        MCPCrawl4AIClient.extractContent({
          url: config.url,
          selectors: selectorConfig,
          headless: true,
          verbose: false,
          use_cache: crawl4AIOptions.useCache,
          check_robots_txt: crawl4AIOptions.checkRobotsTxt,
          respect_rate_limits: crawl4AIOptions.respectRateLimits,
          ...(crawl4AIOptions.filterType && { filter_type: crawl4AIOptions.filterType }),
          ...(crawl4AIOptions.threshold !== undefined && { threshold: crawl4AIOptions.threshold }),
          ...(crawl4AIOptions.query && { query: crawl4AIOptions.query }),
          ...(config.userAgent && { user_agent: config.userAgent })
        })
      );

      // Extract links from markdown content if available
      const extractedLinks = WebScrapingService.extractLinksFromMarkdown(
        extractionResult.content.markdown
      );

      return yield* _(
        validateWithSchema(ScraperResultSchema, {
          url: config.url,
          content: extractionResult.content.html || extractionResult.content.markdown,
          contentType: 'text/html',
          extractedText: [extractionResult.content.markdown],
          extractedLinks,
          metadata: extractionResult.metadata,
          markdown: extractionResult.content.markdown,
          rawMarkdown: extractionResult.content.raw_markdown,
          extractedData: extractionResult.extracted_data
        })
      );
    });
  }

  /**
   * Scrape content using the default method
   */
  private static scrapeWithDefault(config: ScraperConfig): E.Effect<ScraperResult, ServiceError> {
    return E.gen(function* (_) {
      const url = new URL(config.url);

      // Optional delay to mimic human-like behavior
      yield* _(E.sleep(Duration.millis(Math.random() * 1000)));

      const response = yield* _(
        E.tryPromise({
          try: () =>
            fetch(config.url, {
              method: 'GET',
              headers: {
                'User-Agent': config.userAgent || WebScrapingService.getRandomUserAgent(),
                Accept: WebScrapingService.getAcceptHeader(config.contentType),
                ...WebScrapingService.getAdditionalHeaders(url)
              },
              signal: AbortSignal.timeout(config.timeout)
            }),
          catch: (error) =>
            new ServiceError({
              code: 'FETCH_ERROR',
              message: 'Failed to fetch content',
              cause: error
            })
        })
      );

      if (!response.ok) {
        return yield* _(
          E.fail(
            new ServiceError({
              code: `HTTP_${response.status}`,
              message: `HTTP error! status: ${response.status}, url: ${config.url}`
            })
          )
        );
      }

      const contentType = response.headers.get('content-type') || 'text/html';
      const content = yield* _(
        E.tryPromise({
          try: () => response.text(),
          catch: (error) =>
            new ServiceError({
              code: 'CONTENT_ERROR',
              message: 'Failed to read response content',
              cause: error
            })
        })
      );

      // Use Cheerio for HTML parsing
      const $ = cheerio.load(content);
      const extractedText: string[] = [];
      const extractedLinks: { selector: string; href: string }[] = [];

      if (config.selector) {
        $(config.selector).each((index, element) => {
          const text = $(element).text().trim();
          if (text) {
            extractedText.push(text);
            const link = $(element).find('a').first().attr('href');
            if (link) {
              extractedLinks.push({
                selector: `${config.selector}:nth-child(${index + 1})`,
                href: WebScrapingService.normalizeUrl(link, config.url)
              });
            }
          }
        });
      }

      return yield* _(
        validateWithSchema(ScraperResultSchema, {
          url: config.url,
          content,
          contentType,
          extractedText,
          extractedLinks
        })
      );
    });
  }

  // private static scrapWithPuppeteer(config: ScraperConfig): E.Effect<never, ServiceError, ScraperResult> {

  // }

  /**
   * Extract links from markdown content
   */
  private static extractLinksFromMarkdown(markdown: string): { selector: string; href: string }[] {
    const links: { selector: string; href: string }[] = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(markdown)) !== null) {
      links.push({
        selector: `markdown-link:${match[1]}`,
        href: match[2]
      });
    }

    return links;
  }

  /**
   * Get appropriate Accept header based on content type
   */
  private static getAcceptHeader(contentType: string): string {
    switch (contentType) {
      case 'json':
        return 'application/json';
      case 'rss':
        return 'application/rss+xml, application/xml, text/xml';
      default:
        return 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
    }
  }

  /**
   * Check robots.txt rules
   */
  static checkRobotsTxt(url: string, userAgent?: string): E.Effect<boolean, ServiceError> {
    return E.gen(function* (_) {
      const result = yield* _(MCPCrawl4AIClient.checkRobotsTxt(url, userAgent));
      return result.allowed;
    });
  }

  // Helper method to normalize relative URLs
  private static normalizeUrl(href: string, baseUrl: string): string {
    try {
      return new URL(href, baseUrl).toString();
    } catch {
      return href;
    }
  }
}

// Example usage with Effect
export const exampleScrape = E.gen(function* (_) {
  const result = yield* _(
    WebScrapingService.scrape({
      url: 'https://nitter.poast.org/soushi888/rss',
      contentType: 'rss',
      timeout: 10000,
      useCrawl4AI: false
    })
  );

  console.log('RSS Feed scraped successfully');
  return result;
});

// Example usage with Crawl4AI
export const exampleCrawl4AIScrape = E.gen(function* (_) {
  const result = yield* _(
    WebScrapingService.scrape({
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
    })
  );

  console.log('Crawl4AI Scraping successful');
  return result;
});
