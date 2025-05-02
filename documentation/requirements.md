# WebInsight - Functional Requirements

## 1. Introduction

This document outlines the core functional requirements for WebInsight. It defines the problems WebInsight aims to solve by providing intelligent tools for content aggregation and analysis, the target users, and the key features enabling users to gain deeper insights from web content.

## 2. Goals & Problems Solved

- **Goal**: Provide users with WebInsight, an intelligent, local-first tool to aggregate, process, and analyze content from various web sources (RSS, web pages, APIs).
- **Problem**: Information overload from multiple sources; difficulty in extracting key insights, summarizing content, and organizing information efficiently.
- **Goal**: Enhance user productivity and knowledge management through WebInsight by leveraging AI for deeper content understanding.
- **Problem**: Need for privacy-preserving AI tools that operate locally without relying solely on external cloud services.
- **Goal**: Offer a flexible and configurable platform for content interaction and insight generation.

## 3. Target Users

- Researchers, students, professionals, and knowledge workers seeking efficient ways to monitor, analyze, and gain insights from diverse online information sources.
- Users concerned with data privacy who prefer local data processing.
- Individuals looking for customizable AI-powered tools for personal knowledge management and insight discovery.

## 4. Functional Requirements (Features)

### 4.1 Content Aggregation & Collection

- **FR1.1**: Aggregate content from standard RSS/Atom feeds.
- **FR1.2**: Scrape and extract main content from web pages (HTML).
  - **FR1.2.1**: Handle dynamic, JavaScript-heavy websites.
- **FR1.3**: Fetch content from configured JSON APIs (e.g., Reddit, GitHub, X API).
- **FR1.4**: Manage content sources (add, edit, delete feeds, URLs, API configurations).
- **FR1.5**: Respect `robots.txt` rules during scraping (handled by Crawl4AI MCP).
- **FR1.6**: Provide mechanisms for handling rate limits for feeds and APIs.
- **FR1.7**: Allow users to configure scheduled/periodic data fetching with customizable frequency for automated content collection.
- **FR1.8**: Provide a UI mechanism for users to manually input a URL (RSS, HTML, JSON) and trigger immediate content fetching and optional AI processing.
  - **FR1.8.1**: Display the fetched content directly in the UI.

### 4.2 Content Processing & AI Analysis (Leveraging Fabric Pattern Library, Transformers, @effect/ai & MCP)

- **FR2.1**: Process extracted content using configurable AI patterns (from Fabric pattern library).
  - **FR2.1.1**: Summarize content using transformer models for text generation.
  - **FR2.1.2**: Extract key insights/wisdom using Fabric patterns.
  - **FR2.1.3**: Analyze claims or sentiment using transformer-based understanding.
  - **FR2.1.4**: Extract metadata (tags, entities) using transformer models.
  - **FR2.1.5**: Generate embeddings using transformer models for semantic representation.
- **FR2.2**: Allow sequencing of AI patterns for multi-step processing (e.g., extract then summarize).
- **FR2.3**: Provide AI-driven content recommendations and organization suggestions (Librarian agent) using semantic similarity search.
  - **FR2.3.1**: Use transformer-generated embeddings stored in Milvus Lite for finding similar content.
  - **FR2.3.2**: Support configurable similarity thresholds and result counts for recommendations.
- **FR2.4**: Configure and manage connections to LLMs and transformer models (local like Ollama, external like OpenAI) via the @effect/ai-based UI.
  - **FR2.4.1**: Install/setup local LLM and transformer model servers (if applicable).
  - **FR2.4.2**: Assign specific models/configurations to different AI agents/tasks.
  - **FR2.4.3**: Configure embedding models for vector generation (e.g., sentence-transformers/all-MiniLM-L6-v2).
- **FR2.5**: (Optional) Integrate with Brave Search API for enhanced content enrichment and real-time web context.
- **FR2.6**: Allow users to configure AI processing pipelines with customizable patterns and sequences.
  - **FR2.6.1**: Support routines that can be scheduled and executed periodically.
  - **FR2.6.2**: Allow configuration of transformer operations in processing pipelines.

### 4.3 User Interface & Experience

- **FR3.1**: Provide a clean, intuitive user interface for browsing aggregated content.
- **FR3.2**: Display articles/content in a readable format.
- **FR3.3**: Allow users to organize content into collections/folders.
- **FR3.4**: Implement advanced search and filtering capabilities (text-based, tags, source, etc.), potentially enhanced by AI features.
- **FR3.5**: Offer a responsive design suitable for desktop use.
- **FR3.6**: Support dark mode.
- **FR3.7**: Provide real-time updates (e.g., new content, MCP connection status) via WebSockets.
- **FR3.8**: Implement basic offline reading capabilities (Service Workers).
- **FR3.9**: Include a dedicated UI section for managing AI settings (MCP connections, LLM configuration, pattern assignment).

### 4.4 Data Management & Privacy

- **FR4.1**: Allow users to create multiple profiles to manage different contexts or data sets.
- **FR4.2**: Each profile's data MUST be stored in a separate, isolated database file.
- **FR4.3**: When creating a profile, the user MUST be able to choose if the profile's database should be encrypted (private) or unencrypted (public).
- **FR4.4**: For encrypted profiles, require a user-provided password to unlock and access the profile data upon loading.
- **FR4.5**: User can use a strong passwrod generator to create a password for their profile.
- **FR4.6**: Provide mechanisms to switch between loaded profiles.

### 4.5 Data Management & Privacy

- **FR5.1**: Store all user data (feeds, articles, collections, configurations, embeddings) locally within the context of the currently active profile.
- **FR5.2**: Use a local SQLite database for structured data persistence and Milvus Lite for vector storage for each profile.
  - **FR5.2.1**: Ensure Milvus Lite operates entirely locally without external dependencies.
  - **FR5.2.2**: Implement efficient vector indexing (HNSW) for fast similarity searches.
  - **FR5.2.3**: Maintain references between SQLite records and Milvus Lite vectors.
- **FR5.3**: Ensure user privacy by defaulting to local processing, local LLMs, and local transformer models where possible.
  - **FR5.3.1**: Run transformer models locally via Ollama for privacy-preserving embedding generation.
  - **FR5.3.2**: Ensure no embedding data is sent to external services without explicit consent.
- **FR5.4**: Apply SQLCipher encryption to the entire database file for profiles marked as private.
  - **FR5.4.1**: Ensure vector data in Milvus Lite is also protected for private profiles.
- **FR5.5**: Provide options for data import/export (scope to be defined, likely per-profile).
  - **FR5.5.1**: Include options for exporting and importing embeddings along with content.
- **FR5.6**: Securely store any necessary API keys or credentials (potentially within the profile database if encrypted, or a separate secure store).
- **FR5.7**: Implement basic data backup mechanisms (potentially per-profile).
  - **FR5.7.1**: Include vector data in backups for complete profile preservation.

## 5. Non-Functional Requirements

- **NFR1**: **Performance**: The application should be responsive, especially the UI. Background tasks (fetching, AI processing, vector operations) should not block the UI.
  - **NFR1.1**: Vector similarity searches in Milvus Lite should complete in under 100ms for collections up to 10,000 vectors.
  - **NFR1.2**: Embedding generation should process text at a rate of at least 5 articles per second on recommended hardware.
  - **NFR1.3**: The application should remain responsive with vector collections of up to 100,000 embeddings.
  - **NFR1.4**: Memory usage should not exceed 2GB for Milvus Lite operations on standard collections.
- **NFR2**: **Reliability**: Fetching, processing, and vector operations should be robust, with appropriate error handling and retries.
  - **NFR2.1**: Embedding generation failures should not block content processing; fallback to metadata-based retrieval when necessary.
  - **NFR2.2**: Vector database operations should be transactional to prevent data corruption.
- **NFR3**: **Privacy**: Prioritize local data storage and processing. Provide robust optional encryption for sensitive profiles.
  - **NFR3.1**: Transformer models should run locally via Ollama for privacy-preserving embedding generation.
  - **NFR3.2**: No embedding data should be sent to external services without explicit user consent.
  - **NFR3.3**: Vector operations should be performed entirely locally without external dependencies.
- **NFR4**: **Usability**: The interface should be intuitive for managing feeds, content, AI configurations, transformer models, and profiles.
  - **NFR4.1**: Provide clear visualizations of embedding-based similarity for content exploration.
  - **NFR4.2**: Allow easy configuration of vector search parameters (similarity threshold, result count).
- **NFR5**: **Modularity**: The architecture should allow for adding new content sources, AI patterns, transformer models, or features relatively easily.
  - **NFR5.1**: Support pluggable embedding models with standardized interfaces.
  - **NFR5.2**: Allow for future upgrades from Milvus Lite to full Milvus if needed.
- **NFR6**: **Security**: Protect user data, embeddings, and credentials stored locally. Implement strong encryption (SQLCipher) for private profiles and secure key handling.
  - **NFR6.1**: Ensure vector data is protected with the same level of security as structured data.
  - **NFR6.2**: Implement secure handling of embedding model parameters and weights.
