import { describe, it, expect } from 'vitest';
import { FabricAIScrapingService } from '../../../lib/services/scraper/FabricAIScrapingService';
import { Crawl4AIClient } from '../../../lib/services/scraper/Crawl4AIClient';
import { MCPClient } from '../../../lib/services/mcp/MCPClient';

// Manuellement créer des mocks pour les tests
const mockExtractContent = jest.fn();
const mockCreateSelectorConfig = jest.fn((selector) => ({ base_selector: selector }));
const mockExecutePatternSequence = jest.fn();

// Remplacer les méthodes par nos mocks
Crawl4AIClient.extractContent = mockExtractContent;
Crawl4AIClient.createSelectorConfig = mockCreateSelectorConfig;
MCPClient.executePatternSequence = mockExecutePatternSequence;

describe('FabricAIScrapingService', () => {
	beforeEach(() => {
		// Réinitialiser les mocks avant chaque test
		mockExtractContent.mockReset();
		mockCreateSelectorConfig.mockReset();
		mockExecutePatternSequence.mockReset();
	});

	it('should successfully scrape and analyze content with Fabric AI', async () => {
		// Mock Crawl4AI response
		const mockCrawl4AIResponse = {
			content: {
				markdown: '# Test Article\n\nThis is a test article about AI.',
				raw_markdown: '# Test Article\n\nThis is a test article about AI.',
				html: '<h1>Test Article</h1><p>This is a test article about AI.</p>'
			},
			metadata: {
				title: 'Test Article',
				url: 'https://example.com/article'
			}
		};

		// Mock MCP response
		const mockMCPResponse = {
			content: JSON.stringify({
				summary: 'This is a test article about artificial intelligence.',
				entities: ['AI'],
				sentiment: 'neutral',
				topics: ['technology', 'artificial intelligence'],
				keywords: ['AI', 'test', 'article']
			}),
			metadata: {
				model: 'llama2',
				vendor: 'ollama'
			}
		};

		// Configurer les mocks
		mockExtractContent.mockResolvedValue({
			right: mockCrawl4AIResponse
		});

		mockExecutePatternSequence.mockResolvedValue({
			right: mockMCPResponse
		});

		// Appeler le service
		const result = await FabricAIScrapingService.scrapeAndAnalyze({
			url: 'https://example.com/article',
			selector: 'article.content',
			mcpOptions: {
				enabled: true,
				connectionConfig: {
					url: 'http://localhost:11434',
					vendor: 'ollama',
					model: 'llama2'
				},
				patterns: ['summarize', 'extract-entities']
			}
		});

		// Vérifier le résultat
		expect('right' in result).toBe(true);
		if ('right' in result) {
			const data = result.right;
			expect(data.url).toBe('https://example.com/article');
			expect(data.markdown).toBe('# Test Article\n\nThis is a test article about AI.');
			expect(data.fabricAnalysis).toBeDefined();
			expect(data.fabricAnalysis?.summary).toBe(
				'This is a test article about artificial intelligence.'
			);
			expect(data.fabricAnalysis?.entities).toContain('AI');
			expect(data.fabricAnalysis?.topics).toContain('artificial intelligence');
		}

		// Vérifier que les mocks ont été appelés avec les bons paramètres
		expect(mockExtractContent).toHaveBeenCalledWith(
			expect.objectContaining({
				url: 'https://example.com/article',
				selectors: expect.objectContaining({
					base_selector: 'article.content'
				})
			})
		);

		expect(mockExecutePatternSequence).toHaveBeenCalledWith(
			['summarize', 'extract-entities'],
			'# Test Article\n\nThis is a test article about AI.',
			expect.objectContaining({
				url: 'http://localhost:11434',
				vendor: 'ollama',
				model: 'llama2'
			}),
			undefined
		);
	});

	it('should handle Crawl4AI errors gracefully', async () => {
		// Configurer le mock pour retourner une erreur
		mockExtractContent.mockResolvedValue({
			left: {
				code: 'REQUEST_ERROR',
				message: 'Failed to fetch content',
				details: new Error('Network error')
			}
		});

		// Appeler le service
		const result = await FabricAIScrapingService.scrapeAndAnalyze({
			url: 'https://example.com/article',
			selector: 'article.content'
		});

		// Vérifier le résultat
		expect('left' in result).toBe(true);
		if ('left' in result) {
			const error = result.left;
			expect(error.code).toBe('CRAWL4AI_REQUEST_ERROR');
			expect(error.message).toBe('Failed to fetch content');
		}
	});

	it('should handle MCP errors gracefully', async () => {
		// Configurer le mock pour Crawl4AI (succès)
		mockExtractContent.mockResolvedValue({
			right: {
				content: {
					markdown: '# Test Article\n\nThis is a test article about AI.',
					raw_markdown: '# Test Article\n\nThis is a test article about AI.',
					html: '<h1>Test Article</h1><p>This is a test article about AI.</p>'
				},
				metadata: {
					title: 'Test Article',
					url: 'https://example.com/article'
				}
			}
		});

		// Configurer le mock pour MCP (erreur)
		mockExecutePatternSequence.mockResolvedValue({
			left: {
				code: 'REQUEST_ERROR',
				message: 'Failed to connect to MCP server',
				details: new Error('Connection refused')
			}
		});

		// Appeler le service
		const result = await FabricAIScrapingService.scrapeAndAnalyze({
			url: 'https://example.com/article',
			selector: 'article.content',
			mcpOptions: {
				enabled: true,
				connectionConfig: {
					url: 'http://localhost:11434',
					vendor: 'ollama',
					model: 'llama2'
				},
				patterns: ['summarize', 'extract-entities']
			}
		});

		// Vérifier le résultat
		expect('left' in result).toBe(true);
		if ('left' in result) {
			const error = result.left;
			expect(error.code).toBe('MCP_REQUEST_ERROR');
			expect(error.message).toBe('Failed to connect to MCP server');
		}
	});

	it('should work without MCP if not enabled', async () => {
		// Configurer le mock pour Crawl4AI
		mockExtractContent.mockResolvedValue({
			right: {
				content: {
					markdown: '# Test Article\n\nThis is a test article about AI.',
					raw_markdown: '# Test Article\n\nThis is a test article about AI.',
					html: '<h1>Test Article</h1><p>This is a test article about AI.</p>'
				},
				metadata: {
					title: 'Test Article',
					url: 'https://example.com/article'
				}
			}
		});

		// Appeler le service sans options MCP
		const result = await FabricAIScrapingService.scrapeAndAnalyze({
			url: 'https://example.com/article',
			selector: 'article.content'
		});

		// Vérifier le résultat
		expect('right' in result).toBe(true);
		if ('right' in result) {
			const data = result.right;
			expect(data.url).toBe('https://example.com/article');
			expect(data.markdown).toBe('# Test Article\n\nThis is a test article about AI.');
			expect(data.fabricAnalysis).toBeUndefined();
		}

		// Vérifier que executePatternSequence n'a pas été appelé
		expect(mockExecutePatternSequence).not.toHaveBeenCalled();
	});
});
