# Smart RSS Aggregator App - Detailed Architecture

## Overview

The Smart RSS Aggregator App leverages Fabric AI with the Model Context Protocol (MCP) for intelligent content processing, integrating Fabric's pattern library and LLM sequencing. Built with Bun and SvelteKit, this local-first application follows functional programming principles, emphasizing pure functions, immutable data structures, and declarative code patterns, enhanced by MCP for modular AI interactions.

## Programming Paradigm

### Functional Programming Approach

```typescript
// Example of pure function for content transformation with MCP
const transformContent = (content: Content): TransformedContent => {
  const mcpResult = await mcp.executePattern('summarize', content.body, 'mcp://localhost:11434/llama2');
  return {
    ...content,
    title: formatTitle(content.title),
    summary: mcpResult,
    tags: extractTags(content.body)
  };
};

// Example of function composition with MCP sequencing
const processArticle = pipe(
  fetchContent,
  parseContent,
  transformContentWithMCP(['extract_wisdom', 'summarize']),
  storeContent
);

const addArticleToCollection = (collection, article) => ({
  ...collection,
  articles: [...collection.articles, article.id]
});
```

### Core Principles

- **Pure Functions**: Functions with no side effects, now leveraging MCP for consistent LLM outputs
- **Immutability**: Data structures remain unchanged, with MCP configurations immutable
- **Function Composition**: Complex operations built with MCP pipelines
- **Higher-Order Functions**: Enhanced by MCP for dynamic pattern execution
- **Declarative Style**: Expressing intent with Fabric patterns via MCP

## Core Architecture Layers

### 1. Frontend Layer (SvelteKit)

#### Components Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/              # shadcn-svelte components
│   │   │   ├── button/
│   │   │   ├── card/
│   │   │   └── ...
│   │   ├── feed/
│   │   │   ├── FeedList.svelte
│   │   │   ├── FeedItem.svelte
│   │   │   ├── FeedReader.svelte
│   │   │   └── FeedCollection.svelte
│   │   ├── content/
│   │   │   ├── ArticleView.svelte
│   │   │   ├── ContentCard.svelte
│   │   │   ├── TagList.svelte
│   │   │   └── ContentFilter.svelte
│   │   └── ai/
│   │       ├── AIInsights.svelte
│   │       ├── SummaryView.svelte
│   │       ├── RecommendationList.svelte
│   │       └── LLMManager.svelte  # New component for MCP LLM configuration
│   ├── server/
│   │   ├── db/
│   │   │   ├── schema/
│   │   │   └── migrations/
│   │   ├── ai/
│   │   │   ├── archivist.ts
│   │   │   ├── scribe.ts
│   │   │   ├── librarian.ts
│   │   │   └── mcp.ts         # MCP integration logic
│   │   ├── rss/
│   │   │   ├── parser.ts
│   │   │   └── fetcher.ts
│   │   ├── scraper/
│   │   │   ├── crawler.ts
│   │   │   └── parser.ts
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   └── sources/
│   │   └── nitter/
│   │       ├── service.ts
│   │       └── instances.ts
│   ├── stores/
│   │   ├── feeds.ts
│   │   ├── articles.ts
│   │   ├── collections.ts
│   │   ├── ui.ts
│   │   └── preferences.ts
│   ├── utils/
│   │   ├── date.ts
│   │   ├── text.ts
│   │   ├── url.ts
│   │   └── functional.ts
│   └── types/
│       ├── feed.ts
│       ├── article.ts
│       ├── collection.ts
│       └── api.ts
├── routes/
│   ├── +page.svelte
│   ├── feeds/
│   ├── articles/
│   ├── collections/
│   ├── settings/
│   └── api/
└── static/
    ├── icons/
    └── images/
```

#### Key Frontend Features

- Server-side rendering with SvelteKit
- Reactive state management using Svelte stores
- Functional reactive programming patterns
- Immutable state transformations
- WebSocket integration for real-time updates including MCP status
- Service Workers for offline functionality
- Dark mode support via Tailwind CSS
- Responsive design using shadcn-svelte components
- Declarative UI components with MCP LLM management

### 2. Backend Layer (Bun + SvelteKit)

#### Server Structure

```
src/
├── routes/
│   ├── api/              # API endpoints
│   │   ├── feeds/        # Feed operations
│   │   ├── content/      # Content operations
│   │   └── ai/           # AI agent endpoints with MCP
│   └── +layout.svelte    # Root layout
├── lib/
│   └── server/           # Server-side logic
```

#### Core Services

1. **Feed Service**
   - RSS feed fetching and parsing
   - Feed validation and sanitization
   - Update scheduling
   - Feed categorization

2. **Web Scraping Service (Crawl4AI + MCP)**
   - HTML content extraction
   - Metadata parsing with Fabric patterns via MCP
   - Rate limiting and throttling
   - Local caching mechanism for MCP outputs
   - Robots.txt compliance
   - Configurable scraping rules
   - Ethical scraping practices

   ```typescript
   interface WebScrapingService {
     extractContent(url: string, selectors: SelectorConfig): Promise<ScrapedContent>;
     processWithMCP(content: ScrapedContent, pattern: string): Promise<ProcessedContent>;
   }
   ```

3. **RSS Service with Nitter Integration**
   - RSS feed fetching and parsing
   - Nitter instance management for X content
     - Instance cycling and fallback mechanism
     - Instance health monitoring
   - Local caching of feed content
   - Feed validation and error recovery

4. **API Client Service with MCP**
   - Configurable API source management via MCP
   - Support for various API services (X, GitHub, Reddit, etc.)
   - Secure credential storage
   - Rate limit management
   - Response parsing and normalization with MCP patterns

   ```typescript
   interface ApiClientService {
     configureMCPConnection(config: MCPConfig): Promise<MCPConnection>;
     fetchFromEndpoint(source: ApiSource, endpoint: string, params: object): Promise<ApiResponse>;
     handleRateLimits(source: ApiSource): Promise<RateLimitInfo>;
     parseResponse(response: ApiResponse): Promise<ParsedContent>;
   }
   
   interface MCPConfig {
     vendor: string;       // e.g., ollama, openai
     model: string;
     url: string;          // e.g., mcp://localhost:11434/llama2
     credentials?: Credentials;
   }
   ```

5. **Background Job Service**
   - Feed update scheduling
   - API request scheduling (respecting rate limits)
   - Content processing queue with MCP pipelines
   - AI task management via MCP
   - System maintenance tasks

### 3. AI Layer (Fabric AI + MCP)

#### Agent Architecture

1. **The Archivist**

   ```typescript
   interface ArchivistAgent {
     collectContent(source: ContentSource): Promise<Content>;
     extractMetadata(content: Content): Promise<Metadata>;
     organizeContent(content: Content, metadata: Metadata): Promise<OrganizedContent>;
     mapRelationships(content: Content[]): Promise<ContentMap>;
     processContent(source: ContentSource, patternSequence: string[]): Promise<Content>;
   }
   ```

   - Uses MCP to sequence Fabric patterns (e.g., `extract_metadata` → `organize`)

2. **The Scribe**

   ```typescript
   interface ScribeAgent {
     summarizeContent(content: Content): Promise<Summary>;
     extractKeyPoints(content: Content): Promise<KeyPoint[]>;
     analyzeSentiment(content: Content): Promise<SentimentAnalysis>;
     assessQuality(content: Content): Promise<QualityScore>;
   }
   ```

   - Executes Fabric patterns (e.g., `summarize`) via MCP

3. **The Librarian**

   ```typescript
   interface LibrarianAgent {
     generateRecommendations(userPrefs: UserPreferences): Promise<Recommendation[]>;
     createCrossReferences(content: Content[]): Promise<Reference[]>;
     suggestOrganization(collections: Collection[]): Promise<OrganizationSuggestion>;
   }
   ```

   - Leverages MCP pipelines for recommendation workflows

### 4. Data Layer

#### Database Schema (SQLite + Drizzle ORM)

```typescript
// Feed Table
interface Feed {
  id: string;
  url: string;
  title: string;
  description: string;
  lastUpdated: Date;
  updateFrequency: number;
  status: FeedStatus;
  type: FeedType;
  sourceConfig: SourceConfig;
}

// Article Table
interface Article {
  id: string;
  feedId: string;
  title: string;
  content: string;
  publishDate: Date;
  metadata: ArticleMetadata;
  aiAnalysis: AIAnalysis;
  originalSource: string;
}

// Collection Table
interface Collection {
  id: string;
  name: string;
  description: string;
  articles: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// User Preferences Table
interface UserPreferences {
  id: string;
  theme: Theme;
  readingSettings: ReadingSettings;
  feedSettings: FeedSettings;
  aiSettings: AISettings;
  uiSettings: UISettings;
  scrapingSettings: ScrapingSettings;
  mcpSettings: MCPSettings;  // Added for LLM configuration
}

// API Source Table
interface ApiSource {
  id: string;
  name: string;
  baseUrl: string;
  authType: AuthType;
  encryptedCredentials: string;
  endpoints: ApiEndpoint[];
  rateLimits: RateLimit[];
  lastUsed: Date;
}

// Nitter Instance Table
interface NitterInstance {
  id: string;
  url: string;
  status: InstanceStatus;
  lastChecked: Date;
  successRate: number;
  quirks: InstanceQuirk[];
}

// MCP Connection Table
interface MCPConnection {
  id: string;
  url: string;          // e.g., mcp://localhost:11434/llama2
  vendor: string;       // e.g., ollama, openai
  model: string;
  status: ConnectionStatus;
}
```

#### Storage Strategy

- SQLite for structured data including MCP connections
- File system for content cache
- In-memory cache for frequent access
- Automatic backups
- Data migrations
- Query optimization
- Local caching of API responses and MCP outputs

### 5. Integration Layer

#### WebSocket Communication

```typescript
interface WebSocketEvents {
  'feed:update': (feedId: string) => void;
  'content:new': (articleId: string) => void;
  'collection:update': (collectionId: string) => void;
  'ai:insight': (insightId: string) => void;
  'mcp:update': (connectionId: string) => void;
}
```

#### Background Jobs

```typescript
interface JobScheduler {
  scheduleFeedUpdates(): void;
  scheduleContentProcessing(): void;
  scheduleApiRequests(): void;
  scheduleMaintenanceTasks(): void;
  scheduleMCPTasks(): void;  // Added for MCP server management
}
```

## Security Architecture

### Data Protection

1. **Local Storage Security**
   - Encrypted sensitive data including MCP credentials
   - Secure configuration storage
   - Access control mechanisms for MCP servers

2. **Privacy Measures**
   - No external data sharing by default
   - Local-only processing with MCP
   - User data control over MCP configurations

## Performance Optimization

### Functional Approach to Performance

1. **Memoization for Expensive Operations**

   ```typescript
   // Memoized function example with MCP
   const memoizedAnalyze = memoize(
     (content: Content): Analysis => mcp.executePattern('analyze', content, 'mcp://localhost:11434/llama2'),
     (content) => content.id
   );
   ```

2. **Lazy Evaluation**

   ```typescript
   // Lazy sequence processing with MCP
   const processArticles = pipe(
     lazyMap(fetchMetadata),
     lazyFilter(isRelevant),
     lazyMap(transformContentWithMCP(['extract_wisdom', 'summarize'])),
     take(10)
   );
   ```

### Caching Strategy

1. **Multi-level Cache with Immutable Data**

   ```typescript
   interface CacheManager {
     memory: MemoryCache;
     disk: DiskCache;
     feed: FeedCache;
     apiResponse: ApiResponseCache;
     scrapedContent: ScrapedContentCache;
     mcpCache: MCPCache;  // Added for MCP LLM outputs
     set: <T>(key: string, value: T) => CacheManager;
     get: <T>(key: string) => Option<T>;
   }
   ```

2. **Resource Management**
   - Memory usage monitoring
   - Disk space management
   - Background task scheduling with MCP
   - Adjustable AI processing depth via MCP UI
   - Resource-aware operation modes
   - Performance profiles for different hardware capabilities
   - Efficient immutable data structures

### Query Optimization

- Indexed database fields including MCP connections
- Query result caching
- Batch processing with MCP pipelines

## Error Handling

### Recovery System

```typescript
interface ErrorHandler {
  handleNetworkError(error: NetworkError): Promise<void>;
  handleDatabaseError(error: DatabaseError): Promise<void>;
  handleAIError(error: AIError): Promise<void>;
  handleMCPError(error: MCPError): Promise<void>;  // Added for MCP-specific errors
}
```

### Logging System

```typescript
interface Logger {
  info(message: string, context?: object): void;
  error(error: Error, context?: object): void;
  warn(message: string, context?: object): void;
  debug(message: string, context?: object): void;
}
```

## Development Workflow

### Functional Programming Guidelines

- Prefer pure functions over methods with side effects
- Use immutable data structures (arrays, objects) with spread operators
- Leverage function composition for complex operations with MCP
- Utilize higher-order functions (map, filter, reduce) over imperative loops
- Separate data from behavior
- Handle side effects explicitly and at the edges of the system
- Implement error handling with functional patterns (Option, Either, etc.)

### Project Setup

```bash
# Install dependencies
bun install

# Development server
bun run dev

# Build
bun run build

# Test
bun run test
```

### Testing Strategy

1. **Unit Tests**
   - Component testing including MCP UI
   - Service testing with MCP integration
   - AI agent testing with Fabric patterns
   - MCP connection testing

2. **Integration Tests**
   - API endpoint testing with MCP
   - Data flow testing through MCP pipelines
   - UI interaction testing with MCP configuration

3. **E2E Tests**
   - User workflow testing with MCP-enabled features
   - Performance testing
   - Offline functionality testing

## Deployment Architecture

### Local Deployment

1. **Installation Process**
   - Dependencies check
   - Database initialization with MCP schema
   - Configuration setup including MCP servers

2. **Update Mechanism**
   - Version checking
   - Incremental updates
   - Rollback capability

## Monitoring and Maintenance

### System Health

```typescript
interface HealthCheck {
  checkDatabase(): Promise<HealthStatus>;
  checkAIServices(): Promise<HealthStatus>;
  checkNetworkServices(): Promise<HealthStatus>;
  checkFileSystem(): Promise<HealthStatus>;
  checkMCPServers(): Promise<HealthStatus>;  // Added for MCP monitoring
}
```

### Performance Metrics

```typescript
interface Metrics {
  collectPerformanceMetrics(): Promise<PerformanceData>;
  monitorResourceUsage(): Promise<ResourceUsage>;
  trackUserInteractions(): Promise<UserMetrics>;
  measureResponseTimes(): Promise<ResponseTimeMetrics>;
  trackMCPPerformance(): Promise<MCPMetrics>;  // Added for MCP-specific metrics
}
```

## Future Considerations

### Scalability

- Modular AI agent system with MCP
- Pluggable service architecture
- Extensible data models with MCP support

### Planned Features

- Enhanced offline support
- Advanced API integration capabilities with MCP
- Configurable scraping rules UI
- Performance optimization for low-end hardware with MCP adjustments
- Adjustable AI processing depth via MCP UI
- Multi-service API integration framework
- Advanced AI capabilities with Fabric pattern updates
- Improved content discovery
- Extended customization options with MCP
