# Technical Context

## Technology Stack

### Core Effect Stack
- Effect library for functional programming
- Effect Schema for validation
- Effect Data for immutable data structures
- Effect Context for dependency injection
- Effect Layer for service composition

### Frontend
- SvelteKit
- TypeScript
- Tailwind CSS
- shadcn-svelte
- Effect-based stores

### Backend
- Bun runtime
- SvelteKit
- SQLite
- Drizzle ORM
- Effect services

### Development Tools
- ESLint
- Prettier
- Vitest
- TypeScript
- Effect Schema validation

## Development Setup

### Prerequisites
- Bun runtime
- Node.js
- SQLite
- Git
- Effect library and its ecosystem

### Environment Variables
```env
DATABASE_URL=
BRAVE_API_KEY=
LOG_LEVEL=
CACHE_ENABLED=
CACHE_TTL=
```

### Project Structure
```
/
├── src/
│   ├── lib/
│   │   ├── core/
│   │   │   ├── effects/
│   │   │   │   ├── errors.ts
│   │   │   │   ├── runtime.ts
│   │   │   │   ├── service.ts
│   │   │   │   └── store.ts
│   │   │   ├── schemas/
│   │   │   └── types/
│   │   ├── services/
│   │   │   ├── mcp/
│   │   │   └── scraper/
│   │   ├── stores/
│   │   ├── components/
│   │   └── utils/
│   ├── routes/
│   └── app.d.ts
├── static/
├── migrations/
├── services/
├── scripts/
└── memory-bank/
```

## Technical Dependencies

### Effect Dependencies
- @effect/io for core functionality
- @effect/data for data structures
- @effect/schema for validation
- @effect/stream for streaming
- @effect/cache for caching

### Core Dependencies
- SvelteKit for full-stack framework
- Bun for runtime and package management
- SQLite for local database
- Drizzle for ORM
- Effect for functional programming
- shadcn for UI components

### Development Dependencies
- TypeScript for type safety
- ESLint for linting
- Prettier for formatting
- Vitest for testing (TypeScript)
- `@effect/vitest` for Effect integration in tests
- `vi.mock` for mocking in Vitest
- `Effect.resetRuntime()` in `src/tests/setup.ts` for test isolation
- Pytest for testing (Python microservices)
- `pytest-asyncio` for async Python tests
- `unittest.mock` for mocking in Python tests
- `fastapi.testclient` for testing FastAPI apps
- PostCSS for CSS processing
- Tailwind for styling

### Microservice Environment (Python)
- Python 3.x
- Virtual Environment (`venv`)
- `pip` for package management
- FastAPI for web framework
- Uvicorn for ASGI server
- httpx for HTTP client (testing)

## Technical Constraints

### Effect Architecture
- Pure functional programming
- Type-safe dependency injection
- Effect-based error handling
- Composable services and stores
- Runtime configuration
- Caching strategies

### Local-First
- Effect-based local storage
- Offline-first functionality
- Optional external services
- Privacy preservation

### Performance
- Effect-based concurrency
- Responsive UI
- Optimized caching
- Background processing

### Security
- Effect-based error boundaries
- Secure API handling
- No data leakage
- Privacy by design

## Integration Points

### Effect Service Layer
- Type-safe service definitions
- Dependency injection
- Error handling
- Resource management
- Caching strategies

### Effect Store Layer
- State management
- Cache invalidation
- Reactive updates
- Type-safe operations
- Error boundaries

### Brave Search API
- Effect-based API client
- Privacy-respecting search
- Query management
- Rate limiting
- Effect-based caching

### RSS Feeds
- Effect-based feed parsing
- Content extraction
- Metadata handling
- Update management
- Error handling

### AI Integration
- Effect-based agent system
- Resource management
- State persistence
- Error recovery
- Type-safe messaging 