import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';

/**
 * Validation error response format
 */
interface ValidationErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

/**
 * Format Zod validation errors into a user-friendly structure
 */
function formatZodError(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.');
    const message = issue.message;

    if (!formatted[path]) {
      formatted[path] = [];
    }

    formatted[path].push(message);
  }

  return formatted;
}

/**
 * Middleware factory to validate request query parameters
 *
 * @example
 * router.get('/stations', validateQuery(stationsGetQueryParams), handler);
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errorResponse: ValidationErrorResponse = {
        error: {
          code: 'INVALID_QUERY_PARAMS',
          message: 'Invalid query parameters',
          details: formatZodError(result.error),
        },
      };

      res.status(400).json(errorResponse);
      return;
    }

    // Attach validated data to request (optionally)
    req.query = result.data;
    next();
  };
}

/**
 * Middleware factory to validate request path parameters
 *
 * @example
 * router.get('/stations/:stationId', validateParams(stationsGetPathParams), handler);
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errorResponse: ValidationErrorResponse = {
        error: {
          code: 'INVALID_PATH_PARAMS',
          message: 'Invalid path parameters',
          details: formatZodError(result.error),
        },
      };

      res.status(400).json(errorResponse);
      return;
    }

    req.params = result.data;
    next();
  };
}

/**
 * Middleware factory to validate request body
 *
 * @example
 * router.post('/stations', validateBody(createStationSchema), handler);
 */
export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errorResponse: ValidationErrorResponse = {
        error: {
          code: 'INVALID_REQUEST_BODY',
          message: 'Invalid request body',
          details: formatZodError(result.error),
        },
      };

      res.status(400).json(errorResponse);
      return;
    }

    req.body = result.data;
    next();
  };
}

/**
 * Type-safe request handler with validated data
 * Use this type when you want TypeScript to know about validated data
 *
 * @example
 * const handler: ValidatedRequestHandler<typeof schema> = (req, res) => {
 *   const { bounds, format } = req.query; // fully typed!
 * };
 */
export type ValidatedRequestHandler<T extends ZodSchema> = (
  req: Request<any, any, any, T['_output']>,
  res: Response,
  next: NextFunction
) => void | Promise<void>;
