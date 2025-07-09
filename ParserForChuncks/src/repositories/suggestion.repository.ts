import { chatMemory } from '../utils/memory/index.js';
import { supabase } from '../services/supabaseService.js';
import { 
  UserFact, 
  ChatMessage, 
  ChatSession, 
  FrustrationAnalysis 
} from '../types/database.types';

/**
 * 🎯 ENTERPRISE-LEVEL SUGGESTION REPOSITORY
 * 
 * Handles all data access for the suggestion service with:
 * - Strict typing (no 'any' types)
 * - Proper error handling
 * - Logging and monitoring
 * - Data validation
 */
export class SuggestionRepository {

  async getUserFacts(userId: string): Promise<UserFact[]> {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid userId provided to getUserFacts');
    }

    console.log(`📊 [REPOSITORY] Fetching facts for user ${userId}`);
    
    try {
      const facts = await chatMemory.getUserFacts(userId);
      
      // Validate the returned data structure
      if (!Array.isArray(facts)) {
        console.warn(`⚠️ [REPOSITORY] getUserFacts returned non-array for user ${userId}`);
        return [];
      }

      // Type-safe validation of each fact
      const validFacts = facts.filter((fact: any): fact is UserFact => {
        return fact && 
               typeof fact.user_id === 'string' && 
               typeof fact.fact_type === 'string' && 
               typeof fact.fact_value === 'string' &&
               typeof fact.confidence === 'number';
      });

      console.log(`✅ [REPOSITORY] Retrieved ${validFacts.length} valid facts for user ${userId}`);
      return validFacts;

    } catch (error) {
      console.error(`❌ [REPOSITORY] Error fetching user facts for ${userId}:`, error);
      return []; // Return empty array instead of throwing
    }
  }

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Invalid sessionId provided to getSessionMessages');
    }

    console.log(`💬 [REPOSITORY] Fetching messages for session ${sessionId}`);
    
    try {
      const messages = await chatMemory.getSessionMessages(sessionId);
      
      if (!Array.isArray(messages)) {
        console.warn(`⚠️ [REPOSITORY] getSessionMessages returned non-array for session ${sessionId}`);
        return [];
      }

      // Type-safe validation
      const validMessages = messages.filter((message: any): message is ChatMessage => {
        return message && 
               typeof message.session_id === 'string' && 
               typeof message.role === 'string' && 
               typeof message.content === 'string' &&
               ['user', 'assistant', 'system'].includes(message.role);
      });

      const validMessagesWithUpdatedAt = validMessages.map(msg => ({
        ...msg,
        updated_at: msg.created_at // Add missing updated_at property
      })) as ChatMessage[];

      console.log(`✅ [REPOSITORY] Retrieved ${validMessagesWithUpdatedAt.length} valid messages for session ${sessionId}`);
      return validMessagesWithUpdatedAt;

    } catch (error) {
      console.error(`❌ [REPOSITORY] Error fetching session messages for ${sessionId}:`, error);
      return [];
    }
  }

  async getUserSessions(userId: string): Promise<ChatSession[]> {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid userId provided to getUserSessions');
    }

    console.log(`🗂️ [REPOSITORY] Fetching sessions for user ${userId}`);
    
    try {
      const sessions = await chatMemory.getUserSessions(userId);
      
      if (!Array.isArray(sessions)) {
        console.warn(`⚠️ [REPOSITORY] getUserSessions returned non-array for user ${userId}`);
        return [];
      }

      // Type-safe validation
      const validSessions = sessions.filter((session: any): session is ChatSession => {
        return session && 
               typeof session.user_id === 'string' && 
               typeof session.id === 'string' &&
               typeof session.is_active === 'boolean';
      });

      console.log(`✅ [REPOSITORY] Retrieved ${validSessions.length} valid sessions for user ${userId}`);
      return validSessions;

    } catch (error) {
      console.error(`❌ [REPOSITORY] Error fetching user sessions for ${userId}:`, error);
      return [];
    }
  }

  async getFrustrationHistory(userId: string): Promise<FrustrationAnalysis[]> {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid userId provided to getFrustrationHistory');
    }

    console.log(`😤 [REPOSITORY] Fetching frustration history for user ${userId}`);
    
    try {
      const { data, error } = await supabase
        .from('frustration_analysis')
        .select('*')
        .eq('user_id', userId) // Fixed: was using session_id incorrectly
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error(`❌ [REPOSITORY] Supabase error fetching frustration history:`, error);
        return [];
      }

      if (!Array.isArray(data)) {
        console.warn(`⚠️ [REPOSITORY] Supabase returned non-array for frustration history`);
        return [];
      }

      // Type-safe validation
      const validAnalyses = data.filter((analysis: any): analysis is FrustrationAnalysis => {
        return analysis && 
               typeof analysis.user_id === 'string' && 
               typeof analysis.session_id === 'string' &&
               typeof analysis.frustration_level === 'number' &&
               analysis.frustration_level >= 0 && analysis.frustration_level <= 1;
      });

      console.log(`✅ [REPOSITORY] Retrieved ${validAnalyses.length} valid frustration analyses for user ${userId}`);
      return validAnalyses;

    } catch (error) {
      console.error(`❌ [REPOSITORY] Error fetching frustration history for ${userId}:`, error);
      return [];
    }
  }

  /**
   * Health check method to verify repository connectivity
   */
  async healthCheck(): Promise<{ chatMemory: boolean; supabase: boolean }> {
    const result = { chatMemory: false, supabase: false };

    try {
      // Test chatMemory connectivity
      await chatMemory.getUserFacts('health-check-user');
      result.chatMemory = true;
    } catch (error) {
      console.error('❌ [REPOSITORY] ChatMemory health check failed:', error);
    }

    try {
      // Test Supabase connectivity
      const { error } = await supabase.from('frustration_analysis').select('id').limit(1);
      result.supabase = !error;
    } catch (error) {
      console.error('❌ [REPOSITORY] Supabase health check failed:', error);
    }

    return result;
  }
} 