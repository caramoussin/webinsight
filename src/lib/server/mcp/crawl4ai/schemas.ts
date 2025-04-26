import * as S from '@effect/schema/Schema';

/**
 * Schemas for Crawl4AI MCP Provider
 *
 * This file defines the schema definitions for the Crawl4AI MCP provider,
 * including input and output types for the supported MCP Tools and Resources.
 */

// =========== Shared Schemas ===========

// Schema for CSS selector configuration
export const SelectorConfigSchema = S.Struct({
  base_selector: S.optional(S.String),
  include_selectors: S.optional(S.Array(S.String)),
  exclude_selectors: S.optional(S.Array(S.String))
});

// Schema for structured data extraction
export const ExtractionSchemaFieldSchema = S.Struct({
  name: S.String,
  selector: S.String,
  type: S.Union(S.Literal('text'), S.Literal('attribute'), S.Literal('html')),
  attribute: S.optional(S.String)
});

export const ExtractionSchemaSchema = S.Struct({
  name: S.String,
  base_selector: S.String,
  fields: S.Array(ExtractionSchemaFieldSchema)
});

// =========== Tool Input Schemas ===========

// Schema for extractContent tool input
export const ExtractContentInputSchema = S.Struct({
  url: S.String.pipe(S.pattern(/^https?:\/\/.+/)),
  selectors: S.optional(SelectorConfigSchema),
  extraction_schema: S.optional(ExtractionSchemaSchema),

  // Browser configuration
  headless: S.optional(S.Boolean),
  verbose: S.optional(S.Boolean),
  user_agent: S.optional(S.String),

  // Content filtering
  filter_type: S.optional(S.Union(S.Literal('pruning'), S.Literal('bm25'))),
  threshold: S.optional(S.Number),
  query: S.optional(S.String),

  // Caching and performance
  use_cache: S.optional(S.Boolean),
  js_scripts: S.optional(S.Array(S.String)),
  wait_selectors: S.optional(S.Array(S.String)),

  // Ethical scraping
  check_robots_txt: S.optional(S.Boolean),
  respect_rate_limits: S.optional(S.Boolean)
});

// Schema for checkRobotsTxt tool input
export const CheckRobotsTxtInputSchema = S.Struct({
  url: S.String.pipe(S.pattern(/^https?:\/\/.+/)),
  user_agent: S.optional(S.String)
});

// =========== Tool Output Schemas ===========

// Schema for extractContent tool output
export const ExtractContentOutputSchema = S.Struct({
  content: S.Struct({
    markdown: S.String,
    raw_markdown: S.String,
    html: S.optional(S.String)
  }),
  extracted_data: S.optional(S.Unknown),
  metadata: S.Struct({})
});

// Schema for checkRobotsTxt tool output
export const CheckRobotsTxtOutputSchema = S.Struct({
  allowed: S.Boolean,
  url: S.String,
  robots_url: S.String,
  user_agent: S.String,
  error: S.optional(S.String)
});

// =========== Tool Definitions ===========

// Tool Schema for extractContent
export const ExtractContentToolSchema = S.Struct({
  name: S.Literal('extractContent'),
  description: S.Literal('Extract content from a web page'),
  parameters: ExtractContentInputSchema
});

// Tool Schema for checkRobotsTxt
export const CheckRobotsTxtToolSchema = S.Struct({
  name: S.Literal('checkRobotsTxt'),
  description: S.Literal('Check if scraping is allowed by robots.txt for a given URL'),
  parameters: CheckRobotsTxtInputSchema
});

// =========== Exported Types ===========

// Extract TypeScript types from the schemas
export type SelectorConfig = S.Schema.Type<typeof SelectorConfigSchema>;
export type ExtractionSchemaField = S.Schema.Type<typeof ExtractionSchemaFieldSchema>;
export type ExtractionSchema = S.Schema.Type<typeof ExtractionSchemaSchema>;

export type ExtractContentInput = S.Schema.Type<typeof ExtractContentInputSchema>;
export type ExtractContentOutput = S.Schema.Type<typeof ExtractContentOutputSchema>;
export type ExtractContentTool = S.Schema.Type<typeof ExtractContentToolSchema>;

export type CheckRobotsTxtInput = S.Schema.Type<typeof CheckRobotsTxtInputSchema>;
export type CheckRobotsTxtOutput = S.Schema.Type<typeof CheckRobotsTxtOutputSchema>;
export type CheckRobotsTxtTool = S.Schema.Type<typeof CheckRobotsTxtToolSchema>;
