-- Проверяем, нужно ли добавить колонку updated_at
ALTER TABLE IF EXISTS user_facts
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Обновляем значения в колонке
UPDATE user_facts
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Проверяем структуру таблицы
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_facts'; 