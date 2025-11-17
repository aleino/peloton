import { z } from 'zod';

/**
 * Environment variable schema with validation rules
 */
const envSchema = z.object({
  // API Configuration
  VITE_API_BASE_URL: z.string().url({
    message: 'VITE_API_BASE_URL must be a valid URL',
  }),

  // Mapbox Configuration
  VITE_MAPBOX_TOKEN: z
    .string()
    .min(1, 'VITE_MAPBOX_TOKEN is required')
    .startsWith('pk.', 'VITE_MAPBOX_TOKEN must start with "pk."'),

  // Localization
  VITE_DEFAULT_LOCALE: z.enum(['en', 'fi']).default('en'),

  // Feature Flags
  VITE_ENABLE_ANALYTICS: z
    .string()
    .default('false')
    .transform((val) => val === 'true')
    .pipe(z.boolean()),

  VITE_ENABLE_DEBUG_MODE: z
    .string()
    .default('false')
    .transform((val) => val === 'true')
    .pipe(z.boolean()),

  // Environment
  VITE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Type-safe environment variables
 * Validated at application startup
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 * Throws error if validation fails
 */
function parseEnv(): Env {
  try {
    return envSchema.parse({
      VITE_API_BASE_URL: import.meta.env['VITE_API_BASE_URL'],
      VITE_MAPBOX_TOKEN: import.meta.env['VITE_MAPBOX_TOKEN'],
      VITE_DEFAULT_LOCALE: import.meta.env['VITE_DEFAULT_LOCALE'],
      VITE_ENABLE_ANALYTICS: import.meta.env['VITE_ENABLE_ANALYTICS'],
      VITE_ENABLE_DEBUG_MODE: import.meta.env['VITE_ENABLE_DEBUG_MODE'],
      VITE_ENV: import.meta.env['VITE_ENV'],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((err: z.ZodIssue) => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n');

      throw new Error(
        `Environment variable validation failed:\n${errorMessages}\n\n` +
        'Please check your .env.local file and ensure all required variables are set correctly.'
      );
    }
    throw error;
  }
}

/**
 * Validated environment variables
 * Import this object to access environment variables in a type-safe way
 *
 * @example
 * import { env } from '@/config/env';
 * console.log(env.VITE_API_BASE_URL);
 */
export const env = parseEnv();

/**
 * Check if running in development mode
 */
export const isDevelopment = env.VITE_ENV === 'development';

/**
 * Check if running in production mode
 */
export const isProduction = env.VITE_ENV === 'production';

/**
 * Check if running in test mode
 */
export const isTest = env.VITE_ENV === 'test';
