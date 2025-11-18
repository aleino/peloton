import { env } from '@/config/env';
import { ApiError, errorResponseBody } from './apiErrors';
import { z } from 'zod';

/**
 * Request configuration options
 * 
 * @property params - Query parameters to append to URL
 * @property timeout - Request timeout in milliseconds (default: 30000)
 * @property schema - Optional Zod schema for response validation
 * @property strictValidation - If false, validation failures log warnings instead of throwing (default: true)
 * 
 * @example
 * // Strict validation (throws on mismatch)
 * await get<StationsResponse>('/stations', { 
 *   schema: stationsListResponseBody 
 * });
 * 
 * @example
 * // Soft validation (logs warning, returns data anyway)
 * await get<StationsResponse>('/stations', { 
 *   schema: stationsListResponseBody,
 *   strictValidation: false 
 * });
 */
export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  schema?: z.ZodType<unknown>;
  strictValidation?: boolean;
}

/**
 * Build full URL with base URL and query parameters
 */
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
  const url = new URL(endpoint, env.VITE_API_BASE_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  return url.toString();
}

/**
 * Create default headers for requests
 */
function getDefaultHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available (future enhancement)
  // const token = localStorage.getItem('authToken');
  // if (token) {
  //   headers['Authorization'] = `Bearer ${token}`;
  // }

  return headers;
}

/**
 * Transform fetch error to standardized ApiError
 */
async function transformFetchError(response: Response): Promise<ApiError> {
  let data: unknown;

  try {
    data = await response.json();
  } catch {
    // Response body is not JSON
    return new ApiError(
      response.status,
      'UNKNOWN_ERROR',
      `Request failed with status ${response.status}`,
      { statusText: response.statusText }
    );
  }

  // Try to parse error response using shared schema
  const parseResult = errorResponseBody.safeParse(data);

  if (parseResult.success) {
    const errorData = parseResult.data;
    return new ApiError(response.status, errorData.code, errorData.message, errorData.details);
  }

  // Fallback for non-standard error responses
  return new ApiError(
    response.status,
    'UNKNOWN_ERROR',
    `Request failed with status ${response.status}`,
    data
  );
}

/**
 * Base fetch wrapper with error handling, logging, and timeout
 */
async function fetchWithConfig<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
  const { params, timeout = 30000, ...fetchOptions } = config;
  const url = buildUrl(endpoint, params);

  // Setup timeout using AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Log request
    console.log(`[API] ${fetchOptions.method || 'GET'} ${url}`, {
      params,
      body: fetchOptions.body,
    });

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...getDefaultHeaders(),
        ...fetchOptions.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check if response is ok (status 200-299)
    if (!response.ok) {
      const apiError = await transformFetchError(response);

      console.error('[API] Response error:', {
        statusCode: apiError.statusCode,
        code: apiError.code,
        message: apiError.message,
        details: apiError.details,
      });

      throw apiError;
    }

    // Parse JSON response
    const data = await response.json();

    // Validate response with Zod schema if provided
    if (config.schema) {
      const parseResult = config.schema.safeParse(data);

      if (!parseResult.success) {
        const validationError = parseResult.error;

        if (config.strictValidation !== false) {
          // Strict mode (default): throw error
          const apiError = new ApiError(
            response.status,
            'VALIDATION_ERROR',
            'Response validation failed',
            {
              validationErrors: validationError.format(),
              receivedData: data,
            }
          );

          console.error('[API] Response validation error:', {
            url,
            errors: validationError.format(),
            receivedData: data,
          });

          throw apiError;
        } else {
          // Soft validation mode: log warning and return unvalidated data
          console.warn('[API] Response validation warning (soft mode):', {
            url,
            errors: validationError.format(),
            receivedData: data,
          });
        }
      }
    }

    // Log response
    console.log(`[API] ${response.status} ${url}`, data);

    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutError = new ApiError(0, 'TIMEOUT_ERROR', `Request timeout after ${timeout}ms`, {
        timeout,
      });

      console.error('[API] Timeout error:', timeoutError);

      throw timeoutError;
    }

    // Handle network errors
    if (error instanceof TypeError) {
      const networkError = new ApiError(
        0,
        'NETWORK_ERROR',
        'Network error occurred. Please check your connection.',
        { originalError: error.message }
      );

      console.error('[API] Network error:', networkError);

      throw networkError;
    }

    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Unknown error
    throw new ApiError(0, 'UNKNOWN_ERROR', 'An unexpected error occurred', {
      originalError: error,
    });
  }
}

/**
 * Typed GET request
 */
export async function get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
  return fetchWithConfig<T>(endpoint, {
    ...config,
    method: 'GET',
  });
}

/**
 * Typed POST request
 */
export async function post<T, D = unknown>(
  endpoint: string,
  data?: D,
  config?: RequestConfig
): Promise<T> {
  const body = data ? JSON.stringify(data) : null;
  return fetchWithConfig<T>(endpoint, {
    ...config,
    method: 'POST',
    body,
  });
}

/**
 * Typed PUT request
 */
export async function put<T, D = unknown>(
  endpoint: string,
  data?: D,
  config?: RequestConfig
): Promise<T> {
  const body = data ? JSON.stringify(data) : null;
  return fetchWithConfig<T>(endpoint, {
    ...config,
    method: 'PUT',
    body,
  });
}

/**
 * Typed PATCH request
 */
export async function patch<T, D = unknown>(
  endpoint: string,
  data?: D,
  config?: RequestConfig
): Promise<T> {
  const body = data ? JSON.stringify(data) : null;
  return fetchWithConfig<T>(endpoint, {
    ...config,
    method: 'PATCH',
    body,
  });
}

/**
 * Typed DELETE request
 */
export async function del<T>(endpoint: string, config?: RequestConfig): Promise<T> {
  return fetchWithConfig<T>(endpoint, {
    ...config,
    method: 'DELETE',
  });
}
