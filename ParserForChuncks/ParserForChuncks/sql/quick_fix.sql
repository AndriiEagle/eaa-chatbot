-- 🚨 БЫСТРОЕ ИСПРАВЛЕНИЕ: Скопируйте и выполните в Supabase SQL Editor

-- Добавляем колонку user_id в таблицу frustration_analysis
ALTER TABLE frustration_analysis ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Создаем индекс для производительности
CREATE INDEX IF NOT EXISTS idx_frustration_analysis_user_id ON frustration_analysis(user_id);

-- Проверяем результат
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'frustration_analysis' 
  AND column_name = 'user_id';

-- Если результат пустой, выполните этот запрос:
-- ALTER TABLE frustration_analysis ADD COLUMN user_id TEXT; 