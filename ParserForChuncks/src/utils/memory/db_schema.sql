-- Схема базы данных для системы памяти чата
-- Выполните этот SQL-скрипт в SQL-редакторе Supabase для создания или обновления таблиц

-- 1. Таблица сессий чата
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Индекс для поиска сессий по пользователю
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_activity ON chat_sessions(last_activity);

-- 2. Таблица сообщений чата
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB,
  embedding VECTOR(1536) -- Убедитесь, что у вас установлено расширение pgvector
);

-- Индексы для сообщений
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Создание векторного индекса для поиска похожих сообщений
CREATE INDEX IF NOT EXISTS idx_chat_messages_embedding ON chat_messages USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 3. Таблица фактов о пользователях
CREATE TABLE IF NOT EXISTS user_facts (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  fact_type TEXT NOT NULL,
  fact_value TEXT NOT NULL,
  confidence REAL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL
);

-- Индексы для фактов
CREATE INDEX IF NOT EXISTS idx_user_facts_user_id ON user_facts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_facts_unique ON user_facts(user_id, fact_type);

-- 4. Таблица саммари сессий
CREATE TABLE IF NOT EXISTS chat_summaries (
  session_id UUID PRIMARY KEY REFERENCES chat_sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), 
  summary TEXT,
  key_topics JSONB DEFAULT '[]'::JSONB,
  business_info JSONB DEFAULT '{}'::JSONB
);

-- 5. Функция для векторного поиска сообщений
CREATE OR REPLACE FUNCTION match_messages(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  session_ids UUID[]
)
RETURNS TABLE (
  id UUID,
  session_id UUID,
  content TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    messages.id,
    messages.session_id,
    messages.content,
    messages.role,
    messages.created_at,
    1 - (messages.embedding <=> query_embedding) AS similarity
  FROM
    chat_messages messages
  WHERE
    messages.embedding IS NOT NULL
    AND messages.session_id = ANY(session_ids)
    AND 1 - (messages.embedding <=> query_embedding) > match_threshold
  ORDER BY
    messages.embedding <=> query_embedding
  LIMIT match_count;
END;
$$; 