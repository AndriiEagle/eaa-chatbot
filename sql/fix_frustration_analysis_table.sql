-- 🚨 КРИТИЧНОЕ ИСПРАВЛЕНИЕ: Добавление недостающей колонки user_id
-- Выполните этот SQL в SQL Editor в Supabase НЕМЕДЛЕННО!

-- Проверяем существует ли таблица
DO $$
BEGIN
  -- Если таблица не существует, создаем её полностью
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'frustration_analysis') THEN
    
    CREATE TABLE frustration_analysis (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT,
      session_id UUID,
      message_id UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Результаты анализа (0-1 шкала)
      frustration_level REAL CHECK (frustration_level BETWEEN 0 AND 1),
      confidence_score REAL CHECK (confidence_score BETWEEN 0 AND 1),
      
      -- Детализация анализа
      detected_patterns JSONB,
      trigger_phrases TEXT[],
      context_factors JSONB,
      
      -- Рекомендации системы
      should_escalate BOOLEAN DEFAULT FALSE,
      escalation_reason TEXT,
      
      -- Метаданные
      analyzer_version TEXT DEFAULT 'v1.0',
      processing_time_ms INTEGER
    );
    
    RAISE NOTICE '✅ Таблица frustration_analysis создана';
    
  ELSE
    RAISE NOTICE '⚠️ Таблица frustration_analysis уже существует';
  END IF;
END
$$;

-- Добавляем колонку user_id если её нет
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'frustration_analysis' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE frustration_analysis ADD COLUMN user_id TEXT;
    RAISE NOTICE '✅ Колонка user_id добавлена в frustration_analysis';
  ELSE
    RAISE NOTICE '⚠️ Колонка user_id уже существует';
  END IF;
END
$$;

-- Создаем индексы если их нет
CREATE INDEX IF NOT EXISTS idx_frustration_analysis_user_id ON frustration_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_frustration_analysis_session_id ON frustration_analysis(session_id);
CREATE INDEX IF NOT EXISTS idx_frustration_analysis_frustration_level ON frustration_analysis(frustration_level DESC);
CREATE INDEX IF NOT EXISTS idx_frustration_analysis_should_escalate ON frustration_analysis(should_escalate) WHERE should_escalate = true;

-- Включаем RLS если еще не включен
ALTER TABLE frustration_analysis ENABLE ROW LEVEL SECURITY;

-- Комментарий для документации
COMMENT ON TABLE frustration_analysis IS 'Анализ уровня фрустрации пользователей через ИИ';
COMMENT ON COLUMN frustration_analysis.user_id IS 'ID пользователя для связи с анализом фрустрации';
COMMENT ON COLUMN frustration_analysis.frustration_level IS 'Уровень фрустрации от 0 (спокоен) до 1 (крайне недоволен)';
COMMENT ON COLUMN frustration_analysis.confidence_score IS 'Уверенность ИИ в своем анализе от 0 до 1';

-- Проверяем результат
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'frustration_analysis' 
ORDER BY ordinal_position;

-- Показываем статус
SELECT 'ИСПРАВЛЕНИЕ ЗАВЕРШЕНО: frustration_analysis готова к работе!' as status; 