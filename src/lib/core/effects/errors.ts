import * as Effect from '@effect/io/Effect';
import * as Data from '@effect/data/Data';

// Base error interface
export interface AppErrorProps {
	readonly code: string;
	readonly message: string;
	readonly cause?: unknown;
}

// Define error tags
export type ErrorTag =
	| 'AppError'
	| 'ServiceError'
	| 'ValidationError'
	| 'NetworkError'
	| 'CacheError'
	| 'StoreError';

// Base error class
export class AppError extends Data.TaggedClass('AppError')<AppErrorProps> {}

// Service error
export class ServiceError extends Data.TaggedClass('ServiceError')<AppErrorProps> {}

// Validation error
export class ValidationError extends Data.TaggedClass('ValidationError')<AppErrorProps> {}

// Network error
export class NetworkError extends Data.TaggedClass('NetworkError')<AppErrorProps> {}

// Cache error
export class CacheError extends Data.TaggedClass('CacheError')<AppErrorProps> {}

// Store error
export class StoreError extends Data.TaggedClass('StoreError')<AppErrorProps> {}

// Error creation helpers
export const serviceError = (props: AppErrorProps): ServiceError => new ServiceError(props);
export const validationError = (props: AppErrorProps): ValidationError =>
	new ValidationError(props);
export const networkError = (props: AppErrorProps): NetworkError => new NetworkError(props);
export const cacheError = (props: AppErrorProps): CacheError => new CacheError(props);
export const storeError = (props: AppErrorProps): StoreError => new StoreError(props);

// Type for tagged errors
export type TaggedError = { readonly _tag: string };

// Error handling helpers
export const catchAll = <E extends AppError, A>(
	effect: Effect.Effect<never, E, A>
): Effect.Effect<never, E, A> =>
	Effect.catchAll(effect, (error) => {
		console.error(`${error._tag}: ${error.message}`);
		return Effect.fail(error);
	});

export const catchTag = <E extends AppError, A>(
	effect: Effect.Effect<never, E, A>,
	tag: string,
	handler: (error: E) => Effect.Effect<never, E, A>
): Effect.Effect<never, E, A> =>
	Effect.catchAll(effect, (error) => (error._tag === tag ? handler(error) : Effect.fail(error)));

export const catchTags = <E extends AppError, A>(
	effect: Effect.Effect<never, E, A>,
	handlers: Record<string, (error: E) => Effect.Effect<never, E, A>>
): Effect.Effect<never, E, A> =>
	Effect.catchAll(effect, (error) => {
		const handler = handlers[error._tag];
		return handler ? handler(error) : Effect.fail(error);
	});
