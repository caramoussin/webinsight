# WebInsight - Technical Specifications

## Overview

WebInsight integrates Fabric AI with the Model Context Protocol (MCP) for specialized tools like Crawl4AI, while using a direct Effect-based LLMProviderService for LLM interactions. This specification details the technical foundation, including the use of Fabric's pattern library, the LLMProviderService for LLM integration, and the UI for managing these AI capabilities.

## Features

### 1. Content Collection and Processing

#### Web Scraping (Powered by **Crawl4AI MCP Server**)

- Dedicated Python microservice (`Crawl4AI`) implementing an MCP server interface for web crawling and content extraction.
- Uses Playwright for handling JavaScript-heavy sites.
- Processes scraped content with Fabric patterns via MCP (e.g., `summarize`), orchestrated by the main backend or AI agents acting as MCP clients.
- Configurable LLM connections through the LLMProviderService UI (used by the *consumers* of the scraped content, not Crawl4AI itself).

### 2. AI-Powered Analysis

#### Hybrid CAG/RAG Strategy

- **Cache-Augmented Generation (CAG)**: Caches AI outputs to reduce redundant computations and improve response times.
- **Retrieval-Augmented Generation (RAG)**: Enhances AI generation with relevant context from the local database.
- **Effect.Cache Integration**: Provides type-safe, efficient caching with configurable TTL.
- **Performance Benefits**: Reduces LLM usage, improves response times, and enhances reliability.
- **Quality Improvements**: Context retrieval improves relevance and accuracy of AI-generated content.

#### The Archivist Agent

- Uses MCP to pipe content through pattern sequences (e.g., `extract_wisdom` → `organize`).
- Leverages the RAG component to enrich metadata extraction with contextual information.

#### The Scribe Agent

- Executes Fabric patterns via MCP for summarization and key point extraction.
- Uses cached results when available via the CAG component.
- Enhances summaries with context from similar articles via the RAG component.

#### The Librarian Agent

- Leverages MCP for dynamic recommendation workflows.
- Uses metadata-based retrieval to find relevant articles for recommendations.
- Caches recommendation results to improve performance.

### 3. User Interface and Experience

- LLM Provider UI: SvelteKit component to install and configure LLM providers (local like Ollama, external like OpenAI).
  - Example: Select "Ollama/llama2," configure temperature, assign to Scribe.
- Server-rendered SvelteKit application
- Responsive Tailwind CSS design
- shadcn-svelte components
- Dark mode support
- Real-time updates via WebSocket with MCP connection status
- Offline-first functionality
- Intuitive content organization with MCP-driven pattern outputs
- Advanced search and filtering enhanced by Fabric patterns

### 4. Data Management and Privacy

- Local SQLite database with MCP connection table
- Efficient data querying
- Automatic backups
- Import/export capabilities
- Privacy-preserving design with local MCP servers
- User data control
- Secure configuration
- Encrypted storage for API credentials
- No reliance on external services for content processing beyond optional LLM providers

### 5. API Integration

- Configurable API source management via MCP
- Support for various API services (X, GitHub, Reddit, etc.) with MCP endpoints
- X API integration via JSON endpoints (e.g., `user_timeline.json`) processed through MCP
- Secure credential storage and encryption
- Rate limit management and scheduling
- User-friendly API configuration interface integrated with MCP UI
- Response parsing and normalization with Fabric patterns
- Local caching of API responses

### 6. Optional Brave Search Integration

#### Core Integration Features

- Privacy-focused web search capabilities
- AI-optimized content enrichment
- Schema-enriched metadata extraction
- Real-time web context integration
- Efficient query management (2,000 free monthly queries)

#### Query Management System

- Intelligent query budget allocation per agent:
  - Archivist: 40% (metadata enrichment, content discovery)
  - Scribe: 35% (content analysis, summarization)
  - Librarian: 25% (recommendations, trends)
- Cache-first strategy with TTL management
- Request batching and deduplication
- Automatic fallback to local processing

#### Integration Tiers

1. **Basic Tier (Free - 2,000 queries/month)**
   - Essential search capabilities
   - Basic metadata enrichment
   - Local cache system
   - Fallback mechanisms

2. **Premium Tier (Optional)**
   - Enhanced AI inference rights
   - Data storage for training
   - Expanded query limits
   - Additional search features (news, video)

#### Fallback Architecture

```typescript
interface BraveSearchFallback {
  mode: 'automatic' | 'manual';
  triggers: {
    quotaExceeded: boolean;
    apiTimeout: number;
    errorThreshold: number;
  };
  strategy: {
    localOnly: boolean;
    hybridProcessing: boolean;
    cacheExtension: number;
  };
}
```

## Technical Architecture

### Performance Optimization with Hybrid CAG/RAG

- **Cache Implementation**: Uses `Effect.Cache` with a capacity of 1000 entries and configurable TTL.
- **Cache Keys**: Structured as `{ articleId, queryType }` for type-safe lookups.
- **Context Retrieval**: Uses metadata-based queries to find relevant articles for context.
- **Database Schema**: Extended with `cached_results` table to persist cached outputs.
- **Invalidation Strategy**: Time-based (TTL) and content-based (article updates) invalidation.
- **User Configuration**: Adjustable TTL settings via preferences UI.

```typescript
// Example cache configuration
const cache = Cache.make({
  lookup: (key) => retrieveOrGenerateContent(key),
  capacity: 1000,
  timeToLive: '1 day',
});
```

### Unified Local Server (SvelteKit/Bun Backend)

- Runtime: Bun for high-performance operations
- Application Server: SvelteKit for frontend and backend logic
- Database: SQLite with Drizzle ORM for type-safe data management
- **Web Scraping Client**: Logic within the backend acts as an MCP client to communicate with the external `Crawl4AI MCP Server`.
- RSS & Nitter: Feed Service with Nitter instance management
- API Integration: Configurable API client service with MCP
- AI Integration: Fabric AI with MCP for pattern execution and direct Effect-based LLMProviderService for LLM management
- Real-Time Updates: WebSocket for live notifications including MCP updates
- Background Jobs: Custom scheduler for periodic tasks and API rate limit management
- Programming Paradigm: Functional programming with pure functions and immutable data structures

### External Services / Servers

- **Crawl4AI MCP Server**: Standalone Python/FastAPI/Playwright microservice providing web scraping capabilities via an MCP interface.
- **Fabric MCP Server(s)**: Servers exposing Fabric AI patterns.
- **LLM Provider Service**: Direct Effect-based service using @effect/ai for interacting with LLM providers (local like Ollama or external like OpenAI).

### Frontend Stack

- SvelteKit (server-rendered)
- Tailwind CSS for styling
- shadcn-svelte components
- WebSocket client for MCP status
- Service workers
- Local caching

### Data Layer

- SQLite for persistence with MCP connection schema
- Extended schema for CAG/RAG strategy:
- **Profile Databases**: Uses the "one profile, one database" model. Each profile's data resides in a dedicated SQLite file (e.g., `~/.config/webinsights/profiles/<profile_id>.db`).
- **CAG/RAG Tables**: Each profile database includes a `cached_results` table with fields for `articleId`, `queryType`, `result`, `timestamp`, and `ttl`.
- **Profile Metadata**: A central `profiles.json` file or `metadata.db` tracks profile names, database file paths, and encryption status.
- **Optional Encryption**: Private profiles utilize SQLCipher for full database encryption.
  - **Dependency**: Requires the `better-sqlite3-sqlcipher` package (or equivalent Bun-compatible SQLCipher binding) instead of plain `better-sqlite3` for encrypted databases.
  - **Algorithm**: AES-256 (SQLCipher default).
  - **Key Derivation**: User password for private profiles is converted to an encryption key using PBKDF2 (or similar standard KDF) before being passed to SQLCipher.
- In-memory caching
- File system storage
- Data migrations
- **Data Migrations (Custom, On-Load)**:
  - Drizzle ORM defines the schema, but the standard `migrate` function is not used.
  - Migrations are applied when a profile is loaded using a custom script.
  - The script connects (using password if encrypted), reads `__drizzle_migrations`, identifies pending `.sql` files from the `/migrations` folder, executes them via raw SQL, and updates the history table.
  - **Error Handling**: Migration logic for each profile is implemented using the `Effect` library to manage potential errors during connection, SQL execution, or history updates.
- Backup system
- Query optimization
- Immutable data structures
- Pure data transformations

### AI Integration

- Direct Fabric AI integration with MCP
- Shared resource management
- Efficient data passing via MCP servers
- Performance optimization with hybrid CAG/RAG strategy
- Context-enhanced AI generation via metadata-based retrieval
- Result caching for pattern outputs
- Background processing of MCP requests
- Model management through MCP UI

## System Architecture Diagrams

### High-Level System Architecture

```mermaid
graph TB
    subgraph Client["Client Layer"]
        UI[SvelteKit UI]
        SW[Service Worker]
    end
    subgraph Server["Local Server"]
        API[API Layer]
        BG[Background Jobs]
        subgraph Core["Core Services"]
            RSS[RSS Service]
            NIT[Nitter Service]
            WS[Web Scraper]
            APIC[API Client]
            DB[(SQLite DB)]
            MCP[MCP Servers]
        end
        subgraph AI["AI Layer"]
            FA[Fabric AI]
            MCP_C[MCP Clients]
        end
    end
    UI --> API
    SW --> API
    API --> Core
    Core --> MCP
    MCP --> FA
    FA --> MCP_C
    BG --> Core
    BG --> AI
```

### Data Flow Architecture

```mermaid
flowchart LR
    subgraph Sources["Content Sources"]
        RSS[RSS Feeds]
        NIT[Nitter Feeds]
        HTML[HTML Pages]
        JSON[JSON APIs]
        XAPI[X API]
    end
    subgraph Processing["Processing Layer"]
        P1[RSS Parser]
        P2[Crawl4AI]
        P3[JSON Parser]
        P4[API Client]
        P5[Nitter Service]
        MCP[MCP Servers]
    end
    subgraph Storage["Storage Layer"]
        DB[(SQLite DB)]
        Cache[Local Cache]
        SecStore[Encrypted Storage]
    end
    subgraph AI["AI Processing"]
        A[Archivist]
        S[Scribe]
        L[Librarian]
    end
    RSS --> P1
    HTML --> P2
    JSON --> P3
    P1 --> MCP
    P2 --> MCP
    P3 --> MCP
    MCP --> DB
    DB --> Cache
    DB --> A
    A --> MCP
    MCP --> S
    S --> MCP
    MCP --> L
    L --> DB
```

### Interaction Sequence (Example: Manual Fetch)

```mermaid
sequenceDiagram
    participant UI as Frontend UI
    participant API as Backend API (SvelteKit)
    participant MCPClient as Backend MCP Client Logic
    participant CrawlMCP as Crawl4AI MCP Server
    participant Agents as AI Agents (e.g., Scribe)
    participant FabricMCP as Fabric MCP Server

    UI->>API: POST /api/fetch (url: '...')
    API->>MCPClient: Initiate scrape request for URL
    MCPClient->>CrawlMCP: Call scrape_url(url='...')
    CrawlMCP-->>MCPClient: Return { success: true, content: '...' }
    MCPClient-->>API: Scraped content received
    API->>Agents: Request AI processing (e.g., summarize) for content
    Agents->>MCPClient: Initiate MCP pattern call
    MCPClient->>FabricMCP: Call execute_pattern(pattern='summarize', data=content)
    FabricMCP-->>MCPClient: Return { success: true, result: 'summary...' }
    MCPClient-->>Agents: Summary received
    Agents-->>API: Processing complete, return summary
    API-->>UI: Return { content: '...', summary: '...' }
```

### Component Dependencies

```mermaid
graph TD
    subgraph Frontend["Frontend Layer"]
        UI[UI Components]
        State[State Management]
        Router[SvelteKit Router]
    end
    subgraph Backend["Backend Layer"]
        API[API Routes]
        Auth[Authentication]
        Jobs[Background Jobs]
    end
    subgraph Services["Service Layer"]
        RSS[RSS Service]
        Scraper[Web Scraper]
        Parser[Content Parser]
        MCP[MCP Integration]
    end
    subgraph Data["Data Layer"]
        DB[(SQLite)]
        Cache[Local Cache]
        Files[File Storage]
    end
    UI --> State
    State --> Router
    Router --> API
    API --> Auth
    API --> Services
    Jobs --> Services
    Services --> MCP
    MCP --> Data
```

## Ethical Considerations

### Data Privacy and User Control

- All data processing happens locally with MCP servers
- No data sharing without explicit consent
- User control over AI agent behavior and MCP configurations
- Transparent data collection and usage
- Option to disable AI features or external MCP connections

### Web Scraping Ethics

- Respect for robots.txt directives
- Rate limiting to prevent server overload
- Proper attribution of content sources
- Cache management to reduce server load
- Ethical content extraction practices with MCP processing

### AI Transparency

- Clear indication of AI-generated content from Fabric patterns
- Explainable AI recommendations via MCP outputs
- User control over AI personalization through MCP UI
- Bias detection and mitigation
- Regular AI model updates manageable via MCP

## Testing and Validation

### Unit Testing

- Component-level tests including MCP UI
- Service integration tests with MCP servers
- AI agent behavior validation with Fabric patterns
- Data management verification
- Error handling scenarios for MCP connections

### Integration Testing

- End-to-end workflow testing with MCP pipelines
- AI agent interaction testing via MCP
- Performance benchmarking
- Cross-browser compatibility
- Offline functionality validation

### User Acceptance Testing

- Feature validation with users including MCP UI
- Usability testing
- Performance monitoring
- Accessibility testing
- Security assessment of MCP configurations

### Continuous Integration

- Automated test suites
- Code quality checks
- Performance regression testing
- Security vulnerability scanning for MCP
- Documentation updates

## Installation System

### Desktop Application

- Single executable bundle containing:
  - Bun runtime
  - Application server
  - SQLite database
  - Fabric AI integration with MCP servers
  - Frontend assets
- System tray integration
- Auto-start capability
- Update management

### Configuration

- Initial setup wizard with LLM provider selection
- LLM provider selection and configuration via UI
- API key management for external MCP connections
- Port configuration for MCP servers
- Resource limits
- Backup settings

### Security

- Local-only access by default
- Process isolation
- Data encryption:
  - SQLCipher (AES-256) for optional, per-profile database encryption.
  - Secure storage for API keys (mechanism TBD, e.g., OS keychain or within encrypted profile DB).
- Secure configuration for MCP
- Permission management

## Development Process

1. Server Setup
   - Bun server configuration
   - Database schema design with MCP tables
   - API development with MCP endpoints
   - Fabric AI integration with MCP
   - WebSocket implementation for MCP updates

2. Frontend Development
   - SvelteKit setup
   - Component library including MCP UI
   - Real-time updates
   - Offline capabilities
   - UI/UX implementation

3. Core Features
   - RSS feed management
   - Content organization with MCP patterns
   - Search functionality enhanced by MCP
   - Data import/export

4. AI Features
   - Content analysis with Fabric patterns via MCP
   - Categorization system
   - Summarization through MCP pipelines
   - Learning system
   - Result caching for MCP outputs

5. Distribution
   - Application bundling
   - Installer creation
   - Auto-update system
   - Documentation
   - Testing suite

## Pilot Implementation

### Diabetes Research Focus

- Pre-configured research profile with MCP patterns
- Curated RSS feeds
- Medical content analysis via Fabric patterns
- Specialized categories
- Terminology handling with MCP sequencing

### Data Sources

- Medical journals
- Clinical trials
- Healthcare organizations
- Patient resources
- Research updates processed through MCP

## Future Enhancements

- Enhanced backup options
- Cross-device synchronization with MCP external connections
- Advanced AI capabilities via Fabric updates
- Collaborative features
- Extended offline support
- Custom analysis templates with MCP UI

## System Requirements

- RAM: 8GB recommended
- Storage: 2GB minimum
- CPU: Multi-core processor
- OS: Cross-platform (Windows, macOS, Linux)
- Internet: Optional for content fetching and external LLM providers

## Project Vision

WebInsight aims to revolutionize content aggregation and analysis, transforming raw web data into meaningful insights through intelligent, user-centric design and advanced AI technologies integrated via MCP.

## Project Roadmap

### Phase 1: Core Infrastructure (Current)

✅ Completed:

- Basic SvelteKit + Tailwind + shadcn setup
- Database schema and migrations with Drizzle ORM
- Basic RSS feed service implementation
- Initial web scraping service structure
- Basic UI components and theme support

### Phase 2: Feed Management & Web Scraping (In Progress)

🔄 Current Focus:

- [ ] Enhance RSS feed management
  - [ ] Feed collection organization
  - [ ] Feed categorization
  - [ ] Offline reading support
- [ ] **Implement Crawl4AI MCP Server**
  - [ ] Define MCP interface for Crawl4AI
  - [ ] Refactor Python service to implement MCP
  - [ ] Implement Backend MCP client logic for Crawl4AI
- [ ] Integrate Crawl4AI MCP results with AI processing
  - [ ] MCP pattern integration
  - [ ] LLM provider service implementation using @effect/ai
- [ ] Ensure Robots.txt compliance (within Crawl4AI MCP Server)

### Phase 3: AI Agents Implementation (Next)

📅 Planned:

- [ ] Integrate MCP with Fabric AI
  - [ ] Pattern library access
  - [ ] UI for LLM provider configuration with @effect/ai integration
- [ ] The Archivist Agent
  - [ ] Content collection system
  - [ ] Metadata extraction with MCP
  - [ ] Content labeling and organization
  - [ ] Context-enhanced metadata extraction with RAG
- [ ] The Scribe Agent
  - [ ] Content summarization via MCP
  - [ ] Key points extraction
  - [ ] Sentiment analysis integration
  - [ ] Performance optimization with CAG
  - [ ] Quality improvement with RAG
- [ ] The Librarian Agent
  - [ ] Content recommendation system
  - [ ] Cross-reference generation
  - [ ] Dynamic content relationships
  - [ ] Metadata-based article retrieval
  - [ ] Recommendation caching with CAG

### Phase 4: Enhanced User Experience

🎯 Future Goals:

- [ ] Advanced search and filtering with MCP
- [ ] Real-time updates via WebSocket
- [ ] Offline-first functionality improvements
- [ ] Performance optimizations
- [ ] Background job processing system with MCP

### Phase 5: Distribution & Polish

🚀 Final Steps:

- [ ] Application bundling
- [ ] Auto-update system
- [ ] Documentation
- [ ] Testing suite
- [ ] Security audits for MCP
- [ ] Performance benchmarking

### Technical Debt & Improvements

🔧 Ongoing:

- [ ] Code documentation
- [ ] Test coverage
- [ ] Error handling for MCP
- [ ] Logging system
- [ ] Performance monitoring

### Timeline Estimates

- Phase 2: 4-6 weeks
- Phase 3: 8-10 weeks
- Phase 4: 4-6 weeks
- Phase 5: 2-4 weeks

Note: Timeline estimates are subject to adjustment based on development progress and priorities.

## Technical Constraints and Considerations

### Profile Management Complexity

- **Migrations**: Applying schema changes across multiple, potentially encrypted databases requires a custom migration script run on profile load, adding complexity compared to single-database migrations.
- **Key Management**: Securely handling user passwords and deriving/using encryption keys for private profiles is critical.

### Web Scraping Limitations

- CORS restrictions require server-side rendering
- Scraping depends on website structure stability
- Performance varies based on target website and MCP processing

### Development Environment

- Runtime: Bun
- Frontend: SvelteKit
- Parsing: Cheerio
- Validation: Zod
- UI Components: shadcn-svelte

## Long-Term Vision

- Cross-platform desktop application
- Advanced machine learning models via MCP
- Community-driven content analysis with Fabric patterns
- Seamless user experience across devices with MCP sync
- UI for crafting own pattern pipelines.

## Specialized Use Cases

- Research-focused feed aggregation
- Professional content monitoring
- Personal knowledge management with MCP-enhanced AI
