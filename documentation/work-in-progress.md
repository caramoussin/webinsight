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
- Should Tauri be prioritized for low-end hardware optimization, particularly for managing resources like Milvus Lite (NFR1.4)?
- What is the most effective strategy for implementing AI integrations (transformers, Milvus Lite) in Rust while aligning with existing Fabric patterns (FR2.1.5)?
- Is mobile application support via Tauri a viable path for future WebInsight expansion?

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

## Evaluation of Tauri Framework

### Overview

Tauri is a lightweight, Rust-based framework for building cross-platform desktop applications using web technologies (HTML, CSS, JavaScript/TypeScript) for the frontend and Rust for the backend. It leverages the OS's native webview, contrasting with SvelteKit + Bun’s Node.js-based, unified TypeScript approach. This evaluation explores Tauri's potential benefits, trade-offs, and strategic fit for WebInsight.

### Benefits

Tauri offers several advantages aligned with WebInsight's goals:

- **Smaller Application Size:** Significantly smaller (1–10 MB vs. 100–200 MB for Electron) by using native webviews, improving distribution and performance on lower-end hardware (NFR1).
- **Improved Performance:** Rust backend and native webviews reduce memory usage and startup times. Rust's efficiency is beneficial for compute-intensive tasks like AI model execution (transformers, Milvus Lite) and vector operations (NFR1.1, NFR1.2, NFR1.4).
- **Enhanced Security:** Rust's memory safety and Tauri's IPC boundaries offer stronger security, fitting WebInsight's privacy-first design (NFR3, FR4.3–FR4.4).
- **Native OS Integration:** Access to native features like system tray and notifications (FR3.9), enabling seamless desktop integration.
- **Offline Capabilities:** Ideal for offline-first applications due to lightweight architecture and file system access, supporting FR3.8.
- **Potential Mobile Support:** Experimental mobile support could address future expansion (see Open Questions).

### Trade-Offs

Adopting Tauri also presents challenges:

- **Backend Rewrite:** Core backend logic (services, AI integration, database access) currently in TypeScript (Effect TS, Drizzle ORM, @effect/ai) would need a significant rewrite in Rust.
- **Loss of Unified Codebase:** Splits the codebase into JavaScript/TypeScript frontend and Rust backend, potentially increasing maintenance and complexity in areas like dependency injection and cross-language debugging.
- **Frontend Compatibility:** SvelteKit's SSR capabilities would be limited; API routes would be replaced by Rust commands via IPC, requiring frontend adjustments (FR3.7).
- **AI and Transformer Integration:** Replicating @effect/ai, Fabric patterns, and Milvus Lite integration in Rust is complex (FR2.1–FR2.6).
- **Build and Deployment Complexity:** Rust compilation is slower and adds CI/CD complexity.
- **Learning Curve & Ecosystem:** Rust has a steeper learning curve for TypeScript developers, and its tooling, while robust, is different.
- **Risk to Timeline:** The refactoring effort could delay current roadmap targets (e.g., June 15, 2025 release for Phases 2-3).

### Recommendation

Continue with the SvelteKit + Bun architecture for Phases 2–4 to leverage rapid iteration, the existing unified TypeScript codebase, and Effect TS’s functional programming strengths.
Evaluate Tauri seriously in **Phase 5 (Distribution & Polish)** via a Proof-of-Concept (PoC) to validate its benefits for WebInsight.

### Migration Strategy (Proposed for Phase 5 Evaluation)

If the PoC is successful, a phased migration could be considered:

- **Phase 3 (AI Agents - Preparatory):** Prototype a small, performance-critical Rust-based service (e.g., a dedicated MilvusService or an embedding utility) to test Rust integration and performance (1–2 weeks, parallel effort).
- **Phase 4 (Enhanced UX - PoC Development):** Develop a Tauri PoC with a limited feature set (e.g., manual fetch UI - FR1.8) and port a key service (e.g., HybridCAGService) to Rust to compare performance and development experience (3–4 weeks, parallel effort).
- **Phase 5 (Distribution & Polish - Decision & Potential Migration):** Based on PoC outcomes, decide on Tauri adoption. If positive, a full backend migration to Rust could occur, retaining the SvelteKit frontend. This would also involve leveraging Tauri’s native features (system tray, updates) (6–8 weeks).
- **Hybrid Approach (Alternative):** Explore using Rust for specific microservices (e.g., for Milvus Lite or heavy AI computations) integrated with the existing SvelteKit + Bun backend, or using Tauri as a lightweight shell for the SvelteKit application. This could offer a balance of benefits with less disruption (2–3 weeks evaluation).

### Alignment with Requirements

| Requirement                 | SvelteKit + Bun                                  | Tauri (Potential with Rust Backend)             |
|-----------------------------|--------------------------------------------------|-------------------------------------------------|
| NFR1: Performance           | Moderate (TypeScript runtime, Bun helps)         | High (Rust efficiency for backend tasks)        |
| NFR1.4: Low-end Hardware    | Standard; Milvus Lite usage a concern (<2GB RAM) | Improved potential due to smaller app & Rust    |
| NFR3: Privacy / Security    | Strong (Local-first, SQLCipher, Effect TS)       | Potentially Enhanced (Rust memory safety, IPC)  |
| FR2.1-FR2.6: AI Integration | Mature & unified (Effect TS, @effect/ai)         | Complex (Requires Rust rewrite/bindings for AI) |
| FR3.7: Real-time (IPC)      | WebSockets with SvelteKit backend                | IPC via Rust; WebSockets need Rust server       |
| FR4.3-FR4.4: Encryption     | SQLCipher via Drizzle (TypeScript)               | SQLCipher via Rust ORM (e.g., sqlx)             |
| Modularity (NFR5)           | Good (Effect TS Layers, SvelteKit modules)       | Strong (Rust crates, Tauri plugins); split stack|
| Development Velocity        | High (Unified TypeScript, Bun, Effect TS)        | Potentially Slower (Rust learning, dual stack)  |

## Roadmap

### Phase 5: Distribution & Polish (Post-MVP Refinements)

- **Evaluate Tauri Framework for Distribution & Performance:**
  - Conduct a Proof-of-Concept (PoC) for packaging WebInsight with Tauri.
  - Prototype key backend services in Rust to assess performance benefits and development effort.
  - Investigate hybrid approaches (Rust microservices, Tauri shell).
  - Dependencies: Rust development skills, updated CI/CD pipelines for Rust builds.
  - Risks: Potential delays to other Phase 5 objectives if PoC/migration is extensive; learning curve for Rust.
