import { chatMemory } from '../utils/memory/index.js';
import { getContext } from '../utils/memory/chatMemoryManager.js';
import { logger } from '../utils/logger.js';

/**
 * 🎯 MEMORY SERVICE
 * 
 * Handles all memory and context operations.
 * Single responsibility: User context and conversation memory.
 */
export class MemoryService {
  
  async getContextForRequest(userId: string, sessionId: string, question: string): Promise<string> {
    logger.info('Getting context for request', { userId, sessionId });
    
    try {
      return await getContext(userId, sessionId);
    } catch (error) {
      logger.error('Error getting context', { error, userId, sessionId });
      return '';
    }
  }

  async saveConversation(sessionId: string, question: string, answer: string): Promise<void> {
    logger.info('Saving conversation', { sessionId });
    
    try {
      await chatMemory.saveConversationPair(sessionId, question, answer);
    } catch (error) {
      logger.error('Error saving conversation', { error, sessionId });
    }
  }

  async getUserFacts(userId: string): Promise<unknown[]> {
    logger.info('Getting user facts', { userId });
    
    try {
      return await chatMemory.getUserFacts(userId);
    } catch (error) {
      logger.error('Error getting user facts', { error, userId });
      return [];
    }
  }

  async getSessionMessages(sessionId: string): Promise<unknown[]> {
    logger.info('Getting session messages', { sessionId });
    
    try {
      return await chatMemory.getSessionMessages(sessionId);
    } catch (error) {
      logger.error('Error getting session messages', { error, sessionId });
      return [];
    }
  }
} 