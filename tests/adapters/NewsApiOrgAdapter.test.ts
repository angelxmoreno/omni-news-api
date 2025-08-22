import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { createHttpClient, NewsApiOrgAdapter } from '../../src';

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
                },
                {
                    title: 'Market Update',
                    url: 'https://example.com/market',
                    author: null,
                    source: { name: 'Financial Times' },
                    publishedAt: '2025-08-22T09:00:00Z',
                },
            ],
        };

        mockAxios.onGet('https://newsapi.org/v2/everything').reply(200, mockResponse);

        const adapter = new NewsApiOrgAdapter({
            apiKey,
            httpClient,
            searchParams: { q: 'technology' },
        });

        const articles = await adapter.getArticles();

        expect(articles).toHaveLength(2);
        expect(articles[0]).toEqual({
            title: 'Breaking News: AI Revolution',
            url: 'https://example.com/ai-news',
            author: 'John Doe',
            source: 'Tech News',
            publishedAt: new Date('2025-08-22T10:00:00Z'),
        });
        expect(articles[1]).toEqual({
            title: 'Market Update',
            url: 'https://example.com/market',
            author: undefined,
            source: 'Financial Times',
            publishedAt: new Date('2025-08-22T09:00:00Z'),
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

        const articles = await adapter.getArticles();

        expect(articles).toHaveLength(0);
    });
});
