# WebInsight - Work In Progress & Active Decisions

## 1. Current Focus

- **Effect Functional Programming Integration**: Implementing the Effect library for functional programming patterns, error handling, and type safety.
- **MCP Host Implementation**: Implementing a central MCP host for provider registration and tool execution.
- **MCP API Development**: Creating REST API endpoints for MCP tool discovery and execution.
- **LLM Provider Service**: Implementing a direct Effect-based service using @effect/ai for LLM interactions rather than using MCP for LLM providers.
- **LLM Provider Service**: Implementing a direct Effect-based service using @effect/ai for LLM interactions rather than using MCP for LLM providers.
- **AI Agent Development**: Implementing the specialized AI agents (Archivist, Scribe, Librarian) using the MCP client.
- **Hybrid CAG/RAG Strategy**: Implementing a Cache-Augmented Generation and Retrieval-Augmented Generation strategy using Effect.Cache to optimize AI performance and accuracy.

## 2. Recent Changes

### 2.1 Documentation

- Created project-overview.md with high-level summary of project purpose, technologies, and architecture.
- Renamed specifications.md to technical-specs.md for consistency.
- Created requirements.md with functional and non-functional requirements.
- Organized documentation into subdirectories (components/, integrations/).
- Moved crawl4ai-integration-plan.md to integrations/ subdirectory.
- Moved fabric-mcp.md to components/ subdirectory.
- Updated requirements to include configurable scheduled data fetching.
- Added requirements for customizable AI processing pipelines with pattern sequences.
- Created cag-rag-strategy.md in integrations/ documenting the hybrid CAG/RAG approach with Effect.Cache.

### 2.2 Core Features

- **Effect Functional Programming**:
  - Implemented Effect library for functional error handling and type safety.
  - Created utility functions for effect-based API interactions.
  - Integrated Effect Schema for robust validation.
  - **Added Effect.Cache implementation** for optimizing AI operations with the hybrid CAG/RAG strategy.
- **Crawl4AI Integration**:
  - Implemented Crawl4AIClient with Effect-based error handling.
  - Created API endpoints for web scraping with JavaScript support.
  - Added configuration for handling rate limits and respecting robots.txt.
  - Implemented robots.txt compliance checking.
- **MCP Implementation**:
  - **Implemented MCP Host** with provider registration and tool execution capabilities.
  - **Created Crawl4AI MCP Provider** with standardized tool interface.
  - **Developed MCP-based Crawl4AI client** for accessing web content extraction capabilities.
  - **Created API endpoints** for MCP tool discovery and execution.
  - Developed MCPClient class with Effect-based error handling.
  - Implemented pattern execution and sequence capabilities.
  - Added server availability checking and pattern listing.
- **RSS Integration**:
  - Implemented TwitterRSSService for fetching from Nitter instances.
  - Created instance cycling and fallback mechanisms.
  - Added basic RSS parsing functionality.
- **AI Performance Optimization**:
  - Designed and implemented hybrid CAG/RAG strategy with Effect.Cache.
  - Created database schema extensions for cached AI results.
  - Implemented context retrieval based on article metadata.

## 3. Recent Achievements

- **MCP Architecture Implementation**:
  - Successfully implemented the MCP host as a central registry for providers.
  - Created a standardized provider interface for tool discovery and execution.
  - Implemented the Crawl4AI MCP provider with Effect-based error handling.
  - Developed API endpoints for MCP tool discovery and execution.
  - Created an MCP-based Crawl4AI client that uses the new infrastructure.
  - Added comprehensive unit and integration tests for the MCP implementation.

## 4. Next Steps

### 3.1 Short-term (Current Sprint)

- **Implement Crawl4AI MCP Server**: Refactor the existing `Crawl4AI` Python/FastAPI service to expose its functionality via an MCP interface.
- **Implement Manual Fetching UI**: Create UI elements allowing users to input a URL, trigger fetching via the `Crawl4AI` MCP (using the backend MCP client), display the fetched content, and initiate AI processing.
- Implement AI agents (Archivist, Scribe, Librarian) using the MCP client.
- Develop UI components for MCP configuration management.
- Add support for local LLM connections via Ollama using the @effect/ai-based LLMProviderService.
- Implement scheduled data fetching with configurable frequency.
- Create AI processing pipeline configuration UI.
- Implement Profile Management System:
  - Profile creation UI (public/private option).
  - Separate database file creation per profile.
  - Profile metadata storage (e.g., `profiles.json`).
  - Profile switching mechanism.
  - SQLCipher integration for private profiles (`better-sqlite3-sqlcipher`).
  - Password input and key derivation (PBKDF2) for unlocking private profiles.
  - Custom 'on-profile-load' migration logic using Effect.

### 3.2 Medium-term

- Enhance content processing capabilities with additional AI patterns.
- Implement advanced search and filtering with AI assistance.
- Add support for more content sources (additional APIs, specialized scrapers).
- Improve offline capabilities with better Service Worker integration.
- Investigate options for secure sharing of processed content.

### 3.3 Long-term

- Explore integration with Brave Search API for enhanced content enrichment.
- Consider implementing a plugin system for extensibility.

## 4. Active Decisions

### 4.1 Technical Decisions

- **Local-first Architecture**: Committed to maintaining local data storage and processing for privacy.
- **SQLite with Drizzle ORM**: Selected for data persistence due to simplicity and performance.
- **Profile Storage**: Adopted "one profile, one database" model with optional SQLCipher encryption.
- **Migrations**: Switched to custom, on-profile-load migration logic due to multi-DB architecture.
- **SvelteKit**: Chosen for both frontend and backend to maintain a unified codebase.
- **Bun Runtime**: Selected for performance advantages over Node.js.
- **Effect Library**: Adopted for functional programming patterns, error handling, and type safety.
- **Fabric Pattern Library**: Selected for AI pattern execution via MCP.
- **Crawl4AI as MCP Server**: The `Crawl4AI` web scraping service will be refactored into a standalone MCP server to standardize its interface and allow direct interaction from AI agents and other MCP clients (including the main backend).

### 4.2 Open Questions

- Should we support mobile devices or focus exclusively on desktop experience?
- What level of customization should be exposed for AI processing patterns?
- How should we handle very large content collections for performance?

### 4.3 Known Challenges

- Handling rate limits and blocking from various content sources.
- Managing LLM resource usage for efficient local processing with the @effect/ai-based LLMProviderService approach.
- Ensuring consistent content extraction across diverse web sources via the `Crawl4AI` MCP.
- Implementing a clean interface for LLM interactions through the @effect/ai-based LLMProviderService.
- Implementing robust error handling for AI processing pipelines.
- Creating an intuitive UI for configuring complex AI pattern sequences.
- Implementing secure key management and derivation for encrypted profiles.
- Developing and testing the custom, per-profile database migration logic.
- Developing the `Crawl4AI` MCP server interface.
- Balancing cache invalidation strategies with freshness requirements in the hybrid CAG/RAG approach.
- Optimizing database queries for efficient context retrieval in the RAG component.
- Implementing user-friendly controls for cache TTL configuration.
