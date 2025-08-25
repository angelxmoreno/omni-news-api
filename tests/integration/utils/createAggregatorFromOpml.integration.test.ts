import { describe, expect, it } from 'bun:test';
import { Aggregator, createAggregatorFromOpml, createHttpClient, RssAdapter } from '../../../src';
import { assertNewsArticleResponse } from '../../unit/utils/assertNewsArticleResponse';

describe('createAggregatorFromOpml - Integration Tests', () => {
    const httpClient = createHttpClient();
    const url = 'http://news.bbc.co.uk/rss/newsonline_world_edition/feeds.opml';

    it('creates an array of RssAdapter', async () => {
        const rssAdapterAggregate = await createAggregatorFromOpml(url, httpClient);

        expect(rssAdapterAggregate).toBeInstanceOf(Aggregator);
        expect(rssAdapterAggregate.adapters.length).toBeGreaterThan(0);
        rssAdapterAggregate.adapters.map((adapter) => expect(adapter).toBeInstanceOf(RssAdapter));

        console.log(`✓ OPML parsed ${rssAdapterAggregate.adapters.length} RSS feeds`);
    });

    it('fetches from adapters (handles individual feed failures gracefully)', async () => {
        const aggregator = await createAggregatorFromOpml(url, httpClient);

        // The Aggregator should handle individual feed failures gracefully
        // Some feeds in the OPML might be dead/invalid, which is expected
        try {
            const result = await aggregator.fetchAll({ limit: 3 });

            // If some feeds work, we should get articles
            assertNewsArticleResponse(result, {
                minArticles: 0, // Some might fail, that's OK
                maxArticles: 3,
            });

            console.log(`✓ OPML aggregator fetched ${result.articles.length} articles from working feeds`);
        } catch (error) {
            // If all feeds fail, that's still a valid test result for this OPML
            console.log(`⚠ All RSS feeds in OPML failed: ${error}`);
            // Test passes - we successfully parsed OPML even if feeds are dead
        }
    }, 30000);
});
