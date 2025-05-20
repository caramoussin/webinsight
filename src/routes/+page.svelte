<script lang="ts">
	import StatCard from '$lib/components/StatCard.svelte';
	import ActivityItem from '$lib/components/ActivityItem.svelte';
</script>

<div class="space-y-8">
	<h1 class="text-3xl font-bold">Dashboard</h1>
	
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
		<div class="col-span-1 md:col-span-2">
			<div class="grid grid-cols-2 gap-6">
				<StatCard title="Total Feeds" value="24" subtitle="3 new this week" />
				<StatCard title="Recent Articles" value="152" subtitle="50 today" />
			</div>
		</div>
		
		<div class="col-span-1 md:col-span-2">
			<div class="grid grid-cols-2 gap-6">
				<StatCard title="AI Insights" value="87" subtitle="Summaries generated" />
				<StatCard title="Storage" value="120 MB" subtitle="Per profile" />
			</div>
		</div>
	</div>
	
	<div class="flex flex-wrap gap-4">
		<a href="/feeds/add" class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
			Add Feed
		</a>
		<a href="/manual-fetch" class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
			Manual Fetch
		</a>
		<a href="/ai-insights" class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
			View AI Insights
		</a>
	</div>
	
	<div>
		<h2 class="mb-4 text-2xl font-bold">Recent Activity</h2>
		<div class="rounded-lg border bg-card shadow-sm">
			<div class="p-6">
				<div class="divide-y">
					<ActivityItem title="AI Breakthrough in NLP" source="Tech Blog" time="2h ago" />
					<ActivityItem title="Market Trends 2025" source="News RSS" time="5h ago" />
					<ActivityItem title="Privacy Laws Update" source="Legal API" time="1d ago" />
				</div>
			</div>
		</div>
	</div>
</div>
