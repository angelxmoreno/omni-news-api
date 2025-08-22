import type { AxiosInstance } from 'axios';
import type { AdapterInterface } from '../core/AdapterInterface';
import type { NewsArticleInterface } from '../core/NewsArticleInterface';
import { parseRssXmlString } from '../utils/parseRssXmlString';

export type RssAdapterOptions = {
    rssUrl: string;
    httpClient: AxiosInstance;
};

export class RssAdapter implements AdapterInterface {
    protected rssUrl: string;
    protected httpClient: AxiosInstance;

    constructor({ rssUrl, httpClient }: RssAdapterOptions) {
        this.rssUrl = rssUrl;
        this.httpClient = httpClient;
    }

    async getArticles() {
        const { data } = await this.httpClient.get(this.rssUrl);
        const rssFeed = parseRssXmlString(data);

        const newsArticles: NewsArticleInterface[] = [];

        for (const item of rssFeed.channel.items) {
            const newsArticle = {
                title: item.title,
                url: item.link,
                publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
            };

            newsArticles.push(newsArticle);
        }

        return newsArticles;
    }
}
