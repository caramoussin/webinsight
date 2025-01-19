CREATE TABLE `ai_analysis_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`feed_item_id` text,
	`analysis_type` text,
	`model_used` text,
	`input_tokens` integer,
	`output_tokens` integer,
	`processing_time` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`feed_item_id`) REFERENCES `feed_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text,
	`name` text NOT NULL,
	`description` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collection_name_idx` ON `collections` (`name`);--> statement-breakpoint
CREATE TABLE `feed_items` (
	`id` text PRIMARY KEY NOT NULL,
	`feed_id` text,
	`title` text NOT NULL,
	`link` text NOT NULL,
	`description` text,
	`content` text,
	`pub_date` text,
	`ai_summary` text,
	`ai_categories` text,
	`ai_sentiment` text,
	`ai_relevance_score` integer,
	`is_read` integer DEFAULT false,
	`is_favorite` integer DEFAULT false,
	`created_at` text NOT NULL,
	`analyzed_at` text,
	FOREIGN KEY (`feed_id`) REFERENCES `feeds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feed_item_link_idx` ON `feed_items` (`link`);--> statement-breakpoint
CREATE TABLE `feeds` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text,
	`collection_id` text,
	`url` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`last_fetched` text,
	`fetch_interval` integer DEFAULT 3600,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feed_url_idx` ON `feeds` (`url`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`is_default` integer DEFAULT false
);
--> statement-breakpoint
CREATE UNIQUE INDEX `name_idx` ON `profiles` (`name`);