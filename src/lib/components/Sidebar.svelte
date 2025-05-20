<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="bg-primary-900 flex h-full w-64 flex-col text-white">
	<div class="p-4 text-2xl font-bold">WebInsight</div>

	<nav class="flex flex-1 flex-col gap-1 p-2">
		<a
			href="/"
			class="rounded p-4 {page.url.pathname === '/'
				? 'bg-primary-800'
				: 'hover:bg-primary-800/50'} transition-colors"
		>
			Home
		</a>
		<a
			href="/feeds"
			class="rounded p-4 {page.url.pathname.startsWith('/feeds')
				? 'bg-primary-800'
				: 'hover:bg-primary-800/50'} transition-colors"
		>
			Feeds
		</a>
		<a
			href="/collections"
			class="rounded p-4 {page.url.pathname.startsWith('/collections')
				? 'bg-primary-800'
				: 'hover:bg-primary-800/50'} transition-colors"
		>
			Collections
		</a>
		<a
			href="/articles"
			class="rounded p-4 {page.url.pathname.startsWith('/articles')
				? 'bg-primary-800'
				: 'hover:bg-primary-800/50'} transition-colors"
		>
			Articles
		</a>
		<a
			href="/ai-insights"
			class="rounded p-4 {page.url.pathname.startsWith('/ai-insights')
				? 'bg-primary-800'
				: 'hover:bg-primary-800/50'} transition-colors"
		>
			AI Insights
		</a>
		<a
			href="/manual-fetch"
			class="rounded p-4 {page.url.pathname.startsWith('/manual-fetch')
				? 'bg-primary-800'
				: 'hover:bg-primary-800/50'} transition-colors"
		>
			Manual Fetch
		</a>
		<a
			href="/profiles"
			class="rounded p-4 {page.url.pathname.startsWith('/profiles')
				? 'bg-primary-800'
				: 'hover:bg-primary-800/50'} transition-colors"
		>
			Profiles
		</a>
		<a
			href="/settings"
			class="rounded p-4 {page.url.pathname.startsWith('/settings')
				? 'bg-primary-800'
				: 'hover:bg-primary-800/50'} transition-colors"
		>
			Settings
		</a>
	</nav>

	<div class="p-4 text-sm">
		<div class="flex items-center justify-between">
			<span>MCP Status: <span class="text-green-400">Connected</span></span>
		</div>
	</div>

	<div class="p-4 text-sm">
		<div class="flex items-center justify-between">
			<span>Status: <span class="text-green-400">Local Processing</span></span>
			<span>Cache: 75% Hits</span>
		</div>
	</div>
</div>
