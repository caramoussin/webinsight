<script lang="ts">
  import { onMount } from 'svelte';
  import { Effect as E, pipe } from 'effect';
  import { FetchHttpClient } from '@effect/platform';
  import feedsStore from '$lib/stores/feeds.store.svelte';
  import type { CreateFeed } from '$lib/schemas/feed.schema';
  import FeedListItem from '$lib/components/feeds/FeedListItem.svelte';
  import AddFeedModal from '$lib/components/feeds/AddFeedModal.svelte';

  // TODO: Get profileId from authentication context
  const profileId = 'demo-profile-id';

  let showAddModal = $state(false);
  let isSubmitting = $state(false);

  // Load feeds on component mount
  onMount(() => {
    console.log('Loading feeds with profileId:', profileId);
    console.log('Initial store state:', { 
      loading: feedsStore.loading, 
      feedsCount: feedsStore.feeds.length, 
      error: feedsStore.error 
    });
    
    pipe(
      feedsStore.loadFeeds(profileId),
      E.tap(() => E.sync(() => {
        console.log('Feeds loaded successfully');
        console.log('Store state after loading:', { 
          loading: feedsStore.loading, 
          feeds: feedsStore.feeds,
          feedsCount: feedsStore.feeds.length, 
          error: feedsStore.error 
        });
      })),
      E.tapError((err) => E.sync(() => console.error('Error loading feeds:', err))),
      E.provide(FetchHttpClient.layer),
      E.runPromise
    ).catch(error => {
      console.error('Uncaught error in loadFeeds:', error);
    });
  });
  
  // Debug reactive state
  $effect(() => {
    console.log('Reactive update - Store state:', { 
      loading: feedsStore.loading, 
      feedsCount: feedsStore.feeds.length, 
      error: feedsStore.error 
    });
  });

  const handleAddFeed = async (feedData: CreateFeed) => {
    isSubmitting = true;
    try {
      await pipe(feedsStore.createFeed(feedData), E.provide(FetchHttpClient.layer), E.runPromise);
      showAddModal = false;
    } catch (error) {
      console.error('Failed to add feed:', error);
    } finally {
      isSubmitting = false;
    }
  };

  const handleDeleteFeed = async (feedId: string) => {
    if (!confirm('Are you sure you want to delete this feed?')) {
      return;
    }

    try {
      await pipe(
        feedsStore.deleteFeed(feedId, profileId),
        E.provide(FetchHttpClient.layer),
        E.runPromise
      );
    } catch (error) {
      console.error('Failed to delete feed:', error);
    }
  };

  const handleEditFeed = async (
    feedId: string,
    updateData: { name?: string; url?: string; collectionId?: string }
  ) => {
    try {
      await pipe(
        feedsStore.updateFeed(feedId, profileId, updateData),
        E.provide(FetchHttpClient.layer),
        E.runPromise
      );
    } catch (error) {
      console.error('Failed to update feed:', error);
    }
  };
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-8 flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Feeds</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Manage your RSS feeds and content sources</p>
    </div>

    <button
      onclick={() => (showAddModal = true)}
      class="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
      disabled={feedsStore.loading}
    >
      Add New Feed
    </button>
  </div>

  {#if feedsStore.error}
    <div class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
      <p class="font-medium">Error loading feeds</p>
      <p class="text-sm">{feedsStore.error}</p>
    </div>
  {/if}

  {#if feedsStore.loading}
    <div class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-400">Loading feeds...</span>
    </div>
  {:else if !feedsStore.feeds || feedsStore.feeds.length === 0}
    <div class="py-12 text-center">
      <div class="mb-4 text-gray-400">
        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-white">No feeds yet</h3>
      <p class="mb-4 text-gray-600 dark:text-gray-400">
        Get started by adding your first RSS feed or content source.
      </p>
      <button
        onclick={() => (showAddModal = true)}
        class="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
      >
        Add Your First Feed
      </button>
    </div>
  {:else}
    <div class="grid gap-4">
      {#each feedsStore.feeds as feed (feed.id)}
        <FeedListItem
          {feed}
          onDelete={() => handleDeleteFeed(feed.id)}
          onEdit={(updateData) => handleEditFeed(feed.id, updateData)}
        />
      {/each}
    </div>
  {/if}
</div>

{#if showAddModal}
  <AddFeedModal
    {profileId}
    {isSubmitting}
    onSubmit={handleAddFeed}
    onCancel={() => (showAddModal = false)}
  />
{/if}
