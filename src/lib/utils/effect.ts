import * as Effect from '@effect/io/Effect';
import * as Schedule from '@effect/io/Schedule';
import * as Duration from '@effect/data/Duration';
import { Tag } from '@effect/data/Context';
import * as Option from '@effect/data/Option';
import * as Schema from '@effect/schema/Schema';

// Base error type for all services
export class ServiceError {
  readonly _tag = 'ServiceError';
  constructor(
    readonly code: string,
    readonly message: string,
    readonly cause?: unknown
  ) {}
}

// Helper to convert Promise-based functions to Effect
export const tryCatchPromise = <A>(
  promise: () => Promise<A>,
  onError: (error: unknown) => ServiceError
): Effect.Effect<never, ServiceError, A> =>
  Effect.tryPromise({
    try: promise,
    catch: onError
  });

// Helper for Effect Schema validation
export const validateWithSchema = <I, A>(
  schema: Schema.Schema<A, I>,
  data: I
): Effect.Effect<never, ServiceError, A> =>
  Effect.try({
    try: () => Schema.decodeSync(schema)(data),
    catch: (error) => new ServiceError('VALIDATION_ERROR', 'Validation failed', error)
  });

// Helper for HTTP requests
export const fetchJSON = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new ServiceError(
      `HTTP_${response.status}`,
      errorData.detail || `HTTP error ${response.status}`,
      errorData
    );
  }
  return response.json();
};

// Effect-based HTTP request helper with retry and timeout
export const effectFetch = <T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  retryCount = 3,
  timeoutMs = 10000
): Effect.Effect<never, ServiceError, T> => {
  // Create the fetch effect
  const fetchEffect = tryCatchPromise(
    () => fetchJSON<T>(input, init),
    (error) =>
      error instanceof ServiceError
        ? error
        : new ServiceError('FETCH_ERROR', 'Failed to fetch data', error)
  );

  // Add timeout
  const withTimeout = Effect.flatMap(
    Effect.timeout(fetchEffect, Duration.millis(timeoutMs)),
    Option.match({
      onNone: () =>
        Effect.fail(new ServiceError('TIMEOUT', `Request timed out after ${timeoutMs}ms`)),
      onSome: Effect.succeed
    })
  );

  // Add retry with exponential backoff
  const withRetry = Effect.retry(
    withTimeout,
    Schedule.exponential(Duration.seconds(1)).pipe(Schedule.compose(Schedule.recurs(retryCount)))
  );

  // Add tracing
  return Effect.withSpan('effectFetch', {
    attributes: { url: input.toString() }
  })(withRetry);
};

// Helper for running Effects
export const runEffect = <E, A>(
  effect: Effect.Effect<never, E, A>,
  onSuccess: (a: A) => void,
  onError: (e: E) => void
): void => {
  Effect.runPromise(effect).then(onSuccess).catch(onError);
};

// Type helper for service layers
export type ServiceTag<T> = Tag<T, T>;

// Helper for creating service tags
export const createServiceTag = <T>(name: string): ServiceTag<T> => Tag<T, T>(Symbol.for(name));
