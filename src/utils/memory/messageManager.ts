import { ChatMessage, RelevantMessage } from './types.js';
import { SupabaseClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { createEmbedding } from '../../services/openaiService.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Класс для управления сообщениями чата
 */
export class MessageManager {
  constructor(
    private supabase: SupabaseClient,
    private openai: OpenAI
  ) {}
  
  /**
   * Сохраняет сообщение в истории чата
   * @param content Текст сообщения
   * @param role Роль отправителя (user/assistant)
   * @param sessionId ID сессии
   * @param metadata Метаданные сообщения
   * @param messageId Опциональный ID сообщения (если не указан, будет сгенерирован)
   * @returns ID сохраненного сообщения
   */
  async saveMessage(
    content: string,
    role: 'user' | 'assistant',
    sessionId: string,
    metadata: any = {},
    messageId?: string
  ): Promise<string> {
    try {
      // Validate required parameters
      if (!content || !role || !sessionId) {
        console.error('❌ [MESSAGES] Missing required parameters for saving message');
        throw new Error('Missing required parameters for saving message');
      }

      const id = messageId || uuidv4();
      const timestamp = new Date().toISOString();

      // Create embedding for the message content
      let embedding: number[] | null = null;
      try {
        embedding = await createEmbedding(content);
        console.log(`🧠 [MESSAGES] Created embedding for message (${embedding.length} dimensions)`);
      } catch (embeddingError) {
        console.warn('⚠️ [MESSAGES] Failed to create embedding for message:', embeddingError);
      }

      // Save message to database
      const { error } = await this.supabase
        .from('chat_messages')
        .insert({
          id,
          session_id: sessionId,
          role,
          content,
          created_at: timestamp,
          metadata: metadata || {},
          embedding
        });

      if (error) {
        console.error('❌ [MESSAGES] Error saving message:', error);
        throw new Error(`Error saving message: ${error.message}`);
      }

      console.log(`✅ [MESSAGES] Message saved successfully: ${id}`);
      return id;

    } catch (error) {
      console.error('❌ [MESSAGES] Error in saveMessage:', error);
      throw error;
    }
  }

  /**
   * Получает все сообщения сессии
   * @param sessionId ID сессии
   * @returns Массив сообщений
   */
  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      // Получаем сообщения из базы данных, сортируя их по времени создания
      const { data, error } = await this.supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(`❌ [MEMORY] Error getting session messages ${sessionId}:`, error);
        return [];
      }

      return data as ChatMessage[];
    } catch (e) {
      console.error(`❌ [MEMORY] Exception getting session messages ${sessionId}:`, e);
      return [];
    }
  }

  /**
   * Находит семантически похожие сообщения
   * @param embedding Эмбеддинг запроса
   * @param userId ID пользователя
   * @param limit Максимальное количество результатов
   * @param threshold Порог сходства (0-1)
   * @returns Массив похожих сообщений
   */
  async findSimilarMessages(
    embedding: number[],
    userId: string,
    limit: number = 5,
    threshold: number = 0.7
  ): Promise<RelevantMessage[]> {
    try {
      // Выполняем векторный поиск по сообщениям пользователя, используя match_chat_messages
      const { data, error } = await this.supabase.rpc('match_chat_messages', {
        query_embedding: embedding,
        user_id: userId,
        similarity_threshold: threshold,
        match_count: limit
      });

      if (error) {
        // Логируем специфичную ошибку PGRST202, если она возникает
        if (error.code === 'PGRST202') {
          console.error('❌ [MEMORY] PGRST202 Error: match_chat_messages function not found or invalid parameters. Check function name and definition in DB.', error);
        } else {
          console.error('❌ [MEMORY] Error in vector search for messages (match_chat_messages):', error);
        }
        return [];
      }

      // Форматируем результаты для удобства использования
      return (data || []).map((m: any) => ({
        id: m.id,
        session_id: m.session_id,
        content: m.content,
        role: m.role,
        created_at: m.created_at,
        similarity: m.similarity
      }));
    } catch (e) {
      console.error('❌ [MEMORY] Exception searching similar messages:', e);
      return [];
    }
  }

  /**
   * Сохраняет пару запрос-ответ в истории чата
   * @param sessionId ID сессии
   * @param userQuestion Вопрос пользователя
   * @param assistantResponse Ответ ассистента
   * @param metadata Дополнительные метаданные
   * @returns Массив ID сохраненных сообщений [userMessageId, assistantMessageId]
   * @throws Ошибка в случае неудачи
   */
  async saveConversationPair(
    sessionId: string,
    userQuestion: string,
    assistantResponse: string,
    metadata: Record<string, any> = {}
  ): Promise<[string, string]> {
    try {
      // Validate required parameters
      if (!sessionId) {
        throw new Error('❌ [MEMORY] Session ID not specified when saving conversation');
      }

      if (!userQuestion || !assistantResponse) {
        throw new Error('❌ [MEMORY] User question or assistant response is empty');
      }

      console.log(`💬 [MEMORY] Saving conversation pair for session: ${sessionId}`);

      // Save user message
      const userMessageId = await this.saveMessage(
        userQuestion,
        'user',
        sessionId,
        { ...metadata, type: 'user_question' }
      );

      // Save assistant message
      const assistantMessageId = await this.saveMessage(
        assistantResponse,
        'assistant',
        sessionId,
        { ...metadata, type: 'assistant_response' }
      );

      console.log(`✅ [MEMORY] Conversation pair saved successfully`);
      return [userMessageId, assistantMessageId];

    } catch (error) {
      console.error('❌ [MEMORY] Error saving conversation pair:', error);
      throw error;
    }
  }
} 