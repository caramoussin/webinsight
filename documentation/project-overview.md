# Project Overview: WebInsight - Project Overview

## 1. Purpose

WebInsight is a local-first platform for web content extraction, semantic enrichment, and AI-driven insights. Its primary goal is to augment user capabilities by leveraging advanced AI techniques for tasks like summarization, analysis, metadata extraction, and content organization while ensuring user privacy, data ownership, and full offline functionality.

The platform extends beyond traditional RSS aggregation by providing advanced web scraping, HTML/JSON parsing, and semantic analysis, powered by specialized AI agents that collect, summarize, and organize content into a personalized knowledge hub.

## 2. Core Technologies

- **Runtime**: Bun 1.1.x
- **Framework**: SvelteKit (Frontend + Backend) with Svelte 5 compatibility
- **Database**: SQLite with Drizzle ORM and Milvus Lite for vector storage
- **Styling**: Tailwind CSS with shadcn-svelte components
- **Type Safety**: TypeScript, Effect functional programming
- **AI Core**:
  - [Fabric pattern library](https://github.com/danielmiessler/fabric/tree/main/patterns) for AI operations
  - Model Context Protocol (MCP) for standardized tool access
  - Transformer models (e.g., sentence-transformers/all-MiniLM-L6-v2) for embeddings
  - @effect/ai for managing transformer operations and LLM interactions
- **Web Scraping**: **Crawl4AI MCP Server** (Python microservice with FastAPI & Playwright, providing web crawling via MCP)
- **Background Jobs**: Custom Scheduler
- **Real-time**: WebSockets
- **LLM Support**: Local (Ollama) and external (OpenAI, Anthropic) via @effect/ai

## 3. Technology Choices

WebInsight is built on a modern, carefully selected technology stack designed for performance, developer experience, and alignment with our local-first, AI-driven vision:

- **Runtime:** Bun (Fast JavaScript/TypeScript runtime and toolkit)
- **Framework:** SvelteKit (Full-stack framework for frontend and backend)
- **Core Logic & Functional Programming:** Effect TS (Robust functional programming library for TypeScript)
- **Database:** SQLite (Local, per-profile databases) with Drizzle ORM
- **AI Integration:**
  - `@effect/ai` for managing local transformer models and LLM interactions (Ollama, OpenAI).
  - Milvus Lite for local vector search.
  - Fabric patterns via Model Context Protocol (MCP) for AI capabilities.
  - Crawl4AI MCP Server for web scraping.
- **UI:** Tailwind CSS with shadcn-svelte components.

**Future Considerations:**
For later project phases (specifically Phase 5: Distribution & Polish), **Tauri** is being evaluated as an alternative framework. Tauri, with its Rust backend, offers potential benefits in terms of significantly smaller application size, enhanced performance for compute-intensive tasks, and strong security features inherent to Rust. This evaluation aims to ensure WebInsight can be efficiently distributed and run optimally, especially on systems with limited resources, while maintaining its core architectural principles.

## 4. Project Goals

WebInsight aims to revolutionize content aggregation and personal knowledge management by providing a powerful, private, and user-centric desktop application. Key goals include:

- **Privacy-First:** All user data is processed and stored locally. Encryption options (SQLCipher) for sensitive profiles (NFR3).
- **AI-Powered Insights:** Leverage local AI (transformers, LLMs, vector search) to provide summaries, categorizations, and semantic search over aggregated content (FR2).
- **User-Centric Design:** Intuitive, customizable, and responsive UI/UX (FR3).
- **Comprehensive Content Aggregation:** Support for diverse sources like RSS, web pages, and potentially social media (FR1).
- **Cross-Platform Support:** Deliver a consistent experience on Windows, macOS, and Linux.
- **Modularity and Extensibility:** Design for future growth with a modular architecture (NFR5).
- **Offline Capabilities:** Ensure core functionality is available offline (FR3.8).
- **Support for Low-End Hardware:** While providing powerful features, strive for efficient resource utilization. The potential future adoption of Tauri is being considered to further enhance support for low-end hardware (NFR1.4) and reinforce privacy through Rust's security model, aligning with our commitment to accessibility and data protection.

## 5. Key Features

- **Automated RSS Feed Fetching**: Collect content from standard RSS/Atom feeds
- **Advanced Web Content Retrieval**:
  - **Manual Fetching**: Initiate content retrieval directly from the UI for any given URL (RSS, HTML, JSON).
  - Web Scraping for Non-RSS Sources (via Crawl4AI MCP)
  - HTML and JSON Content Parsing
  - Configurable Scraping Rules (managed by Crawl4AI MCP)
  - WebInsight extraction engine with MCP integration
  - Optional Brave Search API integration
- **AI-Powered Content Analysis**:
  - Automatic Summarization via Fabric patterns
  - Sentiment Analysis
  - Content Categorization
  - Personalized recommendations by AI agents
  - Dynamic LLM sequencing through MCP
- **Profile Management**:
  - Support for multiple user profiles.
  - Each profile stored in a separate database file.
  - Optional database-level encryption per profile using SQLCipher.
- **Feed Collection Management**: Organize feeds into collections
- **Local-First Architecture**:
  - Privacy-preserving MCP servers (including Crawl4AI)
  - Local data storage and processing
  - Optional external API integrations

## 6. High-Level Architecture

The application follows a layered architecture with a strong emphasis on functional programming:

- **Frontend Layer (SvelteKit)**:
  - Components structure with UI (shadcn-svelte), feed, content, and AI components
  - **Manual Fetching UI**: Allows users to trigger content retrieval.
  - Server-side rendering with SvelteKit
  - Reactive state management using Svelte stores
  - Functional reactive programming patterns
  - MCP UI for LLM management
- **Backend Layer (Bun + SvelteKit)**:
  - API endpoints in `routes/api/` (handles UI requests, including manual fetches).
  - **MCP Client**: Acts as a client to interact with various MCP servers (Fabric, LLMs, Crawl4AI).
  - Core services including Feed Service, **Web Scraping Service (interacts with Crawl4AI MCP)**, and API Client Service.
  - Pure functions with minimal side effects
  - Function composition for complex operations
  - MCP integration for AI pattern execution
- **AI Layer (Fabric Pattern Library + Transformers + @effect/ai + MCP)**:
  - Three specialized agents:
    - **The Archivist**: Collects content (using Feed Service and **Crawl4AI MCP**), extracts metadata using MCP pattern sequences, generates embeddings using transformers managed by @effect/ai.
    - **The Scribe**: Summarizes content, extracts key points via Fabric pattern library operations, using transformer models for text generation.
    - **The Librarian**: Generates recommendations using MCP pipelines and semantic similarity search with transformer-generated embeddings stored in Milvus Lite.
- **Data Layer**:
  - SQLite database with Drizzle ORM for structured data
  - Milvus Lite for vector storage and similarity search
  - MCP connection management
  - Profile-specific databases (optionally encrypted via SQLCipher)
  - Immutable data structures
  - Pure data transformations
  - Encrypted storage for API credentials

## 7. Glossary

- **Embeddings**: Numerical vectors that capture the semantic meaning of text, generated by transformer models. These vectors enable semantic similarity search in the RAG strategy, improving context retrieval accuracy. WebInsight uses the sentence-transformers/all-MiniLM-L6-v2 model to generate 384-dimensional embeddings, which are stored in Milvus Lite and used for finding semantically similar content.

- **Transformers**: Neural network architectures that use self-attention mechanisms to process sequential data. In WebInsight, transformers are used for generating embeddings and text processing tasks like summarization and metadata extraction.

- **@effect/ai**: A TypeScript library extending Effect TS for AI operations, providing type-safe interfaces for LLM interactions, embedding generation, and AI agent management with functional programming benefits.

- **Milvus Lite**: A lightweight vector database for storing and efficiently searching embeddings. It provides significantly faster similarity searches than traditional databases like SQLite for vector operations.

- **Fabric Pattern Library**: A collection of standardized AI task patterns (e.g., summarize, extract_wisdom) from the [Fabric project](https://github.com/danielmiessler/fabric/tree/main/patterns) that structure AI operations in a consistent way. WebInsight uses these patterns via MCP but does not rely on the broader Fabric AI framework.

## 8. Key Links

- Requirements: [requirements.md](./requirements.md)
- Architecture: [architecture.md](./architecture.md)
- Technical Specifications: [technical-specs.md](./technical-specs.md)
- Work in Progress: [work-in-progress.md](./work-in-progress.md)
- Status: [status.md](./status.md)
- Components: [components/](./components/)
- Integrations: [integrations/](./integrations/)
