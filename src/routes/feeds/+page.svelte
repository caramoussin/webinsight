<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';

	export let data: PageData;
	export let form;

	let websiteUrl = data.initialUrl || 'https://news.ycombinator.com/';
	let selectedSelector = 'tr.athing';
	let isLoading = false;
	let scrapedItems: Array<{
		title: string;
		link: string;
	}> = data.scrapedItems || [];
	let error: string | null = data.error || null;

	// Automatically scrape on component mount
	onMount(() => {
		if (data.scrapedItems && data.scrapedItems.length > 0) {
			scrapedItems = data.scrapedItems;
		}
	});

	// Update form submission to handle loading state
	function handleSubmit() {
		isLoading = true;
	}

	// Update form result handling
	$: if (form) {
		isLoading = false;
		if (form.scrapedItems) {
			scrapedItems = form.scrapedItems;
			error = null;
		} else if (form.error) {
			error = form.error;
			scrapedItems = [];
		}
	}
</script>

<form method="POST" action="?/scrape" use:enhance={handleSubmit} class="container mx-auto p-4">
	<h1 class="mb-4 text-2xl font-bold">Web Scraper Demo</h1>

	<div class="mb-4 flex space-x-2">
		<input
			type="text"
			name="url"
			bind:value={websiteUrl}
			placeholder="Enter Website URL"
			class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
		/>
		<input
			type="text"
			name="selector"
			bind:value={selectedSelector}
			placeholder="CSS Selector"
			class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
		/>
		<Button type="submit" disabled={isLoading}>
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
			{error}
		</div>
	{/if}

	{#if scrapedItems.length > 0}
		<Card.Root>
			<Card.Header>
				<Card.Title>Scraped Items</Card.Title>
				<Card.Description>Results from web scraping</Card.Description>
			</Card.Header>
			<Card.Content>
				<ul class="space-y-2">
					{#each scrapedItems as item}
						<li>
							<a
								href={item.link}
								target="_blank"
								rel="noopener noreferrer"
								class="text-blue-600 hover:underline"
							>
								{item.title}
							</a>
						</li>
					{/each}
				</ul>
			</Card.Content>
		</Card.Root>
	{:else if isLoading}
		<div class="text-center">Scraping Website...</div>
	{:else}
		<div class="text-center text-muted-foreground">No items found</div>
	{/if}
</form>
