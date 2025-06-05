import { Data } from 'effect';
import type { DatabaseError } from '../db/db.errors';

/**
 * Base error for feed creation operations.
 */
export class FeedCreationError extends Data.TaggedError('FeedCreationError')<{
  readonly message: string;
  readonly input?: unknown; // The input data that caused the error
  readonly cause?: DatabaseError | unknown;
}> {}

/**
 * Error for when a feed is not found.
 */
export class FeedNotFoundError extends Data.TaggedError('FeedNotFoundError')<{
  readonly message: string;
  readonly feedId?: string;
  readonly cause?: DatabaseError | unknown;
}> {}

/**
 * Base error for feed update operations.
 */
export class FeedUpdateError extends Data.TaggedError('FeedUpdateError')<{
  readonly message: string;
  readonly feedId?: string;
  readonly input?: unknown; // The input data that caused the error
  readonly cause?: DatabaseError | unknown;
}> {}

/**
 * Base error for feed deletion operations.
 */
export class FeedDeletionError extends Data.TaggedError('FeedDeletionError')<{
  readonly message: string;
  readonly feedId?: string;
  readonly cause?: DatabaseError | unknown;
}> {}

/**
 * Error for when feed data validation fails (e.g., invalid URL format).
 * This might be used if schema validation isn't sufficient or for business rule validation.
 */
export class FeedValidationError extends Data.TaggedError('FeedValidationError')<{
  readonly message: string;
  readonly errors?: Record<string, string[]> | string; // Field-specific validation errors or a general message
  readonly input?: unknown;
  readonly cause?: unknown;
}> {}

/**
 * A union type for all possible errors originating from the FeedService.
 * This is useful for the error channel of Effects returned by the service.
 */
export type FeedServiceError =
  | FeedCreationError
  | FeedNotFoundError
  | FeedUpdateError
  | FeedDeletionError
  | FeedValidationError
  | DatabaseError; // Including DatabaseError if FeedService directly surfaces it or wraps it.
