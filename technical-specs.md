* **Database**: SQLite with Drizzle ORM
* **Styling**: Tailwind CSS with shadcn-svelte components
* **Type Safety**: TypeScript, Effect functional programming
  - **Core Logic & Effects**: Utilizes Effect TS for managing side effects, asynchronous operations, error handling (typed errors), concurrency (Fibers), resource management (`Scope`, `Layer`), and dependency injection (`Context`, `Layer`).
  - **Validation**: Uses `@effect/schema` for robust, type-safe data validation and parsing, replacing Zod.
* **AI Core**: [Fabric](https://github.com/danielmiessler/fabric)'s pattern library, Model Context Protocol (MCP)
* **Web Scraping**: Crawl4AI (Python microservice with FastAPI & Playwright), Cheerio
* **Background Jobs**: Custom Scheduler (to be potentially integrated with Effect's scheduling capabilities)
- - Programming Paradigm: Functional programming with pure functions and immutable data structures
+ - Programming Paradigm: Functional programming centered around **Effect TS**. Emphasizes pure functions, immutable data structures, declarative composition of effects, typed error handling, and `Layer`-based dependency management.

### Frontend Stack

- - **Validation**: Zod
+ - **Validation**: `@effect/schema`
  - UI Components: shadcn-svelte

## Long-Term Vision 