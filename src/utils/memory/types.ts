/**
 * Типы данных для модулей памяти чата
 */

/**
 * Сообщение чата
 */
export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  session_id?: string;
  created_at?: string | Date;
  metadata?: Record<string, any>;
  embedding?: number[];
}

/**
 * Сессия чата
 */
export interface ChatSession {
  id: string;
  created_at?: string | Date;
  last_activity?: string | Date;
  user_id: string;
  metadata?: Record<string, any>;
}

/**
 * Саммари сессии чата
 */
export interface ChatSummary {
  session_id: string;
  summary: string;
  key_topics?: string[];
  business_info?: Record<string, any>;
}

/**
 * Релевантное сообщение из истории
 */
export interface RelevantMessage {
  id: string;
  session_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: Date;
  similarity: number;
}

/**
 * Факт о пользователе
 */
export interface UserFact {
  user_id: string;
  fact_type: string;
  fact_value: string;
  confidence: number;
  source_message_id?: string;
}
