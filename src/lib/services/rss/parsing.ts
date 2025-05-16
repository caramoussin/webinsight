import { Effect, Context, Layer, Data } from 'effect';
import Parser from 'rss-parser';

// More specific type for items from the 'rss-parser' library
interface ExternalRSSItem {
	title?: string;
	link?: string;
	pubDate?: string;
	isoDate?: string;
	content?: string;
	contentSnippet?: string;
	guid?: string;
	categories?: string[] | { _: string; $: { domain: string } }[];
	creator?: string;
	[key: string]: unknown; // Still allow other fields as the library is quite flexible
}

// Define the types based on the output of rss-parser and needs
// These might be similar to what was in the old rss-parser.ts
export interface RSSFeedItemRaw {
	title: string;
	link: string;
	pubDate?: string;
	content?: string;
	contentSnippet?: string;
	isoDate?: string;
	guid?: string;
	description?: string; // Added as it was in original file
	[key: string]: unknown; // Allow other fields from parser
}

export interface ParsedRSSFeed {
	title: string;
	description?: string;
	link?: string;
	items: RSSFeedItemRaw[];
	[key: string]: unknown; // Allow other fields from parser
}

// --- Error Type ---
export class RSSParsingError extends Data.TaggedError('RSSParsingError')<{
	cause?: unknown;
	message: string;
}> {}

// --- Service Interface (Tag) ---
export interface RSSParsingService {
	readonly fetchAndParse: (url: string) => Effect.Effect<ParsedRSSFeed, RSSParsingError>;
}

export class RSSParsingServiceTag extends Context.Tag('RSSParsingService')<
	RSSParsingServiceTag,
	RSSParsingService
>() {}

// --- Live Implementation (Layer) ---

// TODO: Later, inject an HttpClient service for better testability and effect management
export const RSSParsingServiceLive = Layer.succeed(RSSParsingServiceTag, {
	fetchAndParse: (url: string) =>
		Effect.tryPromise({
			try: async () => {
				const parser = new Parser();
				const feed = await parser.parseURL(url);
				return {
					title: feed.title || '',
					description: feed.description || '',
					link: feed.link || '',
					items: (feed.items || []).map(
						(item: ExternalRSSItem): RSSFeedItemRaw => ({
							title: item.title || '',
							link: item.link || '',
							pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
							content: item.content || '',
							contentSnippet: item.contentSnippet || '',
							isoDate: item.isoDate,
							guid: item.guid,
							description: item.contentSnippet || (item.description as string) || '' // Prefer contentSnippet for description if available
						})
					),
					...(feed.feedUrl && { feedUrl: feed.feedUrl }), // Include other potentially useful top-level fields
					...(feed.image && { image: feed.image })
				};
			},
			catch: (unknownError) =>
				new RSSParsingError({
					message: `Failed to fetch or parse RSS feed from ${url}`,
					cause: unknownError
				})
		})
});
