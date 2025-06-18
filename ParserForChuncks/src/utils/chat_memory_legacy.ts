/**
 * Обертка для обеспечения обратной совместимости со старым модулем chat_memory.ts
 * Этот файл предназначен для постепенной миграции кода с использования старого API
 * на новый, модульный API из папки memory/
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { chatMemory, ChatMessage, ChatSession, RelevantMessage, UserFact } from './memory/index.js';

// Для совместимости экспортируем старые типы
export type {
  ChatMessage,
  ChatSession,
  RelevantMessage,
  UserFact
};

/**
 * @deprecated Используйте chatMemory.initialize() из './memory/index.js'
 */
export function initChatMemoryManager(supabase: SupabaseClient, openai: OpenAI): void {
  chatMemory.initialize(supabase, openai);
}

/**
 * @deprecated Используйте chatMemory.createSession() из './memory/index.js'
 */
export async function createSession(userId: string, metadata: any = {}): Promise<string> {
  return chatMemory.createSession(userId, metadata);
}

/**
 * @deprecated Используйте chatMemory.sessionExists() из './memory/index.js'
 */
export async function sessionExists(sessionId: string): Promise<boolean> {
  return chatMemory.sessionExists(sessionId);
}

/**
 * @deprecated Используйте chatMemory.updateSessionActivity() из './memory/index.js'
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  await chatMemory.updateSessionActivity(sessionId);
}

/**
 * @deprecated Используйте chatMemory.getUserSessions() из './memory/index.js'
 */
export async function getUserSessions(userId: string): Promise<ChatSession[]> {
  return chatMemory.getUserSessions(userId);
}

/**
 * @deprecated Используйте chatMemory.deleteSession() из './memory/index.js'
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    await chatMemory.deleteSession(sessionId);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * @deprecated Используйте chatMemory.saveMessage() из './memory/index.js'
 */
export async function saveMessage(
  content: string,
  role: 'user' | 'assistant',
  sessionId: string,
  metadata: any = {}
): Promise<string> {
  return chatMemory.saveMessage(content, role, sessionId, metadata);
}

/**
 * @deprecated Используйте chatMemory.saveConversationPair() из './memory/index.js'
 */
export async function saveConversationPair(
  sessionId: string,
  userQuestion: string,
  assistantResponse: string,
  metadata: any = {}
): Promise<string[]> {
  return chatMemory.saveConversationPair(sessionId, userQuestion, assistantResponse, metadata);
}

/**
 * @deprecated Используйте chatMemory.getSessionMessages() из './memory/index.js'
 */
export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  return chatMemory.getSessionMessages(sessionId);
}

/**
 * @deprecated Используйте chatMemory.findSimilarMessages() из './memory/index.js'
 */
export async function findSimilarMessages(
  embedding: number[],
  userId: string,
  limit: number = 5
): Promise<RelevantMessage[]> {
  return chatMemory.findSimilarMessages(embedding, userId, limit);
}

/**
 * @deprecated Используйте chatMemory.saveUserFact() из './memory/index.js'
 */
export async function saveUserFact(
  userId: string,
  factType: string,
  factValue: string,
  confidence: number = 1,
  sourceMessageId: string = ''
): Promise<string> {
  return chatMemory.saveUserFact(userId, factType, factValue, confidence, sourceMessageId);
}

/**
 * @deprecated Используйте chatMemory.getUserFacts() из './memory/index.js'
 */
export async function getUserFacts(userId: string): Promise<UserFact[]> {
  return chatMemory.getUserFacts(userId);
}

/**
 * @deprecated Используйте chatMemory.updateSessionSummary() из './memory/index.js'
 */
export async function updateSessionSummary(sessionId: string): Promise<void> {
  await chatMemory.updateSessionSummary(sessionId);
}

/**
 * @deprecated Используйте chatMemory.createContextForRequest() из './memory/index.js'
 */
export async function createContextForRequest(
  userId: string, 
  sessionId: string, 
  query: string
): Promise<string> {
  return chatMemory.createContextForRequest(userId, sessionId, query);
}

// Экспортируем экземпляр singleton для обратной совместимости
export const ChatMemoryManager = chatMemory; 