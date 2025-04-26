import { WebScraperService } from '$lib/services/scraper/WebScraperService';
import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
  try {
    // Use WebScraperService for server-side scraping
    const result = await WebScraperService.scrape({
      url: 'https://news.ycombinator.com/',
      contentType: 'html',
      selector: 'tr.athing',
      timeout: 15000
    });

    // Extract titles and links more robustly
    const scrapedItems = (result.extractedText || []).map((title, index) => {
      const linkItem = result.extractedLinks?.find(
        (l) => l.selector === `tr.athing:nth-child(${index + 1})`
      );

      return {
        title,
        link: linkItem?.href || ''
      };
    });

    return {
      scrapedItems,
      initialUrl: 'https://news.ycombinator.com/'
    };
  } catch (e) {
    console.error('Server-side scraping error:', e);
    return {
      scrapedItems: [],
      initialUrl: 'https://news.ycombinator.com/',
      error: e instanceof Error ? e.message : 'Unknown error'
    };
  }
};

export const actions: Actions = {
  scrape: async ({ request }) => {
    const data = await request.formData();
    const url = data.get('url')?.toString();
    const contentType = (data.get('contentType')?.toString() as 'html' | 'json' | 'rss') || 'html';
    const selector = data.get('selector')?.toString();

    if (!url) {
      throw error(400, 'URL is required');
    }

    try {
      // Determine the appropriate scraping configuration
      const scrapingConfig = {
        url,
        contentType,
        selector,
        timeout: 15000
      };

      // Use WebScraperService to fetch and parse content
      const result = await WebScraperService.scrape(scrapingConfig);

      return {
        success: true,
        data: {
          ...result,
          // Ensure consistent response structure
          content: result.content,
          extractedText: result.extractedText || [],
          extractedLinks: result.extractedLinks || []
        }
      };
    } catch (e) {
      console.error('Scraping error:', e);
      throw error(500, e instanceof Error ? e.message : 'Failed to scrape content');
    }
  }
};
