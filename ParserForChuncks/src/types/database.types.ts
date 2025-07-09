// 🎯 ENTERPRISE-LEVEL DATABASE TYPES
// This file contains all database-related types to eliminate 'any' usage

export interface UserFact {
  id: string;
  user_id: string;
  fact_type: 'business_type' | 'business_size' | 'customer_base' | 'physical_location' | 
            'web_presence' | 'service_types' | 'compliance_status' | 'business_location' |
            'business_digital_presence' | 'accessibility_audit_done';
  fact_value: string;
  confidence: number; // 0-1
  source_message_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    sources?: SourceMetadata[];
    performance?: PerformanceMetrics;
    suggestions?: string[];
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title?: string;
  summary?: string;
  device?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_activity: string;
}

export interface FrustrationAnalysis {
  id: string;
  user_id: string;
  session_id: string;
  frustration_level: number; // 0-1
  escalation_risk: number; // 0-1
  trigger_phrases: string[];
  confidence: number; // 0-1
  recommendation: 'gentle' | 'direct' | 'technical' | 'business_focused';
  analysis_metadata: {
    message_count: number;
    avg_response_time: number;
    repeated_questions: number;
    negative_sentiment_score: number;
  };
  created_at: string;
}

export interface SourceMetadata {
  id: string;
  text: string;
  title: string;
  relevance: number; // 0-1
  metadata: {
    path: string;
    title: string;
    date: string;
    tags: string[];
    chunk_index: number;
    total_chunks: number;
  };
}

export interface PerformanceMetrics {
  embedding_ms: number;
  search_ms: number;
  generate_ms: number;
  total_ms: number;
  tokens_used?: number;
  cost_estimate?: number;
}

// Query and analysis types
export interface QueryLog {
  id: string;
  user_id: string;
  session_id: string;
  original_question: string;
  reformulated_question?: string;
  answer: string;
  dataset_id: string;
  matched_chunk_ids: string[];
  query_id: string;
  performance_metrics: PerformanceMetrics;
  created_at: string;
}

// Email and escalation types
export interface EmailDraft {
  id: string;
  user_id: string;
  session_id: string;
  subject: string;
  body: string;
  recipient_email: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sales_potential: number; // 0-1
  urgency_level: 'normal' | 'high' | 'critical';
  status: 'draft' | 'sent' | 'failed';
  created_at: string;
  sent_at?: string;
}

// Validation helpers
export type DatabaseTableName = 
  | 'user_facts' 
  | 'chat_messages' 
  | 'chat_sessions' 
  | 'frustration_analysis' 
  | 'query_logs' 
  | 'email_drafts';

export type FactType = UserFact['fact_type'];
export type MessageRole = ChatMessage['role'];
export type FrustrationRecommendation = FrustrationAnalysis['recommendation']; 