"""
Pydantic models for the Web Scraping Service.
These models define the structure of requests and responses for the API.
"""
from pydantic import BaseModel, Field, HttpUrl
from typing import Dict, List, Optional, Any, Union

class BrowserConfig(BaseModel):
    """Configuration for the browser used by Crawl4AI."""
    headless: bool = Field(True, description="Run browser in headless mode")
    verbose: bool = Field(False, description="Enable verbose logging")
    user_agent: Optional[str] = Field(None, description="Custom user agent string")
    viewport_width: Optional[int] = Field(None, description="Browser viewport width")
    viewport_height: Optional[int] = Field(None, description="Browser viewport height")
    timeout: Optional[int] = Field(None, description="Page load timeout in milliseconds")
    stealth_mode: bool = Field(False, description="Enable stealth mode to avoid detection")

class SelectorConfig(BaseModel):
    """Configuration for CSS selectors used in extraction."""
    base_selector: Optional[str] = Field(None, description="Base CSS selector for extraction")
    include_selectors: Optional[List[str]] = Field(None, description="CSS selectors to include")
    exclude_selectors: Optional[List[str]] = Field(None, description="CSS selectors to exclude")
    
    class Config:
        schema_extra = {
            "example": {
                "base_selector": "article.content",
                "include_selectors": ["h1.title", ".article-body", ".author-name"],
                "exclude_selectors": [".advertisement", ".related-articles"]
            }
        }

class ExtractionSchema(BaseModel):
    """Schema for structured data extraction using CSS selectors."""
    name: str = Field(..., description="Name of the extraction schema")
    base_selector: str = Field(..., description="Base CSS selector for the schema")
    fields: List[Dict[str, Any]] = Field(..., description="Fields to extract")
    
    class Config:
        schema_extra = {
            "example": {
                "name": "Article Content",
                "base_selector": "article.content",
                "fields": [
                    {
                        "name": "title",
                        "selector": "h1.title",
                        "type": "text"
                    },
                    {
                        "name": "content",
                        "selector": ".article-body",
                        "type": "text"
                    },
                    {
                        "name": "author",
                        "selector": ".author-name",
                        "type": "text"
                    },
                    {
                        "name": "published_date",
                        "selector": "time.published",
                        "type": "attribute",
                        "attribute": "datetime"
                    }
                ]
            }
        }

class ExtractionOptions(BaseModel):
    """Options for content extraction using Crawl4AI, including browser-based extraction via Playwright."""
    url: HttpUrl = Field(..., description="URL to extract content from")
    selectors: Optional[SelectorConfig] = Field(None, description="CSS selectors for content extraction")
    extraction_schema: Optional[ExtractionSchema] = Field(None, description="Schema for structured data extraction")
    
    # Browser configuration
    headless: bool = Field(True, description="Run browser in headless mode")
    verbose: bool = Field(False, description="Enable verbose logging")
    user_agent: Optional[str] = Field(None, description="Custom user agent string")
    use_browser: bool = Field(False, description="Use Playwright for dynamic content extraction (JS rendering)")
    
    # Content filtering
    filter_type: Optional[str] = Field("pruning", description="Content filter type (pruning or bm25)")
    threshold: Optional[float] = Field(0.48, description="Content filter threshold")
    query: Optional[str] = Field(None, description="Query for BM25 content filtering")
    
    # Caching and performance
    use_cache: bool = Field(True, description="Enable caching of results")
    js_scripts: Optional[List[str]] = Field(None, description="Custom JavaScript to execute on page")
    wait_selectors: Optional[List[str]] = Field(None, description="CSS selectors to wait for before extraction")
    
    # Ethical scraping
    check_robots_txt: bool = Field(True, description="Check robots.txt before scraping")
    respect_rate_limits: bool = Field(True, description="Respect rate limits for domains")
    
    class Config:
        schema_extra = {
            "example": {
                "url": "https://example.com/article/1",
                "selectors": {
                    "base_selector": "article.content",
                    "include_selectors": ["h1.title", ".article-body"],
                    "exclude_selectors": [".advertisement"]
                },
                "headless": True,
                "verbose": False,
                "use_browser": True,
                "filter_type": "pruning",
                "threshold": 0.48,
                "use_cache": True,
                "check_robots_txt": True
            }
        }

class ExtractionResponse(BaseModel):
    """Response from content extraction."""
    content: Dict[str, str] = Field(..., description="Extracted content in various formats")
    extracted_data: Optional[Any] = Field(None, description="Structured data extracted using schema")
    metadata: Dict[str, Any] = Field({}, description="Metadata about the extraction process")
    
    class Config:
        schema_extra = {
            "example": {
                "content": {
                    "markdown": "# Article Title\n\nArticle content goes here...",
                    "raw_markdown": "# Article Title\n\nArticle content goes here with additional elements...",
                    "html": "<h1>Article Title</h1><p>Article content goes here...</p>"
                },
                "extracted_data": {
                    "title": "Article Title",
                    "content": "Article content goes here...",
                    "author": "John Doe",
                    "published_date": "2023-10-15T14:30:00Z"
                },
                "metadata": {
                    "url": "https://example.com/article/1",
                    "extraction_time": "2023-10-16T08:45:12Z",
                    "content_length": 2345,
                    "extraction_strategy": "markdown"
                }
            }
        }

class ErrorResponse(BaseModel):
    """Error response model."""
    detail: str = Field(..., description="Error message")
    
    class Config:
        schema_extra = {
            "example": {
                "detail": "Failed to extract content: Connection timeout"
            }
        }
