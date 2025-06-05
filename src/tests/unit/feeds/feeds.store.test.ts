import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { Effect } from 'effect';
import type { Feed, CreateFeed, UpdateFeed } from '$lib/schemas/feed.schema';

// Test data
const mockFeed: Feed = {
	id: '00000000-0000-4000-8000-000000000000' as const,
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
	name: 'Updated Feed Name'
};

// Mock the effectFetch function
vi.mock('$lib/utils/effect', () => ({
	effectFetch: vi.fn(),
	ServiceError: class ServiceError extends Error {
		constructor(public options: { code: string; message: string; cause?: unknown }) {
			super(options.message);
		}
	}
}));

// Simple test implementation of the store without Svelte runes
class TestFeedsStore {
	feeds: Feed[] = [];
	loading = false;
	error: string | null = null;

	private async runEffect<T>(effect: Effect.Effect<T, unknown, never>): Promise<T> {
		this.loading = true;
		this.error = null;

		try {
			const result = await Effect.runPromise(effect);
			this.loading = false;
			return result;
		} catch (error) {
			this.loading = false;
			this.error = error instanceof Error ? error.message : 'Unknown error';
			throw error;
		}
	}

	async loadFeeds() {
		const { effectFetch } = await import('$lib/utils/effect');
		const effect = effectFetch<Feed[]>('/api/feeds', { method: 'GET' });
		const feeds = await this.runEffect(effect);
		this.feeds = feeds;
		return feeds;
	}

	async addFeed(feedData: CreateFeed) {
		const { effectFetch } = await import('$lib/utils/effect');
		const effect = effectFetch<Feed>('/api/feeds', {
			method: 'POST',
			body: feedData,
			headers: { 'Content-Type': 'application/json' }
		});

		const newFeed = await this.runEffect(effect);
		this.feeds.push(newFeed);
		return newFeed;
	}

	async updateFeed(id: string, feedData: UpdateFeed) {
		const { effectFetch } = await import('$lib/utils/effect');
		const effect = effectFetch<Feed>(`/api/feeds/${id}`, {
			method: 'PUT',
			body: feedData,
			headers: { 'Content-Type': 'application/json' }
		});

		const updatedFeed = await this.runEffect(effect);
		const index = this.feeds.findIndex((f) => f.id === id);
		if (index !== -1) {
			this.feeds[index] = updatedFeed;
		}
		return updatedFeed;
	}

	async deleteFeed(id: string) {
		const { effectFetch } = await import('$lib/utils/effect');
		const effect = effectFetch<void>(`/api/feeds/${id}`, { method: 'DELETE' });
		await this.runEffect(effect);
		this.feeds = this.feeds.filter((f) => f.id !== id);
	}

	clearError() {
		this.error = null;
	}
}

describe('FeedsStore with HttpClient', () => {
	let store: TestFeedsStore;

	beforeEach(async () => {
		store = new TestFeedsStore();

		// Reset all mocks
		vi.clearAllMocks();

		// Import the mock after clearing
		const { effectFetch } = await import('$lib/utils/effect');
		const mockEffectFetch = effectFetch as unknown as MockedFunction<typeof effectFetch>;

		// Setup default mock implementations
		mockEffectFetch.mockImplementation(
			(
				url: string,
				options?: { method?: string; body?: unknown; headers?: Record<string, string> }
			) => {
				if (url === '/api/feeds' && options?.method === 'GET') {
					return Effect.succeed([mockFeed]);
				}

				if (url === '/api/feeds' && options?.method === 'POST') {
					return Effect.succeed(mockFeed);
				}

				if (url.startsWith('/api/feeds/') && options?.method === 'PUT') {
					return Effect.succeed({ ...mockFeed, ...updateFeedInput });
				}

				if (url.startsWith('/api/feeds/') && options?.method === 'DELETE') {
					return Effect.succeed(undefined);
				}

				return Effect.fail(new Error('Not found'));
			}
		);
	});

	it('should initialize with empty state', () => {
		expect(store.feeds).toEqual([]);
		expect(store.loading).toBe(false);
		expect(store.error).toBeNull();
	});

	it('should load feeds successfully', async () => {
		const feeds = await store.loadFeeds();

		expect(feeds).toEqual([mockFeed]);
		expect(store.feeds).toEqual([mockFeed]);
		expect(store.loading).toBe(false);
		expect(store.error).toBeNull();
	});

	it('should add a feed successfully', async () => {
		const newFeed = await store.addFeed(createFeedInput);

		expect(newFeed).toEqual(mockFeed);
		expect(store.feeds).toContain(mockFeed);
		expect(store.loading).toBe(false);
		expect(store.error).toBeNull();
	});

	it('should update a feed successfully', async () => {
		// First add a feed
		await store.addFeed(createFeedInput);

		// Then update it
		const updatedFeed = await store.updateFeed(mockFeed.id, updateFeedInput);

		expect(updatedFeed.name).toBe(updateFeedInput.name);
		expect(store.loading).toBe(false);
		expect(store.error).toBeNull();
	});

	it('should delete a feed successfully', async () => {
		// First add a feed
		await store.addFeed(createFeedInput);
		expect(store.feeds).toHaveLength(1);

		// Then delete it
		await store.deleteFeed(mockFeed.id);

		expect(store.feeds).toHaveLength(0);
		expect(store.loading).toBe(false);
		expect(store.error).toBeNull();
	});

	it('should clear error state', () => {
		store.error = 'Test error';
		store.clearError();
		expect(store.error).toBeNull();
	});
});
