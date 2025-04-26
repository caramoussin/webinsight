import type { Effect } from '@effect/io/Effect';
import * as E from '@effect/io/Effect';
import * as S from '@effect/schema/Schema';
import { WebScrapingService } from './WebScrapingService';
import { MCPClient } from '../mcp/MCPClient';
import { validateWithSchema } from '../../utils/effect';

// Define schemas using Effect Schema
const FabricAIScrapingConfigSchema = S.Struct({
  url: S.String.pipe(S.pattern(/^https?:\/\/.+/)),
  selector: S.optional(S.String),
  contentType: S.Union(S.Literal('html'), S.Literal('json'), S.Literal('rss')),
  timeout: S.Number.pipe(S.between(1000, 30000)),
  userAgent: S.optional(S.String),

  // Web scraping specific options
  scrapingOptions: S.optional(
    S.Struct({
      filterType: S.optional(S.Union(S.Literal('pruning'), S.Literal('bm25'))),
      threshold: S.optional(S.Number),
      query: S.optional(S.String),
      useCache: S.Boolean,
      checkRobotsTxt: S.Boolean,
      respectRateLimits: S.Boolean
    })
  ),

  // MCP specific options
  mcpOptions: S.optional(
    S.Struct({
      enabled: S.Boolean,
      connectionConfig: S.Struct({
        url: S.String.pipe(S.pattern(/^https?:\/\/.+/)),
        vendor: S.Union(
          S.Literal('ollama'),
          S.Literal('openai'),
          S.Literal('anthropic'),
          S.Literal('local')
        ),
        model: S.String,
        apiKey: S.optional(S.String),
        timeout: S.Number.pipe(S.between(1000, 60000))
      }),
      patterns: S.Array(S.String),
      patternConfigs: S.optional(
        S.Record({
          key: S.String,
          value: S.Struct({
            name: S.String,
            systemPrompt: S.optional(S.String),
            userPrompt: S.optional(S.String),
            temperature: S.Number.pipe(S.between(0, 2)),
            maxTokens: S.Number.pipe(S.between(1, 8192))
          })
        })
      )
    })
  )
});

const LinkSchema = S.Struct({
  selector: S.String,
  href: S.String
});

const FabricAnalysisSchema = S.Struct({
  summary: S.optional(S.String),
  entities: S.optional(S.Array(S.String)),
  sentiment: S.optional(S.String),
  topics: S.optional(S.Array(S.String)),
  keywords: S.optional(S.Array(S.String)),
  aiGeneratedContent: S.optional(
    S.Record({
      key: S.String,
      value: S.String
    })
  )
});

export const FabricAIScrapingResultSchema = S.Struct({
  url: S.String.pipe(S.pattern(/^https?:\/\/.+/)),
  content: S.String,
  contentType: S.String,
  extractedText: S.optional(S.Array(S.String)),
  extractedLinks: S.optional(S.Array(LinkSchema)),
  metadata: S.optional(S.Record({ key: S.String, value: S.Unknown })),
  markdown: S.optional(S.String),
  rawMarkdown: S.optional(S.String),
  extractedData: S.optional(S.Unknown),
  fabricAnalysis: S.optional(FabricAnalysisSchema)
});

// Type inference from schemas
type FabricAIScrapingConfig = S.Schema.Type<typeof FabricAIScrapingConfigSchema>;
type FabricAIScrapingResult = S.Schema.Type<typeof FabricAIScrapingResultSchema>;
type FabricAIScrapingError = {
  readonly code: 'VALIDATION_ERROR' | 'SCRAPING_ERROR' | 'FABRIC_AI_ERROR' | 'UNKNOWN_ERROR';
  readonly message: string;
  readonly details?: string;
};

/**
 * FabricAIScrapingService integrates web scraping with Fabric AI via MCP
 * for intelligent content extraction and analysis
 */
export class FabricAIScrapingService {
  /**
   * Scrapes content from a URL and optionally analyzes it through Fabric AI
   */
  static scrapeAndAnalyze(
    config: FabricAIScrapingConfig
  ): Effect<never, FabricAIScrapingError, FabricAIScrapingResult> {
    return E.flatten(
      E.gen(function* ($) {
        try {
          const validatedConfig = yield* $(
            E.mapError(
              validateWithSchema(FabricAIScrapingConfigSchema, config),
              (error): FabricAIScrapingError => ({
                code: 'VALIDATION_ERROR',
                message: 'Invalid configuration',
                details: String(error)
              })
            )
          );

          // Step 1: Extract content using WebScrapingService
          const scrapingResult = yield* $(
            E.mapError(
              WebScrapingService.scrape({
                url: validatedConfig.url,
                selector: validatedConfig.selector,
                contentType: validatedConfig.contentType,
                timeout: validatedConfig.timeout,
                userAgent: validatedConfig.userAgent,
                useCrawl4AI: true,
                crawl4AIOptions: validatedConfig.scrapingOptions
              }),
              (error): FabricAIScrapingError => ({
                code: 'SCRAPING_ERROR',
                message: error.message,
                details: error.cause ? String(error.cause) : undefined
              })
            )
          );

          // Prepare base result
          const baseResult: FabricAIScrapingResult = {
            url: validatedConfig.url,
            content: scrapingResult.content,
            contentType: scrapingResult.contentType,
            extractedText: scrapingResult.extractedText
              ? [...scrapingResult.extractedText]
              : undefined,
            extractedLinks: scrapingResult.extractedLinks
              ? [...scrapingResult.extractedLinks]
              : undefined,
            metadata: scrapingResult.metadata,
            markdown: scrapingResult.markdown,
            rawMarkdown: scrapingResult.rawMarkdown,
            extractedData: scrapingResult.extractedData
          };

          // If MCP is not enabled, return the base result
          if (!validatedConfig.mcpOptions?.enabled) {
            return E.succeed(baseResult);
          }

          // Step 2: Analyze through Fabric AI if MCP is enabled
          const analysisResult = yield* $(
            FabricAIScrapingService.analyzeThroughFabricAI(
              baseResult.content,
              baseResult,
              validatedConfig.mcpOptions
            )
          );

          return E.succeed({
            ...baseResult,
            fabricAnalysis: analysisResult.fabricAnalysis
          });
        } catch (error) {
          return E.fail<FabricAIScrapingError>({
            code: 'UNKNOWN_ERROR',
            message: error instanceof Error ? error.message : 'An unknown error occurred',
            details: error instanceof Error ? error.stack : String(error)
          });
        }
      })
    );
  }

  private static analyzeThroughFabricAI(
    content: string,
    baseResult: FabricAIScrapingResult,
    mcpOptions: NonNullable<FabricAIScrapingConfig['mcpOptions']>
  ): Effect<never, FabricAIScrapingError, FabricAIScrapingResult> {
    return E.flatten(
      E.gen(function* ($) {
        try {
          // Execute pattern sequence through MCP
          const mcpResult = yield* $(
            E.mapError(
              MCPClient.executePatternSequence(
                mcpOptions.patterns.map(String),
                content,
                mcpOptions.connectionConfig,
                mcpOptions.patternConfigs
              ),
              (error): FabricAIScrapingError => ({
                code: 'FABRIC_AI_ERROR',
                message: error instanceof Error ? error.message : 'Fabric AI analysis failed',
                details: error instanceof Error ? error.stack : String(error)
              })
            )
          );

          // Parse MCP result into FabricAnalysis format
          const fabricAnalysis = {
            summary: mcpResult.content,
            entities: Array.isArray(mcpResult.metadata?.entities)
              ? [...mcpResult.metadata.entities]
              : undefined,
            sentiment: mcpResult.metadata?.sentiment as string | undefined,
            topics: Array.isArray(mcpResult.metadata?.topics)
              ? [...mcpResult.metadata.topics]
              : undefined,
            keywords: Array.isArray(mcpResult.metadata?.keywords)
              ? [...mcpResult.metadata.keywords]
              : undefined,
            aiGeneratedContent: mcpResult.metadata?.aiGeneratedContent as
              | Record<string, string>
              | undefined
          };

          return E.succeed({
            ...baseResult,
            fabricAnalysis
          });
        } catch (error) {
          return E.fail<FabricAIScrapingError>({
            code: 'FABRIC_AI_ERROR',
            message: error instanceof Error ? error.message : 'Fabric AI analysis failed',
            details: error instanceof Error ? error.stack : String(error)
          });
        }
      })
    );
  }

  /**
   * Extract links from markdown content
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

// Example usage with proper error handling
export const exampleFabricAIScraping = E.gen(function* ($) {
  const result = yield* $(
    FabricAIScrapingService.scrapeAndAnalyze({
      url: 'https://example.com/article',
      selector: 'article.content',
      contentType: 'html',
      timeout: 15000,
      scrapingOptions: {
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
    })
  );

  console.log('Fabric AI scraping successful:', result);
  return result;
});
