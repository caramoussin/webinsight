# WebInsight Crawl4AI Service

A Python microservice for web content extraction using WebInsight, designed for the WebInsight platform. This service provides a FastAPI-based REST interface for extracting content from web pages, with support for both static and dynamic (JavaScript-heavy) websites.

## Features

- Clean, structured Markdown generation from web content
- Content filtering using pruning and BM25 algorithms
- CSS-based structured data extraction
- Robots.txt compliance checking
- Rate limiting for ethical scraping
- FastAPI-based REST interface (v0.1.0)
- Browser-based extraction using Playwright for dynamic websites
- Comprehensive error handling and fallback mechanisms
- Functional programming approach with immutable data structures

## Installation

1. Create a Python virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run post-installation setup for WebInsight:

```bash
webinsight-setup
webinsight-doctor  # Verify installation
```

## Usage

### Starting the service

```bash
python run.py
```

The service will be available at <http://localhost:8000>

### API Documentation

Once the service is running, you can access the auto-generated API documentation at:

- Swagger UI: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>

## API Endpoints

### Extract Content

```http
POST /extract
```

Extracts content from a URL using Crawl4AI.

**Request Body:**

```json
{
  "url": "https://example.com/article/1",
  "selectors": {
    "base_selector": "article.content",
    "include_selectors": ["h1.title", ".article-body"],
    "exclude_selectors": [".advertisement"]
  },
  "headless": true,
  "verbose": false,
  "filter_type": "pruning",
  "threshold": 0.48,
  "use_cache": true,
  "check_robots_txt": true,
  "use_browser": false
}
```

**Browser-Based Extraction:**

To enable browser-based extraction for dynamic websites using Playwright, set `use_browser` to `true`:

```json
{
  "url": "https://example.com/dynamic-page",
  "selectors": {
    "base_selector": "#main-content"
  },
  "headless": true,
  "verbose": true,
  "use_cache": true,
  "check_robots_txt": true,
  "use_browser": true,
  "wait_selectors": ["#loaded-indicator"],
  "js_scripts": ["window.scrollTo(0, document.body.scrollHeight);"]
}
```

**Response:**

```json
{
  "content": {
    "markdown": "# Article Title\n\nArticle content goes here...",
    "raw_markdown": "# Article Title\n\nArticle content goes here with additional elements...",
    "html": "<h1>Article Title</h1><p>Article content goes here...</p>"
  },
  "extracted_data": {
    "title": "Article Title",
    "content": "Article content goes here..."
  },
  "metadata": {
    "url": "https://example.com/article/1",
    "extraction_time": "2025-04-16T21:45:12Z",
    "content_length": 2345,
    "extraction_strategy": "playwright",
    "scraping_strategy": "standard"
  }
}
```

### Check Robots.txt

```http
GET /robots-check?url=https://example.com&user_agent=webinsight
```

Checks if scraping is allowed by robots.txt for a given URL.

**Response:**

```json
{
  "allowed": true,
  "url": "https://example.com",
  "robots_url": "https://example.com/robots.txt",
  "user_agent": "webinsight"
}
```

## Integration with TypeScript

This service is designed to be consumed by the TypeScript backend of the WebInsight project. The TypeScript client implementation (`Crawl4AIClient.ts`) provides a type-safe interface for interacting with this service using Effect for functional programming.

### TypeScript Client Usage

```typescript
import { Crawl4AIClient } from '@/lib/services/scraper/Crawl4AIClient';
import { Effect } from 'effect';

// Create a client instance
const client = Crawl4AIClient.make({
  baseUrl: 'http://localhost:8000'
});

// Extract content from a URL
const extractEffect = client.extractContent({
  url: 'https://example.com/article',
  selectors: {
    base_selector: 'article.content'
  },
  headless: true,
  verbose: false,
  use_cache: true,
  check_robots_txt: true,
  use_browser: true // Enable browser-based extraction for dynamic sites
});

// Run the effect
Effect.runPromise(extractEffect)
  .then(result => console.log(result))
  .catch(error => console.error(error));
```

## Testing

This service includes comprehensive unit and integration tests. See the [tests/README.md](tests/README.md) for details on running the tests.

## Development

### Current Version: 0.1.0

This service is currently in early development. The API may change in future versions.
