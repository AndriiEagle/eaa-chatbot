import { z } from 'zod';

/** Определяем schema */
const schema = z.object({
  OPENAI_API_KEY: z.string(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string(),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;

export const CHAT_MODEL = 'gpt-4o-mini';
export const EMBEDDING_MODEL = 'text-embedding-ada-002';
