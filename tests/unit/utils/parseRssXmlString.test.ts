import { describe, expect, it } from 'bun:test';
import { parseRssXmlString, type RssFeed } from '../../../src/utils/parseRssXmlString';

describe('parseRssXmlString', () => {
    it('parses a single-item RSS feed correctly', () => {
        const xml = `
      <rss version="2.0">
        <channel>
          <title>Example News</title>
          <item>
            <title>Cats take over city</title>
            <link>https://example.com/cats</link>
            <pubDate>Mon, 21 Aug 2025 10:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>
    `;

        const feed: RssFeed = parseRssXmlString(xml);

        expect(feed.channel.items.length).toBe(1);
        expect(feed.channel.items[0]?.title).toBe('Cats take over city');
        expect(feed.channel.items[0]?.link).toBe('https://example.com/cats');
        expect(feed.channel.items[0]?.pubDate).toBe('Mon, 21 Aug 2025 10:00:00 GMT');
    });

    it('parses a multiple-items RSS feed correctly', () => {
        const xml = `
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

        const feed: RssFeed = parseRssXmlString(xml);

        expect(feed.channel.items.length).toBe(2);
        expect(feed.channel.items[0]?.title).toBe('Cats take over city');
        expect(feed.channel.items[1]?.title).toBe('Dogs run for mayor');
    });

    it('throws an error for invalid XML', () => {
        const invalidXml = `not valid XML`;

        expect(() => parseRssXmlString(invalidXml)).toThrow('RSS parse error');
    });
});
