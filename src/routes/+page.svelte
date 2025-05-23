<script lang="ts">
	import StatCard from '$lib/components/StatCard.svelte';
	import ActivityItem from '$lib/components/ActivityItem.svelte';
</script>

<div class="space-y-8">
	<header class="page-header">
		<h1 class="h1 text-primary-800-200-token">Dashboard</h1>
	</header>

	<!-- Stats Grid -->
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

	<!-- Action Buttons -->
	<div class="flex flex-wrap gap-4">
		<a href="/feeds/add" class="btn preset-filled-primary-500"> Add Feed </a>
		<a href="/manual-fetch" class="btn preset-filled-primary-500"> Manual Fetch </a>
		<a href="/ai-insights" class="btn preset-filled-primary-500"> View AI Insights </a>
		<a href="/error" class="btn preset-filled-error-500"> Error ! </a>
	</div>

	<!-- Recent Activity -->
	<div>
		<header class="page-header">
			<h2 class="h2 text-primary-800-200-token">Recent Activity</h2>
		</header>
		<div class="card variant-soft-surface">
			<header class="card-header">
				<h3 class="h3 text-primary-700-200-token">Latest Updates</h3>
			</header>
			<section class="p-0">
				<div class="list-container">
					<ActivityItem title="AI Breakthrough in NLP" source="Tech Blog" time="2h ago" />
					<ActivityItem title="Market Trends 2025" source="News RSS" time="5h ago" />
					<ActivityItem title="Privacy Laws Update" source="Legal API" time="1d ago" />
				</div>
			</section>
		</div>
	</div>
</div>
