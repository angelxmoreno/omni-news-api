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

        // Apply pagination if provided - normalize to startIndex approach
        let startIndex = 0;
        let limit = newsArticles.length; // Default to all articles
        let derivedPage = 1;

        if (options?.limit !== undefined) {
            limit = options.limit;
        }

        if (options?.offset !== undefined && options?.limit !== undefined) {
            startIndex = options.offset;
            derivedPage = Math.floor(options.offset / options.limit) + 1;
        } else if (options?.page !== undefined && options?.limit !== undefined) {
            derivedPage = options.page;
            startIndex = (options.page - 1) * options.limit;
        } else if (options?.limit !== undefined) {
            startIndex = 0;
            derivedPage = 1;
        }

        // Safe array slicing with bounds checking
        const endIndex = Math.min(startIndex + limit, newsArticles.length);
        const paginatedArticles = newsArticles.slice(startIndex, endIndex);

        // Correct hasMore and nextPage calculations
        const hasMore = endIndex < newsArticles.length;
        const nextPage = hasMore ? derivedPage + 1 : undefined;

        return {
            articles: paginatedArticles,
            totalCount: newsArticles.length,
            hasMore,
            nextPage,
        };
    }
}
