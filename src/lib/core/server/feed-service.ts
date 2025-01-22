import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, feeds, collections, feedItems } from '$lib/services/db';
import { generateId } from '$lib/utils/utils';
import { fetchAndParseRSSFeed } from './rss-parser';
import type { RSSFeedItem } from './rss-parser';

const FeedSchema = z.object({
	url: z.string().url(),
	name: z.string().min(1, 'Feed name is required'),
	description: z.string().optional(),
	collectionId: z.string().optional(),
	fetchInterval: z.number().optional().default(3600)
});

const CollectionSchema = z.object({
	name: z.string().min(1, 'Collection name is required'),
	description: z.string().optional(),
	parentId: z.string().optional()
});

export class FeedService {
	// Feed Management
	async createFeed(feedData: z.infer<typeof FeedSchema>) {
		const validatedFeed = FeedSchema.parse(feedData);

		// Validate collection if provided
		if (validatedFeed.collectionId) {
			await this.validateCollection(validatedFeed.collectionId);
		}

		const newFeed = await db
			.insert(feeds)
			.values({
				id: generateId(),
				url: validatedFeed.url,
				name: validatedFeed.name,
				description: validatedFeed.description || null,
				collectionId: validatedFeed.collectionId || null,
				fetchInterval: validatedFeed.fetchInterval,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				lastFetched: null
			})
			.returning();

		return newFeed[0] ?? null;
	}

	// Collection Management
	async createCollection(collectionData: z.infer<typeof CollectionSchema>) {
		const validatedCollection = CollectionSchema.parse(collectionData);

		const newCollection = await db
			.insert(collections)
			.values({
				id: generateId(),
				name: validatedCollection.name,
				description: validatedCollection.description || null,
				parentId: validatedCollection.parentId || null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			})
			.returning();

		return newCollection[0] ?? null;
	}

	// Update Feed
	async updateFeed(
		feedId: string,
		updateData: Partial<{
			name: string;
			url: string;
			description: string;
			collectionId: string;
			fetchInterval: number;
			lastFetched: string;
		}>
	) {
		const result = await db
			.update(feeds)
			.set({
				...updateData,
				updatedAt: new Date().toISOString()
			})
			.where(eq(feeds.id, feedId))
			.returning();

		return result[0] ?? null;
	}

	// Delete Feed
	async deleteFeed(feedId: string) {
		await db.delete(feeds).where(eq(feeds.id, feedId));
	}

	// Validation Methods
	private async validateCollection(collectionId: string) {
		const collection = await db.query.collections.findFirst({
			where: eq(collections.id, collectionId)
		});

		if (!collection) {
			throw new Error('Collection not found');
		}
	}

	// Feed Retrieval
	async getAllFeeds() {
		return await db.query.feeds.findMany({
			with: {
				collection: true
			}
		});
	}

	async getFeedsByCollection(collectionId: string) {
		return await db.query.feeds.findMany({
			where: eq(feeds.collectionId, collectionId)
		});
	}

	// RSS Feed Processing
	async processFeed(feedId: string) {
		const feed = await db.query.feeds.findFirst({
			where: eq(feeds.id, feedId)
		});

		if (!feed) {
			throw new Error('Feed not found');
		}

		const parsedFeed = await fetchAndParseRSSFeed(feed.url);
		const processedItems = await this.insertFeedItems(feed.id, parsedFeed.items);

		await this.updateFeed(feedId, {
			lastFetched: new Date().toISOString()
		});

		return processedItems;
	}

	private async insertFeedItems(feedId: string, items: RSSFeedItem[]) {
		const processedItems = await Promise.all(
			items.map(async (item) => {
				const insertedItem = await db
					.insert(feedItems)
					.values({
						id: generateId(),
						feedId: feedId,
						title: item.title,
						link: item.link,
						description: item.description,
						content: item.content,
						pubDate: item.pubDate,
						createdAt: new Date().toISOString()
					})
					.returning();

				return insertedItem[0];
			})
		);

		return processedItems;
	}

	// Scheduled Feed Fetch for Background Job
	async scheduledFeedFetch() {
		const allFeeds = await this.getAllFeeds();

		for (const feed of allFeeds) {
			try {
				await this.processFeed(feed.id);
			} catch (error) {
				console.error(`Error processing feed ${feed.id}:`, error);
			}
		}
	}
}
