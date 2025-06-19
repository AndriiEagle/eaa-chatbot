import React from 'react';
import { SourceHighlighterProps } from '../types';

/**
 * Компонент для выделения ссылок на источники в тексте
 * Ищет и выделяет упоминания источников в различных форматах
 */
const SourceHighlighter: React.FC<SourceHighlighterProps> = ({ children }) => {
  // Для корректного извлечения строк, даже если внутри содержатся React-элементы,
  // рекурсивно обходим потомков и собираем только текстовые узлы
  const extractText = (child: React.ReactNode): string => {
    if (typeof child === 'string' || typeof child === 'number') {
      return child.toString();
    }
    if (Array.isArray(child)) {
      return child.map(extractText).join('');
    }
    if (React.isValidElement(child)) {
      const element = child as React.ReactElement<{ children?: React.ReactNode }>;
      if (element.props && element.props.children) {
        return extractText(element.props.children);
      }
    }
    // Для прочих типов (boolean, null, undefined, React.Fragment без детей) возвращаем пустую строку
    return '';
  };

  const text = React.Children.toArray(children).map(extractText).join('');
  
  // Логируем для отладки первые N символов текста (если это строка длиннее 10 символов)
  if (typeof text === 'string' && text.length > 10 && text.includes('Источник')) {
    console.log(`[SourceHighlighter] Обрабатываю текст с источниками: ${text.substring(0, 100)}...`);
  }
  
  // Расширенное регулярное выражение для поиска источников в разных форматах:
  // - (Source n) или (Источник n)
  // - (Source n, m, k) или (Источник n, m, k) - для множественных ссылок
  // - [Источник n] или [Source n] - альтернативный формат
  const sourceRegex = /(\((?:Source|Источник)\s*\d+(?:,\s*\d+)*\)|\[(?:Source|Источник)\s*\d+(?:,\s*\d+)*\])/g;
  
  // Делим текст на части по регулярному выражению и обрабатываем каждую часть
  return (
    <>
      {text.split(sourceRegex).map((part, idx) => {
        // Проверяем, является ли часть ссылкой на источник
        if (/^\((?:Source|Источник)\s*\d+(?:,\s*\d+)*\)$|^\[(?:Source|Источник)\s*\d+(?:,\s*\d+)*\]$/.test(part)) {
          console.log(`[SourceHighlighter] Найдена ссылка на источник: ${part}`);
          
          // Выделяем ссылку на источник специальным стилем
          return (
            <span
              key={idx}
              style={{ 
                color: '#a78bfa', 
                fontWeight: 'bold', 
                textDecoration: 'underline', 
                cursor: 'pointer',
                backgroundColor: 'rgba(109, 40, 217, 0.1)',
                borderRadius: '3px',
                padding: '0 4px',
              }}
              title="Click to see detailed information about the source"
            >
              {part}
            </span>
          );
        }
        // Возвращаем обычный текст без изменений
        return part;
      })}
    </>
  );
};

export default SourceHighlighter; 