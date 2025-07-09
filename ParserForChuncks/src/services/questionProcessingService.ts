import { ProcessingResult, QuestionResult, AskRequest } from '../types/common.js';
import { logger } from '../utils/logger.js';
import { preprocessQuery } from '../utils/preprocessing/preprocessQuery.js';
import { containsBusinessInfo, processBusinessInfo } from '../utils/business/businessInfoProcessor.js';
import { handleSimpleQuery } from '../utils/preprocessing/simpleQueryHandler.js';
import { smartSplitQuestions } from '../utils/questionSplitting/splitQuestions.js';
import { openai, generateCompletion } from './openaiService.js';
import { CHAT_MODEL } from '../config/environment.js';
import { STRICT_SYSTEM_PROMPT } from '../config/prompts.js';
import { formatRAGContext } from '../utils/formatting/formatters.js';
import { createTimer } from '../utils/metrics/timers.js';

interface QuestionClassification {
  isSimple: boolean;
  isMultiple: boolean;
  containsBusinessInfo: boolean;
  questions?: string[];
}

/**
 * Professional Question Processing Service
 * Handles all question preprocessing, classification, and routing
 */
export class QuestionProcessingService {

  async preprocess(question: string): Promise<string> {
    // Return preprocessed query result directly as string
    const result = await preprocessQuery(question);
    return result.reformulatedQuery || question;
  }

  async classify(question: string): Promise<QuestionClassification> {
    // Check if question contains business info
    const businessInfo = containsBusinessInfo(question);
    
    // Check if it's multiple questions
    const splitQuestions = await smartSplitQuestions(question);
    const isMultiple = splitQuestions.length > 1;
    
    // Simple classification logic
    const isSimple = question.length < 30 && !businessInfo && !isMultiple;

    return {
      isSimple,
      isMultiple,
      containsBusinessInfo: businessInfo,
      questions: isMultiple ? splitQuestions : undefined
    };
  }

  async handleSimpleQuery(question: string, sessionId: string, queryId: string): Promise<ProcessingResult> {
    const result = await handleSimpleQuery(question);
    
    return {
      answer: result.response_text || 'Спасибо за ваше сообщение!',
      sources: [],
      performance: {
        embedding_ms: 0,
        search_ms: 0,
        generate_ms: 0,
        total_ms: 0
      },
      session_id: sessionId,
      query_id: queryId,
      suggestions: [],
      suggestions_header: 'Простой запрос обработан'
    };
  }

  async handleBusinessInfo(
    question: string, 
    userId: string, 
    sessionId: string, 
    queryId: string,
    options: { dataset_id: string; similarity_threshold: number; max_chunks: number }
  ): Promise<ProcessingResult> {
    const timer = createTimer();
    
    const result = await processBusinessInfo({
      question,
      user_id: userId,
      session_id: sessionId,
      dataset_id: options.dataset_id,
      similarity_threshold: options.similarity_threshold,
      max_chunks: options.max_chunks,
      isFirstInteraction: true,
      timerTotal: timer
    });

    return {
      answer: result.answer,
      sources: result.sources || [],
      performance: result.performance || {
        embedding_ms: 0,
        search_ms: 0,
        generate_ms: 0,
        total_ms: 0
      },
      session_id: sessionId,
      query_id: queryId,
      suggestions: result.suggestions || [],
      suggestions_header: result.suggestions_header || 'Информация о бизнесе обработана'
    };
  }

  async generateAnswer(question: string, chunks: any[], memoryContext: any): Promise<string> {
    const ragContext = formatRAGContext(chunks, question);
    
    const messages = [
      { role: 'system' as const, content: STRICT_SYSTEM_PROMPT },
      { role: 'user' as const, content: `${ragContext}\n\nQuestion: ${question}` }
    ];
    
    return await generateCompletion(messages);
  }

  async processMultipleQuestions(
    questions: string[],
    context: {
      user_id: string;
      dataset_id: string;
      similarity_threshold: number;
      max_chunks: number;
      sessionId: string;
      queryId: string;
    }
  ): Promise<ProcessingResult> {
    logger.info('Processing multiple questions', { 
      questionCount: questions.length,
      userId: context.user_id 
    });

    const results: QuestionResult[] = [];
    let totalEmbeddingTime = 0;
    let totalSearchTime = 0;
    let totalGenerateTime = 0;

    for (const question of questions) {
      const timer = createTimer();
      
      try {
        // Simplified processing for each question
        const answer = await this.generateAnswer(question, [], {});
        timer.stop();
        
        results.push({
          question,
          answer,
          sources: [],
          performance: {
            embedding_ms: 0,
            search_ms: 0,
            generate_ms: timer.duration
          }
        });
        
        totalGenerateTime += timer.duration;
      } catch (error) {
        logger.error('Error processing question', { question, error });
        results.push({
          question,
          answer: 'Извините, произошла ошибка при обработке этого вопроса.',
          sources: [],
          performance: {
            embedding_ms: 0,
            search_ms: 0,
            generate_ms: 0
          }
        });
      }
    }

    // Combine all answers
    const combinedAnswer = results.map((r, i) => 
      `**${i + 1}. ${r.question}**\n${r.answer}`
    ).join('\n\n');

    return {
      answer: combinedAnswer,
      sources: [],
      performance: {
        embedding_ms: totalEmbeddingTime,
        search_ms: totalSearchTime,
        generate_ms: totalGenerateTime,
        total_ms: totalEmbeddingTime + totalSearchTime + totalGenerateTime
      },
      session_id: context.sessionId,
      query_id: context.queryId,
      suggestions: [],
      suggestions_header: `Обработано ${questions.length} вопросов`,
      results
    };
  }
} 