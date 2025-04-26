/**
 * MCP (Model Context Protocol) Host
 *
 * This module provides a central registry for MCP providers and routes
 * tool calls to the appropriate provider. It serves as the main entry point
 * for accessing MCP capabilities throughout the application.
 */

import * as Effect from '@effect/io/Effect';
import { pipe } from '@effect/data/Function';
import { ServiceError, createServiceTag } from '../../utils/effect';

// Generic tool type that all providers must implement
export type MCPTool = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  provider: string;
};

// Error types for the MCP host
export class MCPHostError extends ServiceError {
  constructor(message: string, cause?: unknown) {
    super('MCP_HOST_ERROR', message, cause);
  }
}

export class ProviderNotFoundError extends MCPHostError {
  constructor(providerName: string) {
    super(`Provider '${providerName}' not found`);
  }
}

export class ToolNotFoundError extends MCPHostError {
  constructor(toolName: string, providerName?: string) {
    const message = providerName
      ? `Tool '${toolName}' not found in provider '${providerName}'`
      : `Tool '${toolName}' not found in any provider`;
    super(message);
  }
}

// Provider interface that all MCP providers must implement
export interface MCPProvider {
  // Unique name for this provider
  readonly name: string;

  // List all tools offered by this provider
  listTools(): Effect.Effect<never, ServiceError, Array<MCPTool>>;

  // Call a specific tool by name with parameters
  callTool<P, R>(name: string, params: P): Effect.Effect<never, ServiceError, R>;
}

// MCP Host service interface
export interface MCPHostService {
  // Register a new provider with the host
  registerProvider(provider: MCPProvider): Effect.Effect<never, MCPHostError, void>;

  // List all registered providers
  listProviders(): Effect.Effect<never, MCPHostError, Array<string>>;

  // List all tools from all providers
  listAllTools(): Effect.Effect<never, MCPHostError, Array<MCPTool>>;

  // List tools from a specific provider
  listProviderTools(providerName: string): Effect.Effect<never, MCPHostError, Array<MCPTool>>;

  // Call a tool by name and provider
  callTool<P = unknown, R = unknown>(
    toolName: string,
    providerName: string,
    params: P
  ): Effect.Effect<never, MCPHostError | ServiceError, R>;

  // Call a tool by name (will search across all providers)
  callToolAcrossProviders<P = unknown, R = unknown>(
    toolName: string,
    params: P
  ): Effect.Effect<never, MCPHostError | ServiceError, R>;
}

// Service tag for dependency injection
export const MCPHostService = createServiceTag<MCPHostService>('MCPHostService');

// Implementation of the MCP Host service
export const makeMCPHostService = (): MCPHostService => {
  // Registry of providers
  const providers = new Map<string, MCPProvider>();

  return {
    // Register a provider with the host
    registerProvider: (provider) =>
      Effect.sync(() => {
        providers.set(provider.name, provider);
      }),

    // List all registered providers
    listProviders: () => Effect.sync(() => Array.from(providers.keys())),

    // List all tools from all providers
    listAllTools: () =>
      pipe(
        Effect.sync(() => Array.from(providers.values())),
        Effect.flatMap((providerList) =>
          Effect.allSuccesses(
            providerList.map((provider) =>
              pipe(
                provider.listTools(),
                Effect.map((tools) =>
                  tools.map((tool) => ({
                    ...tool,
                    provider: provider.name
                  }))
                ),
                Effect.catchAll((error) =>
                  Effect.logError(
                    `Error listing tools from provider ${provider.name}: ${error}`
                  ).pipe(Effect.as([]))
                )
              )
            )
          )
        ),
        Effect.map((toolArrays) => toolArrays.flat())
      ),

    // List tools from a specific provider
    listProviderTools: (providerName) =>
      pipe(
        Effect.sync(() => providers.get(providerName)),
        Effect.flatMap((provider) =>
          provider
            ? pipe(
                provider.listTools(),
                Effect.map((tools) =>
                  tools.map((tool) => ({
                    ...tool,
                    provider: providerName
                  }))
                ),
                Effect.mapError(
                  (error) =>
                    new MCPHostError(`Error listing tools from provider ${providerName}`, error)
                )
              )
            : Effect.fail(new ProviderNotFoundError(providerName))
        )
      ),

    // Call a tool by name and provider
    callTool: <P = unknown, R = unknown>(toolName: string, providerName: string, params: P) =>
      pipe(
        Effect.sync(() => providers.get(providerName)),
        Effect.flatMap((provider) =>
          provider
            ? provider.callTool<P, R>(toolName, params)
            : Effect.fail(new ProviderNotFoundError(providerName))
        ),
        Effect.mapError((error) =>
          error instanceof MCPHostError
            ? error
            : new MCPHostError(
                `Error calling tool '${toolName}' from provider '${providerName}'`,
                error
              )
        )
      ),

    // Call a tool by name across all providers
    callToolAcrossProviders: <P = unknown, R = unknown>(toolName: string, params: P) =>
      pipe(
        Effect.sync(() => Array.from(providers.entries())),
        Effect.flatMap((providerEntries) => {
          // Find providers that have this tool
          return pipe(
            Effect.allSuccesses(
              providerEntries.map(([providerName, provider]) =>
                pipe(
                  provider.listTools(),
                  Effect.map((tools) => ({
                    providerName,
                    provider,
                    hasTool: tools.some((tool) => tool.name === toolName)
                  })),
                  Effect.catchAll((error) =>
                    Effect.logError(
                      `Error checking if provider ${providerName} has tool ${toolName}: ${error}`
                    ).pipe(Effect.as({ providerName, provider, hasTool: false }))
                  )
                )
              )
            ),
            Effect.flatMap((results) => {
              const matchingProviders = results.filter((result) => result.hasTool);

              if (matchingProviders.length === 0) {
                return Effect.fail(new ToolNotFoundError(toolName));
              }

              // Use the first matching provider
              const { providerName, provider } = matchingProviders[0];

              return pipe(
                provider.callTool<P, R>(toolName, params),
                Effect.mapError(
                  (error) =>
                    new MCPHostError(
                      `Error calling tool '${toolName}' from provider '${providerName}'`,
                      error
                    )
                )
              );
            })
          );
        })
      )
  };
};

// Create a live implementation of the service
export const MCPHostServiceLive = makeMCPHostService();
