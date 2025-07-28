import 'dotenv/config';
import { z } from 'zod';

// Environment variables schema definition
const envSchema = z.object({
  OPENAI_API_KEY: z.string(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string(),
  PORT: z.string().optional(),
});

// Type definition for environment variables
type EnvType = z.infer<typeof envSchema>;

let env: EnvType;

// Skip validation in test environment for consistency
if (
  process.env.NODE_ENV === 'test' ||
  process.env.VITEST ||
  process.env.CI === 'true' ||
  process.env.SKIP_ENV_VALIDATION === 'true'
) {
  console.log('🧪 Skipping environment variable validation in test mode.');
  env = {
    OPENAI_API_KEY: 'test',
    SUPABASE_URL: 'http://test.co',
    SUPABASE_SERVICE_KEY: 'test',
  };
} else {
  // Environment variables validation
  env = envSchema.parse(process.env);
}

export { env };

// Configuration settings
export const PORT = Number(env.PORT ?? 3000);
export const EMBEDDING_MODEL = 'text-embedding-ada-002';
export const CHAT_MODEL = 'gpt-4o-mini'; // cheaper GPT‑4‑turbo variant
export const MAX_CONTEXT_CHUNKS = 5;
export const MIN_SIMILARITY = 0.78;
