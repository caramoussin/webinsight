<script lang="ts">
  import { page } from '$app/state';
</script>

<div class="bg-surface-800-300-token flex h-full flex-col">
  <div class="p-4 text-2xl font-bold">WebInsight</div>

  <nav class="list-nav flex-1 p-4">
    <ul class="flex h-full flex-col justify-evenly">
      <li>
        <a
          href="/"
          class={page.url.pathname === '/' ? 'text-primary-500' : 'hover:text-primary-300'}
        >
          Home
        </a>
      </li>
      <li>
        <a
          href="/feeds"
          class={page.url.pathname.startsWith('/feeds')
            ? 'text-primary-500'
            : 'hover:text-primary-300'}
        >
          Feeds
        </a>
      </li>
      <li>
        <a
          href="/collections"
          class={page.url.pathname.startsWith('/collections')
            ? 'text-primary-500'
            : 'hover:text-primary-300'}
        >
          Collections
        </a>
      </li>
      <li>
        <a
          href="/articles"
          class={page.url.pathname.startsWith('/articles')
            ? 'text-primary-500'
            : 'hover:text-primary-300'}
        >
          Articles
        </a>
      </li>
      <li>
        <a
          href="/ai-insights"
          class={page.url.pathname.startsWith('/ai-insights')
            ? 'text-primary-500'
            : 'hover:text-primary-300'}
        >
          AI Insights
        </a>
      </li>
      <li>
        <a
          href="/manual-fetch"
          class={page.url.pathname.startsWith('/manual-fetch')
            ? 'text-primary-500'
            : 'hover:text-primary-300'}
        >
          Manual Fetch
        </a>
      </li>
      <li>
        <a
          href="/profiles"
          class={page.url.pathname.startsWith('/profiles')
            ? 'text-primary-500'
            : 'hover:text-primary-300'}
        >
          Profiles
        </a>
      </li>
      <li>
        <a
          href="/settings"
          class={page.url.pathname.startsWith('/settings')
            ? 'text-primary-500'
            : 'hover:text-primary-300'}
        >
          Settings
        </a>
      </li>
    </ul>
  </nav>

  <div class="card text-soft m-2 p-4">
    <div class="flex items-center justify-between text-sm">
      <span>MCP Status: <span class="text-success-500">Connected</span></span>
    </div>
  </div>

  <div class="card text-soft m-2 p-4">
    <div class="flex items-center justify-between text-sm">
      <span>Status: <span class="text-success-500">Local Processing</span></span>
      <span>Cache: 75% Hits</span>
    </div>
  </div>
</div>
