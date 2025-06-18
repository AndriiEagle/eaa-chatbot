import { Request, Response } from 'express';
import { createTimer, createPerformanceMetrics, PerformanceMetrics } from '../utils/metrics/timers.js';
import { formatRAGContext, formatSourcesMetadata, formatJsonObjects } from '../utils/formatting/formatters.js';
import { chatMemory } from '../utils/memory/index.js';
import { preprocessQuery } from '../utils/preprocessing/preprocessQuery.js';
import { smartSplitQuestions } from '../utils/questionSplitting/splitQuestions.js';
import { containsBusinessInfo, processBusinessInfo } from '../utils/business/businessInfoProcessor.js';
import { generatePersonalizedSuggestions, generatePersonalizedSuggestionsSync } from '../utils/suggestions/suggestionGenerator.js';
import { createEmbedding, generateCompletion, generateStreamingCompletion } from '../services/openaiService.js';
import { findRelevantChunks, logQuery } from '../services/supabaseService.js';
import { openai } from '../services/openaiService.js';
import { AskRequest, EnhancedResponse, UserDataAnalysisResult } from '../types/common.js';
import { MAX_CONTEXT_CHUNKS, CHAT_MODEL } from '../config/environment.js';
import { STRICT_SYSTEM_PROMPT, CONCISE_SYSTEM_PROMPT } from '../config/prompts.js';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { v4 as uuidv4 } from 'uuid';
import { UserFact } from '../utils/memory/types.js';
import { analyzeUserData, formatMissingDataTypes } from '../utils/userDataAnalysis.js';
import { UserFact as CommonUserFact } from '../types/common';
import { handleSimpleQuery } from '../utils/preprocessing/simpleQueryHandler.js';
// 🤖 IMPORTS OF NEW AI AGENTS
import { FrustrationDetectionAgent } from '../services/frustrationDetectionAgent.js';
import { EmailComposerAgent } from '../services/emailComposerAgent.js';

// Get timer prototype and add elapsed method
const timerPrototype = Object.getPrototypeOf(createTimer());
Object.defineProperty(timerPrototype, 'elapsed', {
  get: function() {
    return this.duration || 0;
  }
});

// 🤖 INITIALIZATION OF AI AGENTS
const frustrationAgent = new FrustrationDetectionAgent({
  minimumFrustrationLevel: 0.75, // Conservative threshold
  minimumConfidence: 0.85,       // High confidence
  minimumTriggers: 2             // Minimum 2 triggers
});

const emailComposer = new EmailComposerAgent();

// Types and interfaces 
interface QuestionResult {
  question: string;
  answer: string;
  sources: any[]; // Use any[] for compatibility with various source formats
  performance: {
    embedding_ms: number;
    search_ms: number;
    generate_ms?: number;
  };
}

interface MultipleQuestionsResponse {
  results: QuestionResult[];
  performance: PerformanceMetrics;
  clarificationQuestions: string[];
  infoTemplates: string[];
  suggestions_header: string;
}

interface SourceMetadata {
  id?: string;
  text?: string;
  title?: string;
  relevance?: number;
  metadata?: {
    path?: string;
    title?: string;
    date?: string;
    tags?: string[];
    [key: string]: any;
  };
}

// Расширение интерфейса ChatMemoryManager для поддержки множественных вопросов
interface ChatMemoryManager {
  saveConversationPair: (
    sessionId: string, 
    userMessage: string, 
    assistantMessage: string,
    metadata?: Record<string, any>
  ) => Promise<void>;
  createContextForRequest?: (
    userId: string,
    sessionId: string,
    question: string
  ) => Promise<string | null>;
}

// Вспомогательная функция для параллельной обработки запроса
async function processQuestion(
  question: string, 
  dataset_id: string, 
  similarity_threshold: number, 
  max_chunks: number
): Promise<{
  embedding: any;
  chunks: any[];
  embeddingTime: number;
  searchTime: number;
}> {
  const embeddingTimer = createTimer();
  const searchTimer = createTimer();

  // Создаем эмбеддинг для запроса
  embeddingTimer.reset();
  const embedding = await createEmbedding(question);
  embeddingTimer.stop();

  // Ищем релевантные чанки
  searchTimer.reset();
  const chunks = await findRelevantChunks(embedding, dataset_id, similarity_threshold, max_chunks);
  searchTimer.stop();

  return {
    embedding,
    chunks,
    embeddingTime: embeddingTimer.duration,
    searchTime: searchTimer.duration
  };
}

// Конвертируем тип UserFact из модуля памяти в тип UserFact из common
function convertUserFacts(facts: UserFact[]): CommonUserFact[] {
  return facts.map(fact => ({
    type: fact.fact_type,
    value: fact.fact_value,
    confidence: fact.confidence,
    source: fact.source_message_id
  } as CommonUserFact));
}

/**
 * Основной контроллер для обработки запросов /ask
 * Обрабатывает все этапы: препроцессинг, разбивку, векторный поиск и генерацию ответа
 */
export const askController = async (req: Request, res: Response): Promise<void> => {
  // Создаем общий таймер для всего запроса
  const timerTotal = createTimer();
  
  // ---- Глобальные переменные для режима уточнения ----
  let clarifyMode = false;
  let clarifyQuestionsArr: string[] = [];
  let clarifyTemplatesArr: string[] = [];
  let clarifyHeader = '';
  let preliminaryAnalysisData: any = undefined;
  // ---- конец вставки ----
  
  console.log('\n===========================================================');
  console.log('📝 [ASK] Получен новый запрос:');
  
  // Проверка метода запроса и типа контента
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed. Use POST instead.' });
    return;
  }

  // Получаем параметры запроса
  const {
    question,
    session_id = null,
    user_id = 'anonymous',
    dataset_id = 'eaa',
    similarity_threshold = 0.78,
    max_chunks = MAX_CONTEXT_CHUNKS || 5,
    stream = false
  } = req.body as AskRequest & { stream?: boolean };

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    res.status(400).json({ error: 'Question is required and must be a non-empty string.' });
    return;
  }

  console.log(`👤 User ID: ${user_id} | 💬 Session ID: ${session_id || 'new'}`);
  console.log(`❓ Question: ${question}`);
  
  try {
    // Этап 0: Обработка простых запросов (приветствия, бессмыслица)
    const simpleQueryResult = await handleSimpleQuery(question);
    if (simpleQueryResult.is_simple_query && simpleQueryResult.response_text) {
      console.log('✅ [SimpleQueryAgent] Распознан простой запрос. Отправка остроумного ответа.');
      
      // Устанавливаем заголовки для потока
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const writeEvent = (event: string, data: object) => {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };
      
      // Отправляем ответ как событие
      writeEvent('message', { chunk: simpleQueryResult.response_text, type: 'content' });
      writeEvent('end', { message: 'Stream ended' });
      res.end();
      
      console.log('ℹ️ [MEMORY] Простые диалоги не сохраняются в историю.');
      return;
    }
    console.log('🧐 [SimpleQueryAgent] Запрос не является простым, продолжаю стандартную обработку.');

    // Проверяем, существует ли сессия, или создаем новую
    let actualSessionId: string;
    
    try {
      if (session_id) {
        // Если ID сессии предоставлен, проверяем его существование
        const sessionExists = await chatMemory.sessionExists(session_id);
        
        if (sessionExists) {
          // Если сессия существует, используем её
          console.log(`✅ [SESSION] Сессия ${session_id} существует`);
          actualSessionId = session_id;
        } else {
          // Если сессии с таким ID не существует, создаем новую, но используем предоставленный ID
          console.log(`🆕 [SESSION] Сессия ${session_id} не найдена, создаем новую с этим ID`);
          actualSessionId = await chatMemory.createSession(user_id, { 
            id: session_id, // Явно передаем ID для создания сессии с тем же ID
            device: req.headers['user-agent'] 
          });
          console.log(`✅ [SESSION] Создана новая сессия с ID: ${actualSessionId}`);
        }
      } else {
        // Если ID сессии не предоставлен, создаем новую сессию
        console.log(`🆕 [SESSION] Сессия не указана, создаем новую`);
        actualSessionId = await chatMemory.createSession(user_id, { 
          device: req.headers['user-agent'] 
        });
        console.log(`✅ [SESSION] Создана новая сессия с ID: ${actualSessionId}`);
      }
    } catch (sessionError) {
      console.error('❌ [SESSION] Ошибка при работе с сессией:', sessionError);
      // Создаем временный ID сессии, чтобы продолжить выполнение, но логируем ошибку
      actualSessionId = 'temp_' + uuidv4();
      console.log(`⚠️ [SESSION] Используем временный ID сессии: ${actualSessionId}`);
    }
    
    // Проверяем, первое ли это взаимодействие с пользователем
    let userFacts: UserFact[] = [];
    let isFirstInteraction = true;
    
    try {
      userFacts = await chatMemory.getUserFacts(user_id);
      isFirstInteraction = userFacts.length === 0;
    } catch (factsError) {
      console.error('❌ [FACTS] Ошибка при получении фактов о пользователе:', factsError);
      // Продолжаем выполнение даже без фактов
    }
    
    // Улучшаем вопрос с помощью информации о бизнесе пользователя
    let enhancedQuestion = question;
    
    if (question.length < 150 && userFacts.length > 0) {
      const businessFacts = userFacts.filter((f: UserFact) => f.fact_type.startsWith('business_') && f.confidence > 0.7);
      if (businessFacts.length > 0) {
        // Извлекаем ключевые факты о бизнесе для контекста
        const businessType = businessFacts.find((f: UserFact) => f.fact_type === 'business_type')?.fact_value;
        const businessLocation = businessFacts.find((f: UserFact) => f.fact_type === 'business_location')?.fact_value;
        const digitalPresence = businessFacts.find((f: UserFact) => f.fact_type === 'business_digital_presence')?.fact_value;
        
        // Если у нас есть тип бизнеса, добавляем его к вопросу для лучшего контекста
        if (businessType) {
          console.log(`🔄 [ENHANCE] Улучшаем вопрос информацией о типе бизнеса: ${businessType}`);
          
          // Если вопрос уже содержит упоминание о типе бизнеса, не дублируем
          if (!question.toLowerCase().includes(businessType.toLowerCase())) {
            enhancedQuestion = `Контекст: я представляю ${businessType}${businessLocation ? ' в ' + businessLocation : ''}${digitalPresence ? ', у нас есть ' + digitalPresence : ''}. Вопрос: ${question}`;
          }
        }
      }
    }
    
    // Запускаем таймер для препроцессинга
    const preprocessTimer = createTimer();
    
    // Проверяем, содержит ли сообщение информацию о бизнесе без явного вопроса
    const containsNewBusinessInfo = containsBusinessInfo(question);
    
    // Предварительная обработка запроса
    const preprocessed = await preprocessQuery(enhancedQuestion);
    
    // Останавливаем таймер препроцессинга
    preprocessTimer.stop();
    console.log(`⏱ [PREPROCESS] Time: ${preprocessTimer.duration}ms`);

    // Особая обработка для сообщений с новой бизнес-информацией без явного вопроса
    if (containsNewBusinessInfo) {
      console.log('🔍 [BUSINESS INFO] Обнаружена новая информация о бизнесе без явного вопроса');
      
      // Обрабатываем информацию о бизнесе
      const businessResponse = await processBusinessInfo({
        question,
        user_id,
        session_id: actualSessionId,
        dataset_id,
        similarity_threshold,
        max_chunks,
        isFirstInteraction,
        timerTotal
      });
      
      // Применяем форматирование к ответу, чтобы исправить [object Object] и другие технические артефакты
      if (businessResponse.answer) {
        businessResponse.answer = formatJsonObjects(businessResponse.answer);
      }
      
      // Генерируем персонализированные подсказки (временно синхронная версия)
      const { clarificationQuestions, infoTemplates, header } = generatePersonalizedSuggestionsSync(
        await chatMemory.getUserFacts(user_id), // Получаем самые свежие факты
        [], 
        isFirstInteraction,
        question,
        user_id,
        actualSessionId
      );
      
      // Формируем финальный ответ
      const infoResponse: EnhancedResponse = {
        ...businessResponse,
        clarificationQuestions,
        infoTemplates,
        suggestions_header: header
      };
      
      // Сохраняем ответ в историю чата
      try {
        await chatMemory.saveConversationPair(
          actualSessionId,
          question,
          infoResponse.answer,
          {
            assistant: {
              sources: infoResponse.sources
            }
          }
        );
      } catch (saveError) {
        console.error('❌ [CHAT_MEMORY] Ошибка при сохранении диалога:', saveError);
        // Продолжаем выполнение, даже если не удалось сохранить диалог
      }
      
      res.status(200).json(infoResponse);
      return;
    }

    // Проверка релевантности запроса
    if (!preprocessed.isRelevant) {
      // Генерируем персонализированные подсказки (временно синхронная версия)
      const { clarificationQuestions, infoTemplates, header } = generatePersonalizedSuggestionsSync(
        userFacts, 
        [], 
        isFirstInteraction,
        question,
        user_id,
        actualSessionId
      );
      
      const notRelevantResponse: EnhancedResponse = {
        answer: preprocessed.explanation || 'Извините, этот вопрос не относится к Европейскому акту о доступности (EAA) или веб-доступности. Я могу помочь вам с вопросами о требованиях EAA, его применении и внедрении доступных веб-решений.',
        sources: [],
        no_results: true,
        performance: {
          embedding_ms: 0,
          search_ms: 0,
          generate_ms: 0,
          total_ms: Math.round(performance.now() - timerTotal.start)
        },
        clarificationQuestions,
        infoTemplates,
        needs_clarification: false,
        suggestions_header: header
      };
      
      // Сохраняем взаимодействие в историю чата
      try {
        await chatMemory.saveConversationPair(
          actualSessionId,
          question,
          notRelevantResponse.answer
        );
      } catch (e) {
        console.error('❌ [CHAT_MEMORY] Ошибка при сохранении сообщений:', e);
      }
      
      // Отвечаем пользователю, что запрос не релевантен
      res.status(200).json(notRelevantResponse);
      return;
    }

    // Если запрос требует уточнения, отправляем пользователю подсказки
    if (preprocessed.needsClarification && !containsNewBusinessInfo) {
      // Динамический порог: если заполнено >15 % данных, не требуем уточнений
      const commonUserFactsTmp = convertUserFacts(userFacts);
      const analysisTmp = analyzeUserData(commonUserFactsTmp, question);
      if (analysisTmp.completeness > 0.15) {
        console.log('ℹ️ [CLARIFY] Данных достаточно (>15%), пропускаем уточнение');
      } else {
        console.log('❔ [CLARIFY] Запрос требует уточнения');
        
        const commonUserFacts = convertUserFacts(userFacts);
        const userDataAnalysis = analyzeUserData(commonUserFacts, question);
        
        console.log(`📊 [CLARIFY] Полнота данных о пользователе: ${Math.round(userDataAnalysis.completeness * 100)}%`);
        
        const { clarificationQuestions, infoTemplates, header } = generatePersonalizedSuggestionsSync(
          await chatMemory.getUserFacts(user_id), // Получаем самые свежие факты
          [], 
          isFirstInteraction,
          question,
          user_id,
          actualSessionId
        );
          
        // Сохраняем данные, а не возвращаем ответ немедленно
        clarifyMode = true;
        clarifyQuestionsArr = clarificationQuestions;
        clarifyTemplatesArr = infoTemplates;
        clarifyHeader = header || 'Пожалуйста, уточните:';
        if (userDataAnalysis.completeness > 0.2) {
          preliminaryAnalysisData = userDataAnalysis;
        }
        //  NOTE: продолжаем обработку и сгенерируем общий ответ ниже
      }
    }

    // Если у нас несколько вопросов, обрабатываем их как множественный запрос
    if (preprocessed.splitQuestions.length > 1) {
      console.log(`👥 [MULTI] Processing multiple questions with ${preprocessed.splitQuestions.length} questions`);
      
      // Устанавливаем заголовки для потоковой передачи
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders(); // Отправляем заголовки немедленно

      const writeEvent = (data: object) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      try {
        // Обрабатываем вопросы последовательно, чтобы стримить результаты
        for (const question of preprocessed.splitQuestions) {
          console.log(`❓ [STREAMING] Processing question: ${question}`);
          
          const { chunks, embeddingTime, searchTime } = await processQuestion(
            question,
            dataset_id,
            similarity_threshold,
            max_chunks
          );

          if (chunks.length === 0) {
            writeEvent({
              type: 'new_answer',
              content: {
                question,
                answer: 'Sorry, I could not find information for your query.',
                sources: [],
                performance: { embedding_ms: embeddingTime, search_ms: searchTime }
              }
            });
            continue;
          }

          const context = formatRAGContext(chunks, question);
          const messages: ChatCompletionMessageParam[] = [
            { role: 'system', content: CONCISE_SYSTEM_PROMPT },
            { role: 'user', content: context }
          ];

          const completion = await openai.chat.completions.create({
            model: CHAT_MODEL,
            messages,
            temperature: 0
          });

          const answer = completion.choices[0].message.content || '';
          const sources = formatSourcesMetadata(chunks);

          const result: QuestionResult = {
            question,
            answer: formatJsonObjects(answer),
            sources,
            performance: {
              embedding_ms: embeddingTime,
              search_ms: searchTime,
              generate_ms: completion.usage?.total_tokens ? completion.usage.total_tokens * 10 : 0 // Примерный расчет
            }
          };
          
          writeEvent({ type: 'new_answer', content: result });
          
          // Асинхронно сохраняем в память без блокировки
          chatMemory.saveConversationPair(actualSessionId, question, result.answer).catch(console.error);
        }
        
        // После цикла отправляем мета-информацию
        const { clarificationQuestions, infoTemplates, header } = generatePersonalizedSuggestionsSync(
            userFacts, [], false, question, user_id, actualSessionId
        );
        
        writeEvent({
          type: 'meta',
          content: {
            performance: { total_ms: Math.round(performance.now() - timerTotal.start) },
            clarificationQuestions,
            infoTemplates,
            suggestions_header: header,
          }
        });

      } catch (error) {
        console.error('❌ [STREAMING] Error during multi-question stream:', error);
        writeEvent({ type: 'error', content: { message: 'An error occurred during the stream.' } });
      } finally {
        // Завершаем стрим
        writeEvent({ type: 'done' });
        res.end();
        return;
      }
    }

    // Если у нас один вопрос, обрабатываем его как раньше
    console.log('❓ [SINGLE] Processing single question');
    
    // Use reformulated question if available
    const finalQuestion = preprocessed.reformulatedQuery || enhancedQuestion;
    console.log(`🔄 [REWRITE] ${finalQuestion !== question ? 'Query reformulated' : 'Query left unchanged'}`);
    
    // Create timers for performance measurement
    const generateTimer = createTimer();
    
    try {
      // Process query in parallel
      const { embedding, chunks, embeddingTime, searchTime } = await processQuestion(
        finalQuestion, 
        dataset_id, 
        similarity_threshold, 
        max_chunks
      );
      
      console.log(`🔍 [SEARCH] Found ${chunks.length} relevant chunks`);
      
      // Create unique query identifier
      const queryId = uuidv4();
      
      // Check if relevant chunks were found
      if (chunks.length === 0) {
        console.log('⚠️ [NO_RESULTS] No relevant chunks found');
        
        // Generate personalized suggestions via AI agent
        const { clarificationQuestions, infoTemplates, header } = await generatePersonalizedSuggestions(
          userFacts, 
          [], 
          isFirstInteraction,
          question,
          user_id,
          actualSessionId
        );
        
        const noResultsResponse: EnhancedResponse = {
          answer: 'Sorry, I could not find information for your query in the European Accessibility Act knowledge base. Please rephrase your question or choose one of the suggested options.',
          sources: [],
          no_results: true,
          performance: createPerformanceMetrics({
            embedding: { 
              duration: embeddingTime,
              start: 0,
              end: 0,
              stop: () => {},
              reset: () => {}
            },
            search: { 
              duration: searchTime,
              start: 0,
              end: 0,
              stop: () => {},
              reset: () => {}
            },
            total: timerTotal
          }),
          needs_clarification: true,
          clarificationQuestions,
          infoTemplates,
          suggestions_header: header
        };
        
        // Save interaction to history (asynchronously)
        chatMemory.saveConversationPair(
          actualSessionId,
          question,
          noResultsResponse.answer
        ).catch(e => console.error('❌ [CHAT_MEMORY] Error saving messages:', e));
        
        res.status(200).json(noResultsResponse);
        return;
      }
      
      // Format chunks into context for query
      const context = formatRAGContext(chunks, finalQuestion);
      
      // Generate context for query with dialog history (if available)
      let enhancedContext = context;
      
      if (chatMemory.createContextForRequest) {
        try {
          const chatContext = await chatMemory.createContextForRequest(user_id, actualSessionId, finalQuestion);
          if (chatContext) {
            console.log('📜 [CONTEXT] Added context from dialog history');
            enhancedContext = `${chatContext}\n\n${context}`;
          }
        } catch (e) {
          console.error('❌ [CHAT_MEMORY] Error creating context from history:', e);
        }
      }
      
      // Create messages for API
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: STRICT_SYSTEM_PROMPT },
        { role: 'user', content: enhancedContext }
      ];
      
      // Generate answer with streaming
      generateTimer.reset();
      
      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      try {
        const stream = await generateStreamingCompletion(messages, 0);
        
        let fullAnswer = '';
        const writeEvent = (event: string, data: object) => {
            res.write(`event: ${event}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullAnswer += content;
            writeEvent('message', { chunk: content, type: 'content' });
          }
        }
        
        generateTimer.stop();
        writeEvent('end', { message: 'Stream ended' });
        res.end();
        
        // Apply formatting to full answer
        const formattedAnswer = formatJsonObjects(fullAnswer);
        
        // Rest of the logic executed in background...
        setImmediate(async () => {
          try {
            // 🧠 NEW FUNCTION: Term analysis in bot response
            let termAnalysis: any = null;
            try {
              console.log('🔍 [TERM_ANALYSIS] Starting term analysis in bot response...');
              const { termAnalysisAgent } = await import('../services/termAnalysisAgent.js');
              termAnalysis = await termAnalysisAgent.analyzeResponse(
                formattedAnswer, 
                actualSessionId, 
                user_id
              );
              
              if (termAnalysis.shouldGenerateClarifications) {
                console.log(`✅ [TERM_ANALYSIS] Found ${termAnalysis.detectedTerms.length} terms for clarification`);
                console.log(`🎯 [TERM_ANALYSIS] Generated ${termAnalysis.contextualSuggestions.length} contextual suggestions`);
              }
            } catch (termError) {
              console.error('❌ [TERM_ANALYSIS] Error analyzing terms:', termError);
            }
            
            // Format sources
            const sources = formatSourcesMetadata(chunks);
            
                         // Run background tasks
             const backgroundTasks = Promise.allSettled([
              // Log query to database
              logQuery(
                question,
                finalQuestion !== question ? finalQuestion : null,
                formattedAnswer,
                dataset_id,
                chunks.map((c: any) => c.id),
                queryId
              ),
              
              // Save interaction to history
              chatMemory.saveConversationPair(
                actualSessionId,
                question,
                formattedAnswer,
                {
                  assistant: {
                    sources
                  }
                }
              ),
              
              // 🤖 FRUSTRATION ANALYSIS OF USER
              (async () => {
                try {
                  console.log('\n🔍 [FRUSTRATION] Starting user frustration analysis...');
                  
                  const recentMessages = await chatMemory.getSessionMessages(actualSessionId);
                  
                  const frustrationAnalysis = await frustrationAgent.analyzeFrustration(
                    question,
                    recentMessages,
                    actualSessionId,
                    user_id
                  );
                  
                  console.log(`📊 [FRUSTRATION] Analysis result: level ${frustrationAnalysis.frustrationLevel.toFixed(2)}, escalation: ${frustrationAnalysis.shouldEscalate}`);
                  
                  if (frustrationAnalysis.shouldEscalate) {
                    console.log('🚨 [ESCALATION] High frustration level! Generating email for manager...');
                    
                    try {
                      const emailDraft = await emailComposer.generateEmail({
                        userId: user_id,
                        sessionId: actualSessionId,
                        frustrationAnalysis: frustrationAnalysis,
                        userFacts: convertUserFacts(userFacts),
                        recentMessages: recentMessages,
                        businessContext: 'EAA Compliance Chatbot'
                      });
                      
                      console.log('📧 [ESCALATION] Email generated and saved to DB as draft');
                      console.log(`📝 [ESCALATION] Email subject: "${emailDraft.subject}"`);
                      console.log(`🎯 [ESCALATION] Sales potential: ${emailDraft.salesPotential}, urgency: ${emailDraft.urgencyLevel}`);
                      
                    } catch (emailError) {
                      console.error('❌ [ESCALATION] Error generating email:', emailError);
                    }
                  } else {
                    console.log('✅ [FRUSTRATION] Frustration level is normal, no escalation needed');
                  }
                  
                } catch (frustrationError) {
                  console.error('❌ [FRUSTRATION] Error analyzing frustration:', frustrationError);
                }
              })()
            ]);
            
                         backgroundTasks.catch((errors: any) => {
               console.error('❌ [BACKGROUND] Errors in background tasks:', errors);
             });
            
          } catch (error) {
            console.error('❌ [BACKGROUND] Error in background processing:', error);
          }
        });
        
      } catch (streamError) {
        console.error('❌ [STREAM] Error in streaming:', streamError);
        // Fallback to regular response
        const completion = await openai.chat.completions.create({
          model: CHAT_MODEL,
          messages,
          temperature: 0
        });
        generateTimer.stop();
        
        const answer = completion.choices[0].message.content || '';
        const formattedAnswer = formatJsonObjects(answer);
        
        // Send regular JSON response as fallback
        res.status(200).json({
          answer: formattedAnswer,
          sources: formatSourcesMetadata(chunks),
          no_results: false,
          performance: createPerformanceMetrics({
            total: timerTotal,
            embedding: { 
              duration: embeddingTime,
              start: 0,
              end: 0,
              stop: () => {},
              reset: () => {}
            },
            search: { 
              duration: searchTime,
              start: 0,
              end: 0,
              stop: () => {},
              reset: () => {}
            },
            generate: generateTimer
          })
        });
      }

    } catch (error) {
      console.error('❌ [ERROR] Error processing query:', error);
      
      const errorResponse: EnhancedResponse = {
        answer: 'Sorry, an error occurred while processing your query. Please try again later or contact the administrator.',
        sources: [],
        no_results: true,
        performance: createPerformanceMetrics({
          total: timerTotal
        }),
        needs_clarification: false,
        clarificationQuestions: [],
        infoTemplates: [],
        suggestions_header: ''
      };
      
      res.status(500).json(errorResponse);
    }

  } catch (error: any) {
    console.error('❌ [ERROR] Error processing query:', error);
    
    // Send error to user
    res.status(500).json({
      error: 'An error occurred while processing your query',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Logging multiple queries to database
const logMultipleQueries = async (
  questions: string[],
  answers: string[],
  datasetId: string,
  queryId: string
) => {
  try {
    console.log('📝 [LOG] Logging multiple queries to database');
    // Log each question with corresponding answer
    for (let i = 0; i < questions.length; i++) {
      await logQuery(
        questions[i],
        null,
        answers[i],
        datasetId,
        [], // No identifiers for chunks for simplicity
        `${queryId}-${i}`
      );
    }
  } catch (error) {
    console.error('❌ [LOG] Error logging multiple queries:', error);
  }
}; 