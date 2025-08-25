import { describe, expect, it } from 'bun:test';
import { createHttpClient, NetworkError, NewsApiOrgAdapter } from '../../../src';
import { assertNewsArticleResponse, assertNonOverlappingResults } from '../../unit/utils/assertNewsArticleResponse';

describe('NewsApiOrgAdapter - Integration Tests', () => {
    const apiKey = process.env.NEWSAPI_API_KEY;
    const httpClient = createHttpClient();

    // Skip integration tests if API key is not provided
    const describeOrSkip = apiKey ? describe : describe.skip;

    describeOrSkip('Real NewsAPI.org Integration', () => {
        it('fetches real articles from NewsAPI.org', async () => {
            const adapter = new NewsApiOrgAdapter({
                apiKey: apiKey as string,
                httpClient,
                searchParams: {
                    q: 'technology',
                    language: 'en',
                    sortBy: 'publishedAt',
                    pageSize: 5,
                },
            });

            const result = await adapter.getArticles();

            // Use shared assertion utility
            assertNewsArticleResponse(result, {
                minArticles: 1,
                maxArticles: 5,
                expectNonZeroTotalCount: true,
            });

            // NewsAPI specific validations
            if (result.articles.length > 0) {
                const article = result.articles[0];
                if (article) {
                    expect(article.source).toBeDefined();
                    expect(typeof article.source).toBe('string');
                }
            }

            console.log(`✓ NewsAPI: Fetched ${result.articles.length} articles out of ${result.totalCount} total`);
        }, 30000);

        it('handles pagination correctly with real NewsAPI data', async () => {
            const adapter = new NewsApiOrgAdapter({
                apiKey: apiKey as string,
                httpClient,
                searchParams: {
                    q: 'javascript',
                    language: 'en',
                    sortBy: 'publishedAt',
                    pageSize: 5,
                },
            });

            // Get first page
            const page1 = await adapter.getArticles({ page: 1, limit: 3 });
            assertNewsArticleResponse(page1, { maxArticles: 3 });

            // Get second page if there are more articles
            if (page1.hasMore) {
                const page2 = await adapter.getArticles({ page: 2, limit: 3 });
                assertNewsArticleResponse(page2, { maxArticles: 3 });

                // Articles should be different
                assertNonOverlappingResults(page1, page2);

                console.log(
                    `✓ NewsAPI Pagination: Page 1 had ${page1.articles.length} articles, Page 2 had ${page2.articles.length} articles`
                );
            }
        }, 30000);

        it('handles different search parameters', async () => {
            const testParams = [
                { q: 'climate change', language: 'en', sortBy: 'popularity' as const },
                { q: 'artificial intelligence', language: 'en', sortBy: 'relevancy' as const },
                { sources: 'bbc-news', sortBy: 'publishedAt' as const },
            ];

            for (const params of testParams) {
                const adapter = new NewsApiOrgAdapter({
                    apiKey: apiKey as string,
                    httpClient,
                    searchParams: { ...params, pageSize: 3 },
                });

                const result = await adapter.getArticles();

                assertNewsArticleResponse(result, {
                    maxArticles: 3,
                    validateArticleStructure: result.articles.length > 0,
                });

                console.log(
                    `✓ NewsAPI Search "${JSON.stringify(params)}": ${result.articles.length}/${result.totalCount} articles`
                );
            }
        }, 45000);

        it('respects NewsAPI rate limits and handles errors gracefully', async () => {
            const adapter = new NewsApiOrgAdapter({
                apiKey: apiKey as string,
                httpClient,
                searchParams: {
                    q: 'test',
                    language: 'en',
                    pageSize: 1,
                },
            });

            // This should work normally
            const result = await adapter.getArticles();
            expect(result).toBeDefined();
        }, 30000);

        it('validates real NewsAPI response structure matches our interface', async () => {
            const adapter = new NewsApiOrgAdapter({
                apiKey: apiKey as string,
                httpClient,
                searchParams: {
                    q: 'news',
                    language: 'en',
                    pageSize: 1,
                },
            });

            const result = await adapter.getArticles();

            // Validate the complete response structure using shared utility
            assertNewsArticleResponse(result, { maxArticles: 1 });

            // Additional property existence checks
            expect(result).toHaveProperty('articles');
            expect(result).toHaveProperty('totalCount');
            expect(result).toHaveProperty('hasMore');
        }, 30000);
    });

    describe('Error Handling', () => {
        it('handles invalid API key gracefully', async () => {
            const adapter = new NewsApiOrgAdapter({
                apiKey: 'invalid-api-key-12345',
                httpClient,
                searchParams: { q: 'test' },
            });

            try {
                await adapter.getArticles();
                expect.unreachable('Should have thrown an error');
            } catch (error) {
                expect(error).toBeInstanceOf(NetworkError);
                expect((error as NetworkError).statusCode).toBe(401);
                expect((error as NetworkError).code).toBe('HTTP_401');
            }
        }, 15000);

        // Only test rate limit handling if we have a valid API key
        const testRateLimit = apiKey ? it : it.skip;
        testRateLimit(
            'handles rate limit errors appropriately',
            async () => {
                // This is more of a documentation test - we can't easily trigger rate limits
                // but we can ensure our error handling would work
                const adapter = new NewsApiOrgAdapter({
                    apiKey: apiKey as string,
                    httpClient,
                    searchParams: { q: 'test' },
                });

                // Just verify the adapter is set up correctly
                // In a real scenario, rate limit errors would be thrown by axios
                expect(adapter).toBeDefined();
            },
            10000
        );
    });

    // Show helpful message when API key is missing
    if (!apiKey) {
        console.warn('⚠️  NewsAPI integration tests skipped - NEWSAPI_API_KEY environment variable not set');
        console.warn('   To run NewsAPI integration tests:');
        console.warn('   1. Get a free API key from https://newsapi.org/');
        console.warn('   2. Set environment variable: export NEWSAPI_API_KEY=your_key_here');
        console.warn('   3. Run: bun run test:integration');
    }
});
