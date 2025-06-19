import { Request, Response } from 'express';
import { MAX_CONTEXT_CHUNKS, MIN_SIMILARITY, CHAT_MODEL } from '../config/environment.js';

/**
 * Возвращает конфигурацию API
 */
export const configController = (req: Request, res: Response) => {
  res.status(200).json({
    version: '1.0',
    models: {
      chat: CHAT_MODEL,
      embedding: 'text-embedding-ada-002'
    },
    defaults: {
      max_chunks: MAX_CONTEXT_CHUNKS,
      similarity_threshold: MIN_SIMILARITY
    }
  });
}; 