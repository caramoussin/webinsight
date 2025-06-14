import { json, error as svelteKitError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

// Import just what we need for the mock implementation
import { UpdateFeed } from '$lib/schemas/feed.schema';
import { Schema as S } from 'effect';

// Define the feed type to ensure type safety
type MockFeed = {
  id: string;
  name: string;
  url: string;
  profileId: string;
  collectionId: string | null;
  createdAt: string;
  updatedAt: string;
};

// Mock data storage for our API - shared with the main feeds endpoint
const mockFeeds: MockFeed[] = [
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

export const GET: RequestHandler = async ({ params, url }) => {
  const feedId = params.id!;
  const profileId = url.searchParams.get('profileId') || 'demo-profile-id';

  console.log(`GET /api/feeds/${feedId}: Looking up feed with profileId ${profileId}`);
  
  try {
    // Find the feed in our mock data
    const feed = mockFeeds.find(f => f.id === feedId && f.profileId === profileId);
    
    if (!feed) {
      console.log(`Feed with id ${feedId} not found for profile ${profileId}`);
      return json({ message: `Feed with id ${feedId} not found` }, { status: 404 });
    }
    
    return json(feed, { status: 200 });
  } catch (e: unknown) {
    console.error('GET /api/feeds/[id] error:', e);
    return svelteKitError(500, { message: 'Failed to process request.' });
  }
};

export const PUT: RequestHandler = async ({ params, request, url }) => {
  const feedId = params.id!;
  const profileId = url.searchParams.get('profileId') || 'demo-profile-id';

  console.log(`PUT /api/feeds/${feedId}: Updating feed with profileId ${profileId}`);
  
  try {
    const requestBody = await request.json();
    console.log('Update data:', requestBody);
    
    try {
      // Validate the request body using the UpdateFeed schema
      const decodedBody = S.decodeUnknownSync(UpdateFeed)(requestBody, { errors: 'all' });
      
      // Find the feed index in our mock data
      const feedIndex = mockFeeds.findIndex(f => f.id === feedId && f.profileId === profileId);
      
      if (feedIndex === -1) {
        console.log(`Feed with id ${feedId} not found for profile ${profileId}`);
        return json({ message: `Feed with id ${feedId} not found` }, { status: 404 });
      }
      
      // Update the feed with the new data
      const updatedFeed: MockFeed = {
        ...mockFeeds[feedIndex],
        ...decodedBody,
        // Ensure type compatibility
        collectionId: decodedBody.collectionId ?? mockFeeds[feedIndex].collectionId,
        updatedAt: new Date().toISOString()
      };
      
      // Replace the old feed with the updated one
      mockFeeds[feedIndex] = updatedFeed;
      
      console.log('Feed updated successfully:', updatedFeed);
      return json(updatedFeed, { status: 200 });
    } catch (error) {
      // Handle schema validation errors
      console.error('Schema validation error:', error);
      return json(
        {
          message: 'Invalid request body',
          error: 'Parse error occurred'
        },
        { status: 400 }
      );
    }
  } catch (e: unknown) {
    console.error('PUT /api/feeds/[id] error:', e);
    return svelteKitError(500, { message: 'Failed to process request.' });
  }
};

export const DELETE: RequestHandler = async ({ params, url }) => {
  const feedId = params.id!;
  const profileId = url.searchParams.get('profileId') || 'demo-profile-id';

  console.log(`DELETE /api/feeds/${feedId}: Deleting feed with profileId ${profileId}`);
  
  try {
    // Find the feed index in our mock data
    const feedIndex = mockFeeds.findIndex(f => f.id === feedId && f.profileId === profileId);
    
    if (feedIndex === -1) {
      console.log(`Feed with id ${feedId} not found for profile ${profileId}`);
      return json({ message: `Feed with id ${feedId} not found` }, { status: 404 });
    }
    
    // Remove the feed from our mock data
    mockFeeds.splice(feedIndex, 1);
    
    console.log(`Feed with id ${feedId} deleted successfully`);
    return json({ message: 'Feed deleted successfully' }, { status: 200 });
  } catch (e: unknown) {
    console.error('DELETE /api/feeds/[id] error:', e);
    return svelteKitError(500, { message: 'Failed to process request.' });
  }
};
