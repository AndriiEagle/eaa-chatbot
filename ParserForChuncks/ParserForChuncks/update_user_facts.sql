-- Добавляем колонку updated_at в таблицу user_facts
ALTER TABLE user_facts
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Устанавливаем значение по умолчанию для существующих записей (копируем created_at)
UPDATE user_facts 
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Проверяем результат
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_facts'; 