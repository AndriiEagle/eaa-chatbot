// Тип сообщения (пользователь или система)
export enum MessageType {
  USER = 'user',
  BOT = 'bot',
}

// Источник информации
export interface Source {
  title: string;
  relevance: number;
  id?: string;
  text_preview?: string;
}

// Интерфейс для предварительного анализа
export interface PreliminaryAnalysis {
  completeness?: number;
  existingData?: string[];
  missingData?: string[];
  businessType?: string;
  businessSize?: string;
  summary?: string;
  specificQuestions?: string[];
  aiInstructions?: string;
  humanReadableMissingData?: string[];
  [key: string]: any; // Для совместимости с другими свойствами
}

// Структура сообщения
export interface Message {
  role: MessageType;
  content: string;
  ts: number;
  suggestions?: string[];
  sources?: Source[];
  performance?: {
    embedding_ms: number;
    search_ms: number;
    generate_ms: number;
    total_ms: number;
  };
  isMulti?: boolean;
  answers?: Array<{
    question: string;
    answer: string;
    sources?: Source[];
  }>;
  clarificationQuestions?: string[];
  infoTemplates?: string[];
  suggestions_header?: string;
  needs_clarification?: boolean;
  preliminaryAnalysis?: PreliminaryAnalysis;
}

// Тип уведомления
export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info' | 'warn';
  visible: boolean;
}

// Пропсы для MessageBubble
export interface MessageBubbleProps {
  message: Message;
  onCopy: (text: string) => void;
  formatTime?: (ms: number) => string;
  getRelevanceColor?: (score: number) => string;
  onSelectSuggestion: (question: string) => void;
}

// Пропсы для SourceHighlighter (если используется)
export interface SourceHighlighterProps {
  children: React.ReactNode;
}

// Пропсы для SourcesList
export interface SourcesListProps {
  sources: Source[];
  containerStyles?: React.CSSProperties;
}

// Структура сессии чата
export interface ChatSession {
  id: string;
  created_at?: string;
  last_activity?: string;
  user_id: string;
  metadata?: Record<string, any>;
  summary?: {
    summary: string;
    key_topics?: string[];
    business_info?: Record<string, any>;
  };
}

// Пропсы для SessionsList
export interface SessionsListProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onCreateNewSession: () => void;
}
