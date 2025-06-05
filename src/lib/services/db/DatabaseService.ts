import { Effect, Context, Layer } from 'effect';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { BatchItem } from 'drizzle-orm/batch';
import { type SQL, sql } from 'drizzle-orm'; // Imported sql
import { DatabaseError } from './db.errors';

// Define a union type for the Drizzle client, as it can vary based on the driver
// For WebInsight, it's likely BetterSQLite3Database for the server-side/Bun environment.
export type DrizzleClient = BetterSQLite3Database<Record<string, unknown>>;

/**
 * Tag for the Drizzle ORM client instance.
 * This will be a dependency for the DatabaseServiceLive layer.
 * The actual instance will be provided elsewhere (e.g., during app setup or per-profile context).
 */
export class DrizzleClientTag extends Context.Tag('DrizzleClientTag')<
  DrizzleClientTag,
  DrizzleClient
>() {}

/**
 * Defines the contract for database operations.
 */
export interface DatabaseService {
  /**
   * Executes a raw SQL query and returns the first row.
   * Useful for single row queries like SELECT with LIMIT 1, or INSERT/UPDATE/DELETE RETURNING a single row.
   */
  readonly run: <T = unknown>(query: SQL) => Effect.Effect<T, DatabaseError, DrizzleClientTag>;

  /**
   * Executes a raw SQL query and returns all rows.
   * Useful for SELECT queries returning multiple rows.
   */
  readonly all: <T = unknown>(query: SQL) => Effect.Effect<T[], DatabaseError, DrizzleClientTag>;

  /**
   * Executes a series of Drizzle batch items in a transaction.
   * Note: Drizzle's batch API with BetterSQLite3 might not run in a single transaction by default.
   * True transactional behavior might require using the transaction method below.
   */
  readonly batch: <T extends BatchItem<'sqlite'>[] | readonly BatchItem<'sqlite'>[]>(
    queries: T
  ) => Effect.Effect<unknown[], DatabaseError, DrizzleClientTag>;

  /**
   * Executes an Effect within a database transaction.
   * The provided Effect will have access to the Drizzle client via the DrizzleClientTag in its context.
   */
  readonly transaction: <A, E, R>(
    effect: Effect.Effect<A, E, R>
  ) => Effect.Effect<A, E | DatabaseError, R | DrizzleClientTag>;
}

/**
 * Context Tag for the DatabaseService.
 */
export class DatabaseServiceTag extends Context.Tag('DatabaseService')<
  DatabaseServiceTag,
  DatabaseService
>() {}

/**
 * Live implementation of the DatabaseService.
 */
export const DatabaseServiceLive = Layer.effect(
  DatabaseServiceTag,
  Effect.gen(function* (_) {
    // Get the drizzle client from the context
    const drizzle = yield* _(DrizzleClientTag);

    const run = <T = unknown>(query: SQL): Effect.Effect<T, DatabaseError, never> =>
      Effect.tryPromise({
        try: () => Promise.resolve(drizzle.get(query)) as Promise<T>,
        catch: (error) =>
          new DatabaseError({
            message: 'Failed to run query',
            cause: error,
            operation: 'run',
            query: String(query)
          })
      });

    const all = <T = unknown>(query: SQL): Effect.Effect<T[], DatabaseError, never> =>
      Effect.tryPromise({
        try: () => Promise.resolve(drizzle.all(query)) as Promise<T[]>,
        catch: (error) =>
          new DatabaseError({
            message: 'Failed to run all query',
            cause: error,
            operation: 'all',
            query: String(query)
          })
      });

    // For batch operations, we need to use a transaction since DrizzleClient doesn't have a direct batch method
    const batch = <T extends BatchItem<'sqlite'>[] | readonly BatchItem<'sqlite'>[]>(
      queries: T
    ): Effect.Effect<unknown[], DatabaseError, never> =>
      Effect.tryPromise({
        try: async () => {
          // Execute each query in sequence and collect results
          drizzle.run(sql`BEGIN`);
          try {
            const results = [];
            for (const query of queries) {
              // @ts-expect-error - Handling different query types in batch
              const result = query.type === 'select' ? drizzle.all(query) : drizzle.run(query);
              results.push(result);
            }
            drizzle.run(sql`COMMIT`);
            return results;
          } catch (e) {
            drizzle.run(sql`ROLLBACK`);
            throw e;
          }
        },
        catch: (error) =>
          new DatabaseError({
            message: 'Failed to execute batch',
            cause: error,
            operation: 'batch'
          })
      });

    const transaction = <A, E, R>(
      effectToRun: Effect.Effect<A, E, R>
    ): Effect.Effect<A, E | DatabaseError, R> =>
      Effect.acquireUseRelease(
        Effect.sync(() => drizzle.run(sql`BEGIN`)).pipe(Effect.orDie),
        () => effectToRun,
        (_, exit) =>
          Effect.sync(() => {
            if (exit._tag === 'Failure') {
              drizzle.run(sql`ROLLBACK`);
            } else {
              drizzle.run(sql`COMMIT`);
            }
          }).pipe(Effect.orDie)
      ).pipe(
        Effect.catchAll((error) => {
          // Ensure we wrap errors from the transaction logic itself if they are not already DatabaseError
          if (error instanceof DatabaseError) return Effect.fail(error);
          // This case should ideally not be hit if effectToRun correctly types its errors.
          // If it's a known error from 'E', it will be preserved.
          // If it's an unknown defect, it might be caught here.
          return Effect.fail(
            new DatabaseError({
              message: 'Transaction failed with an unexpected error',
              cause: error,
              operation: 'transaction'
            })
          );
        })
      );

    return { run, all, batch, transaction } as DatabaseService;
  })
);
