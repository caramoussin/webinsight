---
description: How to write unit tests for services in WebInsight
---

# Writing Unit Tests for WebInsight Services

This workflow provides guidance on creating effective unit tests for Effect-based services in WebInsight, based on our experience with the RSS service tests and other service implementations.

## 1. File Naming and Location

- Unit test files should be located in a directory structure mirroring the service's path within `src/lib/services/`
- Place tests under `src/tests/unit/services/`
- For a service at `src/lib/services/<feature_area>/<ServiceName>.ts`, its test file should be at `src/tests/unit/services/<feature_area>/<ServiceName>.test.ts`

## 2. Imports and Setup

```typescript
// Import testing utilities from vitest
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';

// Import Effect utilities
import { Effect as E, Either, pipe, Layer } from 'effect';

// Import the service and related types
import { 
  ServiceTag, 
  ServiceLive, 
  ServiceError, 
  type Service 
} from '$lib/services/path/to/service';

// Import dependencies that need to be mocked
import { DependencyTag } from '$lib/services/path/to/dependency';
```

## 3. Mocking Dependencies

### 3.1 External Libraries

For external libraries, use `vi.mock()` at the top level:

```typescript
// Mock external libraries
vi.mock('rss-parser', () => ({
  default: vi.fn().mockImplementation(() => ({
    parseURL: vi.fn()
  }))
}));
```

### 3.2 Internal Services

For internal services that your service depends on:

```typescript
// Create mock implementations
const mockDependencyService = {
  method1: vi.fn(),
  method2: vi.fn()
};

// Create mock layers
const DependencyMockLive = Layer.succeed(DependencyTag, mockDependencyService);

// Provide mock layers to the service under test
const testLayer = ServiceLive.pipe(Layer.provide(DependencyMockLive));
```

## 4. Test Structure

```typescript
describe('ServiceName', () => {
  let service: Service;
  
  // Setup before each test
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get the service instance
    service = await E.runPromise(
      E.provide(E.Service(ServiceTag), testLayer)
    );
  });
  
  // Cleanup after each test
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('methodName', () => {
    // Test cases for the method
  });
});
```

## 5. Testing Success Scenarios

```typescript
it('should successfully perform the expected action', async () => {
  // Arrange: Set up test data and mock returns
  const testInput = { /* test input data */ };
  const expectedOutput = { /* expected output data */ };
  mockDependencyService.method1.mockReturnValue(E.succeed(someValue));
  
  // Act: Call the service method
  const result = await E.runPromise(service.methodName(testInput));
  
  // Assert: Verify the result and interactions
  expect(result).toEqual(expectedOutput);
  expect(mockDependencyService.method1).toHaveBeenCalledWith(expectedArgs);
});
```

## 6. Testing Error Scenarios

```typescript
it('should handle errors appropriately', async () => {
  // Arrange: Set up mocks to return errors
  const testError = new Error('Test error');
  mockDependencyService.method1.mockReturnValue(E.fail(testError));
  
  // Act: Call the service method with Either to properly handle errors
  const result = await E.runPromise(E.either(service.methodName(testInput)));
  
  // Assert: Verify the error result
  expect(Either.isLeft(result)).toBe(true);
  
  if (Either.isLeft(result)) {
    const error = result.left;
    expect(error).toBeInstanceOf(ExpectedErrorType);
    expect(error.message).toBe('Expected error message');
    expect(error.cause).toBe(testError);
  }
});
```

## 7. Testing with Effect Pipe Pattern

For more complex tests using the Effect pipe pattern:

```typescript
it('should process data correctly', async () => {
  // Setup test data
  const testInput = { /* test input data */ };
  
  // Run the test using pipe
  const result = await pipe(
    service.methodName(testInput),
    E.tap((result) => E.sync(() => {
      // Make assertions on the result
      expect(result).toEqual(expectedOutput);
    })),
    E.runPromise
  );
  
  // Additional assertions if needed
  expect(mockDependencyService.method1).toHaveBeenCalledWith(expectedArgs);
});
```

## 8. Common Patterns and Gotchas

### 8.1 Handling FiberFailure

When testing for specific error types, remember that errors are often wrapped in `FiberFailure`. Use proper type checking:

```typescript
if (Either.isLeft(result)) {
  const error = result.left;
  
  // Check if the error is an instance of the expected error type
  expect(error instanceof ExpectedErrorType).toBe(true);
  
  // Or use a more robust check
  expect(error.message).toContain('Expected error message');
}
```

### 8.2 Using E.Service Instead of E.provide

Prefer using `E.Service(ServiceTag)` over `E.provide` when possible for better type inference:

```typescript
// Preferred approach
service = await E.runPromise(E.provide(E.Service(ServiceTag), testLayer));

// Alternative approach
service = await E.runPromise(E.provide(ServiceTag, ServiceLive));
```

### 8.3 Testing Warning Logs

When testing warning logs, be aware that mocking `E.logWarning` can be tricky. The RSS service tests show that we can verify warning behavior by checking the actual effects rather than spying on the log function.

## 9. Running Tests

Run all unit tests:

```bash
bun test:unit
```

Run specific test files:

```bash
bun test:unit src/tests/unit/services/feature-area/service-name.test.ts
```

## 10. Real Examples

For complete examples of Effect-based service tests, refer to:

- `src/tests/unit/services/rss/parsing.test.ts` - Testing RSS parsing service with external dependencies
- `src/tests/unit/services/rss/processing.test.ts` - Testing a service with multiple dependencies and complex error handling
- `src/tests/unit/services/scraper/MCPCrawl4AIClient.test.ts` - Testing MCP client interactions
