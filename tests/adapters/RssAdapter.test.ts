import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { createHttpClient, RssAdapter } from '../../src';

describe('RssAdapter', () => {
    let mockAxios: MockAdapter;
    let httpClient: ReturnType<typeof createHttpClient>;

    const rssUrl = '/rss';
    const rssXmlString = `
      <rss version="2.0">
        <channel>
          <title>Example News</title>
          <item>
            <title>Cats take over city</title>
            <link>https://example.com/cats</link>
          </item>
          <item>
            <title>Dogs run for mayor</title>
            <link>https://example.com/dogs</link>
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
        expect(result.articles.length).toBe(2);
        expect(result.articles[0]?.title).toBe('Cats take over city');
        expect(result.articles[1]?.title).toBe('Dogs run for mayor');
        expect(result.totalCount).toBe(2);
        expect(result.hasMore).toBe(false);
    });
});
