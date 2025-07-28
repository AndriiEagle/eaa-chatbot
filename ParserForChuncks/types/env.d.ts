export {}; // превращаем файл в модуль
declare global {
  namespace NodeJS {
    /** Расширяем стандартный ProcessEnv тем, что описано в schema */
    interface ProcessEnv extends Record<string, string | undefined> {
      OPENAI_API_KEY: string;
      SUPABASE_URL:  string;
      SUPABASE_SERVICE_KEY: string;
    }
  }
} 