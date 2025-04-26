/**
 * Crawl4AI MCP Provider Adapter
 *
 * This module adapts the Crawl4AI service to the MCPProvider interface
 * required by the MCP Host.
 */

import * as Effect from '@effect/io/Effect';
import { pipe } from '@effect/data/Function';
import { ServiceError } from '../../../utils/effect';

import type { MCPProvider } from '../host';
import * as Service from './service';

/**
 * Creates an MCP Provider adapter for the Crawl4AI service
 */
export const createCrawl4AIProvider = (
  service: Service.Crawl4AIService = Service.Crawl4AIServiceLive
): MCPProvider => {
  return {
    name: 'crawl4ai',

    listTools: () =>
      pipe(
        service.listTools(),
        Effect.map((tools) =>
          tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
            provider: 'crawl4ai'
          }))
        ),
        Effect.mapError((error) =>
          error instanceof ServiceError
            ? error
            : new ServiceError('PROVIDER_ERROR', 'Error listing Crawl4AI tools', error)
        )
      ),

    callTool: <P, R>(name: string, params: P) =>
      pipe(
        service.callTool<string, P, R>(name, params),
        Effect.mapError((error) =>
          error instanceof ServiceError
            ? error
            : new ServiceError('PROVIDER_ERROR', `Error calling Crawl4AI tool '${name}'`, error)
        )
      )
  };
};

/**
 * Default Crawl4AI MCP Provider instance
 */
export const Crawl4AIProvider = createCrawl4AIProvider();
