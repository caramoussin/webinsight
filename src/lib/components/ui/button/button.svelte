<script lang="ts">
	import { Button as ButtonPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { ClassValue } from 'clsx';
	import { buttonVariants } from './variants';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	type Props = {
		variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
		size?: 'default' | 'sm' | 'lg' | 'icon';
		className?: ClassValue;
		href?: string;
	};

	let {
		variant = 'default',
		size = 'default',
		className = '',
		href
	}: Props = $props();

	const buttonClass = $derived(cn(buttonVariants({ variant, size, className })));

	function handleClick(event: MouseEvent) {
		// Optional click handling
	}
</script>

{#if href}
	<a 
		{href} 
		class={buttonClass}
		role="button"
	>
		<slot />
	</a>
{:else}
	<ButtonPrimitive.Root
		class={buttonClass}
		type="button"
		on:click={handleClick}
	>
		<slot />
	</ButtonPrimitive.Root>
{/if}
