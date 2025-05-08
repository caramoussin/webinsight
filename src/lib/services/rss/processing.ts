import { Effect, Context, Layer, Data } from 'effect';
import * as Schema from '@effect/schema/Schema';

// Assuming db service and schema types are available and Effect-based
// For now, let's imagine a DBServiceTag and types. These will need to be implemented/imported correctly.
// import { DBServiceTag, FeedItem as DBSavedFeedItem, AIAnalysisLog as DBAILog } from '$lib/services/db';

// --- Placeholder for actual DB Service and Types ---
// These would come from your actual db service module, refactored for Effect
interface DBSavedFeedItem {
  id: string;
  // ... other fields from your feedItems schema
}
interface DBAILog {
  id: string /* ... */;
}
interface DBService {
  insertFeedItem: (data: unknown) => Effect.Effect<DBSavedFeedItem, Error>;
  insertAIAnalysisLog: (data: unknown) => Effect.Effect<DBAILog, Error>;
}
export class DBServiceTag extends Context.Tag('DBService')<DBServiceTag, DBService>() {}

// --- Placeholder for actual AI Service and Types ---
// These would come from your actual AI service module(s)
interface AIAnalysisResult {
  summary: string;
  categories: string[];
  sentiment: string;
  processingTime: number;
}

interface AIService {
  analyzeText: (text: string, title: string) => Effect.Effect<AIAnalysisResult, Error>;
  // Potentially more granular methods: generateSummary, categorize, analyzeSentiment
}

export class AIServiceTag extends Context.Tag('AIService')<AIServiceTag, AIService>() {}

interface AIConfig {
  model: string;
  provider: string;
  apiKey?: string;
}

export class AIConfigTag extends Context.Tag('AIConfig')<AIConfigTag, AIConfig>() {}

// Schema for incoming raw RSS item (subset of RSSParsingService.RSSFeedItemRaw)
// This is what this service expects to process.
const ProcessableFeedItemSchema = Schema.Struct({
  title: Schema.String.pipe(Schema.minLength(1)),
  link: Schema.String.pipe(Schema.pattern(/^https?:\/\//)), // Basic URL pattern, refine if needed
  content: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  pubDate: Schema.optional(Schema.String)
  // Add other fields that might be used for analysis if necessary
});
type ProcessableFeedItem = Schema.Schema.Type<typeof ProcessableFeedItemSchema>;

// --- Error Types ---
// Updated to reflect potential Effect Schema ParseError
export class FeedValidationError extends Data.TaggedError('FeedValidationError')<{
  cause?: unknown;
  message: string;
}> {}
export class AIProcessingError extends Data.TaggedError('AIProcessingError')<{
  cause?: unknown;
  message: string;
}> {}
export class DatabaseError extends Data.TaggedError('DatabaseError')<{
  cause?: unknown;
  message: string;
}> {}

// --- Service Interface (Tag) ---
export interface FeedItemProcessingService {
  readonly processItem: (
    item: unknown // Input is unknown, will be decoded
  ) => Effect.Effect<DBSavedFeedItem, FeedValidationError | AIProcessingError | DatabaseError>;
}
export class FeedItemProcessingServiceTag extends Context.Tag('FeedItemProcessingService')<
  FeedItemProcessingServiceTag,
  FeedItemProcessingService
>() {}

// --- Live Implementation (Layer) ---
export const FeedItemProcessingServiceLive = Layer.effect(
  FeedItemProcessingServiceTag,
  Effect.gen(function* (_) {
    const db = yield* _(DBServiceTag); // Depends on DBService
    const ai = yield* _(AIServiceTag); // Depends on AIService
    const aiConfig = yield* _(AIConfigTag); // Depends on AIConfig for model name etc.

    const decodeItem = Schema.decodeUnknown(ProcessableFeedItemSchema);

    return {
      processItem: (item: unknown) =>
        Effect.gen(function* (_) {
          // 1. Validate Input Item using Effect Schema
          const validatedItem: ProcessableFeedItem = yield* _(
            decodeItem(item).pipe(
              Effect.mapError(
                (parseError) =>
                  new FeedValidationError({
                    message: 'Invalid feed item structure for processing.',
                    cause: parseError
                  })
              )
            )
          );

          // 2. Perform AI Analysis (using the injected AIService)
          const textToAnalyze = validatedItem.content || validatedItem.description || '';
          const aiAnalysis: AIAnalysisResult = yield* _(
            ai
              .analyzeText(textToAnalyze, validatedItem.title)
              .pipe(
                Effect.mapError(
                  (err) => new AIProcessingError({ message: 'AI analysis failed', cause: err })
                )
              )
          );

          // 3. Save to Database (using the injected DBService)
          const now = new Date().toISOString();
          const feedItemToSave = {
            id: crypto.randomUUID(), // Consider an IdService for testability
            title: validatedItem.title,
            link: validatedItem.link,
            description: validatedItem.description,
            content: validatedItem.content,
            pubDate: validatedItem.pubDate,
            aiSummary: aiAnalysis.summary,
            aiCategories: JSON.stringify(aiAnalysis.categories), // Consider structured storage if DB supports
            aiSentiment: aiAnalysis.sentiment,
            createdAt: now,
            analyzedAt: now
          };

          const savedFeedItem = yield* _(
            db
              .insertFeedItem(feedItemToSave)
              .pipe(
                Effect.mapError(
                  (err) => new DatabaseError({ message: 'Failed to save feed item', cause: err })
                )
              )
          );

          const aiLogToSave = {
            id: crypto.randomUUID(),
            feedItemId: savedFeedItem.id,
            analysisType: 'comprehensive', // Or derive from actual analysis done
            modelUsed: aiConfig.model,
            inputTokens: 0, // Placeholder - AIService should return this
            outputTokens: 0, // Placeholder - AIService should return this
            processingTime: aiAnalysis.processingTime,
            createdAt: now
          };

          yield* _(
            db.insertAIAnalysisLog(aiLogToSave).pipe(
              Effect.catchAll((err) =>
                // Log error but don't fail the whole operation if only AI log saving fails
                Effect.logWarning(
                  `Failed to save AI analysis log: ${err instanceof Error ? err.message : String(err)}`
                )
              )
            )
          );

          return savedFeedItem;
        })
    };
  })
);

// To make this layer usable, you would provide the actual live layers for
// DBServiceTag, AIServiceTag, and AIConfigTag:
// const FullFeedItemProcessingLayer = FeedItemProcessingServiceLive.pipe(
//   Layer.provide(DBServiceLive),
//   Layer.provide(AIServiceLive),
//   Layer.provide(AIConfigLive)
// );

// Note: The original RSSFeedParser class and fetchAndParseRSSFeed function
// in src/lib/core/server/rss-parser.ts should be removed or refactored
// once these services are fully implemented and integrated.
