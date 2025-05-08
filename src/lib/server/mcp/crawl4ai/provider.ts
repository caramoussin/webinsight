/**
 * Crawl4AI MCP Provider Adapter
 *
 * This module adapts the Crawl4AI service to the MCPProvider interface
 * required by the MCP Host.
 */

import { Effect as E } from 'effect';
import { ServiceError } from '$lib/utils/effect';

import type { MCPProvider } from '../host';
import { Crawl4AIServiceLive, Crawl4AIServiceTag } from './service';

/**
 * Creates an MCP Provider adapter for the Crawl4AI service
 */

export const createCrawl4AIProvider = (): MCPProvider => {
  return {
    name: 'crawl4ai',

    listTools: () =>
      E.gen(function* () {
        const service = yield* Crawl4AIServiceTag;
        return yield* service.listTools();
      }).pipe(
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
        ),
        E.provide(Crawl4AIServiceLive)
      ),

    callTool: <P, R>(name: string, params: P) =>
      E.gen(function* () {
        const service = yield* Crawl4AIServiceTag;
        return yield* service.callTool<string, P, R>(name, params);
      }).pipe(
        E.mapError((error) =>
          error instanceof ServiceError
            ? error
            : new ServiceError({
                code: 'PROVIDER_ERROR',
                message: `Error calling Crawl4AI tool '${name}'`,
                cause: error
              })
        ),
        E.provide(Crawl4AIServiceLive)
      )
  };
};

/**
 * Default Crawl4AI MCP Provider instance
 */
export const Crawl4AIProvider = createCrawl4AIProvider();
