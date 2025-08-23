export * from './adapters/NewsApiOrgAdapter';
export * from './adapters/RssAdapter';

export type { AdapterInterface } from './core/AdapterInterface';
export type { AdapterSearchOptions } from './core/AdapterSearchOptions';
export { Aggregator } from './core/Aggregator';
export type { NewsArticleInterface } from './core/NewsArticleInterface';
export type { NewsArticleResponse } from './core/NewsArticleResponse';

export * from './utils/createHttpClient';
