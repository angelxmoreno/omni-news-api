import type { AdapterInterface } from './AdapterInterface';
import type { AdapterSearchOptions } from './AdapterSearchOptions';
import type { NewsArticleResponse } from './NewsArticleResponse';

export class Aggregator {
    public readonly adapters: AdapterInterface[];

    constructor(adapters: AdapterInterface[]) {
        this.adapters = adapters;
    }

    async fetchAll(options?: AdapterSearchOptions): Promise<NewsArticleResponse> {
        const results = await Promise.all(this.adapters.map((adapter) => adapter.getArticles(options)));

        const allArticles = results.flatMap((result) => result.articles);
        const totalCount = results.reduce((sum, result) => sum + (result.totalCount || 0), 0);
        const hasMore = results.some((result) => result.hasMore);

        return {
            articles: allArticles,
            totalCount,
            hasMore,
        };
    }
}
