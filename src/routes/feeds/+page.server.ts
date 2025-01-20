import type { PageServerLoad } from '../rss-demo/$types';
import { WebScraperService } from '$lib/scraper/WebScraperService';
import { error } from '@sveltejs/kit';

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

export const actions = {
	scrape: async ({ request }) => {
		const data = await request.formData();
		const url = data.get('url')?.toString();
		const selector = data.get('selector')?.toString() || 'tr.athing';

		if (!url) {
			throw error(400, 'URL is required');
		}

		try {
			const result = await WebScraperService.scrape({
				url,
				contentType: 'html',
				selector,
				timeout: 15000
			});

			// Extract titles and links more robustly
			const scrapedItems = (result.extractedText || []).map((title, index) => {
				const linkItem = result.extractedLinks?.find(
					(l) => l.selector === `${selector}:nth-child(${index + 1})`
				);

				return {
					title,
					link: linkItem?.href || ''
				};
			});

			return {
				scrapedItems,
				url
			};
		} catch (e) {
			console.error('Server-side scraping error:', e);
			throw error(500, e instanceof Error ? e.message : 'Unknown error');
		}
	}
};
