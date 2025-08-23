import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { createHttpClient, NewsApiOrgAdapter } from '../../../src';

describe('NewsApiOrgAdapter', () => {
    let mockAxios: MockAdapter;
    let httpClient: ReturnType<typeof createHttpClient>;
    const apiKey = 'test-api-key';

    beforeEach(() => {
        mockAxios = new MockAdapter(axios);
        httpClient = createHttpClient();
    });

    afterEach(() => {
        mockAxios.restore();
    });

    it('fetches articles from NewsAPI.org', async () => {
        const mockResponse = {
            status: 'ok',
            totalResults: 2,
            articles: [
                {
                    title: 'Breaking News: AI Revolution',
                    url: 'https://example.com/ai-news',
                    author: 'John Doe',
                    source: { name: 'Tech News' },
                    publishedAt: '2025-08-22T10:00:00Z',
                    description: 'AI is revolutionizing everything',
                    urlToImage: 'https://example.com/ai-image.jpg',
                },
                {
                    title: 'Market Update',
                    url: 'https://example.com/market',
                    author: null,
                    source: { name: 'Financial Times' },
                    publishedAt: '2025-08-22T09:00:00Z',
                    description: 'Market analysis for today',
                    urlToImage: 'https://example.com/market-image.jpg',
                },
            ],
        };

        mockAxios.onGet('https://newsapi.org/v2/everything').reply(200, mockResponse);

        const adapter = new NewsApiOrgAdapter({
            apiKey,
            httpClient,
            searchParams: { q: 'technology', language: 'en' },
        });

        const result = await adapter.getArticles();

        expect(result.articles).toHaveLength(2);
        expect(result.totalCount).toBe(2);
        expect(result.hasMore).toBe(false);
        expect(result.articles[0]).toEqual({
            title: 'Breaking News: AI Revolution',
            url: 'https://example.com/ai-news',
            author: 'John Doe',
            source: 'Tech News',
            publishedAt: new Date('2025-08-22T10:00:00Z'),
            description: 'AI is revolutionizing everything',
            imageUrl: 'https://example.com/ai-image.jpg',
            language: 'en',
        });
        expect(result.articles[1]).toEqual({
            title: 'Market Update',
            url: 'https://example.com/market',
            author: undefined,
            source: 'Financial Times',
            publishedAt: new Date('2025-08-22T09:00:00Z'),
            description: 'Market analysis for today',
            imageUrl: 'https://example.com/market-image.jpg',
            language: 'en',
        });
    });

    it('sends correct headers and params to NewsAPI', async () => {
        const mockResponse = {
            status: 'ok',
            totalResults: 0,
            articles: [],
        };

        mockAxios.onGet('https://newsapi.org/v2/everything').reply((config) => {
            expect(config.headers?.['X-API-Key']).toBe(apiKey);
            expect(config.params).toEqual({
                q: 'bitcoin',
                language: 'en',
                sortBy: 'publishedAt',
            });
            return [200, mockResponse];
        });

        const adapter = new NewsApiOrgAdapter({
            apiKey,
            httpClient,
            searchParams: {
                q: 'bitcoin',
                language: 'en',
                sortBy: 'publishedAt',
            },
        });

        await adapter.getArticles();
    });

    it('handles empty results', async () => {
        const mockResponse = {
            status: 'ok',
            totalResults: 0,
            articles: [],
        };

        mockAxios.onGet('https://newsapi.org/v2/everything').reply(200, mockResponse);

        const adapter = new NewsApiOrgAdapter({
            apiKey,
            httpClient,
        });

        const result = await adapter.getArticles();

        expect(result.articles).toHaveLength(0);
        expect(result.totalCount).toBe(0);
        expect(result.hasMore).toBe(false);
    });
});
