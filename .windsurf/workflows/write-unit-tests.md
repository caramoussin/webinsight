---
description: How to write unit tests for services in WebInsight
---

This workflow outlines the steps and best practices for writing unit tests for services within the WebInsight project, using `vitest` and `Effect-TS`. It is based on the patterns observed in existing tests like [MCPCrawl4AIClient.test.ts](cci:7://file:///home/soushi888/Projets/webinsight/src/tests/unit/services/scraper/MCPCrawl4AIClient.test.ts:0:0-0:0).

## 1. File Naming and Location

- Unit test files should be located in a directory structure mirroring the service's path within `src/lib/services/`.
- Place tests under `src/tests/unit/services/`.
- For a service at `src/lib/services/<feature_area>/<ServiceName>.ts`, its test file should be at `src/tests/unit/services/<feature_area>/<ServiceName>.test.ts`.

## 2. Test Structure (`vitest`)

- Use `describe` to group related tests for a service or a method.
- Use [it](cci:1://file:///home/soushi888/Projets/webinsight/src/lib/services/scraper/WebScrapingService.ts:150:2-236:3) for individual test cases.
- Utilize `beforeEach` to reset mocks or perform setup before each test.
- Utilize `afterEach` to clear mocks or perform cleanup after each test.

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('ServiceName', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Other setup if needed
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Other cleanup if needed
  });

  describe('methodName', () => {
    it('should behave correctly when X', async () => pipe(
      // tests logic
    )
  });
});


## 3. Running the tests

Once the tests are written and pass the linter, run them using the `bun test:unit` command.
