---
trigger: model_decision
description: When working with typescript
globs:
---

# Effect TS Usage Guidelines

Effect TS is the primary tool for managing application logic, side effects, errors, and dependencies in WebInsight. Follow these guidelines:

- **Dependency Management**: Use `Layer` and `Context` for all dependency injection. Define service interfaces using `Context.Tag`.
  - Reference: [architecture.md](mdc:documentation/architecture.md) (Programming Paradigm section)
- **Data Validation**: Use Schema from `effect` for defining schemas and validating/parsing data (e.g., API responses, database results, configuration). **Do not use Zod.**
  - Reference: [technical-specs.md](mdc:documentation/technical-specs.md) (Type Safety section)
- **Error Handling**: Leverage Effect's typed error channel (`Effect<A, E, R>`). Define specific, typed errors for different failure domains (e.g., `NetworkError`, `DatabaseError`, `MCPError`, `ValidationError`, `DbError`, `ParseError`). Avoid throwing exceptions for expected errors.
  - Reference: [architecture.md](mdc:documentation/architecture.md) (Error Handling section)
- **Resource Management**: Use `Scope` and `Layer` to manage resources like database connections, ensuring proper acquisition and release.
- **Asynchronous Operations**: Use Effect primitives (Fibers, `Effect.gen`, combinators) to handle async code declaratively.
- **Composition**: Build complex business logic by composing smaller, focused Effect workflows using functions like `pipe`, `Effect.gen`, `Effect.map`, `Effect.flatMap`, `Effect.all`, etc.
- **Services as Layers**: Implement all core services (e.g., FeedService, ScrapingService, ApiClientService, AI Agents) as Effect `Layer`s.
  - Reference: [architecture.md](mdc:documentation/architecture.md) (Core Services & AI Layer sections)
