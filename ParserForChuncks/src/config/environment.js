import 'dotenv/config';
import { z } from 'zod';
// Определения схемы для переменных окружения
const envSchema = z.object({
    OPENAI_API_KEY: z.string(),
    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_KEY: z.string(),
    PORT: z.string().optional(),
});
// Валидация переменных окружения
export const env = envSchema.parse(process.env);
// Настройки
export const PORT = Number(env.PORT ?? 3000);
export const EMBEDDING_MODEL = 'text-embedding-ada-002';
export const CHAT_MODEL = 'gpt-4o-mini'; // cheaper GPT‑4‑turbo variant
export const MAX_CONTEXT_CHUNKS = 5;
export const MIN_SIMILARITY = 0.78;
