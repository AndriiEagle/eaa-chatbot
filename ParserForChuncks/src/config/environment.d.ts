declare module '*config/environment.js' {
  export interface EnvVariables {
    OPENAI_API_KEY: string;
    SUPABASE_URL: string;
    SUPABASE_SERVICE_KEY: string;
    PORT?: string;
  }

  export const env: EnvVariables;
  export const PORT: number;
  export const EMBEDDING_MODEL: string;
  export const CHAT_MODEL: string;
  export const MAX_CONTEXT_CHUNKS: number;
  export const MIN_SIMILARITY: number;
}

declare module '*environment.js' {
  export interface EnvVariables {
    OPENAI_API_KEY: string;
    SUPABASE_URL: string;
    SUPABASE_SERVICE_KEY: string;
    PORT?: string;
  }

  export const env: EnvVariables;
  export const PORT: number;
  export const EMBEDDING_MODEL: string;
  export const CHAT_MODEL: string;
  export const MAX_CONTEXT_CHUNKS: number;
  export const MIN_SIMILARITY: number;
} 