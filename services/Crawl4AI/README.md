# Crawl4AI Service

A Python microservice for web content extraction using Crawl4AI, designed for the Flux RSS Fabric AI project.

## Features

- Clean, structured Markdown generation from web content
- Content filtering using pruning and BM25 algorithms
- CSS-based structured data extraction
- Robots.txt compliance checking
- Rate limiting for ethical scraping
- FastAPI-based REST interface

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

3. Run post-installation setup for Crawl4AI:

```bash
crawl4ai-setup
crawl4ai-doctor  # Verify installation
```

## Usage

### Starting the service

```bash
python run.py
```

The service will be available at http://localhost:8000

### API Documentation

Once the service is running, you can access the auto-generated API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Extract Content

```
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
  "check_robots_txt": true
}
```

**Response:**

```json
{
  "content": {
    "markdown": "# Article Title\n\nArticle content goes here...",
    "raw_markdown": "# Article Title\n\nArticle content goes here with additional elements..."
  },
  "extracted_data": null,
  "metadata": {
    "url": "https://example.com/article/1",
    "extraction_time": "2023-10-16T08:45:12Z",
    "content_length": 2345,
    "extraction_strategy": "markdown"
  }
}
```

### Check Robots.txt

```
GET /robots-check?url=https://example.com&user_agent=Flux-RSS-Fabric-AI
```

Checks if scraping is allowed by robots.txt for a given URL.

**Response:**

```json
{
  "allowed": true,
  "url": "https://example.com",
  "robots_url": "https://example.com/robots.txt",
  "user_agent": "Flux-RSS-Fabric-AI"
}
```

## Integration with TypeScript

This service is designed to be consumed by the TypeScript backend of the Flux RSS Fabric AI project. See the TypeScript client implementation for details on how to interact with this service.
