# Crawl4AI Service Refactoring to MCP

Refactor the existing `Crawl4AIClient.ts` integration to align with the Model Context Protocol (MCP) pattern, standardizing the interface for web content extraction within the WebInsight application using Effect TS. This involves creating an MCP _server_ component within our SvelteKit backend that exposes Crawl4AI's capabilities as MCP Tools/Resources.

## Completed Tasks

- [x] **Analyze MCP TypeScript SDK**: Review `modelcontextprotocol/typescript-sdk` for patterns (server implementation, context handling).
- [x] **Analyze Project MCP Host**: Locate and review the existing MCP host implementation (`src/lib/server/mcp/host.ts` or similar) to understand provider registration and Resource handling.
- [x] **Review Effect TS Rule**: Fetch and analyze the `effect-ts` rule (`@effect-ts.mdc`) for project-specific patterns.
- [x] **Analyze Existing `Crawl4AIClient.ts`**: Review current functionality (`extractContent`, `checkRobotsTxt`).
- [x] **Analyze Python Service API**: Review `services/Crawl4AI/README.md` for `/extract` and `/robots-check` details.
- [x] **Define MCP Capabilities**:
  - [x] Decide on `extractContent` (Tool) vs. `checkRobotsTxt` (Tool or Resource) based on MCP host patterns.
  - [x] Define precise input and output schemas using Effect Schema for chosen capabilities.
- [x] **Implement MCP Server Logic**: Create the provider in `src/lib/server/mcp/crawl4ai`.
  - [x] Implement required MCP methods (`listTools`, `callTool`).
  - [x] Integrate with Effect TS: Use `effectFetch`, manage dependencies, handle configuration (service URL), implement robust, typed error handling mapping Python service errors.
  - [x] Use defined Effect Schemas for input validation and output shaping.
  - [x] Finalize service implementation and fix type issues.
- [x] **Add Unit Tests**: Add unit tests for provider logic (including Effect error channels) in `src/tests/unit/server/mcp/crawl4ai/`.
- [x] **Integration Testing**: Add integration tests for the end-to-end MCP flow (Client -> Host -> Server -> Python Service), covering happy paths and edge cases (timeouts, invalid URLs, robots denial).

## Completed Tasks (Documentation)

- [x] **Documentation Updates**:
  - [x] Update `architecture.md` with the new MCP architecture.
  - [x] Update `technical-specs.md` with details on the Tool/Resource decisions.
  - [x] Update `status.md` to reflect completion percentage.
  - [x] Update `work-in-progress.md` to include this integration.

## Completed Tasks (Implementation)

- [x] **Analyze MCP TypeScript SDK**: Review `modelcontextprotocol/typescript-sdk` for patterns (server implementation, context handling).
- [x] **Analyze Project MCP Host**: Locate and review the existing MCP host implementation (`src/lib/server/mcp/host.ts` or similar) to understand provider registration and Resource handling.
- [x] **Review Effect TS Rule**: Fetch and analyze the `effect-ts` rule (`@effect-ts.mdc`) for project-specific patterns.
- [x] **Analyze Existing `Crawl4AIClient.ts`**: Review current functionality (`extractContent`, `checkRobotsTxt`).
- [x] **Analyze Python Service API**: Review `services/Crawl4AI/README.md` for `/extract` and `/robots-check` details.
- [x] **Define MCP Capabilities**:
  - [x] Decide on `extractContent` (Tool) vs. `checkRobotsTxt` (Tool or Resource) based on MCP host patterns.
  - [x] Define precise input and output schemas using Effect Schema for chosen capabilities.
- [x] **Implement MCP Server Logic**: Create the provider in `src/lib/server/mcp/crawl4ai`.
  - [x] Implement required MCP methods (`listTools`, `callTool`).
  - [x] Integrate with Effect TS: Use `effectFetch`, manage dependencies, handle configuration (service URL), implement robust, typed error handling mapping Python service errors.
  - [x] Use defined Effect Schemas for input validation and output shaping.
  - [x] Finalize service implementation and fix type issues.
- [x] **Add Unit Tests**: Add unit tests for provider logic (including Effect error channels) in `src/tests/unit/server/mcp/crawl4ai/`.
- [x] **Integration Testing**: Add integration tests for the end-to-end MCP flow (Client -> Host -> Server -> Python Service), covering happy paths and edge cases (timeouts, invalid URLs, robots denial).
- [x] **Implement MCP Host**: Create a new MCP host implementation in SvelteKit backend.
  - [x] Design the host interface based on the MCP protocol requirements.
  - [x] Implement provider registration mechanism.
  - [x] Create API endpoints for tool discovery and execution.
  - [x] Add configuration management for MCP providers.
- [x] **Integrate Crawl4AI Provider**: Register the Crawl4AI MCP provider with the new host.
- [x] **Refactor Client Usage**: Create MCP-based client and adapter for transitioning from `Crawl4AIClient.ts`.
- [x] **Linter Errors**: Address TypeScript linter errors in related files.

## Future Tasks

- [ ] **Test MCP Client and Host**: Ensure the MCP client functions correctly and handles errors.
- [ ] **Application Code Integration**: Integrate the MCP-based Crawl4AI client into application code.
- [ ] **Additional MCP Providers**: Implement additional MCP providers for other services.
- [ ] **MCP Host Enhancements**: Add features like provider configuration management and caching.

## Implementation Plan

1. **Analysis & Definition**: Complete the initial analysis tasks.
2. **Implement Provider**: Create the MCP server logic within SvelteKit backend.
   - Use Effect TS extensively for HTTP calls, error handling, schema validation (`effectFetch`, `validateWithSchema`).
   - Manage configuration (e.g., `CRAWL4AI_URL` via env vars) within the Effect context.
3. **Unit Test Provider**: Add unit tests for the provider logic.
4. **Integration Test**: Implement comprehensive integration tests.
   - Create mock Express server to simulate Python backend.
   - Test happy paths and error cases for all MCP tools.
   - Verify end-to-end workflows with proper error handling.
5. **Implement MCP Host**: Create the central MCP host that will manage all providers.
   - Design the host interface based on MCP protocol standards.
   - Implement provider registration and discovery mechanisms.
   - Create API endpoints for tool execution.
6. **Integrate & Refactor**: Wire up the provider and update client code.
   - Create MCP-based client with the same API as the original.
   - Implement adapter for gradual migration.
7. **Fix Linter Errors**: Clean up any related linter issues.
8. **Document**: Update project documentation (`architecture.md`, `technical-specs.md`, `status.md`, `work-in-progress.md`) reflecting the changes and decisions made.
   - Manage configuration (e.g., `CRAWL4AI_URL` via env vars) within the Effect context. ✅

### Relevant Files

- `src/lib/services/scraper/Crawl4AIClient.ts` - Existing client (to be potentially deprecated/removed).
- `src/lib/server/mcp/crawl4ai/` - **(Created)** Provider implementation.
  - `index.ts` / `service.ts` / `schemas.ts` / `errors.ts` - Provider logic, schemas, custom errors.
- `src/lib/server/mcp/host.ts` - **(Created)** Main MCP host implementation.
- `src/lib/server/mcp/crawl4ai/provider.ts` - **(Created)** Crawl4AI provider adapter.
- `src/routes/api/mcp/+server.ts` - **(Created)** MCP API endpoints.
- `src/routes/api/mcp/crawl4ai/+server.ts` - **(Created)** Crawl4AI-specific API endpoints.
- `src/lib/services/scraper/MCPCrawl4AIClient.ts` - **(Created)** MCP-based Crawl4AI client.
- `src/lib/services/scraper/crawl4ai-adapter.ts` - **(Created)** Adapter for transitioning from original client.
- `.cursor/rules/effect-ts.mdc` - **(Reviewed)** Effect TS specific rules.
- `src/lib/utils/effect.ts` - Core Effect utilities.
- `services/Crawl4AI/README.md` - Python service API reference.
- `documentation/` - Files to be updated.
- `src/tests/unit/server/mcp/crawl4ai/` - **(Created)** Unit test directory.
- `src/tests/integration/server/mcp/crawl4ai/` - **(Created)** Integration test directory.
- `documentation/task-lists/crawl4ai-mcp-task-list.md` - This file.
