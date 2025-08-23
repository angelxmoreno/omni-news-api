import { AdapterError } from './AdapterError';

interface ErrorWithResponse {
    response?: {
        status?: number;
    };
    config?: {
        url?: string;
    };
    message?: string;
}

/**
 * Error thrown when network/HTTP requests fail
 */
export class NetworkError extends AdapterError {
    public readonly statusCode?: number;
    public readonly url?: string;

    constructor(message: string, statusCode?: number, url?: string, cause?: unknown) {
        const code = statusCode ? `HTTP_${statusCode}` : 'NETWORK_ERROR';
        super(message, code, cause);
        this.name = 'NetworkError';
        this.statusCode = statusCode;
        this.url = url;
    }

    static fromAxiosError(error: unknown): NetworkError {
        const errorObj = error as ErrorWithResponse;
        const statusCode = errorObj.response?.status;
        const url = errorObj.config?.url;
        const message = errorObj.message || 'Network request failed';

        return new NetworkError(message, statusCode, url, error);
    }
}
