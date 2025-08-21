import { z } from 'zod';
import { xml2json } from './xml2json';

// Zod schemas
const RssItemSchema = z.object({
    title: z.string(),
    link: z.string(),
    pubDate: z.string().optional(),
});

const RssChannelSchema = z.object({
    title: z.string().optional(),
    link: z.string().optional(),
    description: z.string().optional(),
    item: z.union([RssItemSchema, z.array(RssItemSchema)]),
});

const RssFeedSchema = z.object({
    rss: z.object({
        channel: RssChannelSchema,
    }),
});

// Types
export type RssItem = z.infer<typeof RssItemSchema>;

export interface RssChannel extends Omit<z.infer<typeof RssChannelSchema>, 'item'> {
    items: RssItem[];
}

export interface RssFeed extends Omit<z.infer<typeof RssFeedSchema>, 'rss'> {
    channel: RssChannel;
}

// Parser
export const parseRssXmlString = (xmlString: string): RssFeed => {
    try {
        const parsed = xml2json<Record<string, unknown>>(xmlString);
        const feed = RssFeedSchema.parse(parsed);

        const channel = feed.rss.channel;
        const items: RssItem[] = Array.isArray(channel.item) ? channel.item : [channel.item];

        // Build a normalized feed without overwriting rss
        const normalizedFeed: RssFeed = {
            channel: {
                ...channel,
                items,
            },
        };

        delete (normalizedFeed.channel as unknown as { item?: unknown }).item;

        return normalizedFeed;
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? `RSS parse error: ${err.message}` : 'Unknown RSS parse error';
        throw new Error(errorMessage, { cause: err });
    }
};
