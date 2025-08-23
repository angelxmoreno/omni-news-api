import type { AxiosInstance } from 'axios';
import type { AdapterInterface } from '../core/AdapterInterface';
import type { AdapterSearchOptions } from '../core/AdapterSearchOptions';
import type { NewsArticleInterface } from '../core/NewsArticleInterface';
import type { NewsArticleResponse } from '../core/NewsArticleResponse';

export interface NewsApiOrgSearchParams {
    q?: string;
    sources?: string;
    domains?: string;
    from?: string;
    to?: string;
    language?: string;
    sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
    pageSize?: number;
    page?: number;
}

export interface NewsApiOrgAdapterOptions {
    apiKey: string;
    httpClient: AxiosInstance;
    searchParams?: NewsApiOrgSearchParams;
}

interface NewsApiArticle {
    title: string;
    url: string;
    author?: string;
    source: {
        name: string;
    };
    publishedAt: string;
    description?: string;
    urlToImage?: string;
    content?: string;
}

interface NewsApiResponse {
    articles: NewsApiArticle[];
    status: string;
    totalResults: number;
}

export class NewsApiOrgAdapter implements AdapterInterface {
    protected httpClient: AxiosInstance;
    protected apiKey: string;
    protected searchParams?: NewsApiOrgSearchParams;

    constructor({ apiKey, httpClient, searchParams }: NewsApiOrgAdapterOptions) {
        this.apiKey = apiKey;
        this.httpClient = httpClient;
        this.searchParams = searchParams;
    }

    async getArticles(options?: AdapterSearchOptions): Promise<NewsArticleResponse> {
        // Merge runtime options with constructor search params
        const params = {
            ...this.searchParams,
            ...(options?.page && { page: options.page }),
            ...(options?.limit && { pageSize: Math.min(options.limit, 100) }), // NewsAPI max is 100
        };

        const { data } = await this.httpClient.get<NewsApiResponse>('/v2/everything', {
            baseURL: 'https://newsapi.org',
            headers: { 'X-API-Key': this.apiKey },
            params,
        });

        const articles: NewsArticleInterface[] = data.articles.map((article) => ({
            title: article.title,
            url: article.url,
            author: article.author || undefined,
            source: article.source.name,
            publishedAt: new Date(article.publishedAt),
            description: article.description,
            imageUrl: article.urlToImage,
            language: this.searchParams?.language,
        }));

        return {
            articles,
            totalCount: data.totalResults,
            hasMore: (params.page || 1) * (params.pageSize || 20) < data.totalResults,
            nextPage:
                (params.page || 1) + 1 <= Math.ceil(data.totalResults / (params.pageSize || 20))
                    ? (params.page || 1) + 1
                    : undefined,
        };
    }
}
