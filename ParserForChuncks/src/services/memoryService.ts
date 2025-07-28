export class MemoryService {
  static async getMemory(sessionId: string) {
    return { memory: [] };
  }

  async getContextForRequest(userId: string, sessionId: string, question: string) {
    return { context: [], history: [] };
  }

  async saveConversation(sessionId: string, question: string, answer: string) {
    return { saved: true };
  }
}

export default MemoryService; 