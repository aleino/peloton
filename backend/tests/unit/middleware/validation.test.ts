import type { Request, Response, NextFunction } from 'express';
import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';

import { validateQuery, validateParams, validateBody } from '../../../src/middleware/validation';

// Helper to create mock Express objects
function createMocks() {
  const req = {
    query: {},
    params: {},
    body: {},
  } as Request;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;

  const next = vi.fn() as unknown as NextFunction;

  return { req, res, next };
}

describe('Validation Middleware', () => {
  describe('validateQuery', () => {
    const schema = z.object({
      page: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
    });

    it('should call next() for valid query params', () => {
      const { req, res, next } = createMocks();
      req.query = { page: '1', limit: '10' };

      const middleware = validateQuery(schema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled(); // eslint-disable-line @typescript-eslint/unbound-method
    });

    it('should return 400 for invalid query params', () => {
      const { req, res, next } = createMocks();
      req.query = { page: 'invalid' };

      const middleware = validateQuery(schema);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400); // eslint-disable-line @typescript-eslint/unbound-method
      expect(res.json).toHaveBeenCalledWith( // eslint-disable-line @typescript-eslint/unbound-method
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_QUERY_PARAMS',
            message: 'Invalid query parameters',
          }) as Record<string, unknown>,
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should format validation errors with details', () => {
      const { req, res, next } = createMocks();
      req.query = { page: 'abc' };

      const middleware = validateQuery(schema);
      middleware(req, res, next);

      expect(res.json).toHaveBeenCalledWith( // eslint-disable-line @typescript-eslint/unbound-method
        expect.objectContaining({
          error: expect.objectContaining({
            details: expect.any(Object) as Record<string, unknown>,
          }) as Record<string, unknown>,
        })
      );
    });
  });

  describe('validateParams', () => {
    const schema = z.object({
      id: z.string().min(1),
    });

    it('should call next() for valid path params', () => {
      const { req, res, next } = createMocks();
      req.params = { id: '123' };

      const middleware = validateParams(schema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled(); // eslint-disable-line @typescript-eslint/unbound-method
    });

    it('should return 400 for invalid path params', () => {
      const { req, res, next } = createMocks();
      req.params = { id: '' };

      const middleware = validateParams(schema);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400); // eslint-disable-line @typescript-eslint/unbound-method
      expect(res.json).toHaveBeenCalledWith( // eslint-disable-line @typescript-eslint/unbound-method
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_PATH_PARAMS',
          }) as Record<string, unknown>,
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should format validation errors with details', () => {
      const { req, res, next } = createMocks();
      req.params = {};

      const middleware = validateParams(schema);
      middleware(req, res, next);

      expect(res.json).toHaveBeenCalledWith( // eslint-disable-line @typescript-eslint/unbound-method
        expect.objectContaining({
          error: expect.objectContaining({
            details: expect.any(Object) as Record<string, unknown>,
          }) as Record<string, unknown>,
        })
      );
    });
  });

  describe('validateBody', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().min(0),
    });

    it('should call next() for valid request body', () => {
      const { req, res, next } = createMocks();
      req.body = { name: 'John', age: 30 };

      const middleware = validateBody(schema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled(); // eslint-disable-line @typescript-eslint/unbound-method
    });

    it('should return 400 for invalid request body', () => {
      const { req, res, next } = createMocks();
      req.body = { name: '', age: -5 };

      const middleware = validateBody(schema);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400); // eslint-disable-line @typescript-eslint/unbound-method
      expect(res.json).toHaveBeenCalledWith( // eslint-disable-line @typescript-eslint/unbound-method
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_REQUEST_BODY',
            details: expect.any(Object) as Record<string, unknown>,
          }) as Record<string, unknown>,
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle multiple validation errors', () => {
      const { req, res, next } = createMocks();
      req.body = { name: '', age: -5 };

      const middleware = validateBody(schema);
      middleware(req, res, next);

      expect(res.json).toHaveBeenCalledWith( // eslint-disable-line @typescript-eslint/unbound-method
        expect.objectContaining({
          error: expect.objectContaining({
            details: expect.any(Object) as Record<string, unknown>,
          }) as Record<string, unknown>,
        })
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      const errorResponse = (res.json as any).mock.calls[0][0];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(errorResponse.error.details).toHaveProperty('name');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(errorResponse.error.details).toHaveProperty('age');
    });
  });

  describe('formatZodError', () => {
    it('should group errors by path', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      const { req, res } = createMocks();
      req.body = { email: 'invalid', age: 10 };

      const middleware = validateBody(schema);
      middleware(req, res, vi.fn() as unknown as NextFunction);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      const errorResponse = (res.json as any).mock.calls[0][0];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(errorResponse.error.details).toHaveProperty('email');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(errorResponse.error.details).toHaveProperty('age');
    });
  });
});
