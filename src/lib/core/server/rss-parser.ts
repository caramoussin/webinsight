// RSS Feed Item Schema - Potentially move to a shared types location or parsing service
/*
const RSSItemSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  description: z.string().optional(),
  content: z.string().optional(),
  pubDate: z.string().optional()
});
*/

// AI Analysis Configuration - This logic moves to AI services or their config
/*
const AI_PROVIDERS = {
  OPENAI: 'OPENAI',
  ANTHROPIC: 'ANTHROPIC',
  GROQ: 'GROQ'
} as const;

interface AIAnalysisOptions {
  provider?: keyof typeof AI_PROVIDERS;
  apiKey?: string;
  model?: string;
}
*/

// These type interfaces might be useful for the new services or a shared types file.
// For now, they can remain if they don't cause issues, or be moved/refined.
export interface RSSFeedItem { 
  title: string;
  link: string;
  description?: string;
  content?: string;
  pubDate?: string;
}

export interface ParsedRSSFeed { 
  title: string;
  description?: string;
  link?: string;
  items: RSSFeedItem[];
}
