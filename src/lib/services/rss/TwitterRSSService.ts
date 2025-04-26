import { z } from 'zod';

// Nitter RSS Feed Configuration Schema
const NitterRSSConfigSchema = z.object({
  username: z.string(),
  nitterInstance: z.string().url().default('https://nitter.poast.org'),
  type: z.enum(['user', 'search', 'hashtag']).default('user')
});

// RSS Item Schema for parsing
const RSSItemSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  description: z.string().optional(),
  pubDate: z.string().optional(),
  guid: z.string().optional()
});

const RSSFeedSchema = z.object({
  raw: z.string(),
  items: z.array(RSSItemSchema)
});

// Known working Nitter instances (as of 2024)
const NITTER_INSTANCES = [
  'https://nitter.poast.org',
  'https://nitter.privacydev.net',
  'https://xcancel.com',
  'https://lightbrd.com',
  'https://nitter.lucabased.xyz',
  'https://nitter.lunar.icu',
  'https://nitter.kavin.rocks',
  'https://nitter.holo-mix.com',
  'https://nitter.moomoo.me',
  'https://nitter.rawbit.ninja'
];

export class TwitterRSSService {
  /**
   * Generate RSS feed URL for a Twitter/X user via Nitter
   * @param username Twitter/X username
   * @param instance Optional Nitter instance
   * @returns RSS feed URL
   */
  static generateRSSUrl(username: string, instance?: string): string {
    const validConfig = NitterRSSConfigSchema.parse({
      username,
      nitterInstance: instance || this.getRandomNitterInstance()
    });

    return `${validConfig.nitterInstance}/${username}/rss`;
  }

  /**
   * Fetch RSS feed from a Nitter instance
   * @param username Twitter/X username
   * @param options Optional configuration
   */
  static async fetchRSSFeed(
    username: string,
    options: {
      nitterInstance?: string;
      timeout?: number;
    } = {}
  ) {
    try {
      // Use the server-side API endpoint to fetch RSS
      const url = new URL('/api/rss', window.location.origin);
      url.searchParams.set('username', username);
      if (options.nitterInstance) {
        url.searchParams.set('instance', options.nitterInstance);
      }

      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(options.timeout || 10000)
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch RSS: ${response.status} ${response.statusText}`);
      }

      const xmlContent = await response.text();
      return this.parseRSSFeed(xmlContent);
    } catch (error) {
      console.error('RSS Fetch Error:', error);
      throw new Error(`Could not retrieve RSS feed for @${username}`);
    }
  }

  /**
   * Randomly select a Nitter instance
   * @returns A Nitter instance URL
   */
  private static getRandomNitterInstance(): string {
    return NITTER_INSTANCES[Math.floor(Math.random() * NITTER_INSTANCES.length)];
  }

  /**
   * Basic RSS feed parsing
   * Note: This is a simple parsing method. For complex RSS feeds,
   * consider using a dedicated XML parsing library
   * @param xmlContent Raw XML content
   */
  private static parseRSSFeed(xmlContent: string) {
    try {
      // Simple regex-based parsing for basic RSS feeds
      const itemRegex = /<item>(.*?)<\/item>/gs;
      const titleRegex = /<title>(.*?)<\/title>/;
      const linkRegex = /<link>(.*?)<\/link>/;
      const descriptionRegex = /<description>(.*?)<\/description>/;
      const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
      const guidRegex = /<guid>(.*?)<\/guid>/;

      const items = [];
      let match;
      while ((match = itemRegex.exec(xmlContent)) !== null) {
        const itemContent = match[1];

        const titleMatch = itemContent.match(titleRegex);
        const linkMatch = itemContent.match(linkRegex);
        const descriptionMatch = itemContent.match(descriptionRegex);
        const pubDateMatch = itemContent.match(pubDateRegex);
        const guidMatch = itemContent.match(guidRegex);

        try {
          const parsedItem = RSSItemSchema.parse({
            title: titleMatch ? titleMatch[1].trim() : 'Untitled',
            link: linkMatch ? linkMatch[1].trim() : '',
            description: descriptionMatch ? descriptionMatch[1].trim() : undefined,
            pubDate: pubDateMatch ? pubDateMatch[1].trim() : undefined,
            guid: guidMatch ? guidMatch[1].trim() : undefined
          });
          items.push(parsedItem);
        } catch (validationError) {
          console.warn('Skipping invalid RSS item:', validationError);
        }
      }

      return RSSFeedSchema.parse({
        raw: xmlContent,
        items
      });
    } catch (error) {
      console.error('RSS Parsing Error:', error);
      throw new Error('Failed to parse RSS feed');
    }
  }

  /**
   * Validate if a Nitter instance is working
   * @param instanceUrl Nitter instance URL
   */
  static async validateNitterInstance(instanceUrl: string): Promise<boolean> {
    try {
      // Using AbortController to implement timeout since fetch doesn't support timeout option
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(instanceUrl, {
          method: 'HEAD',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response.ok;
      } catch (error: unknown) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          // Request timed out
          return false;
        }
        throw error;
      }
    } catch {
      return false;
    }
  }
}

// Example usage
export async function exampleTwitterRSSFetch() {
  try {
    const rssFeed = await TwitterRSSService.fetchRSSFeed('soushi888');
    console.log('RSS Feed Retrieved:', rssFeed);
  } catch (error) {
    console.error('RSS Fetch Failed:', error);
  }
}
