# Scraping Services

## Overview

The scraping services provide robust content extraction and analysis capabilities through two main components:

1. **WebScrapingService**: Core scraping functionality for various content types
2. **FabricAIScrapingService**: Enhanced scraping with AI-powered analysis

## Features

### WebScrapingService
- 🌐 Multi-Format Support
  - HTML content extraction
  - JSON data parsing
  - RSS feed scraping
- 🤖 Intelligent Scraping
  - Respects `robots.txt`
  - Configurable selectors
  - Timeout handling
- 🔒 Safe Scraping Practices
  - Error handling
  - Type validation with Effect Schema
  - Flexible content parsing

### FabricAIScrapingService
- 🧠 AI-Powered Analysis
  - Content summarization
  - Entity extraction
  - Sentiment analysis
  - Topic detection
  - Keyword extraction
- 🔄 Integration with MCP
  - Pattern-based analysis
  - Configurable AI models
  - Extensible analysis pipeline
- 📊 Rich Metadata
  - Structured content analysis
  - Cross-reference support
  - Content relationships

## Usage

### Basic Web Scraping

```typescript
const result = await Effect.runPromise(
  WebScrapingService.scrape({
    url: 'https://example.com',
    contentType: 'html',
    selector: '.article-title',
    timeout: 10000,
    useCrawl4AI: false
  })
);
```

### AI-Enhanced Scraping

```typescript
const result = await Effect.runPromise(
  FabricAIScrapingService.scrapeAndAnalyze({
    url: 'https://example.com/article',
    contentType: 'html',
    selector: 'article.content',
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
      patterns: ['summarize', 'extract-entities']
    }
  })
);
```

## Configuration

### WebScrapingService Options
- `url`: Target website URL
- `contentType`: Type of content to scrape (`html`, `json`, `rss`)
- `selector`: CSS selector for content extraction
- `timeout`: Maximum time for scraping (ms)
- `useCrawl4AI`: Enable advanced crawling features
- `crawl4AIOptions`: Configuration for Crawl4AI integration

### FabricAIScrapingService Options
- All WebScrapingService options, plus:
- `scrapingOptions`: Advanced scraping configuration
  - `filterType`: Content filtering method
  - `threshold`: Relevance threshold
  - `useCache`: Enable response caching
  - `checkRobotsTxt`: Respect robots.txt rules
  - `respectRateLimits`: Honor rate limiting
- `mcpOptions`: AI analysis configuration
  - `enabled`: Toggle AI analysis
  - `connectionConfig`: MCP connection settings
  - `patterns`: Analysis patterns to apply
  - `patternConfigs`: Pattern-specific settings

## Error Handling

Both services use Effect for robust error handling:

- `VALIDATION_ERROR`: Configuration validation issues
- `SCRAPING_ERROR`: Content extraction failures
- `FABRIC_AI_ERROR`: AI analysis failures
- `UNKNOWN_ERROR`: Unexpected issues

## Integration in the App

The scraping services are used throughout the app for:

1. **Feed Processing**
   - RSS feed extraction
   - Article content scraping
   - Media attachment handling

2. **Content Analysis**
   - Automatic summarization
   - Topic categorization
   - Content recommendations
   - Cross-referencing

3. **Data Enrichment**
   - Metadata extraction
   - Entity linking
   - Semantic analysis
   - Content classification

## Dependencies

- Effect: Functional programming and error handling
- Cheerio: HTML parsing
- MCP Client: AI model integration
- Crawl4AI: Advanced crawling capabilities

## Future Improvements

- [ ] Enhanced link extraction and validation
- [ ] Parallel pattern execution for AI analysis
- [ ] Adaptive rate limiting
- [ ] Content deduplication
- [ ] Improved caching strategies
- [ ] Additional AI model support
