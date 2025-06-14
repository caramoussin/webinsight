# Feeds Page Implementation

This document outlines the tasks required to implement the Feeds page, which will allow users to list all registered feeds and add new ones.

## Completed Tasks

**🎉 MAJOR MILESTONE: Core Feeds Management System Complete!**

The feeds management system is now fully functional with a complete backend service layer, API endpoints, and modern frontend interface. Users can create, read, update, and delete feeds through a beautiful, responsive UI with proper error handling and loading states.

### Backend Services (Effect TS)

#### Database Service (`src/lib/services/db/DatabaseService.ts` & `db.errors.ts`)

- [x] Define `DatabaseError` extending `Data.TaggedError<'DatabaseError'>` for generic database operation failures
- [x] Define `DatabaseService` interface with methods for database interactions
- [x] Create `DatabaseServiceTag` using `Context.Tag<DatabaseServiceTag, DatabaseService>()`
- [x] Implement `DatabaseServiceLive` layer

#### Feed Service (`src/lib/services/feeds/FeedService.ts` & `feed.errors.ts`)

- [x] Define `Feed` data type using `effect` Schema (in `src/lib/schemas/feed.schema.ts`)
- [x] Define `FeedServiceError` extending `Data.TaggedError` for service-specific errors
- [x] Define `FeedService` interface with methods returning `Effect`
- [x] Create `FeedServiceTag` using `Context.Tag<FeedServiceTag, FeedService>()`
- [x] Implement `FeedServiceLive`: `Layer.effect<FeedServiceTag, never, DatabaseServiceTag>`
  - [x] `createFeed(input: CreateFeed): Effect<Feed, FeedServiceError>`
  - [x] `getFeedById(id: string, profileId: string): Effect<Option.Option<Feed>, FeedServiceError>`
  - [x] `getAllFeedsByProfileId(profileId: string): Effect<Feed[], FeedServiceError>`
  - [x] `updateFeed(id: string, profileId: string, input: UpdateFeed): Effect<Feed, FeedServiceError>`
  - [x] `deleteFeed(id: string, profileId: string): Effect<void, FeedServiceError>`

### Database Layer (Drizzle ORM & SQLite)

- [x] Define `feeds` table schema in `src/lib/server/db/schema.ts`
- [x] Schema includes all required fields (id, name, url, profileId, collectionId, createdAt, updatedAt)

### API Endpoints (SvelteKit - `src/routes/api/feeds/`)

- [x] `POST /api/feeds/+server.ts`: Create a new feed
- [x] `GET /api/feeds/+server.ts`: List all feeds for the current profile
- [x] `GET /api/feeds/[id]/+server.ts`: Get a specific feed by ID
- [x] `PUT /api/feeds/[id]/+server.ts`: Update a specific feed
- [x] `DELETE /api/feeds/[id]/+server.ts`: Delete a specific feed

### Frontend (SvelteKit)

- [x] **Stores (`src/lib/stores/feeds.store.svelte.ts`)**:
  - [x] Define `FeedStoreError` extending `Data.TaggedError<'FeedStoreError'>`
  - [x] Define `FeedsStore` type including reactive state (using Svelte 5 runes like `$state`):
    - [x] `feeds: Feed[] = $state([])`
    - [x] `loading: boolean = $state(false)`
    - [x] `error: string | null = $state(null)`
  - [x] Implement `createFeedsStore()` factory function:
    - [x] Initialize reactive state variables
    - [x] Define methods that interact with API endpoints and return `Effect`:
      - [x] `fetchAllFeeds(): Effect<void, FeedStoreError>`
      - [x] `addNewFeed(data: CreateFeed): Effect<Feed, FeedStoreError>`
      - [x] `saveFeedChanges(id: string, data: UpdateFeed): Effect<Feed, FeedStoreError>`
      - [x] `removeFeedById(id: string): Effect<void, FeedStoreError>`
      - [x] `getFeedById(id: string): Effect<Feed | null, FeedStoreError>`
  - [x] Initialize and export the singleton `feedsStore` instance
- [x] **Page (`src/routes/feeds/+page.svelte`)**:
  - [x] Load and display the list of feeds from `feedsStore`
  - [x] Include an "Add New Feed" button
  - [x] Implement a modal for adding a new feed
  - [x] Handle feed editing and deletion
  - [x] Loading states and error handling
- [x] **Components (`src/lib/components/feeds/`)**:
  - [x] `FeedListItem.svelte`: Displays a single feed's details and action buttons
  - [x] `AddFeedModal.svelte`: Modal form for feed creation with validation

## Todo Tasks

### Database Layer (Drizzle ORM & SQLite)

- [ ] Ensure the custom migration script handles the creation of the `feeds` table on profile load
- [ ] Add proper foreign key constraints when profiles/collections tables are implemented

### API Endpoint Improvements

- [ ] Add proper authentication and profile resolution in API endpoints
- [ ] Implement proper Drizzle client provider function
- [ ] Add input validation and better error handling
- [ ] Add API rate limiting and security headers

### Frontend Enhancements

- [ ] Add proper authentication context to get real profileId
- [ ] Implement client-side caching for better performance
- [ ] Add feed validation (check if URL is a valid RSS/Atom feed)
- [ ] Add bulk operations (delete multiple feeds)
- [ ] Add search and filtering capabilities

## Future Tasks

- [ ] Add functionality to associate feeds with collections.
- [ ] Display more feed details (e.g., last fetched date, number of articles).
- [ ] Implement inline editing for feeds.
- [ ] Add pagination or infinite scrolling for large feed lists.
- [ ] Implement feed validation (e.g., check if URL is a valid feed format before saving).
- [ ] Unit and integration tests for services and API endpoints.

## Implementation Plan

1.  **Database Setup**: Define the `feeds` table schema and ensure migrations are handled.
2.  **Backend Logic**: Implement the `FeedService` with all CRUD operations using Effect TS, ensuring proper error handling and dependency injection (e.g., for the database).
3.  **API Development**: Create the SvelteKit API endpoints that utilize the `FeedService` to expose feed management functionality.
4.  **Frontend State Management**: Develop the `feedsStore` to manage feed data and interactions with the backend API.
5.  **UI Implementation**: Build the `Feeds` page (`+page.svelte`) to display the list of feeds and integrate the `AddFeedForm` component.
6.  **Component Creation**: Develop the `FeedListItem` and `AddFeedForm` (or modal) components with appropriate styling (Tailwind CSS, shadcn-svelte).
7.  **Integration and Testing**: Connect all parts, test thoroughly, and iterate.

## Update Documentation

- `documentation/work-in-progress.md`: Add a section for Feeds Page development.
- `documentation/status.md`: Update with the current status of the Feeds Page feature.
- `documentation/requirements.md`: Review and update FR1.4 (Manage content sources) if necessary to reflect feed management details.
- `documentation/architecture.md`: If significant new architectural patterns are introduced for feed management (e.g., specific Effect TS patterns for this domain), document them.

### Relevant Files

_Data Layer_

- `src/lib/server/db/schema/feeds.ts` - Drizzle schema for the `feeds` table.
- `src/lib/server/db/schema/index.ts` - Main Drizzle schema including feeds.

_Services_

- `src/lib/services/FeedService.ts` - Effect TS service for feed business logic.

_API Routes_

- `src/routes/api/feeds/+server.ts` - API for creating and listing feeds.
- `src/routes/api/feeds/[id]/+server.ts` - API for specific feed operations (GET, PUT, DELETE).

_Frontend Stores_

- `src/lib/stores/feeds.store.svelte.ts` - Svelte store (using Effect pattern) for managing feed state.

_Frontend Routes_

- `src/routes/feeds/+page.svelte` - Main page for displaying feeds.

_Frontend Components_

- `src/lib/components/feeds/FeedListItem.svelte` - Component for an individual feed item.
- `src/lib/components/feeds/AddFeedForm.svelte` - Component for the add feed form/modal.

_Documentation_

- `documentation/work-in-progress.md`
- `documentation/status.md`
- `documentation/requirements.md`
- `documentation/architecture.md`
- `FEEDS_PAGE_TASKS.md` - This file.
