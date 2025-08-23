/**
 * Base error class for all adapter-related errors
 */
export class AdapterError extends Error {
    public override name: string;
    public readonly code: string;
    public override readonly cause?: unknown;

    constructor(message: string, code = 'ADAPTER_ERROR', cause?: unknown) {
        super(message);
        this.name = 'AdapterError';
        this.code = code;
        this.cause = cause;

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AdapterError);
        }
    }
}
