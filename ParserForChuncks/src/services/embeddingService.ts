import { createEmbedding } from './openaiService.js';
import { findRelevantChunks } from './supabaseService.js';
import { formatSourcesMetadata } from '../utils/formatting/formatters.js';
import { createTimer } from '../utils/metrics/timers.js';
import { logger } from '../utils/logger.js';

export interface SearchResult {
  chunks: unknown[];
  sources: unknown[];
  performance: {
    embedding_ms: number;
    search_ms: number;
    generate_ms: number;
    total_ms: number;
  };
}

/**
 * 🎯 EMBEDDING SERVICE
 * 
 * Handles all embedding and similarity search operations.
 * Single responsibility: Vector operations and chunk retrieval.
 */
export class EmbeddingService {
  
  async createEmbedding(text: string): Promise<number[]> {
    logger.info('Creating embedding', { textLength: text.length });
    return await createEmbedding(text);
  }

  async searchSimilarChunks(
    embedding: number[], 
    datasetId: string, 
    similarityThreshold: number, 
    maxChunks: number
  ): Promise<SearchResult> {
    const embeddingTimer = createTimer();
    const searchTimer = createTimer();
    
    logger.info('Searching similar chunks', { 
      datasetId, 
      similarityThreshold, 
      maxChunks 
    });

    try {
      searchTimer.reset();
      const chunks = await findRelevantChunks(embedding, datasetId, similarityThreshold, maxChunks);
      searchTimer.stop();

      const sources = formatSourcesMetadata(chunks);

      return {
        chunks,
        sources,
        performance: {
          embedding_ms: embeddingTimer.duration,
          search_ms: searchTimer.duration,
          generate_ms: 0,
          total_ms: embeddingTimer.duration + searchTimer.duration
        }
      };
    } catch (error) {
      logger.error('Error in similarity search', { error });
      throw error;
    }
  }
} 