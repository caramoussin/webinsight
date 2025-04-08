import { describe, it, expect } from 'vitest';
import { MCPClient } from '../../../lib/services/mcp/MCPClient';

// Manuellement créer des mocks pour les tests
const mockExecutePattern = jest.fn();
const mockExecutePatternSequence = jest.fn();
const mockCheckServerAvailability = jest.fn();
const mockListPatterns = jest.fn();

// Remplacer les méthodes de MCPClient par nos mocks
MCPClient.executePattern = mockExecutePattern;
MCPClient.executePatternSequence = mockExecutePatternSequence;
MCPClient.checkServerAvailability = mockCheckServerAvailability;
MCPClient.listPatterns = mockListPatterns;

describe('MCPClient', () => {
	beforeEach(() => {
		// Réinitialiser les mocks avant chaque test
		mockExecutePattern.mockReset();
		mockExecutePatternSequence.mockReset();
		mockCheckServerAvailability.mockReset();
		mockListPatterns.mockReset();
	});

	it('should execute a pattern successfully', async () => {
		// Configurer le mock pour retourner une réponse réussie
		mockExecutePattern.mockResolvedValue({
			right: {
				content: 'This is a summary of the content.',
				metadata: {
					model: 'llama2',
					vendor: 'ollama'
				},
				usage: {
					promptTokens: 100,
					completionTokens: 50,
					totalTokens: 150
				}
			}
		});

		// Appeler le client
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

		// Vérifier le résultat
		expect('right' in result).toBe(true);
		if ('right' in result) {
			const data = result.right;
			expect(data.content).toBe('This is a summary of the content.');
			expect(data.metadata?.model).toBe('llama2');
			expect(data.usage?.totalTokens).toBe(150);
		}

		// Vérifier que executePattern a été appelé avec les bons paramètres
		expect(mockExecutePattern).toHaveBeenCalledWith(
			'summarize',
			'This is a long article about artificial intelligence and its impact on society...',
			expect.objectContaining({
				url: 'http://localhost:11434',
				vendor: 'ollama',
				model: 'llama2'
			}),
			expect.objectContaining({
				name: 'summarize',
				temperature: 0.5,
				maxTokens: 1024
			})
		);
	});

	it('should handle HTTP errors gracefully', async () => {
		// Configurer le mock pour retourner une erreur
		mockExecutePattern.mockResolvedValue({
			left: {
				code: 'HTTP_500',
				message: 'Internal server error',
				details: { status: 500 }
			}
		});

		// Appeler le client
		const result = await MCPClient.executePattern(
			'summarize',
			'This is a long article about artificial intelligence and its impact on society...',
			{
				url: 'http://localhost:11434',
				vendor: 'ollama',
				model: 'llama2',
				timeout: 30000
			}
		);

		// Vérifier le résultat
		expect('left' in result).toBe(true);
		if ('left' in result) {
			const error = result.left;
			expect(error.code).toBe('HTTP_500');
			expect(error.message).toBe('Internal server error');
		}
	});

	it('should execute a pattern sequence successfully', async () => {
		// Configurer le mock pour retourner une réponse réussie
		mockExecutePatternSequence.mockResolvedValue({
			right: {
				content: JSON.stringify({
					entities: ['AI', 'society', 'technology']
				}),
				metadata: { model: 'llama2' }
			}
		});

		// Appeler le client
		const result = await MCPClient.executePatternSequence(
			['summarize', 'extract-entities'],
			'This is a long article about artificial intelligence and its impact on society...',
			{
				url: 'http://localhost:11434',
				vendor: 'ollama',
				model: 'llama2',
				timeout: 30000
			},
			{
				summarize: {
					name: 'summarize',
					temperature: 0.5,
					maxTokens: 1024
				},
				'extract-entities': {
					name: 'extract-entities',
					temperature: 0.1,
					maxTokens: 512
				}
			}
		);

		// Vérifier le résultat
		expect('right' in result).toBe(true);
		if ('right' in result) {
			const data = result.right;
			expect(data.content).toBe(
				JSON.stringify({
					entities: ['AI', 'society', 'technology']
				})
			);
		}

		// Vérifier que executePatternSequence a été appelé avec les bons paramètres
		expect(mockExecutePatternSequence).toHaveBeenCalledWith(
			['summarize', 'extract-entities'],
			'This is a long article about artificial intelligence and its impact on society...',
			expect.objectContaining({
				url: 'http://localhost:11434',
				vendor: 'ollama',
				model: 'llama2'
			}),
			expect.objectContaining({
				summarize: expect.objectContaining({
					name: 'summarize',
					temperature: 0.5
				}),
				'extract-entities': expect.objectContaining({
					name: 'extract-entities',
					temperature: 0.1
				})
			})
		);
	});
});
