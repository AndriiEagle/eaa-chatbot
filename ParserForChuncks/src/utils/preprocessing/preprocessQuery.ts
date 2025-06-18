import { PreprocessResult } from '../../types/common.js';
import { openai } from '../../services/openaiService.js';
import { CHAT_MODEL } from '../../config/environment.js';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { smartSplitQuestions } from '../questionSplitting/splitQuestions.js';

/**
 * Проверяет, относится ли запрос к бизнес-тематике
 * @param text - Текст запроса пользователя
 * @returns true если запрос, вероятно, связан с бизнесом
 */
export function isPotentiallyBusinessRelevant(text: string): boolean {
  // Если есть вопросительный знак, значит это явный вопрос, а не информация о бизнесе
  if (text.includes('?')) {
    return false;
  }
  
  const businessKeywords = [
    // Типы бизнеса
    'компания', 'бизнес', 'магазин', 'банк', 'сайт', 'приложение', 
    'транспорт', 'перевозки', 'туризм', 'клиенты', 'продажи', 'е-коммерция',
    'фирма', 'организация', 'предприятие', 'ип', 'сервис', 'услуги',
    
    // Фразы владения/принадлежности
    'у меня', 'наш', 'моя', 'мой', 'наша', 'работаю в', 'являюсь',
    'я работаю', 'я представляю', 'я владелец', 'мы занимаемся',
    
    // Расположение
    'находится в', 'расположена в', 'базируется в', 'офис в',
    
    // Размер бизнеса
    'сотрудников', 'работников', 'человек в штате', 'малый бизнес',
    'средний бизнес', 'крупная компания', 'штат',
    
    // Цифровое присутствие
    'есть сайт', 'сайт компании', 'мобильное приложение', 'онлайн-сервис',
    'социальные сети', 'интернет-магазин', 'платформа'
  ];
  
  const lowerText = text.toLowerCase();
  
  // Проверяем наличие ключевых слов
  const hasBusinessKeywords = businessKeywords.some(keyword => lowerText.includes(keyword));
  
  // Дополнительные проверки для типичных конструкций, описывающих бизнес
  const startsWithBusinessDescriptor = 
    lowerText.startsWith('я') || 
    lowerText.startsWith('мы') || 
    lowerText.startsWith('наша') || 
    lowerText.startsWith('у нас') ||
    lowerText.startsWith('у меня');
  
  // Для коротких сообщений вначале диалога - более строгие проверки
  if (text.length < 50) {
    // Если короткий текст начинается с бизнес-дескриптора и содержит ключевые слова
    return startsWithBusinessDescriptor && hasBusinessKeywords;
  }
  
  // Для более длинных сообщений - достаточно наличия ключевых слов
  return hasBusinessKeywords;
}

/**
 * Преобразует описательный запрос в вопросительную форму
 * @param text - Исходный текст запроса
 * @returns Текст в вопросительной форме
 */
export function convertDescriptiveToQuestion(text: string): string {
  // Если текст уже содержит вопросительный знак, вернем его как есть
  if (text.includes('?')) return text;
  
  // Проверка на наличие описательных конструкций и их преобразование
  const lower = text.toLowerCase();
  
  // Массив описательных паттернов и их преобразований в вопросы
  const patterns = [
    // Формат: [паттерн, преобразование]
    // Транспортные компании
    ['я украинская транспортная компания', 'Какие требования к доступности веб-сайта для украинской транспортной компании?'],
    ['транспортная компания', 'Какие требования к доступности веб-сайта транспортной компании согласно European Accessibility Act?'],
    ['компания грузоперевозки', 'Как European Accessibility Act применяется к компаниям, занимающимся грузоперевозками?'],
    ['пассажирские перевозки', 'Каким требованиям доступности должны соответствовать сервисы пассажирских перевозок согласно European Accessibility Act?'],
    
    // Разные типы бизнеса
    ['я компания', 'Какие требования к доступности веб-сайта для компаний согласно European Accessibility Act?'],
    ['у меня бизнес', 'Какие требования European Accessibility Act применяются к моему бизнесу?'],
    ['интернет-магазин', 'Какие требования к доступности интернет-магазина согласно European Accessibility Act?'],
    ['онлайн-торговля', 'Какие требования к онлайн-торговле устанавливает European Accessibility Act?'],
    ['банк', 'Какие требования к доступности банковских цифровых сервисов согласно European Accessibility Act?'],
    ['туристическое агентство', 'Какие требования к туристическим агентствам устанавливает European Accessibility Act?'],
    
    // Услуги и сервисы
    ['перевожу людей', 'Какие требования к доступности веб-сайта транспортной компании согласно European Accessibility Act?'],
    ['продаю билеты', 'Какие требования к доступности веб-сайта для продажи билетов согласно European Accessibility Act?'],
    ['продаю онлайн', 'Какие требования к онлайн-продажам устанавливает European Accessibility Act?'],
    ['оказываю услуги', 'Какие требования к доступности при оказании услуг устанавливает European Accessibility Act?'],
    
    // Web и мобильные приложения
    ['сайт доступным', 'Как сделать сайт доступным согласно European Accessibility Act?'],
    ['мобильное приложение', 'Какие требования к доступности мобильных приложений устанавливает European Accessibility Act?'],
    ['веб-приложение', 'Какие требования к доступности веб-приложений согласно European Accessibility Act?'],
    
    // Общие запросы
    ['нужно', 'Что нужно сделать для соответствия требованиям European Accessibility Act?'],
    ['надо', 'Что надо сделать для соответствия требованиям European Accessibility Act?'],
    ['требования', 'Какие требования European Accessibility Act применимы в данном случае?'],
    ['обязательно ли', 'Обязательно ли соблюдать требования European Accessibility Act в данном случае?'],
    ['штрафы', 'Какие штрафы грозят за несоблюдение European Accessibility Act?'],
    ['сроки', 'Какие сроки внедрения требований European Accessibility Act?']
  ];
  
  // Проверяем наличие паттернов в запросе
  for (const [pattern, question] of patterns) {
    if (lower.includes(pattern)) {
      console.log(`🔄 [TRANSFORM] Преобразую описательный запрос "${text}" в вопрос: "${question}"`);
      return question;
    }
  }
  
  // Если не нашли подходящий паттерн, добавляем общий вопрос в конец
  return `${text} Какие требования применимы согласно European Accessibility Act?`;
}

/**
 * Предварительная обработка запроса пользователя
 * @param input - Текст запроса пользователя
 * @returns Результат предобработки
 */
export async function preprocessQuery(input: string): Promise<PreprocessResult> {
  console.log('\n🧠 [PREPROCESS] Проверка запроса на релевантность и улучшение формулировки...');
  
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `
Ты — предварительный фильтр для вопросов о European Accessibility Act (EAA).
У тебя три задачи:

1. ОПРЕДЕЛИТЬ, относится ли вопрос к теме European Accessibility Act (EAA) или веб-доступности.
2. Для НЕЯСНЫХ или КОРОТКИХ запросов запросить УТОЧНЕНИЯ.
3. УЛУЧШИТЬ вопрос для поиска, если он относится к теме.

КРИТИЧЕСКИ ВАЖНО: EAA применяется к широкому спектру бизнесов и организаций, включая:
- Транспортные компании и перевозчики
- Банки и финансовые учреждения
- Электронная коммерция и онлайн-магазины
- Туристические агентства и сервисы
- Медиа и телекоммуникационные компании
- И любые другие организации с цифровыми сервисами или сайтами

ПРАВИЛА ОБРАБОТКИ ЗАПРОСОВ:
1. Если запрос КРАТКИЙ (менее 5 слов) и упоминает тип бизнеса или отрасль - считай его ПОТЕНЦИАЛЬНО РЕЛЕВАНТНЫМ.
   В этом случае ОБЯЗАТЕЛЬНО установи needMoreInfo=true и предложи 3-5 уточняющих вопросов.

2. Если запрос представляет собой описание ситуации без явного вопроса - считай его РЕЛЕВАНТНЫМ и требующим уточнения.

3. Запросы типа "у меня [тип бизнеса]" или "я работаю в [отрасли]" - ВСЕГДА считай релевантными и требующими уточнения.

СТРОГО отвечай только в формате JSON:
{
  "isRelevant": true/false, // относится ли вопрос к European Accessibility Act или веб-доступности
  "explanation": "краткое объяснение почему вопрос релевантен или нет",
  "reformulatedQuery": "улучшенная формулировка вопроса для поиска" // только если isRelevant=true
  "needMoreInfo": true/false, // нужно ли дополнительное уточнение от пользователя
  "clarificationQuestions": ["вопрос1", "вопрос2"] // вопросы для уточнения контекста, если needMoreInfo=true
}

ВАЖНЫЕ ПРАВИЛА:
- Если после приветствия есть любая фраза о European Accessibility Act, доступности или цифровом продукте, считай запрос РЕЛЕВАНТНЫМ.
- Вопросы о других темах (не EAA, не веб-доступность, не бизнес в контексте доступности) - НЕ релевантны.
- Если вопрос на русском или другом языке - ВСЁ РАВНО оцени его релевантность по смыслу.
- Если вопрос содержит упоминание accessibility, web, доступность, инвалид и похожие - скорее всего он релевантен.
- Если вопрос написан с ошибками или неформально - переформулируй его на правильном русском или английском языке.
- Для бизнес-запросов типа "у меня транспортная компания" предложи конкретные вопросы о размере компании, наличии сайта/приложения, работе в ЕС и применимости EAA.
- ОБЯЗАТЕЛЬНО: Все уточняющие вопросы в поле clarificationQuestions должны заканчиваться знаком вопроса.
- Можно добавлять в clarificationQuestions незавершенные шаблоны, заканчивающиеся дефисом, например: "Моя компания находится в стране -", "Наш бизнес работает в секторе -"

🎯 КРИТИЧЕСКИ ВАЖНО - ТЕРМИНОЛОГИЧЕСКИЕ ВОПРОСЫ:
- Вопросы о непонимании EAA терминов ВСЕГДА РЕЛЕВАНТНЫ: "что за анализ пробелов", "что такое WCAG", "не понял аудит доступности"
- Выражения фрустрации с терминами EAA ("не понял", "что за", "объясните") - ВСЕГДА РЕЛЕВАНТНЫ
- Пользователь может спрашивать о терминах из предыдущих ответов чат-бота - это ПРОДОЛЖЕНИЕ диалога о EAA
- Даже если используется нецензурная лексика, но спрашивает о EAA терминах - РЕЛЕВАНТНО

ПРИМЕРЫ:
1. "у меня транспортная компания" -> isRelevant=true, needMoreInfo=true, clarificationQuestions=["Находится ли ваша компания в ЕС?", "Есть ли у вас веб-сайт или приложение?", "Моя компания находится в стране -"]
2. "я продавец" -> isRelevant=true, needMoreInfo=true, clarificationQuestions=["Продаете ли вы товары онлайн?", "Какой размер вашего бизнеса?", "Мой бизнес работает в секторе -"]
3. "привет как дела" -> isRelevant=false
4. "что за анализ пробелов" -> isRelevant=true, reformulatedQuery="Что такое анализ пробелов в контексте аудита доступности EAA?"
5. "не понял, блядь, анализ пробелов" -> isRelevant=true, reformulatedQuery="Что такое анализ пробелов в аудите доступности согласно European Accessibility Act?"
6. "что такое WCAG" -> isRelevant=true, reformulatedQuery="Что такое WCAG и как он связан с European Accessibility Act?"
`
    },
    { role: 'user', content: input }
  ];
  
  try {
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages,
      temperature: 0,
      response_format: { type: 'json_object' }
    });
    
    const rawResponse = completion.choices[0].message.content || '{}';
    console.log('🧠 [PREPROCESS] Ответ от ИИ-классификатора:', rawResponse);
    
    try {
      const result = JSON.parse(rawResponse);
      console.log(`✅ [PREPROCESS] Результат классификации: ${result.isRelevant ? 'РЕЛЕВАНТЕН' : 'НЕ РЕЛЕВАНТЕН'}`);
      if (result.isRelevant && result.reformulatedQuery) {
        console.log(`✅ [PREPROCESS] Улучшенный запрос: "${result.reformulatedQuery}"`);
      }
      if (result.needMoreInfo) {
        console.log(`✅ [PREPROCESS] Требуется уточнение. Вопросы: ${result.clarificationQuestions?.join(', ')}`);
      }
      
      // Разбиваем запрос на подвопросы, если он релевантен
      let splitQuestions: string[] = [input];
      if (result.isRelevant) {
        const splitTimer = performance.now();
        // Используем преобразованный запрос, если он есть, иначе оригинальный
        const queryToSplit = result.reformulatedQuery || input;
        splitQuestions = await smartSplitQuestions(queryToSplit);
        console.log(`⏱ [SPLIT] Time: ${Math.round(performance.now() - splitTimer)}ms`);
        console.log(`🔀 [SPLIT] Получено вопросов: ${splitQuestions.length}`);
      }
      
      // Добавляем новые поля для совместимости с обновленным типом
      const enhancedResult: PreprocessResult = {
        ...result,
        needsClarification: result.needMoreInfo || false,
        suggestions: result.clarificationQuestions || [],
        splitQuestions
      };
      
      return enhancedResult;
    } catch (e) {
      console.error('❌ [PREPROCESS] Error parsing JSON from model response:', e);
      // Если не удалось распарсить JSON, считаем запрос релевантным по умолчанию
      return { 
        isRelevant: true, 
        needsClarification: false, 
        suggestions: [],
        splitQuestions: [input]
      };
    }
    
  } catch (e) {
    console.error('❌ [PREPROCESS] Error calling OpenAI:', e);
    // В случае ошибки API считаем запрос релевантным, чтобы не блокировать пользователя
    return { 
      isRelevant: true, 
      needsClarification: false, 
      suggestions: [],
      splitQuestions: [input]
    };
  }
}