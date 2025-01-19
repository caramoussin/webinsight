<script lang="ts">
	import { Button } from '$lib/components/ui/button';
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold tracking-tight">Profiles</h1>
		<Button href="/profiles/new">Create Profile</Button>
	</div>

	<div class="rounded-lg border">
		<div class="p-4">
			<p class="text-sm text-muted-foreground">
				No profiles created yet. Profiles help you separate different interests and manage content
				separately.
			</p>
		</div>
	</div>
</div>
