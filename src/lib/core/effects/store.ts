import * as Effect from '@effect/io/Effect';
import * as Layer from '@effect/io/Layer';
import * as Context from '@effect/data/Context';
import { AppError, CacheError } from './errors';
import { BaseService } from './service';
import { RuntimeConfig } from './runtime';

// Base interface for all stores
export interface BaseStore extends BaseService {
	readonly cache: Map<string, any>;

	// Cache operations
	get<T>(key: string): Effect.Effect<never, CacheError, T | null>;
	set<T>(key: string, value: T, ttl?: number): Effect.Effect<never, CacheError, void>;
	delete(key: string): Effect.Effect<never, CacheError, void>;
	clear(): Effect.Effect<never, CacheError, void>;
}

// Base store implementation
export abstract class BaseStoreImpl implements BaseStore {
	readonly _tag: string;
	readonly config: RuntimeConfig;
	readonly cache: Map<string, any>;

	constructor(tag: string, config: RuntimeConfig) {
		this._tag = tag;
		this.config = config;
		this.cache = new Map();
	}

	get<T>(key: string): Effect.Effect<never, CacheError, T | null> {
		return Effect.try({
			try: () => {
				const value = this.cache.get(key) as T | undefined;
				return value ?? null;
			},
			catch: (error) =>
				new CacheError({
					code: 'CACHE_GET_ERROR',
					message: `Failed to get value for key: ${key}`,
					cause: error
				})
		});
	}

	set<T>(key: string, value: T, ttl?: number): Effect.Effect<never, CacheError, void> {
		return Effect.try({
			try: () => {
				this.cache.set(key, value);
				if (ttl) {
					setTimeout(() => this.cache.delete(key), ttl);
				}
			},
			catch: (error) =>
				new CacheError({
					code: 'CACHE_SET_ERROR',
					message: `Failed to set value for key: ${key}`,
					cause: error
				})
		});
	}

	delete(key: string): Effect.Effect<never, CacheError, void> {
		return Effect.try({
			try: () => {
				this.cache.delete(key);
			},
			catch: (error) =>
				new CacheError({
					code: 'CACHE_DELETE_ERROR',
					message: `Failed to delete key: ${key}`,
					cause: error
				})
		});
	}

	clear(): Effect.Effect<never, CacheError, void> {
		return Effect.try({
			try: () => {
				this.cache.clear();
			},
			catch: (error) =>
				new CacheError({
					code: 'CACHE_CLEAR_ERROR',
					message: 'Failed to clear cache',
					cause: error
				})
		});
	}
}

// Helper to create store layers
export const createStoreLayer = <S extends BaseStore>(
	tag: Context.Tag<S, S>,
	implementation: new (config: RuntimeConfig) => S
): Layer.Layer<RuntimeConfig, never, S> =>
	Layer.effect(
		tag,
		Effect.map(
			Effect.service(Context.Tag<RuntimeConfig>('RuntimeConfig')),
			(config) => new implementation(config)
		)
	);
