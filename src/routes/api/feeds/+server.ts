import { json, error as svelteKitError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { Effect, Layer, Exit, Cause, Option, Schema as S } from 'effect';

import { FeedServiceTag, FeedServiceLive } from '$lib/services/feeds/FeedService';
import { CreateFeed } from '$lib/schemas/feed.schema';
import {
  DatabaseServiceLive,
  DrizzleClientTag,
  type DrizzleClient
} from '$lib/services/db/DatabaseService';
import { type FeedServiceError } from '$lib/services/feeds/feed.errors';

// --- Database Client Placeholder ---
async function getDrizzleClientForProfile(profileId: string): Promise<DrizzleClient> {
  console.warn(`Placeholder: Drizzle client for profile ${profileId} is not actually initialized.`);
  throw new Error('Drizzle client provider not implemented for profile: ' + profileId);
}

const handleEffectError = (err: Cause.Cause<FeedServiceError>) => {
  if (Cause.isDie(err)) {
    console.error('Unhandled defect in API:', Cause.pretty(err));
    return svelteKitError(500, { message: 'Internal server error due to unhandled defect.' });
  }
  const failure = Cause.failureOption(err);
  if (Option.isSome(failure)) {
    const e = failure.value;
    console.error('Feed Service Error:', e);
    return svelteKitError(500, { message: 'A feed service error occurred.' });
  }
  console.error('Unhandled Cause in API:', Cause.pretty(err));
  return svelteKitError(500, { message: 'Internal server error.' });
};

export const POST: RequestHandler = async ({ request }) => {
  // TODO: Get profileId from authenticated session
  const profileId = 'TODO_get_from_session_or_header';
  if (!profileId || profileId === 'TODO_get_from_session_or_header') {
    return svelteKitError(401, { message: 'User profile not identified.' });
  }

  try {
    const requestBody = await request.json();
    const decodedBody = S.decodeUnknownSync(CreateFeed)(requestBody, { errors: 'all' });

    const program = Effect.gen(function* (_) {
      const feedService = yield* _(FeedServiceTag);
      return yield* _(feedService.createFeed({ ...decodedBody, profileId }));
    });

    const drizzleClient = await getDrizzleClientForProfile(profileId);
    const drizzleClientLayer = Layer.succeed(DrizzleClientTag, drizzleClient);
    const dbServiceLayer = Layer.provide(DatabaseServiceLive, drizzleClientLayer);
    const feedServiceLayer = Layer.provide(
      FeedServiceLive,
      Layer.merge(drizzleClientLayer, dbServiceLayer)
    );

    const result = await Effect.runPromiseExit(Effect.provide(program, feedServiceLayer));

    return Exit.match(result, {
      onFailure: (cause) => handleEffectError(cause),
      onSuccess: (newFeed) => json(newFeed, { status: 201 })
    });
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'name' in e && e.name === 'ParseError') {
      return json(
        {
          message: 'Invalid request body',
          error: 'Parse error occurred'
        },
        { status: 400 }
      );
    }
    console.error('POST /api/feeds error:', e);
    return svelteKitError(500, { message: 'Failed to process request.' });
  }
};

export const GET: RequestHandler = async ({ url }) => {
  // TODO: Get profileId from authenticated session
  const profileId = url.searchParams.get('profileId') || 'TODO_get_from_session_or_header';
  if (!profileId || profileId === 'TODO_get_from_session_or_header') {
    return svelteKitError(401, { message: 'User profile not identified.' });
  }

  const program = Effect.gen(function* (_) {
    const feedService = yield* _(FeedServiceTag);
    return yield* _(feedService.getAllFeedsByProfileId(profileId));
  });

  try {
    const drizzleClient = await getDrizzleClientForProfile(profileId);
    const drizzleClientLayer = Layer.succeed(DrizzleClientTag, drizzleClient);
    const dbServiceLayer = Layer.provide(DatabaseServiceLive, drizzleClientLayer);
    const feedServiceLayer = Layer.provide(
      FeedServiceLive,
      Layer.merge(drizzleClientLayer, dbServiceLayer)
    );

    const result = await Effect.runPromiseExit(Effect.provide(program, feedServiceLayer));

    return Exit.match(result, {
      onFailure: (cause) => handleEffectError(cause),
      onSuccess: (feeds) => json(feeds, { status: 200 })
    });
  } catch (e: unknown) {
    console.error('GET /api/feeds error:', e);
    return svelteKitError(500, { message: 'Failed to process request.' });
  }
};
