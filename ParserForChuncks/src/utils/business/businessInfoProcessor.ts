import { v4 as uuidv4 } from 'uuid';
import { TimerMeasure, EnhancedResponse } from '../../types/common.js';
import { chatMemory } from '../memory/index.js';
import { UserFact } from '../memory/types.js';
import { openai } from '../../services/openaiService.js';
import { createEmbedding } from '../../services/openaiService.js';
import { findRelevantChunks } from '../../services/supabaseService.js';
import { CHAT_MODEL } from '../../config/environment.js';
import { STRICT_SYSTEM_PROMPT } from '../../config/prompts.js';
import { formatRAGContext, formatSourcesMetadata } from '../formatting/formatters.js';
import { Timer, createPerformanceMetrics } from '../metrics/timers.js';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

/**
 * Проверяет, содержит ли сообщение пользователя информацию о бизнесе без явного вопроса
 * @param message Сообщение пользователя для проверки
 * @returns {boolean} Признак наличия бизнес-информации без явного вопроса
 */
export function containsBusinessInfo(message: string): boolean {
  if (!message || typeof message !== 'string') return false;
  
  // Если сообщение содержит вопросительный знак, считаем, что это вопрос
  if (message.includes('?')) return false;
  
  // Игнорируем очень короткие сообщения (менее 5 слов)
  const wordCount = message.split(/\s+/).filter(Boolean).length;
  if (wordCount < 5) return false;
  
  // Проверяем наличие ключевых слов о бизнесе
  const businessWords = [
    'компания', 'бизнес', 'предприятие', 'фирма', 'организация', 
    'магазин', 'сайт', 'приложение', 'стартап', 'проект',
    'производство', 'работаю', 'индивидуальный предприниматель', 'ИП',
    'занимаемся', 'предоставляем', 'продаем', 'оказываем услуги',
    'наша компания', 'мой бизнес', 'моя компания', 'наш бизнес',
    'я владелец', 'я руководитель', 'я директор', 'мы продаем'
  ];
  
  const locationWords = [
    'находится в', 'расположен в', 'базируется', 'работает в', 
    'из России', 'из Германии', 'из Франции', 'из Италии',
    'в Европе', 'в Евросоюзе', 'в ЕС'
  ];
  
  const sizeWords = [
    'сотрудников', 'работников', 'человек в штате', 'небольшая компания',
    'маленькая компания', 'средняя компания', 'крупная компания'
  ];
  
  const digitalWords = [
    'сайт', 'приложение', 'мобильное приложение', 'веб-сайт',
    'интернет-магазин', 'онлайн-платформа', 'веб-портал'
  ];
  
  // Объединяем все массивы ключевых слов
  const allKeywords = [...businessWords, ...locationWords, ...sizeWords, ...digitalWords];
  
  // Проверяем наличие хотя бы одного ключевого слова
  return allKeywords.some(word => message.toLowerCase().includes(word.toLowerCase()));
}

/**
 * Интерфейс для параметров обработки бизнес-информации
 */
interface BusinessInfoParams {
  question: string;
  user_id: string;
  session_id: string;
  dataset_id: string;
  similarity_threshold: number;
  max_chunks: number;
  isFirstInteraction: boolean;
  timerTotal: Timer;
}

/**
 * Обрабатывает информацию о бизнесе пользователя, извлекает факты и генерирует релевантный ответ
 * @param params Параметры для обработки бизнес-информации
 * @returns {Promise<EnhancedResponse>} Объект ответа с обработанной информацией
 */
export async function processBusinessInfo(params: BusinessInfoParams): Promise<EnhancedResponse> {
  console.log('🔍 [BUSINESS PROCESS] Обработка бизнес-информации из сообщения пользователя');
  
  // Сохраняем сообщение пользователя в историю чата и получаем его ID
  let messageId: string;
  try {
    messageId = await chatMemory.saveMessage(
      params.question,
      'user',
      params.session_id,
      { timestamp: new Date().toISOString() }
    );
    console.log(`✅ [BUSINESS PROCESS] Сообщение пользователя сохранено с ID: ${messageId}`);
  } catch (error) {
    console.error('❌ Error saving user message to chat history:', error);
    // Создаем запасной ID на случай, если сохранение не удалось
    messageId = uuidv4();
  }
  
  // Извлекаем факты о бизнесе из сообщения пользователя
  const factExtractionPrompt = `
    Ты - система извлечения бизнес-информации. Твоя задача - проанализировать сообщение пользователя и извлечь факты о его бизнесе. 
    Формат ответа - строго JSON со следующей структурой: 
    {
      "facts": [
        {
          "fact_type": "тип_факта", // business_type, business_location, business_size, business_digital_presence
          "fact_value": "значение",
          "confidence": число от 0 до 1 // уверенность в точности извлеченного факта
        }
      ]
    }
    
    Сообщение пользователя: "${params.question}"
  `;
  
  const factExtraction = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: factExtractionPrompt }] as ChatCompletionMessageParam[],
    temperature: 0,
    response_format: { type: 'json_object' }
  });
  
  let facts = [];
  try {
    const response = JSON.parse(factExtraction.choices[0].message.content || '{}');
    facts = response.facts || [];
    
    // Сохраняем извлеченные факты в базу данных, используя ID сохраненного сообщения
    for (const fact of facts) {
      if (fact.confidence > 0.7) {
        await chatMemory.saveUserFact(
          params.user_id,
          fact.fact_type,
          fact.fact_value,
          fact.confidence,
          messageId // Используем ID сохраненного сообщения вместо генерации нового
        );
      }
    }
    
    console.log(`✅ [FACTS] Извлечено ${facts.length} фактов о бизнесе`);
  } catch (e) {
    console.error('❌ [FACTS] Ошибка при извлечении фактов:', e);
  }
  
  // Получаем актуальные факты о пользователе из базы данных
  const updatedFacts = await chatMemory.getUserFacts(params.user_id);
  const highConfidenceBusinessFacts = updatedFacts.filter(
    (f: UserFact) => f.fact_type.startsWith('business_') && f.confidence > 0.7
  );
  
  // Извлекаем важную информацию о бизнесе
  const businessType = highConfidenceBusinessFacts.find((f: UserFact) => f.fact_type === 'business_type')?.fact_value;
  const businessLocation = highConfidenceBusinessFacts.find((f: UserFact) => f.fact_type === 'business_location')?.fact_value;
  
  // Строим запрос для поиска релевантной информации о бизнесе
  let searchQuery = '';
  if (businessType && businessLocation) {
    searchQuery = `${businessType} ${businessLocation} требования EAA обязательства`;
  } else if (businessType) {
    searchQuery = `${businessType} требования EAA обязательства`;
  } else if (businessLocation) {
    searchQuery = `${businessLocation} требования EAA обязательства`;
  } else {
    searchQuery = 'общие требования EAA для бизнеса';
  }
  
  // Ищем релевантные фрагменты в базе знаний
  const embedding = await createEmbedding(searchQuery);
  const chunks = await findRelevantChunks(
    embedding, 
    params.dataset_id, 
    params.similarity_threshold, 
    params.max_chunks
  );
  
  // Формируем контекст с чанками для генерации ответа
  const context = formatRAGContext(chunks, 
    `Пользователь предоставил информацию: "${params.question}". 
    ${highConfidenceBusinessFacts.length > 0 ? 
      `Извлеченные факты о бизнесе: ${highConfidenceBusinessFacts.map((f: UserFact) => `${f.fact_type.replace('business_', '')}: ${f.fact_value}`).join(', ')}` : 
      'Не удалось извлечь конкретные факты о бизнесе. Отвечайте в общем виде.'
    }
    Ответьте пользователю, поблагодарив за информацию о бизнесе. Подтвердите, что вы поняли информацию о его бизнесе.
    Затем предоставьте краткую информацию о том, как требования European Accessibility Act (EAA) могут относиться к его типу бизнеса, основываясь на предоставленном контексте.
    Если не хватает информации для конкретных рекомендаций, вежливо попросите уточнить детали, которые помогут дать более точный ответ.`
  );
  
  // Создаем сообщения для API
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: STRICT_SYSTEM_PROMPT },
    { role: 'user', content: context }
  ];
  
  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages,
    temperature: 0.1
  });
  
  const answer = completion.choices[0].message.content || '';
  const sources = formatSourcesMetadata(chunks);
  
  // Сохраняем сообщение пользователя в историю чата
  try {
    await chatMemory.saveMessage(
      params.question,
      'user',
      params.session_id,
      { timestamp: new Date().toISOString() }
    );
  } catch (error) {
    console.error('❌ Error saving user message to chat history:', error);
  }
  
  // Формируем объект ответа
  return {
    answer,
    sources,
    no_results: chunks.length === 0,
    performance: createPerformanceMetrics({
      total: params.timerTotal
    }),
    needs_clarification: false
  };
} 