import { z } from 'zod';
import { type Either, left, right } from 'fp-ts/Either';

// Define schemas for MCP configuration and responses
const MCPConnectionConfigSchema = z.object({
	url: z.string().url('Invalid MCP server URL'),
	vendor: z.enum(['ollama', 'openai', 'anthropic', 'local']),
	model: z.string(),
	apiKey: z.string().optional(),
	timeout: z.number().min(1000).max(60000).default(30000)
});

const MCPPatternConfigSchema = z.object({
	name: z.string(),
	systemPrompt: z.string().optional(),
	userPrompt: z.string().optional(),
	temperature: z.number().min(0).max(2).default(0.7),
	maxTokens: z.number().min(1).max(8192).default(2048)
});

const MCPResponseSchema = z.object({
	content: z.string(),
	metadata: z.record(z.string(), z.unknown()).optional(),
	usage: z
		.object({
			promptTokens: z.number().optional(),
			completionTokens: z.number().optional(),
			totalTokens: z.number().optional()
		})
		.optional()
});

// Error types
export type MCPError = {
	code: string;
	message: string;
	details?: unknown;
};

/**
 * MCP (Model Context Protocol) client for connecting to Fabric AI patterns and LLMs
 * Follows functional programming principles with pure functions and Either types for error handling
 */
export class MCPClient {
	/**
	 * Execute a Fabric pattern via MCP
	 * @param patternName Name of the Fabric pattern to execute
	 * @param input Input content to process with the pattern
	 * @param connectionConfig MCP connection configuration
	 * @param patternConfig Optional pattern-specific configuration
	 * @returns Either an error or the MCP response
	 */
	static async executePattern(
		patternName: string,
		input: string,
		connectionConfig: z.infer<typeof MCPConnectionConfigSchema>,
		patternConfig?: z.infer<typeof MCPPatternConfigSchema>
	): Promise<Either<MCPError, z.infer<typeof MCPResponseSchema>>> {
		try {
			const validatedConnection = MCPConnectionConfigSchema.parse(connectionConfig);

			// Construct MCP URL for pattern execution
			const mcpUrl = this.constructMCPUrl(
				validatedConnection.url,
				patternName,
				validatedConnection.model
			);

			// Prepare request payload
			const payload = {
				input,
				model: validatedConnection.model,
				vendor: validatedConnection.vendor,
				temperature: patternConfig?.temperature || 0.7,
				max_tokens: patternConfig?.maxTokens || 2048,
				system_prompt: patternConfig?.systemPrompt,
				user_prompt: patternConfig?.userPrompt
			};

			// Execute MCP request
			const response = await fetch(mcpUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(validatedConnection.apiKey
						? { Authorization: `Bearer ${validatedConnection.apiKey}` }
						: {})
				},
				body: JSON.stringify(payload),
				signal: AbortSignal.timeout(validatedConnection.timeout)
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
				return left({
					code: `HTTP_${response.status}`,
					message: errorData.detail || `HTTP error ${response.status}`,
					details: errorData
				});
			}

			const data = await response.json();
			const validatedData = MCPResponseSchema.parse(data);

			return right(validatedData);
		} catch (error) {
			if (error instanceof z.ZodError) {
				return left({
					code: 'VALIDATION_ERROR',
					message: 'Invalid MCP configuration',
					details: error.format()
				});
			}

			if (error instanceof Error) {
				if (error.name === 'AbortError') {
					return left({
						code: 'TIMEOUT',
						message: 'MCP request timed out',
						details: error
					});
				}

				return left({
					code: 'REQUEST_ERROR',
					message: error.message,
					details: error
				});
			}

			return left({
				code: 'UNKNOWN_ERROR',
				message: 'An unknown error occurred',
				details: error
			});
		}
	}

	/**
	 * Execute a sequence of Fabric patterns via MCP
	 * @param patterns Array of pattern names to execute in sequence
	 * @param input Initial input content
	 * @param connectionConfig MCP connection configuration
	 * @param patternConfigs Optional pattern-specific configurations
	 * @returns Either an error or the final MCP response
	 */
	static async executePatternSequence(
		patterns: string[],
		input: string,
		connectionConfig: z.infer<typeof MCPConnectionConfigSchema>,
		patternConfigs?: Record<string, z.infer<typeof MCPPatternConfigSchema>>
	): Promise<Either<MCPError, z.infer<typeof MCPResponseSchema>>> {
		try {
			let currentInput = input;
			let finalResult: Either<MCPError, z.infer<typeof MCPResponseSchema>> | null = null;

			// Execute patterns in sequence, piping output to input
			for (const pattern of patterns) {
				const config = patternConfigs?.[pattern];
				const result = await this.executePattern(pattern, currentInput, connectionConfig, config);

				// If any pattern execution fails, return the error
				if ('left' in result) {
					return result;
				}

				// Update input for next pattern with output from current pattern
				currentInput = result.right.content;
				finalResult = result;
			}

			// Return the result of the final pattern execution
			if (!finalResult) {
				return left({
					code: 'SEQUENCE_ERROR',
					message: 'Pattern sequence execution failed: no patterns executed',
					details: { patterns }
				});
			}

			return finalResult;
		} catch (error) {
			if (error instanceof Error) {
				return left({
					code: 'SEQUENCE_ERROR',
					message: error.message,
					details: error
				});
			}

			return left({
				code: 'UNKNOWN_ERROR',
				message: 'An unknown error occurred during pattern sequence execution',
				details: error
			});
		}
	}

	/**
	 * Construct an MCP URL for pattern execution
	 * @param baseUrl Base MCP server URL
	 * @param patternName Name of the Fabric pattern
	 * @param model Model name
	 * @returns Constructed MCP URL
	 */
	private static constructMCPUrl(baseUrl: string, patternName: string, model: string): string {
		// Remove trailing slash if present
		const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

		// Construct MCP URL in the format: mcp://server/pattern?model=model_name
		return `${normalizedBaseUrl}/patterns/${patternName}?model=${encodeURIComponent(model)}`;
	}

	/**
	 * Check if an MCP server is available
	 * @param connectionConfig MCP connection configuration
	 * @returns Either an error or a boolean indicating availability
	 */
	static async checkServerAvailability(
		connectionConfig: z.infer<typeof MCPConnectionConfigSchema>
	): Promise<Either<MCPError, boolean>> {
		try {
			const validatedConnection = MCPConnectionConfigSchema.parse(connectionConfig);

			// Ping the MCP server health endpoint
			const response = await fetch(`${validatedConnection.url}/health`, {
				method: 'GET',
				headers: {
					...(validatedConnection.apiKey
						? { Authorization: `Bearer ${validatedConnection.apiKey}` }
						: {})
				},
				signal: AbortSignal.timeout(5000) // Short timeout for health check
			});

			return right(response.ok);
		} catch (error) {
			if (error instanceof Error) {
				return left({
					code: 'AVAILABILITY_CHECK_ERROR',
					message: error.message,
					details: error
				});
			}

			return left({
				code: 'UNKNOWN_ERROR',
				message: 'An unknown error occurred during availability check',
				details: error
			});
		}
	}

	/**
	 * List available patterns on an MCP server
	 * @param connectionConfig MCP connection configuration
	 * @returns Either an error or an array of pattern names
	 */
	static async listPatterns(
		connectionConfig: z.infer<typeof MCPConnectionConfigSchema>
	): Promise<Either<MCPError, string[]>> {
		try {
			const validatedConnection = MCPConnectionConfigSchema.parse(connectionConfig);

			// Request patterns list from MCP server
			const response = await fetch(`${validatedConnection.url}/patterns`, {
				method: 'GET',
				headers: {
					...(validatedConnection.apiKey
						? { Authorization: `Bearer ${validatedConnection.apiKey}` }
						: {})
				},
				signal: AbortSignal.timeout(validatedConnection.timeout)
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
				return left({
					code: `HTTP_${response.status}`,
					message: errorData.detail || `HTTP error ${response.status}`,
					details: errorData
				});
			}

			const data = await response.json();
			return right(data.patterns || []);
		} catch (error) {
			if (error instanceof Error) {
				return left({
					code: 'PATTERN_LIST_ERROR',
					message: error.message,
					details: error
				});
			}

			return left({
				code: 'UNKNOWN_ERROR',
				message: 'An unknown error occurred while listing patterns',
				details: error
			});
		}
	}
}

// Example usage with functional error handling
export async function exampleMCPPatternExecution() {
	const result = await MCPClient.executePattern(
		'summarize',
		'This is a long article about artificial intelligence and its impact on society...',
		{
			url: 'http://localhost:11434',
			vendor: 'ollama',
			model: 'llama2',
			timeout: 30000
		},
		{
			name: 'summarize',
			temperature: 0.5,
			maxTokens: 1024
		}
	);

	// Use proper Either handling
	if ('left' in result) {
		// Handle error case
		const error = result.left;
		console.error('Pattern execution failed:', error.message);
		return { success: false, error };
	} else {
		// Handle success case
		const data = result.right;
		console.log('Pattern execution successful');
		return { success: true, data };
	}
}
