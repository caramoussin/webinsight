import { z } from 'zod';
import { db, feeds, collections, profiles } from '$lib/db';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { RSSFeedParser, fetchAndParseRSSFeed } from './rss-parser';

// Validation Schemas
const FeedSchema = z.object({
    url: z.string().url(),
    name: z.string().min(1, "Feed name is required"),
    description: z.string().optional(),
    profileId: z.string().optional(),
    collectionId: z.string().optional(),
    fetchInterval: z.number().min(60).default(3600), // Default 1 hour
    lastFetched: z.string().optional()
});

const CollectionSchema = z.object({
    name: z.string().min(1, "Collection name is required"),
    description: z.string().optional(),
    profileId: z.string()
});

export class FeedService {
    private rssParser: RSSFeedParser;

    constructor() {
        this.rssParser = new RSSFeedParser();
    }

    // Feed Management
    async createFeed(feedData: z.infer<typeof FeedSchema>) {
        const validatedFeed = FeedSchema.parse(feedData);
        
        // Validate profile and collection if provided
        if (validatedFeed.profileId) {
            await this.validateProfile(validatedFeed.profileId);
        }
        
        if (validatedFeed.collectionId) {
            await this.validateCollection(validatedFeed.collectionId);
        }

        const now = new Date().toISOString();
        const newFeed = await db.insert(feeds).values({
            id: crypto.randomUUID(),
            url: validatedFeed.url,
            name: validatedFeed.name,
            description: validatedFeed.description,
            profileId: validatedFeed.profileId,
            collectionId: validatedFeed.collectionId,
            fetchInterval: validatedFeed.fetchInterval,
            createdAt: now,
            updatedAt: now,
            lastFetched: validatedFeed.lastFetched || null
        }).returning();

        return newFeed[0];
    }

    async updateFeed(feedId: string, updateData: Partial<z.infer<typeof FeedSchema>>) {
        const now = new Date().toISOString();
        const updatedFeed = await db.update(feeds)
            .set({
                ...updateData,
                updatedAt: now
            })
            .where(eq(feeds.id, feedId))
            .returning();

        return updatedFeed[0];
    }

    async deleteFeed(feedId: string) {
        await db.delete(feeds)
            .where(eq(feeds.id, feedId));
    }

    // Collection Management
    async createCollection(collectionData: z.infer<typeof CollectionSchema>) {
        const validatedCollection = CollectionSchema.parse(collectionData);
        
        await this.validateProfile(validatedCollection.profileId);

        const now = new Date().toISOString();
        const newCollection = await db.insert(collections).values({
            id: crypto.randomUUID(),
            name: validatedCollection.name,
            description: validatedCollection.description,
            profileId: validatedCollection.profileId,
            createdAt: now,
            updatedAt: now
        }).returning();

        return newCollection[0];
    }

    // Feed Fetching and Processing
    async fetchFeedContent(feedId: string) {
        const feed = await db.query.feeds.findFirst({
            where: eq(feeds.id, feedId)
        });

        if (!feed) {
            throw new Error('Feed not found');
        }

        // Fetch and parse RSS feed
        const feedItems = await fetchAndParseRSSFeed(feed.url);

        // Process each feed item with AI analysis
        const processedItems = await Promise.all(
            feedItems.map(item => this.rssParser.parseAndAnalyzeRSSItem(item))
        );

        // Update feed's last fetched timestamp
        await this.updateFeed(feedId, { 
            lastFetched: new Date().toISOString() 
        });

        return processedItems;
    }

    // Validation Helpers
    private async validateProfile(profileId: string) {
        const profile = await db.query.profiles.findFirst({
            where: eq(profiles.id, profileId)
        });

        if (!profile) {
            throw new Error('Profile not found');
        }
    }

    private async validateCollection(collectionId: string) {
        const collection = await db.query.collections.findFirst({
            where: eq(collections.id, collectionId)
        });

        if (!collection) {
            throw new Error('Collection not found');
        }
    }

    // Scheduled Feed Fetching
    async scheduledFeedFetch() {
        // Find feeds that are due for fetching
        const now = new Date();
        const staleFeeds = await db.query.feeds.findMany({
            where: and(
                // Feeds not fetched in the last interval
                isNull(feeds.lastFetched) || 
                // Or feeds whose last fetch is older than their fetch interval
                sql`
                    (julianday('now') - julianday(${feeds.lastFetched})) * 86400 > ${feeds.fetchInterval}
                `
            )
        });

        // Fetch content for each stale feed
        for (const feed of staleFeeds) {
            try {
                await this.fetchFeedContent(feed.id);
            } catch (error) {
                console.error(`Error fetching feed ${feed.id}:`, error);
            }
        }
    }
}
