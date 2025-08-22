import type { AdapterInterface } from './AdapterInterface.ts';
import type { NewsArticleInterface } from './NewsArticleInterface.ts';

export class Aggregator {
    protected adapters: AdapterInterface[];

    constructor(adapters: AdapterInterface[]) {
        this.adapters = adapters;
    }

    async fetchAll(): Promise<NewsArticleInterface[]> {
        const results = await Promise.all(this.adapters.map((a) => a.getArticles()));
        return results.flat();
    }
}
