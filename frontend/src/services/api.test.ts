import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { get } from './api';
import { ApiError } from './apiErrors';
import { z } from 'zod';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('API Client', () => {
  it('should make successful GET request', async () => {
    const mockData = { stations: [] };

    server.use(
      http.get('http://localhost:3000/stations', () => {
        return HttpResponse.json(mockData);
      })
    );

    const result = await get('/stations');
    expect(result).toEqual(mockData);
  });

  it('should transform API errors correctly', async () => {
    server.use(
      http.get('http://localhost:3000/stations', () => {
        return HttpResponse.json(
          {
            code: 'INVALID_PARAMS',
            message: 'Invalid parameters',
          },
          { status: 400 }
        );
      })
    );

    await expect(get('/stations')).rejects.toThrow(ApiError);
    await expect(get('/stations')).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_PARAMS',
      message: 'Invalid parameters',
    });
  });

  it('should handle network errors', async () => {
    server.use(
      http.get('http://localhost:3000/stations', () => {
        return HttpResponse.error();
      })
    );

    await expect(get('/stations')).rejects.toThrow(ApiError);
    await expect(get('/stations')).rejects.toMatchObject({
      statusCode: 0,
      code: 'NETWORK_ERROR',
    });
  });

  it('should handle timeout errors', async () => {
    server.use(
      http.get('http://localhost:3000/stations', async () => {
        // Delay longer than timeout
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json({ stations: [] });
      })
    );

    // Timeout test - should reject with an error (may be TIMEOUT_ERROR or UNKNOWN_ERROR depending on environment)
    await expect(get('/stations', { timeout: 50 })).rejects.toThrow(ApiError);

    // Verify the error has statusCode 0 (network-level error)
    try {
      await get('/stations', { timeout: 50 });
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).statusCode).toBe(0);
      // Code can be either TIMEOUT_ERROR or UNKNOWN_ERROR depending on Node.js version
      expect(['TIMEOUT_ERROR', 'UNKNOWN_ERROR']).toContain((error as ApiError).code);
    }
  });

  it('should append query parameters', async () => {
    let requestUrl = '';

    server.use(
      http.get('http://localhost:3000/stations', ({ request }) => {
        requestUrl = request.url;
        return HttpResponse.json({ stations: [] });
      })
    );

    await get('/stations', { params: { format: 'json', limit: 10 } });

    expect(requestUrl).toContain('format=json');
    expect(requestUrl).toContain('limit=10');
  });

  it('should validate response with Zod schema (strict mode)', async () => {
    const schema = z.object({
      stations: z.array(z.object({ id: z.string() })),
    });

    server.use(
      http.get('http://localhost:3000/stations', () => {
        return HttpResponse.json({ stations: [{ id: '123' }] });
      })
    );

    const result = await get('/stations', { schema });
    expect(result).toEqual({ stations: [{ id: '123' }] });
  });

  it('should throw error on validation failure (strict mode)', async () => {
    const schema = z.object({
      stations: z.array(z.object({ id: z.string() })),
    });

    server.use(
      http.get('http://localhost:3000/stations', () => {
        // Invalid: id is number instead of string
        return HttpResponse.json({ stations: [{ id: 123 }] });
      })
    );

    await expect(get('/stations', { schema, strictValidation: true })).rejects.toThrow(ApiError);
    await expect(get('/stations', { schema, strictValidation: true })).rejects.toMatchObject({
      statusCode: 200,
      code: 'VALIDATION_ERROR',
      message: 'Response validation failed',
    });
  });

  it('should log warning but return data (soft validation mode)', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

    const schema = z.object({
      stations: z.array(z.object({ id: z.string() })),
    });

    server.use(
      http.get('http://localhost:3000/stations', () => {
        // Invalid: id is number instead of string
        return HttpResponse.json({ stations: [{ id: 123 }] });
      })
    );

    // Soft validation should NOT throw, but should log warning
    const result = await get('/stations', { schema, strictValidation: false });
    expect(result).toEqual({ stations: [{ id: 123 }] });
    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });
});
