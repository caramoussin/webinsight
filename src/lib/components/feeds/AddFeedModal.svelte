<script lang="ts">
  import type { CreateFeed } from '$lib/schemas/feed.schema';

  interface Props {
    profileId: string;
    isSubmitting: boolean;
    onSubmit: (feedData: CreateFeed) => void;
    onCancel: () => void;
  }

  let { profileId, isSubmitting, onSubmit, onCancel }: Props = $props();

  let name = $state('');
  let url = $state('');
  let collectionId = $state('');
  let errors = $state<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!url.trim()) {
      newErrors.url = 'URL is required';
    } else {
      try {
        new URL(url);
      } catch {
        newErrors.url = 'Please enter a valid URL';
      }
    }

    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: Event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const feedData: CreateFeed = {
      url: url.trim(),
      profileId,
      name: name.trim() || undefined,
      collectionId: collectionId.trim() || undefined
    };

    onSubmit(feedData);
  };

  const handleCancel = () => {
    // Reset form
    name = '';
    url = '';
    collectionId = '';
    errors = {};
    onCancel();
  };

  // Close modal on Escape key
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleCancel();
    }
  };
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Modal Backdrop -->
<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
  <!-- Modal Content -->
  <div
    class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-800"
  >
    <!-- Modal Header -->
    <div
      class="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700"
    >
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Add New Feed</h2>
      <button
        aria-label="Close modal"
        onclick={handleCancel}
        class="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        disabled={isSubmitting}
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- Modal Body -->
    <form onsubmit={handleSubmit} class="space-y-4 p-6">
      <!-- URL Field -->
      <div>
        <label
          for="feed-url"
          class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Feed URL *
        </label>
        <input
          id="feed-url"
          type="url"
          bind:value={url}
          placeholder="https://example.com/feed.xml"
          required
          disabled={isSubmitting}
          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          class:border-red-500={errors.url}
          class:dark:border-red-500={errors.url}
        />
        {#if errors.url}
          <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.url}</p>
        {/if}
      </div>

      <!-- Name Field -->
      <div>
        <label
          for="feed-name"
          class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Feed Name (optional)
        </label>
        <input
          id="feed-name"
          type="text"
          bind:value={name}
          placeholder="My Awesome Feed"
          disabled={isSubmitting}
          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          If left empty, the feed title will be used automatically
        </p>
      </div>

      <!-- Collection ID Field -->
      <div>
        <label
          for="feed-collection"
          class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Collection ID (optional)
        </label>
        <input
          id="feed-collection"
          type="text"
          bind:value={collectionId}
          placeholder="tech-news"
          disabled={isSubmitting}
          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Group feeds into collections for better organization
        </p>
      </div>

      <!-- Form Actions -->
      <div class="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          class="flex-1 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {#if isSubmitting}
            <div class="flex items-center justify-center">
              <div class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
              Adding...
            </div>
          {:else}
            Add Feed
          {/if}
        </button>

        <button
          type="button"
          onclick={handleCancel}
          disabled={isSubmitting}
          class="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
</div>
