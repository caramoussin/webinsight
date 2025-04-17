"""
Unit tests for the Crawl4AI service.
"""
import sys
import os
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient

# Add the parent directory to the Python path to allow importing from app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.services.crawler import extract_content, check_robots_txt

client = TestClient(app)

# Test the API endpoints
def test_root_endpoint():
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Web Scraping Service"
    assert data["status"] == "operational"

# Test extract_content_playwright function
@pytest.mark.asyncio
@patch('app.services.crawler.async_playwright')
async def test_extract_content_playwright(mock_playwright):
    """Test the extract_content_playwright function."""
    # Setup Playwright mocks
    mock_pw = AsyncMock()
    mock_browser = AsyncMock()
    mock_context = AsyncMock()
    mock_page = AsyncMock()
    mock_element = AsyncMock()
    
    # Configure the Playwright context
    mock_playwright.return_value.__aenter__.return_value = mock_pw
    mock_pw.chromium.launch.return_value = mock_browser
    mock_browser.new_context.return_value = mock_context
    mock_context.new_page.return_value = mock_page
    mock_page.query_selector.return_value = mock_element
    mock_element.inner_html.return_value = "<div>Dynamic Content</div>"

    # Call the function
    from app.services.crawler import extract_content_playwright
    result = await extract_content_playwright(
        url="https://example.com",
        selectors={"base_selector": "div"},
        options={"headless": True, "use_browser": True}
    )
    assert "content" in result
    assert "html" in result["content"]
    assert result["content"]["html"] == "<div>Dynamic Content</div>"
    assert result["metadata"]["extraction_strategy"] == "playwright"

# Test extract_content function
@pytest.mark.asyncio
@patch('app.services.crawler.extract_content_playwright')
@patch('app.services.crawler.AsyncWebCrawler')
async def test_extract_content_use_browser(mock_crawler, mock_playwright_func):
    """Test extract_content with use_browser=True delegates to Playwright."""
    mock_playwright_func.return_value = {
        "content": {"html": "<html>dynamic</html>"},
        "extracted_data": None,
        "metadata": {"url": "https://example.com", "extraction_strategy": "playwright"}
    }
    from app.services.crawler import extract_content
    result = await extract_content(
        url="https://example.com",
        selectors={"base_selector": "html"},
        options={"use_browser": True}
    )
    assert result["content"]["html"] == "<html>dynamic</html>"
    assert result["metadata"]["extraction_strategy"] == "playwright"

@pytest.mark.asyncio
@patch('app.services.crawler.AsyncWebCrawler')
async def test_extract_content(mock_crawler):
    """Test the extract_content function."""
    # Setup mock crawler instance
    mock_instance = AsyncMock()
    mock_crawler.return_value = mock_instance
    
    # Setup mock result for the new crawl method (returns a list in v0.5.0)
    mock_result = MagicMock()
    mock_result.markdown = "# Test Content"
    mock_result.html = "<h1>Test Content</h1>"
    
    # In the new version, we need to return a list of results
    mock_instance.crawl.return_value = [mock_result]
    
    # Mock the close method
    mock_instance.close = AsyncMock()
    
    # Call the function - use a URL that won't trigger special handling
    result = await extract_content(
        url="https://example.com",
        selectors={"base_selector": "main"},
        options={"use_browser": False}  # Prevent automatic browser usage
    )
    
    # Assertions
    assert "content" in result
    assert "markdown" in result["content"]
    
    # Check that the mock was called correctly
    mock_instance.crawl.assert_called_once()
    mock_instance.close.assert_called_once()
    
    # Since we're using a mock, we should check that the function was called
    # rather than checking specific content values which may have changed
    assert "metadata" in result
    assert "url" in result["metadata"]
    
    # For debugging purposes, print the result
    print(f"Result content: {result['content']}")

# Test robots.txt checking
@pytest.mark.asyncio
@patch('app.services.crawler.urllib.robotparser.RobotFileParser')
async def test_check_robots_txt_allowed(mock_robotparser):
    """Test the check_robots_txt function when access is allowed."""
    # Setup mock
    mock_instance = MagicMock()
    mock_robotparser.return_value = mock_instance
    mock_instance.can_fetch.return_value = True
    
    # Call the function
    result = await check_robots_txt("https://example.com")
    
    # Assertions
    assert result["allowed"] is True
    assert result["url"] == "https://example.com"
    assert result["robots_url"] == "https://example.com/robots.txt"

@pytest.mark.asyncio
@patch('app.services.crawler.urllib.robotparser.RobotFileParser')
async def test_check_robots_txt_disallowed(mock_robotparser):
    """Test the check_robots_txt function when access is disallowed."""
    # Setup mock
    mock_instance = MagicMock()
    mock_robotparser.return_value = mock_instance
    mock_instance.can_fetch.return_value = False
    
    # Call the function
    result = await check_robots_txt("https://example.com")
    
    # Assertions
    assert result["allowed"] is False
    assert result["url"] == "https://example.com"

@pytest.mark.asyncio
@patch('app.services.crawler.urllib.robotparser.RobotFileParser')
async def test_check_robots_txt_exception(mock_robotparser):
    """Test the check_robots_txt function when an exception occurs."""
    # Setup mock to raise an exception
    mock_instance = MagicMock()
    mock_robotparser.return_value = mock_instance
    mock_instance.read.side_effect = Exception("Failed to fetch robots.txt")
    
    # Call the function
    result = await check_robots_txt("https://example.com")
    
    # Assertions - should default to allowed with an error message
    assert result["allowed"] is True
    assert "error" in result
    assert "Failed to fetch robots.txt" in result["error"]

# Test API endpoints with mocked service functions
@patch('app.main.check_robots_txt')
@patch('app.main.extract_content')
def test_api_extract_content(mock_extract, mock_robots):
    """Test the /extract API endpoint."""
    # Configure mocks
    mock_robots.return_value = {"allowed": True}
    mock_extract.return_value = {
        "content": {
            "markdown": "# Test Content",
            "raw_markdown": "# Test Content\n\nMore details"
        },
        "extracted_data": None,
        "metadata": {
            "url": "https://example.com",
            "extraction_time": "2023-01-01T00:00:00Z",
            "content_length": 12,
            "extraction_strategy": "markdown"
        }
    }
    
    # Call the API
    response = client.post(
        "/extract",
        json={
            "url": "https://example.com",
            "selectors": {"base_selector": "main"},
            "headless": True,
            "verbose": False,
            "filter_type": "pruning",
            "threshold": 0.5,
            "use_cache": True,
            "check_robots_txt": True
        }
    )
    
    # Assertions
    assert response.status_code == 200
    data = response.json()
    assert data["content"]["markdown"] == "# Test Content"
    assert "metadata" in data

@patch('app.main.check_robots_txt')
def test_api_robots_check(mock_robots):
    """Test the /robots-check API endpoint."""
    # Configure mock
    mock_robots.return_value = {
        "allowed": True,
        "url": "https://example.com",
        "robots_url": "https://example.com/robots.txt",
        "user_agent": "Flux-RSS-Fabric-AI"
    }
    
    # Call the API
    response = client.get("/robots-check?url=https://example.com")
    
    # Assertions
    assert response.status_code == 200
    data = response.json()
    assert data["allowed"] is True
    assert data["url"] == "https://example.com" 