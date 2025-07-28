import { env, EMBEDDING_MODEL, CHAT_MODEL } from '../config/env';

// Mock OpenAI client for type compatibility
export const openai = {
  chat: {
    completions: {
      create: async () => ({ choices: [{ message: { content: '' } }] }),
    },
  },
  embeddings: {
    create: async () => ({ data: [{ embedding: [] }] }),
  },
};

export default openai;
