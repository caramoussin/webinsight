<script lang="ts">
	import { WebScraperService } from '$lib/scraper/WebScraperService';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let websiteUrl = 'https://news.ycombinator.com/';
	let scrapedItems: Array<{
		title: string;
		link: string;
		description?: string;
	}> = [];
	let isLoading = false;
	let error: string | null = null;
	let selectedSelector = 'tr.athing';

	async function scrapeWebsite() {
		isLoading = true;
		error = null;
		scrapedItems = [];

		try {
			const result = await WebScraperService.scrape({
				url: websiteUrl,
				contentType: 'html',
				selector: selectedSelector,
				timeout: 15000
			});

			// Extract titles and links from the selected elements
			scrapedItems = (result.extractedText || []).map((title, index) => ({
				title,
				link: extractLink(index)
			}));
		} catch (e) {
			error = e instanceof Error ? e.message : 'Unknown error occurred';
			console.error('Web Scraping Error:', e);
		} finally {
			isLoading = false;
		}
	}

	function extractLink(index: number): string {
		// This is a placeholder - in a real-world scenario,
		// you'd implement a more robust link extraction method
		const links = document.querySelectorAll(`${selectedSelector} a.titlelink`);
		return links[index] ? (links[index] as HTMLAnchorElement).href : '';
	}

	// Optional: Automatically scrape on component mount
	onMount(() => {
		if (data.initialHtml) {
			// Parse the initial HTML from server-side fetch
			const parser = new DOMParser();
			const doc = parser.parseFromString(data.initialHtml, 'text/html');

			// Example of extracting titles from the initial HTML
			const titles = Array.from(doc.querySelectorAll(selectedSelector + ' .titlelink')).map(
				(el) => el.textContent || ''
			);

			scrapedItems = titles.map((title, index) => ({
				title,
				link: extractLink(index)
			}));
		} else {
			scrapeWebsite();
		}
	});
</script>

<div class="container mx-auto p-4">
	<h1 class="mb-4 text-2xl font-bold">Web Scraper Demo</h1>

	<div class="mb-4 flex space-x-2">
		<input
			type="text"
			bind:value={websiteUrl}
			placeholder="Enter Website URL"
			class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
		/>
		<input
			type="text"
			bind:value={selectedSelector}
			placeholder="CSS Selector"
			class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
		/>
		<Button on:click={scrapeWebsite} disabled={isLoading}>
			{#if isLoading}
				Scraping...
			{:else}
				Scrape Website
			{/if}
		</Button>
	</div>

	{#if error}
		<div
			class="relative rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
			role="alert"
		>
			<span class="block sm:inline">{error}</span>
		</div>
	{/if}

	{#if isLoading}
		<div class="text-center">Scraping Website...</div>
	{:else if scrapedItems.length > 0}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each scrapedItems as item, index}
				<Card.Root>
					<Card.Header>
						<Card.Title>Item {index + 1}</Card.Title>
						<Card.Description>Scraped Content</Card.Description>
					</Card.Header>
					<Card.Content>
						<p>{item.title}</p>
					</Card.Content>
					<Card.Footer>
						{#if item.link}
							<a
								href={item.link}
								target="_blank"
								rel="noopener noreferrer"
								class="text-primary hover:underline"
							>
								View Source
							</a>
						{/if}
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>
	{:else}
		<div class="text-center text-muted-foreground">No items found</div>
	{/if}
</div>
