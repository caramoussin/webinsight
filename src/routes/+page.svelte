<script lang="ts">
	import { Button } from '$lib/components/ui/button';
</script>

<div class="flex flex-col items-center justify-center space-y-8 text-center">
	<h1 class="text-4xl font-bold tracking-tight">Welcome to RSS AI</h1>
	<p class="text-lg text-muted-foreground">Your intelligent RSS feed aggregator powered by AI</p>

	<div class="flex flex-col gap-4 sm:flex-row">
		<Button variant="default" href="/feeds/new">Add New Feed</Button>
		<Button variant="outline" href="/collections">Browse Collections</Button>
		<Button variant="outline" href="/profiles/new">Create Profile</Button>
	</div>

	<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<div class="rounded-lg border p-4">
			<h2 class="mb-2 text-lg font-semibold">Smart Feed Management</h2>
			<p class="text-sm text-muted-foreground">
				Organize and manage your RSS feeds with AI-powered categorization
			</p>
		</div>
		<div class="rounded-lg border p-4">
			<h2 class="mb-2 text-lg font-semibold">Profile-Based System</h2>
			<p class="text-sm text-muted-foreground">
				Create multiple profiles for different interests and needs
			</p>
		</div>
		<div class="rounded-lg border p-4">
			<h2 class="mb-2 text-lg font-semibold">AI Analysis</h2>
			<p class="text-sm text-muted-foreground">
				Get smart summaries and insights from your feed content
			</p>
		</div>
	</div>
</div>
