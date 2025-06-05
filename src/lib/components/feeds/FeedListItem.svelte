<script lang="ts">
	import type { Feed } from '$lib/schemas/feed.schema';

	interface Props {
		feed: Feed;
		onDelete: () => void;
		onEdit: (updateData: { name?: string; url?: string; collectionId?: string }) => void;
	}

	let { feed, onDelete, onEdit }: Props = $props();

	let isEditing = $state(false);
	let editName = $state(feed.name || '');
	let editUrl = $state(feed.url);
	let editCollectionId = $state(feed.collectionId || '');

	const startEdit = () => {
		isEditing = true;
		editName = feed.name || '';
		editUrl = feed.url;
		editCollectionId = feed.collectionId || '';
	};

	const cancelEdit = () => {
		isEditing = false;
	};

	const saveEdit = () => {
		const updateData: { name?: string; url?: string; collectionId?: string } = {};

		if (editName !== feed.name) {
			updateData.name = editName || undefined;
		}
		if (editUrl !== feed.url) {
			updateData.url = editUrl;
		}
		if (editCollectionId !== feed.collectionId) {
			updateData.collectionId = editCollectionId || undefined;
		}

		if (Object.keys(updateData).length > 0) {
			onEdit(updateData);
		}

		isEditing = false;
	};

	const formatDate = (timestamp: Date) => {
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(timestamp);
	};
</script>

<div
	class="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
>
	{#if isEditing}
		<!-- Edit Mode -->
		<div class="space-y-4">
			<div>
				<label
					for="edit-name"
					class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
				>
					Name (optional)
				</label>
				<input
					id="edit-name"
					type="text"
					bind:value={editName}
					placeholder="Feed name"
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
				/>
			</div>

			<div>
				<label
					for="edit-url"
					class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
				>
					URL *
				</label>
				<input
					id="edit-url"
					type="url"
					bind:value={editUrl}
					placeholder="https://example.com/feed.xml"
					required
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
				/>
			</div>

			<div>
				<label
					for="edit-collection"
					class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
				>
					Collection ID (optional)
				</label>
				<input
					id="edit-collection"
					type="text"
					bind:value={editCollectionId}
					placeholder="Collection ID"
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
				/>
			</div>

			<div class="flex gap-2 pt-2">
				<button
					onclick={saveEdit}
					class="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
				>
					Save
				</button>
				<button
					onclick={cancelEdit}
					class="rounded-md bg-gray-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
				>
					Cancel
				</button>
			</div>
		</div>
	{:else}
		<!-- Display Mode -->
		<div class="flex items-start justify-between">
			<div class="min-w-0 flex-1">
				<div class="mb-2 flex items-center gap-3">
					<h3 class="truncate text-lg font-semibold text-gray-900 dark:text-white">
						{feed.name || 'Unnamed Feed'}
					</h3>
					{#if feed.collectionId}
						<span
							class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
						>
							Collection: {feed.collectionId}
						</span>
					{/if}
				</div>

				<div class="mb-3">
					<a
						href={feed.url}
						target="_blank"
						rel="noopener noreferrer"
						class="text-sm break-all text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
					>
						{feed.url}
					</a>
				</div>

				<div class="space-y-1 text-xs text-gray-500 dark:text-gray-400">
					<div>Created: {formatDate(feed.createdAt)}</div>
					<div>Updated: {formatDate(feed.updatedAt)}</div>
					<div class="font-mono text-xs">ID: {feed.id}</div>
				</div>
			</div>

			<div class="ml-4 flex gap-2">
				<button
					aria-label="Edit feed"
					onclick={startEdit}
					class="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-700 dark:hover:text-blue-400"
					title="Edit feed"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
						/>
					</svg>
				</button>

				<button
					aria-label="Delete feed"
					onclick={onDelete}
					class="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
					title="Delete feed"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
				</button>
			</div>
		</div>
	{/if}
</div>
