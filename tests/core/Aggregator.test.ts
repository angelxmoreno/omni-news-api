import { describe, expect, it, jest } from 'bun:test';
import type { AdapterInterface } from '../../src/core/AdapterInterface';
import { Aggregator } from '../../src/core/Aggregator';
import type { NewsArticleInterface } from '../../src/core/NewsArticleInterface';
import type { NewsArticleResponse } from '../../src/core/NewsArticleResponse';

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
        const mockResponse: NewsArticleResponse = {
            articles: [mockArticle1, mockArticle2],
            totalCount: 2,
            hasMore: false,
        };
        const mockAdapter: AdapterInterface = {
            getArticles: jest.fn().mockResolvedValue(mockResponse),
        };

        const aggregator = new Aggregator([mockAdapter]);
        const result = await aggregator.fetchAll();

        expect(mockAdapter.getArticles).toHaveBeenCalledTimes(1);
        expect(result.articles).toHaveLength(2);
        expect(result.articles).toEqual([mockArticle1, mockArticle2]);
        expect(result.totalCount).toBe(2);
        expect(result.hasMore).toBe(false);
    });

    it('fetches and combines articles from multiple adapters', async () => {
        const mockResponse1: NewsArticleResponse = {
            articles: [mockArticle1],
            totalCount: 1,
            hasMore: false,
        };
        const mockResponse2: NewsArticleResponse = {
            articles: [mockArticle2, mockArticle3],
            totalCount: 2,
            hasMore: true,
        };
        const mockAdapter1: AdapterInterface = {
            getArticles: jest.fn().mockResolvedValue(mockResponse1),
        };
        const mockAdapter2: AdapterInterface = {
            getArticles: jest.fn().mockResolvedValue(mockResponse2),
        };

        const aggregator = new Aggregator([mockAdapter1, mockAdapter2]);
        const result = await aggregator.fetchAll();

        expect(mockAdapter1.getArticles).toHaveBeenCalledTimes(1);
        expect(mockAdapter2.getArticles).toHaveBeenCalledTimes(1);
        expect(result.articles).toHaveLength(3);
        expect(result.articles).toEqual([mockArticle1, mockArticle2, mockArticle3]);
        expect(result.totalCount).toBe(3);
        expect(result.hasMore).toBe(true);
    });

    it('returns empty response when no adapters provided', async () => {
        const aggregator = new Aggregator([]);
        const result = await aggregator.fetchAll();

        expect(result.articles).toHaveLength(0);
        expect(result.articles).toEqual([]);
        expect(result.totalCount).toBe(0);
        expect(result.hasMore).toBe(false);
    });

    it('returns empty response when all adapters return empty responses', async () => {
        const emptyResponse: NewsArticleResponse = {
            articles: [],
            totalCount: 0,
            hasMore: false,
        };
        const mockAdapter1: AdapterInterface = {
            getArticles: jest.fn().mockResolvedValue(emptyResponse),
        };
        const mockAdapter2: AdapterInterface = {
            getArticles: jest.fn().mockResolvedValue(emptyResponse),
        };

        const aggregator = new Aggregator([mockAdapter1, mockAdapter2]);
        const result = await aggregator.fetchAll();

        expect(result.articles).toHaveLength(0);
        expect(result.articles).toEqual([]);
        expect(result.totalCount).toBe(0);
        expect(result.hasMore).toBe(false);
    });

    it('executes adapter calls in parallel', async () => {
        const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

        const mockAdapter1: AdapterInterface = {
            getArticles: jest.fn().mockImplementation(async () => {
                await delay(50);
                return { articles: [mockArticle1], totalCount: 1, hasMore: false };
            }),
        };
        const mockAdapter2: AdapterInterface = {
            getArticles: jest.fn().mockImplementation(async () => {
                await delay(50);
                return { articles: [mockArticle2], totalCount: 1, hasMore: false };
            }),
        };

        const aggregator = new Aggregator([mockAdapter1, mockAdapter2]);

        const startTime = Date.now();
        const result = await aggregator.fetchAll();
        const endTime = Date.now();

        // Should complete in around 50ms (parallel) not 100ms (sequential)
        expect(endTime - startTime).toBeLessThan(90);
        expect(result.articles).toHaveLength(2);
    });

    it('handles adapter errors by propagating them', async () => {
        const mockResponse: NewsArticleResponse = {
            articles: [mockArticle1],
            totalCount: 1,
            hasMore: false,
        };
        const mockAdapter1: AdapterInterface = {
            getArticles: jest.fn().mockResolvedValue(mockResponse),
        };
        const mockAdapter2: AdapterInterface = {
            getArticles: jest.fn().mockRejectedValue(new Error('Adapter 2 failed')),
        };

        const aggregator = new Aggregator([mockAdapter1, mockAdapter2]);

        await expect(aggregator.fetchAll()).rejects.toThrow('Adapter 2 failed');
    });

    it('maintains order of articles as returned by adapters', async () => {
        const mockResponse1: NewsArticleResponse = {
            articles: [mockArticle1, mockArticle2],
            totalCount: 2,
            hasMore: false,
        };
        const mockResponse2: NewsArticleResponse = {
            articles: [mockArticle3],
            totalCount: 1,
            hasMore: false,
        };
        const mockAdapter1: AdapterInterface = {
            getArticles: jest.fn().mockResolvedValue(mockResponse1),
        };
        const mockAdapter2: AdapterInterface = {
            getArticles: jest.fn().mockResolvedValue(mockResponse2),
        };

        const aggregator = new Aggregator([mockAdapter1, mockAdapter2]);
        const result = await aggregator.fetchAll();

        // Should maintain order: adapter1's articles first, then adapter2's
        expect(result.articles[0]).toEqual(mockArticle1);
        expect(result.articles[1]).toEqual(mockArticle2);
        expect(result.articles[2]).toEqual(mockArticle3);
    });
});
