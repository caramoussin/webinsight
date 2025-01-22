import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const username = url.searchParams.get('username');
	const nitterInstance = url.searchParams.get('instance') || 'https://nitter.poast.org';

	if (!username) {
		throw error(400, 'Username is required');
	}

	try {
		const response = await fetch(`${nitterInstance}/${username}/rss`, {
			method: 'GET',
			headers: {
				'User-Agent':
					'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
				Accept:
					'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
				'Accept-Encoding': 'gzip, deflate, br, zstd',
				'Accept-Language': 'fr-FR,fr;q=0.6',
				'Cache-Control': 'max-age=0',
				'Sec-Fetch-Dest': 'document',
				'Sec-Fetch-Mode': 'navigate',
				'Sec-Fetch-Site': 'cross-site',
				'Sec-Fetch-User': '?1',
				'Sec-GPC': '1',
				'Upgrade-Insecure-Requests': '1'
			}
		});

		if (!response.ok) {
			throw error(response.status, `Failed to fetch RSS: ${response.statusText}`);
		}

		const xmlContent = await response.text();

		return new Response(xmlContent, {
			headers: {
				'Content-Type': 'application/rss+xml',
				'Cache-Control': 'max-age=3600' // Cache for 1 hour
			}
		});
	} catch (err) {
		console.error('RSS Fetch Error:', err);
		throw error(500, 'Failed to retrieve RSS feed');
	}
};
