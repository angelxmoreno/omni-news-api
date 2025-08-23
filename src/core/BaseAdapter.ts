import axios from 'axios';
import { ZodError } from 'zod';
import type { AdapterInterface } from './AdapterInterface';
import type { AdapterSearchOptions } from './AdapterSearchOptions';
import { AdapterError, NetworkError, ParseError } from './errors';
import type { NewsArticleResponse } from './NewsArticleResponse';

/**
 * Abstract base class for all news adapters
 * Provides universal error handling and standardized error types
 */
export abstract class BaseAdapter implements AdapterInterface {
    /**
     * Abstract method that subclasses must implement to fetch articles
     * Should throw errors - they will be caught and properly classified by getArticles()
     */
    protected abstract fetchArticlesInternal(options?: AdapterSearchOptions): Promise<NewsArticleResponse>;

    /**
     * Public method that wraps fetchArticlesInternal with error handling
     * Classifies and re-throws errors as appropriate adapter error types
     */
    async getArticles(options?: AdapterSearchOptions): Promise<NewsArticleResponse> {
        try {
            return await this.fetchArticlesInternal(options);
        } catch (error: unknown) {
            // Re-throw already classified errors
            if (error instanceof AdapterError) {
                throw error;
            }

            // Classify and wrap different error types
            if (axios.isAxiosError(error)) {
                throw NetworkError.fromAxiosError(error);
            }

            if (error instanceof ZodError) {
                throw ParseError.fromZodError(error);
            }

            // Handle other known error types
            if (error instanceof SyntaxError && error.message.includes('JSON')) {
                throw new ParseError('Invalid JSON response', error);
            }

            if (error instanceof TypeError) {
                throw new ParseError('Data structure error', error);
            }

            // Fallback for unknown errors
            const message = error instanceof Error ? error.message : 'Unknown adapter error';
            throw new AdapterError(message, 'UNKNOWN_ERROR', error);
        }
    }
}
