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
        console.warn(`⚠️ [FACTS] Invalid confidence value: ${confidence}, using 1.0`);
        confidence = 1.0;
      }

      console.log(`💾 [FACTS] Saving fact for user ${userId}: ${factType} = ${factValue}`);

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
            updated_at: timestamp
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
        const { error } = await this.supabase
          .from('user_facts')
          .insert({
            id: factId,
            user_id: userId,
            fact_type: factType,
            fact_value: factValue,
            confidence: confidence,
            source_message_id: sourceMessageId,
            created_at: timestamp,
            updated_at: timestamp
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
        console.error(`❌ [MEMORY] Error getting facts for user ${userId}:`, error);
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
        console.error(`❌ [MEMORY] Error getting user from session ${sessionId}:`, sessionError);
        return;
      }

      const userId = sessionData.user_id;

      // Проверяем, содержит ли сообщение информацию о бизнесе (English and Russian)
      const containsBusinessInfo = /компан|бизнес|организац|предприяти|фирм|работа|сайт|магазин|банк|финанс|транспорт|отрасл|индустр|company|business|organization|enterprise|firm|work|website|shop|store|bank|financ|transport|industry|startup|corporat|retail|ecommerce|e-commerce|application|app|platform|service|customer|client|market|sale|revenue|product|digital|technology|tech/i.test(messageContent);
      
      if (!containsBusinessInfo) {
        console.log(`ℹ️ [MEMORY] Message does not contain business information, skipping fact extraction`);
        return;
      }

      // Извлекаем факты с помощью GPT-4o-mini
      console.log(`ℹ️ [MEMORY] Analyzing message for business facts...`);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a text analyst. Your task is to analyze user messages and extract business/organization facts from them.

Extract the following types of information:
- business_type: type of business or organization (e.g., restaurant, bank, online store, educational institution)
- business_location: country, region, or city where the business is located
- business_size: business size (small, medium, large, startup, etc.)
- business_digital_presence: digital presence (website, mobile app, e-commerce, social media, etc.)
- business_sector: economic sector (B2B, B2C, government, nonprofit, etc.)
- customer_base: target customers (individuals, businesses, students, tourists, etc.)
- service_types: types of services or products offered
- compliance_status: any mention of accessibility compliance, standards, or regulations

For each extracted fact, specify confidence level from 0 to 1, where:
- 0.9-1.0: fact is explicitly and directly mentioned
- 0.7-0.8: fact is strongly implied
- 0.5-0.6: fact is probably correct but there's ambiguity
- < 0.5: too uncertain, don't include in results

Return JSON array of objects in this format:
{
  "facts": [
    {
      "fact_type": "fact_type",
      "fact_value": "value",
      "confidence": 0.0-1.0
    }
  ]
}

If no facts can be extracted with confidence >= 0.5, return {"facts": []}.

Analyze messages in any language (English, Russian, etc.) and extract facts accordingly.`
          },
          {
            role: 'user',
            content: messageContent
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      });

      let extractedFacts: Array<{ fact_type: string; fact_value: string; confidence: number }> = [];
      
      try {
        const content = completion.choices[0].message.content || '{"facts": []}';
        const response = JSON.parse(content);
        extractedFacts = response.facts || [];
        
        console.log(`🔍 [MEMORY] AI extracted ${extractedFacts.length} potential facts from message`);
      } catch (e) {
        console.error('❌ [MEMORY] Error parsing fact extraction results:', e);
        return;
      }

      // Отфильтровываем факты с низкой уверенностью
      const validFacts = extractedFacts.filter(fact => fact.confidence >= 0.5);
      
      if (validFacts.length === 0) {
        console.log(`ℹ️ [MEMORY] No facts extracted with sufficient confidence`);
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