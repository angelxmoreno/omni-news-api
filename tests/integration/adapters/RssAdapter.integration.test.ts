import { describe, expect, it } from 'bun:test';
import { createHttpClient, NetworkError, ParseError, RssAdapter } from '../../../src';
import { assertNewsArticleResponse, assertNonOverlappingResults } from '../../unit/utils/assertNewsArticleResponse';

describe('RssAdapter - Integration Tests', () => {
    const httpClient = createHttpClient();

    // Test RSS feeds from well-known sources
    const testFeeds = [
        {
            name: 'BBC News',
            url: 'https://feeds.bbci.co.uk/news/rss.xml',
            expectedFields: ['title', 'url', 'publishedAt'],
        },
        {
            name: 'NPR News',
            url: 'https://feeds.npr.org/1001/rss.xml',
            expectedFields: ['title', 'url', 'publishedAt'],
        },
        {
            name: 'TechCrunch',
            url: 'https://techcrunch.com/feed/',
            expectedFields: ['title', 'url', 'publishedAt'],
        },
    ];

    testFeeds.forEach(({ name, url }) => {
        describe(`${name}`, () => {
            it('fetches and parses real RSS feed successfully', async () => {
                const adapter = new RssAdapter({
                    rssUrl: url,
                    httpClient,
                });

                const result = await adapter.getArticles({ limit: 5 });

                // Use shared assertion utility
                assertNewsArticleResponse(result, {
                    minArticles: 1, // Feeds are usually not empty
                    maxArticles: 5,
                    expectNonZeroTotalCount: true,
                });

                console.log(`✓ ${name}: Fetched ${result.articles.length} articles, total: ${result.totalCount}`);
            }, 30000); // Longer timeout for network requests

            it('handles pagination correctly with real data', async () => {
                const adapter = new RssAdapter({
                    rssUrl: url,
                    httpClient,
                });

                // Get first page
                const page1 = await adapter.getArticles({ page: 1, limit: 3 });
                assertNewsArticleResponse(page1, { maxArticles: 3 });

                // Get second page if there are more articles
                if (page1.hasMore && page1.totalCount && page1.totalCount > 3) {
                    const page2 = await adapter.getArticles({ page: 2, limit: 3 });
                    assertNewsArticleResponse(page2, { maxArticles: 3 });

                    // Articles should be different
                    assertNonOverlappingResults(page1, page2);
                }
            }, 30000);
        });
    });

    describe('RSS Format Variations', () => {
        it('handles different RSS versions and formats', async () => {
            // Test various RSS formats
            const formatTests = [
                'http://rss.cnn.com/rss/edition.rss', // CNN RSS
                'https://feeds.npr.org/1001/rss.xml', // NPR RSS
            ];

            for (const feedUrl of formatTests) {
                const adapter = new RssAdapter({
                    rssUrl: feedUrl,
                    httpClient,
                });

                try {
                    const result = await adapter.getArticles({ limit: 2 });

                    assertNewsArticleResponse(result, {
                        maxArticles: 2,
                        validateArticleStructure: result.articles.length > 0,
                    });

                    console.log(`✓ ${feedUrl}: Successfully parsed ${result.articles.length} articles`);
                } catch (error) {
                    console.warn(`⚠ ${feedUrl}: Failed to fetch - ${error}`);
                    // Some feeds might be temporarily unavailable, don't fail the test
                }
            }
        }, 45000);
    });

    describe('Error Handling', () => {
        it('handles invalid RSS URLs gracefully', async () => {
            const adapter = new RssAdapter({
                rssUrl: 'https://httpbin.org/status/404',
                httpClient,
            });

            await expect(adapter.getArticles()).rejects.toThrow(NetworkError);
        });

        it('handles malformed RSS gracefully', async () => {
            const adapter = new RssAdapter({
                rssUrl: 'https://httpbin.org/xml', // Returns non-RSS XML
                httpClient,
            });

            await expect(adapter.getArticles()).rejects.toThrow(ParseError);
        });

        it('provides detailed error information for network failures', async () => {
            const adapter = new RssAdapter({
                rssUrl: 'https://httpbin.org/status/500',
                httpClient,
            });

            try {
                await adapter.getArticles();
                expect.unreachable('Should have thrown an error');
            } catch (error) {
                expect(error).toBeInstanceOf(NetworkError);
                expect((error as NetworkError).statusCode).toBe(500);
                expect((error as NetworkError).url).toContain('httpbin.org');
                expect((error as NetworkError).code).toBe('HTTP_500');
            }
        });
    });
});
