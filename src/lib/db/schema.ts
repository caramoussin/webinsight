import { 
    sqliteTable, 
    text, 
    integer, 
    uniqueIndex,
    primaryKey 
} from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Profiles Table
export const profiles = sqliteTable('profiles', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    isDefault: integer('is_default', { mode: 'boolean' }).default(false)
}, (table) => ({
    nameIdx: uniqueIndex('name_idx').on(table.name)
}));

// Collections Table
export const collections = sqliteTable('collections', {
    id: text('id').primaryKey(),
    profileId: text('profile_id').references(() => profiles.id),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull()
}, (table) => ({
    nameIdx: uniqueIndex('collection_name_idx').on(table.name)
}));

// Feeds Table
export const feeds = sqliteTable('feeds', {
    id: text('id').primaryKey(),
    profileId: text('profile_id').references(() => profiles.id),
    collectionId: text('collection_id').references(() => collections.id),
    url: text('url').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    lastFetched: text('last_fetched'),
    fetchInterval: integer('fetch_interval').default(3600), // Default 1 hour
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull()
}, (table) => ({
    urlIdx: uniqueIndex('feed_url_idx').on(table.url)
}));

// Enhance Feed Items Table with AI-specific fields
export const feedItems = sqliteTable('feed_items', {
    id: text('id').primaryKey(),
    feedId: text('feed_id').references(() => feeds.id),
    title: text('title').notNull(),
    link: text('link').notNull(),
    description: text('description'),
    content: text('content'),
    pubDate: text('pub_date'),
    
    // AI-Powered Analysis Fields
    aiSummary: text('ai_summary'),
    aiCategories: text('ai_categories'),
    aiSentiment: text('ai_sentiment'), // positive, negative, neutral
    aiRelevanceScore: integer('ai_relevance_score'), // 0-100 scale
    
    // Metadata and User Interaction
    isRead: integer('is_read', { mode: 'boolean' }).default(false),
    isFavorite: integer('is_favorite', { mode: 'boolean' }).default(false),
    
    // Tracking and Timestamps
    createdAt: text('created_at').notNull(),
    analyzedAt: text('analyzed_at')
}, (table) => ({
    linkIdx: uniqueIndex('feed_item_link_idx').on(table.link)
}));

// Add a new table for AI Analysis Logs
export const aiAnalysisLogs = sqliteTable('ai_analysis_logs', {
    id: text('id').primaryKey(),
    feedItemId: text('feed_item_id').references(() => feedItems.id),
    analysisType: text('analysis_type'), // summary, categorization, sentiment
    modelUsed: text('model_used'),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    processingTime: integer('processing_time'), // in milliseconds
    createdAt: text('created_at').notNull()
});

// Relationships
export const profilesRelations = relations(profiles, ({ many }) => ({
    collections: many(collections),
    feeds: many(feeds)
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
    profile: one(profiles, {
        fields: [collections.profileId],
        references: [profiles.id]
    }),
    feeds: many(feeds)
}));

export const feedsRelations = relations(feeds, ({ one, many }) => ({
    profile: one(profiles, {
        fields: [feeds.profileId],
        references: [profiles.id]
    }),
    collection: one(collections, {
        fields: [feeds.collectionId],
        references: [collections.id]
    }),
    items: many(feedItems)
}));

export const feedItemsRelations = relations(feedItems, ({ one }) => ({
    feed: one(feeds, {
        fields: [feedItems.feedId],
        references: [feeds.id]
    })
}));

export const aiAnalysisLogsRelations = relations(aiAnalysisLogs, ({ one }) => ({
    feedItem: one(feedItems, {
        fields: [aiAnalysisLogs.feedItemId],
        references: [feedItems.id]
    })
}));
