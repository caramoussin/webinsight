<script lang="ts">
  import { Button as ButtonPrimitive } from 'bits-ui';
  import { type VariantProps, cva } from 'class-variance-authority';
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils/utils';
  import type { Snippet } from 'svelte';

  const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
    {
      variants: {
        variant: {
          default: 'bg-primary text-primary-foreground hover:bg-primary/90',
          destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
          outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
          secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
          ghost: 'hover:bg-accent hover:text-accent-foreground',
          link: 'underline-offset-4 hover:underline text-primary'
        },
        size: {
          default: 'h-10 py-2 px-4',
          sm: 'h-9 px-3 rounded-md',
          lg: 'h-11 px-8 rounded-md',
          icon: 'h-10 w-10'
        }
      },
      defaultVariants: {
        variant: 'default',
        size: 'default'
      }
    }
  );

  type Variant = VariantProps<typeof buttonVariants>['variant'];
  type Size = VariantProps<typeof buttonVariants>['size'];

  type BaseProps = {
    variant?: Variant;
    size?: Size;
    class?: string;
    children: Snippet;
  };

  type ButtonProps = BaseProps & {
    href?: never;
  } & Omit<HTMLButtonAttributes, keyof BaseProps>;

  type AnchorProps = BaseProps & {
    href: string;
  } & Omit<HTMLAnchorAttributes, keyof BaseProps>;

  type Props = ButtonProps | AnchorProps;

  let {
    variant = 'default',
    size = 'default',
    class: className,
    children,
    ...restProps
  }: Props = $props();
</script>

{#if 'href' in restProps}
  <a {...restProps} href={restProps.href} class={cn(buttonVariants({ variant, size }), className)}>
    {@render children()}
  </a>
{:else}
  <ButtonPrimitive.Root {...restProps} class={cn(buttonVariants({ variant, size }), className)}>
    {@render children()}
  </ButtonPrimitive.Root>
{/if}
