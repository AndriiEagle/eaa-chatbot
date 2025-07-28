-- Оригинальная функция match_documents как было до рефакторинга
-- match_documents(match_count INT, query_embedding VECTOR(1536), similarity_threshold FLOAT)

-- РЕАЛЬНАЯ ФУНКЦИЯ КАК БЫЛО ДО РЕФАКТОРИНГА
CREATE OR REPLACE FUNCTION match_documents(
  match_count INT,
  query_embedding VECTOR(1536),
  similarity_threshold FLOAT
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  section_title TEXT,
  similarity FLOAT,
  token_count INT,
  url TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.content,
    d.section_title,
    (1 - (d.embedding <=> query_embedding)) AS similarity,
    d.token_count,
    d.url
  FROM documents d
  WHERE (1 - (d.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Обёртка для расширенной сигнатуры match_documents с параметром dataset
-- Данная обёртка принимает дополнительный параметр dataset (текст),
-- но пока просто игнорирует его и делегирует вызов базовой функции.

CREATE OR REPLACE FUNCTION match_documents(
  dataset TEXT,
  match_count INT,
  query_embedding VECTOR(1536),
  similarity_threshold FLOAT
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  section_title TEXT,
  similarity FLOAT,
  token_count INT,
  url TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Вызываем существующую версию функции без учёта dataset
  RETURN QUERY
  SELECT *
  FROM match_documents(match_count, query_embedding, similarity_threshold);
END;
$$; 