// Global augmentation for NodeJS ProcessEnv
// Based on best practices from: https://www.lucasamos.dev/articles/tsenvvars
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly OPENAI_API_KEY: string;
      readonly SUPABASE_URL: string;
      readonly SUPABASE_SERVICE_KEY: string;
      readonly PORT?: string;
      readonly NODE_ENV?: 'development' | 'production' | 'test';
      readonly CI?: string;
      readonly VITEST?: string;
      readonly SKIP_ENV_VALIDATION?: string;
    }
  }
}

export {}; 