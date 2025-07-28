import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required.'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL.'),
  SUPABASE_SERVICE_KEY: z.string().min(1, 'SUPABASE_SERVICE_KEY is required.'),
  PORT: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

try {
  const env = envSchema.parse(process.env);
  module.exports = {
    env,
    PORT: Number(env.PORT) || 3000,
    EMBEDDING_MODEL: 'text-embedding-ada-002',
    CHAT_MODEL: 'gpt-4o-mini',
  };
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error(
      '❌ Invalid environment variables:',
      error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n')
    );
  } else {
    console.error('❌ An unexpected error occurred:', error);
  }
  process.exit(1);
}
