/**
 * Индексный файл для экспорта всех модулей памяти чата
 */

// Mock memory functions since original files were removed
export const checkSessionExists = async (sessionId: string, userId?: string, options?: any) => true;
export const createSessionWithId = async (sessionId: string, userId?: string, metadata?: any) => ({ id: sessionId });

export const chatMemory = {
  getHistory: async (sessionId: string) => [],
  addMessage: async (sessionId: string, message: any) => true,
  clearHistory: async (sessionId: string) => true
}; 