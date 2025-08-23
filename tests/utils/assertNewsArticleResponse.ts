import { expect } from 'bun:test';
import type { NewsArticleInterface, NewsArticleResponse } from '../../src';

export interface NewsArticleResponseAssertionOptions {
    /** Expected minimum number of articles (default: 0) */
    minArticles?: number;
    /** Expected maximum number of articles */
    maxArticles?: number;
    /** Expected exact number of articles */
    exactArticles?: number;
    /** Whether to validate individual article structure (default: true) */
    validateArticleStructure?: boolean;
    /** Whether to validate totalCount field (default: true) */
    validateTotalCount?: boolean;
    /** Whether totalCount should be greater than 0 (default: false) */
    expectNonZeroTotalCount?: boolean;
}

/**
 * Comprehensive assertion utility for NewsArticleResponse objects
 * Reduces duplication across integration and unit tests
 */
export function assertNewsArticleResponse(
    result: NewsArticleResponse,
    options: NewsArticleResponseAssertionOptions = {}
): void {
    const {
        minArticles = 0,
        maxArticles,
        exactArticles,
        validateArticleStructure = true,
        validateTotalCount = true,
        expectNonZeroTotalCount = false,
    } = options;

    // Basic structure validation
    expect(result).toBeDefined();
    expect(result.articles).toBeDefined();
    expect(Array.isArray(result.articles)).toBe(true);
    expect(typeof result.hasMore).toBe('boolean');

    // Article count validations
    if (exactArticles !== undefined) {
        expect(result.articles).toHaveLength(exactArticles);
    } else {
        expect(result.articles.length).toBeGreaterThanOrEqual(minArticles);
        if (maxArticles !== undefined) {
            expect(result.articles.length).toBeLessThanOrEqual(maxArticles);
        }
    }

    // Total count validation
    if (validateTotalCount) {
        expect(result.totalCount).toBeDefined();
        expect(typeof result.totalCount).toBe('number');
        if (expectNonZeroTotalCount) {
            expect(result.totalCount).toBeGreaterThan(0);
        } else {
            expect(result.totalCount).toBeGreaterThanOrEqual(0);
        }
    }

    // Individual article structure validation
    if (validateArticleStructure && result.articles.length > 0) {
        const article = result.articles[0];
        expect(article).toBeDefined();
        if (!article) return;

        assertNewsArticle(article);
    }
}

/**
 * Validates individual NewsArticleInterface structure
 */
export function assertNewsArticle(article: NewsArticleInterface): void {
    // Required fields
    expect(typeof article.title).toBe('string');
    expect(article.title.length).toBeGreaterThan(0);
    expect(typeof article.url).toBe('string');
    expect(article.url).toMatch(/^https?:\/\//);

    // Optional fields - validate type if present
    if (article.publishedAt) {
        expect(article.publishedAt).toBeInstanceOf(Date);
    }
    if (article.description) {
        expect(typeof article.description).toBe('string');
    }
    if (article.imageUrl) {
        expect(typeof article.imageUrl).toBe('string');
        expect(article.imageUrl).toMatch(/^https?:\/\//);
    }
    if (article.author) {
        expect(typeof article.author).toBe('string');
    }
    if (article.source) {
        expect(typeof article.source).toBe('string');
    }
    if (article.category) {
        expect(typeof article.category).toBe('string');
    }
    if (article.language) {
        expect(typeof article.language).toBe('string');
    }
}

/**
 * Asserts that two NewsArticleResponse objects have no overlapping articles
 * Useful for pagination tests
 */
export function assertNonOverlappingResults(result1: NewsArticleResponse, result2: NewsArticleResponse): void {
    const urls1 = result1.articles.map((a) => a.url);
    const urls2 = result2.articles.map((a) => a.url);
    const overlap = urls1.filter((url) => urls2.includes(url));
    expect(overlap.length).toBe(0);
}
