import { Effect as E, Schedule, Duration, Schema, Data } from 'effect';

// Base error type for all services
export class ServiceError extends Data.TaggedError('ServiceError')<{
	code: string;
	message: string;
	cause?: unknown;
}> {}

// Helper to convert Promise-based functions to Effect
export const tryCatchPromise = <A>(
	promise: () => Promise<A>,
	onError: (error: unknown) => ServiceError
): E.Effect<A, ServiceError> => E.tryPromise({ try: promise, catch: onError });

// Helper for Effect Schema validation
export const validateWithSchema = <I, A>(
	schema: Schema.Schema<A, I>,
	data: I
): E.Effect<A, ServiceError> =>
	E.try({
		try: () => Schema.decodeSync(schema)(data),
		catch: (error) =>
			new ServiceError({ code: 'VALIDATION_ERROR', message: 'Validation failed', cause: error })
	});

// Helper for HTTP requests
export const fetchJSON = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
	const response = await fetch(input, init);
	if (!response.ok) {
		const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
		throw new ServiceError({
			code: `HTTP_${response.status}`,
			message: errorData.detail || `HTTP error ${response.status}`,
			cause: errorData
		});
	}
	return response.json();
};

// Effect-based HTTP request helper with retry and timeout
export const effectFetch = <T>(
	input: RequestInfo | URL,
	init?: RequestInit,
	retryCount = 3,
	timeoutMs = 10000
): E.Effect<T, ServiceError> => {
	// Create the fetch effect
	const fetchEffect = tryCatchPromise(
		() => fetchJSON<T>(input, init),
		(error) =>
			error instanceof ServiceError
				? error
				: new ServiceError({ code: 'FETCH_ERROR', message: 'Failed to fetch data', cause: error })
	);

	// Add timeout
	const withTimeout = E.timeout(fetchEffect, Duration.millis(timeoutMs)).pipe(
		E.catchTag('TimeoutException', () =>
			E.fail(
				new ServiceError({ code: 'TIMEOUT', message: `Request timed out after ${timeoutMs}ms` })
			)
		)
	);

	// Add retry with exponential backoff
	const withRetry = E.retry(
		withTimeout,
		Schedule.exponential(Duration.seconds(1)).pipe(Schedule.compose(Schedule.recurs(retryCount)))
	);

	// Add tracing
	return E.withSpan('effectFetch', { attributes: { url: input.toString() } })(withRetry);
};

// Helper for running Effects
export const runEffect = <A, E>(
	effect: E.Effect<A, E>,
	onSuccess: (a: A) => void,
	onError: (e: E) => void
): void => {
	E.runPromise(effect).then(onSuccess).catch(onError);
};
