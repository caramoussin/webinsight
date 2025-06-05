import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Effect, Layer, Context, Exit, Option } from 'effect';
import { FeedServiceTag, FeedServiceLive, makeFeedService } from '$lib/services/feeds/FeedService';
import { DatabaseServiceTag, DrizzleClientTag } from '$lib/services/db/DatabaseService';
import { Feed, CreateFeed, UpdateFeed } from '$lib/schemas/feed.schema';
import {
	FeedCreationError,
	FeedNotFoundError,
	FeedUpdateError,
	FeedDeletionError
} from '$lib/services/feeds/feed.errors';

// Mock database service
const mockDatabaseService = {
	run: vi.fn(),
	all: vi.fn(),
	get: vi.fn()
};

// Mock drizzle client
const mockDrizzleClient = {} as any;

// Test data
const testFeed: Feed = {
	id: 'test-feed-id',
	name: 'Test Feed',
	url: 'https://example.com/feed.xml',
	profileId: 'test-profile-id',
	collectionId: 'test-collection-id',
	createdAt: new Date('2024-01-01T00:00:00Z'),
	updatedAt: new Date('2024-01-01T00:00:00Z')
};

const createFeedInput: CreateFeed = {
	name: 'Test Feed',
	url: 'https://example.com/feed.xml',
	profileId: 'test-profile-id',
	collectionId: 'test-collection-id'
};

const updateFeedInput: UpdateFeed = {
	name: 'Updated Feed',
	url: 'https://example.com/updated-feed.xml'
};

describe('FeedService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('createFeed', () => {
		it('should create a feed successfully', async () => {
			// Mock successful database operations
			mockDatabaseService.run.mockResolvedValue(undefined);
			mockDatabaseService.all.mockResolvedValue([
				{
					id: 'test-feed-id',
					name: 'Test Feed',
					url: 'https://example.com/feed.xml',
					profileId: 'test-profile-id',
					collectionId: 'test-collection-id',
					createdAt: Date.now(),
					updatedAt: Date.now()
				}
			]);

			const program = Effect.gen(function* (_) {
				const feedService = yield* _(FeedServiceTag);
				return yield* _(feedService.createFeed(createFeedInput));
			});

			const dbLayer = Layer.succeed(DatabaseServiceTag, mockDatabaseService);
			const drizzleLayer = Layer.succeed(DrizzleClientTag, mockDrizzleClient);
			const appLayer = Layer.merge(dbLayer, Layer.merge(drizzleLayer, FeedServiceLive));

			const result = await Effect.runPromiseExit(Effect.provide(program, appLayer));

			expect(Exit.isSuccess(result)).toBe(true);
			if (Exit.isSuccess(result)) {
				expect(result.value).toMatchObject({
					name: 'Test Feed',
					url: 'https://example.com/feed.xml',
					profileId: 'test-profile-id'
				});
			}
		});

		it('should fail when feed creation fails', async () => {
			// Mock database failure
			mockDatabaseService.run.mockRejectedValue(new Error('Database error'));

			const program = Effect.gen(function* (_) {
				const feedService = yield* _(FeedServiceTag);
				return yield* _(feedService.createFeed(createFeedInput));
			});

			const dbLayer = Layer.succeed(DatabaseServiceTag, mockDatabaseService);
			const drizzleLayer = Layer.succeed(DrizzleClientTag, mockDrizzleClient);
			const appLayer = Layer.merge(dbLayer, Layer.merge(drizzleLayer, FeedServiceLive));

			const result = await Effect.runPromiseExit(Effect.provide(program, appLayer));

			expect(Exit.isFailure(result)).toBe(true);
			if (Exit.isFailure(result)) {
				expect(result.cause._tag).toBe('Fail');
			}
		});

		it('should fail when feed is not found after creation', async () => {
			// Mock successful insert but no result returned
			mockDatabaseService.run.mockResolvedValue(undefined);
			mockDatabaseService.all.mockResolvedValue([]);

			const program = Effect.gen(function* (_) {
				const feedService = yield* _(FeedServiceTag);
				return yield* _(feedService.createFeed(createFeedInput));
			});

			const dbLayer = Layer.succeed(DatabaseServiceTag, mockDatabaseService);
			const drizzleLayer = Layer.succeed(DrizzleClientTag, mockDrizzleClient);
			const appLayer = Layer.merge(dbLayer, Layer.merge(drizzleLayer, FeedServiceLive));

			const result = await Effect.runPromiseExit(Effect.provide(program, appLayer));

			expect(Exit.isFailure(result)).toBe(true);
			if (Exit.isFailure(result)) {
				expect(result.cause._tag).toBe('Fail');
			}
		});
	});

	describe('getFeedById', () => {
		it('should return a feed when found', async () => {
			mockDatabaseService.all.mockResolvedValue([
				{
					id: 'test-feed-id',
					name: 'Test Feed',
					url: 'https://example.com/feed.xml',
					profileId: 'test-profile-id',
					collectionId: 'test-collection-id',
					createdAt: Date.now(),
					updatedAt: Date.now()
				}
			]);

			const program = Effect.gen(function* (_) {
				const feedService = yield* _(FeedServiceTag);
				return yield* _(feedService.getFeedById('test-feed-id', 'test-profile-id'));
			});

			const dbLayer = Layer.succeed(DatabaseServiceTag, mockDatabaseService);
			const drizzleLayer = Layer.succeed(DrizzleClientTag, mockDrizzleClient);
			const appLayer = Layer.merge(dbLayer, Layer.merge(drizzleLayer, FeedServiceLive));

			const result = await Effect.runPromiseExit(Effect.provide(program, appLayer));

			expect(Exit.isSuccess(result)).toBe(true);
			if (Exit.isSuccess(result)) {
				expect(Option.isSome(result.value)).toBe(true);
				if (Option.isSome(result.value)) {
					expect(result.value.value.id).toBe('test-feed-id');
				}
			}
		});

		it('should return None when feed not found', async () => {
			mockDatabaseService.all.mockResolvedValue([]);

			const program = Effect.gen(function* (_) {
				const feedService = yield* _(FeedServiceTag);
				return yield* _(feedService.getFeedById('non-existent-id', 'test-profile-id'));
			});

			const dbLayer = Layer.succeed(DatabaseServiceTag, mockDatabaseService);
			const drizzleLayer = Layer.succeed(DrizzleClientTag, mockDrizzleClient);
			const appLayer = Layer.merge(dbLayer, Layer.merge(drizzleLayer, FeedServiceLive));

			const result = await Effect.runPromiseExit(Effect.provide(program, appLayer));

			expect(Exit.isSuccess(result)).toBe(true);
			if (Exit.isSuccess(result)) {
				expect(Option.isNone(result.value)).toBe(true);
			}
		});
	});

	describe('getAllFeedsByProfileId', () => {
		it('should return all feeds for a profile', async () => {
			const mockFeeds = [
				{
					id: 'feed-1',
					name: 'Feed 1',
					url: 'https://example.com/feed1.xml',
					profileId: 'test-profile-id',
					collectionId: null,
					createdAt: Date.now(),
					updatedAt: Date.now()
				},
				{
					id: 'feed-2',
					name: 'Feed 2',
					url: 'https://example.com/feed2.xml',
					profileId: 'test-profile-id',
					collectionId: 'collection-1',
					createdAt: Date.now(),
					updatedAt: Date.now()
				}
			];

			mockDatabaseService.all.mockResolvedValue(mockFeeds);

			const program = Effect.gen(function* (_) {
				const feedService = yield* _(FeedServiceTag);
				return yield* _(feedService.getAllFeedsByProfileId('test-profile-id'));
			});

			const dbLayer = Layer.succeed(DatabaseServiceTag, mockDatabaseService);
			const drizzleLayer = Layer.succeed(DrizzleClientTag, mockDrizzleClient);
			const appLayer = Layer.merge(dbLayer, Layer.merge(drizzleLayer, FeedServiceLive));

			const result = await Effect.runPromiseExit(Effect.provide(program, appLayer));

			expect(Exit.isSuccess(result)).toBe(true);
			if (Exit.isSuccess(result)) {
				expect(result.value).toHaveLength(2);
				expect(result.value[0].id).toBe('feed-1');
				expect(result.value[1].id).toBe('feed-2');
			}
		});

		it('should return empty array when no feeds found', async () => {
			mockDatabaseService.all.mockResolvedValue([]);

			const program = Effect.gen(function* (_) {
				const feedService = yield* _(FeedServiceTag);
				return yield* _(feedService.getAllFeedsByProfileId('test-profile-id'));
			});

			const dbLayer = Layer.succeed(DatabaseServiceTag, mockDatabaseService);
			const drizzleLayer = Layer.succeed(DrizzleClientTag, mockDrizzleClient);
			const appLayer = Layer.merge(dbLayer, Layer.merge(drizzleLayer, FeedServiceLive));

			const result = await Effect.runPromiseExit(Effect.provide(program, appLayer));

			expect(Exit.isSuccess(result)).toBe(true);
			if (Exit.isSuccess(result)) {
				expect(result.value).toHaveLength(0);
			}
		});
	});

	describe('updateFeed', () => {
		it('should update a feed successfully', async () => {
			const existingFeed = {
				id: 'test-feed-id',
				name: 'Old Name',
				url: 'https://example.com/old-feed.xml',
				profileId: 'test-profile-id',
				collectionId: null,
				createdAt: Date.now(),
				updatedAt: Date.now()
			};

			const updatedFeed = {
				...existingFeed,
				name: 'Updated Feed',
				url: 'https://example.com/updated-feed.xml',
				updatedAt: Date.now() + 1000
			};

			mockDatabaseService.all
				.mockResolvedValueOnce([existingFeed]) // First call for existence check
				.mockResolvedValueOnce([updatedFeed]); // Second call for returning updated feed
			mockDatabaseService.run.mockResolvedValue(undefined);

			const program = Effect.gen(function* (_) {
				const feedService = yield* _(FeedServiceTag);
				return yield* _(feedService.updateFeed('test-feed-id', 'test-profile-id', updateFeedInput));
			});

			const dbLayer = Layer.succeed(DatabaseServiceTag, mockDatabaseService);
			const drizzleLayer = Layer.succeed(DrizzleClientTag, mockDrizzleClient);
			const appLayer = Layer.merge(dbLayer, Layer.merge(drizzleLayer, FeedServiceLive));

			const result = await Effect.runPromiseExit(Effect.provide(program, appLayer));

			expect(Exit.isSuccess(result)).toBe(true);
			if (Exit.isSuccess(result)) {
				expect(result.value.name).toBe('Updated Feed');
				expect(result.value.url).toBe('https://example.com/updated-feed.xml');
			}
		});

		it('should fail when feed does not exist', async () => {
			mockDatabaseService.all.mockResolvedValue([]);

			const program = Effect.gen(function* (_) {
				const feedService = yield* _(FeedServiceTag);
				return yield* _(
					feedService.updateFeed('non-existent-id', 'test-profile-id', updateFeedInput)
				);
			});

			const dbLayer = Layer.succeed(DatabaseServiceTag, mockDatabaseService);
			const drizzleLayer = Layer.succeed(DrizzleClientTag, mockDrizzleClient);
			const appLayer = Layer.merge(dbLayer, Layer.merge(drizzleLayer, FeedServiceLive));

			const result = await Effect.runPromiseExit(Effect.provide(program, appLayer));

			expect(Exit.isFailure(result)).toBe(true);
		});
	});

	describe('deleteFeed', () => {
		it('should delete a feed successfully', async () => {
			const existingFeed = {
				id: 'test-feed-id',
				name: 'Test Feed',
				url: 'https://example.com/feed.xml',
				profileId: 'test-profile-id',
				collectionId: null,
				createdAt: Date.now(),
				updatedAt: Date.now()
			};

			mockDatabaseService.all.mockResolvedValue([existingFeed]);
			mockDatabaseService.run.mockResolvedValue(undefined);

			const program = Effect.gen(function* (_) {
				const feedService = yield* _(FeedServiceTag);
				return yield* _(feedService.deleteFeed('test-feed-id', 'test-profile-id'));
			});

			const dbLayer = Layer.succeed(DatabaseServiceTag, mockDatabaseService);
			const drizzleLayer = Layer.succeed(DrizzleClientTag, mockDrizzleClient);
			const appLayer = Layer.merge(dbLayer, Layer.merge(drizzleLayer, FeedServiceLive));

			const result = await Effect.runPromiseExit(Effect.provide(program, appLayer));

			expect(Exit.isSuccess(result)).toBe(true);
			expect(mockDatabaseService.run).toHaveBeenCalledTimes(1);
		});

		it('should fail when feed does not exist', async () => {
			mockDatabaseService.all.mockResolvedValue([]);

			const program = Effect.gen(function* (_) {
				const feedService = yield* _(FeedServiceTag);
				return yield* _(feedService.deleteFeed('non-existent-id', 'test-profile-id'));
			});

			const dbLayer = Layer.succeed(DatabaseServiceTag, mockDatabaseService);
			const drizzleLayer = Layer.succeed(DrizzleClientTag, mockDrizzleClient);
			const appLayer = Layer.merge(dbLayer, Layer.merge(drizzleLayer, FeedServiceLive));

			const result = await Effect.runPromiseExit(Effect.provide(program, appLayer));

			expect(Exit.isFailure(result)).toBe(true);
			expect(mockDatabaseService.run).not.toHaveBeenCalled();
		});
	});
});
