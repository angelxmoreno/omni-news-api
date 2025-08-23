import { AdapterError } from './AdapterError';

/**
 * Error thrown when data parsing/validation fails
 */
export class ParseError extends AdapterError {
    public readonly validationErrors?: unknown[];

    constructor(message: string, cause?: unknown, validationErrors?: unknown[]) {
        super(message, 'PARSE_ERROR', cause);
        this.name = 'ParseError';
        this.validationErrors = validationErrors;
    }

    static fromZodError(error: unknown): ParseError {
        const message = 'Data validation failed';
        const errorObj = error as { errors?: unknown[] };
        const validationErrors = errorObj.errors || [];

        return new ParseError(message, error, validationErrors);
    }
}
