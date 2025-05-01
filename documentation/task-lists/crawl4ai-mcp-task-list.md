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

## Current Tasks

- [x] **Test MCPCrawl4AIClient**: The MCP-based Crawl4AI client has comprehensive tests in place.
  - [x] Tests use proper mocks that reflect the MCP infrastructure.
  - [x] All client methods are tested: `extractContent`, `checkRobotsTxt`, and helper methods.
  - [x] Error handling and validation scenarios are covered.
  - [x] The test suite provides good coverage of the client implementation.

- [x] **Enhance MCPCrawl4AIClient Implementation**: Improved the implementation with the following enhancements:
  - [x] Optimized schema usage by converting runtime-only schemas to TypeScript types
  - [x] Fixed linting errors related to schemas that were only used for type inference
  - [x] Improved type safety in API calls with proper typing
  - [x] Integrated with WebScrapingService for seamless usage

- [ ] **Further Enhance MCPCrawl4AIClient Tests**: Consider adding the following test enhancements:
  - [ ] Add tests for edge cases like network timeouts.
  - [ ] Test with more complex extraction schemas and selector configurations.
  - [ ] Add tests for specific error types from the MCP service.
  - [ ] Test integration with the actual MCP host in an integration test.

## Future Tasks

- [x] **Application Code Integration**: Integrate the MCP-based Crawl4AI client into application code.
  - [x] Successfully integrated MCPCrawl4AIClient with WebScrapingService
  - [x] Updated all tests to use the new MCP-based client
  - [x] Ensured backward compatibility with existing code patterns

- [ ] **Effect Library Migration**: Migrate from deprecated `@effect/*` packages to the unified core `effect` library.
  - [ ] Update all imports from `@effect/io/Effect` to `effect/Effect`
  - [ ] Update all imports from `@effect/data/Function` to `effect/Function`
  - [ ] Update all imports from `@effect/schema/Schema` to `effect/Schema`
  - [ ] Update all imports from `@effect/data/Duration` to `effect/Duration`
  - [ ] Update all imports from `@effect/data/Context` to `effect/Context`
  - [ ] Update all imports from `@effect/data/Option` to `effect/Option`
  - [ ] Keep imports from `@effect/vitest` as they are still valid
  - [ ] Update package.json to remove deprecated `@effect/*` dependencies
  - [ ] Move `effect` from devDependencies to dependencies in package.json

- [ ] **Official MCP TypeScript SDK Integration**: Implement a new MCP solution from scratch using the official SDK with Effect integration.
  - [ ] **Setup Phase**:
    - [ ] Install the official SDK: `bun install @modelcontextprotocol/sdk`
    - [ ] Set up project structure for SDK-first approach
    - [ ] Create core Effect wrappers for MCP server and transport
    - [ ] Implement dependency injection using Effect Context
  - [ ] **Core Implementation Phase**:
    - [ ] Create McpServer with Effect integration (`src/lib/server/mcp/sdk/server.ts`)
    - [ ] Implement transport layer with Effect integration (`src/lib/server/mcp/sdk/transport.ts`)
    - [ ] Create provider registry with dependency injection (`src/lib/server/mcp/sdk/registry.ts`)
    - [ ] Set up SvelteKit API endpoints for the MCP server (`src/routes/api/mcp-sdk/+server.ts`)
  - [ ] **Crawl4AI Provider Implementation**:
    - [ ] Implement tool definitions with Effect integration (`src/lib/server/mcp/sdk/crawl4ai/tools.ts`)
    - [ ] Add resource definitions for new capabilities (`src/lib/server/mcp/sdk/crawl4ai/resources.ts`)
    - [ ] Create provider registration module (`src/lib/server/mcp/sdk/crawl4ai/provider.ts`)
    - [ ] Implement Effect-based MCP client (`src/lib/services/scraper/MCPCrawl4AIClient.ts`)
  - [ ] **Testing & Documentation**:
    - [ ] Create unit tests with Effect Vitest (`src/tests/unit/server/mcp/sdk/`)
    - [ ] Implement integration tests (`src/tests/integration/server/mcp/sdk/`)
    - [ ] Update technical documentation to reflect the new architecture
    - [ ] Create developer guide for working with the SDK-based implementation

- [ ] **Complete Application Code Migration**: Continue migrating remaining application code to use the new MCP-based client.
- [ ] **Additional MCP Providers**: Implement additional MCP providers for other services.
- [ ] **MCP Host Enhancements**: Add features like provider configuration management and caching.

## Implementation Plan

### Phase 1: Current Custom MCP Implementation (Completed)

1. **Analysis & Definition**: Complete the initial analysis tasks. ✅
2. **Implement Provider**: Create the MCP server logic within SvelteKit backend. ✅
   - Use Effect TS extensively for HTTP calls, error handling, schema validation (`effectFetch`, `validateWithSchema`). ✅
   - Manage configuration (e.g., `CRAWL4AI_URL` via env vars) within the Effect context. ✅
3. **Unit Test Provider**: Add unit tests for the provider logic. ✅
4. **Integration Test**: Implement comprehensive integration tests. ✅
   - Create mock Express server to simulate Python backend. ✅
   - Test happy paths and error cases for all MCP tools. ✅
   - Verify end-to-end workflows with proper error handling. ✅
5. **Implement MCP Host**: Create the central MCP host that will manage all providers. ✅
   - Design the host interface based on MCP protocol standards. ✅
   - Implement provider registration and discovery mechanisms. ✅
   - Create API endpoints for tool execution. ✅
6. **Integrate & Refactor**: Wire up the provider and update client code. ✅
   - Create MCP-based client with the same API as the original. ✅
   - Implement adapter for gradual migration. ✅
7. **Fix Linter Errors**: Clean up any related linter issues. ✅
8. **Document**: Update project documentation reflecting the changes and decisions made. ✅

### Phase 2: Effect Library Migration

1. **Update Dependencies**: Move from multiple `@effect/*` packages to the unified `effect` package.
   - Update package.json to remove deprecated dependencies.
   - Move `effect` from devDependencies to dependencies.
2. **Update Imports**: Refactor all imports to use the new package structure.
   - Update all import paths across the codebase.
   - Keep `@effect/vitest` imports as they are still valid.
3. **Test & Verify**: Ensure all functionality works correctly with the new imports.
   - Run unit and integration tests to verify functionality.
   - Fix any issues that arise from the migration.

### Phase 3: Official MCP TypeScript SDK Implementation (From Scratch)

1. **Setup & Core Architecture**:
   - Install the official SDK: `bun install @modelcontextprotocol/sdk`
   - Create core MCP server with Effect integration:

     ```typescript
     // src/lib/server/mcp/sdk/server.ts
     import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
     import { Effect } from "effect";
     
     export const createEffectMcpServer = () => {
       return Effect.sync(() => new McpServer({
         name: "WebInsight",
         version: "1.0.0"
       }));
     };
     ```

   - Implement transport layer with Effect wrappers:

     ```typescript
     // src/lib/server/mcp/sdk/transport.ts
     import { StreamableHttpServerTransport } from "@modelcontextprotocol/sdk/server/http.js";
     import { Effect } from "effect";
     
     export const createEffectTransport = (port: number) => {
       return Effect.sync(() => new StreamableHttpServerTransport({ port }));
     };
     ```

   - Create provider registry with dependency injection using Effect Context

2. **Crawl4AI Provider Implementation**:
   - Implement tool definitions with Effect integration:

     ```typescript
     // src/lib/server/mcp/sdk/crawl4ai/tools.ts
     server.tool(
       "extractContent",
       { url: z.string().url(), selectors: z.array(...).optional() },
       async ({ url, selectors }) => {
         const result = await Effect.runPromise(
           effectFetch(`${apiUrl}/extract`, {
             method: "POST",
             body: JSON.stringify({ url, selectors })
           })
         );
         return { content: [{ type: "application/json", text: JSON.stringify(result) }] };
       }
     );
     ```

   - Add resource definitions (new capability):

     ```typescript
     // src/lib/server/mcp/sdk/crawl4ai/resources.ts
     server.resource(
       "website-metadata",
       new ResourceTemplate("website://{domain}/metadata", { list: undefined }),
       async (uri, { domain }) => {
         const result = await Effect.runPromise(
           effectFetch(`${apiUrl}/metadata?domain=${domain}`)
         );
         return {
           contents: [{
             uri: uri.href,
             text: JSON.stringify(result),
             metadata: { contentType: "application/json" }
           }]
         };
       }
     );
     ```

   - Create provider registration module to wire everything together

3. **API & Client Integration**:
   - Set up SvelteKit API endpoints using the SDK's Streamable HTTP transport
   - Implement Effect-based MCP client that leverages the official SDK client
   - Create type-safe interfaces for all operations
   - Ensure proper error handling through Effect's error channels

4. **Testing & Documentation**:
   - Create unit tests with Effect Vitest
   - Implement integration tests for end-to-end validation
   - Update technical documentation to reflect the new architecture
   - Create developer guide for working with the SDK-based implementation

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
- `package.json` - To be updated for Effect library migration and MCP SDK installation.

### Files to Create (for Official MCP SDK Implementation)

#### Core SDK Integration

- `src/lib/server/mcp/sdk/` - Directory for official MCP SDK integration.
  - `server.ts` - MCP server implementation with Effect integration.

    ```typescript
    import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
    import { Effect } from "effect";
    
    export const createEffectMcpServer = () => {
      return Effect.sync(() => new McpServer({
        name: "WebInsight",
        version: "1.0.0"
      }));
    };
    ```

  - `transport.ts` - Transport adapters with Effect integration.

    ```typescript
    import { StreamableHttpServerTransport } from "@modelcontextprotocol/sdk/server/http.js";
    import { Effect } from "effect";
    
    export const createEffectTransport = (port: number) => {
      return Effect.sync(() => new StreamableHttpServerTransport({ port }));
    };
    ```

  - `registry.ts` - Provider registry with dependency injection.

    ```typescript
    import { Effect, Context } from "effect";
    import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
    
    export class McpServerService extends Context.Tag("McpServerService")<
      McpServerService,
      McpServer
    >() {}
    
    export const mcpServerLayer = Effect.layer.effect(
      McpServerService,
      Effect.gen(function* (_) {
        const server = yield* _(createEffectMcpServer());
        yield* _(registerProviders(server));
        return server;
      })
    );
    ```

#### Crawl4AI Provider

- `src/lib/server/mcp/sdk/crawl4ai/` - Crawl4AI provider using the official SDK.
  - `tools.ts` - Tool definitions with Effect integration.
  - `resources.ts` - Resource definitions (new capability).
  - `provider.ts` - Provider registration module.

#### API & Client

- `src/routes/api/mcp-sdk/+server.ts` - SvelteKit API endpoints using the SDK.
- `src/lib/services/scraper/MCPCrawl4AIClient.ts` - Effect-based MCP client.

#### Testing

- `src/tests/unit/server/mcp/sdk/` - Unit tests with Effect Vitest.
- `src/tests/integration/server/mcp/sdk/` - Integration tests.

#### Documentation

- `documentation/architecture.md` - Updated architecture documentation.
- `documentation/guides/mcp-sdk.md` - Developer guide for the SDK implementation.
