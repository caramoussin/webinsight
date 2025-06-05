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
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
  <!-- Modal Content -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
    <!-- Modal Header -->
    <div class="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Add New Feed</h2>
      <button
        aria-label="Close modal"
        onclick={handleCancel}
        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        disabled={isSubmitting}
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Modal Body -->
    <form onsubmit={handleSubmit} class="p-6 space-y-4">
      <!-- URL Field -->
      <div>
        <label for="feed-url" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Feed URL *
        </label>
        <input
          id="feed-url"
          type="url"
          bind:value={url}
          placeholder="https://example.com/feed.xml"
          required
          disabled={isSubmitting}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          class:border-red-500={errors.url}
          class:dark:border-red-500={errors.url}
        />
        {#if errors.url}
          <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.url}</p>
        {/if}
      </div>

      <!-- Name Field -->
      <div>
        <label for="feed-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Feed Name (optional)
        </label>
        <input
          id="feed-name"
          type="text"
          bind:value={name}
          placeholder="My Awesome Feed"
          disabled={isSubmitting}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          If left empty, the feed title will be used automatically
        </p>
      </div>

      <!-- Collection ID Field -->
      <div>
        <label for="feed-collection" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Collection ID (optional)
        </label>
        <input
          id="feed-collection"
          type="text"
          bind:value={collectionId}
          placeholder="tech-news"
          disabled={isSubmitting}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
          class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed"
        >
          {#if isSubmitting}
            <div class="flex items-center justify-center">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
</div> 