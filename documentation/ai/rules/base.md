---
trigger: always_on
description:
globs:
---

# WebInsight Core Principles & Structure

This rule outlines the fundamental principles and structure of the WebInsight project.

## Core Technologies

- **Runtime**: Bun
- **Framework**: SvelteKit (Frontend + Backend)
- **Database**: SQLite (managed per-profile) with Drizzle ORM for schema/queries.
- **Core Logic**: Effect TS is central for managing effects, dependencies, errors, and validation. See [@effect-ts.mdc](mdc:.cursor/rules/effect-ts.mdc).
- **UI**: Tailwind CSS with shadcn-svelte components.
- **AI**: Fabric patterns via Model Context Protocol (MCP).

## Architecture

- **Local-First**: All core data and processing reside locally. See [project-overview.md](mdc:documentation/project-overview.md).
- **Profile-Based**: The application uses a "one profile, one database" model. Data is isolated per profile. See [@data-layer.mdc](mdc:.cursor/rules/data-layer.mdc).
- **Layered**: Follows standard frontend, backend, service, and data layers, detailed in [architecture.md](mdc:documentation/architecture.md).
- **Functional**: Emphasizes functional programming principles, heavily relying on Effect TS.

## Key Documentation

- Overview: [project-overview.md](mdc:documentation/project-overview.md)
- Requirements: [requirements.md](mdc:documentation/requirements.md) (The "What" and "Why")
- Architecture: [architecture.md](mdc:documentation/architecture.md) (The "How" - System Design)
- Technical Specs: [technical-specs.md](mdc:documentation/technical-specs.md) (The "How" - Foundation)
- Documentation Standards: See [@documentation.mdc](mdc:.cursor/rules/documentation.mdc).

Refer to the specific rules linked above for more detailed guidelines.
