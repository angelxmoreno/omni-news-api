import type { NewsArticleInterface } from './NewsArticleInterface';

export interface NewsArticleResponse {
    articles: NewsArticleInterface[];
    totalCount?: number;
    hasMore: boolean;
    nextCursor?: string;
    nextPage?: number;
}
