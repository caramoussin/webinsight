import { Data } from 'effect';

/**
 * Represents a generic error that can occur during database operations.
 */
export class DatabaseError extends Data.TaggedError('DatabaseError')<{
  readonly message: string;
  readonly cause?: unknown; // To store the original error if it's being wrapped
  readonly operation?: string; // Optional: to specify which DB operation failed (e.g., 'query', 'transaction', 'connection')
  readonly query?: string; // Optional: to store the SQL query that failed, if applicable (be mindful of sensitive data)
}> {}
