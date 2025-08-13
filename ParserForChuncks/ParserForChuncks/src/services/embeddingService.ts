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

// Простая LRU с TTL
class LruCache<V> {
  private map = new Map<string, { value: V; expiresAt: number }>();
  constructor(private maxSize: number, private ttlMs: number) {}
  get(key: string): V | undefined {
    const item = this.map.get(key);
    if (!item) return undefined;
    if (Date.now() > item.expiresAt) {
      this.map.delete(key);
      return undefined;
    }
    // bump
    this.map.delete(key);
    this.map.set(key, item);
    return item.value;
  }
  set(key: string, value: V) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    if (this.map.size > this.maxSize) {
      // remove oldest
      const first = this.map.keys().next().value;
      if (first) this.map.delete(first);
    }
  }
}

const DEFAULT_TTL_MS = 3 * 60 * 1000; // 3 минуты
const embeddingCache = new LruCache<number[]>(200, DEFAULT_TTL_MS);
const searchCache = new LruCache<any>(300, DEFAULT_TTL_MS);

function stableHash(input: string | number[]): string {
  if (Array.isArray(input)) {
    // округлим до 5 знаков, чтобы хэш был стабильнее
    return input.map(n => n.toFixed(5)).join(',');
  }
  return input;
}

function trimChunksBySimilarity(chunks: any[]): any[] {
  if (!Array.isArray(chunks) || chunks.length === 0) return chunks;
  const topSim = Number(chunks[0]?.similarity ?? 0);
  const targetK = topSim > 0.9 ? 3 : 5;
  return chunks.slice(0, Math.min(targetK, chunks.length));
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
    const key = `emb:${text.length}:${text.slice(0, 64)}`;
    const cached = embeddingCache.get(key);
    if (cached) return cached;
    const emb = await createEmbedding(text);
    embeddingCache.set(key, emb);
    return emb;
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
      maxChunks,
    });

    try {
      const cacheKey = `search:${datasetId}:${similarityThreshold}:${maxChunks}:${stableHash(embedding)}`;
      const cached = searchCache.get(cacheKey);
      if (cached) {
        const trimmed = trimChunksBySimilarity(cached);
        const sources = formatSourcesMetadata(trimmed);
        return {
          chunks: trimmed,
          sources,
          performance: {
            embedding_ms: embeddingTimer.duration,
            search_ms: 0,
            generate_ms: 0,
            total_ms: embeddingTimer.duration,
          },
        };
      }

      searchTimer.reset();
      const chunks = await findRelevantChunks(
        embedding,
        datasetId,
        similarityThreshold,
        maxChunks
      );
      searchTimer.stop();

      searchCache.set(cacheKey, chunks);

      const trimmed = trimChunksBySimilarity(chunks);
      const sources = formatSourcesMetadata(trimmed);

      return {
        chunks: trimmed,
        sources,
        performance: {
          embedding_ms: embeddingTimer.duration,
          search_ms: searchTimer.duration,
          generate_ms: 0,
          total_ms: embeddingTimer.duration + searchTimer.duration,
        },
      };
    } catch (error) {
      logger.error('Error in similarity search', { error });
      throw error;
    }
  }
}
