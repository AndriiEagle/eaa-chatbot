import React from 'react';
import ReactMarkdown, { Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { PreliminaryAnalysis } from '../types/index';
import SourceHighlighter from './SourceHighlighter'; // Assuming it's needed for consistency

interface PreliminaryAnalysisDisplayProps {
  analysisData: PreliminaryAnalysis;
  // Can add prop for passing onSelectSuggestion function if interactivity is needed
  // onSelectSuggestion: (suggestion: string) => void;
}

const PreliminaryAnalysisDisplay: React.FC<PreliminaryAnalysisDisplayProps> = ({ analysisData }) => {
  const formatAnalysisToString = (pa: PreliminaryAnalysis): string => {
    let formattedText = `##### 🔍 Preliminary Analysis\n`; // Using Markdown for title
    if (pa.completeness !== undefined) {
      formattedText += `*(based on ${Math.round(pa.completeness * 100)}% of available data)*\n\n`;
    }

    if (pa.businessType) formattedText += `- **Business Type**: ${pa.businessType}\n`;
    if (pa.businessSize) formattedText += `- **Company Size**: ${pa.businessSize}\n`;
    if (pa.summary && pa.summary.trim() !== '') formattedText += `\n${pa.summary.trim()}\n`;

    if (pa.humanReadableMissingData && pa.humanReadableMissingData.length > 0) {
      formattedText += `\n**For a more accurate answer, please clarify**:\n`;
      pa.humanReadableMissingData.forEach(item => {
        formattedText += `- ${item}\n`;
      });
    }

    // Leave specific questions for main suggestions block if they're used there
    // Or can add them here if they should be part of this block
    /*
    if (pa.specificQuestions && pa.specificQuestions.length > 0) {
      formattedText += `\n**Clarifying Questions**:\n`;
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
      backgroundColor: '#2E2E2E', // Slightly different background for highlighting
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

  // Define components for ReactMarkdown for readability
  const markdownComponents: Components = {
    p: ({ children }: { children?: React.ReactNode }) => <p style={{ margin: '0 0 8px 0' }}><SourceHighlighter>{children}</SourceHighlighter></p>,
    li: ({ children }: { children?: React.ReactNode }) => <li style={{ marginLeft: '20px' }}><SourceHighlighter>{children}</SourceHighlighter></li>,
    h5: ({ children }: { children?: React.ReactNode }) => <h5 style={{ marginTop: '0', marginBottom: '8px' }}><SourceHighlighter>{children}</SourceHighlighter></h5>,
    strong: ({ children }: { children?: React.ReactNode }) => <strong><SourceHighlighter>{children}</SourceHighlighter></strong>,
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