# Web Scraper Service

## Overview

The WebScraperService is a flexible web scraping utility designed to extract content from various web sources, including HTML, JSON, and RSS feeds.

## Features

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
  - Type validation with Zod
  - Flexible content parsing

## Usage

### Basic Scraping

```typescript
const result = await WebScraperService.scrape({
  url: 'https://example.com',
  contentType: 'html',
  selector: '.article-title',
  timeout: 10000
});
```

### Supported Content Types

- `html`: Extract content using CSS selectors
- `json`: Parse JSON data
- `rss`: Parse RSS feed items

## Configuration Options

- `url`: Target website URL
- `contentType`: Type of content to scrape
- `selector`: CSS selector for content extraction
- `timeout`: Maximum time for scraping (ms)

## Error Handling

The service provides detailed error messages for:

- Network failures
- Parsing errors
- Timeout issues

## Dependencies

- Cheerio: HTML parsing
- Zod: Type validation
- Fetch API: Network requests

## Limitations

- Client-side scraping may be restricted by CORS
- Requires server-side rendering for complex scraping

## Future Improvements

- [ ] Enhanced link extraction
- [ ] More robust error handling
- [ ] Additional content type support
