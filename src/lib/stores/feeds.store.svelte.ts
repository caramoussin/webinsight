import { Effect as E, pipe } from 'effect';
import { FetchHttpClient, HttpClient, HttpClientRequest } from '@effect/platform';
import type { Feed, CreateFeed, UpdateFeed } from '../schemas/feed.schema';

export interface FeedsStore {
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

/**
 * Creates an HTTP request based on the method and URL.
 * @param method The HTTP method (GET, POST, PUT, DELETE).
 * @param url The URL for the request.
 * @param body Optional request body for POST and PUT requests.
 * @returns An Effect that creates the request.
 */
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

/**
 * Makes an HTTP request and returns the response.
 * @param method The HTTP method (GET, POST, PUT, DELETE).
 * @param url The URL for the request.
 * @param body Optional request body for POST and PUT requests.
 * @returns An Effect that makes the request and returns the response.
 */
const makeRequest = <T>(
  method: string,
  url: string,
  body?: unknown
): E.Effect<T, Error, HttpClient.HttpClient> =>
  E.gen(function* () {
    console.log(`Making ${method} request to ${url}`, body ? { body } : '');
    const client = yield* HttpClient.HttpClient;
    const request = yield* createRequest(method, url, body);
    const response = yield* client.execute(request);
    console.log(`Response status: ${response.status}`);

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
    // Using let instead of const for feeds to ensure proper reactivity
    let feeds: Feed[] = $state([]);
    let loading: boolean = $state(false);
    let error: string | null = $state(null);

    const loadFeeds = (
      profileId: string
    ): E.Effect<readonly Feed[], Error, HttpClient.HttpClient> =>
      pipe(
        E.sync(() => {
          loading = true;
          error = null;
          console.log('Starting loadFeeds with profileId:', profileId);
        }),
        E.flatMap(() => {
          const url = `/api/feeds?profileId=${profileId}`;
          console.log('Making request to:', url);
          return makeRequest<Feed[]>('GET', url);
        }),
        E.tap((fetchedFeeds) =>
          E.sync(() => {
            console.log('Received feeds from API:', fetchedFeeds);
            // Create a new array with the fetched feeds to ensure reactivity
            // This is more reliable than mutating the existing array
            feeds = [...fetchedFeeds];
            loading = false;
            error = null;
            console.log('Updated feeds array:', feeds);
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
            // Create a new array with the existing feeds plus the new feed
            feeds = [...feeds, newFeed];
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
              // Create a new array with the updated feed
              feeds = [
                ...feeds.slice(0, index),
                updatedFeed,
                ...feeds.slice(index + 1)
              ];
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
              // Create a new array without the deleted feed
              feeds = [
                ...feeds.slice(0, index),
                ...feeds.slice(index + 1)
              ];
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

const feedsStore = createFeedsStore().pipe(E.provide(FetchHttpClient.layer), E.runSync);

export default feedsStore;
