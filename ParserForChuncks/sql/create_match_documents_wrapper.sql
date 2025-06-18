-- Обёртка для расширенной сигнатуры match_documents с параметром dataset
-- Предполагаем, что в базе уже существует функция
-- match_documents(match_count INT, query_embedding VECTOR(1536), similarity_threshold FLOAT)
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