-- Система умной эскалации и анализа пользователей
-- БЕЗОПАСНАЯ СХЕМА БД для детекции фрустрации и управления письмами

-- Таблица для хранения результатов анализа фрустрации
CREATE TABLE frustration_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Результаты анализа (0-1 шкала)
  frustration_level REAL CHECK (frustration_level BETWEEN 0 AND 1),
  confidence_score REAL CHECK (confidence_score BETWEEN 0 AND 1),
  
  -- Детализация анализа
  detected_patterns JSONB, -- Найденные паттерны недовольства
  trigger_phrases TEXT[], -- Ключевые фразы-триггеры
  context_factors JSONB, -- Контекстные факторы (повторные вопросы, время сессии и т.д.)
  
  -- Рекомендации системы
  should_escalate BOOLEAN DEFAULT FALSE,
  escalation_reason TEXT,
  
  -- Метаданные
  analyzer_version TEXT DEFAULT 'v1.0',
  processing_time_ms INTEGER
);

-- Таблица для управления автогенерируемыми письмами
CREATE TABLE escalation_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  frustration_analysis_id UUID REFERENCES frustration_analysis(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Контент письма
  generated_subject TEXT NOT NULL,
  generated_body TEXT NOT NULL,
  user_context_summary TEXT, -- Краткое саммари о пользователе
  conversation_highlights TEXT, -- Ключевые моменты переписки
  
  -- Статус письма
  status TEXT CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'rejected')) DEFAULT 'draft',
  user_approved BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Получатель
  recipient_email TEXT,
  recipient_name TEXT DEFAULT 'Менеджер по продажам',
  
  -- Метаданные
  generation_model TEXT DEFAULT 'gpt-4o-mini',
  generation_prompt_version TEXT DEFAULT 'v1.0'
);

-- Таблица для отслеживания паттернов поведения пользователей
CREATE TABLE user_behavior_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Статистика поведения
  total_sessions INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  average_session_duration_minutes REAL,
  
  -- Паттерны фрустрации
  frustration_incidents INTEGER DEFAULT 0,
  escalation_triggers TEXT[], -- Типичные триггеры для этого пользователя
  common_complaints JSONB, -- Частые жалобы
  
  -- Бизнес профиль
  business_readiness_score REAL CHECK (business_readiness_score BETWEEN 0 AND 1),
  sales_potential TEXT CHECK (sales_potential IN ('low', 'medium', 'high', 'unknown')) DEFAULT 'unknown',
  
  -- Рекомендации для менеджера
  sales_notes TEXT,
  recommended_approach TEXT
);

-- Индексы для производительности
CREATE INDEX idx_frustration_analysis_session_id ON frustration_analysis(session_id);
CREATE INDEX idx_frustration_analysis_frustration_level ON frustration_analysis(frustration_level DESC);
CREATE INDEX idx_frustration_analysis_should_escalate ON frustration_analysis(should_escalate) WHERE should_escalate = true;

CREATE INDEX idx_escalation_emails_session_id ON escalation_emails(session_id);
CREATE INDEX idx_escalation_emails_status ON escalation_emails(status);
CREATE INDEX idx_escalation_emails_created_at ON escalation_emails(created_at DESC);

CREATE INDEX idx_user_behavior_patterns_user_id ON user_behavior_patterns(user_id);
CREATE INDEX idx_user_behavior_patterns_sales_potential ON user_behavior_patterns(sales_potential);
CREATE INDEX idx_user_behavior_patterns_updated_at ON user_behavior_patterns(updated_at DESC);

-- Функция для безопасного обновления статистики пользователя
CREATE OR REPLACE FUNCTION update_user_behavior_stats(
  p_user_id TEXT,
  p_session_duration_minutes REAL DEFAULT NULL,
  p_new_frustration_incident BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_behavior_patterns (user_id, total_sessions, total_messages, average_session_duration_minutes, frustration_incidents)
  VALUES (p_user_id, 1, 0, COALESCE(p_session_duration_minutes, 0), CASE WHEN p_new_frustration_incident THEN 1 else 0 END)
  ON CONFLICT (user_id) DO UPDATE SET
    total_sessions = user_behavior_patterns.total_sessions + 1,
    average_session_duration_minutes = CASE 
      WHEN p_session_duration_minutes IS NOT NULL THEN 
        (COALESCE(user_behavior_patterns.average_session_duration_minutes, 0) + p_session_duration_minutes) / 2 
      ELSE user_behavior_patterns.average_session_duration_minutes 
    END,
    frustration_incidents = CASE 
      WHEN p_new_frustration_incident THEN user_behavior_patterns.frustration_incidents + 1 
      ELSE user_behavior_patterns.frustration_incidents 
    END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS политики безопасности (Row Level Security)
ALTER TABLE frustration_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_patterns ENABLE ROW LEVEL SECURITY;

-- Комментарии для документации
COMMENT ON TABLE frustration_analysis IS 'Анализ уровня фрустрации пользователей через ИИ';
COMMENT ON TABLE escalation_emails IS 'Управление автогенерируемыми письмами для эскалации';
COMMENT ON TABLE user_behavior_patterns IS 'Долгосрочные паттерны поведения пользователей для улучшения продаж';

COMMENT ON COLUMN frustration_analysis.frustration_level IS 'Уровень фрустрации от 0 (спокоен) до 1 (крайне недоволен)';
COMMENT ON COLUMN frustration_analysis.confidence_score IS 'Уверенность ИИ в своем анализе от 0 до 1';
COMMENT ON COLUMN escalation_emails.status IS 'Статус письма: draft, pending_approval, approved, sent, rejected';
COMMENT ON COLUMN user_behavior_patterns.sales_potential IS 'Потенциал продаж: low, medium, high, unknown'; 