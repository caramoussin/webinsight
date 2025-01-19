<script lang="ts">
	import { Button } from '$lib/components/ui/button';
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold tracking-tight">RSS Feeds</h1>
		<Button href="/feeds/new">Add Feed</Button>
	</div>

	<div class="rounded-lg border">
		<div class="p-4">
			<p class="text-sm text-muted-foreground">
				No feeds added yet. Click the button above to add your first RSS feed.
			</p>
		</div>
	</div>
</div>
