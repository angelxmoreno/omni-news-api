import { describe, expect, it, jest } from 'bun:test';
import type { AdapterInterface } from '../../src/core/AdapterInterface';
import { Aggregator } from '../../src/core/Aggregator';
import type { NewsArticleInterface } from '../../src/core/NewsArticleInterface';

describe('Aggregator', () => {
    const mockArticle1: NewsArticleInterface = {
        title: 'Test Article 1',
        url: 'https://example.com/article1',
        author: 'Author 1',
        source: 'Source 1',
        publishedAt: new Date('2025-08-22T10:00:00Z'),
    };

    const mockArticle2: NewsArticleInterface = {
        title: 'Test Article 2',
        url: 'https://example.com/article2',
        source: 'Source 2',
        publishedAt: new Date('2025-08-22T11:00:00Z'),
    };

    const mockArticle3: NewsArticleInterface = {
        title: 'Test Article 3',
        url: 'https://example.com/article3',
        author: 'Author 3',
        source: 'Source 3',
        publishedAt: new Date('2025-08-22T12:00:00Z'),
    };

    it('creates an aggregator with empty adapters array', () => {
        const aggregator = new Aggregator([]);
        expect(aggregator).toBeDefined();
    });

    it('creates an aggregator with multiple adapters', () => {
        const mockAdapter1: AdapterInterface = {
            getArticles: jest.fn(),
        };
        const mockAdapter2: AdapterInterface = {
            getArticles: jest.fn(),
        };

        const aggregator = new Aggregator([mockAdapter1, mockAdapter2]);
        expect(aggregator).toBeDefined();
    });

    it('fetches articles from single adapter', async () => {
        const mockAdapter: AdapterInterface = {
            getArticles: jest.fn().mockResolvedValue([mockArticle1, mockArticle2]),
        };

        const aggregator = new Aggregator([mockAdapter]);
        const articles = await aggregator.fetchAll();

        expect(mockAdapter.getArticles).toHaveBeenCalledTimes(1);
        expect(articles).toHaveLength(2);
        expect(articles).toEqual([mockArticle1, mockArticle2]);
    });

    it('fetches and combines articles from multiple adapters', async () => {
        const mockAdapter1: AdapterInterface = {
            getArticles: jest.fn().mockResolvedValue([mockArticle1]),
        };
        const mockAdapter2: AdapterInterface = {
            getArticles: jest.fn().mockResolvedValue([mockArticle2, mockArticle3]),
        };

        const aggregator = new Aggregator([mockAdapter1, mockAdapter2]);
        const articles = await aggregator.fetchAll();

        expect(mockAdapter1.getArticles).toHaveBeenCalledTimes(1);
        expect(mockAdapter2.getArticles).toHaveBeenCalledTimes(1);
        expect(articles).toHaveLength(3);
        expect(articles).toEqual([mockArticle1, mockArticle2, mockArticle3]);
    });

    it('returns empty array when no adapters provided', async () => {
        const aggregator = new Aggregator([]);
        const articles = await aggregator.fetchAll();

        expect(articles).toHaveLength(0);
        expect(articles).toEqual([]);
    });

    it('returns empty array when all adapters return empty arrays', async () => {
        const mockAdapter1: AdapterInterface = {
            getArticles: jest.fn().mockResolvedValue([]),
        };
        const mockAdapter2: AdapterInterface = {
            getArticles: jest.fn().mockResolvedValue([]),
        };

        const aggregator = new Aggregator([mockAdapter1, mockAdapter2]);
        const articles = await aggregator.fetchAll();

        expect(articles).toHaveLength(0);
        expect(articles).toEqual([]);
    });

    it('executes adapter calls in parallel', async () => {
        const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

        const mockAdapter1: AdapterInterface = {
            getArticles: jest.fn().mockImplementation(async () => {
                await delay(50);
                return [mockArticle1];
            }),
        };
        const mockAdapter2: AdapterInterface = {
            getArticles: jest.fn().mockImplementation(async () => {
                await delay(50);
                return [mockArticle2];
            }),
        };

        const aggregator = new Aggregator([mockAdapter1, mockAdapter2]);

        const startTime = Date.now();
        const articles = await aggregator.fetchAll();
        const endTime = Date.now();

        // Should complete in around 50ms (parallel) not 100ms (sequential)
        expect(endTime - startTime).toBeLessThan(90);
        expect(articles).toHaveLength(2);
    });

    it('handles adapter errors by propagating them', async () => {
        const mockAdapter1: AdapterInterface = {
            getArticles: jest.fn().mockResolvedValue([mockArticle1]),
        };
        const mockAdapter2: AdapterInterface = {
            getArticles: jest.fn().mockRejectedValue(new Error('Adapter 2 failed')),
        };

        const aggregator = new Aggregator([mockAdapter1, mockAdapter2]);

        await expect(aggregator.fetchAll()).rejects.toThrow('Adapter 2 failed');
    });

    it('maintains order of articles as returned by adapters', async () => {
        const mockAdapter1: AdapterInterface = {
            getArticles: jest.fn().mockResolvedValue([mockArticle1, mockArticle2]),
        };
        const mockAdapter2: AdapterInterface = {
            getArticles: jest.fn().mockResolvedValue([mockArticle3]),
        };

        const aggregator = new Aggregator([mockAdapter1, mockAdapter2]);
        const articles = await aggregator.fetchAll();

        // Should maintain order: adapter1's articles first, then adapter2's
        expect(articles[0]).toEqual(mockArticle1);
        expect(articles[1]).toEqual(mockArticle2);
        expect(articles[2]).toEqual(mockArticle3);
    });
});
