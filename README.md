# WebInsight

## Overview

**WebInsight** is a local-first platform for web content extraction, semantic enrichment, and AI-driven insights. Built with **Bun** and **SvelteKit**, it operates via a unified local server, ensuring user privacy, data ownership, and full offline functionality. The platform extends beyond traditional RSS aggregation by providing advanced web scraping, HTML/JSON parsing, and semantic analysis, powered by Fabric AI and the Model Context Protocol (MCP). It features specialized AI agents—**the Archivist**, **the Scribe**, and **the Librarian**—to collect, summarize, and organize content into a personalized knowledge hub.

## Current Implementation Highlights

### Web Scraping Capabilities

- 🌐 Multi-content type support
  - HTML content extraction
  - JSON data parsing
  - RSS feed scraping
- 🤖 Intelligent Scraping
  - Configurable selectors
  - Robots.txt compliance
  - Server-side and client-side rendering
  - LLM-optimized output via Fabric patterns and MCP

### AI Integration with MCP

- 🧠 Fabric AI pattern library integration
  - Dynamic pattern execution via MCP
  - Configurable LLM connections (local and external)
  - Pattern sequencing for complex content processing

### Frontend Architecture

- SvelteKit-based application
- Svelte 5 compatibility
- shadcn-svelte UI components
- Interactive web scraping demo
- MCP UI for LLM management

## Key Features

- 🔄 Automated RSS Feed Fetching
- 🌐 Advanced Web Content Retrieval
  - Web Scraping for Non-RSS Sources
  - HTML and JSON Content Parsing
  - Configurable Scraping Rules
  - WebInsight extraction engine with MCP integration
  - Optional Brave Search API integration
- 🧠 AI-Powered Content Analysis
  - Automatic Summarization via Fabric patterns
  - Sentiment Analysis
  - Content Categorization
  - Personalized recommendations by AI agents
  - Dynamic LLM sequencing through MCP
  - Enhanced web context (via optional Brave Search)
- 📁 Feed Collection Management
- 🔒 Local-First Architecture
  - Privacy-preserving MCP servers
  - Local data storage and processing
  - Optional external API integrations
- 🚀 High Performance with SvelteKit

## Technology Stack

- **Frontend**: SvelteKit (Svelte 5)
- **Styling**: TailwindCSS
- **Database**: SQLite with Drizzle ORM
- **Type Safety**: TypeScript, Zod
- **Scraping**: Crawl4AI, Cheerio
- **Background Jobs**: Custom Scheduler
- **AI Framework**: Fabric AI with MCP
- **LLM Support**: Local (Ollama) and external (OpenAI, Anthropic) via MCP

## Prerequisites

- Bun 1.1.x
- Node.js 20.x
- Git

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/webinsight.git
   cd webinsight
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Set up the database:

   ```bash
   bun run db:generate  # Generate migrations
   bun run db:migrate   # Apply migrations
   ```

## Development

Start the development server:

```bash
bun dev
```

## Web Scraping Demo

Navigate to `/rss-demo` to explore the web scraping functionality:

- Enter a website URL
- Specify a CSS selector
- View scraped content in a card layout
- Process content with Fabric patterns via MCP

## Available Scripts

- `bun dev`: Start development server
- `bun run build`: Build for production
- `bun run db:generate`: Generate database migrations
- `bun run db:migrate`: Apply database migrations
- `bun run db:studio`: Open Drizzle Studio for database inspection
- `bun run lint`: Run code linting

## Configuration

### Environment Variables

- `DATABASE_URL`: Path to SQLite database
- `AI_API_KEY`: API key for AI services (optional)
- `MCP_SERVER_URL`: URL for MCP server (default: localhost)
- `BRAVE_SEARCH_API_KEY`: Brave Search API key (optional)
- `BRAVE_SEARCH_TIER`: API tier ('free' or 'premium')

### Optional Brave Search Configuration

```typescript
// config/brave-search.ts
export default {
  enabled: false, // Set to true to enable Brave Search integration
  queryBudget: {
    monthly: 2000, // Free tier limit
    distribution: {
      archivist: 0.4,  // 40% allocation
      scribe: 0.35,    // 35% allocation
      librarian: 0.25  // 25% allocation
    }
  },
  caching: {
    enabled: true,
    ttl: 86400, // 24 hours
    strategy: 'memory' // or 'disk'
  },
  fallback: {
    mode: 'automatic',
    localOnly: true
  }
}
```

## Architecture

The Smart RSS Aggregator App follows a layered architecture with a strong emphasis on functional programming:

1. **Frontend Layer** (SvelteKit):
   - Components structure with UI (shadcn-svelte), feed, content, and AI components
   - Server-side rendering with SvelteKit
   - Reactive state management using Svelte stores
   - Functional reactive programming patterns
   - MCP UI for LLM management

2. **Backend Layer** (Bun + SvelteKit):
   - API endpoints in routes/api/
   - Core services including Feed Service, Web Scraping Service with Crawl4AI, and API Client Service
   - Pure functions with minimal side effects
   - Function composition for complex operations
   - MCP integration for AI pattern execution

3. **AI Layer** (Fabric AI with MCP):
   - Three specialized agents:
     - **The Archivist**: Collects content, extracts metadata using MCP pattern sequences
     - **The Scribe**: Summarizes content, extracts key points via Fabric patterns
     - **The Librarian**: Generates recommendations using MCP pipelines

4. **Data Layer**:
   - SQLite database with Drizzle ORM
   - MCP connection management
   - Immutable data structures
   - Pure data transformations
   - Encrypted storage for API credentials

## Roadmap

### Phase 1: Core RSS Feed Management [CURRENT FOCUS]

- [x] Basic RSS Feed Fetching and Parsing
- [x] SQLite Database Integration
- [x] Background Periodic Feed Updates
- [x] Web Scraping Service
- [x] Initial MCP Integration
- [ ] Comprehensive Feed Management
  - Add new RSS feeds manually
  - Validate and verify feed URLs
  - Support multiple feed formats (RSS, Atom)
- [ ] Feed Collection System
  - Create named collections
  - Organize feeds into collections
  - Move and categorize feeds
- [ ] Feed Metadata and Tracking
  - Store feed metadata (title, description, last updated)
  - Track feed fetch history
  - Monitor feed update frequency

### Phase 2: Enhanced Feed Organization

- [ ] Advanced Feed Filtering
  - Filter feeds by collection
  - Search across feed titles and descriptions
  - Sort feeds by various criteria
- [ ] Feed Health Monitoring
  - Check feed availability
  - Detect and handle broken feeds
  - Provide feed health status
- [ ] Import/Export Functionality
  - OPML import support
  - Export feed collections
  - Backup and restore feed configurations

### Phase 3: User Experience Improvements

- [ ] Responsive Feed Management Interface
  - Drag-and-drop feed organization
  - Bulk feed operations
  - Intuitive feed addition wizard
- [ ] Offline Reading Capabilities
  - Cache feed items locally
  - Read feeds without internet connection
  - Sync when connection is restored
- [ ] Notification System
  - Alerts for new feed items
  - Configurable update notifications
  - Feed update summary

### Phase 4: Initial AI Integration

- [x] MCP Integration for Fabric AI
- [ ] Basic Content Analysis
  - Extract basic metadata from feed items
  - Simple content length and type detection
  - Preliminary categorization
- [ ] Lightweight Summarization
  - Generate short summaries via Fabric patterns
  - Extract key points from articles
  - Provide reading time estimates
- [ ] Prototype Recommendation System
  - Basic content similarity detection
  - Suggest related feed items
  - Simple user interaction tracking

### Phase 5: Advanced AI Features

- [ ] Enhanced Content Analysis
  - Advanced summarization with pattern sequences
  - Sentiment analysis
  - Detailed topic extraction
- [ ] Intelligent Categorization
  - Machine learning-based categorization
  - User-trainable classification
  - Multi-label content tagging
- [ ] Personalized Content Recommendations
  - User preference learning
  - Advanced content matching
  - Adaptive recommendation algorithm

### Phase 6: Scalability and Integration

- [ ] Performance Optimization
  - Efficient database querying
  - Caching mechanisms
  - Background processing improvements
- [ ] External Integrations
  - Browser extension
  - Sharing capabilities
  - Additional MCP server support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
