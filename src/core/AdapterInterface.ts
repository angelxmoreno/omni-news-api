import type { AdapterSearchOptions } from './AdapterSearchOptions';
import type { NewsArticleResponse } from './NewsArticleResponse';

export interface AdapterInterface {
    getArticles(options?: AdapterSearchOptions): Promise<NewsArticleResponse>;
}
