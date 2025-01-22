<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import type { PageData, ActionData } from './$types';
	import { onMount } from 'svelte';
	import { TwitterRSSService } from '$lib/services/rss/TwitterRSSService';

	type ScraperPageData = PageData & {
		contentTypes?: string[];
		scrapedContent?: string;
		initialUrl?: string;
		scrapedItems?: Array<{ title: string; link: string }>;
		error?: string;
	};

	type ScraperActionData = ActionData & {
		success?: boolean;
		data?: {
			content?: string;
			url?: string;
			contentType?: string;
			extractedText?: string[];
			extractedLinks?: Array<{ selector: string; href: string }>;
			metadata?: Record<string, unknown>;
		};
		error?: string;
	};

	export let data: ScraperPageData = {
		contentTypes: ['html', 'json', 'rss'],
		scrapedContent: '',
		initialUrl: '',
		scrapedItems: [],
		error: ''
	};
	export let form: ScraperActionData = {
		success: false,
		data: {
			content: '',
			url: '',
			contentType: '',
			extractedText: [],
			extractedLinks: [],
			metadata: {}
		},
		error: ''
	};

	let websiteUrl = '';
	let selectedContentType = 'html';
	let contentSelector = '';
	let isLoading = false;
	let scrapedContent = '';
	let extractedText: string[] = [];
	let extractedLinks: Array<{ selector: string; href: string }> = [];
	let error: string | null = null;

	// Automatically scrape on component mount
	onMount(async () => {
		if (data && 'scrapedContent' in data) {
			scrapedContent = data.scrapedContent as string;
		}

		try {
			const rssFeed = await TwitterRSSService.fetchRSSFeed('soushi888');
			console.log('RSS Feed Retrieved:', rssFeed);

			// Optional: Process and display RSS items
			if (rssFeed.items.length > 0) {
				scrapedContent = rssFeed.items
					.map((item) => `Title: ${item.title}\nLink: ${item.link}`)
					.join('\n\n');
			}
		} catch (error) {
			console.error('RSS Fetch Failed:', error);
			error = 'Failed to retrieve RSS feed';
		}
	});

	// Update form submission to handle loading state
	function handleSubmit() {
		isLoading = true;
	}

	// Update form result handling
	$: if (form) {
		isLoading = false;
		if (form.success && form.data?.content) {
			scrapedContent = form.data.content;
			extractedText = form.data.extractedText || [];
			extractedLinks = form.data.extractedLinks || [];
			error = null;
		} else if (form.error) {
			error = form.error;
			scrapedContent = '';
			extractedText = [];
			extractedLinks = [];
		}
	}
</script>

<form method="POST" action="?/scrape" use:enhance={handleSubmit} class="container mx-auto p-4">
	<h1 class="mb-4 text-2xl font-bold">Web Content Scraper</h1>

	<div class="mb-4 flex space-x-2">
		<input
			type="text"
			name="url"
			bind:value={websiteUrl}
			placeholder="Enter URL to scrape (e.g., https://example.com)"
			class="flex-1 rounded border p-2 text-black"
			required
		/>

		<Select.Root>
			<Select.Trigger class="w-[180px]">
				<Select.Value placeholder="Content Type" />
			</Select.Trigger>
			<Select.Content>
				<Select.Group>
					<Select.Label>Content Types</Select.Label>
					{#each data.contentTypes || [] as type}
						<Select.Item
							value={type}
							on:click={() => {
								selectedContentType = type;
								document.querySelector('input[name="contentType"]')?.setAttribute('value', type);
							}}
						>
							{type.toUpperCase()}
						</Select.Item>
					{/each}
				</Select.Group>
			</Select.Content>
		</Select.Root>

		<input type="hidden" name="contentType" value={selectedContentType} />

		<input
			type="text"
			name="selector"
			bind:value={contentSelector}
			placeholder="Optional CSS Selector"
			class="w-[180px] rounded border p-2 text-black"
		/>

		<Button type="submit" disabled={isLoading}>
			{isLoading ? 'Scraping...' : 'Scrape Content'}
		</Button>
	</div>

	{#if error}
		<div class="mb-4 rounded bg-red-100 p-4 text-red-700">
			{error}
		</div>
	{/if}

	{#if scrapedContent}
		<Card.Root class="mb-4">
			<Card.Header>
				<Card.Title>Scraped Content</Card.Title>
				<Card.Description>Type: {selectedContentType.toUpperCase()}</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if selectedContentType === 'html'}
					<div class="prose max-w-none">
						{@html scrapedContent}
					</div>
				{:else if selectedContentType === 'json'}
					<pre class="overflow-auto rounded bg-gray-100 p-4">
						{JSON.stringify(JSON.parse(scrapedContent), null, 2)}
					</pre>
				{:else if selectedContentType === 'rss'}
					<div class="space-y-4">
						{#each extractedText as item, index}
							<div class="border-b pb-2">
								<h3 class="font-bold">{item}</h3>
								{#if extractedLinks[index]}
									<a
										href={extractedLinks[index].href}
										target="_blank"
										rel="noopener noreferrer"
										class="text-blue-600 hover:underline"
									>
										Link
									</a>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}
</form>
