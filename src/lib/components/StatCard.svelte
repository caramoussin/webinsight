<script lang="ts">
	type Props = {
		title: string;
		value: string | number;
		subtitle?: string;
	};

	let { title, value, subtitle }: Props = $props();
</script>

<div class="card variant-soft-surface p-4">
	<header class="card-header">
		<h3 class="h3">{title}</h3>
	</header>
	<section class="p-4">
		<p class="text-4xl font-bold text-primary-700-200-token">{value}</p>
		{#if subtitle}
			<p class="text-sm text-surface-700-200-token">{subtitle}</p>
		{/if}
	</section>
</div>
