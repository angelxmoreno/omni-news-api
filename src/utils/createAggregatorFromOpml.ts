import type { AxiosInstance } from 'axios';
import { RssAdapter } from '../adapters/RssAdapter';
import type { AdapterInterface } from '../core/AdapterInterface';
import { Aggregator } from '../core/Aggregator';
import { parseOpmlXmlString } from './parseOpmlXmlString';

export const createAggregatorFromOpml = async (opmlUrl: string, httpClient: AxiosInstance): Promise<Aggregator> => {
    const { data } = await httpClient.get(opmlUrl);

    const opml = parseOpmlXmlString(data);
    const adapters: AdapterInterface[] = [];

    for (const entry of opml.entries) {
        adapters.push(
            new RssAdapter({
                httpClient,
                rssUrl: entry.xmlUrl,
            })
        );
    }

    return new Aggregator(adapters);
};
