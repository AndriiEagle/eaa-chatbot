export class EmbeddingService {
  static async createEmbedding(text: string) {
    return { embedding: [] };
  }

  async createEmbedding(text: string) {
    return { embedding: [] };
  }

  async searchSimilarChunks(
    embedding: any,
    datasetId: string,
    threshold: number,
    maxChunks: number
  ) {
    return {
      chunks: [],
      similarity: [],
      sources: [],
      performance: {
        embedding_ms: 100,
        search_ms: 50,
        generate_ms: 200,
        total_ms: 350,
      },
    };
  }
}

export default EmbeddingService;
