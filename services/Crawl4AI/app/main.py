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
        # Check robots.txt compliance if enabled
        if request_data.check_robots_txt:
            robots_result = await check_robots_txt(
                request_data.url, 
                request_data.user_agent or "Flux-RSS-Fabric-AI"
            )
            
            if not robots_result["allowed"]:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Scraping not allowed by robots.txt for {request_data.url}"
                )
        
        # Extract content
        result = await extract_content(
            request_data.url,
            request_data.selectors,
            request_data.dict(exclude={"url", "selectors"})
        )
        
        return result
    except Exception as e:
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
