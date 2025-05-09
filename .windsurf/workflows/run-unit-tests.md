---
description: Run unit tests for WebInsight
---

# Run Unit Tests

This workflow helps you run unit tests for the WebInsight project using Bun.

## Basic Usage

### Run all unit tests

// turbo

```bash
bun test:unit
```

### Run specific test file(s)

// turbo

```bash
bun test:unit src/tests/unit/path/to/your/test.ts
```

### Run tests with watch mode (for development)

// turbo

```bash
bun test:unit:watch
```

### Run tests with coverage

// turbo

```bash
bun test:unit:coverage
```

## Debugging Tests

If you encounter failing tests, you can run them in watch mode to debug more effectively:

```bash
bun test:unit:watch src/tests/unit/path/to/failing/test.ts
```

This will rerun the tests whenever you make changes to your code.

## Notes

- The tests use Vitest as the test runner
- Effect-based tests use `pipe` and `E.gen` for handling effects
- Mock implementations should use `vi.fn()` and `vi.mock()`
- For type assertions with Effect, use `as Effect.Effect<ResultType, ErrorType>`
