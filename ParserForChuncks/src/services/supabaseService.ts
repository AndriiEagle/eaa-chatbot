import { createClient } from '@supabase/supabase-js';
import { env } from '../config/environment.js';

// Создаем клиент Supabase
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  db: { schema: 'public' },
});

/**
 * Поиск релевантных чанков в базе данных
 * @param queryEmbedding - Векторное представление запроса
 * @param datasetId - ID датасета
 * @param similarityThreshold - Порог сходства
 * @param matchCount - Максимальное количество результатов
 * @returns Массив релевантных чанков
 */
export async function findRelevantChunks(
  queryEmbedding: number[],
  datasetId: string,
  similarityThreshold: number, 
  matchCount: number
) {
  const { data: chunks, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    similarity_threshold: similarityThreshold,
    match_count: matchCount,
  });

  if (error) {
    console.error('❌ [SEARCH] Ошибка Supabase:', error);
    throw error;
  }

  return chunks || [];
}

/**
 * Логирование запроса в базу данных
 * @param question - Исходный вопрос пользователя
 * @param translatedQuestion - Переведенный вопрос (если был перевод)
 * @param answer - Ответ системы
 * @param datasetId - ID датасета
 * @param matchedChunkIds - ID найденных чанков
 */
export async function logQuery(
  question: string,
  translatedQuestion: string | null,
  answer: string,
  datasetId: string,
  matchedChunkIds: string[],
  id: string
) {
  try {
    await supabase.from('query_logs').insert({
      id,
      question,
      translated_question: translatedQuestion,
      language: 'en',
      answer,
      dataset_id: datasetId,
      matched_chunk_ids: matchedChunkIds,
    });
    console.log('✅ [LOGGING] Запрос успешно залогирован в query_logs');
  } catch (error) {
    console.error('❌ [LOGGING] Ошибка при логировании запроса:', error);
  }
} 