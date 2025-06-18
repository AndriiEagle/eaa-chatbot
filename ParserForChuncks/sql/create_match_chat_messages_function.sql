CREATE OR REPLACE FUNCTION match_chat_messages(
  query_embedding VECTOR(1536),
  user_id TEXT,
  similarity_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  session_id UUID,
  content TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE sql
STABLE
AS $$
SELECT
  m.id,
  m.session_id,
  m.content,
  m.role,
  m.created_at,
  1 - (m.embedding <=> query_embedding) AS similarity
FROM chat_messages m
JOIN chat_sessions s ON s.id = m.session_id
WHERE s.user_id = match_chat_messages.user_id
  AND m.embedding IS NOT NULL
  AND (1 - (m.embedding <=> query_embedding)) > similarity_threshold
ORDER BY m.embedding <=> query_embedding
LIMIT match_count;
$$; 