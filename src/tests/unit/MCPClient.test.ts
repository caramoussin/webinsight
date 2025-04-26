import { describe, beforeEach, vi, expect, type Mock } from 'vitest';
import * as Effect from '@effect/io/Effect';
import { pipe } from '@effect/data/Function';
import { test } from '@effect/vitest';
import { MCPClient, type MCPConnectionConfig } from '../../lib/services/mcp/MCPClient';
import * as EffectUtils from '../../lib/utils/effect';

// Mock effectFetch
vi.mock('../../lib/utils/effect', () => ({
  effectFetch: vi.fn(),
  validateWithSchema: vi.fn((schema, data) => Effect.succeed(data))
}));

// Test configuration
const TEST_CONFIG: MCPConnectionConfig = {
  url: 'http://localhost:11434',
  vendor: 'ollama',
  model: 'llama2',
  timeout: 30000
};

// Mock successful fetch response
const mockSuccessResponse = {
  content: JSON.stringify({
    summary: 'Test summary',
    entities: ['test'],
    sentiment: 'neutral'
  }),
  metadata: {
    model: 'llama2',
    vendor: 'ollama'
  }
};

describe('MCPClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (EffectUtils.effectFetch as Mock).mockImplementation(() => Effect.succeed(mockSuccessResponse));
  });

  describe('executePattern', () => {
    test('should successfully execute a single pattern', () =>
      pipe(
        Effect.gen(function* (_) {
          const result = yield* _(
            MCPClient.executePattern('summarize', 'Test content', TEST_CONFIG)
          );
          expect(result).toEqual(mockSuccessResponse);
          expect(EffectUtils.effectFetch).toHaveBeenCalledTimes(1);
        })
      ));

    test('should handle validation errors for invalid config', () =>
      pipe(
        Effect.gen(function* (_) {
          const invalidConfig = {
            ...TEST_CONFIG,
            url: 'invalid-url'
          };

          const result = yield* _(
            Effect.either(MCPClient.executePattern('summarize', 'Test content', invalidConfig))
          );

          expect(result._tag).toBe('Left');
          if (result._tag === 'Left') {
            expect(result.left.code).toBe('VALIDATION_ERROR');
          }
        })
      ));
  });

  describe('executePatternSequence', () => {
    test('should execute multiple patterns in sequence', () =>
      pipe(
        Effect.gen(function* (_) {
          const patterns = ['summarize', 'extract-entities'];

          const result = yield* _(
            MCPClient.executePatternSequence(patterns, 'Test content', TEST_CONFIG)
          );

          expect(result).toEqual(mockSuccessResponse);
          expect(EffectUtils.effectFetch).toHaveBeenCalledTimes(2);
        })
      ));

    test('should handle empty pattern sequence', () =>
      pipe(
        Effect.gen(function* (_) {
          const result = yield* _(
            Effect.either(MCPClient.executePatternSequence([], 'Test content', TEST_CONFIG))
          );

          expect(result._tag).toBe('Left');
          if (result._tag === 'Left') {
            expect(result.left.code).toBe('SEQUENCE_ERROR');
          }
        })
      ));
  });

  describe('checkServerAvailability', () => {
    test('should return true when server is available', () =>
      pipe(
        Effect.gen(function* (_) {
          (EffectUtils.effectFetch as Mock).mockImplementation(() => Effect.succeed({ ok: true }));

          const result = yield* _(MCPClient.checkServerAvailability(TEST_CONFIG));

          expect(result).toBe(true);
          expect(EffectUtils.effectFetch).toHaveBeenCalledTimes(1);
        })
      ));

    test('should handle server unavailability', () =>
      pipe(
        Effect.gen(function* (_) {
          (EffectUtils.effectFetch as Mock).mockImplementation(() =>
            Effect.fail(
              new EffectUtils.ServiceError(
                'AVAILABILITY_CHECK_ERROR',
                'Failed to check server availability'
              )
            )
          );

          const result = yield* _(Effect.either(MCPClient.checkServerAvailability(TEST_CONFIG)));

          expect(result._tag).toBe('Left');
          if (result._tag === 'Left') {
            expect(result.left.code).toBe('AVAILABILITY_CHECK_ERROR');
          }
          expect(EffectUtils.effectFetch).toHaveBeenCalledTimes(1);
        })
      ));
  });
});
