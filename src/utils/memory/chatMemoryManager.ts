import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { createEmbedding } from '../../services/openaiService.js';
import { 
  ChatMessage, 
  ChatSession, 
  RelevantMessage, 
  UserFact 
} from './types.js';
import { SessionManager } from './sessionManager.js';
import { MessageManager } from './messageManager.js';
import { FactManager } from './factManager.js';
import { SummaryManager } from './summaryManager.js';
import { v4 as uuidv4 } from 'uuid';
import { sendEscalationEmail } from '../../services/emailService.js';
import { openai } from '../../services/openaiService.js';

/**
 * Основной класс для управления памятью и контекстом чата
 * Предоставляет единый интерфейс для работы со всеми компонентами системы памяти
 */
export class ChatMemoryManager {
  private sessionManager!: SessionManager;
  private messageManager!: MessageManager;
  private factManager!: FactManager;
  private summaryManager!: SummaryManager;
  private initialized: boolean = false;

  constructor(
    private supabase: SupabaseClient | null = null,
    private openai: OpenAI | null = null
  ) {
    // Объект будет инициализирован позже через метод initialize()
  }

  /**
   * Инициализирует менеджер памяти чата
   * @param supabase Клиент Supabase
   * @param openai Клиент OpenAI
   */
  initialize(supabase: SupabaseClient, openai: OpenAI): void {
    if (this.initialized) {
      console.warn('⚠️ [MEMORY] ChatMemoryManager already initialized');
      return;
    }

    this.supabase = supabase;
    this.openai = openai;

    // Создаем менеджеры
    this.sessionManager = new SessionManager(this.supabase);
    this.messageManager = new MessageManager(this.supabase, this.openai);
    this.factManager = new FactManager(this.supabase, this.openai);

    // Создаем SummaryManager и передаем ему callback-функции
    this.summaryManager = new SummaryManager(
      this.supabase,
      this.openai,
      (sessionId: string) => this.getSessionMessages(sessionId),
      (embedding: number[], userId: string, limit?: number) => this.findSimilarMessages(embedding, userId, limit)
    );

    this.initialized = true;
    console.log('✅ [MEMORY] ChatMemoryManager successfully initialized');
  }

  /**
   * Проверяет, инициализирован ли менеджер
   * @throws Error если менеджер не инициализирован
   */
  private checkInitialized(): void {
    if (!this.initialized || !this.supabase || !this.openai) {
      const error = new Error('ChatMemoryManager not initialized. Please call initialize() first');
      console.error('❌ [MEMORY] ' + error.message);
      throw error;
    }
  }

  // === СЕССИИ ===

  /**
   * Создает новую сессию чата
   * @param userId ID пользователя
   * @param metadata Метаданные сессии
   * @returns ID созданной сессии
   */
  async createSession(userId: string, metadata: any = {}): Promise<string> {
    this.checkInitialized();
    return this.sessionManager.createSession(userId, metadata);
  }

  /**
   * Проверяет существование сессии
   * @param sessionId ID сессии
   * @returns true если сессия существует, иначе false
   */
  async sessionExists(sessionId: string): Promise<boolean> {
    this.checkInitialized();
    return this.sessionManager.sessionExists(sessionId);
  }

  /**
   * Обновляет метку последней активности сессии
   * @param sessionId ID сессии
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    this.checkInitialized();
    await this.sessionManager.updateSessionActivity(sessionId);
  }

  /**
   * Получает все сессии пользователя
   * @param userId ID пользователя
   * @returns Массив сессий пользователя с саммари
   */
  async getUserSessions(userId: string): Promise<ChatSession[]> {
    this.checkInitialized();
    return this.sessionManager.getUserSessions(userId);
  }

  /**
   * Удаляет сессию и все связанные данные
   * @param sessionId ID сессии
   */
  async deleteSession(sessionId: string): Promise<void> {
    this.checkInitialized();
    await this.sessionManager.deleteSession(sessionId);
  }

  // === СООБЩЕНИЯ ===

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
    this.checkInitialized();
    return this.messageManager.saveMessage(content, role, sessionId, metadata, messageId);
  }

  /**
   * Сохраняет пару сообщений "вопрос пользователя - ответ ассистента" в истории
   * @param sessionId ID сессии
   * @param userQuestion Вопрос пользователя
   * @param assistantResponse Ответ ассистента
   * @param metadata Метаданные ответа ассистента
   * @returns Массив из двух ID: [userMessageId, assistantMessageId]
   */
  async saveConversationPair(
    sessionId: string,
    userQuestion: string,
    assistantResponse: string,
    metadata: any = {}
  ): Promise<string[]> {
    this.checkInitialized();

    // 1. Сохраняем сообщения и получаем их ID
    const [userMessageId, assistantMessageId] = await this.messageManager.saveConversationPair(
      sessionId,
      userQuestion,
      assistantResponse,
      metadata
    );

    // 2. Выполняем логику эскалации в блоке try...catch, чтобы не прерывать основной поток
    try {
      const { data, error } = await this.supabase!.rpc('increment_session_message_count', {
        p_session_id: sessionId
      });

      if (error) {
        throw new Error(`RPC error: ${error.message}`);
      }
      
      const escalationResult = data && data[0];

      if (escalationResult?.should_escalate) {
        console.log(`[ChatMemoryManager] 🔥 Сессия ${sessionId} эскалирована! Количество сообщений: ${escalationResult.current_message_count}`);
        
        // 3. Отправляем email-уведомление, не блокируя ответ
        sendEscalationEmail({
          sessionId: sessionId,
          messageCount: escalationResult.current_message_count,
          escalationTime: new Date().toUTCString()
        }).catch(err => {
            console.error(`[ChatMemoryManager] Error sending escalation email:`, err)
        });
      }

    } catch (e) {
      console.error(`[ChatMemoryManager] Error in escalation logic for session ${sessionId}:`, e);
    }
    
    // 4. Возвращаем ID сохраненных сообщений
    return [userMessageId, assistantMessageId];
  }

  /**
   * Получает все сообщения сессии
   * @param sessionId ID сессии
   * @returns Массив сообщений
   */
  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    this.checkInitialized();
    return this.messageManager.getSessionMessages(sessionId);
  }
  
  /**
   * Находит семантически похожие сообщения
   * @param embedding Эмбеддинг запроса
   * @param userId ID пользователя
   * @param limit Максимальное количество результатов
   * @returns Массив похожих сообщений
   */
  async findSimilarMessages(
    embedding: number[],
    userId: string,
    limit: number = 5
  ): Promise<RelevantMessage[]> {
    this.checkInitialized();
    return this.messageManager.findSimilarMessages(embedding, userId, limit);
  }

  // === ФАКТЫ О ПОЛЬЗОВАТЕЛЕ ===

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
    confidence: number = 1,
    sourceMessageId: string = ''
  ): Promise<string> {
    this.checkInitialized();
    return this.factManager.saveUserFact(userId, factType, factValue, confidence, sourceMessageId);
  }

  /**
   * Получает все факты о пользователе
   * @param userId ID пользователя
   * @returns Массив фактов о пользователе
   */
  async getUserFacts(userId: string): Promise<UserFact[]> {
    this.checkInitialized();
    return this.factManager.getUserFacts(userId);
  }

  // === КОНТЕКСТ И САММАРИ ===

  /**
   * Обновляет или создает саммари сессии
   * @param sessionId ID сессии
   */
  async updateSessionSummary(sessionId: string): Promise<void> {
    this.checkInitialized();
    await this.summaryManager.updateSessionSummary(sessionId);
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
    query: string
  ): Promise<string> {
    try {
      console.log(`🧠 [MEMORY] Creating context for user ${userId}, session ${sessionId}`);
      
      // Get user facts
      const userFacts = await this.factManager.getUserFacts(userId);
      
      // Get recent messages from current session
      const recentMessages = await this.messageManager.getSessionMessages(sessionId);
      
      // Create query embedding for similarity search
      let queryEmbedding: number[] | null = null;
      try {
        queryEmbedding = await createEmbedding(query);
      } catch (embeddingError) {
        console.warn('⚠️ [MEMORY] Failed to create query embedding:', embeddingError);
      }
      
      // Find similar messages from other sessions
      let similarMessages: RelevantMessage[] = [];
      if (queryEmbedding) {
        similarMessages = await this.messageManager.findSimilarMessages(
          queryEmbedding, 
          userId, 
          3 // Limit to 3 most similar messages
        );
      }
      
      // Build context string
      let context = `User Context for ${userId}:\n\n`;
      
      // Add user facts
      if (userFacts.length > 0) {
        context += `Known Facts:\n`;
        userFacts.forEach(fact => {
          context += `- ${fact.fact_type}: ${fact.fact_value} (confidence: ${fact.confidence})\n`;
        });
        context += '\n';
      }
      
      // Add recent conversation
      if (recentMessages.length > 0) {
        context += `Recent Conversation:\n`;
        recentMessages.slice(-5).forEach(msg => {
          context += `${msg.role}: ${msg.content}\n`;
        });
        context += '\n';
      }
      
      // Add similar past conversations
      if (similarMessages.length > 0) {
        context += `Similar Past Conversations:\n`;
        similarMessages.forEach(msg => {
          context += `${msg.role}: ${msg.content} (similarity: ${msg.similarity.toFixed(2)})\n`;
        });
      }
      
      console.log(`✅ [MEMORY] Context created (${context.length} characters)`);
      return context;
      
    } catch (error) {
      console.error('❌ [MEMORY] Error creating context:', error);
      return '';
    }
  }

  private async callSupabaseRPC(functionName: string, params: any): Promise<any> {
    try {
      const { data, error } = await this.supabase!.rpc(functionName, params);
      
      if (error) {
        throw new Error(`RPC error: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error(`❌ [MEMORY] Error calling RPC ${functionName}:`, error);
      throw error;
    }
  }
}

// Экземпляр-синглтон для использования во всем приложении
export const chatMemory = new ChatMemoryManager(); 