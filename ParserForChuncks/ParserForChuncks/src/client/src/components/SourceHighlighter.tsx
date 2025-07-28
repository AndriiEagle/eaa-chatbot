import React from 'react';
import { SourceHighlighterProps } from '../types';

/**
 * Component for highlighting source links in text
 * Finds and highlights source mentions in various formats
 */
const SourceHighlighter: React.FC<SourceHighlighterProps> = ({ children }) => {
  // For correct string extraction, even if React elements are contained inside,
  // recursively traverse children and collect only text nodes
  const extractText = (child: React.ReactNode): string => {
    if (typeof child === 'string' || typeof child === 'number') {
      return child.toString();
    }
    if (Array.isArray(child)) {
      return child.map(extractText).join('');
    }
    if (React.isValidElement(child)) {
      const element = child as React.ReactElement<{
        children?: React.ReactNode;
      }>;
      if (element.props && element.props.children) {
        return extractText(element.props.children);
      }
    }
    // For other types (boolean, null, undefined, React.Fragment without children) return empty string
    return '';
  };

  const text = React.Children.toArray(children).map(extractText).join('');

  // Log for debugging first N characters of text (if it's a string longer than 10 characters)
  if (
    typeof text === 'string' &&
    text.length > 10 &&
    (text.includes('Source') || text.includes('Источник'))
  ) {
    console.log(
      `[SourceHighlighter] Processing text with sources: ${text.substring(0, 100)}...`
    );
  }

  // Extended regex for finding sources in different formats:
  // - (Source n) or (Источник n)
  // - (Source n, m, k) or (Источник n, m, k) - for multiple references
  // - [Источник n] or [Source n] - alternative format
  const sourceRegex =
    /(\((?:Source|Источник)\s*\d+(?:,\s*\d+)*\)|\[(?:Source|Источник)\s*\d+(?:,\s*\d+)*\])/g;

  // Split text into parts by regex and process each part
  return (
    <>
      {text.split(sourceRegex).map((part, idx) => {
        // Check if part is a source reference
        if (
          /^\((?:Source|Источник)\s*\d+(?:,\s*\d+)*\)$|^\[(?:Source|Источник)\s*\d+(?:,\s*\d+)*\]$/.test(
            part
          )
        ) {
          console.log(`[SourceHighlighter] Found source reference: ${part}`);

          // Highlight source reference with special style
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
        // Return regular text without changes
        return part;
      })}
    </>
  );
};

export default SourceHighlighter;
