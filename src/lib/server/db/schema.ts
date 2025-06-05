import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Placeholder for potential Profiles table if it exists or will be created
// export const profiles = sqliteTable('profiles', {
//   id: text('id').primaryKey(),
//   // ... other profile fields
// });

// Placeholder for potential Collections table if it exists or will be created
// export const collections = sqliteTable('collections', {
//   id: text('id').primaryKey(),
//   // ... other collection fields
// });

export const feeds = sqliteTable('feeds', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  url: text('url').notNull().unique(),
  profileId: text('profile_id').notNull(), // .references(() => profiles.id, { onDelete: 'cascade' }) // Add if profiles table exists
  collectionId: text('collection_id'), // .references(() => collections.id, { onDelete: 'set null' }) // Add if collections table exists
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => new Date()),
});
