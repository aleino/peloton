import { z } from 'zod';

/**
 * Standard error response
 */
export const errorResponseBody = z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
});

export type ErrorResponseBody = z.infer<typeof errorResponseBody>;
