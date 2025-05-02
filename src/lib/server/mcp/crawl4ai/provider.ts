/**
 * Crawl4AI MCP Provider Adapter
 *
 * This module adapts the Crawl4AI service to the MCPProvider interface
 * required by the MCP Host.
 */

import { Effect as E, pipe } from 'effect';
import { ServiceError } from '$lib/utils/effect';

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
        E.map((tools) =>
          tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
            provider: 'crawl4ai'
          }))
        ),
        E.mapError((error) =>
          error instanceof ServiceError
            ? error
            : new ServiceError({
                code: 'PROVIDER_ERROR',
                message: 'Error listing Crawl4AI tools',
                cause: error
              })
        )
      ),

    callTool: <P, R>(name: string, params: P) =>
      pipe(
        service.callTool<string, P, R>(name, params),
        E.mapError((error) =>
          error instanceof ServiceError
            ? error
            : new ServiceError({
                code: 'PROVIDER_ERROR',
                message: `Error calling Crawl4AI tool '${name}'`,
                cause: error
              })
        )
      )
  };
};

/**
 * Default Crawl4AI MCP Provider instance
 */
export const Crawl4AIProvider = createCrawl4AIProvider();
