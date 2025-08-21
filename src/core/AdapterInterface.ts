import type { NewsArticleInterface } from './NewsArticleInterface.ts';

export interface AdapterInterface {
    getArticles(): Promise<NewsArticleInterface[]>;
}
