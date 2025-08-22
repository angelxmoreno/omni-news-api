import type { NewsArticleInterface } from './NewsArticleInterface';

export interface AdapterInterface {
    getArticles(): Promise<NewsArticleInterface[]>;
}
