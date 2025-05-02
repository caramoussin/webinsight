/**
 * MCP-based Crawl4AI client for web content extraction
 *
 * This client uses the MCP infrastructure to access Crawl4AI capabilities,
 * providing the same API as the original Crawl4AIClient but leveraging
 * the standardized MCP architecture.
 */

import { Effect as E, Schema as S } from 'effect';
import { ServiceError, validateWithSchema, effectFetch } from '../../utils/effect';

// Re-export schemas from the original client for compatibility
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

// Define as a type instead of a schema to avoid the linting error
type ExtractionResponse = {
  content: {
    markdown: string;
    raw_markdown: string;
    html?: string;
  };
  extracted_data?: unknown;
  metadata: Record<string, never>;
};

// Define as a type instead of a schema to avoid the linting error
type RobotsCheckResponse = {
  allowed: boolean;
  url: string;
  robots_url: string;
  user_agent: string;
  error?: string;
};

// Type inference from schemas
type ExtractionOptions = S.Schema.Type<typeof ExtractionOptionsSchema>;
// ExtractionResponse and RobotsCheckResponse are defined directly as types above

// Error types
export type Crawl4AIError = {
  code: string;
  message: string;
  details?: unknown;
};

/**
 * MCP-based Crawl4AI client for web content extraction
 * Provides the same API as the original Crawl4AIClient but uses the MCP infrastructure
 */
export class MCPCrawl4AIClient {
  private static readonly MCP_API_URL = '/api/mcp/crawl4ai';
  private static readonly PROVIDER = 'crawl4ai';

  /**
   * Extract content from a URL using Crawl4AI via MCP
   * @param options Extraction options
   * @returns Either an error or the extraction response
   */
  static extractContent(options: ExtractionOptions): E.Effect<ExtractionResponse, ServiceError> {
    return E.gen(function* ($) {
      // Validate options
      const validatedOptions = yield* $(validateWithSchema(ExtractionOptionsSchema, options));

      // Make request to MCP API
      const response = yield* $(
        effectFetch<{ result: ExtractionResponse }>(`${MCPCrawl4AIClient.MCP_API_URL}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'extractContent',
            params: validatedOptions
          })
        })
      );

      // Return the extraction response from the API result
      return response.result;
    });
  }

  /**
   * Check if scraping is allowed by robots.txt for a given URL via MCP
   * @param url URL to check
   * @param userAgent User agent to check against
   * @returns Either an error or the robots check response
   */
  static checkRobotsTxt(
    url: string,
    userAgent?: string
  ): E.Effect<RobotsCheckResponse, ServiceError> {
    return E.gen(function* ($) {
      // Make request to MCP API
      const response = yield* $(
        effectFetch<{ result: RobotsCheckResponse }>(`${MCPCrawl4AIClient.MCP_API_URL}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'checkRobotsTxt',
            params: {
              url,
              ...(userAgent ? { user_agent: userAgent } : {})
            }
          })
        })
      );

      // Return the robots check response from the API result
      return response.result;
    });
  }

  /**
   * Create a selector configuration object
   * @param baseSelector Base CSS selector
   * @param includeSelectors Additional selectors to include
   * @param excludeSelectors Selectors to exclude
   * @returns Selector configuration object
   */
  static createSelectorConfig(
    baseSelector?: string,
    includeSelectors?: string[],
    excludeSelectors?: string[]
  ): S.Schema.Type<typeof SelectorConfigSchema> {
    return {
      ...(baseSelector ? { base_selector: baseSelector } : {}),
      ...(includeSelectors ? { include_selectors: includeSelectors } : {}),
      ...(excludeSelectors ? { exclude_selectors: excludeSelectors } : {})
    };
  }

  /**
   * Create an extraction schema field
   * @param name Field name
   * @param selector CSS selector
   * @param type Extraction type
   * @param attribute Attribute name (for attribute type)
   * @returns Extraction schema field
   */
  static createExtractionSchemaField(
    name: string,
    selector: string,
    type: 'text' | 'attribute' | 'html',
    attribute?: string
  ): S.Schema.Type<typeof ExtractionSchemaFieldSchema> {
    return {
      name,
      selector,
      type,
      ...(attribute ? { attribute } : {})
    };
  }

  /**
   * Create an extraction schema
   * @param name Schema name
   * @param baseSelector Base CSS selector
   * @param fields Array of extraction fields
   * @returns Extraction schema
   */
  static createExtractionSchema(
    name: string,
    baseSelector: string,
    fields: S.Schema.Type<typeof ExtractionSchemaFieldSchema>[]
  ): S.Schema.Type<typeof ExtractionSchemaSchema> {
    return {
      name,
      base_selector: baseSelector,
      fields
    };
  }
}
