<script lang="ts">
	import type { Snippet } from 'svelte';
	import '../app.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Header from '$lib/components/Header.svelte';

	type Props = {
		children: Snippet;
	};

	let { children } = $props();
</script>

<div class="bg-surface-50 dark:bg-surface-950 h-screen overflow-hidden">
	<div class="flex h-full">
		<!-- Sidebar -->
		<div class="w-64 overflow-y-auto">
			<Sidebar />
		</div>

		<!-- Main content -->
		<div class=" flex flex-1 flex-col overflow-hidden">
			<Header />
			<main class=" flex-1 overflow-auto p-4">
				<div class="container mx-auto">
					{@render children()}
				</div>
			</main>
		</div>
	</div>
</div>
