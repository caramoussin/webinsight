import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { Effect as E, Either } from 'effect';
import {
  RSSParsingServiceTag,
  RSSParsingServiceLive,
  RSSParsingError,
  type ParsedRSSFeed,
  type RSSParsingService
} from '$lib/services/rss/parsing';
import Parser from 'rss-parser';

// Mock the rss-parser library
vi.mock('rss-parser', () => {
  const MockParser = vi.fn();
  MockParser.prototype.parseURL = vi.fn();
  return { default: MockParser };
});

const mockParserInstance = new Parser();

describe('RSSParsingService', () => {
  // Prepare a variable to hold the service instance
  let service: RSSParsingService;

  // Before each test, set up the service and clear mocks
  beforeEach(async () => {
    vi.clearAllMocks();

    // Get the service instance using the Effect API
    service = (await E.runPromise(
      E.provide(RSSParsingServiceTag, RSSParsingServiceLive)
    )) as RSSParsingService;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAndParse', () => {
    const testUrl = 'https://example.com/feed.xml';

    it('should successfully parse a valid RSS feed', async () => {
      const mockFeedData = {
        title: 'Test Feed',
        description: 'A test feed description',
        link: 'https://example.com',
        items: [
          {
            title: 'Item 1',
            link: 'https://example.com/item1',
            pubDate: new Date('2024-01-01T12:00:00Z').toISOString(),
            isoDate: new Date('2024-01-01T12:00:00Z').toISOString(),
            content: '<p>Content 1</p>',
            contentSnippet: 'Content 1 snippet',
            guid: 'item1-guid'
          },
          {
            title: 'Item 2',
            link: 'https://example.com/item2',
            // Missing pubDate, should default
            content: 'Content 2',
            // Missing contentSnippet
            guid: 'item2-guid'
          }
        ]
      };
      (mockParserInstance.parseURL as Mock).mockResolvedValue(mockFeedData);

      const result: ParsedRSSFeed = await E.runPromise(service.fetchAndParse(testUrl));

      expect(mockParserInstance.parseURL).toHaveBeenCalledWith(testUrl);
      expect(result.title).toBe('Test Feed');
      expect(result.description).toBe('A test feed description');
      expect(result.link).toBe('https://example.com');
      expect(result.items).toHaveLength(2);

      expect(result.items[0]).toEqual(
        expect.objectContaining({
          title: 'Item 1',
          link: 'https://example.com/item1',
          pubDate: new Date('2024-01-01T12:00:00Z').toISOString(),
          isoDate: new Date('2024-01-01T12:00:00Z').toISOString(),
          content: '<p>Content 1</p>',
          contentSnippet: 'Content 1 snippet',
          guid: 'item1-guid',
          description: 'Content 1 snippet'
        })
      );

      // Check item with missing fields uses defaults
      expect(result.items[1]).toEqual(
        expect.objectContaining({
          title: 'Item 2',
          link: 'https://example.com/item2',
          pubDate: expect.any(String), // Defaulted to current date
          content: 'Content 2',
          contentSnippet: '', // Defaulted to empty string
          guid: 'item2-guid',
          description: '' // Defaulted
        })
      );
    });

    it('should handle parser errors gracefully', async () => {
      const parserError = new Error('Failed to parse XML');
      (mockParserInstance.parseURL as Mock).mockRejectedValue(parserError);

      const result = await E.runPromise(E.either(service.fetchAndParse(testUrl)));
      expect(Either.isLeft(result)).toBe(true);

      if (Either.isLeft(result)) {
        const error = result.left;
        expect(error).toBeInstanceOf(RSSParsingError);
        expect(error.message).toBe(`Failed to fetch or parse RSS feed from ${testUrl}`);
        expect(error.cause).toBe(parserError);
      }
    });

    it('should handle feeds with missing top-level fields', async () => {
      const mockFeedData = {
        // title: 'Test Feed', // Missing title
        items: [
          {
            title: 'Item 1',
            link: 'https://example.com/item1'
          }
        ]
      };
      (mockParserInstance.parseURL as Mock).mockResolvedValue(mockFeedData);

      const result: ParsedRSSFeed = await E.runPromise(service.fetchAndParse(testUrl));

      expect(result.title).toBe(''); // Defaulted
      expect(result.description).toBe(''); // Defaulted
      expect(result.link).toBe(''); // Defaulted
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Item 1');
    });

    it('should handle empty items array', async () => {
      const mockFeedData = {
        title: 'Empty Feed',
        items: []
      };
      (mockParserInstance.parseURL as Mock).mockResolvedValue(mockFeedData);

      const result: ParsedRSSFeed = await E.runPromise(service.fetchAndParse(testUrl));

      expect(result.title).toBe('Empty Feed');
      expect(result.items).toEqual([]);
    });

    it('should use isoDate if pubDate is missing for an item', async () => {
      const mockFeedData = {
        title: 'Feed with isoDate',
        items: [
          {
            title: 'Item with isoDate',
            link: 'https://example.com/item-iso',
            isoDate: new Date('2023-12-25T10:00:00Z').toISOString()
          }
        ]
      };
      (mockParserInstance.parseURL as Mock).mockResolvedValue(mockFeedData);

      const result: ParsedRSSFeed = await E.runPromise(service.fetchAndParse(testUrl));

      expect(result.items[0].pubDate).toBe(new Date('2023-12-25T10:00:00Z').toISOString());
    });

    it('should include extra top-level fields like feedUrl and image if present', async () => {
      const mockFeedData = {
        title: 'Feed With Extras',
        feedUrl: 'https://example.com/actual-feed.xml',
        image: { url: 'https://example.com/image.png', title: 'Feed Image' },
        items: []
      };
      (mockParserInstance.parseURL as Mock).mockResolvedValue(mockFeedData);

      // Define extended type for this test case
      type ExtendedParsedRSSFeed = ParsedRSSFeed & {
        feedUrl?: string;
        image?: unknown;
      };

      const result = (await E.runPromise(service.fetchAndParse(testUrl))) as ExtendedParsedRSSFeed;

      expect(result.feedUrl).toBe('https://example.com/actual-feed.xml');
      expect(result.image).toEqual({ url: 'https://example.com/image.png', title: 'Feed Image' });
    });
  });
});
