import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { createHttpClient, RssAdapter } from '../../../src';
import { assertNewsArticleResponse } from '../utils/assertNewsArticleResponse';

describe('RssAdapter', () => {
    let mockAxios: MockAdapter;
    let httpClient: ReturnType<typeof createHttpClient>;

    const rssUrl = '/rss';
    const rssXmlString = `
      <rss version="2.0">
        <channel>
          <title>Example News</title>
          <item>
            <title>Article 1</title>
            <link>https://example.com/article1</link>
          </item>
          <item>
            <title>Article 2</title>
            <link>https://example.com/article2</link>
          </item>
          <item>
            <title>Article 3</title>
            <link>https://example.com/article3</link>
          </item>
          <item>
            <title>Article 4</title>
            <link>https://example.com/article4</link>
          </item>
          <item>
            <title>Article 5</title>
            <link>https://example.com/article5</link>
          </item>
        </channel>
      </rss>
    `;

    beforeEach(() => {
        mockAxios = new MockAdapter(axios);
        httpClient = createHttpClient();
    });

    afterEach(() => {
        mockAxios.restore();
    });

    it('fetches from the rss url provided', async () => {
        mockAxios.onGet(rssUrl).reply(200, rssXmlString);

        const adapter = new RssAdapter({
            rssUrl,
            httpClient,
        });

        const result = await adapter.getArticles();

        assertNewsArticleResponse(result, { exactArticles: 5 });
        expect(result.articles[0]?.title).toBe('Article 1');
        expect(result.articles[1]?.title).toBe('Article 2');
        expect(result.hasMore).toBe(false);
    });

    describe('pagination', () => {
        beforeEach(() => {
            mockAxios.onGet(rssUrl).reply(200, rssXmlString);
        });

        it('handles page-based pagination', async () => {
            const adapter = new RssAdapter({ rssUrl, httpClient });

            // First page
            const page1 = await adapter.getArticles({ page: 1, limit: 2 });
            expect(page1.articles.length).toBe(2);
            expect(page1.articles[0]?.title).toBe('Article 1');
            expect(page1.articles[1]?.title).toBe('Article 2');
            expect(page1.totalCount).toBe(5);
            expect(page1.hasMore).toBe(true);
            expect(page1.nextPage).toBe(2);

            // Second page
            const page2 = await adapter.getArticles({ page: 2, limit: 2 });
            expect(page2.articles.length).toBe(2);
            expect(page2.articles[0]?.title).toBe('Article 3');
            expect(page2.articles[1]?.title).toBe('Article 4');
            expect(page2.hasMore).toBe(true);
            expect(page2.nextPage).toBe(3);

            // Last page
            const page3 = await adapter.getArticles({ page: 3, limit: 2 });
            expect(page3.articles.length).toBe(1);
            expect(page3.articles[0]?.title).toBe('Article 5');
            expect(page3.hasMore).toBe(false);
            expect(page3.nextPage).toBeUndefined();
        });

        it('handles offset-based pagination', async () => {
            const adapter = new RssAdapter({ rssUrl, httpClient });

            // First batch
            const batch1 = await adapter.getArticles({ offset: 0, limit: 2 });
            expect(batch1.articles.length).toBe(2);
            expect(batch1.articles[0]?.title).toBe('Article 1');
            expect(batch1.articles[1]?.title).toBe('Article 2');
            expect(batch1.totalCount).toBe(5);
            expect(batch1.hasMore).toBe(true);
            expect(batch1.nextPage).toBe(2);

            // Second batch
            const batch2 = await adapter.getArticles({ offset: 2, limit: 2 });
            expect(batch2.articles.length).toBe(2);
            expect(batch2.articles[0]?.title).toBe('Article 3');
            expect(batch2.articles[1]?.title).toBe('Article 4');
            expect(batch2.hasMore).toBe(true);
            expect(batch2.nextPage).toBe(3);

            // Last batch
            const batch3 = await adapter.getArticles({ offset: 4, limit: 2 });
            expect(batch3.articles.length).toBe(1);
            expect(batch3.articles[0]?.title).toBe('Article 5');
            expect(batch3.hasMore).toBe(false);
            expect(batch3.nextPage).toBeUndefined();
        });

        it('handles zero offset correctly (regression test)', async () => {
            const adapter = new RssAdapter({ rssUrl, httpClient });

            const result = await adapter.getArticles({ offset: 0, limit: 3 });
            expect(result.articles.length).toBe(3);
            expect(result.articles[0]?.title).toBe('Article 1');
            expect(result.articles[1]?.title).toBe('Article 2');
            expect(result.articles[2]?.title).toBe('Article 3');
            expect(result.hasMore).toBe(true);
            expect(result.nextPage).toBe(2);
        });

        it('handles limit-only pagination', async () => {
            const adapter = new RssAdapter({ rssUrl, httpClient });

            const result = await adapter.getArticles({ limit: 3 });
            expect(result.articles.length).toBe(3);
            expect(result.articles[0]?.title).toBe('Article 1');
            expect(result.articles[2]?.title).toBe('Article 3');
            expect(result.hasMore).toBe(true);
            expect(result.nextPage).toBe(2);
        });

        it('handles out-of-bounds pagination gracefully', async () => {
            const adapter = new RssAdapter({ rssUrl, httpClient });

            // Page beyond available data
            const result = await adapter.getArticles({ page: 10, limit: 2 });
            expect(result.articles.length).toBe(0);
            expect(result.hasMore).toBe(false);
            expect(result.nextPage).toBeUndefined();
        });

        it('handles offset beyond available data gracefully', async () => {
            const adapter = new RssAdapter({ rssUrl, httpClient });

            // Offset beyond available data
            const result = await adapter.getArticles({ offset: 10, limit: 2 });
            expect(result.articles.length).toBe(0);
            expect(result.hasMore).toBe(false);
            expect(result.nextPage).toBeUndefined();
        });

        it('produces consistent results between page and offset modes', async () => {
            const adapter = new RssAdapter({ rssUrl, httpClient });

            // Get second "page" using both methods
            const pageResult = await adapter.getArticles({ page: 2, limit: 2 });
            const offsetResult = await adapter.getArticles({ offset: 2, limit: 2 });

            expect(pageResult.articles).toEqual(offsetResult.articles);
            expect(pageResult.hasMore).toBe(offsetResult.hasMore);
            // Both should have the same nextPage value (both are 3 in this case)
            expect(pageResult.nextPage).toBe(3);
            expect(offsetResult.nextPage).toBe(3);
            expect(pageResult.totalCount).toBe(5);
            expect(offsetResult.totalCount).toBe(5);
        });
    });
});
