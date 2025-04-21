# WebInsight - Work in Progress

## 1. Current Focus

* **Effect Functional Programming Integration**: Implementing the Effect library for functional programming patterns, error handling, and type safety.
* **Crawl4AI Integration**: Finalizing the integration of Crawl4AI for enhanced web scraping capabilities, particularly for JavaScript-heavy websites.
* **MCP Client Implementation**: Developing the Model Context Protocol (MCP) client for connecting to Fabric pattern library and LLMs.
* **AI Agent Development**: Implementing the specialized AI agents (Archivist, Scribe, Librarian) using the MCP client.

## 2. Recent Changes

### 2.1 Documentation

* Created project-overview.md with high-level summary of project purpose, technologies, and architecture.
* Renamed specifications.md to technical-specs.md for consistency.
* Created requirements.md with functional and non-functional requirements.
* Organized documentation into subdirectories (components/, integrations/).
* Moved crawl4ai-integration-plan.md to integrations/ subdirectory.
* Moved fabric-mcp.md to components/ subdirectory.
* Updated requirements to include configurable scheduled data fetching.
* Added requirements for customizable AI processing pipelines with pattern sequences.

### 2.2 Core Features

* **Effect Functional Programming**:
  * Implemented Effect library for functional error handling and type safety.
  * Created utility functions for effect-based API interactions.
  * Integrated Effect Schema for robust validation.
* **Crawl4AI Integration**:
  * Implemented Crawl4AIClient with Effect-based error handling.
  * Created API endpoints for web scraping with JavaScript support.
  * Added configuration for handling rate limits and respecting robots.txt.
  * Implemented robots.txt compliance checking.
* **MCP Client Implementation**:
  * Developed MCPClient class with Effect-based error handling.
  * Implemented pattern execution and sequence capabilities.
  * Added server availability checking and pattern listing.
* **RSS Integration**:
  * Implemented TwitterRSSService for fetching from Nitter instances.
  * Created instance cycling and fallback mechanisms.
  * Added basic RSS parsing functionality.

## 3. Next Steps

### 3.1 Short-term (Current Sprint)

* Implement AI agents (Archivist, Scribe, Librarian) using the MCP client.
* Develop UI components for MCP configuration management.
* Add support for local LLM connections via Ollama.
* Implement scheduled data fetching with configurable frequency.
* Create AI processing pipeline configuration UI.

### 3.2 Medium-term

* Enhance content processing capabilities with additional AI patterns.
* Implement advanced search and filtering with AI assistance.
* Add support for more content sources (additional APIs, specialized scrapers).
* Improve offline capabilities with better Service Worker integration.
* Investigate options for secure sharing of processed content.

### 3.3 Long-term

* Explore integration with Brave Search API for enhanced content enrichment.
* Consider implementing a plugin system for extensibility.

## 4. Active Decisions

### 4.1 Technical Decisions

* **Local-first Architecture**: Committed to maintaining local data storage and processing for privacy.
* **SQLite with Drizzle ORM**: Selected for data persistence due to simplicity and performance.
* **SvelteKit**: Chosen for both frontend and backend to maintain a unified codebase.
* **Bun Runtime**: Selected for performance advantages over Node.js.
* **Effect Library**: Adopted for functional programming patterns, error handling, and type safety.
* **Fabric Pattern Library**: Selected for AI pattern execution via MCP.

### 4.2 Open Questions

* Should we support mobile devices or focus exclusively on desktop experience?
* What level of customization should be exposed for AI processing patterns?
* How should we handle very large content collections for performance?

### 4.3 Known Challenges

* Handling rate limits and blocking from various content sources.
* Managing LLM resource usage for efficient local processing.
* Ensuring consistent content extraction across diverse web sources.
* Implementing robust error handling for AI processing pipelines.
* Creating an intuitive UI for configuring complex AI pattern sequences.
