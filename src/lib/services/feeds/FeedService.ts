import { Effect as E, Context, Layer, Option as O, Schema, pipe } from 'effect';
import { DatabaseServiceTag, DrizzleClientTag, type DatabaseService } from '../db/DatabaseService';
import { Feed, CreateFeed, UpdateFeed } from '../../schemas/feed.schema';
import type { FeedServiceError } from './feed.errors';
import {
	FeedCreationError,
	FeedNotFoundError,
	FeedUpdateError,
	FeedDeletionError
} from './feed.errors';
import { sql } from 'drizzle-orm';

/**
 * Defines the contract for feed management operations.
 */
export interface FeedService {
	readonly createFeed: (input: CreateFeed) => E.Effect<Feed, FeedServiceError>;
	readonly getFeedById: (
		id: string,
		profileId: string
	) => E.Effect<O.Option<Feed>, FeedServiceError>;
	readonly getAllFeedsByProfileId: (profileId: string) => E.Effect<Feed[], FeedServiceError>;
	readonly updateFeed: (
		id: string,
		profileId: string,
		input: UpdateFeed
	) => E.Effect<Feed, FeedServiceError>;
	readonly deleteFeed: (id: string, profileId: string) => E.Effect<void, FeedServiceError>;
}

/**
 * Context Tag for the FeedService.
 */
export class FeedServiceTag extends Context.Tag('FeedService')<FeedServiceTag, FeedService>() {}

/**
 * Live implementation of the FeedService.
 */
export const FeedServiceLive = Layer.effect(
	FeedServiceTag,
	E.gen(function* () {
		const db = yield* DatabaseServiceTag;
		const drizzleClient = yield* DrizzleClientTag;
		return makeFeedService(db, drizzleClient);
	})
);

/**
 * Creates a FeedService implementation using the provided database service
 */
function makeFeedService(
	db: DatabaseService,
	drizzleClient: typeof DrizzleClientTag.Service
): FeedService {
	// Helper to provide the drizzle client context to database operations
	const withDrizzle = <A, E>(effect: E.Effect<A, E, DrizzleClientTag>): E.Effect<A, E> =>
		E.provide(effect, Layer.succeed(DrizzleClientTag, drizzleClient));

	const createFeed = (input: CreateFeed): E.Effect<Feed, FeedServiceError> =>
		pipe(
			E.gen(function* () {
				// Generate a new feed with the input data
				const feedId = crypto.randomUUID();
				const now = Date.now();

				// Insert the feed into the database
				const insertQuery = sql`INSERT INTO feeds (id, name, url, profileId, collectionId, createdAt, updatedAt) 
                                  VALUES (${feedId}, ${input.name}, ${input.url}, ${input.profileId}, ${input.collectionId}, ${now}, ${now})`;

				yield* withDrizzle(db.run(insertQuery));

				// Retrieve the newly created feed
				const selectQuery = sql`SELECT * FROM feeds WHERE id = ${feedId} LIMIT 1`;
				const result = yield* withDrizzle(db.all(selectQuery));

				if (!result || result.length === 0) {
					return yield* E.fail(
						new FeedCreationError({
							message: 'Feed was inserted but could not be retrieved',
							input
						})
					);
				}

				// Decode the feed using Schema
				return yield* Schema.decodeUnknown(Feed)(result[0]);
			}),
			E.mapError((error) => {
				if (error instanceof FeedCreationError) {
					return error;
				}
				return new FeedCreationError({
					message: 'Failed to create feed',
					input,
					cause: error
				});
			}),
			E.withSpan('FeedService.createFeed')
		);

	const getFeedById = (id: string, profileId: string): E.Effect<O.Option<Feed>, FeedServiceError> =>
		pipe(
			E.gen(function* () {
				const query = sql`SELECT * FROM feeds WHERE id = ${id} AND profileId = ${profileId} LIMIT 1`;
				const result = yield* withDrizzle(db.all(query));

				if (!result || result.length === 0) {
					return O.none();
				}

				// Decode the feed using Schema
				const feed = yield* Schema.decodeUnknown(Feed)(result[0]);
				return O.some(feed);
			}),
			E.mapError(
				(error) =>
					new FeedNotFoundError({
						message: `Failed to find feed ${id}`,
						feedId: id,
						cause: error
					})
			),
			E.withSpan('FeedService.getFeedById')
		);

	const getAllFeedsByProfileId = (profileId: string): E.Effect<Feed[], FeedServiceError> =>
		pipe(
			E.gen(function* () {
				const query = sql`SELECT * FROM feeds WHERE profileId = ${profileId}`;
				const results = yield* withDrizzle(db.all(query));

				if (!results || results.length === 0) {
					return [];
				}

				// Decode all feeds using Schema
				return yield* E.forEach(results, (feed) => Schema.decodeUnknown(Feed)(feed));
			}),
			E.mapError(
				(error) =>
					new FeedNotFoundError({
						message: `Failed to find feeds for profile ${profileId}`,
						feedId: profileId,
						cause: error
					})
			),
			E.withSpan('FeedService.getAllFeedsByProfileId')
		);

	const updateFeed = (
		id: string,
		profileId: string,
		input: UpdateFeed
	): E.Effect<Feed, FeedServiceError> =>
		pipe(
			E.gen(function* () {
				// Check if the feed exists
				const existingQuery = sql`SELECT * FROM feeds WHERE id = ${id} AND profileId = ${profileId} LIMIT 1`;
				const existingResult = yield* withDrizzle(db.all(existingQuery));

				if (!existingResult || existingResult.length === 0) {
					return yield* E.fail(
						new FeedUpdateError({
							message: 'Feed not found',
							feedId: id,
							input
						})
					);
				}

				// Build update query dynamically based on provided fields
				const updateParts: string[] = [];

				if (input.name !== undefined) {
					updateParts.push(`name = '${input.name}'`);
				}

				if (input.url !== undefined) {
					updateParts.push(`url = '${input.url}'`);
				}

				if (input.collectionId !== undefined) {
					updateParts.push(`collectionId = '${input.collectionId}'`);
				}

				updateParts.push(`updatedAt = ${Date.now()}`);

				// Only update if there are fields to update
				if (updateParts.length > 1) {
					// > 1 because updatedAt is always added
					const updateQueryString = `UPDATE feeds SET ${updateParts.join(', ')} WHERE id = '${id}' AND profileId = '${profileId}'`;
					const updateQuery = sql.raw(updateQueryString);
					yield* withDrizzle(db.run(updateQuery));
				}

				// Get the updated feed
				const updatedQuery = sql`SELECT * FROM feeds WHERE id = ${id} AND profileId = ${profileId} LIMIT 1`;
				const updatedResult = yield* withDrizzle(db.all(updatedQuery));

				if (!updatedResult || updatedResult.length === 0) {
					return yield* E.fail(
						new FeedUpdateError({
							message: 'Feed was updated but could not be retrieved',
							feedId: id,
							input
						})
					);
				}

				// Decode the updated feed using Schema
				return yield* Schema.decodeUnknown(Feed)(updatedResult[0]);
			}),
			E.mapError((error) => {
				if (error instanceof FeedUpdateError) {
					return error;
				}
				return new FeedUpdateError({
					message: 'Failed to update feed',
					feedId: id,
					input,
					cause: error
				});
			}),
			E.withSpan('FeedService.updateFeed')
		);

	const deleteFeed = (id: string, profileId: string): E.Effect<void, FeedServiceError> =>
		pipe(
			E.gen(function* () {
				// Check if the feed exists
				const existingQuery = sql`SELECT * FROM feeds WHERE id = ${id} AND profileId = ${profileId} LIMIT 1`;
				const existingResult = yield* withDrizzle(db.all(existingQuery));

				if (!existingResult || existingResult.length === 0) {
					return yield* E.fail(
						new FeedDeletionError({
							message: 'Feed not found',
							feedId: id
						})
					);
				}

				// Delete the feed
				const deleteQuery = sql`DELETE FROM feeds WHERE id = ${id} AND profileId = ${profileId}`;
				yield* withDrizzle(db.run(deleteQuery));
			}),
			E.mapError((error) => {
				if (error instanceof FeedDeletionError) {
					return error;
				}
				return new FeedDeletionError({
					message: 'Failed to delete feed',
					feedId: id,
					cause: error
				});
			}),
			E.asVoid,
			E.withSpan('FeedService.deleteFeed')
		);

	return {
		createFeed,
		getFeedById,
		getAllFeedsByProfileId,
		updateFeed,
		deleteFeed
	};
}
