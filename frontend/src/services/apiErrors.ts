import { errorResponseBody, type ErrorResponseBody } from '@peloton/shared';

// Re-export for convenience
export type ApiErrorResponse = ErrorResponseBody;

/**
 * Custom API error class
 * Provides structured error information for UI error handling
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';

    // Maintain proper stack trace for debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Check if error is a client error (4xx)
   */
  isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  /**
   * Check if error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.statusCode >= 500;
  }

  /**
   * Check if error is a specific error code
   */
  hasCode(code: string): boolean {
    return this.code === code;
  }
}

/**
 * Type guard to check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

// Re-export shared schema for error validation
export { errorResponseBody };
