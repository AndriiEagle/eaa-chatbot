// Интерфейс для измерения времени
export interface TimerMeasure {
  start: number;
  end?: number;
  duration?: number;
}

// Интерфейс для ответа с дополнительной информацией
export interface EnhancedResponse {
  answer: string;
  sources?: Array<{ title: string; relevance: number }>;
  no_results?: boolean;
  performance?: {
    embedding_ms: number;
    search_ms: number;
    generate_ms: number;
    total_ms: number;
  };
  suggestions?: string[];
  needs_clarification?: boolean;
  suggestions_header?: string;
  clarificationQuestions?: string[];
  infoTemplates?: string[];
}

/**
 * Результат обработки запроса через оркестратор
 */
export interface ProcessingResult {
  answer: string;
  sources: unknown[];
  performance: {
    embedding_ms: number;
    search_ms: number;
    generate_ms: number;
    total_ms: number;
  };
  session_id: string;
  query_id: string;
  suggestions: string[];
  suggestions_header: string;
  clarificationQuestions?: string[];
  infoTemplates?: string[];
  results?: QuestionResult[];
}

/**
 * Результат обработки отдельного вопроса
 */
export interface QuestionResult {
  question: string;
  answer: string;
  sources: unknown[];
  performance: {
    embedding_ms: number;
    search_ms: number;
    generate_ms?: number;
  };
}

/**
 * Результат предварительной обработки запроса
 */
export interface PreprocessResult {
  isRelevant: boolean;
  explanation?: string;
  reformulatedQuery?: string;
  needsClarification: boolean;
  suggestedClarification?: string;
  suggestions: string[];
  existingDataSummary?: string;
  hasSufficientData?: boolean;
  requiredData?: string[];
  splitQuestions: string[];  // Список вопросов после разбиения сложного запроса
}

/**
 * Информация о пользователе, извлеченная из сообщений
 */
export interface UserFact {
  type: string;    // Тип факта (business_type, business_size, и т.д.)
  value: string;   // Значение факта
  confidence: number; // Уровень уверенности в факте (0-1)
  source?: string; // Источник факта (сообщение пользователя)
  timestamp?: number; // Временная метка, когда факт был извлечен
}

/**
 * Результат анализа данных о пользователе
 */
export interface UserDataAnalysisResult {
  completeness: number;          // Процент полноты данных от 0 до 1
  existingData: string[];        // Имеющиеся типы данных
  missingData: string[];         // Отсутствующие типы данных
  businessType?: string;         // Тип бизнеса
  businessSize?: string;         // Размер бизнеса
  summary?: string;              // Краткая сводка данных в текстовом формате
  specificQuestions?: string[];  // Специфические вопросы для уточнения
  aiInstructions?: string;       // Инструкции для ИИ по дальнейшему сбору информации
  humanReadableMissingData?: string[]; // Отсутствующие данные в человекочитаемом формате
}

// Формат запроса к API
export interface AskRequest {
  question: string;
  dataset_id: string;
  similarity_threshold?: number;
  max_chunks?: number;
  user_id?: string;
  session_id?: string;
} 