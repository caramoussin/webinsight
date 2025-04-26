<script lang="ts">
  import { onMount } from 'svelte';
  import { Moon, Sun } from 'lucide-svelte';

  let theme: 'light' | 'dark' = 'light';

  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    applyTheme();
  }

  function applyTheme() {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  onMount(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      theme = savedTheme;
    } else {
      // Check system preference
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme();
  });
</script>

<button
  on:click={toggleTheme}
  class="rounded-full p-2 transition-colors hover:bg-accent"
  aria-label="Toggle theme"
>
  {#if theme === 'light'}
    <Moon class="h-5 w-5" />
  {:else}
    <Sun class="h-5 w-5" />
  {/if}
</button>
