import { Effect as E, pipe } from 'effect';
import { FetchHttpClient, HttpClient, HttpClientRequest } from '@effect/platform';
import type { Feed, CreateFeed, UpdateFeed } from '../schemas/feed.schema';

// Store state type
export interface FeedsStoreState {
	readonly feeds: readonly Feed[];
	readonly loading: boolean;
	readonly error: string | null;
}

// Store type definition
export type FeedsStore = {
	readonly feeds: Feed[];
	readonly loading: boolean;
	readonly error: string | null;
	loadFeeds: (profileId: string) => E.Effect<readonly Feed[], Error, HttpClient.HttpClient>;
	createFeed: (feedData: CreateFeed) => E.Effect<Feed, Error, HttpClient.HttpClient>;
	updateFeed: (
		id: string,
		profileId: string,
		feedData: UpdateFeed
	) => E.Effect<Feed, Error, HttpClient.HttpClient>;
	deleteFeed: (id: string, profileId: string) => E.Effect<void, Error, HttpClient.HttpClient>;
	getFeedById: (id: string) => Feed | undefined;
	clearError: () => void;
};

// HTTP request helpers
const createRequest = (method: string, url: string, body?: unknown) => {
	const baseRequest = (() => {
		switch (method.toUpperCase()) {
			case 'GET':
				return HttpClientRequest.get(url);
			case 'POST':
				return HttpClientRequest.post(url);
			case 'PUT':
				return HttpClientRequest.put(url);
			case 'DELETE':
				return HttpClientRequest.del(url);
			default:
				return HttpClientRequest.get(url);
		}
	})();

	if (body) {
		return E.succeed(baseRequest).pipe(E.flatMap((req) => HttpClientRequest.bodyJson(req, body)));
	}

	return E.succeed(baseRequest);
};

const makeRequest = <T>(
	method: string,
	url: string,
	body?: unknown
): E.Effect<T, Error, HttpClient.HttpClient> =>
	E.gen(function* () {
		const client = yield* HttpClient.HttpClient;
		const request = yield* createRequest(method, url, body);
		const response = yield* client.execute(request);

		if (!response.status.toString().startsWith('2')) {
			const errorText = yield* response.text;
			return yield* E.fail(new Error(`HTTP ${response.status}: ${errorText}`));
		}

		const result = yield* response.json;
		return result as T;
	}).pipe(
		E.mapError((error) => {
			if (error instanceof Error) {
				return error;
			}
			return new Error(`Request failed: ${String(error)}`);
		})
	);

/**
 * Factory function to create a feeds store as an Effect
 * @returns An Effect that creates a feeds store with state and methods
 */
const createFeedsStore = (): E.Effect<FeedsStore, never, HttpClient.HttpClient> => {
	return E.sync(() => {
		// State using Svelte 5 runes
		const feeds: Feed[] = $state([]);
		let loading: boolean = $state(false);
		let error: string | null = $state(null);

		const loadFeeds = (
			profileId: string
		): E.Effect<readonly Feed[], Error, HttpClient.HttpClient> =>
			pipe(
				E.sync(() => {
					loading = true;
					error = null;
				}),
				E.flatMap(() => makeRequest<Feed[]>('GET', `/api/feeds?profileId=${profileId}`)),
				E.tap((fetchedFeeds) =>
					E.sync(() => {
						feeds.splice(0, feeds.length, ...fetchedFeeds);
						loading = false;
						error = null;
					})
				),
				E.tapError((err) =>
					E.sync(() => {
						loading = false;
						error = err.message;
					})
				)
			);

		const createFeed = (feedData: CreateFeed): E.Effect<Feed, Error, HttpClient.HttpClient> =>
			pipe(
				E.sync(() => {
					loading = true;
					error = null;
				}),
				E.flatMap(() => makeRequest<Feed>('POST', '/api/feeds', feedData)),
				E.tap((newFeed) =>
					E.sync(() => {
						feeds.push(newFeed);
						loading = false;
						error = null;
					})
				),
				E.tapError((err) =>
					E.sync(() => {
						loading = false;
						error = err.message;
					})
				)
			);

		const updateFeed = (
			id: string,
			profileId: string,
			feedData: UpdateFeed
		): E.Effect<Feed, Error, HttpClient.HttpClient> =>
			pipe(
				E.sync(() => {
					loading = true;
					error = null;
				}),
				E.flatMap(() =>
					makeRequest<Feed>('PUT', `/api/feeds/${id}?profileId=${profileId}`, feedData)
				),
				E.tap((updatedFeed) =>
					E.sync(() => {
						const index = feeds.findIndex((feed) => feed.id === id);
						if (index !== -1) {
							feeds[index] = updatedFeed;
						}
						loading = false;
						error = null;
					})
				),
				E.tapError((err) =>
					E.sync(() => {
						loading = false;
						error = err.message;
					})
				)
			);

		const deleteFeed = (
			id: string,
			profileId: string
		): E.Effect<void, Error, HttpClient.HttpClient> =>
			pipe(
				E.sync(() => {
					loading = true;
					error = null;
				}),
				E.flatMap(() => makeRequest<void>('DELETE', `/api/feeds/${id}?profileId=${profileId}`)),
				E.tap(() =>
					E.sync(() => {
						const index = feeds.findIndex((feed) => feed.id === id);
						if (index !== -1) {
							feeds.splice(index, 1);
						}
						loading = false;
						error = null;
					})
				),
				E.tapError((err) =>
					E.sync(() => {
						loading = false;
						error = err.message;
					})
				)
			);

		const getFeedById = (id: string): Feed | undefined => {
			return feeds.find((feed) => feed.id === id);
		};

		const clearError = (): void => {
			error = null;
		};

		// Return the store object with getters for reactive properties
		return {
			get feeds() {
				return feeds;
			},
			get loading() {
				return loading;
			},
			get error() {
				return error;
			},
			loadFeeds,
			createFeed,
			updateFeed,
			deleteFeed,
			getFeedById,
			clearError
		};
	});
};

// Create a singleton instance of the store by running the Effect with the required services
let feedsStoreInstance: FeedsStore | null = null;

export const feedsStore = (() => {
	if (!feedsStoreInstance) {
		// Initialize the store synchronously by running the Effect
		feedsStoreInstance = E.runSync(pipe(createFeedsStore(), E.provide(FetchHttpClient.layer)));
	}
	return feedsStoreInstance;
})();

export default feedsStore;
