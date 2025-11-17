import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env first, then backend .env (if it exists) for overrides
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });


const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3000'),

  // Database configuration
  POSTGRES_HOST: z.string().min(1).default('localhost'),
  POSTGRES_PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('5432'),
  POSTGRES_DB: z.string().min(1).default('peloton_db'),
  POSTGRES_USER: z.string().min(1).default('peloton'),
  POSTGRES_PASSWORD: z.string().min(1),
  DB_POOL_MIN: z.string().transform(Number).pipe(z.number().min(1)).default('2'),
  DB_POOL_MAX: z.string().transform(Number).pipe(z.number().min(1)).default('20'),

  // CORS
  ALLOWED_ORIGINS: z.string().transform((val) => val.split(',')),

  // API
  API_VERSION: z.string().default('v1'),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
