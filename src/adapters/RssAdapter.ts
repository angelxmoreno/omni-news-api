import type { AxiosInstance } from 'axios';
import type { AdapterInterface } from '../core/AdapterInterface';
import type { AdapterSearchOptions } from '../core/AdapterSearchOptions';
import type { NewsArticleInterface } from '../core/NewsArticleInterface';
import type { NewsArticleResponse } from '../core/NewsArticleResponse';
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

    async getArticles(options?: AdapterSearchOptions): Promise<NewsArticleResponse> {
        const { data } = await this.httpClient.get(this.rssUrl);
        const rssFeed = parseRssXmlString(data);

        const newsArticles: NewsArticleInterface[] = [];

        for (const item of rssFeed.channel.items) {
            const newsArticle: NewsArticleInterface = {
                title: item.title,
                url: item.link,
                publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
                description: item.description,
                author: item.author,
                category: item.category,
                imageUrl: item.enclosure?.url,
            };

            newsArticles.push(newsArticle);
        }

        // Apply pagination if provided
        let paginatedArticles = newsArticles;
        if (options?.offset && options?.limit) {
            paginatedArticles = newsArticles.slice(options.offset, options.offset + options.limit);
        } else if (options?.page && options?.limit) {
            const startIndex = (options.page - 1) * options.limit;
            paginatedArticles = newsArticles.slice(startIndex, startIndex + options.limit);
        } else if (options?.limit) {
            paginatedArticles = newsArticles.slice(0, options.limit);
        }

        return {
            articles: paginatedArticles,
            totalCount: newsArticles.length,
            hasMore: paginatedArticles.length < newsArticles.length,
            nextPage:
                options?.page && options?.limit && paginatedArticles.length === options.limit
                    ? options.page + 1
                    : undefined,
        };
    }
}
