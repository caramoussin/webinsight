<script lang="ts">
	import { Search, Lock } from 'lucide-svelte';
	import ThemeToggle from './ThemeToggle.svelte';
</script>

<header class="flex h-16 items-center justify-between border-b border-gray-200 bg-background px-4 dark:border-gray-800">
	<div class="relative w-80">
		<div class="absolute inset-y-0 left-0 flex items-center pl-3">
			<Search class="h-4 w-4 text-muted-foreground" />
		</div>
		<input 
			type="text" 
			placeholder="Search articles..." 
			class="h-10 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
		/>
	</div>
	
	<div class="flex items-center gap-4">
		<div class="flex h-10 items-center rounded-md border border-input bg-background px-4">
			<Lock class="mr-2 h-4 w-4 text-amber-500" />
		</div>
		<ThemeToggle />
		<button class="rounded-full bg-gray-200 p-2 dark:bg-gray-700">
			<span class="sr-only">Settings</span>
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings">
				<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
				<circle cx="12" cy="12" r="3"></circle>
			</svg>
		</button>
	</div>
</header>
