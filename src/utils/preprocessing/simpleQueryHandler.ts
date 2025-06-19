import { openai } from '../../services/openaiService.js';
import { SIMPLE_QUERY_SYSTEM_PROMPT } from '../../config/prompts.js';
import { CHAT_MODEL } from '../../config/environment.js';

interface SimpleQueryResult {
  is_simple_query: boolean;
  response_text: string | null;
}

/**
 * Специализированный ИИ-агент для обработки простых запросов,
 * таких как приветствия, благодарности или бессмысленный ввод.
 * @param query - Входящий запрос от пользователя.
 * @returns Объект с флагом, является ли запрос простым, и текстом ответа.
 */
export async function handleSimpleQuery(query: string): Promise<SimpleQueryResult> {
  // Запросы длиннее 50 символов вряд ли являются простыми приветствиями
  if (query.trim().length > 50) {
    return { is_simple_query: false, response_text: null };
  }

  try {
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        {
          role: 'system',
          content: SIMPLE_QUERY_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: query,
        },
      ],
      temperature: 0.5,
      max_tokens: 150,
      response_format: { type: 'json_object' },
    });

    const result = response.choices[0]?.message?.content;

    if (!result) {
      console.error('❌ [SimpleQueryAgent] Failed to get response from OpenAI.');
      return { is_simple_query: false, response_text: null };
    }

    const parsedResult: SimpleQueryResult = JSON.parse(result);
    
    // Дополнительная проверка, чтобы убедиться, что у нас есть правильный флаг и текст
    if (typeof parsedResult.is_simple_query !== 'boolean') {
      console.error('❌ [SimpleQueryAgent] OpenAI response has invalid format (is_simple_query).');
      return { is_simple_query: false, response_text: null };
    }

    return parsedResult;

  } catch (error) {
    console.error('❌ [SimpleQueryAgent] Error calling OpenAI:', error);
    // В случае ошибки считаем, что это не простой запрос, чтобы обработка продолжилась
    return { is_simple_query: false, response_text: null };
  }
} 