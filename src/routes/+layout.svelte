<script lang="ts">
  import '../app.css';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  let { children } = $props();

  let isMenuOpen = $state(false);
</script>

<div class="min-h-screen bg-background">
  <header
    class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
  >
    <div class="container flex h-14 items-center justify-between">
      <div class="mr-4 flex items-center">
        <a href="/" class="mr-6 flex items-center space-x-2">
          <span class="font-bold">RSS AI</span>
        </a>
        <nav class="flex items-center space-x-6 text-sm font-medium">
          <a href="/feeds" class="transition-colors hover:text-foreground/80">Feeds</a>
          <a href="/collections" class="transition-colors hover:text-foreground/80">Collections</a>
        </nav>
      </div>
      <ThemeToggle />
    </div>
  </header>

  <main class="container py-6">
    {@render children()}
  </main>
</div>

<style lang="postcss">
  :global(html) {
    @apply antialiased;
  }
</style>
