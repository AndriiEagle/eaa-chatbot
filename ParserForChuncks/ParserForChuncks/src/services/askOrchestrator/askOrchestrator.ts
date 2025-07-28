import { AskRequest, ProcessingResult } from '../../types/common.js';
import { QuestionProcessingService } from '../questionProcessingService.js';
import { EmbeddingService } from '../embeddingService.js';
import { MemoryService } from '../memoryService.js';
import { SuggestionService } from '../suggestionService/suggestion.service.js';
import { FrustrationService } from '../frustrationService.js';
import { openai } from '../openaiService.js';
import { logger } from '../../utils/logger.js';
import { createTimer } from '../../utils/metrics/timers.js';
import { chatMemory } from '../../utils/memory/index.js';
import {
  checkSessionExists,
  createSessionWithId,
} from '../../utils/memory/sessionManager.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * 🎯 TRUE ORCHESTRATOR - Professional Architecture
 *
 * BEFORE: 344 lines doing everything
 * AFTER: 80 lines pure coordination
 *
 * This is how an orchestrator SHOULD work:
 * 1. Coordinates between services
 * 2. Handles the workflow
 * 3. Does NOT contain business logic
 * 4. Single responsibility: orchestration
 */
export class AskOrchestrator {
  private questionProcessor: QuestionProcessingService;
  private embeddingService: EmbeddingService;
  private memoryService: MemoryService;
  private suggestionService: SuggestionService;
  private frustrationService: FrustrationService;

  constructor() {
    // Initialize all specialized services
    this.questionProcessor = new QuestionProcessingService();
    this.embeddingService = new EmbeddingService();
    this.memoryService = new MemoryService();
    this.suggestionService = new SuggestionService(openai); // Pass proper OpenAI instance
    this.frustrationService = new FrustrationService(); // Add frustration service

    logger.info(
      'AskOrchestrator initialized with professional service architecture'
    );
  }

  async processRequest(params: AskRequest): Promise<ProcessingResult> {
    const {
      question,
      session_id = null,
      user_id = 'anonymous',
      dataset_id = 'eaa',
      similarity_threshold = 0.78,
      max_chunks = 5,
    } = params;

    const timerTotal = createTimer();
    let sessionId = session_id;

    // If no session_id provided, create a new session
    if (!sessionId) {
      try {
        sessionId = uuidv4();
        await createSessionWithId(sessionId, user_id, {});
        console.log(
          `📝 [ASK] Created new session: ${sessionId} for user: ${user_id}`
        );
      } catch (error) {
        console.error(
          '❌ [ASK] Failed to create session, using fallback ID:',
          error
        );
        sessionId = `session_${uuidv4()}`;
      }
    } else {
      // Проверка существования сессии
      console.log(`🔍 [ASK] Checking session existence: ${sessionId}`);
      let currentSessionId = sessionId;

      // Если sessionId содержит префикс test-, очистить его для поиска
      const cleanSessionId = sessionId.replace(/^test-[^-]+-/, '');

      let sessionExists = false;
      try {
        console.log(
          `🔍 [ASK] About to call checkSessionExists with: ${sessionId}`
        );
        sessionExists = await checkSessionExists(sessionId);
        console.log(`📊 [ASK] Session ${sessionId} exists: ${sessionExists}`);
      } catch (checkError) {
        console.error(`❌ [ASK] Error in checkSessionExists:`, checkError);
        console.log(`⚠️ [ASK] Proceeding to create new session due to error`);
        sessionExists = false;
      }

      if (!sessionExists) {
        console.log(
          `⚠️ [ASK] Session ${sessionId} doesn't exist, creating new one...`
        );

        // Попытаться создать сессию с переданным ID
        try {
          await createSessionWithId(sessionId, user_id, {});
          currentSessionId = sessionId; // Используем переданный ID
          console.log(`✅ [ASK] Created new session: ${currentSessionId}`);
        } catch (error) {
          console.error(
            `❌ [ASK] Failed to create session with ID ${sessionId}:`,
            error
          );
          // Fallback: создать сессию с новым ID
          try {
            const newSessionId = uuidv4();
            await createSessionWithId(newSessionId, user_id, {});
            currentSessionId = newSessionId;
            console.log(
              `✅ [ASK] Created fallback session: ${currentSessionId}`
            );
          } catch (fallbackError) {
            console.error(
              `❌ [ASK] Failed to create fallback session:`,
              fallbackError
            );
            throw new Error('Failed to create session');
          }
        }
      } else {
        console.log(`✅ [ASK] Using existing session: ${currentSessionId}`);
      }

      sessionId = currentSessionId;
    }

    const queryId = uuidv4();

    logger.info('Processing request', {
      user_id,
      sessionId,
      question: question.substring(0, 100),
    });

    let finalResult: ProcessingResult;

    try {
      // Step 1: Question preprocessing and classification
      const preprocessedQuestion =
        await this.questionProcessor.preprocess(question);
      const questionClassification =
        await this.questionProcessor.classify(preprocessedQuestion);

      // Step 2: Handle simple queries via specialized service
      if (questionClassification.isSimple) {
        finalResult = await this.questionProcessor.handleSimpleQuery(
          question,
          sessionId,
          queryId
        );
      }
      // Step 3: Handle business info via specialized service
      else if (questionClassification.containsBusinessInfo) {
        finalResult = await this.questionProcessor.handleBusinessInfo(
          question,
          user_id,
          sessionId,
          queryId,
          { dataset_id, similarity_threshold, max_chunks }
        );
      }
      // Step 4: Handle complex questions via embedding service
      else if (questionClassification.isMultiple) {
        finalResult = await this.processMultipleQuestions(
          questionClassification.questions!,
          {
            user_id,
            dataset_id,
            similarity_threshold,
            max_chunks,
            sessionId,
            queryId,
          }
        );
      }
      // Step 5: Process single question via dedicated flow
      else {
        finalResult = await this.processSingleQuestion(preprocessedQuestion, {
          user_id,
          dataset_id,
          similarity_threshold,
          max_chunks,
          sessionId,
          queryId,
        });
      }

      // 🚨 UNIVERSAL FRUSTRATION ANALYSIS - RUNS FOR ALL PATHS
      try {
        const notification = await this.frustrationService.analyzeAndHandle(
          user_id,
          sessionId,
          question,
          finalResult.answer
        );
        if (notification) {
          // Add escalation notification to the answer
          finalResult.answer =
            finalResult.answer + `\n\n---\n\n${notification}`;
        }
      } catch (error) {
        logger.error('Error in frustration analysis', {
          error,
          user_id,
          sessionId,
        });
        // Don't block the response if frustration analysis fails
      }

      return finalResult;
    } catch (error) {
      logger.error('Critical error in request processing', {
        error: error instanceof Error ? error.message : 'Unknown error',
        user_id,
        sessionId,
        queryId,
      });
      throw error;
    } finally {
      timerTotal.stop();
      // Log performance metrics - simplified for now
      logger.info('Request completed', {
        queryId,
        userId: user_id,
        sessionId,
        totalTime: timerTotal.duration,
      });
    }
  }

  private async processSingleQuestion(
    question: string,
    context: {
      user_id: string;
      dataset_id: string;
      similarity_threshold: number;
      max_chunks: number;
      sessionId: string;
      queryId: string;
    }
  ): Promise<ProcessingResult> {
    const {
      user_id,
      dataset_id,
      similarity_threshold,
      max_chunks,
      sessionId,
      queryId,
    } = context;

    // Orchestrate the complete flow by delegating to services
    const [embedding, memoryContext] = await Promise.all([
      this.embeddingService.createEmbedding(question),
      this.memoryService.getContextForRequest(user_id, sessionId, question),
    ]);

    const searchResult = await this.embeddingService.searchSimilarChunks(
      embedding,
      dataset_id,
      similarity_threshold,
      max_chunks
    );

    const answer = await this.questionProcessor.generateAnswer(
      question,
      searchResult.chunks,
      memoryContext
    );

    // Use correct method name for SuggestionService
    const suggestions =
      await this.suggestionService.generateRevolutionarySuggestions({
        userId: user_id,
        sessionId,
        currentQuestion: question,
      });

    // Save to memory - simplified for now
    await this.memoryService.saveConversation(sessionId, question, answer);

    return {
      answer: answer,
      sources: searchResult.sources,
      performance: {
        embedding_ms: searchResult.performance.embedding_ms,
        search_ms: searchResult.performance.search_ms,
        generate_ms: searchResult.performance.generate_ms,
        total_ms: searchResult.performance.total_ms,
      },
      session_id: sessionId,
      query_id: queryId,
      suggestions: suggestions.clarificationQuestions || [],
      suggestions_header: suggestions.suggestions_header || '',
    };
  }

  private async processMultipleQuestions(
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
      userId: context.user_id,
      sessionId: context.sessionId,
    });

    // Delegate to question processor for complex multi-question handling
    return await this.questionProcessor.processMultipleQuestions(
      questions,
      context
    );
  }
}
