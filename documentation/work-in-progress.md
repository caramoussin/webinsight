# WebInsight - Work In Progress & Active Decisions

## 1. Current Focus

- **Effect Functional Programming Integration**: Implementing the Effect library for functional programming patterns, error handling, and type safety.
- ✅ **Crawl4AI MCP Integration**: Successfully completed the refactoring of Crawl4AI service to use the Model Context Protocol (MCP) pattern, including server, client, and comprehensive test suite.
- **@effect/ai Integration**: Implementing a direct Effect-based service using @effect/ai for LLM interactions and transformer operations.
- **Transformer Integration**: Integrating transformer models (e.g., sentence-transformers/all-MiniLM-L6-v2) for embedding generation and text processing.
- **Milvus Lite Integration**: Implementing Milvus Lite for vector storage and similarity search.
- **AI Agent Development**: Implementing the specialized AI agents (Archivist, Scribe, Librarian) using the MCP client and @effect/ai.
- **Enhanced Hybrid CAG/RAG Strategy**: Implementing a Cache-Augmented Generation and Retrieval-Augmented Generation strategy using transformer-generated embeddings, Milvus Lite, and Effect.Cache to optimize AI performance and accuracy.

## 2. Recent Changes

### 2.1 Documentation

- Created project-overview.md with high-level summary of project purpose, technologies, and architecture.
- Renamed specifications.md to technical-specs.md for consistency.
- Created requirements.md with functional and non-functional requirements.
- Organized documentation into subdirectories (components/, integrations/).
- Moved crawl4ai-integration-plan.md to integrations/ subdirectory.
- Renamed fabric-mcp.md to ai-pattern-mcp.md and moved it to integrations/ subdirectory.
- Updated requirements to include configurable scheduled data fetching.
- Added requirements for customizable AI processing pipelines with pattern sequences.
- Created cag-rag-strategy.md in integrations/ documenting the hybrid CAG/RAG approach with Effect.Cache.

### 2.2 Core Features

- **Effect Functional Programming**:
  - Implemented Effect library for functional error handling and type safety.
  - Created utility functions for effect-based API interactions.
  - Integrated Effect Schema for robust validation.
  - **Added Effect.Cache implementation** for optimizing AI operations with the hybrid CAG/RAG strategy.
  - Integrated @effect/ai for managing transformer operations and LLM interactions.
  - **Fixed unit test implementation** to properly mock Response objects and align with Effect patterns.
- **Crawl4AI Integration**:
  - Implemented Crawl4AIClient with Effect-based error handling.
  - Created API endpoints for web scraping with JavaScript support.
  - Added configuration for handling rate limits and respecting robots.txt.
  - Implemented robots.txt compliance checking.
- **MCP Implementation**:
  - **Completed MCP Host** with provider registration and tool execution capabilities.
  - **Completed Crawl4AI MCP Provider** with standardized tool interface.
  - **Finalized MCPCrawl4AIClient** with comprehensive test coverage.
  - **Fixed all unit tests** to properly mock Response objects and align with Effect patterns.
  - **Developed MCP-based Crawl4AI client** for accessing web content extraction capabilities.
  - **Created API endpoints** for MCP tool discovery and execution.
  - Developed MCPClient class with Effect-based error handling.
  - Implemented pattern execution and sequence capabilities.
  - Added server availability checking and pattern listing.
- **RSS Integration**:
  - Added basic RSS parsing functionality.
  - Implemented RSSParsingService with Effect-based error handling for fetching and parsing RSS feeds.
  - Created FeedItemProcessingService for validating, processing, and storing RSS feed items.
  - Added AI analysis integration for RSS feed content with error handling.
  - Implemented comprehensive unit tests for RSS parsing and processing services.
- **AI Performance Optimization**:
  - Designed and implemented enhanced hybrid CAG/RAG strategy with transformer models, Milvus Lite, and Effect.Cache.
  - Created database schema extensions for cached AI results and embedding references.
  - Implemented Milvus Lite for efficient vector storage and similarity search.
  - Integrated transformer models for embedding generation via @effect/ai.
  - Implemented semantic similarity search for more accurate context retrieval.

## 3. Recent Achievements

- **Crawl4AI MCP Integration Completed**:
  - Successfully completed the full refactoring of Crawl4AI service to use the Model Context Protocol (MCP) pattern.
  - Implemented a robust MCP host as a central registry for providers.
  - Created a standardized provider interface for tool discovery and execution.
  - Developed a comprehensive MCPCrawl4AIClient with proper Effect TS integration.
  - Fixed all unit tests with proper Response mocking and alignment with Effect patterns.
  - Achieved 100% pass rate across all 64 unit tests in 7 test files.
  - Implemented the Crawl4AI MCP provider with Effect-based error handling.
  - Developed API endpoints for MCP tool discovery and execution.
  - Created an MCP-based Crawl4AI client that uses the new infrastructure.
  - Added comprehensive unit and integration tests for the MCP implementation.

- **Transformer and Vector Database Integration**:
  - Successfully integrated transformer models for embedding generation.
  - Implemented Milvus Lite for efficient vector storage and similarity search.
  - Enhanced the RAG component with semantic similarity search.
  - Created a type-safe @effect/ai integration for managing transformer operations.
  - Developed a MilvusService with Effect-based error handling.
  - Added embedding generation and storage to the Archivist agent.

## 4. Next Steps

### 4.1 Short-term (Current Sprint)

- **Implement Crawl4AI MCP Server**: Refactor the existing `Crawl4AI` Python/FastAPI service to expose its functionality via an MCP interface.
- **Implement Manual Fetching UI**: Create UI elements allowing users to input a URL, trigger fetching via the `Crawl4AI` MCP (using the backend MCP client), display the fetched content, and initiate AI processing.
- **Implement Transformer Integration**: Integrate transformer models for embedding generation and text processing tasks.
- **Implement Milvus Lite**: Set up Milvus Lite for vector storage and similarity search.
- **Enhance RAG with Semantic Search**: Update the RAG component to use transformer-generated embeddings for context retrieval.
- Implement AI agents (Archivist, Scribe, Librarian) using the MCP client and @effect/ai.
- Develop UI components for MCP and transformer configuration management.
- Add support for local LLM and transformer model connections via Ollama using the @effect/ai-based service.
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

### 4.2 Medium-term

- Enhance content processing capabilities with additional AI patterns and transformer models.
- Implement advanced search and filtering with embedding-based similarity search.
- Add support for more content sources (additional APIs, specialized scrapers).
- Improve offline capabilities with better Service Worker integration, including local transformer model caching.
- Investigate options for fine-tuning transformer models for domain-specific embeddings.
- Develop embedding visualization tools for content exploration.
- Implement UI components for semantic search configuration.
- Investigate options for secure sharing of processed content.

### 4.3 Long-term

- Explore integration with Brave Search API for enhanced content enrichment.
- Consider implementing a plugin system for extensibility.
- Investigate upgrading to full Milvus deployment for larger vector collections.
- Explore multi-modal transformer models for image and text embedding.
- Research federated learning approaches for privacy-preserving model improvements.

## 5. Active Decisions

### 5.1 Technical Decisions

- **Local-first Architecture**: Committed to maintaining local data storage and processing for privacy.
- **SQLite with Drizzle ORM**: Selected for structured data persistence due to simplicity and performance.
- **Milvus Lite**: Selected for vector storage and similarity search due to its lightweight nature and performance advantages.
- **Transformer Models**: Adopted sentence-transformers/all-MiniLM-L6-v2 for embedding generation due to its balance of performance and accuracy.
- **@effect/ai**: Selected for managing transformer operations and LLM interactions with functional programming benefits.
- **Profile Storage**: Adopted "one profile, one database" model with optional SQLCipher encryption.
- **Migrations**: Switched to custom, on-profile-load migration logic due to multi-DB architecture.
- **SvelteKit**: Chosen for both frontend and backend to maintain a unified codebase.
- **Bun Runtime**: Selected for performance advantages over Node.js.
- **Effect Library**: Adopted for functional programming patterns, error handling, and type safety.
- **AI Pattern Library**: Selected for standardized AI pattern execution via MCP.
- **Crawl4AI as MCP Server**: The `Crawl4AI` web scraping service will be refactored into a standalone MCP server to standardize its interface and allow direct interaction from AI agents and other MCP clients (including the main backend).

### 5.2 Open Questions

- Should we support mobile devices or focus exclusively on desktop experience?
- What level of customization should be exposed for AI processing patterns and transformer models?
- How should we handle very large vector collections for performance?
- Should we implement a mechanism for sharing embeddings between profiles?
- What is the optimal vector dimension for our use case (balancing accuracy and performance)?
- Should we implement a mechanism for exporting and importing embeddings?

### 5.3 Known Challenges

- Handling rate limits and blocking from various content sources.
- Managing LLM and transformer resource usage for efficient local processing with the @effect/ai-based approach.
- Ensuring consistent content extraction across diverse web sources via the `Crawl4AI` MCP.
- Implementing a clean interface for LLM and transformer interactions through @effect/ai.
- Implementing robust error handling for AI processing pipelines and vector operations.
- Creating an intuitive UI for configuring complex AI pattern sequences and transformer models.
- Implementing secure key management and derivation for encrypted profiles.
- Developing and testing the custom, per-profile database migration logic.
- Developing the `Crawl4AI` MCP server interface.
- Balancing cache invalidation strategies with freshness requirements in the hybrid CAG/RAG approach.
- Optimizing vector similarity search for efficient context retrieval in the RAG component.
- Implementing user-friendly controls for cache TTL and vector search configuration.
- Managing memory usage for transformer models and Milvus Lite on low-end hardware.
- Ensuring consistent embedding quality across different content types.
- Developing strategies for handling out-of-vocabulary terms in transformer models.
