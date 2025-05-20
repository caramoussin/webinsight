<script lang="ts">
	export let title: string;
	export let value: string | number;
	export let subtitle: string = '';
</script>

<div class="flex flex-col space-y-2 rounded-lg bg-card p-6 shadow-sm">
	<h3 class="text-lg font-medium text-muted-foreground">{title}</h3>
	<p class="text-4xl font-bold">{value}</p>
	{#if subtitle}
		<p class="text-sm text-muted-foreground">{subtitle}</p>
	{/if}
</div>
