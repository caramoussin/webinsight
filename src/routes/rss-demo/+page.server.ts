import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		// Fetch the initial page content server-side
		const response = await fetch('https://news.ycombinator.com/', {
			headers: {
				'User-Agent': 'FluxRSSFabricAI/1.0 Web Scraper'
			}
		});

		if (!response.ok) {
			throw new Error('Failed to fetch website');
		}

		const html = await response.text();

		return {
			initialHtml: html
		};
	} catch (e) {
		console.error('Server-side fetch error:', e);
		return {
			initialHtml: null,
			error: e instanceof Error ? e.message : 'Unknown error'
		};
	}
};
