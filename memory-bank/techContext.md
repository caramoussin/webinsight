# Technical Context

## Technology Stack

### Frontend
- SvelteKit
- TypeScript
- Tailwind CSS
- shadcn-svelte
- Svelte stores

### Backend
- Bun runtime
- SvelteKit
- SQLite
- Drizzle ORM
- Effect library

### Development Tools
- ESLint
- Prettier
- Vitest
- TypeScript
- Zod validation

## Development Setup

### Prerequisites
- Bun runtime
- Node.js
- SQLite
- Git

### Environment Variables
```env
DATABASE_URL=
BRAVE_API_KEY=
```

### Project Structure
```
/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   ├── server/
│   │   └── stores/
│   ├── routes/
│   └── app.d.ts
├── static/
├── migrations/
├── services/
├── scripts/
└── memory-bank/
```

## Technical Dependencies

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
- Vitest for testing
- PostCSS for CSS processing
- Tailwind for styling

## Technical Constraints

### Local-First
- All data stored locally
- Offline-first functionality
- Optional external services
- Privacy preservation

### Performance
- Efficient data processing
- Responsive UI
- Optimized database queries
- Background processing

### Security
- Local data encryption
- Secure API handling
- No data leakage
- Privacy by design

## Integration Points

### Brave Search API
- Optional integration
- Privacy-respecting search
- Query management
- Rate limiting
- Caching strategy

### RSS Feeds
- Feed parsing
- Content extraction
- Metadata handling
- Update management
- Error handling

### AI Integration
- Local processing
- Agent coordination
- Resource management
- State persistence
- Error recovery 