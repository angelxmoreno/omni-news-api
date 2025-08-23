export interface NewsArticleInterface {
    url: string;
    title: string;
    author?: string;
    source?: string;
    publishedAt?: Date;
    description?: string;
    imageUrl?: string;
    category?: string;
    language?: string;
}
