import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL or key not provided in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Поиск релевантных чанков в базе данных Supabase
 * @param embedding - векторное представление запроса
 * @returns - массив релевантных чанков
 */
export async function findRelevantChunks(embedding: number[]): Promise<any[]> {
  if (!embedding) {
    console.error('❌ [SEARCH] Vector representation was not provided');
    return [];
  }
  
  const { data: chunks, error } = await supabase.rpc('match_documents', {
    match_count: 5,
    query_embedding: embedding,
    similarity_threshold: 0.5
  });

  if (error) {
    console.error('❌ [SEARCH] Supabase error:', error);
    throw error;
  }

  return chunks || [];
} 