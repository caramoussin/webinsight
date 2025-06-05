import { Effect as E, Schedule, Duration, Schema, Data } from 'effect';
import { HttpClient, HttpClientRequest, FetchHttpClient } from '@effect/platform';

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

// Effect-based HTTP request helper with HttpClient
export const effectFetch = <T>(
	url: string,
	options?: {
		method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
		body?: unknown;
		headers?: Record<string, string>;
	},
	retryCount = 3,
	timeoutMs = 10000
): E.Effect<T, ServiceError> => {
	const { method = 'GET', body, headers = {} } = options || {};

	// Create the fetch effect using HttpClient
	const fetchEffect = E.gen(function* () {
		const client = yield* HttpClient.HttpClient;

		// Create base request
		let request: HttpClientRequest.HttpClientRequest;
		switch (method) {
			case 'GET':
				request = HttpClientRequest.get(url);
				break;
			case 'POST':
				request = HttpClientRequest.post(url);
				break;
			case 'PUT':
				request = HttpClientRequest.put(url);
				break;
			case 'DELETE':
				request = HttpClientRequest.del(url);
				break;
			default:
				request = HttpClientRequest.get(url);
		}

		// Add headers
		if (Object.keys(headers).length > 0) {
			request = HttpClientRequest.setHeaders(request, headers);
		}

		// Add body for non-GET requests
		if (body && method !== 'GET') {
			request = yield* HttpClientRequest.bodyJson(request, body);
		}

		const response = yield* client.execute(request);

		// Check if response is successful
		if (!response.status.toString().startsWith('2')) {
			const errorText = yield* response.text;
			let errorData: { detail?: string; [key: string]: unknown };
			try {
				errorData = JSON.parse(errorText);
			} catch {
				errorData = { detail: errorText || 'Unknown error' };
			}

			return yield* E.fail(
				new ServiceError({
					code: `HTTP_${response.status}`,
					message: errorData.detail || `HTTP error ${response.status}`,
					cause: errorData
				})
			);
		}

		const result = yield* response.json;
		return result as T;
	}).pipe(
		E.mapError((error) =>
			error instanceof ServiceError
				? error
				: new ServiceError({
						code: 'FETCH_ERROR',
						message: 'Failed to fetch data',
						cause: error
					})
		)
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

	// Add tracing and provide HttpClient layer
	return E.withSpan('effectFetch', { attributes: { url, method } })(withRetry).pipe(
		E.provide(FetchHttpClient.layer)
	);
};

// Legacy wrapper for backward compatibility (converts to Promise)
export const fetchJSON = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
	const url = input.toString();
	const method = (init?.method as 'GET' | 'POST' | 'PUT' | 'DELETE') || 'GET';
	const body = init?.body ? JSON.parse(init.body as string) : undefined;
	const headers = (init?.headers as Record<string, string>) || {};

	const effect = effectFetch<T>(url, { method, body, headers });
	return E.runPromise(effect);
};

// Helper for running Effects
export const runEffect = <A, E>(
	effect: E.Effect<A, E>,
	onSuccess: (a: A) => void,
	onError: (e: E) => void
): void => {
	E.runPromise(effect).then(onSuccess).catch(onError);
};
