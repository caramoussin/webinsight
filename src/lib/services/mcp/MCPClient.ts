import * as Effect from '@effect/io/Effect';
import * as S from '@effect/schema/Schema';
import { ServiceError, validateWithSchema, effectFetch } from '../../utils/effect';

// Define schemas for MCP configuration and responses
const MCPConnectionConfigSchema = S.Struct({
	url: S.String.pipe(S.pattern(/^https?:\/\/.+/)),
	vendor: S.Union(
		S.Literal('ollama'),
		S.Literal('openai'),
		S.Literal('anthropic'),
		S.Literal('local')
	),
	model: S.String,
	apiKey: S.optional(S.String),
	timeout: S.Number.pipe(S.between(1000, 60000))
});

const MCPPatternConfigSchema = S.Struct({
	name: S.String,
	systemPrompt: S.optional(S.String),
	userPrompt: S.optional(S.String),
	temperature: S.Number.pipe(S.between(0, 2)),
	maxTokens: S.Number.pipe(S.between(1, 8192))
});

const MCPResponseSchema = S.Struct({
	content: S.String,
	metadata: S.optional(S.Record({ key: S.String, value: S.Unknown })),
	usage: S.optional(
		S.Struct({
			promptTokens: S.optional(S.Number),
			completionTokens: S.optional(S.Number),
			totalTokens: S.optional(S.Number)
		})
	)
});

// Type inference from schemas
export type MCPConnectionConfig = S.Schema.Type<typeof MCPConnectionConfigSchema>;
export type MCPPatternConfig = S.Schema.Type<typeof MCPPatternConfigSchema>;
export type MCPResponse = S.Schema.Type<typeof MCPResponseSchema>;

/**
 * MCP (Model Context Protocol) client for connecting to Fabric AI patterns and LLMs
 */
export class MCPClient {
	private static constructMCPUrl(baseUrl: string, patternName: string, model: string): string {
		const url = new URL(`${baseUrl}/pattern/${patternName}`);
		url.searchParams.set('model', model);
		return url.toString();
	}

	/**
	 * Execute a Fabric pattern via MCP
	 */
	static executePattern(
		patternName: string,
		input: string,
		connectionConfig: MCPConnectionConfig,
		patternConfig?: MCPPatternConfig
	): Effect.Effect<never, ServiceError, MCPResponse> {
		return Effect.gen(function* ($) {
			// Validate connection config
			const validatedConnection = yield* $(
				validateWithSchema(MCPConnectionConfigSchema, connectionConfig)
			);

			// Validate pattern config if provided
			const validatedPatternConfig = patternConfig
				? yield* $(validateWithSchema(MCPPatternConfigSchema, patternConfig))
				: undefined;

			// Construct URL and prepare request
			const mcpUrl = MCPClient.constructMCPUrl(
				validatedConnection.url,
				patternName,
				validatedConnection.model
			);

			const payload = {
				input,
				model: validatedConnection.model,
				vendor: validatedConnection.vendor,
				temperature: validatedPatternConfig?.temperature ?? 0.7,
				max_tokens: validatedPatternConfig?.maxTokens ?? 2048,
				system_prompt: validatedPatternConfig?.systemPrompt,
				user_prompt: validatedPatternConfig?.userPrompt
			};

			// Make request and validate response
			const response = yield* $(
				effectFetch<unknown>(mcpUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						...(validatedConnection.apiKey
							? { Authorization: `Bearer ${validatedConnection.apiKey}` }
							: {})
					},
					body: JSON.stringify(payload),
					signal: AbortSignal.timeout(validatedConnection.timeout)
				})
			);

			return yield* $(
				validateWithSchema(MCPResponseSchema, response as S.Schema.Type<typeof MCPResponseSchema>)
			);
		});
	}

	/**
	 * Execute a sequence of Fabric patterns via MCP
	 */
	static executePatternSequence(
		patterns: string[],
		input: string,
		connectionConfig: MCPConnectionConfig,
		patternConfigs?: Record<string, MCPPatternConfig>
	): Effect.Effect<never, ServiceError, MCPResponse> {
		return Effect.gen(function* ($) {
			let currentInput = input;
			let finalResult: MCPResponse | null = null;

			for (const pattern of patterns) {
				const config = patternConfigs?.[pattern];
				const result = yield* $(
					MCPClient.executePattern(pattern, currentInput, connectionConfig, config)
				);

				currentInput = result.content;
				finalResult = result;
			}

			if (!finalResult) {
				return yield* $(
					Effect.fail(
						new ServiceError(
							'SEQUENCE_ERROR',
							'Pattern sequence execution failed: no patterns executed',
							{ patterns }
						)
					)
				);
			}

			return finalResult;
		});
	}

	/**
	 * Check if an MCP server is available
	 */
	static checkServerAvailability(
		connectionConfig: MCPConnectionConfig
	): Effect.Effect<never, ServiceError, boolean> {
		return Effect.gen(function* ($) {
			const validatedConnection = yield* $(
				validateWithSchema(MCPConnectionConfigSchema, connectionConfig)
			);

			return yield* $(
				Effect.tryPromise({
					try: async () => {
						const response = await fetch(`${validatedConnection.url}/health`, {
							method: 'GET',
							headers: {
								...(validatedConnection.apiKey
									? { Authorization: `Bearer ${validatedConnection.apiKey}` }
									: {})
							},
							signal: AbortSignal.timeout(5000)
						});
						return response.ok;
					},
					catch: (error) =>
						new ServiceError(
							'AVAILABILITY_CHECK_ERROR',
							error instanceof Error ? error.message : 'Failed to check server availability',
							error
						)
				})
			);
		});
	}

	/**
	 * List available patterns on an MCP server
	 */
	static listPatterns(
		connectionConfig: MCPConnectionConfig
	): Effect.Effect<never, ServiceError, string[]> {
		return Effect.gen(function* ($) {
			const validatedConnection = yield* $(
				validateWithSchema(MCPConnectionConfigSchema, connectionConfig)
			);

			const response = yield* $(
				effectFetch<{ patterns: string[] }>(`${validatedConnection.url}/patterns`, {
					method: 'GET',
					headers: {
						...(validatedConnection.apiKey
							? { Authorization: `Bearer ${validatedConnection.apiKey}` }
							: {})
					},
					signal: AbortSignal.timeout(validatedConnection.timeout)
				})
			);

			return response.patterns || [];
		});
	}
}

// Example usage with Effect
export const exampleMCPPatternExecution = () => {
	const program = MCPClient.executePattern(
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

	return Effect.runPromise(program);
};
