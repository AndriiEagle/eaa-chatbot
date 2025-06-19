ALTER TABLE chat_sessions
ADD COLUMN IF NOT EXISTS message_count INT NOT NULL DEFAULT 0;

ALTER TABLE chat_sessions
ADD COLUMN IF NOT EXISTS escalated BOOLEAN NOT NULL DEFAULT FALSE;

-- Функция для атомарного инкремента счетчика сообщений и проверки на эскалацию
CREATE OR REPLACE FUNCTION increment_session_message_count(p_session_id UUID, p_increment INT DEFAULT 2)
RETURNS TABLE (
  should_escalate BOOLEAN,
  current_message_count INT
) AS $$
DECLARE
  v_new_count INT;
  v_is_escalated BOOLEAN;
  v_escalation_threshold INT := 10; -- Порог для эскалации
BEGIN
  -- Обновляем счетчик и получаем новые значения
  UPDATE chat_sessions
  SET message_count = message_count + p_increment
  WHERE id = p_session_id
  RETURNING message_count, escalated INTO v_new_count, v_is_escalated;

  -- Проверяем, нужно ли эскалировать
  IF v_new_count >= v_escalation_threshold AND v_is_escalated = FALSE THEN
    -- Устанавливаем флаг эскалации
    UPDATE chat_sessions
    SET escalated = TRUE
    WHERE id = p_session_id;

    RETURN QUERY SELECT TRUE, v_new_count;
  ELSE
    RETURN QUERY SELECT FALSE, v_new_count;
  END IF;
END;
$$ LANGUAGE plpgsql; 