# Feeds Management System

This directory contains the complete implementation of the feeds management system for WebInsight, built with Effect.js and Svelte 5.

## Architecture Overview

The feeds system follows a clean architecture pattern with proper separation of concerns:

### Backend Layer

- **Database Schema**: SQLite table with Drizzle ORM (`src/lib/server/db/schema.ts`)
- **Service Layer**: Effect.js-based `FeedService` with proper dependency injection
- **Error Handling**: Typed errors with `FeedServiceError` union types
- **API Layer**: SvelteKit endpoints with Effect.js integration

### Frontend Layer

- **Store**: Reactive state management using Svelte 5 runes and Effect.js
- **Components**: Modular, reusable components with TypeScript
- **UI**: Modern, responsive design with Tailwind CSS

## Components

### `FeedListItem.svelte`

Displays individual feed items with:

- Inline editing capabilities
- Delete confirmation
- Responsive design
- Proper accessibility

### `AddFeedModal.svelte`

Modal form for creating new feeds with:

- Form validation
- Loading states
- Error handling
- Keyboard navigation (ESC to close)

## Store (`feeds.store.svelte.ts`)

The feeds store provides:

- Reactive state using Svelte 5 `$state` runes
- Effect.js-based async operations
- Proper error handling and loading states
- CRUD operations for feeds

### Key Methods

- `fetchAllFeeds(profileId)`: Load all feeds for a profile
- `addNewFeed(data)`: Create a new feed
- `saveFeedChanges(id, data)`: Update an existing feed
- `removeFeedById(id, profileId)`: Delete a feed
- `getFeedById(id, profileId)`: Get a specific feed

## API Endpoints

### `/api/feeds/+server.ts`

- `GET`: List all feeds for a profile
- `POST`: Create a new feed

### `/api/feeds/[id]/+server.ts`

- `GET`: Get a specific feed
- `PUT`: Update a feed
- `DELETE`: Delete a feed

## Usage Example

```typescript
import { feedsStore } from '$lib/stores/feeds.store.svelte';
import { Effect } from 'effect';

// Load feeds
await Effect.runPromise(feedsStore.fetchAllFeeds('profile-id'));

// Add a new feed
const newFeed = await Effect.runPromise(
  feedsStore.addNewFeed({
    url: 'https://example.com/feed.xml',
    name: 'Example Feed',
    profileId: 'profile-id'
  })
);
```

## Features

✅ **Complete CRUD Operations**: Create, read, update, delete feeds
✅ **Type Safety**: Full TypeScript support with Effect.js schemas
✅ **Error Handling**: Comprehensive error handling at all layers
✅ **Responsive UI**: Mobile-friendly design with Tailwind CSS
✅ **Loading States**: Proper loading indicators and disabled states
✅ **Form Validation**: Client-side validation with helpful error messages
✅ **Accessibility**: Proper ARIA labels and keyboard navigation

## Future Enhancements

- Feed validation (check if URL is a valid RSS/Atom feed)
- Bulk operations (select and delete multiple feeds)
- Search and filtering capabilities
- Feed preview and metadata extraction
- Collections management integration
- Import/export functionality

## Dependencies

- **Effect.js**: Functional programming and error handling
- **Svelte 5**: Reactive UI with runes
- **Tailwind CSS**: Styling and responsive design
- **Drizzle ORM**: Database operations
- **SvelteKit**: Full-stack framework
