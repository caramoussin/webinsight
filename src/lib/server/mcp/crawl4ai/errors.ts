import { ServiceError } from '../../../utils/effect';

/**
 * Error types for the Crawl4AI MCP Provider
 *
 * This file defines typed error classes for different failure scenarios
 * that can occur when interacting with the Crawl4AI service through MCP.
 */

// Base error class for Crawl4AI MCP errors
export class Crawl4AIMCPError extends ServiceError {
  constructor(code: string, message: string, cause?: unknown) {
    super({ code: `CRAWL4AI_MCP_${code}`, message, cause });
  }
}

// Error for when the Python service is unavailable or returns an error
export class Crawl4AIServiceError extends Crawl4AIMCPError {
  constructor(message: string, cause?: unknown) {
    super('SERVICE_ERROR', message, cause);
  }
}

// Error for extraction failures
export class ExtractionError extends Crawl4AIMCPError {
  constructor(message: string, cause?: unknown) {
    super('EXTRACTION_ERROR', message, cause);
  }
}

// Error for robots.txt check failures
export class RobotsTxtError extends Crawl4AIMCPError {
  constructor(message: string, cause?: unknown) {
    super('ROBOTS_TXT_ERROR', message, cause);
  }
}

// Error for invalid parameters
export class InvalidParametersError extends Crawl4AIMCPError {
  constructor(message: string, cause?: unknown) {
    super('INVALID_PARAMETERS', message, cause);
  }
}

// Error for when the tool or resource is not found
export class NotFoundError extends Crawl4AIMCPError {
  constructor(message: string) {
    super('NOT_FOUND', message);
  }
}

// Error for configuration issues
export class ConfigurationError extends Crawl4AIMCPError {
  constructor(message: string) {
    super('CONFIGURATION_ERROR', message);
  }
}
