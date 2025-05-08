import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Effect as E, Either, Layer } from 'effect';
import * as Schema from '@effect/schema/Schema';
import {
  FeedItemProcessingServiceTag,
  FeedItemProcessingServiceLive,
  FeedValidationError,
  AIProcessingError,
  DatabaseError,
  DBServiceTag,
  AIServiceTag,
  AIConfigTag,
  type FeedItemProcessingService
} from '$lib/services/rss/processing';

// --- Mock Types (if not directly importable for tests) ---
type DBSavedFeedItem = { id: string; title: string; [key: string]: unknown }; // Use unknown instead of any
type AIAnalysisResult = {
  summary: string;
  categories: string[];
  sentiment: string;
  processingTime: number;
};
type AIConfig = { model: string; provider: string; apiKey?: string };

// --- Mocks for Dependencies ---

const mockDBService = {
  insertFeedItem: vi.fn(),
  insertAIAnalysisLog: vi.fn()
};

const mockAIService = {
  analyzeText: vi.fn()
};

const mockAIConfig: AIConfig = {
  model: 'test-model',
  provider: 'test-provider'
};

// Create live layers for mocks
const DBServiceMockLive = Layer.succeed(DBServiceTag, mockDBService);
const AIServiceMockLive = Layer.succeed(AIServiceTag, mockAIService);
const AIConfigMockLive = Layer.succeed(AIConfigTag, mockAIConfig);

// Provide the mock layers to the FeedItemProcessingServiceLive layer
const testLayer = FeedItemProcessingServiceLive.pipe(
  Layer.provide(DBServiceMockLive),
  Layer.provide(AIServiceMockLive),
  Layer.provide(AIConfigMockLive)
);

// Get the service directly instead of an Effect that provides layers
const getFeedItemProcessingServiceEffect = E.provide(
  FeedItemProcessingServiceTag, // Use lowercase service, not Service
  testLayer
);

describe('FeedItemProcessingService', () => {
  let service: FeedItemProcessingService;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Get the actual service instance before each test
    service = await E.runPromise(getFeedItemProcessingServiceEffect);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const validRawItem = {
    title: 'Valid Title',
    link: 'https://example.com/valid',
    content: 'This is valid content.',
    description: 'A valid description.',
    pubDate: new Date().toISOString()
  };

  const mockAiAnalysis: AIAnalysisResult = {
    summary: 'Test summary',
    categories: ['test', 'ai'],
    sentiment: 'positive',
    processingTime: 100
  };

  const mockSavedFeedItem: DBSavedFeedItem = {
    id: 'test-id-123',
    title: 'Valid Title'
    // ... other fields that would be saved
  };

  describe('processItem', () => {
    it('should successfully process a valid item', async () => {
      mockAIService.analyzeText.mockReturnValue(E.succeed(mockAiAnalysis));
      mockDBService.insertFeedItem.mockReturnValue(E.succeed(mockSavedFeedItem));
      mockDBService.insertAIAnalysisLog.mockReturnValue(E.succeed({ id: 'log-id' }));

      const result = await E.runPromise(service.processItem(validRawItem));

      expect(result).toEqual(mockSavedFeedItem);
      expect(
        E.isEffect(Schema.decodeUnknown(Schema.Struct({ title: Schema.String }))(validRawItem))
      ).toBe(true);
      expect(mockAIService.analyzeText).toHaveBeenCalledWith(
        validRawItem.content,
        validRawItem.title
      );
      expect(mockDBService.insertFeedItem).toHaveBeenCalledWith(
        expect.objectContaining({
          title: validRawItem.title,
          link: validRawItem.link,
          aiSummary: mockAiAnalysis.summary
        })
      );
      expect(mockDBService.insertAIAnalysisLog).toHaveBeenCalledWith(
        expect.objectContaining({
          feedItemId: mockSavedFeedItem.id,
          modelUsed: mockAIConfig.model
        })
      );
    });

    it('should return FeedValidationError for invalid item structure (missing title)', async () => {
      const invalidItem = { ...validRawItem, title: undefined };

      const result = await E.runPromise(E.either(service.processItem(invalidItem)));
      expect(Either.isLeft(result)).toBe(true);

      if (Either.isLeft(result)) {
        const error = result.left;
        expect(error).toBeInstanceOf(FeedValidationError);
        expect(error.message).toContain('Invalid feed item structure');
      }
    });

    it('should return FeedValidationError for invalid item structure (invalid link)', async () => {
      const invalidItem = { ...validRawItem, link: 'not-a-url' };

      const result = await E.runPromise(E.either(service.processItem(invalidItem)));
      expect(Either.isLeft(result)).toBe(true);

      if (Either.isLeft(result)) {
        const error = result.left;
        expect(error).toBeInstanceOf(FeedValidationError);
        expect(error.message).toContain('Invalid feed item structure');
      }
    });

    it('should return AIProcessingError if AI analysis fails', async () => {
      const aiError = new Error('AI service exploded');
      mockAIService.analyzeText.mockReturnValue(E.fail(aiError));

      const result = await E.runPromise(E.either(service.processItem(validRawItem)));
      expect(Either.isLeft(result)).toBe(true);

      if (Either.isLeft(result)) {
        const error = result.left;
        expect(error).toBeInstanceOf(AIProcessingError);
        expect(error.message).toBe('AI analysis failed');
        expect(error.cause).toBe(aiError);
      }
    });

    it('should return DatabaseError if saving feed item fails', async () => {
      const dbError = new Error('DB connection lost');
      mockAIService.analyzeText.mockReturnValue(E.succeed(mockAiAnalysis));
      mockDBService.insertFeedItem.mockReturnValue(E.fail(dbError));

      const result = await E.runPromise(E.either(service.processItem(validRawItem)));
      expect(Either.isLeft(result)).toBe(true);

      if (Either.isLeft(result)) {
        const error = result.left;
        expect(error).toBeInstanceOf(DatabaseError);
        expect(error.message).toBe('Failed to save feed item');
        expect(error.cause).toBe(dbError);
      }
    });

    it('should still save feed item if AI log saving fails (logs warning)', async () => {
      const logError = new Error('AI Log DB hiccup');
      mockAIService.analyzeText.mockReturnValue(E.succeed(mockAiAnalysis));
      mockDBService.insertFeedItem.mockReturnValue(E.succeed(mockSavedFeedItem));
      mockDBService.insertAIAnalysisLog.mockReturnValue(E.fail(logError));

      const result = await E.runPromise(service.processItem(validRawItem));

      expect(result).toEqual(mockSavedFeedItem);
      expect(mockDBService.insertFeedItem).toHaveBeenCalledTimes(1);
      expect(mockDBService.insertAIAnalysisLog).toHaveBeenCalledTimes(1);
    });

    it('should use description if content is missing for AI analysis', async () => {
      const itemWithoutContent = { ...validRawItem, content: undefined };
      mockAIService.analyzeText.mockReturnValue(E.succeed(mockAiAnalysis));
      mockDBService.insertFeedItem.mockReturnValue(E.succeed(mockSavedFeedItem));
      mockDBService.insertAIAnalysisLog.mockReturnValue(E.succeed({ id: 'log-id' }));

      await E.runPromise(service.processItem(itemWithoutContent));

      expect(mockAIService.analyzeText).toHaveBeenCalledWith(
        validRawItem.description, // Fallback to description
        validRawItem.title
      );
    });

    it('should use empty string if both content and description are missing for AI analysis', async () => {
      const itemWithoutContentOrDescription = {
        ...validRawItem,
        content: undefined,
        description: undefined
      };
      mockAIService.analyzeText.mockReturnValue(E.succeed(mockAiAnalysis));
      mockDBService.insertFeedItem.mockReturnValue(E.succeed(mockSavedFeedItem));
      mockDBService.insertAIAnalysisLog.mockReturnValue(E.succeed({ id: 'log-id' }));

      await E.runPromise(service.processItem(itemWithoutContentOrDescription));

      expect(mockAIService.analyzeText).toHaveBeenCalledWith(
        '', // Fallback to empty string
        validRawItem.title
      );
    });
  });
});
