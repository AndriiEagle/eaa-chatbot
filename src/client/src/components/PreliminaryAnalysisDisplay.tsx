import React from 'react';
import ReactMarkdown, { Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PreliminaryAnalysis } from '../types/index';
import SourceHighlighter from './SourceHighlighter'; // Предполагаем, что он нужен для консистентности

interface PreliminaryAnalysisDisplayProps {
  analysisData: PreliminaryAnalysis;
  // Можно добавить пропс для передачи функции onSelectSuggestion, если нужна интерактивность
  // onSelectSuggestion: (suggestion: string) => void;
}

const PreliminaryAnalysisDisplay: React.FC<PreliminaryAnalysisDisplayProps> = ({ analysisData }) => {
  const formatAnalysisToString = (pa: PreliminaryAnalysis): string => {
    let formattedText = `##### 🔍 Предварительный анализ\n`; // Используем Markdown для заголовка
    if (pa.completeness !== undefined) {
      formattedText += `*(на основе ${Math.round(pa.completeness * 100)}% имеющихся данных)*\n\n`;
    }

    if (pa.businessType) formattedText += `- **Тип бизнеса**: ${pa.businessType}\n`;
    if (pa.businessSize) formattedText += `- **Размер компании**: ${pa.businessSize}\n`;
    if (pa.summary && pa.summary.trim() !== '') formattedText += `\n${pa.summary.trim()}\n`;

    if (pa.humanReadableMissingData && pa.humanReadableMissingData.length > 0) {
      formattedText += `\n**Для более точного ответа, пожалуйста, уточните**:\n`;
      pa.humanReadableMissingData.forEach(item => {
        formattedText += `- ${item}\n`;
      });
    }

    // Оставим специфические вопросы для основного блока suggestions, если они там используются
    // Либо можно добавить их сюда, если они должны быть частью этого блока
    /*
    if (pa.specificQuestions && pa.specificQuestions.length > 0) {
      formattedText += `\n**Уточняющие вопросы**:\n`;
      pa.specificQuestions.forEach((question, index) => {
        formattedText += `${index + 1}. ${question}\n`;
      });
    }
    */
    return formattedText;
  };

  const analysisString = formatAnalysisToString(analysisData);
  const percent = analysisData?.completeness !== undefined ? Math.round(analysisData.completeness * 100) : null;

  const styles = {
    container: {
      backgroundColor: '#2E2E2E', // Немного другой фон для выделения
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '10px',
      border: '1px solid #444',
    },
    progressOuter: {
      width: '100%',
      height: '8px',
      backgroundColor: '#444',
      borderRadius: '4px',
      margin: '8px 0 12px',
      overflow: 'hidden' as const,
    },
    progressInner: {
      height: '100%',
      backgroundColor: '#4caf50',
      transition: 'width 0.4s ease',
    },
    markdownContainer: {
      color: '#E0E0E0',
    },
  };

  // Определение компонентов для ReactMarkdown вынесем для читаемости
  const markdownComponents: Options['components'] = {
    p: ({ children }) => <p style={{ margin: '0 0 8px 0' }}><SourceHighlighter>{children}</SourceHighlighter></p>,
    li: ({ children }) => <li style={{ marginLeft: '20px' }}><SourceHighlighter>{children}</SourceHighlighter></li>,
    h5: ({ children }) => <h5 style={{ marginTop: '0', marginBottom: '8px' }}><SourceHighlighter>{children}</SourceHighlighter></h5>,
    strong: ({ children }) => <strong><SourceHighlighter>{children}</SourceHighlighter></strong>,
  };

  return (
    <div style={styles.container}>
      {percent !== null && (
        <div style={styles.progressOuter}>
          <div style={{ ...styles.progressInner, width: `${percent}%` }} />
        </div>
      )}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {analysisString}
      </ReactMarkdown>
    </div>
  );
};

export default PreliminaryAnalysisDisplay; 