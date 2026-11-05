import { z } from 'zod';

/**
 * Build-time configuration. Vite inlines every `VITE_*` variable into the public
 * bundle, so nothing here may be secret.
 */
const envSchema = z.object({
  VITE_SIMULATED_LATENCY_MS: z.coerce.number().int().min(0).max(10_000).default(0),
  VITE_SIMULATED_FAILURE_RATE: z.coerce.number().min(0).max(1).default(0),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, unknown>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
