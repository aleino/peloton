import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

// Extend Zod with OpenAPI capabilities (must be called once)
extendZodWithOpenApi(z);

export * from './schemas/index.js';
export * from './types/index.js';
