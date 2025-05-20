<script lang="ts">
	export let title: string;
	export let source: string;
	export let time: string;
</script>

<div class="flex items-center justify-between py-3">
	<div class="font-medium">{title}</div>
	<div class="flex items-center text-sm text-muted-foreground">
		<span>{source}</span>
		<span class="mx-2">•</span>
		<span>{time}</span>
	</div>
</div>
