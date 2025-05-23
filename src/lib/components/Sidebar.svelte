<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="h-full bg-surface-800-300-token flex flex-col">
	<div class="p-4 text-2xl font-bold">WebInsight</div>

	<nav class="list-nav flex-1 p-2">
		<ul>
			<li>
				<a
					href="/"
					class={page.url.pathname === '/'
						? 'variant-filled-primary'
						: 'hover:variant-soft-primary'}
				>
					Home
				</a>
			</li>
			<li>
				<a
					href="/feeds"
					class={page.url.pathname.startsWith('/feeds')
						? 'variant-filled-primary'
						: 'hover:variant-soft-primary'}
				>
					Feeds
				</a>
			</li>
			<li>
				<a
					href="/collections"
					class={page.url.pathname.startsWith('/collections')
						? 'variant-filled-primary'
						: 'hover:variant-soft-primary'}
				>
					Collections
				</a>
			</li>
			<li>
				<a
					href="/articles"
					class={page.url.pathname.startsWith('/articles')
						? 'variant-filled-primary'
						: 'hover:variant-soft-primary'}
				>
					Articles
				</a>
			</li>
			<li>
				<a
					href="/ai-insights"
					class={page.url.pathname.startsWith('/ai-insights')
						? 'variant-filled-primary'
						: 'hover:variant-soft-primary'}
				>
					AI Insights
				</a>
			</li>
			<li>
				<a
					href="/manual-fetch"
					class={page.url.pathname.startsWith('/manual-fetch')
						? 'variant-filled-primary'
						: 'hover:variant-soft-primary'}
				>
					Manual Fetch
				</a>
			</li>
			<li>
				<a
					href="/profiles"
					class={page.url.pathname.startsWith('/profiles')
						? 'variant-filled-primary'
						: 'hover:variant-soft-primary'}
				>
					Profiles
				</a>
			</li>
			<li>
				<a
					href="/settings"
					class={page.url.pathname.startsWith('/settings')
						? 'variant-filled-primary'
						: 'hover:variant-soft-primary'}
				>
					Settings
				</a>
			</li>
		</ul>
	</nav>

	<div class="card variant-soft m-2 p-4">
		<div class="flex items-center justify-between text-sm">
			<span>MCP Status: <span class="text-success-500">Connected</span></span>
		</div>
	</div>

	<div class="card variant-soft m-2 p-4">
		<div class="flex items-center justify-between text-sm">
			<span>Status: <span class="text-success-500">Local Processing</span></span>
			<span>Cache: 75% Hits</span>
		</div>
	</div>
</div>
