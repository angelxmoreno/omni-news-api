import { describe, expect, it } from 'bun:test';
import { RssAdapter } from '../../src/adapters/RssAdapter.ts';
import { createHttpClient } from '../../src/utils/createHttpClient.ts';
import { mockHttpClient } from '../helpers/mockHttpClient.ts';

describe('RssAdapter', () => {
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
    mockHttpClient.onGet(rssUrl).reply(200, rssXmlString);
    const httpClient = createHttpClient();

    it('fetches from the rss url provided', async () => {
        const adapter = new RssAdapter({
            rssUrl,
            httpClient,
        });
        const data = await adapter.getArticles();
        expect(data.length).toBe(2);
        expect(data[0]?.title).toBe('Cats take over city');
        expect(data[1]?.title).toBe('Dogs run for mayor');
    });
});
