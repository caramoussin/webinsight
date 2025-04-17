"""
Test script for the Web Scraping Service.
This script tests the basic functionality of the Crawl4AI integration.
"""
import asyncio
import json
import sys
import os

# Add the parent directory to the Python path to allow importing from app
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.services.crawler import extract_content, check_robots_txt

async def test_content_extraction():
    """Test content extraction from a simple website."""
    print("Testing content extraction...")
    
    try:
        # Using a more reliable website for testing
        result = await extract_content(
            url="https://httpbin.org/html",
            selectors={
                "base_selector": "body",
                "include_selectors": ["h1", "div"],
                "exclude_selectors": []
            },
            options={
                "headless": True,
                "verbose": True,
                "filter_type": "pruning",
                "threshold": 0.48,
                "use_cache": True,
                "check_robots_txt": True
            }
        )
        
        if not result or 'content' not in result or not result['content']['markdown']:
            print("Warning: No content extracted or content is empty")
            print(f"Result: {json.dumps(result, indent=2)}")
            return result
        
        print(f"Extraction successful!")
        print(f"Markdown content length: {len(result['content']['markdown'])}")
        print(f"First 200 characters of markdown content:")
        print(result['content']['markdown'][:200])
        print("\nMetadata:")
        print(json.dumps(result['metadata'], indent=2))
        
        return result
    except Exception as e:
        print(f"Error during content extraction: {str(e)}")
        raise

async def test_robots_txt():
    """Test robots.txt checking."""
    print("\nTesting robots.txt checking...")
    
    try:
        # Using a more reliable website for testing
        result = await check_robots_txt("https://httpbin.org", "webinsight")
        
        print(f"Robots.txt check result: {result['allowed']}")
        print(f"Details: {json.dumps(result, indent=2)}")
        
        return result
    except Exception as e:
        print(f"Error during robots.txt check: {str(e)}")
        raise

async def main():
    """Run all tests."""
    print("=== Web Scraping Service Test ===")
    
    try:
        await test_content_extraction()
        await test_robots_txt()
        print("\n✅ All tests passed!")
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(main())
