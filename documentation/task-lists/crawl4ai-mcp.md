# Crawl4AI Service Refactoring to MCP

Refactor the existing `Crawl4AIClient.ts` integration to align with the Model Context Protocol (MCP) pattern, standardizing the interface for web content extraction within the WebInsight application using Effect TS. This involves creating an MCP *server* component within our SvelteKit backend that exposes Crawl4AI's capabilities as MCP Tools/Resources.

## Completed Tasks

- [ ] *No tasks completed yet.*

## In Progress Tasks

- [ ] **Analyze MCP TypeScript SDK**: Review `modelcontextprotocol/typescript-sdk` for patterns and best practices relevant to our Effect TS environment.
- [ ] **Define MCP Capabilities**: Specify which Crawl4AI features will be exposed as MCP Tools (`extractContent`) vs. Resources (`checkRobotsTxt`?). Use Effect Schema for definitions.
- [ ] Analyze existing `**Crawl4AIClient**.ts` functionality (`extractContent`, `checkRobotsTxt`).
- [ ] Analyze the underlying `Crawl4AI` Python service API (`/extract`, `/robots-check`) from `services/Crawl4AI/README.md`.

## Future Tasks

- [ ] **Implement MCP Server Logic**: Create a new service/module in `src/lib/server/mcp/providers/crawl4ai` (or similar) to act as the MCP server/provider for Crawl4AI. This will handle MCP requests and translate them into calls to the Python service.
    - [ ] Implement `listTools` to expose the extraction capability.
    - [ ] Implement `callTool` for the `extractContent` functionality.
    - [ ] Implement `listResources` (if applicable for `checkRobotsTxt`).
    - [ ] Implement `readResource` (if applicable for `checkRobotsTxt`).
    - [ ] Integrate with Effect TS for dependency management, error handling, and schema validation.
- [ ] **Integrate MCP Provider**: Connect the new Crawl4AI MCP provider into the main SvelteKit application/MCP host.
- [ ] **Refactor Client Usage**: Update parts of the application currently using `Crawl4AIClient.ts` to interact via the standardized MCP interface/client provided by the host application.
- [ ] **Testing**:
    - [ ] Add unit tests for the new MCP provider logic.
    - [ ] Add integration tests for the MCP interaction flow (Client -> Host -> Crawl4AI Provider -> Python Service).
- [ ] **Linter Errors**: Address TypeScript linter errors in `Crawl4AIClient.ts` (potentially resolved/obsoleted during refactoring or needs separate fix).
- [ ] **Documentation Updates**:
    - [ ] Update `architecture.md` & `technical-specs.md` with details on the MCP provider for Crawl4AI.
    - [ ] Update `status.md` & `work-in-progress.md` with the status of this refactoring.

## Implementation Plan

1.  **MCP SDK Review**: Familiarize with the `modelcontextprotocol/typescript-sdk` patterns, especially server implementation, context handling, and Effect TS integration (if examples exist).
2.  **Define Capabilities**: Decide the mapping:
    *   `extractContent` seems like a clear MCP **Tool** (performs action, has side effects like network calls, computation). Define its schema using Effect Schema.
    *   `checkRobotsTxt` could potentially be an MCP **Resource** (fetches data `robots.txt`, less computational). Define its schema. URI scheme could be `robots://check?url={url}&userAgent={ua}`.
3.  **Implement Provider**: Create the MCP server logic within the SvelteKit backend. This provider will:
    *   Implement the necessary MCP methods (`listTools`, `callTool`, potentially `listResources`, `readResource`).
    *   Use Effect TS for making HTTP calls to the *actual* Crawl4AI Python service (`http://localhost:8002`).
    *   Leverage `effectFetch` and `validateWithSchema` for robustness.
4.  **Integrate & Refactor**: Wire up the new provider within the SvelteKit app. Modify existing code that uses `Crawl4AIClient` to instead request the capability through the application's MCP host/client mechanism.
5.  **Test Thoroughly**: Implement unit and integration tests covering the provider logic and the end-to-end MCP flow.
6.  **Fix Linter Errors**: Address any remaining or new linter errors.
7.  **Document**: Update all relevant project documentation as outlined in the tasks.

### Relevant Files

-   `src/lib/services/scraper/Crawl4AIClient.ts` - Existing client (to be potentially deprecated/removed after refactor).
-   `src/lib/server/mcp/providers/crawl4ai/` - **(To be created)** Directory for the MCP provider implementation.
    -   `index.ts` / `service.ts` / `schemas.ts` - Files defining the provider logic, tools, resources, schemas.
-   `src/lib/server/mcp/host.ts` - (Likely exists or needs creation) The main MCP host within SvelteKit that manages providers.
-   `src/lib/utils/effect.ts` - Core Effect utilities, potentially used by the provider.
-   `services/Crawl4AI/README.md` - Reference for the Python service API.
-   `documentation/` - Files to be updated (`architecture.md`, `technical-specs.md`, `status.md`, `work-in-progress.md`).
-   `tests/server/mcp/providers/crawl4ai/` - **(To be created)** Directory for tests.
-   `documentation/task-lists/crawl4ai-mcp.md` - This file.
