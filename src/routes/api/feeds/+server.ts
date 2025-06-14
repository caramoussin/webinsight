import { json, error as svelteKitError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

// Mock data storage for our API
const mockFeeds = [
  {
    id: '1',
    name: 'Tech News',
    url: 'https://example.com/tech-feed.xml',
    profileId: 'demo-profile-id',
    collectionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Science Updates',
    url: 'https://example.com/science-feed.xml',
    profileId: 'demo-profile-id',
    collectionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Programming Blog',
    url: 'https://example.com/programming-feed.xml',
    profileId: 'demo-profile-id',
    collectionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const POST: RequestHandler = async ({ request }) => {
  // TODO: Get profileId from authenticated session
  const profileId = 'demo-profile-id'; // Using a default profile ID for testing
  
  try {
    const requestBody = await request.json();
    console.log('POST /api/feeds: Creating new feed with data:', requestBody);
    
    // For development/testing, return mock data instead of using the database
    // Create a new mock feed with the provided data
    const newFeed = {
      id: crypto.randomUUID(), // Generate a random UUID for the feed ID
      name: requestBody.name,
      url: requestBody.url,
      profileId: profileId,
      collectionId: requestBody.collectionId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Created mock feed:', newFeed);
    return json(newFeed, { status: 201 });
    
    /* Original implementation using Effect and database
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
    */
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

  try {
    // For development/testing, return mock data instead of using the database
    // This bypasses the need for a working database connection
    console.log(`GET /api/feeds: Returning mock data for profile ${profileId}`);
    
    // Filter feeds by profileId (for multi-profile support)
    const profileFeeds = mockFeeds.filter(feed => feed.profileId === profileId);
    
    return json(profileFeeds, { status: 200 });
    
    /* Original implementation using Effect and database
    const program = Effect.gen(function* (_) {
      const feedService = yield* _(FeedServiceTag);
      return yield* _(feedService.getAllFeedsByProfileId(profileId));
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
      onSuccess: (feeds) => json(feeds, { status: 200 })
    });
    */
  } catch (e: unknown) {
    console.error('GET /api/feeds error:', e);
    return svelteKitError(500, { message: 'Failed to process request.' });
  }
};
