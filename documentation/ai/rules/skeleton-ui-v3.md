---
trigger: glob
globs: src/**/*.svelte
---

# Skeleton UI v3 Rules for Svelte

These rules guide the use of Skeleton UI v3 with Svelte, a design system built on Tailwind CSS, offering adaptive components optimized for SvelteKit and Svelte 5. This file emphasizes breaking changes from v2 to ensure proper code generation.

## General

- Skeleton UI v3 requires Tailwind CSS and is optimized for SvelteKit, with limited support for vanilla Svelte.
- It provides a uniform design language with enhanced customization via the Presets system and extended Tailwind utilities.
- v3 is in pre-release (as of May 2025), with ongoing component porting and a planned migration guide.
- v3 supports multiple frameworks (Svelte, React, Vue), unlike v2’s Svelte focus, using a framework-agnostic core with dedicated packages like `@skeletonlabs/skeleton-svelte`.

## Styling & UI

- Use Tailwind CSS utility classes, leveraging v3’s extended utilities for styling.
- Use Skeleton UI components for consistent, accessible UI elements.
- Follow the v3 design system for colors (shades 50–950), typography, and spacing. Refer to [Skeleton UI Documentation](https://next.skeleton.dev/docs/design).
- Generate new themes using the [theme generator](https://themes.skeleton.dev/), as v2 themes are incompatible.
- Use the Presets system instead of v2’s variant classes for component customization.

## Component Usage

- Import components from `@skeletonlabs/skeleton-svelte`, e.g., `import { ComponentName } from '@skeletonlabs/skeleton-svelte';`.
- Use components with props:
  - **Functional Props**: Control behavior, e.g., `open`, `src`.
  - **Style Props**: Customize with Tailwind classes, e.g., `background="bg-blue-500"`, `classes="border-4 border-green-500"`.
  - **Event Props**: Handle events, e.g., `on:click`, `on:keypress`.
- Use the `base` prop for style overrides, e.g., `<Component base="custom-base-styles">`.
- Use prefixed props (e.g., `imageBase`, `imageClasses`) for child elements, per component API documentation.
- Components leverage Svelte 5 features (runes, snippets) for enhanced reactivity and composition.

## Accessibility

- Ensure interactive elements are keyboard- and screen reader-accessible.
- Use semantic HTML elements to align with v3’s native-first philosophy.

## Project Structure

- Organize components and pages logically, following SvelteKit conventions.
- Configure Tailwind CSS to include Skeleton UI v3’s styles, per [installation guide](https://next.skeleton.dev/docs/get-started/installation).

## Breaking Changes from v2

- **Theme Incompatibility**: v2 themes are incompatible with v3. Use the [theme generator](https://themes.skeleton.dev/) to create new themes. v3 includes a limited set of built-in themes, with more planned.
- **Styling System**:
  - **Variant Classes Removed**: v2’s variant classes (e.g., `variant-filled`, `variant-soft`) are replaced by v3’s Presets system, requiring updates to component styling.
  - **Design Tokens Replaced**: v2’s design token classes (e.g., `surface`, `primary`) are replaced by extended Tailwind utility classes, necessitating a shift to Tailwind’s syntax.
  - **Color Palette Expansion**: v3 uses shades 50–950 (adding 950 for darker tones) vs. v2’s 50–900, potentially affecting theme aesthetics.
- **Svelte 5 Integration**: v3 components use Svelte 5 features (runes, snippets), breaking compatibility with v2’s components designed for earlier Svelte versions. Update component logic to use runes (e.g., `$state`, `$derived`) and snippets for rendering.
- **Lightswitch Component Removed**: v2’s Lightswitch for dark/light mode toggling is not included in v3. Use Tailwind’s dark mode utilities (e.g., `dark:bg-gray-800`) instead.
- **Component API Changes**:
  - Some v2 components are not yet ported to v3, requiring checks against the [v3 component list](https://next.skeleton.dev/docs/components).
  - Prop names and behaviors may differ; consult v3’s API references (pending for Svelte, available for React).
- **Framework-Agnostic Core**: v3’s modular architecture separates the core from framework-specific packages, unlike v2’s Svelte-centric design. Ensure imports use `@skeletonlabs/skeleton-svelte`.
- **Dark Mode Implementation**: v3 relies on Tailwind’s dark mode strategies, varying by framework, unlike v2’s unified Lightswitch approach.
- **Tailwind Configuration**: v3 requires updated Tailwind configuration to include Skeleton’s plugin and extended utilities, differing from v2’s simpler setup.
- **TypeScript Types**: v3 improves TypeScript support, but types may differ from v2, requiring updates to type definitions in Svelte components.

## Additional Notes

- Use Lucide icons via `import { IconName } from 'lucide-svelte';`.
- Refer to the [Skeleton UI Cookbook](https://next.skeleton.dev/docs/resources/cookbook) for practical examples.
- For migration, consult community resources (e.g., [GitHub Discussions](https://github.com/skeletonlabs/skeleton/discussions)) until the official v3 migration guide is released.
- For optimal support, use SvelteKit; vanilla Svelte is possible but not officially supported.
- Read the LLM doc of Skeleton UI v3 everytime you need to clarofy something : https://www.skeleton.dev/llms-svelte.txt
