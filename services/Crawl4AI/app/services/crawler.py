"""
Crawler service for extracting content from URLs using Crawl4AI.
This module provides pure functions for content extraction and robots.txt checking.
"""
import asyncio
import time
import urllib.robotparser
from urllib.parse import urlparse
from typing import Dict, List, Optional, Any, Union

# Import Crawl4AI components
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
from crawl4ai.content_filter_strategy import PruningContentFilter, BM25ContentFilter
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy

async def extract_content(url: str, selectors: Optional[Dict[str, Any]] = None, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Pure function for content extraction using Crawl4AI.
    
    Args:
        url: URL to extract content from
        selectors: CSS selectors for content extraction
        options: Additional options for extraction
        
    Returns:
        Dictionary containing extracted content and metadata
    """
    # Default values
    options = options or {}
    selectors = selectors or {}
    
    # Create browser configuration
    browser_config = BrowserConfig(
        headless=options.get('headless', True),
        verbose=options.get('verbose', False)
    )
    
    # Create content filter based on options
    if options.get('filter_type') == 'bm25' and options.get('query'):
        content_filter = BM25ContentFilter(
            user_query=options.get('query', ''),
            bm25_threshold=options.get('threshold', 1.0)
        )
    else:
        content_filter = PruningContentFilter(
            threshold=options.get('threshold', 0.48), 
            threshold_type="fixed", 
            min_word_threshold=0
        )
    
    # Create markdown generator
    markdown_generator = DefaultMarkdownGenerator(content_filter=content_filter)
    
    # Create extraction strategy if schema is provided
    extraction_strategy = None
    if 'extraction_schema' in options and options['extraction_schema']:
        extraction_strategy = JsonCssExtractionStrategy(
            options['extraction_schema'],
            verbose=options.get('verbose', False)
        )
    
    # Create crawler configuration
    run_config = CrawlerRunConfig(
        cache_mode=CacheMode.ENABLED if options.get('use_cache', True) else CacheMode.BYPASS,
        markdown_generator=markdown_generator,
        extraction_strategy=extraction_strategy,
        js_code=options.get('js_scripts', []),
        wait_for=options.get('wait_selectors', [])
    )
    
    # Extract content using AsyncWebCrawler
    async with AsyncWebCrawler(config=browser_config) as crawler:
        result = await crawler.arun(url=url, config=run_config)
    
    # Prepare response
    response = {
        'content': {
            'markdown': result.markdown.fit_markdown if hasattr(result.markdown, 'fit_markdown') else result.markdown,
            'raw_markdown': result.markdown.raw_markdown if hasattr(result.markdown, 'raw_markdown') else result.markdown,
        },
        'extracted_data': result.extracted_content,
        'metadata': {
            'url': url,
            'extraction_time': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'content_length': len(result.markdown.fit_markdown) if hasattr(result.markdown, 'fit_markdown') else len(result.markdown),
            'extraction_strategy': 'schema' if extraction_strategy else 'markdown'
        }
    }
    
    return response

async def check_robots_txt(url: str, user_agent: str = "Flux-RSS-Fabric-AI") -> Dict[str, Any]:
    """
    Check if scraping is allowed by robots.txt for a given URL.
    
    Args:
        url: URL to check
        user_agent: User agent to check against
        
    Returns:
        Dictionary with robots.txt check results
    """
    parsed_url = urlparse(url)
    robots_url = f"{parsed_url.scheme}://{parsed_url.netloc}/robots.txt"
    
    rp = urllib.robotparser.RobotFileParser()
    rp.set_url(robots_url)
    
    try:
        rp.read()
        can_fetch = rp.can_fetch(user_agent, url)
        
        return {
            "allowed": can_fetch,
            "url": url,
            "robots_url": robots_url,
            "user_agent": user_agent
        }
    except Exception as e:
        # If robots.txt doesn't exist or can't be parsed, default to allowing
        return {
            "allowed": True,
            "url": url,
            "robots_url": robots_url,
            "user_agent": user_agent,
            "error": str(e)
        }

class RateLimiter:
    """
    Functional rate limiter for domain access.
    
    This class follows functional programming principles by returning
    new instances rather than modifying state.
    """
    def __init__(self, domain: str, requests_per_minute: int = 10):
        """Initialize a new rate limiter."""
        self.domain = domain
        self.interval = 60.0 / requests_per_minute
        self.last_access_time = 0
    
    def can_proceed(self) -> bool:
        """Check if domain can be accessed based on rate limit."""
        current_time = time.time()
        time_since_last = current_time - self.last_access_time
        return time_since_last >= self.interval
    
    def record_access(self) -> 'RateLimiter':
        """Return new rate limiter with updated access time."""
        new_limiter = RateLimiter(self.domain, 60.0 / self.interval)
        new_limiter.last_access_time = time.time()
        return new_limiter
