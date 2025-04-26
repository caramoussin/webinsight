import * as Effect from '@effect/io/Effect';
import * as Duration from '@effect/data/Duration';
import { ServiceError, validateWithSchema } from '../../utils/effect';
import { Crawl4AIClient } from './Crawl4AIClient';
import * as cheerio from 'cheerio';
import * as S from '@effect/schema/Schema';

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
  static scrape(config: ScraperConfig): Effect.Effect<never, ServiceError, ScraperResult> {
    return Effect.gen(function* (_) {
      const validatedConfig = yield* _(validateWithSchema(ScraperConfigSchema, config));

      // If Crawl4AI is enabled, use it for content extraction
      if (validatedConfig.useCrawl4AI) {
        return yield* _(WebScrapingService.scrapeWithCrawl4AI(validatedConfig));
      }

      // Otherwise use the default scraping method
      return yield* _(WebScrapingService.scrapeWithDefault(validatedConfig));
    });
  }

  private static async createSelectorConfig(selector: string) {
    const result = await Effect.runPromise(Crawl4AIClient.createSelectorConfig(selector));
    return result;
  }

  /**
   * Scrape content using Crawl4AI
   */
  private static scrapeWithCrawl4AI(
    config: ScraperConfig
  ): Effect.Effect<never, ServiceError, ScraperResult> {
    return Effect.gen(function* (_) {
      const selectorConfig = config.selector
        ? yield* _(
            Effect.promise(() => WebScrapingService.createSelectorConfig(config.selector!)).pipe(
              Effect.orElse(() => Effect.succeed(undefined))
            )
          )
        : undefined;

      const crawl4AIResult = yield* _(
        Crawl4AIClient.extractContent({
          url: config.url,
          selectors: selectorConfig,
          filter_type: config.crawl4AIOptions?.filterType,
          threshold: config.crawl4AIOptions?.threshold,
          query: config.crawl4AIOptions?.query,
          use_cache: config.crawl4AIOptions?.useCache ?? true,
          check_robots_txt: config.crawl4AIOptions?.checkRobotsTxt ?? true,
          respect_rate_limits: config.crawl4AIOptions?.respectRateLimits ?? true,
          headless: true,
          verbose: false,
          user_agent: config.userAgent || WebScrapingService.getRandomUserAgent()
        })
      );

      // Extract links from markdown content if available
      const extractedLinks = WebScrapingService.extractLinksFromMarkdown(
        crawl4AIResult.content.markdown
      );

      return yield* _(
        validateWithSchema(ScraperResultSchema, {
          url: config.url,
          content: crawl4AIResult.content.html || crawl4AIResult.content.markdown,
          contentType: 'text/html',
          extractedText: [crawl4AIResult.content.markdown],
          extractedLinks,
          metadata: crawl4AIResult.metadata,
          markdown: crawl4AIResult.content.markdown,
          rawMarkdown: crawl4AIResult.content.raw_markdown,
          extractedData: crawl4AIResult.extracted_data
        })
      );
    });
  }

  /**
   * Scrape content using the default method
   */
  private static scrapeWithDefault(
    config: ScraperConfig
  ): Effect.Effect<never, ServiceError, ScraperResult> {
    return Effect.gen(function* (_) {
      const url = new URL(config.url);

      // Optional delay to mimic human-like behavior
      yield* _(Effect.sleep(Duration.millis(Math.random() * 1000)));

      const response = yield* _(
        Effect.tryPromise({
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
          catch: (error) => new ServiceError('FETCH_ERROR', 'Failed to fetch content', error)
        })
      );

      if (!response.ok) {
        return yield* _(
          Effect.fail(
            new ServiceError(
              `HTTP_${response.status}`,
              `HTTP error! status: ${response.status}, url: ${config.url}`
            )
          )
        );
      }

      const contentType = response.headers.get('content-type') || 'text/html';
      const content = yield* _(
        Effect.tryPromise({
          try: () => response.text(),
          catch: (error) =>
            new ServiceError('CONTENT_ERROR', 'Failed to read response content', error)
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

  // private static scrapWithPuppeteer(config: ScraperConfig): Effect.Effect<never, ServiceError, ScraperResult> {

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
  static checkRobotsTxt(
    url: string,
    userAgent?: string
  ): Effect.Effect<never, ServiceError, boolean> {
    return Effect.gen(function* (_) {
      const result = yield* _(Crawl4AIClient.checkRobotsTxt(url, userAgent));
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
export const exampleScrape = Effect.gen(function* (_) {
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
export const exampleCrawl4AIScrape = Effect.gen(function* (_) {
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
