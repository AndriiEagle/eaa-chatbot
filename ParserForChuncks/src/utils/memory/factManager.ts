import { UserFact, ChatMessage } from './types.js';
import { SupabaseClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';

/**
 * Класс для управления фактами о пользователе
 */
export class FactManager {
  constructor(
    private supabase: SupabaseClient,
    private openai: OpenAI
  ) {}

  /**
   * Сохраняет факт о пользователе
   * @param userId ID пользователя
   * @param factType Тип факта
   * @param factValue Значение факта
   * @param confidence Уверенность в факте (0-1)
   * @param sourceMessageId ID сообщения-источника факта
   * @returns ID сохраненного факта
   */
  async saveUserFact(
    userId: string,
    factType: string,
    factValue: string,
    confidence: number = 1.0,
    sourceMessageId: string = ''
  ): Promise<string> {
    try {
      // Validate required parameters
      if (!userId || !factType || !factValue) {
        console.error('❌ [FACTS] Missing required parameters for saving fact');
        throw new Error('Missing required parameters for saving fact');
      }

      // Validate confidence range
      if (confidence < 0 || confidence > 1) {
        console.warn(
          `⚠️ [FACTS] Invalid confidence value: ${confidence}, using 1.0`
        );
        confidence = 1.0;
      }

      console.log(
        `💾 [FACTS] Saving fact for user ${userId}: ${factType} = ${factValue}`
      );

      const factId = uuidv4();
      const timestamp = new Date().toISOString();

      // Try to update existing fact first
      const { data: existingFact } = await this.supabase
        .from('user_facts')
        .select('id')
        .eq('user_id', userId)
        .eq('fact_type', factType)
        .single();

      if (existingFact) {
        // Update existing fact
        const { error } = await this.supabase
          .from('user_facts')
          .update({
            fact_value: factValue,
            confidence: confidence,
            source_message_id: sourceMessageId,
            updated_at: timestamp,
          })
          .eq('id', existingFact.id);

        if (error) {
          console.error('❌ [FACTS] Error updating fact:', error);
          throw new Error(`Error updating fact: ${error.message}`);
        }

        console.log(`✅ [FACTS] Fact updated successfully: ${factType}`);
        return existingFact.id;
      } else {
        // Create new fact
        const { error } = await this.supabase.from('user_facts').insert({
          id: factId,
          user_id: userId,
          fact_type: factType,
          fact_value: factValue,
          confidence: confidence,
          source_message_id: sourceMessageId,
          created_at: timestamp,
          updated_at: timestamp,
        });

        if (error) {
          console.error('❌ [FACTS] Error saving fact:', error);
          throw new Error(`Error saving fact: ${error.message}`);
        }

        console.log(`✅ [FACTS] New fact saved successfully: ${factType}`);
        return factId;
      }
    } catch (error) {
      console.error('❌ [FACTS] Error in saveUserFact:', error);
      throw error;
    }
  }

  /**
   * Получает все факты о пользователе
   * @param userId ID пользователя
   * @returns Массив фактов о пользователе
   */
  async getUserFacts(userId: string): Promise<UserFact[]> {
    try {
      // Получаем факты из базы данных
      const { data, error } = await this.supabase
        .from('user_facts')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error(
          `❌ [MEMORY] Error getting facts for user ${userId}:`,
          error
        );
        return [];
      }

      return data as UserFact[];
    } catch (e) {
      console.error(`❌ [MEMORY] Error getting facts for user ${userId}:`, e);
      return [];
    }
  }

  /**
   * Анализирует сообщение пользователя и извлекает из него факты
   * @param messageContent Текст сообщения
   * @param sessionId ID сессии
   * @param messageId ID сообщения
   */
  async extractFactsFromUserMessage(
    messageContent: string,
    sessionId: string,
    messageId: string
  ): Promise<void> {
    try {
      // Получаем ID пользователя из сессии
      const { data: sessionData, error: sessionError } = await this.supabase
        .from('chat_sessions')
        .select('user_id')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error(
          `❌ [MEMORY] Error getting user from session ${sessionId}:`,
          sessionError
        );
        return;
      }

      const userId = sessionData.user_id;

      // Проверяем, содержит ли сообщение информацию о бизнесе
      const containsBusinessInfo =
        /компан|бизнес|организац|предприяти|фирм|работа|сайт|магазин|банк|финанс|транспорт|отрасл|индустр/i.test(
          messageContent
        );

      if (!containsBusinessInfo) {
        console.log(
          `ℹ️ [MEMORY] Message does not contain business information, skipping fact extraction`
        );
        return;
      }

      // Извлекаем факты с помощью GPT-4o-mini
      console.log(`ℹ️ [MEMORY] Analyzing message for business facts...`);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Ты аналитик текста. Твоя задача - проанализировать сообщение пользователя и извлечь из него факты о бизнесе/организации пользователя. 

Извлекай следующие типы информации:
- business_type: тип бизнеса или организации
- business_location: страна, регион или город расположения бизнеса
- business_size: размер бизнеса (малый, средний, крупный, стартап и т.д.)
- business_digital_presence: какое присутствие в интернете (веб-сайт, мобильное приложение, электронный магазин и т.д.)
- business_sector: сектор экономики (B2B, B2C, государственный и т.д.)

Для каждого извлеченного факта укажи степень уверенности от 0 до 1, где:
- 0.9-1.0: факт явно и прямо упомянут
- 0.7-0.8: факт сильно подразумевается
- 0.5-0.6: факт вероятно верен, но есть неоднозначность
- < 0.5: слишком неопределенно, не включай в результат

Верни массив объектов в формате JSON:
[
  {
    "fact_type": "тип_факта",
    "fact_value": "значение",
    "confidence": число_от_0_до_1
  }
]

Если не удалось извлечь никаких фактов с уверенностью >= 0.5, верни пустой массив [].`,
          },
          {
            role: 'user',
            content: messageContent,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      let extractedFacts: Array<{
        fact_type: string;
        fact_value: string;
        confidence: number;
      }> = [];

      try {
        const content =
          completion.choices[0].message.content || '{"facts": []}';
        const response = JSON.parse(content);
        extractedFacts = response.facts || [];
      } catch (e) {
        console.error('❌ [MEMORY] Error parsing fact extraction results:', e);
        return;
      }

      // Отфильтровываем факты с низкой уверенностью
      const validFacts = extractedFacts.filter(fact => fact.confidence >= 0.5);

      if (validFacts.length === 0) {
        console.log(
          `ℹ️ [MEMORY] No facts extracted with sufficient confidence`
        );
        return;
      }

      // Сохраняем извлеченные факты
      console.log(`✅ [MEMORY] Extracted ${validFacts.length} business facts`);

      for (const fact of validFacts) {
        // Используем переданный messageId вместо генерации нового UUID
        await this.saveUserFact(
          userId,
          fact.fact_type,
          fact.fact_value,
          fact.confidence,
          messageId // Используем существующий ID сообщения
        );
      }
    } catch (e) {
      console.error('❌ [MEMORY] Error extracting facts from message:', e);
    }
  }
}
