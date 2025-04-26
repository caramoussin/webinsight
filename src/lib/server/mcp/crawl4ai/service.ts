import * as Effect from '@effect/io/Effect';
import { pipe } from '@effect/data/Function';
import {
	validateWithSchema,
	effectFetch,
	ServiceError,
	createServiceTag
} from '../../../utils/effect';

import * as Schemas from './schemas';
import * as Errors from './errors';

/**
 * Crawl4AI MCP Provider Service
 *
 * This service provides an MCP interface to the Crawl4AI Python service,
 * exposing web content extraction capabilities as standardized MCP Tools.
 */

// Type definitions for MCP tools
type Tool<N extends string, P> = {
	name: N;
	description: string;
	parameters: P;
};

// Service interface
export interface Crawl4AIService {
	/**
	 * Extract content from a web page
	 */
	extractContent(
		params: Schemas.ExtractContentInput
	): Effect.Effect<never, Errors.Crawl4AIMCPError, Schemas.ExtractContentOutput>;

	/**
	 * Check if scraping is allowed by robots.txt for a given URL
	 */
	checkRobotsTxt(
		params: Schemas.CheckRobotsTxtInput
	): Effect.Effect<never, Errors.Crawl4AIMCPError, Schemas.CheckRobotsTxtOutput>;

	/**
	 * List available MCP Tools
	 */
	listTools(): Effect.Effect<
		never,
		Errors.Crawl4AIMCPError,
		Array<
			| Tool<'extractContent', Schemas.ExtractContentInput>
			| Tool<'checkRobotsTxt', Schemas.CheckRobotsTxtInput>
		>
	>;

	/**
	 * Call an MCP Tool
	 */
	callTool<N extends string, P, R>(
		name: N,
		params: P
	): Effect.Effect<never, Errors.Crawl4AIMCPError, R>;
}

// Service Tag for dependency injection
export const Crawl4AIService = createServiceTag<Crawl4AIService>('Crawl4AIService');

// Create a live implementation of the service
export const makeLiveService = (apiUrl: string): Crawl4AIService => {
	// Define the tools supported by this provider
	const tools: Array<
		| Tool<'extractContent', Schemas.ExtractContentInput>
		| Tool<'checkRobotsTxt', Schemas.CheckRobotsTxtInput>
	> = [
		{
			name: 'extractContent',
			description: 'Extract content from a web page',
			parameters: {} as Schemas.ExtractContentInput // Type assertion to fix the issue
		},
		{
			name: 'checkRobotsTxt',
			description: 'Check if scraping is allowed by robots.txt for a given URL',
			parameters: {} as Schemas.CheckRobotsTxtInput // Type assertion to fix the issue
		}
	];

	const service: Crawl4AIService = {
		extractContent: (params) =>
			pipe(
				// Validate parameters
				validateWithSchema(Schemas.ExtractContentInputSchema, params),

				// Handle validation errors
				Effect.mapError(
					(error) =>
						new Errors.InvalidParametersError('Invalid parameters for extractContent', error)
				),

				// Make request to Python service
				Effect.flatMap((validParams) =>
					effectFetch<unknown>(`${apiUrl}/extract`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(validParams)
					})
				),

				// Map fetch errors to Crawl4AI errors
				Effect.mapError((error) =>
					error instanceof ServiceError
						? new Errors.Crawl4AIServiceError('Failed to call Crawl4AI extract endpoint', error)
						: new Errors.Crawl4AIServiceError('Unknown error during extraction', error)
				),

				// Validate response
				Effect.flatMap((response) =>
					validateWithSchema(
						Schemas.ExtractContentOutputSchema,
						response as Schemas.ExtractContentOutput
					)
				),

				// Map validation errors to Crawl4AI errors
				Effect.mapError((error) =>
					error instanceof Errors.Crawl4AIMCPError
						? error
						: new Errors.ExtractionError('Invalid response from Crawl4AI service', error)
				)
			),

		checkRobotsTxt: (params) =>
			pipe(
				// Validate parameters
				validateWithSchema(Schemas.CheckRobotsTxtInputSchema, params),

				// Handle validation errors
				Effect.mapError(
					(error) =>
						new Errors.InvalidParametersError('Invalid parameters for checkRobotsTxt', error)
				),

				// Make request to Python service
				Effect.flatMap((validParams) => {
					const queryParams = new URLSearchParams({
						url: validParams.url,
						...(validParams.user_agent ? { user_agent: validParams.user_agent } : {})
					});

					return effectFetch<unknown>(`${apiUrl}/robots-check?${queryParams}`, { method: 'GET' });
				}),

				// Map fetch errors to Crawl4AI errors
				Effect.mapError((error) =>
					error instanceof ServiceError
						? new Errors.Crawl4AIServiceError(
								'Failed to call Crawl4AI robots-check endpoint',
								error
							)
						: new Errors.Crawl4AIServiceError('Unknown error during robots.txt check', error)
				),

				// Validate response
				Effect.flatMap((response) =>
					validateWithSchema(
						Schemas.CheckRobotsTxtOutputSchema,
						response as Schemas.CheckRobotsTxtOutput
					)
				),

				// Map validation errors to Crawl4AI errors
				Effect.mapError((error) =>
					error instanceof Errors.Crawl4AIMCPError
						? error
						: new Errors.RobotsTxtError('Invalid response from Crawl4AI service', error)
				)
			),

		// List the available tools
		listTools: () => Effect.succeed(tools),

		// Call a tool by name
		callTool: <N extends string, P, R>(
			name: N,
			params: P
		): Effect.Effect<never, Errors.Crawl4AIMCPError, R> => {
			if (name === 'extractContent') {
				// Type assertion for params
				return service.extractContent(params as Schemas.ExtractContentInput) as Effect.Effect<
					never,
					Errors.Crawl4AIMCPError,
					R
				>;
			}

			if (name === 'checkRobotsTxt') {
				// Type assertion for params
				return service.checkRobotsTxt(params as Schemas.CheckRobotsTxtInput) as Effect.Effect<
					never,
					Errors.Crawl4AIMCPError,
					R
				>;
			}

			return Effect.fail(new Errors.NotFoundError(`Tool ${name} not found`));
		}
	};

	return service;
};

// Create a function that returns the service with a default API URL
export const makeCrawl4AILayer = (apiUrl: string = 'http://localhost:8002') =>
	makeLiveService(apiUrl);

// Default implementation with hardcoded URL
export const Crawl4AIServiceLive = makeCrawl4AILayer();
