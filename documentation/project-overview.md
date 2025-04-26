# Project Overview: WebInsight - Project Overview

## 1. Purpose

WebInsight is a local-first platform for web content extraction, semantic enrichment, and AI-driven insights. Its primary goal is to augment user capabilities by leveraging advanced AI techniques for tasks like summarization, analysis, metadata extraction, and content organization while ensuring user privacy, data ownership, and full offline functionality.

The platform extends beyond traditional RSS aggregation by providing advanced web scraping, HTML/JSON parsing, and semantic analysis, powered by specialized AI agents that collect, summarize, and organize content into a personalized knowledge hub.

## 2. Core Technologies

- **Runtime**: Bun 1.1.x
- **Framework**: SvelteKit (Frontend + Backend) with Svelte 5 compatibility
- **Database**: SQLite with Drizzle ORM
- **Styling**: Tailwind CSS with shadcn-svelte components
- **Type Safety**: TypeScript, Effect functional programming
- **AI Core**: [Fabric](https://github.com/danielmiessler/fabric)'s pattern library, Model Context Protocol (MCP)
- **Web Scraping**: **Crawl4AI MCP Server** (Python microservice with FastAPI & Playwright, providing web crawling via MCP)
- **Background Jobs**: Custom Scheduler
- **Real-time**: WebSockets
- **LLM Support**: Local (Ollama) and external (OpenAI, Anthropic) via MCP

## 3. Key Features

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

## 4. High-Level Architecture

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
- **AI Layer (Fabric AI with MCP)**:
  - Three specialized agents:
    - **The Archivist**: Collects content (using Feed Service and **Crawl4AI MCP**), extracts metadata using MCP pattern sequences.
    - **The Scribe**: Summarizes content, extracts key points via Fabric patterns.
    - **The Librarian**: Generates recommendations using MCP pipelines.
- **Data Layer**:
  - SQLite database with Drizzle ORM
  - MCP connection management
  - Profile-specific databases (optionally encrypted via SQLCipher)
  - Immutable data structures
  - Pure data transformations
  - Encrypted storage for API credentials

## 5. Key Links

- Requirements: [requirements.md](./requirements.md)
- Architecture: [architecture.md](./architecture.md)
- Technical Specifications: [technical-specs.md](./technical-specs.md)
- Work in Progress: [work-in-progress.md](./work-in-progress.md)
- Status: [status.md](./status.md)
- Components: [components/](./components/)
- Integrations: [integrations/](./integrations/)
