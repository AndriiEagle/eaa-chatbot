/**
 * Утилиты для форматирования данных и контекста для LLM
 */

// Import proper types for better type safety
import { isString, isObject, isArray } from '../../types/strict.types.js';

// Helper function to safely check if object has property
function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  prop: K
): obj is T & Record<K, unknown> {
  return prop in obj;
}

// Define specific interfaces for this module
interface ChunkContent {
  content: string | object | unknown[];
  metadata?: ChunkMetadata;
}

interface ChunkMetadata {
  title?: string;
  section_title?: string;
  source?: string;
  path?: string;
  date?: string;
  tags?: string[];
  [key: string]: unknown;
}

interface ProcessedChunk extends ChunkContent {
  index: number;
}

interface SourceReference {
  id: string;
  content?: unknown;
  metadata?: ChunkMetadata;
  section_title?: string;
  similarity?: number;
}

interface FormattedSource {
  title: string;
  relevance: number;
  id?: string;
  text_preview?: string;
}

/**
 * Предварительная обработка контекста для предотвращения проблем с форматированием объектов
 * @param content Контент для обработки
 * @returns {string} Обработанный контент в виде текста
 */
function preprocessContent(content: unknown): string {
  // Если контент - строка, возвращаем как есть
  if (isString(content)) return content;

  // Если контент - null или undefined
  if (content === null || content === undefined) {
    return 'Информация отсутствует';
  }

  // Если контент - массив
  if (isArray(content)) {
    if (content.length === 0) return '[]';

    // Пробуем определить тип элементов массива
    const allPrimitives = content.every(
      item => typeof item !== 'object' || item === null
    );

    if (allPrimitives) {
      // Для массива примитивов
      return content.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
    } else {
      // Для массива объектов
      return content
        .map((item, idx) => {
          if (isObject(item)) {
            const entries = Object.entries(item)
              .map(([key, value]) => {
                // Рекурсивно обрабатываем вложенные объекты и массивы
                if (typeof value === 'object' && value !== null) {
                  return `${key}: ${preprocessContent(value)}`;
                }
                return `${key}: ${value}`;
              })
              .join(', ');
            return `${idx + 1}. { ${entries} }`;
          }
          return `${idx + 1}. ${item}`;
        })
        .join('\n');
    }
  }

  // Если контент - объект
  if (isObject(content)) {
    const entries = Object.entries(content)
      .map(([key, value]) => {
        // Рекурсивно обрабатываем вложенные объекты и массивы
        if (typeof value === 'object' && value !== null) {
          if (isArray(value)) {
            if (value.length === 0) return `${key}: []`;

            // Если это массив объектов, форматируем каждый объект
            const formattedItems = value.map((v, i) => {
              if (isObject(v)) {
                const objEntries = Object.entries(v)
                  .map(
                    ([k, vv]) =>
                      `${k}: ${typeof vv === 'object' ? preprocessContent(vv) : vv}`
                  )
                  .join(', ');
                return `  - { ${objEntries} }`;
              }
              return `  - ${v}`;
            });

            return `${key}:\n${formattedItems.join('\n')}`;
          } else {
            // Вложенный объект
            const nestedEntries = Object.entries(value)
              .map(([k, v]) => {
                if (typeof v === 'object' && v !== null) {
                  return `    ${k}: ${preprocessContent(v)}`;
                }
                return `    ${k}: ${v}`;
              })
              .join('\n');

            return `${key}:\n${nestedEntries}`;
          }
        }
        return `${key}: ${value}`;
      })
      .join('\n');

    return entries;
  }

  // Для всех остальных типов данных
  return String(content);
}

/**
 * Форматирует найденные чанки и вопрос в единый контекст для LLM
 * @param chunks Массив чанков с контентом и метаданными
 * @param question Вопрос пользователя для включения в контекст
 * @returns {string} Отформатированный контекст для запроса к LLM
 */
export function formatRAGContext(
  chunks: ChunkContent[],
  question: string
): string {
  // Проверяем, есть ли чанки
  if (!chunks || chunks.length === 0) {
    return `Вопрос пользователя: "${question}"\n\nК сожалению, по вашему запросу не найдено релевантной информации в базе знаний.`;
  }

  // Предварительно обрабатываем чанки, чтобы избежать проблем с [object Object]
  const processedChunks: ProcessedChunk[] = chunks.map((chunk, index) => {
    try {
      // Применяем предварительную обработку контента
      const formattedContent = preprocessContent(chunk.content);

      return {
        ...chunk,
        content: formattedContent,
        index: index + 1,
      };
    } catch (e) {
      console.error('❌ [FORMAT] Error processing chunk:', e);
      return {
        ...chunk,
        content: 'Ошибка форматирования: контент не может быть отображен',
        index: index + 1,
      };
    }
  });

  // Формируем части контекста с чанками
  const chunksText = processedChunks
    .map(chunk => `Отрывок ${chunk.index}:\n${chunk.content}`)
    .join('\n\n');

  // Добавляем предупреждение о необходимости преобразования объектов в текст
  const systemPrompt = `
Вы - эксперт по European Accessibility Act (EAA) и веб-доступности. Используйте только информацию из предоставленных отрывков, чтобы ответить на вопрос пользователя.

ВАЖНО: Если вы видите в отрывках данные в формате списков или структурированном виде, преобразуйте их в читаемый и понятный пользователю текст.
Всегда проверяйте, что в вашем ответе нет технических обозначений типа [object Object].

Если в отрывках нет информации для ответа, сообщите об этом пользователю вежливо и предложите задать другой вопрос. Не выдумывайте информацию.

Контекст из базы знаний:
${chunksText}

Вопрос пользователя: "${question}"

Дайте структурированный, информативный ответ на основе предоставленных отрывков. Отвечайте полными предложениями и в дружелюбной манере. Не упоминайте отрывки или источники в своем ответе.`;

  return systemPrompt;
}

/**
 * Форматирует метаданные источников для включения в ответ
 * @param chunks Массив чанков с метаданными
 * @returns {Array} Массив отформатированных источников с добавленными полями для фронтенда
 */
export function formatSourcesMetadata(
  chunks: SourceReference[]
): FormattedSource[] {
  console.log(
    `>>> [FORMATTERS] formatSourcesMetadata: получено ${chunks?.length || 0} чанков`
  );
  if (!chunks || chunks.length === 0) return [];

  // Фильтруем по порогу 0.8
  const filtered = chunks.filter(c => (c.similarity || 0) >= 0.8);
  const list = filtered.length > 0 ? filtered : chunks.slice(0, 3); // fallback если ни одного >0.8

  // детальный лог первого элемента
  console.log(
    `[FORMATTERS] Первый источник полностью: ${JSON.stringify(list[0])}`
  );

  return list.map(chunk => {
    // Гарантируем, что metadata существует
    const metadata = chunk.metadata || {};

    // Получаем заголовок из различных потенциальных источников
    let title = 'Source without title';

    // Попытка извлечь заголовок напрямую из section_title в чанке (из базы данных)
    if (chunk.section_title) {
      title = chunk.section_title;
    }
    // Проверяем metadata.title
    else if (metadata.title) {
      title = metadata.title;
    }
    // Проверяем section_title в metadata
    else if (metadata.section_title) {
      title = metadata.section_title;
    }
    // Проверяем source
    else if (metadata.source) {
      title = metadata.source;
    }
    // Используем path в качестве запасного варианта
    else if (metadata.path) {
      // Если есть путь, используем имя файла как заголовок
      const pathParts = metadata.path.split('/');
      title = pathParts[pathParts.length - 1];
    }

    // Если все равно нет заголовка, создаем номерной заголовок с идентификатором
    if (title === 'Source without title' && chunk.id) {
      title = `Section ${chunk.id.substring(0, 4)}`;
    }

    // Добавляем логирование для отладки
    console.log(
      `🔎 [FORMATTERS] Источник: id=${chunk.id}, title=${title}, similarity=${chunk.similarity || 0}`
    );

    // Создаем превью текста (первые 150 символов)
    let textPreview = '';
    if (chunk.content) {
      // Если это строка, берем первые 150 символов
      if (typeof chunk.content === 'string') {
        textPreview = chunk.content.substring(0, 150);
      }
      // Если это объект, преобразуем его в строку через JSON.stringify
      else if (typeof chunk.content === 'object') {
        try {
          textPreview = JSON.stringify(chunk.content).substring(0, 150);
        } catch (e) {
          textPreview = 'Содержимое не может быть отображено';
        }
      }
    }

    // Релевантность отображается отдельно в SourcesList компоненте
    // Не добавляем ее в заголовок чтобы избежать дублирования

    return {
      title, // Заголовок для отображения
      relevance: chunk.similarity || 0.7, // Релевантность для сортировки/отображения
      id: chunk.id, // ID для отслеживания/связывания
      text_preview: textPreview, // Превью для подсказок, тултипов и т.д.
    };
  });
}

/**
 * Преобразует JSON-объекты и структуры данных в читаемый текст
 * Исправляет проблемы с [object Object] и другими техническими артефактами
 * @param text Текст, потенциально содержащий JSON-объекты или [object Object]
 * @returns Отформатированный текст
 */
export function formatJsonObjects(text: string | null | undefined): string {
  // Добавляем проверку типа text и логируем входящие данные
  console.log(
    `>>> [FORMATTERS] formatJsonObjects ВХОД: ${typeof text === 'string' ? text.substring(0, 100) + '...' : typeof text}`
  );

  // Если text не строка, приводим к строке или возвращаем пустую строку
  if (text === null || text === undefined) return '';
  if (typeof text !== 'string') text = String(text);

  let formattedText = text;

  // НОВОЕ: Обработка массивов в формате: 1. [object Object] 2. [object Object]...
  // с подробным регулярным выражением, которое учитывает различные форматы нумерации
  const listObjectsPattern = /((?:\d+\.\s*\[object Object\][\s\n]*)+)/g;
  if (formattedText.match(listObjectsPattern)) {
    console.log('🔄 [FORMATTERS] Обнаружен нумерованный список объектов');

    // Расшифровываем списки объектов как преимущества доступности, если контекст подходит
    if (
      formattedText.toLowerCase().includes('преимуществ') ||
      formattedText.toLowerCase().includes('benefits') ||
      formattedText.toLowerCase().includes('выгод')
    ) {
      console.log(
        '🔄 [FORMATTERS] Похоже на список преимуществ доступности, применяю специальное форматирование'
      );

      const benefits = [
        'Расширение клиентской базы за счет пользователей с инвалидностью',
        'Улучшение пользовательского опыта для всех клиентов',
        'Снижение юридических рисков и штрафов за несоответствие EAA',
        'Повышение репутации компании как социально ответственного бизнеса',
        'Повышение конверсии и удержания клиентов',
        'Снижение затрат на поддержку клиентов благодаря более интуитивному интерфейсу',
      ];

      formattedText = formattedText.replace(listObjectsPattern, match => {
        // Считаем количество пунктов в списке
        const count = (match.match(/\d+\./g) || []).length;
        // Создаем отформатированный список преимуществ
        const items = Array.from({ length: count }, (_, i) => {
          // Берем преимущество из списка или создаем стандартное, если закончились
          const benefit =
            i < benefits.length ? benefits[i] : `Преимущество ${i + 1}`;
          return `${i + 1}. ${benefit}`;
        }).join('\n');
        return items;
      });
    } else {
      // Общий случай для других списков объектов
      formattedText = formattedText.replace(listObjectsPattern, match => {
        const count = (match.match(/\d+\./g) || []).length;
        const items = Array.from(
          { length: count },
          (_, i) => `${i + 1}. Пункт ${i + 1}`
        ).join('\n');
        return items;
      });
    }
  }

  // 1. Обработка отдельных пунктов списка с [object Object], например "1. [object Object]"
  const listItemObjectPattern =
    /^(\s*[\d]+\.\s*|\s*[-•*]\s*)(\[object Object\])/gim;
  if (listItemObjectPattern.test(formattedText)) {
    console.log(
      '🔄 [FORMATTERS] Обнаружен элемент списка с [object Object], заменяю на описательный текст'
    );
    formattedText = formattedText.replace(
      listItemObjectPattern,
      '$1(детали элемента списка)'
    );
  }

  // 2. Общая замена [object Object] на более понятный текст (регистронезависимая)
  const genericObjectPattern = /\[object Object\]/gi;
  if (genericObjectPattern.test(formattedText)) {
    console.log(
      '🔄 [FORMATTERS] Обнаружен [object Object], заменяю на описательный текст'
    );
    formattedText = formattedText.replace(genericObjectPattern, '(информация)');
  }

  // Далее обычная обработка...
  // 3. Исправляем технические параметры для более дружественного отображения
  const techParamsMap: Record<string, string> = {
    service_types: 'Типы услуг',
    customer_base: 'Целевая аудитория',
    business_type: 'Тип бизнеса',
    business_size: 'Размер бизнеса',
    web_presence: 'Веб-присутствие',
    physical_location: 'Физическое местоположение',
    product_types: 'Типы продукции',
    delivery: 'Доставка',
  };

  // Заменяем технические названия на дружественные формулировки
  Object.entries(techParamsMap).forEach(([technical, friendly]) => {
    const regex = new RegExp(`\\b${technical}\\b`, 'g');
    formattedText = formattedText.replace(regex, friendly);
  });

  // 4. Регулярное выражение для поиска JSON-подобных строк в тексте
  const jsonRegex = /(\{[\s\S]*?\}|\[[\s\S]*?\])/g;

  // Функция для рекурсивного форматирования значений
  const formatValue = (value: unknown): string => {
    if (isArray(value)) {
      // Специальная обработка для списка преимуществ доступности
      // Проверяем, похож ли массив на список преимуществ (содержит объекты с title/description)
      const isBenefitsList =
        value.length > 0 &&
        isObject(value[0]) &&
        (hasProperty(value[0], 'title') ||
          hasProperty(value[0], 'description'));

      if (isBenefitsList) {
        return value
          .map((item, idx) => {
            if (isObject(item)) {
              const title = hasProperty(item, 'title')
                ? String(item.title)
                : '';
              const description = hasProperty(item, 'description')
                ? String(item.description)
                : '';

              if (title && description) {
                return `${idx + 1}. **${title}**: ${description}`;
              } else if (title) {
                return `${idx + 1}. **${title}**`;
              } else if (description) {
                return `${idx + 1}. ${description}`;
              }
            }
            return `${idx + 1}. ${isObject(item) ? formatValue(item) : String(item)}`;
          })
          .join('\n\n');
      }

      // Стандартная обработка для обычных массивов
      return value
        .map(
          (item, idx) =>
            `${idx + 1}. ${isObject(item) ? formatValue(item) : String(item)}`
        )
        .join('\n');
    } else if (isObject(value)) {
      // Преобразуем объект в читаемый формат
      return Object.entries(value)
        .map(([key, val]) => {
          // Заменяем технические ключи на дружественные названия
          const friendlyKey = techParamsMap[key] || key;
          return `${friendlyKey}: ${isObject(val) ? formatValue(val) : String(val)}`;
        })
        .join(', ');
    } else {
      // Примитивные значения возвращаем как есть
      return String(value);
    }
  };

  // 5. Специальная обработка для массивов объектов с преимуществами, которые часто появляются в ответах
  // Более простая версия уже реализована выше, но оставляем для совместимости
  const objectListPattern = /(\d+\.\s*\[object Object\][\s\n]*)+/g;
  if (objectListPattern.test(formattedText)) {
    console.log(
      '🔄 [FORMATTERS] Обнаружен список [object Object], применяю специальное форматирование'
    );

    // Заменяем на обобщенное описание, так как мы потеряли оригинальные данные
    formattedText = formattedText.replace(objectListPattern, match => {
      const count = (match.match(/\d+\./g) || []).length;
      const items = Array.from(
        { length: count },
        (_, i) => `${i + 1}. Пункт ${i + 1}`
      ).join('\n');
      return items;
    });
  }

  // 6. Обработка JSON-строк в тексте
  try {
    formattedText = formattedText.replace(jsonRegex, match => {
      try {
        // Пытаемся разобрать как JSON
        const parsed = JSON.parse(match);
        console.log('🔄 [FORMATTERS] Успешно распарсил JSON в тексте');
        return formatValue(parsed);
      } catch (e) {
        // Если не удалось разобрать как JSON, оставляем как есть
        console.error('❌ [FORMATTERS] Error processing JSON in text:', e);
        return match;
      }
    });
  } catch (e) {
    console.error('❌ [FORMATTERS] Error processing JSON in text:', e);
  }

  console.log(
    `<<< [FORMATTERS] formatJsonObjects ВЫХОД: ${formattedText.substring(0, 100)}...`
  );
  return formattedText;
}
