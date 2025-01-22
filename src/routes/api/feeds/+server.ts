import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { FeedService } from '$lib/core/server/feed-service';
import { z } from 'zod';

const feedService = new FeedService();

// Type guard for ZodError
function isZodError(error: unknown): error is z.ZodError {
	return error instanceof z.ZodError;
}

// Create a new feed
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const newFeed = await feedService.createFeed(data);
		return json(newFeed, { status: 201 });
	} catch (error) {
		if (isZodError(error)) {
			return json(
				{
					error: 'Validation failed',
					details: error.errors
				},
				{ status: 400 }
			);
		}
		console.error('Feed creation error:', error);
		return json({ error: 'Failed to create feed' }, { status: 500 });
	}
};

// Get feeds (optional filtering)
export const GET: RequestHandler = async ({ url }) => {
	try {
		// Optional query parameters for filtering
		const profileId = url.searchParams.get('profileId');
		const collectionId = url.searchParams.get('collectionId');

		// In a real implementation, add filtering logic
		// For now, this is a placeholder
		return json({ message: 'Feed listing not implemented' }, { status: 200 });
	} catch (error) {
		console.error('Feed listing error:', error);
		return json({ error: 'Failed to list feeds' }, { status: 500 });
	}
};

// Update a specific feed
export const PUT: RequestHandler = async ({ request, url }) => {
	try {
		const feedId = url.searchParams.get('id');
		if (!feedId) {
			return json({ error: 'Feed ID is required' }, { status: 400 });
		}

		const data = await request.json();
		const updatedFeed = await feedService.updateFeed(feedId, data);
		return json(updatedFeed, { status: 200 });
	} catch (error) {
		if (isZodError(error)) {
			return json(
				{
					error: 'Validation failed',
					details: error.errors
				},
				{ status: 400 }
			);
		}
		console.error('Feed update error:', error);
		return json({ error: 'Failed to update feed' }, { status: 500 });
	}
};

// Delete a specific feed
export const DELETE: RequestHandler = async ({ url }) => {
	try {
		const feedId = url.searchParams.get('id');
		if (!feedId) {
			return json({ error: 'Feed ID is required' }, { status: 400 });
		}

		await feedService.deleteFeed(feedId);
		return json({ message: 'Feed deleted successfully' }, { status: 200 });
	} catch (error) {
		console.error('Feed deletion error:', error);
		return json({ error: 'Failed to delete feed' }, { status: 500 });
	}
};
