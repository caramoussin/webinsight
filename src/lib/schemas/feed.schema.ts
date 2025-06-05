import { Schema as S } from 'effect';

/**
 * Represents a Feed item.
 */
export class Feed extends S.Class<Feed>('Feed')({
  id: S.UUID,
  name: S.optional(S.String),
  url: S.String, // Consider S.pattern for URL validation if needed, or a branded type
  profileId: S.String, // Assuming profileId is a string, could be S.UUID if profiles use UUIDs
  collectionId: S.optional(S.String), // Assuming collectionId is a string, could be S.UUID
  createdAt: S.DateFromNumber, // Drizzle schema stores as integer timestamp
  updatedAt: S.DateFromNumber, // Drizzle schema stores as integer timestamp
}) { }

/**
 * Schema for creating a new Feed. `id`, `createdAt`, `updatedAt` are usually generated.
 */
export class CreateFeed extends S.Class<CreateFeed>('CreateFeed')({
  url: S.String,
  name: S.optional(S.String),
  profileId: S.String,
  collectionId: S.optional(S.String),
}) { }

/**
 * Schema for updating an existing Feed. All fields are optional except for the ID used for lookup.
 */
export class UpdateFeed extends S.Class<UpdateFeed>('UpdateFeed')({
  name: S.optional(S.String),
  url: S.optional(S.String),
  collectionId: S.optional(S.String),
  // profileId is typically not updatable for an existing feed tied to a profile
}) { }
