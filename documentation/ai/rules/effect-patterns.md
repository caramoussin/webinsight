---
trigger: model_decision
description: Coding patterns for Effect TS
globs: src/**/*.ts, src/**/*.svelte
--- 
# Effect Patterns for WebInsight Frontend

This document outlines key patterns for using Effect TS in the SvelteKit frontend of the WebInsight project, focusing on services, stores, and event handling. It reflects common practices found in `src/lib/`.

## Core Principles

- **Effect for Async & Business Logic**: All asynchronous operations, API calls, MCP interactions, and complex business logic are managed within Effect pipelines.
- **Svelte 5 Runes for Reactivity**: Svelte stores and components use Svelte 5 Runes (`$state`, `$derived`, `$effect`) for reactive UI updates.
- **Services for Backend Interaction**: Typed services in `src/lib/services/` encapsulate calls to SvelteKit API routes, MCP providers, and AI agents, using Effect for robustness.
- **Stores for State Management**: Svelte stores in `src/lib/stores/` manage application state, orchestrate service calls via Effect, and expose reactive properties to the UI.
- **Dependency Injection with Context & Layer**: Effect's `Context.Tag` and `Layer` are used for managing dependencies between services and stores.
- **Typed Errors**: Custom error types extending `Data.TaggedError` provide clear, structured error handling.

## Error Handling

Define structured, tagged errors for services and stores to clearly indicate the source and nature of issues.

```typescript
// src/lib/services/feeds/feed.service.ts (Error Example)
import { Data } from 'effect';

export class FeedServiceError extends Data.TaggedError('FeedServiceError')<{
  readonly message: string;
  readonly cause?: unknown; // Underlying error, e.g., from HTTP client or MCP
}> {}

// src/lib/stores/feeds.store.svelte.ts (Error Example)
export class FeedStoreError extends Data.TaggedError('FeedStoreError')<{
  readonly message: string;
  readonly context?: string; // e.g., 'fetchAll', 'create', 'ai_process'
  readonly cause?: unknown;  // Could be a FeedServiceError or MCPError
}> {}
```

Usage in an Effect pipeline:

```typescript
import { Effect as E, pipe } from 'effect';
import { FeedServiceError } from '$lib/services/feeds/feed.service'; // Example import

declare function someFallibleOperation(): E.Effect<string, FeedServiceError>;

pipe(
  someFallibleOperation(),
  E.catchTag('FeedServiceError', (error) => {
    console.error(`Service operation failed: ${error.message}`, error.cause);
    // Recover or transform into a different error/success
    return E.succeed('Recovered value'); 
  }),
  E.catchAll((unhandledError) => {
    // Catch any other errors not specifically tagged above
    console.error('An unexpected error occurred:', unhandledError);
    return E.fail(new Error('Operation failed unexpectedly'));
  })
);
```

## Service Definition

Services encapsulate interactions with external systems (like SvelteKit API routes, MCP providers, AI agents) or complex business logic. They are defined with interfaces, `Context.Tag` for DI, and `Layer` for providing implementations.

### 1. HTTP Client Service (Foundational Service)

Services like `HttpClientService.ts` bridge the gap between promise-based HTTP client interactions and the Effect ecosystem. They provide foundational HTTP functionality for other services.

**`src/lib/services/http/HttpClientService.ts` Pattern:**

- **Singleton Instance**: Often created as a singleton using Effect's FetchHttpClient.
- **Promise-Returning Methods**: Core methods return Effects that wrap HTTP operations.
- **Effect Integration**: Provides a `Context.Tag` and a `Layer` that wraps HTTP client functionality.

```typescript
// src/lib/services/http/HttpClientService.ts (Conceptual Structure)
import { Effect as E, Context, Layer } from 'effect';
import { HttpClient, FetchHttpClient } from '@effect/platform';

// The Tag for DI
export class HttpClientServiceTag extends Context.Tag('HttpClientService')<
  HttpClientServiceTag,
  HttpClient.HttpClient
>() {}

// Live layer using FetchHttpClient
export const HttpClientServiceLive: Layer.Layer<HttpClientServiceTag> = Layer.succeed(
  HttpClientServiceTag,
  FetchHttpClient.layer
);
```

### 2. MCP-Based Effect Service

Services like `mcp/MCPClient.ts` are built entirely with Effect and interact with Model Context Protocol providers for AI operations.

**`src/lib/services/mcp/MCPClient.ts` Pattern:**

- **Interface & Tag**: Defines a clear service interface and a `Context.Tag`.
- **Live Layer**: Implements the service interface, taking `HttpClientServiceTag` as a dependency.
- **`E.tryPromise`**: Wraps calls to MCP providers (which may return Promises) to convert them into Effects.
- **Typed Errors**: Maps errors from MCP operations into specific `MCPServiceError` instances.

```typescript
// src/lib/services/mcp/MCPService.ts (Simplified)
import { HttpClientServiceTag } from '$lib/services/http/HttpClientService';
import { Effect as E, Layer, Context, Data, pipe } from 'effect';
import type { MCPResponse, MCPConnectionConfig } from '$lib/types/mcp';

export class MCPServiceError extends Data.TaggedError('MCPServiceError')<{ 
  message: string; 
  cause?: unknown 
}> {}

export interface MCPService {
  readonly executePattern: (
    pattern: string, 
    input: string, 
    config: MCPConnectionConfig
  ) => E.Effect<MCPResponse, MCPServiceError>;
  readonly checkServerAvailability: (
    config: MCPConnectionConfig
  ) => E.Effect<boolean, MCPServiceError>;
  readonly listPatterns: (
    config: MCPConnectionConfig
  ) => E.Effect<string[], MCPServiceError>;
}

export class MCPServiceTag extends Context.Tag('MCPService')<
  MCPServiceTag,
  MCPService
>() {}

export const MCPServiceLive: Layer.Layer<
  MCPServiceTag,
  never,
  HttpClientServiceTag
> = Layer.effect(
  MCPServiceTag,
  E.gen(function* ($) {
    const httpClient = yield* $(HttpClientServiceTag);

    const executePattern = (pattern: string, input: string, config: MCPConnectionConfig) =>
      pipe(
        E.tryPromise({
          try: () => fetch(`${config.url}/pattern/${pattern}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input, model: config.model })
          }).then(res => res.json()),
          catch: (error) => new MCPServiceError({ 
            message: `MCP pattern execution failed for ${pattern}`, 
            cause: error 
          })
        })
      );

    return MCPServiceTag.of({
      executePattern,
      checkServerAvailability: (config) => executePattern('health', '', config).pipe(
        E.map(() => true),
        E.orElse(() => E.succeed(false))
      ),
      listPatterns: (config) => executePattern('list', '', config).pipe(
        E.map((response: any) => response.patterns || [])
      )
    });
  })
);
```

### 3. Feed Management Service

Services like `feeds/FeedService.ts` handle domain-specific operations for WebInsight's core functionality.

```typescript
// src/lib/services/feeds/FeedService.ts (Simplified)
import { HttpClientServiceTag } from '$lib/services/http/HttpClientService';
import { Effect as E, Layer, Context, Data, pipe } from 'effect';
import type { Feed, CreateFeed, UpdateFeed } from '$lib/types/feed';

export class FeedServiceError extends Data.TaggedError('FeedServiceError')<{ 
  message: string; 
  cause?: unknown 
}> {}

export interface FeedService {
  readonly getAllFeeds: (profileId: string) => E.Effect<Feed[], FeedServiceError>;
  readonly createFeed: (feedData: CreateFeed) => E.Effect<Feed, FeedServiceError>;
  readonly updateFeed: (id: string, feedData: UpdateFeed) => E.Effect<Feed, FeedServiceError>;
  readonly deleteFeed: (id: string, profileId: string) => E.Effect<void, FeedServiceError>;
}

export class FeedServiceTag extends Context.Tag('FeedService')<
  FeedServiceTag,
  FeedService
>() {}

export const FeedServiceLive: Layer.Layer<
  FeedServiceTag,
  never,
  HttpClientServiceTag
> = Layer.effect(
  FeedServiceTag,
  E.gen(function* ($) {
    const httpClient = yield* $(HttpClientServiceTag);

    const makeApiCall = <T>(method: string, url: string, body?: unknown) =>
      pipe(
        E.tryPromise({
          try: () => fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
          }).then(res => res.json()),
          catch: (error) => new FeedServiceError({ 
            message: `API call failed: ${method} ${url}`, 
            cause: error 
          })
        })
      );

    return FeedServiceTag.of({
      getAllFeeds: (profileId) => makeApiCall<Feed[]>('GET', `/api/feeds?profileId=${profileId}`),
      createFeed: (feedData) => makeApiCall<Feed>('POST', '/api/feeds', feedData),
      updateFeed: (id, feedData) => makeApiCall<Feed>('PUT', `/api/feeds/${id}`, feedData),
      deleteFeed: (id, profileId) => makeApiCall<void>('DELETE', `/api/feeds/${id}?profileId=${profileId}`)
    });
  })
);
```

## Effect-driven Svelte Stores

Stores manage application state using Svelte 5 Runes and orchestrate service calls using Effect. `src/lib/stores/feeds.store.svelte.ts` is a prime example.

**Core Pattern:**

1.  **Store Factory Function Returning an Effect**: The store is defined by a factory function (e.g., `createFeedsStore`) that returns an `Effect`. This `Effect` depends on service tags (e.g., `FeedServiceTag`, `MCPServiceTag`, `AIAgentServiceTag`) and, when run, produces the store instance.

    ```typescript
    // src/lib/stores/feeds.store.svelte.ts (Conceptual Structure)
    import { FeedServiceTag, type FeedService } from '$lib/services/feeds/FeedService';
    import { MCPServiceTag, type MCPService } from '$lib/services/mcp/MCPService';
    import { AIAgentServiceTag, type AIAgentService } from '$lib/services/ai/AIAgentService';
    import { StoreEventBusTag, type StoreEvents, type StoreEventBusService } from '$lib/stores/storeEvents';
    import type { UIFeed } from '$lib/types/ui';
    import type { Feed, CreateFeed } from '$lib/types/feed';
    import { Effect as E, Data, pipe, Option } from 'effect';

    // Store-specific error type
    export class FeedStoreError extends Data.TaggedError('FeedStoreError')<{ 
      message: string; 
      context?: string; 
      cause?: unknown 
    }> {}

    // The interface of the store that components will interact with
    export type FeedsStore = {
      // Reactive state (Svelte Runes)
      readonly feeds: readonly UIFeed[];
      readonly loading: boolean;
      readonly error: Option.Option<FeedStoreError>;
      readonly aiProcessing: boolean;

      // Methods that orchestrate service calls and update state
      fetchAllFeeds: (profileId: string) => E.Effect<void, FeedStoreError>;
      createFeed: (input: CreateFeed) => E.Effect<UIFeed, FeedStoreError, StoreEventBusService<StoreEvents>>;
      processFeedWithAI: (feedId: string, patterns: string[]) => E.Effect<void, FeedStoreError>;
      getFeedById: (id: string) => E.Effect<Option.Option<UIFeed>, FeedStoreError>;
    };

    // The factory function
    export const createFeedsStoreEffect = (): E.Effect<
      FeedsStore,
      never,
      FeedServiceTag | MCPServiceTag | AIAgentServiceTag | StoreEventBusService<StoreEvents>
    > => E.gen(function* ($) {
      const feedService = yield* $(FeedServiceTag);
      const mcpService = yield* $(MCPServiceTag);
      const aiAgentService = yield* $(AIAgentServiceTag);

      // Svelte 5 Runes for reactive state
      let _feeds = $state<UIFeed[]>([]);
      let _loading = $state(false);
      let _aiProcessing = $state(false);
      let _error = $state<Option.Option<FeedStoreError>>(Option.none());

      // Helper to map Feed to UIFeed
      const mapFeedToUIFeed = (feed: Feed): UIFeed => ({ 
        ...feed, 
        uiState: { selected: false, processed: false } 
      });

      // Store methods
      const fetchAllFeeds = (profileId: string): E.Effect<void, FeedStoreError> => pipe(
        E.sync(() => { _loading = true; _error = Option.none(); }),
        E.flatMap(() => feedService.getAllFeeds(profileId)),
        E.tap((feeds) => { _feeds = feeds.map(mapFeedToUIFeed); }),
        E.catchAll((cause) => E.fail(new FeedStoreError({ 
          message: 'Failed to fetch feeds', 
          context: 'fetchAll',
          cause 
        }))),
        E.tapError((err) => { _error = Option.some(err); }),
        E.ensuring(E.sync(() => { _loading = false; }))
      );

      const createFeed = (input: CreateFeed): E.Effect<UIFeed, FeedStoreError, StoreEventBusService<StoreEvents>> => pipe(
        E.sync(() => { _loading = true; _error = Option.none(); }),
        E.flatMap(() => feedService.createFeed(input)),
        E.flatMap((newFeed) => E.gen(function* (scope) {
          const eventBus = yield* scope(StoreEventBusTag);
          const uiFeed = mapFeedToUIFeed(newFeed);
          _feeds = [..._feeds, uiFeed];
          yield* scope(eventBus.emit('feed:created', { feed: uiFeed }));
          return uiFeed;
        })),
        E.catchAll((cause) => E.fail(new FeedStoreError({ 
          message: 'Failed to create feed', 
          context: 'create',
          cause 
        }))),
        E.tapError((err) => { _error = Option.some(err); }),
        E.ensuring(E.sync(() => { _loading = false; }))
      );

      const processFeedWithAI = (feedId: string, patterns: string[]): E.Effect<void, FeedStoreError> => pipe(
        E.sync(() => { _aiProcessing = true; _error = Option.none(); }),
        E.flatMap(() => aiAgentService.processFeed(feedId, patterns)),
        E.tap(() => { 
          // Update feed processing status
          const feedIndex = _feeds.findIndex(f => f.id === feedId);
          if (feedIndex !== -1) {
            _feeds[feedIndex] = { ..._feeds[feedIndex], uiState: { ...(_feeds[feedIndex].uiState), processed: true } };
          }
        }),
        E.catchAll((cause) => E.fail(new FeedStoreError({ 
          message: 'Failed to process feed with AI', 
          context: 'ai_process',
          cause 
        }))),
        E.tapError((err) => { _error = Option.some(err); }),
        E.ensuring(E.sync(() => { _aiProcessing = false; }))
      );

      return {
        get feeds() { return _feeds; },
        get loading() { return _loading; },
        get aiProcessing() { return _aiProcessing; },
        get error() { return _error; },
        fetchAllFeeds,
        createFeed,
        processFeedWithAI,
        getFeedById: (id) => E.succeed(Option.fromNullable(_feeds.find(f => f.id === id)))
      };
    });
    ```

2.  **Singleton Instantiation and Export**: The store factory `Effect` is run once at the module level, providing all necessary service layers, to create a singleton store instance.

    ```typescript
    // At the end of src/lib/stores/feeds.store.svelte.ts
    import { FeedServiceLive } from '$lib/services/feeds/FeedService';
    import { MCPServiceLive } from '$lib/services/mcp/MCPService';
    import { AIAgentServiceLive } from '$lib/services/ai/AIAgentService';
    import { HttpClientServiceLive } from '$lib/services/http/HttpClientService';
    import { StoreEventBusLive } from '$lib/stores/storeEvents';

    // Create the full layer needed by createFeedsStoreEffect
    const feedsStoreLayer = Layer.mergeAll(
      FeedServiceLive,
      MCPServiceLive,
      AIAgentServiceLive,
      StoreEventBusLive,
      HttpClientServiceLive // Ensure all transitive dependencies are included
    );

    // Run the factory Effect with the combined layer to get the store instance
    const feedsStore = E.runSync(pipe(
      createFeedsStoreEffect(),
      E.provide(feedsStoreLayer)
    ));

    export default feedsStore;
    ```

3.  **Usage in Svelte Components**: UI components import the singleton store and interact with its reactive properties and methods.

    ```svelte
    <!-- Example Svelte Component: src/routes/feeds/+page.svelte -->
    <script lang="ts">
      import feedsStore from '$lib/stores/feeds.store.svelte';
      import { Effect as E, pipe, Option } from 'effect';
      import type { CreateFeed } from '$lib/types/feed';

      function handleFetchFeeds(profileId: string) {
        pipe(
          feedsStore.fetchAllFeeds(profileId),
          E.runPromise
        ).catch(err => {
          console.error('Component: Fetch feeds failed', err); 
        });
      }

      function handleCreateFeed(input: CreateFeed) {
        pipe(
          feedsStore.createFeed(input),
          E.runPromise
        ).then(newFeed => {
          console.log('Component: Feed created', newFeed);
        }).catch(err => {
          console.error('Component: Create feed failed', err);
        });
      }

      function handleProcessFeedWithAI(feedId: string) {
        pipe(
          feedsStore.processFeedWithAI(feedId, ['summarize', 'extract_wisdom']),
          E.runPromise
        ).catch(err => {
          console.error('Component: AI processing failed', err);
        });
      }

      // Initial fetch when component mounts
      $effect(() => {
        handleFetchFeeds('default-profile');
      });
    </script>

    <div>
      {#if feedsStore.loading}
        <p>Loading feeds...</p>
      {/if}

      {#if feedsStore.aiProcessing}
        <p>Processing with AI...</p>
      {/if}

      {#if Option.isSome(feedsStore.error)}
        <p style="color: red;">Error: {feedsStore.error.value.message}</p>
      {/if}

      <ul>
        {#each feedsStore.feeds as feed (feed.id)}
          <li>
            {feed.title}
            <button onclick={() => handleProcessFeedWithAI(feed.id)}>
              Process with AI
            </button>
          </li>
        {/each}
      </ul>

      <button onclick={() => handleFetchFeeds('default-profile')}>Refresh Feeds</button>
    </div>
    ```

## AI Agent Integration Pattern

WebInsight's AI agents (Archivist, Scribe, Librarian) are integrated using similar Effect patterns:

```typescript
// src/lib/services/ai/AIAgentService.ts
export interface AIAgentService {
  readonly archivist: {
    collectContent: (url: string) => E.Effect<CollectedContent, AIAgentError>;
    extractMetadata: (content: string) => E.Effect<ContentMetadata, AIAgentError>;
  };
  readonly scribe: {
    summarizeContent: (content: string) => E.Effect<ContentSummary, AIAgentError>;
    extractInsights: (content: string) => E.Effect<ContentInsights, AIAgentError>;
  };
  readonly librarian: {
    recommendContent: (preferences: UserPreferences) => E.Effect<ContentRecommendations, AIAgentError>;
    organizeContent: (content: Content[]) => E.Effect<ContentOrganization, AIAgentError>;
  };
}
```

## Event Bus Pattern (`src/lib/utils/eventBus.effect.ts`)

A generic, typed event bus using Effect's `Context.Tag` and `Layer` for decoupled communication between stores and services.

```typescript
// 1. Define event map (e.g., in src/lib/stores/storeEvents.ts)
export type StoreEvents = {
  'feed:created': { feed: UIFeed };
  'feed:updated': { feed: UIFeed };
  'content:processed': { content: UIContent; agent: 'archivist' | 'scribe' | 'librarian' };
  'ai:pattern:executed': { pattern: string; result: any };
};

// 2. Create specific tag and live layer using generic factories
import { createEventBusTag, createEventBusLiveLayer, type EventBusService } from '$lib/utils/eventBus.effect';
export const StoreEventBusTag = createEventBusTag<StoreEvents>('StoreEventBus');
export const StoreEventBusLive = createEventBusLiveLayer(StoreEventBusTag);
export type StoreEventBusService = EventBusService<StoreEvents>;
```

## MCP Provider Integration Pattern

For integrating with MCP providers like Crawl4AI or Fabric patterns:

```typescript
// src/lib/services/mcp/crawl4ai.service.ts
export interface Crawl4AIService {
  readonly extractContent: (url: string, mode: 'markdown' | 'text') => E.Effect<ExtractedContent, MCPServiceError>;
  readonly checkRobotsTxt: (url: string) => E.Effect<boolean, MCPServiceError>;
}

// Usage in AI agents
const archivistWithCrawl4AI = E.gen(function* ($) {
  const crawl4ai = yield* $(Crawl4AIServiceTag);
  const mcpClient = yield* $(MCPServiceTag);
  
  const extractedContent = yield* $(crawl4ai.extractContent(url, 'markdown'));
  const insights = yield* $(mcpClient.executePattern('extract_wisdom', extractedContent.content, mcpConfig));
  
  return { content: extractedContent, insights };
});
```

## Best Practices

- **Clear Separation**: Keep Svelte for UI and reactivity, Effect for logic, async operations, and state orchestration.
- **Typed Everything**: Leverage TypeScript and Effect's strong typing for services, stores, errors, and events.
- **Small, Composable Effects**: Build complex logic from smaller, well-defined Effects.
- **Explicit Dependencies**: Use `Context.Tag` and `Layer` for all service/store dependencies.
- **Structured Error Handling**: Use `Data.TaggedError` and catch specific tags.
- **Svelte 5 Runes**: Use `$state`, `$derived`, `$effect` appropriately within stores and components.
- **Immutability**: Prefer immutable updates to state where possible.
- **MCP Integration**: Use MCP providers for AI operations while maintaining type safety and error handling.

## Anti-patterns to Avoid

- **Mixing `async/await` with Effect Pipelines**: Once inside an Effect pipeline, stay within Effect. Use `E.tryPromise` to bridge promises into Effect.
- **Manual Dependency Management**: Avoid manually passing service instances; use `Context.Tag` and `Layer.provide`.
- **Ignoring Effect Error Channel**: Don't let Effects fail silently; handle errors explicitly with `E.catch*`.
- **Overuse of `E.runSync`**: Only use `E.runSync` if you are certain the Effect is synchronous. Prefer `E.runPromise` or `E.runFork`.
- **Large, Monolithic Stores/Services**: Break down complex domains into smaller, focused stores and services.
- **Direct MCP Calls in Components**: Always use services as intermediaries between components and MCP providers.
- **Bypassing Type Safety**: Always validate MCP responses and external data with Effect Schema.
