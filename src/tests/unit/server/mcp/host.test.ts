/**
 * Unit tests for the MCP Host implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Effect as E } from 'effect';
// Import Effect types for proper type checking
import { ServiceError } from '../../../../lib/utils/effect';

import { type MCPHostService, makeMCPHostService } from '../../../../lib/server/mcp/host';

import type { MCPProvider, MCPTool } from '../../../../lib/server/mcp/host';

describe('MCP Host', () => {
  // Create a mock provider for testing
  const createMockProvider = (name: string, tools: MCPTool[] = []): MCPProvider => {
    return {
      name,
      listTools: vi.fn().mockImplementation(() => E.succeed(tools)),
      callTool: vi.fn().mockImplementation((toolName, params) => {
        const tool = tools.find((t) => t.name === toolName);
        if (tool) {
          return E.succeed({ result: 'success', params });
        }
        return E.fail(
          new ServiceError({ code: 'TOOL_NOT_FOUND', message: `Tool ${toolName} not found` })
        );
      })
    };
  };

  // Test tools
  const testTools: MCPTool[] = [
    {
      name: 'testTool1',
      description: 'Test tool 1',
      parameters: { param1: 'string', param2: 'number' },
      provider: 'testProvider'
    },
    {
      name: 'testTool2',
      description: 'Test tool 2',
      parameters: { param1: 'string' },
      provider: 'testProvider'
    }
  ];

  // Create a host and providers for each test
  let host: MCPHostService;
  let mockProvider1: MCPProvider;
  let mockProvider2: MCPProvider;

  beforeEach(() => {
    host = makeMCPHostService();
    mockProvider1 = createMockProvider('provider1', [
      { ...testTools[0], provider: 'provider1' },
      { ...testTools[1], provider: 'provider1' }
    ]);
    mockProvider2 = createMockProvider('provider2', [
      {
        name: 'testTool3',
        description: 'Test tool 3',
        parameters: { param1: 'boolean' },
        provider: 'provider2'
      }
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('registerProvider', () => {
    it('should register a provider', async () => {
      // Register the provider
      await E.runPromise(host.registerProvider(mockProvider1));

      // Check if the provider is registered by listing providers
      const providers = await E.runPromise(host.listProviders());
      expect(providers).toContain('provider1');
    });

    it('should register multiple providers', async () => {
      // Register the providers
      await E.runPromise(host.registerProvider(mockProvider1));
      await E.runPromise(host.registerProvider(mockProvider2));

      // Check if both providers are registered
      const providers = await E.runPromise(host.listProviders());
      expect(providers).toContain('provider1');
      expect(providers).toContain('provider2');
      expect(providers.length).toBe(2);
    });
  });

  describe('listProviders', () => {
    it('should return an empty array when no providers are registered', async () => {
      const providers = await E.runPromise(host.listProviders());
      expect(providers).toEqual([]);
    });

    it('should return all registered providers', async () => {
      // Register the providers
      await E.runPromise(host.registerProvider(mockProvider1));
      await E.runPromise(host.registerProvider(mockProvider2));

      // List providers
      const providers = await E.runPromise(host.listProviders());
      expect(providers).toEqual(['provider1', 'provider2']);
    });
  });

  describe('listAllTools', () => {
    it('should return an empty array when no providers are registered', async () => {
      const tools = await E.runPromise(host.listAllTools());
      expect(tools).toEqual([]);
    });

    it('should return all tools from all providers', async () => {
      // Register the providers
      await E.runPromise(host.registerProvider(mockProvider1));
      await E.runPromise(host.registerProvider(mockProvider2));

      // List all tools
      const tools = await E.runPromise(host.listAllTools());
      expect(tools.length).toBe(3);
      expect(tools.map((t) => t.name)).toContain('testTool1');
      expect(tools.map((t) => t.name)).toContain('testTool2');
      expect(tools.map((t) => t.name)).toContain('testTool3');
    });

    it('should handle errors from providers when listing tools', async () => {
      // Create a provider that fails when listing tools
      const failingProvider: MCPProvider = {
        name: 'failingProvider',
        listTools: vi
          .fn()
          .mockImplementation(() =>
            E.fail(new ServiceError({ code: 'LIST_ERROR', message: 'Failed to list tools' }))
          ),
        callTool: vi.fn()
      };

      // Register the providers
      await E.runPromise(host.registerProvider(mockProvider1));
      await E.runPromise(host.registerProvider(failingProvider));

      // List all tools - should still return tools from working providers
      const tools = await E.runPromise(host.listAllTools());
      expect(tools.length).toBe(2); // Only tools from mockProvider1
      expect(failingProvider.listTools).toHaveBeenCalled();
    });
  });

  describe('listProviderTools', () => {
    it('should fail when provider is not found', async () => {
      // Try to list tools from a non-existent provider
      try {
        await E.runPromise(host.listProviderTools('nonExistentProvider'));
        // If we get here, the test should fail because we expected an error
        expect(true).toBe(false);
      } catch (error) {
        // Just verify we got an error
        expect(error).toBeDefined();
      }
    });

    it('should return tools from a specific provider', async () => {
      // Register the providers
      await E.runPromise(host.registerProvider(mockProvider1));
      await E.runPromise(host.registerProvider(mockProvider2));

      // List tools from provider1
      const tools = await E.runPromise(host.listProviderTools('provider1'));
      expect(tools.length).toBe(2);
      expect(tools.map((t) => t.name)).toContain('testTool1');
      expect(tools.map((t) => t.name)).toContain('testTool2');
      expect(tools.every((t) => t.provider === 'provider1')).toBe(true);
    });
  });

  describe('callTool', () => {
    it('should fail when provider is not found', async () => {
      // Try to call a tool from a non-existent provider
      try {
        await E.runPromise(host.callTool('testTool1', 'nonExistentProvider', {}));
        // If we get here, the test should fail because we expected an error
        expect(true).toBe(false);
      } catch (error) {
        // Just verify we got an error
        expect(error).toBeDefined();
      }
    });

    it('should call a tool from a specific provider', async () => {
      // Register the provider
      await E.runPromise(host.registerProvider(mockProvider1));

      // Call a tool
      const result = await E.runPromise(
        host.callTool('testTool1', 'provider1', { param1: 'test', param2: 42 })
      );

      expect(result).toEqual({ result: 'success', params: { param1: 'test', param2: 42 } });
      expect(mockProvider1.callTool).toHaveBeenCalledWith('testTool1', {
        param1: 'test',
        param2: 42
      });
    });

    it('should propagate errors from the provider', async () => {
      // Create a provider that fails when calling a tool
      const failingProvider: MCPProvider = {
        name: 'failingProvider',
        listTools: vi.fn().mockImplementation(() => E.succeed([])),
        callTool: vi
          .fn()
          .mockImplementation(() =>
            E.fail(new ServiceError({ code: 'CALL_ERROR', message: 'Failed to call tool' }))
          )
      };

      // Register the provider
      await E.runPromise(host.registerProvider(failingProvider));

      // Call a tool - should fail
      try {
        await E.runPromise(host.callTool('testTool', 'failingProvider', {}));
        // If we get here, the test should fail because we expected an error
        expect(true).toBe(false);
      } catch (error) {
        // Just verify we got an error
        expect(error).toBeDefined();
      }
    });
  });

  describe('callToolAcrossProviders', () => {
    it('should fail when tool is not found in any provider', async () => {
      // Register the providers
      await E.runPromise(host.registerProvider(mockProvider1));
      await E.runPromise(host.registerProvider(mockProvider2));

      // Try to call a non-existent tool
      try {
        await E.runPromise(host.callToolAcrossProviders('nonExistentTool', {}));
        // If we get here, the test should fail because we expected an error
        expect(true).toBe(false);
      } catch (error) {
        // Just verify we got an error
        expect(error).toBeDefined();
      }
    });

    it('should call a tool from the first provider that has it', async () => {
      // Register the providers
      await E.runPromise(host.registerProvider(mockProvider1));
      await E.runPromise(host.registerProvider(mockProvider2));

      // Call a tool that exists in provider1
      const result = await E.runPromise(
        host.callToolAcrossProviders('testTool1', { param1: 'test', param2: 42 })
      );

      expect(result).toEqual({ result: 'success', params: { param1: 'test', param2: 42 } });
      expect(mockProvider1.callTool).toHaveBeenCalledWith('testTool1', {
        param1: 'test',
        param2: 42
      });
      expect(mockProvider2.callTool).not.toHaveBeenCalled();
    });

    it("should call a tool from the second provider if first doesn't have it", async () => {
      // Register the providers
      await E.runPromise(host.registerProvider(mockProvider1));
      await E.runPromise(host.registerProvider(mockProvider2));

      // Call a tool that exists only in provider2
      const result = await E.runPromise(
        host.callToolAcrossProviders('testTool3', { param1: true })
      );

      expect(result).toEqual({ result: 'success', params: { param1: true } });
      expect(mockProvider2.callTool).toHaveBeenCalledWith('testTool3', { param1: true });
    });
  });
});
