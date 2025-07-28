export interface AskRequest {
  question: string;
  userId?: string;
  sessionId?: string;
  context?: any;
  session_id?: string | null;
  user_id?: string;
  dataset_id?: string;
  similarity_threshold?: number;
  max_chunks?: number;
}

export interface ProcessingResult {
  success: boolean;
  data?: any;
  error?: string;
  suggestions?: string[];
  answer?: string;
  sources?: any[];
  session_id?: string;
  query_id?: string;
  suggestions_header?: string;
  performance?: {
    embedding_ms?: number;
    search_ms?: number;
    generate_ms?: number;
    total_ms?: number;
  };
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
