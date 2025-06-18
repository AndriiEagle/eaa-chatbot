import React, { CSSProperties, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageBubbleProps, Message, MessageType, PreliminaryAnalysis } from '../types/index';
import SourceHighlighter from './SourceHighlighter';
import SourcesList from './SourcesList';
import { copyPhrases } from '../constants/phrases';
import PreliminaryAnalysisDisplay from './PreliminaryAnalysisDisplay';

/**
 * Форматирует текст сообщения, выделяя ключевые параметры
 */
const formatMessageText = (text: string) => {
  // Заменяем технические параметры более понятными названиями
  const techParamsMap: Record<string, string> = {
    'service_types': 'Типы услуг',
    'customer_base': 'Целевая аудитория',
    'business_type': 'Тип бизнеса',
    'business_size': 'Размер бизнеса',
    'web_presence': 'Веб-присутствие',
    'physical_location': 'Физическое местоположение',
    'product_types': 'Типы продукции',
    'delivery': 'Доставка'
  };
  
  let formattedText = text;
  
  // Заменяем технические названия на дружественные формулировки
  Object.entries(techParamsMap).forEach(([technical, friendly]) => {
    const regex = new RegExp(`\\b${technical}\\b`, 'g');
    formattedText = formattedText.replace(regex, friendly);
  });
  
  // Возвращаем отформатированный текст
  return formattedText;
};

/**
 * Улучшенная функция обработки объектов в тексте
 */
const processObjectStrings = (text: string): string => {
  if (!text || typeof text !== 'string') return String(text || '');

  console.log('[MessageBubble] processObjectStrings - INPUT:', JSON.stringify(text.substring(0, 200))); // Логируем входящий текст

  let processedText = text;

  // Обнаружение списков преимуществ доступности и замена [object Object]
  if (processedText.toLowerCase().includes('преимуществ') || 
      processedText.toLowerCase().includes('выгод') ||
      processedText.toLowerCase().includes('соблюдение требований')) {
    
    console.log('[MessageBubble] processObjectStrings - Обнаружен контекст преимуществ доступности');
    
    // Обработка нумерованных списков объектов в разных форматах
    // 1. Формат: "1. [object Object]\n2. [object Object]"
    const listPattern = /((?:\d+\.\s*\[object Object\][\s\n]*)+)/g;
    
    // 2. HTML-списки: "<li>[object Object]</li>"
    const htmlListPattern = /(<li[^>]*>\s*\[object Object\]\s*<\/li>)/gi;

    // 3. Маркированные списки: "- [object Object]" или "• [object Object]"
    const bulletListPattern = /(?:[-•*]\s*\[object Object\][\s\n]*)+/g;
    
    if (listPattern.test(processedText) || htmlListPattern.test(processedText) || bulletListPattern.test(processedText)) {
      console.log('[MessageBubble] processObjectStrings - Найден список [object Object] в контексте доступности');
      
      const benefitsTexts = [
        "Расширение клиентской базы за счет доступности сервиса для людей с инвалидностью",
        "Повышение репутации компании как социально ответственного бизнеса",
        "Снижение юридических рисков, связанных с несоответствием требованиям EAA",
        "Улучшение пользовательского опыта для всех клиентов без исключения",
        "Повышение уровня удовлетворенности клиентов и их лояльности",
        "Возможность выхода на новые рынки и аудитории"
      ];
      
      // Заменяем все форматы списков преимуществ
      processedText = processedText.replace(listPattern, (match) => {
        const count = (match.match(/\d+\./g) || []).length;
        return Array.from({length: count}, (_, i) => {
          const benefit = i < benefitsTexts.length ? benefitsTexts[i] : `Преимущество доступности ${i+1}`;
          return `${i+1}. ${benefit}`;
        }).join("\n");
      });
      
      processedText = processedText.replace(htmlListPattern, (match, p1, offset, string) => {
        // Подсчитываем количество элементов списка рядом с текущим
        const listItems = string.match(/<li[^>]*>\s*\[object Object\]\s*<\/li>/gi) || [];
        const count = Math.min(listItems.length, benefitsTexts.length);
        
        // Возвращаем первый элемент из списка преимуществ для этого вхождения
        const index = listItems.indexOf(match);
        if (index >= 0 && index < benefitsTexts.length) {
          return `<li>${benefitsTexts[index]}</li>`;
        }
        return `<li>Преимущество доступности</li>`;
      });
      
      processedText = processedText.replace(bulletListPattern, (match) => {
        const count = (match.match(/[-•*]\s*\[object Object\]/g) || []).length;
        return Array.from({length: count}, (_, i) => {
          const benefit = i < benefitsTexts.length ? benefitsTexts[i] : `Преимущество доступности ${i+1}`;
          return `- ${benefit}`;
        }).join("\n");
      });
    }
  }

  // 1. Замена для нумерованных/маркированных списков типа "1. [object Object]" или "- [object Object]"
  const listItemObjectPattern = /^(\s*[\d]+\.\s*|\s*[-•*]\s*)(\[object Object\])/gmi;
  if (listItemObjectPattern.test(processedText)) {
    console.log('[MessageBubble] processObjectStrings - Нашел элемент списка с [object Object]');
    processedText = processedText.replace(listItemObjectPattern, '$1(пункт списка)');
  }

  // 2. Если вся строка (после trim) это "[object Object]"
  if (processedText.trim() === '[object Object]') {
    console.log('[MessageBubble] processObjectStrings - Matched: Full string [object Object]');
    processedText = '(содержимое объекта)'; // Более нейтральная замена
  }

  // 3. Обработка специфического паттерна, связанного с preliminaryAnalysis
  const dataCompletenessPattern = /\[object Object\]\s*\(на основе (\d+)% имеющихся данных\)/g;
  if (processedText.match(dataCompletenessPattern)) {
    console.log('[MessageBubble] processObjectStrings - Matched: dataCompletenessPattern');
    processedText = processedText.replace(dataCompletenessPattern, (_, percent) => {
      return `(Информация о полноте данных (${percent}%) была представлена ранее).`;
    });
  }

  // 4. Проверяем наличие текста вида "Предварительный анализ: [object Object]" 
  const preliminaryAnalysisPattern = /(предварительн[а-я]+\s+анализ[а-я]*)\s*[:]\s*\[object Object\]/gi;
  if (preliminaryAnalysisPattern.test(processedText)) {
    console.log('[MessageBubble] processObjectStrings - Matched: preliminaryAnalysisPattern');
    processedText = processedText.replace(preliminaryAnalysisPattern, 
      '$1 был отображен отдельно');
  }

  // 5. Общая замена всех оставшихся вхождений "[object Object]" (регистронезависимо)
  if (processedText.includes('[object Object]') || processedText.toLowerCase().includes('[object object]')) {
    console.log('[MessageBubble] processObjectStrings - Matched: Includes [object Object]');
    processedText = processedText.replace(/\[object Object\]/gi, '(информация)');
  }
  
  // 6. Обработка HTML-разметки, содержащей [object Object]
  const htmlTagsWithObjectPattern = /<([a-z][a-z0-9]*)[^>]*>\s*\[object Object\]\s*<\/\1>/gi;
  if (htmlTagsWithObjectPattern.test(processedText)) {
    console.log('[MessageBubble] processObjectStrings - Matched: HTML tags with [object Object]');
    processedText = processedText.replace(htmlTagsWithObjectPattern, (match, tag) => {
      return `<${tag}>(информация в формате ${tag})</${tag}>`;
    });
  }
  
  if (processedText !== text) {
    console.log('[MessageBubble] processObjectStrings - OUTPUT изменился:', 
      JSON.stringify(processedText.substring(0, 200)));
  }
  return processedText;
};

/**
 * Компонент для отображения сообщения в чате
 * Обрабатывает как обычные сообщения, так и множественные ответы
 */
const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ 
  message, 
  onCopy, 
  formatTime, 
  getRelevanceColor,
  onSelectSuggestion 
}) => {
  const [showCopyPhrase, setShowCopyPhrase] = useState(false);
  const [copyPhrase, setCopyPhrase] = useState('');
  const [copied, setCopied] = useState(false);
  const { role } = message;
  const isUser = role === 'user';
  const showPerformance = !isUser && message.performance && formatTime;

  // Функция для получения случайной фразы из массива
  const getRandomPhrase = () => {
    return copyPhrases[Math.floor(Math.random() * copyPhrases.length)];
  };
  
  // Обработчик нажатия на кнопку копирования
  const handleCopy = useCallback((textToProcess?: string) => {
    const textToCopy = textToProcess || (typeof message.content === 'string' ? message.content : JSON.stringify(message.content));
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onCopy) onCopy(textToCopy);
    });
  }, [message.content, isUser, onCopy]);

  // Стили для элементов сообщения
  const styles = {
    userBubble: {
      backgroundColor: '#3b82f6',
      color: 'white',
      borderBottomRightRadius: '0.25rem',
      maxWidth: '75%',
      padding: '0.75rem 1rem',
      borderRadius: '1rem',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    } as CSSProperties,
    botBubble: {
      backgroundColor: '#333',
      color: 'white',
      borderBottomLeftRadius: '0.25rem',
      border: '1px solid #444',
      maxWidth: '75%',
      padding: '0.75rem 1rem',
      borderRadius: '1rem',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    } as CSSProperties,
    multiHeader: {
      fontSize: '1rem',
      fontWeight: 'bold',
      marginBottom: '0.75rem',
      color: '#60a5fa'
    } as CSSProperties,
    questionTitle: {
      fontWeight: 'bold',
      marginBottom: '0.5rem',
      color: '#93c5fd'
    } as CSSProperties,
    answerContainer: {
      marginBottom: '1.5rem',
      borderBottom: '1px solid #444',
      paddingBottom: '1rem'
    } as CSSProperties,
    lastAnswerContainer: {
      marginBottom: '1.5rem',
      paddingBottom: '1rem'
    } as CSSProperties,
    performanceStats: {
      fontSize: '0.65rem',
      color: '#9ca3af',
      marginTop: '0.5rem',
      fontFamily: 'monospace',
      borderTop: '1px solid #444',
      paddingTop: '0.5rem'
    } as CSSProperties,
    suggestedHeader: {
      fontWeight: 600,
      marginBottom: '0.5rem'
    } as CSSProperties,
    suggestedQuestion: {
      display: 'inline-block',
      backgroundColor: '#2d3748',
      color: '#a5b4fc',
      borderRadius: '0.5rem',
      padding: '0.35rem 0.75rem',
      marginRight: '0.5rem',
      marginBottom: '0.5rem',
      fontSize: '0.75rem',
      cursor: 'pointer',
      border: '1px solid #4b5563'
    } as CSSProperties,
    copyButton: {
      position: 'absolute',
      right: '1rem',
      bottom: '1rem',
      top: 'auto',
      color: '#a78bfa',
      background: 'none',
      fontSize: '1.5rem',
      boxShadow: 'none',
      padding: 0,
      border: 'none',
      cursor: 'pointer'
    } as CSSProperties,
    copyPhraseContainer: {
      position: 'absolute',
      right: '3rem',
      bottom: '1rem',
      background: '#202225',
      color: '#a78bfa',
      padding: '0.5rem 0.75rem',
      borderRadius: '0.5rem',
      fontSize: '0.8rem',
      maxWidth: '300px',
      border: '1px solid #444',
      boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
      zIndex: 10,
      animation: 'fadeIn 0.3s ease-in-out'
    } as CSSProperties
  };

  // Функция для рендеринга обычного (одиночного) ответа
  const renderSingleMessage = () => {
    let mainContent = message.content; // Исходный контент

    if (isUser) {
      // Для пользователя просто отображаем его контент
      mainContent = formatMessageText(mainContent as string);
    } else {
      // Для бота сначала обработаем preliminaryAnalysis, если он есть
      // mainContent будет отформатирован ниже, если он не пустой
      if (typeof mainContent === 'string') {
         mainContent = formatMessageText(mainContent);
         mainContent = processObjectStrings(mainContent);
      } else if (mainContent === null || mainContent === undefined) {
        mainContent = ''; // Если контента нет, делаем его пустой строкой
      } else {
        // Если content не строка (маловероятно для основного ответа, но для полноты)
        mainContent = JSON.stringify(mainContent, null, 2);
      }
    }

    // Проверяем, нужно ли отображать основной текст после блока PreliminaryAnalysis
    let showMainContentAfterAnalysis = true;
    if (message.preliminaryAnalysis && typeof message.content === 'string') {
      // Простое условие: если основной контент почти такой же, как часть preliminaryAnalysis.summary, не показываем его
      const paSummary = message.preliminaryAnalysis.summary || '';
      if (message.content.includes(paSummary.substring(0, Math.min(paSummary.length, 50)))) {
          if (message.content.length < paSummary.length + 100) { // Если основной контент ненамного длиннее саммари
            showMainContentAfterAnalysis = false;
          }
      }
       // Если основной контент это просто повторение запроса на уточнение, который уже есть в preliminaryAnalysis
      if (message.preliminaryAnalysis.humanReadableMissingData && 
          message.preliminaryAnalysis.humanReadableMissingData.some(missing => message.content.includes(missing))) {
        if (message.content.toLowerCase().includes('пожалуйста, уточните') || message.content.toLowerCase().includes('для предоставления точного ответа мне нужна дополнительная информация')) {
            showMainContentAfterAnalysis = false;
        }
      }
    }
    if (mainContent === 'Данные анализа были обработаны.' || mainContent === 'Предварительный анализ (на основе 100% данных) был показан выше.') {
        showMainContentAfterAnalysis = false;
    }
    
    return (
      <>
        {!isUser && message.preliminaryAnalysis && (
          <PreliminaryAnalysisDisplay analysisData={message.preliminaryAnalysis} />
        )}
        
        {/* Отображаем основной контент, если он есть и не является дубликатом preliminaryAnalysis */}
        {(mainContent && showMainContentAfterAnalysis && mainContent.trim() !== '') && (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
                <a
                  {...props}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'underline', color: '#93c5fd' }}
                />
              ),
              p: ({ children }) => <p><SourceHighlighter>{children}</SourceHighlighter></p>,
              li: ({ children }) => <li><SourceHighlighter>{children}</SourceHighlighter></li>,
              h1: ({ children }) => <h1><SourceHighlighter>{children}</SourceHighlighter></h1>,
              h2: ({ children }) => <h2><SourceHighlighter>{children}</SourceHighlighter></h2>,
              h3: ({ children }) => <h3><SourceHighlighter>{children}</SourceHighlighter></h3>,
              h4: ({ children }) => <h4><SourceHighlighter>{children}</SourceHighlighter></h4>,
              h5: ({ children }) => <h5><SourceHighlighter>{children}</SourceHighlighter></h5>,
              h6: ({ children }) => <h6><SourceHighlighter>{children}</SourceHighlighter></h6>,
              blockquote: ({ children }) => <blockquote><SourceHighlighter>{children}</SourceHighlighter></blockquote>,
              strong: ({ children }) => <strong><SourceHighlighter>{children}</SourceHighlighter></strong>,
            }}
          >
            {typeof mainContent === 'string' ? mainContent : JSON.stringify(mainContent, null, 2)}
          </ReactMarkdown>
        )}

        {/* ... (остальная часть renderSingleMessage: источники, производительность, suggestions, кнопка копирования) ... */}
        {message.sources && message.sources.length > 0 && (
          <SourcesList sources={message.sources} />
        )}
        {message.performance && formatTime && (
          <div style={styles.performanceStats}>
            Время: эмб: {formatTime(message.performance.embedding_ms)} | 
            поиск: {formatTime(message.performance.search_ms)} | 
            ответ: {formatTime(message.performance.generate_ms)} | 
            всего: {formatTime(message.performance.total_ms)}
          </div>
        )}
        {((message.clarificationQuestions ?? []).length > 0 || (message.infoTemplates ?? []).length > 0) && (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={styles.suggestedHeader}>
              {message.suggestions_header || 'Уточните для меня:'}
            </div>
            {(message.clarificationQuestions ?? []).length > 0 && (
              <div style={{ marginBottom: (message.infoTemplates ?? []).length > 0 ? '0.5rem' : 0 }}>
                {(message.clarificationQuestions ?? []).map((q, idx) => (
                  <div
                    key={idx}
                    style={styles.suggestedQuestion}
                    onMouseOver={e => { const target = e.currentTarget; target.style.backgroundColor = '#374151'; }}
                    onMouseOut={e => { const target = e.currentTarget; target.style.backgroundColor = '#2d3748'; }}
                    onClick={() => onSelectSuggestion(q)}
                  >
                    {q}
                  </div>
                ))}
              </div>
            )}
            {(message.infoTemplates ?? []).length > 0 && (
              <div style={{ opacity: 0.85 }}>
                {(message.infoTemplates ?? []).map((tpl, idx) => (
                  <div
                    key={idx}
                    style={{ ...styles.suggestedQuestion, backgroundColor: '#23272A', color: '#cbd5e1', borderStyle: 'dashed' }}
                    onMouseOver={e => { const target = e.currentTarget; target.style.backgroundColor = '#2d3748'; }}
                    onMouseOut={e => { const target = e.currentTarget; target.style.backgroundColor = '#23272A'; }}
                    onClick={() => onSelectSuggestion(tpl)}
                  >
                    ✏️ {tpl}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {message.suggestions && message.suggestions.length > 0 && (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={styles.suggestedHeader}>Попробуйте спросить:</div>
            <div>
              {message.suggestions.map((q, idx) => (
                <div 
                  key={idx} 
                  style={styles.suggestedQuestion}
                  onMouseOver={e => { const target = e.currentTarget; target.style.backgroundColor = '#374151'; }}
                  onMouseOut={e => { const target = e.currentTarget; target.style.backgroundColor = '#2d3748'; }}
                  onClick={() => onSelectSuggestion(q)}
                >
                  {q}
                </div>
              ))}
            </div>
          </div>
        )}
        {message.role === MessageType.BOT && message.content && message.content !== 'Ошибка запроса к серверу.' && (
          <>
            {showCopyPhrase && (
              <div style={styles.copyPhraseContainer}>
                {copyPhrase}
              </div>
            )}
            <button
              style={styles.copyButton}
              onClick={() => handleCopy(message.content as string)}
              title="Copy answer"
            >
              ⧉
            </button>
          </>
        )}
      </>
    );
  };
  
  // Функция для рендеринга множественных ответов
  const renderMultiMessage = () => {
    if (!message.answers || !message.isMulti) return null;
    
    return (
      <div style={{ width: '100%' }}>
        <h3 style={styles.multiHeader}>
          Ответы на множественные вопросы ({message.answers.length})
        </h3>
        
        {message.answers.map((item, idx) => (
          <div 
            key={idx} 
            style={idx < message.answers!.length - 1 ? styles.answerContainer : styles.lastAnswerContainer}
          >
            <div style={styles.questionTitle}>
              Вопрос {idx+1}: {item.question}
            </div>
            
            <div style={{ marginBottom: '0.5rem' }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'underline', color: '#93c5fd' }}
                    />
                  ),
                  p: ({ children }) => <p><SourceHighlighter>{children}</SourceHighlighter></p>,
                  li: ({ children }) => <li><SourceHighlighter>{children}</SourceHighlighter></li>,
                  h1: ({ children }) => <h1><SourceHighlighter>{children}</SourceHighlighter></h1>,
                  h2: ({ children }) => <h2><SourceHighlighter>{children}</SourceHighlighter></h2>,
                  h3: ({ children }) => <h3><SourceHighlighter>{children}</SourceHighlighter></h3>,
                  h4: ({ children }) => <h4><SourceHighlighter>{children}</SourceHighlighter></h4>,
                  h5: ({ children }) => <h5><SourceHighlighter>{children}</SourceHighlighter></h5>,
                  h6: ({ children }) => <h6><SourceHighlighter>{children}</SourceHighlighter></h6>,
                  blockquote: ({ children }) => <blockquote><SourceHighlighter>{children}</SourceHighlighter></blockquote>,
                  strong: ({ children }) => <strong><SourceHighlighter>{children}</SourceHighlighter></strong>,
                }}
              >
                {item.answer}
              </ReactMarkdown>
            </div>
            
            {item.sources && item.sources.length > 0 && (
              <SourcesList sources={item.sources} />
            )}
          </div>
        ))}
        
        {message.performance && formatTime && (
          <div style={styles.performanceStats}>
            Общее время: эмб: {formatTime(message.performance.embedding_ms)} | 
            поиск: {formatTime(message.performance.search_ms)} | 
            ответ: {formatTime(message.performance.generate_ms)} | 
            всего: {formatTime(message.performance.total_ms)}
          </div>
        )}
        
        {/* ДОБАВЛЯЕМ ОТОБРАЖЕНИЕ ПОДСКАЗОК ДЛЯ МНОЖЕСТВЕННЫХ ОТВЕТОВ */}
        {((message.clarificationQuestions ?? []).length > 0 || (message.infoTemplates ?? []).length > 0) && (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={styles.suggestedHeader}>
              {message.suggestions_header || 'Попробуйте спросить:'}
            </div>
            {(message.clarificationQuestions ?? []).length > 0 && (
              <div style={{ marginBottom: (message.infoTemplates ?? []).length > 0 ? '0.5rem' : 0 }}>
                {(message.clarificationQuestions ?? []).map((q, idx) => (
                  <div
                    key={idx}
                    style={styles.suggestedQuestion}
                    onMouseOver={e => { const target = e.currentTarget; target.style.backgroundColor = '#374151'; }}
                    onMouseOut={e => { const target = e.currentTarget; target.style.backgroundColor = '#2d3748'; }}
                    onClick={() => onSelectSuggestion(q)}
                  >
                    {q}
                  </div>
                ))}
              </div>
            )}
            {(message.infoTemplates ?? []).length > 0 && (
              <div style={{ opacity: 0.85 }}>
                {(message.infoTemplates ?? []).map((tpl, idx) => (
                  <div
                    key={idx}
                    style={{ ...styles.suggestedQuestion, backgroundColor: '#23272A', color: '#cbd5e1', borderStyle: 'dashed' }}
                    onMouseOver={e => { const target = e.currentTarget; target.style.backgroundColor = '#2d3748'; }}
                    onMouseOut={e => { const target = e.currentTarget; target.style.backgroundColor = '#23272A'; }}
                    onClick={() => onSelectSuggestion(tpl)}
                  >
                    ✏️ {tpl}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {showCopyPhrase && (
          <div style={styles.copyPhraseContainer}>
            {copyPhrase}
          </div>
        )}
        <button
          style={styles.copyButton}
          onClick={() => handleCopy(message.answers?.map(a => 
            `Вопрос: ${a.question}\nОтвет: ${a.answer}`
          ).join('\n\n') || '')}
          title="Copy all answers"
        >
          ⧉
        </button>
      </div>
    );
  };

  // Добавляем стили для анимации
  const animationStyle = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  
  // Основной рендеринг компонента
  return (
    <div 
      style={{ 
        position: 'relative',
        ...(message.role === 'user' ? styles.userBubble : styles.botBubble) 
      } as CSSProperties}
    >
      <style>{animationStyle}</style>
      {message.isMulti && message.answers 
        ? renderMultiMessage() 
        : renderSingleMessage()
      }
    </div>
  );
});

export default MessageBubble; 