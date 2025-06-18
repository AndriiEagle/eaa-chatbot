import { ReactNode } from 'react';

// Перечисление для типов сообщений
export enum MessageType {
  USER = 'user',
  BOT = 'bot'
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

// Тип сообщения в чате
export interface Message {
  role: 'user' | 'bot';
  content: string;
  ts: number;
  // Новые поля для расширенной информации
  sources?: Array<Source>;
  performance?: Performance;
  suggestions?: string[];
  // Для уточняющих вопросов и шаблонов
  clarificationQuestions?: string[];
  infoTemplates?: string[];
  suggestions_header?: string;
  needs_clarification?: boolean;
  // Для множественных ответов
  isMulti?: boolean;
  answers?: Array<{
    question: string;
    answer: string;
    sources?: Array<Source>;
  }>;
  // Добавлено для поддержки анализа на фронте
  preliminaryAnalysis?: PreliminaryAnalysis;
}

// Тип для источника информации
export interface Source {
  title: string;
  relevance: number;
  id?: string;
  text_preview?: string;
}

// Тип для метрик производительности
export interface Performance {
  embedding_ms: number;
  search_ms: number;
  generate_ms: number;
  total_ms: number;
}

// Тип для уведомлений
export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info' | 'warn';
  visible: boolean;
}

// Тип для пропсов компонента SourceHighlighter
export interface SourceHighlighterProps {
  children?: ReactNode;
}

// Тип для пропсов компонента SourcesList
export interface SourcesListProps {
  sources: Source[];
  containerStyles?: React.CSSProperties;
}

// Тип для пропсов компонента MessageBubble
export interface MessageBubbleProps {
  message: Message;
  onCopy: (text: string) => void;
  formatTime: (ms: number) => string;
  getRelevanceColor: (score: number) => string;
  onSelectSuggestion: (question: string) => void;
} 