-- Таблица для хранения сессий чата
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT NOT NULL, -- В качестве user_id можно использовать IP, fingerprint или другой идентификатор
  metadata JSONB -- Дополнительные метаданные сессии (устройство, браузер и т.д.)
);

-- Таблица для хранения сообщений чата
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB, -- Дополнительные метаданные (например, инфо о токенах, источниках)
  embedding VECTOR(1536) -- Векторное представление сообщения для семантического поиска
);

-- Таблица для хранения саммари сессий
CREATE TABLE chat_summaries (
  session_id UUID PRIMARY KEY REFERENCES chat_sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  summary TEXT NOT NULL, -- Краткое содержание всей сессии
  key_topics JSONB, -- Ключевые темы, обсуждаемые в сессии
  business_info JSONB -- Информация о бизнесе пользователя, извлеченная из диалога
);

-- Таблица для хранения фактов о пользователях
CREATE TABLE user_facts (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fact_type TEXT NOT NULL, -- Тип факта (напр., "business_type", "location", "preference")
  fact_value TEXT NOT NULL, -- Значение факта
  confidence REAL CHECK (confidence BETWEEN 0 AND 1), -- Уверенность в факте (0-1)
  source_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL -- Сообщение-источник факта
);

-- Индексы для ускорения поиска
CREATE INDEX idx_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_messages_role ON chat_messages(role);
CREATE INDEX idx_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_sessions_last_activity ON chat_sessions(last_activity);
CREATE INDEX idx_user_facts_user_id ON user_facts(user_id);

-- Функция для векторного поиска в истории сообщений
CREATE FUNCTION match_chat_messages(
  query_embedding VECTOR(1536),
  user_id TEXT,
  similarity_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
) RETURNS TABLE (
  id UUID,
  session_id UUID,
  content TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  similarity FLOAT
) LANGUAGE SQL STABLE AS $$
  SELECT 
    m.id, 
    m.session_id, 
    m.content, 
    m.role, 
    m.created_at,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM chat_messages m
  JOIN chat_sessions s ON m.session_id = s.id
  WHERE 
    s.user_id = match_chat_messages.user_id
    AND 1 - (m.embedding <=> query_embedding) > similarity_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$; 