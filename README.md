# Flux RSS Fabric AI

## Overview

The **Smart RSS Aggregator App** is a local-first application designed to enhance content consumption through intelligent RSS feed aggregation and AI-powered analysis. Built with **Bun** and **SvelteKit**, it operates via a unified local server, ensuring user privacy, data ownership, and full offline functionality. The app extends beyond traditional RSS aggregation by incorporating **web scraping and HTML/JSON parsing**, leveraging **Crawl4AI** for robust content extraction. Powered by **Fabric AI**, it features three specialized AI agents—**the Archivist**, **the Scribe**, and **the Librarian**—to collect, summarize, and organize content into a personalized knowledge hub.

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

### Frontend Architecture

- SvelteKit-based application
- Svelte 5 compatibility
- shadcn-svelte UI components
- Interactive web scraping demo

## Key Features

- 🔄 Automated RSS Feed Fetching
- 🌐 Advanced Web Content Retrieval
  - Web Scraping for Non-RSS Sources
  - HTML and JSON Content Parsing
  - Configurable Scraping Rules
- 🧠 AI-Powered Content Analysis
  - Automatic Summarization
  - Sentiment Analysis
  - Content Categorization
  - Personalized recommendations by AI agents
- 📁 Feed Collection Management
- 🔒 Local-First Architecture
- 🚀 High Performance with SvelteKit

## Technology Stack

- **Frontend**: SvelteKit (Svelte 5)
- **Styling**: TailwindCSS
- **Database**: SQLite with Drizzle ORM
- **Type Safety**: TypeScript, Zod
- **Scraping**: Cheerio
- **Background Jobs**: Custom Scheduler

## Prerequisites

- Bun 1.1.x
- Node.js 20.x
- Git

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/flux-rss-fabric-ai.git
   cd flux-rss-fabric-ai
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

## Roadmap

### Phase 1: Core RSS Feed Management [CURRENT FOCUS]

- [x] Basic RSS Feed Fetching and Parsing
- [x] SQLite Database Integration
- [x] Background Periodic Feed Updates
- [x] Web Scraping Service
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

- [ ] Basic Content Analysis
  - Extract basic metadata from feed items
  - Simple content length and type detection
  - Preliminary categorization
- [ ] Lightweight Summarization
  - Generate short summaries
  - Extract key points from articles
  - Provide reading time estimates
- [ ] Prototype Recommendation System
  - Basic content similarity detection
  - Suggest related feed items
  - Simple user interaction tracking

### Phase 5: Advanced AI Features

- [ ] Enhanced Content Analysis
  - Advanced summarization
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
  - API for external access

## Long-Term Vision

Flux RSS Fabric AI aims to revolutionize content aggregation and analysis through intelligent, user-centric design and advanced AI technologies.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact
