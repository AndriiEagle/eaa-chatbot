import { ChatSession } from './types.js';
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Класс для управления сессиями чата
 */
export class SessionManager {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Создает новую сессию чата
   * @param userId ID пользователя
   * @param metadata Метаданные сессии
   * @returns ID созданной сессии
   */
  async createSession(userId: string, metadata: any = {}): Promise<string> {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Missing user ID for session creation');
    }

    try {
      console.log(`📝 [SESSION] Creating new session for user: ${userId}`);
      
      const sessionId = uuidv4();
      const now = new Date().toISOString();
      
      const { data, error } = await this.supabase
        .from('chat_sessions')
        .insert({
          id: sessionId,
          user_id: userId,
          created_at: now,
          last_activity: now,
          metadata: metadata || {}
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [SESSION] Database error:', error);
        throw new Error(`Error creating session: ${error.message}`);
      }

      console.log(`✅ [SESSION] Session created successfully: ${sessionId}`);
      return sessionId;

    } catch (error) {
      console.error('❌ [SESSION] Error in createSession:', error);
      throw error;
    }
  }

  /**
   * Проверяет существование сессии
   * @param sessionId ID сессии
   * @returns true если сессия существует, иначе false
   */
  async sessionExists(sessionId: string): Promise<boolean> {
    try {
      // Проверяем существование сессии в базе данных
      const { data, error, count } = await this.supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('id', sessionId);

      if (error) {
        console.error(`❌ [MEMORY] Error checking session existence ${sessionId}:`, error);
        return false;
      }

      return count !== null && count > 0;
    } catch (e) {
      console.error(`❌ [MEMORY] Exception checking session existence ${sessionId}:`, e);
      return false;
    }
  }

  /**
   * Обновляет метку последней активности сессии
   * @param sessionId ID сессии
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      // Обновляем метку последней активности
      const { error } = await this.supabase
        .from('chat_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) {
        console.error(`❌ [MEMORY] Error updating session activity ${sessionId}:`, error);
      }
    } catch (e) {
      console.error(`❌ [MEMORY] Exception updating session activity ${sessionId}:`, e);
    }
  }

  /**
   * Получает все сессии пользователя
   * @param userId ID пользователя
   * @returns Массив сессий пользователя
   */
  async getUserSessions(userId: string): Promise<ChatSession[]> {
    try {
      // Получаем сессии из базы данных
      const { data: sessions, error: sessionsError } = await this.supabase
        .from('chat_sessions')
        .select('*, chat_summaries(*)')
        .eq('user_id', userId)
        .order('last_activity', { ascending: false });

      if (sessionsError) {
        console.error(`❌ [MEMORY] Error getting user sessions ${userId}:`, sessionsError);
        return [];
      }

      // Форматируем сессии для удобства использования
      return sessions.map(session => ({
        id: session.id,
        user_id: session.user_id,
        created_at: session.created_at,
        last_activity: session.last_activity,
        metadata: session.metadata || {},
        summary: session.chat_summaries?.[0]?.summary || null,
        key_topics: session.chat_summaries?.[0]?.key_topics || [],
        business_info: session.chat_summaries?.[0]?.business_info || {}
      }));
    } catch (e) {
      console.error(`❌ [MEMORY] Exception getting user sessions ${userId}:`, e);
      return [];
    }
  }

  /**
   * Удаляет сессию и все связанные данные
   * @param sessionId ID сессии
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      console.log(`🗑️ [SESSION] Deleting session: ${sessionId}`);

      // First delete related messages
      const { error: messagesError } = await this.supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionId);

      if (messagesError) {
        console.warn('⚠️ [SESSION] Error deleting messages:', messagesError);
      }

      // Then delete the session
      const { error: sessionError } = await this.supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (sessionError) {
        console.error('❌ [SESSION] Error deleting session:', sessionError);
        throw new Error(`Error deleting session: ${sessionError.message}`);
      }

      console.log(`✅ [SESSION] Session deleted successfully: ${sessionId}`);

    } catch (error) {
      console.error('❌ [SESSION] Error in deleteSession:', error);
      throw error;
    }
  }
} 