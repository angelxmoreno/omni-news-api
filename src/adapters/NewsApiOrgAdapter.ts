import type { AxiosInstance } from 'axios';
import type { AdapterInterface } from '../core/AdapterInterface';
import type { NewsArticleInterface } from '../core/NewsArticleInterface';

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

    async getArticles(): Promise<NewsArticleInterface[]> {
        const { data } = await this.httpClient.get<NewsApiResponse>('/v2/everything', {
            baseURL: 'https://newsapi.org',
            headers: { 'X-API-Key': this.apiKey },
            params: this.searchParams,
        });

        return data.articles.map((article) => ({
            title: article.title,
            url: article.url,
            author: article.author || undefined,
            source: article.source.name,
            publishedAt: new Date(article.publishedAt),
        }));
    }
}
