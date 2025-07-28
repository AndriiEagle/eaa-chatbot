import { z } from 'zod';

/** Определяем schema с дефолтными значениями для тестов */
const schema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  NODE_ENV: z.enum(['development','test','production']).default('development'),
  PORT: z.string().optional(),
});

// Для тестового окружения используем дефолтные значения если они не установлены
const processEnv = process.env.NODE_ENV === 'test' ? {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'sk-test-mock-openai-key-for-ci-testing',
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://test-project-ci.supabase.co',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-mock-service-key-for-ci',
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
} : process.env;

export const env = schema.parse(processEnv);
export type Env = z.infer<typeof schema>;

export const CHAT_MODEL = 'gpt-4o-mini';
export const EMBEDDING_MODEL = 'text-embedding-ada-002'; 