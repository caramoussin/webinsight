import { Effect as E, Layer, pipe, Context } from 'effect';
import { ServiceError, validateWithSchema, effectFetch } from '../../../utils/effect';

import * as Schemas from './schemas';
import * as Errors from './errors';
import type { Crawl4AIMCPError } from './errors';

/**
 * Crawl4AI MCP Provider Service
 *
 * This service provides an MCP interface to the Crawl4AI Python service,
 * exposing web content extraction capabilities as standardized MCP Tools.
 */

// --- Core Types ---

/**
 * Type definitions for MCP tools
 */
type Tool<N extends string, P> = {
  name: N;
  description: string;
  parameters: P;
};

// --- Service Definition ---

/**
 * Interface defining the Crawl4AI service API.
 */
export interface Crawl4AIService {
  /**
   * Extract content from a web page
   * @param params The extraction parameters
   * @returns An Effect containing the extracted content or an error
   */
  extractContent(
    params: Schemas.ExtractContentInput
  ): E.Effect<Schemas.ExtractContentOutput, Errors.Crawl4AIMCPError>;

  /**
   * Check if scraping is allowed by robots.txt for a given URL
   * @param params The robots.txt check parameters
   * @returns An Effect containing the robots.txt check result or an error
   */
  checkRobotsTxt(
    params: Schemas.CheckRobotsTxtInput
  ): E.Effect<Schemas.CheckRobotsTxtOutput, Errors.Crawl4AIMCPError>;

  /**
   * List available MCP Tools
   * @returns An Effect containing the list of available tools or an error
   */
  listTools(): E.Effect<
    Array<
      | Tool<'extractContent', Schemas.ExtractContentInput>
      | Tool<'checkRobotsTxt', Schemas.CheckRobotsTxtInput>
    >,
    Errors.Crawl4AIMCPError
  >;

  /**
   * Call an MCP Tool by name
   * @param name The name of the tool to call
   * @param params The parameters for the tool
   * @returns An Effect containing the result of the tool call or an error
   */
  callTool<N extends string, P, R>(name: N, params: P): E.Effect<R, Errors.Crawl4AIMCPError>;
}

// --- Service Tag ---

/**
 * Context Tag for the Crawl4AI service
 */
export class Crawl4AIServiceTag extends Context.Tag('Crawl4AIService')<
  Crawl4AIServiceTag,
  Crawl4AIService
>() {}

// --- Live Layer Implementation ---

/**
 * Creates a live implementation of the Crawl4AI service
 * @param apiUrl The URL of the Crawl4AI Python service
 * @returns A Layer providing the Crawl4AI service
 */
export const createCrawl4AILiveLayer = (
  apiUrl: string
): Layer.Layer<Crawl4AIServiceTag, Crawl4AIMCPError> =>
  Layer.succeed(
    Crawl4AIServiceTag,
    E.sync(() => {
      // Define the tools supported by this provider
      const tools: Array<
        | Tool<'extractContent', Schemas.ExtractContentInput>
        | Tool<'checkRobotsTxt', Schemas.CheckRobotsTxtInput>
      > = [
        {
          name: 'extractContent',
          description: 'Extract content from a web page',
          parameters: {} as Schemas.ExtractContentInput
        },
        {
          name: 'checkRobotsTxt',
          description: 'Check if scraping is allowed by robots.txt for a given URL',
          parameters: {} as Schemas.CheckRobotsTxtInput
        }
      ];

      // Implementation of the extractContent method
      const extractContent = (
        params: Schemas.ExtractContentInput
      ): E.Effect<Schemas.ExtractContentOutput, Errors.Crawl4AIMCPError> =>
        pipe(
          // Validate parameters
          validateWithSchema(Schemas.ExtractContentInputSchema, params),

          // Handle validation errors
          E.mapError(
            (error) =>
              new Errors.InvalidParametersError('Invalid parameters for extractContent', error)
          ),

          // Make request to Python service
          E.flatMap((validParams) =>
            effectFetch<unknown>(`${apiUrl}/extract`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(validParams)
            })
          ),

          // Map fetch errors to Crawl4AI errors
          E.mapError((error) =>
            error instanceof ServiceError
              ? new Errors.Crawl4AIServiceError('Failed to call Crawl4AI extract endpoint', error)
              : new Errors.Crawl4AIServiceError('Unknown error during extraction', error)
          ),

          // Validate response
          E.flatMap((response) =>
            validateWithSchema(
              Schemas.ExtractContentOutputSchema,
              response as Schemas.ExtractContentOutput
            )
          ),

          // Map validation errors to Crawl4AI errors
          E.mapError((error) =>
            error instanceof Errors.Crawl4AIMCPError
              ? error
              : new Errors.ExtractionError('Invalid response from Crawl4AI service', error)
          )
        );

      // Implementation of the checkRobotsTxt method
      const checkRobotsTxt = (
        params: Schemas.CheckRobotsTxtInput
      ): E.Effect<Schemas.CheckRobotsTxtOutput, Errors.Crawl4AIMCPError> =>
        pipe(
          // Validate parameters
          validateWithSchema(Schemas.CheckRobotsTxtInputSchema, params),

          // Handle validation errors
          E.mapError(
            (error) =>
              new Errors.InvalidParametersError('Invalid parameters for checkRobotsTxt', error)
          ),

          // Make request to Python service
          E.flatMap((validParams) => {
            const queryParams = new URLSearchParams({
              url: validParams.url,
              ...(validParams.user_agent ? { user_agent: validParams.user_agent } : {})
            });

            return effectFetch<unknown>(`${apiUrl}/robots-check?${queryParams}`, {
              method: 'GET'
            });
          }),

          // Map fetch errors to Crawl4AI errors
          E.mapError((error) =>
            error instanceof ServiceError
              ? new Errors.Crawl4AIServiceError(
                  'Failed to call Crawl4AI robots-check endpoint',
                  error
                )
              : new Errors.Crawl4AIServiceError('Unknown error during robots.txt check', error)
          ),

          // Validate response
          E.flatMap((response) =>
            validateWithSchema(
              Schemas.CheckRobotsTxtOutputSchema,
              response as Schemas.CheckRobotsTxtOutput
            )
          ),

          // Map validation errors to Crawl4AI errors
          E.mapError((error) =>
            error instanceof Errors.Crawl4AIMCPError
              ? error
              : new Errors.RobotsTxtError('Invalid response from Crawl4AI service', error)
          )
        );

      // Implementation of the listTools method
      const listTools = (): E.Effect<
        Array<
          | Tool<'extractContent', Schemas.ExtractContentInput>
          | Tool<'checkRobotsTxt', Schemas.CheckRobotsTxtInput>
        >,
        Errors.Crawl4AIMCPError
      > => E.succeed(tools);

      // Implementation of the callTool method
      const callTool = <N extends string, P, R>(
        name: N,
        params: P
      ): E.Effect<R, Errors.Crawl4AIMCPError> => {
        if (name === 'extractContent') {
          // Type assertion for params
          return extractContent(params as Schemas.ExtractContentInput) as E.Effect<
            R,
            Errors.Crawl4AIMCPError
          >;
        } else if (name === 'checkRobotsTxt') {
          // Type assertion for params
          return checkRobotsTxt(params as Schemas.CheckRobotsTxtInput) as E.Effect<
            R,
            Errors.Crawl4AIMCPError
          >;
        } else {
          return E.fail(new Errors.NotFoundError(`Tool ${name} not found`));
        }
      };

      // Return the service implementation
      return Crawl4AIServiceTag.of({
        extractContent,
        checkRobotsTxt,
        listTools,
        callTool
      });
    }).pipe(E.runSync)
  );

/**
 * Creates a Crawl4AI service layer with the specified API URL
 * @param apiUrl The URL of the Crawl4AI Python service (defaults to localhost:8002)
 * @returns A Layer providing the Crawl4AI service
 */
export const makeCrawl4AILayer = (apiUrl: string = 'http://localhost:8002') =>
  createCrawl4AILiveLayer(apiUrl);

/**
 * Default implementation of the Crawl4AI service with the default API URL
 */
export const Crawl4AIServiceLive = makeCrawl4AILayer();
