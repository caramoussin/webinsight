"""
Integration tests for the Crawl4AI service.

These tests interact with the actual service running locally.
Run these tests after starting the service with `python run.py`
"""
import asyncio
import requests
import pytest
import sys
import os
import time

# Add the project directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Base URL for the API server
BASE_URL = "http://localhost:8000"

# Test if server is running
def is_server_running():
    """Check if the server is running."""
    try:
        response = requests.get(f"{BASE_URL}/")
        return response.status_code == 200
    except:
        return False

# Integration tests - only run if server is running
@pytest.mark.skipif(not is_server_running(), reason="Server is not running")
def test_root_endpoint_integration():
    """Test the root endpoint of the running server."""
    response = requests.get(f"{BASE_URL}/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Web Scraping Service"
    assert data["status"] == "operational"

@pytest.mark.skipif(not is_server_running(), reason="Server is not running")
def test_robots_check_integration():
    """Test the robots.txt check endpoint with a real request."""
    # Using httpbin as it's a stable test site
    response = requests.get(f"{BASE_URL}/robots-check?url=https://httpbin.org")
    assert response.status_code == 200
    data = response.json()
    assert "allowed" in data
    assert data["url"] == "https://httpbin.org"
    assert data["robots_url"] == "https://httpbin.org/robots.txt"

@pytest.mark.skipif(not is_server_running(), reason="Server is not running")
def test_extract_content_integration():
    """Test the extract content endpoint with a real request."""
    # Using httpbin as it's a stable test site
    request_data = {
        "url": "https://httpbin.org/html",
        "selectors": {
            "base_selector": "html",
            "include_selectors": ["body"],
            "exclude_selectors": []
        },
        "headless": True,
        "verbose": False,
        "filter_type": "pruning",
        "threshold": 0.5,
        "use_cache": True,
        "check_robots_txt": True,
        "respect_rate_limits": True
    }
    
    response = requests.post(f"{BASE_URL}/extract", json=request_data)
    assert response.status_code == 200
    data = response.json()
    assert "content" in data
    assert "markdown" in data["content"]
    assert len(data["content"]["markdown"]) > 0
    assert "metadata" in data
    assert data["metadata"]["url"] == "https://httpbin.org/html"

@pytest.mark.skipif(not is_server_running(), reason="Server is not running")
def test_extract_with_specific_selector():
    """Test content extraction with a specific CSS selector."""
    request_data = {
        "url": "https://httpbin.org/html",
        "selectors": {
            "base_selector": "h1",
            "include_selectors": [],
            "exclude_selectors": []
        },
        "headless": True,
        "verbose": False,
        "filter_type": "pruning",
        "threshold": 0.5,
        "use_cache": True,
        "check_robots_txt": True
    }
    
    response = requests.post(f"{BASE_URL}/extract", json=request_data)
    assert response.status_code == 200
    data = response.json()
    assert "content" in data
    assert "markdown" in data["content"]
    # The h1 in httpbin.org/html contains the text "Herman Melville - Moby-Dick"
    assert "Herman Melville" in data["content"]["markdown"]

@pytest.mark.skipif(not is_server_running(), reason="Server is not running")
def test_extract_with_invalid_url():
    """Test error handling with an invalid URL."""
    request_data = {
        "url": "https://this-domain-does-not-exist-123456789.com",
        "selectors": {},
        "headless": True,
        "verbose": False,
        "filter_type": "pruning",
        "use_cache": False,
        "check_robots_txt": False
    }
    
    response = requests.post(f"{BASE_URL}/extract", json=request_data)
    # Should return 500 with an error message for a domain that doesn't exist
    assert response.status_code == 500
    
if __name__ == "__main__":
    print("Running integration tests for Crawl4AI service...")
    if not is_server_running():
        print("Warning: Crawl4AI server is not running. Start it with `python run.py`")
        print("Tests will be skipped.")
    
    # These calls are for manual testing - pytest will run the test functions automatically
    if is_server_running():
        test_root_endpoint_integration()
        test_robots_check_integration()
        test_extract_content_integration()
        test_extract_with_specific_selector()
        test_extract_with_invalid_url()
        print("All integration tests passed!") 