<script lang="ts">
  import { Moon, Sun } from 'lucide-svelte';

  let checked = $state(false);

  // Initialize theme based on localStorage or system preference
  $effect(() => {
    // Check localStorage first
    let mode = localStorage.getItem('mode');

    // If no stored preference, check system preference
    if (!mode) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      mode = prefersDark ? 'dark' : 'light';
      localStorage.setItem('mode', mode);
    }

    // Apply the theme
    checked = mode === 'dark';
    document.documentElement.setAttribute('data-mode', mode);
  });

  function toggleTheme() {
    const mode = checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-mode', mode);
    localStorage.setItem('mode', mode);
  }
</script>

<button
  class="btn-icon variant-ghost-surface hover:variant-soft-primary"
  onclick={() => {
    checked = !checked;
    toggleTheme();
  }}
  aria-label="Toggle theme"
>
  {#if !checked}
    <Moon class="h-5 w-5" />
  {:else}
    <Sun class="h-5 w-5" />
  {/if}
</button>
