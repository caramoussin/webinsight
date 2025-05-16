<script lang="ts">
	import type { Snippet } from 'svelte';
	import '../app.css';

	type Props = {
		children: Snippet;
	};

	let { children } = $props();
</script>

{@render children()}
