<script lang="ts">
  import { Search, Lock, Settings } from 'lucide-svelte';
  import ThemeToggle from './ThemeToggle.svelte';
</script>

<header class="border-surface-300-600-token border-b p-4">
  <div class="container mx-auto flex items-center justify-between">
    <!-- Search Bar -->
    <div class="input-group input-group-divider w-80 grid-cols-[auto_1fr_auto]">
      <div class="input-group-shim"><Search class="h-4 w-4" /></div>
      <input type="search" placeholder="Search articles..." class="input" />
      <button class="variant-filled-primary">Search</button>
    </div>

    <!-- Right Side Controls -->
    <div class="flex items-center gap-4">
      <!-- Status Indicator -->
      <div class="chip variant-soft-warning">
        <Lock class="h-4 w-4" />
        <span>Local Mode</span>
      </div>

      <!-- Theme Toggle -->
      <ThemeToggle />

      <!-- Settings Button -->
      <button class="btn-icon variant-ghost-surface">
        <span class="sr-only">Settings</span>
        <Settings class="h-5 w-5" />
      </button>
    </div>
  </div>
</header>
