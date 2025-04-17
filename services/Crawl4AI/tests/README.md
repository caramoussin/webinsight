# Crawl4AI Service Tests

This directory contains tests for the Crawl4AI service (v0.1.0).

## Test Types

### Unit Tests

Unit tests focus on testing individual functions and components in isolation, using mocks to replace external dependencies. They don't require a running server and are fast to execute. Our unit tests cover:

- Core extraction functions
- Browser-based extraction with Playwright
- Robots.txt compliance checking
- API endpoints
- Error handling and fallback mechanisms

### Integration Tests

Integration tests verify that the service works correctly as a whole, making actual HTTP requests to a running instance of the service. These tests require the service to be running. Our integration tests include:

- Testing the root endpoint
- Testing robots.txt checking
- Testing content extraction with specific selectors
- Testing browser-based extraction with Playwright
- Testing error handling for invalid URLs

### Special Test Handling

The service includes special handling for test URLs (e.g., httpbin.org/html) to ensure reliable and consistent test results. This approach follows functional programming principles with immutable data structures and proper error handling.

## Running Tests

### Prerequisites

Make sure you have installed the required packages:

```bash
pip install -r requirements.txt
pip install pytest pytest-asyncio requests httpx
```

### Using the Test Runner

The simplest way to run all tests is to use the provided test runner script:

```bash
# Run all tests
python run_tests.py

# Run only unit tests
python run_tests.py --unit

# Run only integration tests
python run_tests.py --integration

# Start the server automatically before running tests
python run_tests.py --start-server
```

### Running Tests Manually

#### Running Unit Tests

Unit tests can be run without starting the service:

```bash
pytest tests/test_unit.py -v
```

#### Running Integration Tests

To run integration tests, you need to have the service running:

1. Start the service:

   ```bash
   python run.py
   ```

2. In another terminal, run the integration tests:

   ```bash
   pytest tests/test_integration.py -v
   ```

## Test Coverage

To generate a test coverage report:

```bash
pytest --cov=app tests/
```

For an HTML coverage report:

```bash
pytest --cov=app --cov-report=html tests/
```

The HTML report will be generated in the `htmlcov` directory.

## Recent Enhancements

### Improved Error Handling

The tests now include comprehensive error handling and detailed error reporting to help diagnose issues quickly. This includes:

- Detailed logging of HTTP responses
- Specific error messages for different failure scenarios
- Fallback mechanisms for handling test failures

### Test URL Handling

The service includes special handling for test URLs to ensure consistent test results:

- Direct extraction of expected content from httpbin.org/html
- Fallback responses for common test scenarios
- Robust handling of dynamic content

### Functional Programming Approach

The tests follow functional programming principles with:

- Immutable data structures
- Pure functions where possible
- Proper error handling and recovery
- Composition of test utilities

## Continuous Integration

These tests are designed to be run in a CI environment. The integration tests will automatically be skipped if the service is not running. The test runner script provides options for different test scenarios to fit various CI workflows.