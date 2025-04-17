"""
FastAPI application for the Web Scraping Service using Crawl4AI.
This service provides endpoints for extracting content from URLs using various strategies.
"""
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, HttpUrl
from typing import Dict, List, Optional, Any, Union

# Import models
from app.models import (
    ExtractionOptions,
    ExtractionResponse,
    BrowserConfig,
    ErrorResponse
)

# Import services
from app.services.crawler import extract_content, check_robots_txt

# Create FastAPI app
app = FastAPI(
    title="Web Scraping Service",
    description="API for extracting content from URLs using Crawl4AI",
    version="0.1.0"
)

# Add CORS middleware - only allow local requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint that returns service information."""
    return {
        "service": "Web Scraping Service",
        "version": "0.1.0",
        "status": "operational"
    }

@app.post("/extract", response_model=ExtractionResponse)
async def api_extract_content(request_data: ExtractionOptions):
    """
    Extract content from a URL using Crawl4AI.
    
    This endpoint accepts configuration options for the extraction process
    and returns the extracted content in various formats.
    """
    try:
        # Convert URL to string to avoid HttpUrl object issues
        url_str = str(request_data.url)
        
        # Print request data for debugging
        print(f"Request data: {request_data}")
        print(f"URL: {url_str}")
        print(f"Selectors: {request_data.selectors}")
        
        # Check robots.txt compliance if enabled
        if request_data.check_robots_txt:
            try:
                robots_result = await check_robots_txt(
                    url_str,  # Use string URL instead of HttpUrl object
                    request_data.user_agent or "Flux-RSS-Fabric-AI"
                )
                
                if not robots_result["allowed"]:
                    raise HTTPException(
                        status_code=403, 
                        detail=f"Scraping not allowed by robots.txt for {url_str}"
                    )
            except Exception as robots_error:
                print(f"Error checking robots.txt: {str(robots_error)}")
                # Continue even if robots check fails
        
        # Extract content with string URL instead of HttpUrl object
        try:
            # Create a copy of the options to avoid modifying the original
            options = request_data.model_dump(exclude={"url", "selectors"})
            
            # Force use_browser=True for specific selector tests
            if request_data.selectors and 'base_selector' in request_data.selectors:
                options['use_browser'] = True
                print(f"Forcing use_browser=True for base_selector: {request_data.selectors['base_selector']}")
            
            result = await extract_content(
                url_str,  # Use string URL to avoid 'decode' attribute errors
                request_data.selectors,
                options
            )
            
            # Validate result before returning
            if not result:
                raise ValueError("No result returned from extract_content")
                
            # Ensure content exists
            if 'content' not in result:
                result['content'] = {'html': '', 'markdown': '', 'raw_markdown': ''}
                
            # Ensure extracted_data exists
            if 'extracted_data' not in result:
                result['extracted_data'] = None
                
            return result
        except Exception as extract_error:
            import traceback
            print(f"Error in extract_content: {str(extract_error)}")
            print(f"Error type: {type(extract_error).__name__}")
            print(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=str(extract_error))
    except Exception as e:
        import traceback
        print(f"Unhandled error in api_extract_content: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/robots-check")
async def check_robots(url: HttpUrl, user_agent: Optional[str] = "Flux-RSS-Fabric-AI"):
    """Check if scraping is allowed by robots.txt for a given URL."""
    try:
        result = await check_robots_txt(str(url), user_agent)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
