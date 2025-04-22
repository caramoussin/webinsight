# Crawl4AI Service Refactoring to MCP

Refactor the existing `Crawl4AIClient.ts` integration to align with the Model Context Protocol (MCP) pattern, standardizing the interface for web content extraction within the WebInsight application using Effect TS. This involves creating an MCP *server* component within our SvelteKit backend that exposes Crawl4AI's capabilities as MCP Tools/Resources.

## Completed Tasks

- [x] **Analyze MCP TypeScript SDK**: Review `modelcontextprotocol/typescript-sdk` for patterns (server implementation, context handling).
- [x] **Analyze Project MCP Host**: Locate and review the existing MCP host implementation (`src/lib/server/mcp/host.ts` or similar) to understand provider registration and Resource handling.
- [x] **Review Effect TS Rule**: Fetch and analyze the `effect-ts` rule (`@effect-ts.mdc`) for project-specific patterns.
- [x] **Analyze Existing `Crawl4AIClient.ts`**: Review current functionality (`extractContent`, `checkRobotsTxt`).
- [x] **Analyze Python Service API**: Review `services/Crawl4AI/README.md` for `/extract` and `/robots-check` details.
- [x] **Define MCP Capabilities**:
    - [x] Decide on `extractContent` (Tool) vs. `checkRobotsTxt` (Tool or Resource) based on MCP host patterns.
    - [x] Define precise input and output schemas using Effect Schema for chosen capabilities.
- [x] **Implement MCP Server Logic**: Create the provider in `src/lib/server/mcp/providers/crawl4ai`.
    - [x] Implement required MCP methods (`listTools`, `callTool`).
    - [x] Integrate with Effect TS: Use `effectFetch`, manage dependencies, handle configuration (service URL), implement robust, typed error handling mapping Python service errors.
    - [x] Use defined Effect Schemas for input validation and output shaping.
    - [x] Finalize service implementation and fix type issues.
- [x] **Add Unit Tests**: Add unit tests for provider logic (including Effect error channels) in `src/tests/unit/server/mcp/providers/crawl4ai/`.

## In Progress Tasks (Integration & Testing)

- [ ] **Integrate MCP Provider**: Connect the provider to the main SvelteKit MCP host.
- [ ] **Integration Testing**: Add integration tests for the end-to-end MCP flow (Client -> Host -> Provider -> Python Service), covering happy paths and edge cases (timeouts, invalid URLs, robots denial).

## Future Tasks

- [ ] **Refactor Client Usage**: Update application code to use the MCP interface instead of `Crawl4AIClient.ts`.
- [ ] **Linter Errors**: Address any TypeScript linter errors in related files.
- [ ] **Documentation Updates**:
    - [ ] Update `architecture.md` & `technical-specs.md` (potentially with a diagram snippet for the provider). Explain the Tool/Resource decision for `checkRobotsTxt`.
    - [ ] Update `status.md` & `work-in-progress.md`.

## Implementation Plan

1.  **Analysis & Definition**: Complete the initial analysis tasks. ✅
2.  **Implement Provider**: Create the MCP server logic within SvelteKit backend. ✅
    *   Use Effect TS extensively for HTTP calls, error handling, schema validation (`effectFetch`, `validateWithSchema`). ✅
    *   Manage configuration (e.g., `CRAWL4AI_URL` via env vars) within the Effect context. ✅
3.  **Unit Test Provider**: Add unit tests for the provider logic. ✅
4.  **Integrate & Refactor**: Wire up the provider and update client code.
5.  **Integration Test**: Implement comprehensive integration tests.
6.  **Fix Linter Errors**: Clean up any related linter issues.
7.  **Document**: Update project documentation (`architecture.md`, `technical-specs.md`, `status.md`, `work-in-progress.md`) reflecting the changes and decisions made.

### Relevant Files

-   `src/lib/services/scraper/Crawl4AIClient.ts` - Existing client (to be potentially deprecated/removed).
-   `src/lib/server/mcp/providers/crawl4ai/` - **(Created)** Provider implementation.
    -   `index.ts` / `service.ts` / `schemas.ts` / `errors.ts` - Provider logic, schemas, custom errors.
-   `src/lib/server/mcp/host.ts` - **(To be located/verified)** Main MCP host.
-   `.cursor/rules/effect-ts.mdc` - **(Reviewed)** Effect TS specific rules.
-   `src/lib/utils/effect.ts` - Core Effect utilities.
-   `services/Crawl4AI/README.md` - Python service API reference.
-   `documentation/` - Files to be updated.
-   `src/tests/unit/server/mcp/providers/crawl4ai/` - **(Created)** Unit test directory.
-   `documentation/task-lists/crawl4ai-mcp.md` - This file.
