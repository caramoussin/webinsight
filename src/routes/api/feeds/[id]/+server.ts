import { json, error as svelteKitError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { Effect, Layer, Exit, Cause, Option, Schema as S } from 'effect';

import { FeedServiceTag, FeedServiceLive } from '$lib/services/feeds/FeedService';
import { UpdateFeed } from '$lib/schemas/feed.schema';
import {
	DatabaseServiceLive,
	DrizzleClientTag,
	type DrizzleClient
} from '$lib/services/db/DatabaseService';
import {
	FeedNotFoundError,
	FeedUpdateError,
	FeedDeletionError,
	type FeedServiceError
} from '$lib/services/feeds/feed.errors';

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
		if (e instanceof FeedNotFoundError) {
			return json({ message: e.message }, { status: 404 });
		}
		if (e instanceof FeedUpdateError) {
			return json({ message: e.message, feedId: e.feedId }, { status: 400 });
		}
		if (e instanceof FeedDeletionError) {
			return json({ message: e.message, feedId: e.feedId }, { status: 400 });
		}
		console.error('Feed Service Error:', e);
		return svelteKitError(500, { message: 'A feed service error occurred.' });
	}
	console.error('Unhandled Cause in API:', Cause.pretty(err));
	return svelteKitError(500, { message: 'Internal server error.' });
};

export const GET: RequestHandler = async ({ params, url }) => {
	const feedId = params.id!;
	const profileId = url.searchParams.get('profileId') || 'TODO_get_from_session_or_header';

	if (!profileId || profileId === 'TODO_get_from_session_or_header') {
		return svelteKitError(401, { message: 'User profile not identified.' });
	}

	const program = Effect.gen(function* (_) {
		const feedService = yield* _(FeedServiceTag);
		const feedOption = yield* _(feedService.getFeedById(feedId, profileId));

		if (Option.isNone(feedOption)) {
			return yield* _(
				Effect.fail(
					new FeedNotFoundError({
						message: `Feed with id ${feedId} not found`,
						feedId
					})
				)
			);
		}

		return feedOption.value;
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
			onSuccess: (feed) => json(feed, { status: 200 })
		});
	} catch (e: unknown) {
		console.error('GET /api/feeds/[id] error:', e);
		return svelteKitError(500, { message: 'Failed to process request.' });
	}
};

export const PUT: RequestHandler = async ({ params, request, url }) => {
	const feedId = params.id!;
	const profileId = url.searchParams.get('profileId') || 'TODO_get_from_session_or_header';

	if (!profileId || profileId === 'TODO_get_from_session_or_header') {
		return svelteKitError(401, { message: 'User profile not identified.' });
	}

	try {
		const requestBody = await request.json();
		const decodedBody = S.decodeUnknownSync(UpdateFeed)(requestBody, { errors: 'all' });

		const program = Effect.gen(function* (_) {
			const feedService = yield* _(FeedServiceTag);
			return yield* _(feedService.updateFeed(feedId, profileId, decodedBody));
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
			onSuccess: (updatedFeed) => json(updatedFeed, { status: 200 })
		});
	} catch (e: unknown) {
		// Handle Effect Schema parse errors
		if (e && typeof e === 'object' && 'name' in e && e.name === 'ParseError') {
			return json(
				{
					message: 'Invalid request body',
					error: 'Parse error occurred'
				},
				{ status: 400 }
			);
		}
		console.error('PUT /api/feeds/[id] error:', e);
		return svelteKitError(500, { message: 'Failed to process request.' });
	}
};

export const DELETE: RequestHandler = async ({ params, url }) => {
	const feedId = params.id!;
	const profileId = url.searchParams.get('profileId') || 'TODO_get_from_session_or_header';

	if (!profileId || profileId === 'TODO_get_from_session_or_header') {
		return svelteKitError(401, { message: 'User profile not identified.' });
	}

	const program = Effect.gen(function* (_) {
		const feedService = yield* _(FeedServiceTag);
		return yield* _(feedService.deleteFeed(feedId, profileId));
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
			onSuccess: () => json({ message: 'Feed deleted successfully' }, { status: 200 })
		});
	} catch (e: unknown) {
		console.error('DELETE /api/feeds/[id] error:', e);
		return svelteKitError(500, { message: 'Failed to process request.' });
	}
};
