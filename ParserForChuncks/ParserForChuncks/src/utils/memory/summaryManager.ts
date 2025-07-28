import {
  ChatSummary,
  ChatMessage,
  RelevantMessage,
  UserFact,
} from './types.js';
import { SupabaseClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { createEmbedding } from '../../services/openaiService.js';

/**
 * Класс для управления саммари и контекстом диалогов
 */
export class SummaryManager {
  constructor(
    private supabase: SupabaseClient,
    private openai: OpenAI,
    private getSessionMessages: (sessionId: string) => Promise<ChatMessage[]>,
    private findSimilarMessages: (
      embedding: number[],
      userId: string,
      limit?: number
    ) => Promise<RelevantMessage[]>
  ) {}

  /**
   * Обновляет или создает саммари для сессии чата
   * @param sessionId ID сессии
   */
  async updateSessionSummary(sessionId: string): Promise<void> {
    try {
      // Get all session messages
      const messages = await this.getSessionMessages(sessionId);

      // If few messages, don't create summary
      if (messages.length < 4) return;

      // Get session to determine user
      const { data: sessionData, error: sessionError } = await this.supabase
        .from('chat_sessions')
        .select('user_id')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error(
          `❌ [MEMORY] Error getting session ${sessionId}:`,
          sessionError
        );
        return;
      }

      const userId = sessionData.user_id;

      // Form context from messages for GPT
      const context = messages
        .map(
          m =>
            `${m.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${m.content}`
        )
        .join('\n\n');

      // Create summary using GPT-4o-mini
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Ты аналитик диалогов. Твоя задача - проанализировать следующий диалог между пользователем и ассистентом по теме European Accessibility Act (EAA) и создать краткое резюме в 2-3 предложениях. 
            
Также извлеки:
1. Список из 3-5 ключевых тем диалога
2. Информацию о бизнесе пользователя, если она присутствует (тип бизнеса, расположение, размер, digital-присутствие)

Верни результат в следующем формате JSON:
{
  "summary": "краткое резюме диалога",
  "key_topics": ["тема 1", "тема 2", "тема 3"],
  "business_info": {
    "type": "тип бизнеса или null",
    "location": "регион или страна или null",
    "size": "размер бизнеса или null",
    "digital_presence": "описание digital-присутствия или null"
  }
}`,
          },
          {
            role: 'user',
            content: context,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      // Parse result
      let summary: any;
      try {
        summary = JSON.parse(completion.choices[0].message.content || '{}');
      } catch (e) {
        console.error('❌ [MEMORY] Error parsing summary:', e);
        summary = {
          summary: 'Не удалось создать саммари',
          key_topics: [],
          business_info: {},
        };
      }

      // Save or update summary in database
      const { error } = await this.supabase.from('chat_summaries').upsert(
        {
          session_id: sessionId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          summary: summary.summary,
          key_topics: summary.key_topics || [],
          business_info: summary.business_info || {},
        },
        { onConflict: 'session_id' }
      );

      if (error) {
        console.error(
          `❌ [MEMORY] Error updating session summary ${sessionId}:`,
          error
        );
        return;
      }

      console.log(`✅ [MEMORY] Обновлено саммари для сессии ${sessionId}`);
    } catch (e) {
      console.error(
        `❌ [MEMORY] Exception updating session summary ${sessionId}:`,
        e
      );
    }
  }

  /**
   * Создает контекст для запроса на основе истории диалога
   * @param userId ID пользователя
   * @param sessionId ID текущей сессии
   * @param query Текущий запрос пользователя
   * @returns Контекст для использования в запросе к GPT
   */
  async createContextForRequest(
    userId: string,
    sessionId: string,
    query: string,
    userFacts: UserFact[] = []
  ): Promise<string> {
    try {
      // 1. Get latest messages from current session (up to 10)
      const currentSessionMessages = await this.getSessionMessages(sessionId);
      const recentMessages = currentSessionMessages.slice(-10);

      // 2. Find semantically similar messages from history
      let similarMessages: RelevantMessage[] = [];
      try {
        const queryEmbedding = await createEmbedding(query);
        similarMessages = await this.findSimilarMessages(
          queryEmbedding,
          userId,
          5
        );
      } catch (e) {
        console.error('❌ [CONTEXT] Error searching similar messages:', e);
      }

      // 3. Build context for GPT
      let context = '';

      // 3.1 Add user profile as structured object and instructions on how to use it
      if (userFacts.length > 0) {
        const businessFacts = userFacts.filter(
          (f: UserFact) =>
            f.fact_type.startsWith('business_') && f.confidence > 0.7
        );

        if (businessFacts.length > 0) {
          context += `### ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ (ВАЖНО!):\n`;
          context += `Ты общаешься с представителем бизнеса, о котором известна следующая информация:\n`;

          // Extract most important business facts
          const businessType = businessFacts.find(
            (f: UserFact) => f.fact_type === 'business_type'
          )?.fact_value;
          const businessLocation = businessFacts.find(
            (f: UserFact) => f.fact_type === 'business_location'
          )?.fact_value;
          const businessSize = businessFacts.find(
            (f: UserFact) => f.fact_type === 'business_size'
          )?.fact_value;
          const digitalPresence = businessFacts.find(
            (f: UserFact) => f.fact_type === 'business_digital_presence'
          )?.fact_value;

          // Form structured description
          context += `- Тип бизнеса: ${businessType || 'Неизвестно'}\n`;
          if (businessLocation)
            context += `- Расположение: ${businessLocation}\n`;
          if (businessSize) context += `- Размер: ${businessSize}\n`;
          if (digitalPresence)
            context += `- Цифровое присутствие: ${digitalPresence}\n`;

          context += `\nВАЖНО: Используй эту информацию для персонализации ответа. Когда это уместно, специально адаптируй свой ответ под ${businessType}. НЕ УПОМИНАЙ ЯВНО, что у тебя есть эта информация. Просто используй её, чтобы сделать ответ максимально релевантным для этого типа бизнеса.\n\n`;

          // Add instructions on how system should use this information
          if (businessType?.toLowerCase().includes('транспорт')) {
            context += `РЕКОМЕНДАЦИИ ПО ОТВЕТАМ: Акцентируйся на требованиях EAA к транспортным сервисам, доступности билетных систем, терминалов самообслуживания и мобильных приложений.\n\n`;
          } else if (
            businessType?.toLowerCase().includes('банк') ||
            businessType?.toLowerCase().includes('финанс')
          ) {
            context += `РЕКОМЕНДАЦИИ ПО ОТВЕТАМ: Акцентируйся на требованиях EAA к финансовым сервисам, доступности электронных банковских услуг и защищенных транзакций.\n\n`;
          } else if (
            businessType?.toLowerCase().includes('магазин') ||
            businessType?.toLowerCase().includes('торгов')
          ) {
            context += `РЕКОМЕНДАЦИИ ПО ОТВЕТАМ: Акцентируйся на требованиях EAA к е-коммерции, доступности описаний товаров и процесса оформления заказа.\n\n`;
          }
        } else {
          const otherFacts = userFacts.filter(
            (f: UserFact) =>
              !f.fact_type.startsWith('business_') && f.confidence > 0.7
          );
          if (otherFacts.length > 0) {
            context += `### Другая информация о пользователе:\n`;
            otherFacts.forEach(fact => {
              context += `- ${fact.fact_type}: ${fact.fact_value}\n`;
            });
            context += '\n';
          }
        }
      }

      // 3.2 Add current session
      context += '### Текущий диалог:\n';
      context +=
        recentMessages
          .map(
            m =>
              `${m.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${m.content}`
          )
          .join('\n\n') + '\n\n';

      // 3.3 Add similar messages from history
      if (similarMessages.length > 0) {
        context += '### Релевантная информация из предыдущих диалогов:\n';
        context +=
          similarMessages
            .map(
              m =>
                `${m.role === 'user' ? 'Пользователь' : 'Ассистент'} (${new Date(m.created_at).toLocaleDateString()}): ${m.content}`
            )
            .join('\n\n') + '\n\n';
      }

      return context;
    } catch (e) {
      console.error('❌ [MEMORY] Exception creating context for request:', e);
      return '';
    }
  }
}
