import { OpenAI } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { env, EMBEDDING_MODEL, CHAT_MODEL } from '../config/environment.js';

// Создаем клиент OpenAI
export const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

// === КЭШ ЭМБЕДДИНГОВ (in-memory) ===
const embeddingCache = new Map<string, number[]>();

export function clearEmbeddingCache() {
  embeddingCache.clear();
}

/**
 * Создает векторное представление (embedding) для текста
 * @param text - Текст для эмбеддинга
 * @returns Массив чисел, представляющий эмбеддинг
 * @throws Ошибка при пустом тексте или проблемах с API
 */
export async function createEmbedding(text: string): Promise<number[]> {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('❌ [EMBEDDING] Text for embedding creation must be a non-empty string');
  }

  const cacheKey = text.trim();
  
  // Check cache first
  if (embeddingCache.has(cacheKey)) {
    console.log('🎯 [EMBEDDING] Cache hit');
    return embeddingCache.get(cacheKey)!;
  }

  try {
    console.log(`🔄 [EMBEDDING] Creating embedding for text (${text.length} chars)...`);
    
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.trim(),
    });

    const embedding = response.data[0]?.embedding;
    
    if (!embedding || embedding.length === 0) {
      throw new Error('❌ [EMBEDDING] API returned empty embedding');
    }

    // Cache the result
    embeddingCache.set(cacheKey, embedding);
    
    console.log(`✅ [EMBEDDING] Created embedding with ${embedding.length} dimensions`);
    return embedding;
    
  } catch (error) {
    console.error('❌ [EMBEDDING] Error creating embedding:', error);
    throw error;
  }
}

/**
 * Генерирует ответ на основе контекста и вопроса пользователя
 * @param messages - Массив сообщений для передачи в API
 * @param temperature - Температура (randomness) генерации, по умолчанию 0
 * @returns Сгенерированный текст ответа
 * @throws Ошибка при пустом массиве сообщений или проблемах с API
 */
export async function generateCompletion(
  messages: ChatCompletionMessageParam[],
  temperature: number = 0
): Promise<string> {
  if (!messages || messages.length === 0) {
    throw new Error('❌ [GENERATE] Message array must not be empty');
  }

  try {
    console.log(`🤖 [GENERATE] Generating completion with ${messages.length} messages...`);
    
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages,
      temperature,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      console.warn('⚠️ [GENERATE] Empty response from OpenAI');
      return '';
    }

    console.log(`✅ [GENERATE] Generated completion (${content.length} chars)`);
    return content;
    
  } catch (error) {
    console.error('❌ [GENERATE] Error generating completion:', error);
    throw error;
  }
}

/**
 * Создает стримингово-потоковый ответ
 * @param messages - Массив сообщений для передачи в API
 * @param temperature - Температура генерации, по умолчанию 0
 * @returns Стрим для потоковой передачи ответа
 * @throws Ошибка при пустом массиве сообщений или проблемах с API
 */
export async function generateStreamingCompletion(
  messages: ChatCompletionMessageParam[],
  temperature: number = 0
) {
  if (!messages || messages.length === 0) {
    throw new Error('❌ [STREAM] Message array must not be empty');
  }

  try {
    console.log(`🌊 [STREAM] Starting streaming completion with ${messages.length} messages...`);
    
    const stream = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages,
      temperature,
      max_tokens: 2000,
      stream: true,
    });

    console.log('✅ [STREAM] Streaming started successfully');
    return stream;
    
  } catch (error) {
    console.error('❌ [STREAM] Error starting streaming completion:', error);
    throw error;
  }
} 