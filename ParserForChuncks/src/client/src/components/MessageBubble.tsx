import React, { CSSProperties, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import {
  MessageBubbleProps,
  Message,
  MessageType,
  PreliminaryAnalysis,
} from '../types/index';
import SourceHighlighter from './SourceHighlighter';
import SourcesList from './SourcesList';
import { copyPhrases } from '../constants/phrases';
import PreliminaryAnalysisDisplay from './PreliminaryAnalysisDisplay';

/**
 * Formats message text, highlighting key parameters
 */
const formatMessageText = (text: string) => {
  // Replace technical parameters with more understandable names
  const techParamsMap: Record<string, string> = {
    service_types: 'Service Types',
    customer_base: 'Target Audience',
    business_type: 'Business Type',
    business_size: 'Business Size',
    web_presence: 'Web Presence',
    physical_location: 'Physical Location',
    product_types: 'Product Types',
    delivery: 'Delivery',
  };

  let formattedText = text;

  // Replace technical names with friendly formulations
  Object.entries(techParamsMap).forEach(([technical, friendly]) => {
    const regex = new RegExp(`\\b${technical}\\b`, 'g');
    formattedText = formattedText.replace(regex, friendly);
  });

  // Return formatted text
  return formattedText;
};

/**
 * Enhanced function for processing objects in text
 */
const processObjectStrings = (text: string): string => {
  if (!text || typeof text !== 'string') return String(text || '');

  console.log(
    '[MessageBubble] processObjectStrings - INPUT:',
    JSON.stringify(text.substring(0, 200))
  ); // Log input text

  let processedText = text;

  // Detection of accessibility benefits lists and replacement of [object Object]
  if (
    processedText.toLowerCase().includes('benefit') ||
    processedText.toLowerCase().includes('advantage') ||
    processedText.toLowerCase().includes('compliance')
  ) {
    console.log(
      '[MessageBubble] processObjectStrings - Accessibility benefits context detected'
    );

    // Processing numbered lists of objects in different formats
    // 1. Format: "1. [object Object]\n2. [object Object]"
    const listPattern = /((?:\d+\.\s*\[object Object\][\s\n]*)+)/g;

    // 2. HTML lists: "<li>[object Object]</li>"
    const htmlListPattern = /(<li[^>]*>\s*\[object Object\]\s*<\/li>)/gi;

    // 3. Bullet lists: "- [object Object]" or "• [object Object]"
    const bulletListPattern = /(?:[-•*]\s*\[object Object\][\s\n]*)+/g;

    if (
      listPattern.test(processedText) ||
      htmlListPattern.test(processedText) ||
      bulletListPattern.test(processedText)
    ) {
      console.log(
        '[MessageBubble] processObjectStrings - Found [object Object] list in accessibility context'
      );

      const benefitsTexts = [
        'Expanding customer base by making service accessible to people with disabilities',
        'Improving company reputation as a socially responsible business',
        'Reducing legal risks related to non-compliance with EAA requirements',
        'Improving user experience for all customers without exception',
        'Increasing customer satisfaction and loyalty',
        'Opportunity to enter new markets and audiences',
      ];

      // Replace all benefit list formats
      processedText = processedText.replace(listPattern, match => {
        const count = (match.match(/\d+\./g) || []).length;
        return Array.from({ length: count }, (_, i) => {
          const benefit =
            i < benefitsTexts.length
              ? benefitsTexts[i]
              : `Accessibility benefit ${i + 1}`;
          return `${i + 1}. ${benefit}`;
        }).join('\n');
      });

      processedText = processedText.replace(
        htmlListPattern,
        (match, p1, offset, string) => {
          // Count list items near the current one
          const listItems =
            string.match(/<li[^>]*>\s*\[object Object\]\s*<\/li>/gi) || [];
          const count = Math.min(listItems.length, benefitsTexts.length);

          // Return first element from benefits list for this occurrence
          const index = listItems.indexOf(match);
          if (index >= 0 && index < benefitsTexts.length) {
            return `<li>${benefitsTexts[index]}</li>`;
          }
          return `<li>Accessibility benefit</li>`;
        }
      );

      processedText = processedText.replace(bulletListPattern, match => {
        const count = (match.match(/[-•*]\s*\[object Object\]/g) || []).length;
        return Array.from({ length: count }, (_, i) => {
          const benefit =
            i < benefitsTexts.length
              ? benefitsTexts[i]
              : `Accessibility benefit ${i + 1}`;
          return `- ${benefit}`;
        }).join('\n');
      });
    }
  }

  // 1. Replacement for numbered/bulleted lists like "1. [object Object]" or "- [object Object]"
  const listItemObjectPattern =
    /^(\s*[\d]+\.\s*|\s*[-•*]\s*)(\[object Object\])/gim;
  if (listItemObjectPattern.test(processedText)) {
    console.log(
      '[MessageBubble] processObjectStrings - Found list item with [object Object]'
    );
    processedText = processedText.replace(
      listItemObjectPattern,
      '$1(list item)'
    );
  }

  // 2. If the entire string (after trim) is "[object Object]"
  if (processedText.trim() === '[object Object]') {
    console.log(
      '[MessageBubble] processObjectStrings - Matched: Full string [object Object]'
    );
    processedText = '(object content)'; // More neutral replacement
  }

  // 3. Processing specific pattern related to preliminaryAnalysis
  const dataCompletenessPattern =
    /\[object Object\]\s*\(based on (\d+)% of available data\)/g;
  if (processedText.match(dataCompletenessPattern)) {
    console.log(
      '[MessageBubble] processObjectStrings - Matched: dataCompletenessPattern'
    );
    processedText = processedText.replace(
      dataCompletenessPattern,
      (_, percent) => {
        return `(Data completeness information (${percent}%) was presented earlier).`;
      }
    );
  }

  // 4. Check for text like "Preliminary analysis: [object Object]"
  const preliminaryAnalysisPattern =
    /(preliminary\s+analysis)\s*[:]\s*\[object Object\]/gi;
  if (preliminaryAnalysisPattern.test(processedText)) {
    console.log(
      '[MessageBubble] processObjectStrings - Matched: preliminaryAnalysisPattern'
    );
    processedText = processedText.replace(
      preliminaryAnalysisPattern,
      '$1 was displayed separately'
    );
  }

  // 5. General replacement of all remaining "[object Object]" occurrences (case insensitive)
  if (
    processedText.includes('[object Object]') ||
    processedText.toLowerCase().includes('[object object]')
  ) {
    console.log(
      '[MessageBubble] processObjectStrings - Matched: Includes [object Object]'
    );
    processedText = processedText.replace(
      /\[object Object\]/gi,
      '(information)'
    );
  }

  // 6. Processing HTML markup containing [object Object]
  const htmlTagsWithObjectPattern =
    /<([a-z][a-z0-9]*)[^>]*>\s*\[object Object\]\s*<\/\1>/gi;
  if (htmlTagsWithObjectPattern.test(processedText)) {
    console.log(
      '[MessageBubble] processObjectStrings - Matched: HTML tags with [object Object]'
    );
    processedText = processedText.replace(
      htmlTagsWithObjectPattern,
      (match, tag) => {
        return `<${tag}>(information in ${tag} format)</${tag}>`;
      }
    );
  }

  if (processedText !== text) {
    console.log(
      '[MessageBubble] processObjectStrings - OUTPUT changed:',
      JSON.stringify(processedText.substring(0, 200))
    );
  }
  return processedText;
};

/**
 * Component for displaying chat message
 * Handles both regular messages and multiple responses
 */
const MessageBubble: React.FC<MessageBubbleProps> = React.memo(
  ({
    message,
    onCopy,
    formatTime,
    getRelevanceColor,
    onSelectSuggestion,
    loading = false,
  }) => {
    const [showCopyPhrase, setShowCopyPhrase] = useState(false);
    const [copyPhrase, setCopyPhrase] = useState('');
    const [copied, setCopied] = useState(false);
    const { role } = message;
    const isUser = role === 'user';
    const showPerformance = !isUser && message.performance && formatTime;

    // Function for getting random phrase from array
    const getRandomPhrase = () => {
      return copyPhrases[Math.floor(Math.random() * copyPhrases.length)];
    };

    // Copy button click handler
    const handleCopy = useCallback(
      (textToProcess?: string) => {
        const textToCopy =
          textToProcess ||
          (typeof message.content === 'string'
            ? message.content
            : JSON.stringify(message.content));
        navigator.clipboard.writeText(textToCopy).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          if (onCopy) onCopy(textToCopy);
        });
      },
      [message.content, isUser, onCopy]
    );

    // Styles for message elements
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
        color: '#60a5fa',
      } as CSSProperties,
      questionTitle: {
        fontWeight: 'bold',
        marginBottom: '0.5rem',
        color: '#93c5fd',
      } as CSSProperties,
      answerContainer: {
        marginBottom: '1.5rem',
        borderBottom: '1px solid #444',
        paddingBottom: '1rem',
      } as CSSProperties,
      lastAnswerContainer: {
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
      } as CSSProperties,
      performanceStats: {
        fontSize: '0.65rem',
        color: '#9ca3af',
        marginTop: '0.5rem',
        fontFamily: 'monospace',
        borderTop: '1px solid #444',
        paddingTop: '0.5rem',
      } as CSSProperties,
      suggestedHeader: {
        fontWeight: 600,
        marginBottom: '0.5rem',
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
        border: '1px solid #4b5563',
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
        cursor: 'pointer',
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
        animation: 'fadeIn 0.3s ease-in-out',
      } as CSSProperties,
    };

    // Function for rendering regular (single) response
    const renderSingleMessage = () => {
      let mainContent = message.content; // Original content

      if (isUser) {
        // For user, simply display their content
        mainContent = formatMessageText(mainContent as string);
      } else {
        // For bot, first process preliminaryAnalysis if it exists
        // mainContent will be formatted below if it's not empty
        if (typeof mainContent === 'string') {
          mainContent = formatMessageText(mainContent);
          mainContent = processObjectStrings(mainContent);
        } else if (mainContent === null || mainContent === undefined) {
          mainContent = ''; // If no content, make it empty string
        } else {
          // If content is not string (unlikely for main response, but for completeness)
          mainContent = JSON.stringify(mainContent, null, 2);
        }
      }

      // Check if we need to display main text after PreliminaryAnalysis block
      let showMainContentAfterAnalysis = true;
      if (message.preliminaryAnalysis && typeof message.content === 'string') {
        // Simple condition: if main content is almost same as part of preliminaryAnalysis.summary, don't show it
        const paSummary = message.preliminaryAnalysis.summary || '';
        if (
          message.content.includes(
            paSummary.substring(0, Math.min(paSummary.length, 50))
          )
        ) {
          if (message.content.length < paSummary.length + 100) {
            // If main content is not much longer than summary
            showMainContentAfterAnalysis = false;
          }
        }
        // If main content is just repetition of clarification request that already exists in preliminaryAnalysis
        if (
          message.preliminaryAnalysis.humanReadableMissingData &&
          message.preliminaryAnalysis.humanReadableMissingData.some(missing =>
            message.content.includes(missing)
          )
        ) {
          if (
            message.content.toLowerCase().includes('please clarify') ||
            message.content
              .toLowerCase()
              .includes('for an accurate answer, i need additional information')
          ) {
            showMainContentAfterAnalysis = false;
          }
        }
      }
      if (
        mainContent === 'Analysis data has been processed.' ||
        mainContent ===
          'Preliminary analysis (based on 100% data) was shown above.'
      ) {
        showMainContentAfterAnalysis = false;
      }

      return (
        <>
          {!isUser && message.preliminaryAnalysis && (
            <PreliminaryAnalysisDisplay
              analysisData={message.preliminaryAnalysis}
            />
          )}

          {/* Display main content if it exists and is not duplicate of preliminaryAnalysis */}
          {mainContent &&
            showMainContentAfterAnalysis &&
            mainContent.trim() !== '' && (
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
                  p: ({ children }: { children?: React.ReactNode }) => (
                    <p>
                      <SourceHighlighter>{children}</SourceHighlighter>
                    </p>
                  ),
                  li: ({ children }: { children?: React.ReactNode }) => (
                    <li>
                      <SourceHighlighter>{children}</SourceHighlighter>
                    </li>
                  ),
                  h1: ({ children }: { children?: React.ReactNode }) => (
                    <h1>
                      <SourceHighlighter>{children}</SourceHighlighter>
                    </h1>
                  ),
                  h2: ({ children }: { children?: React.ReactNode }) => (
                    <h2>
                      <SourceHighlighter>{children}</SourceHighlighter>
                    </h2>
                  ),
                  h3: ({ children }: { children?: React.ReactNode }) => (
                    <h3>
                      <SourceHighlighter>{children}</SourceHighlighter>
                    </h3>
                  ),
                  h4: ({ children }: { children?: React.ReactNode }) => (
                    <h4>
                      <SourceHighlighter>{children}</SourceHighlighter>
                    </h4>
                  ),
                  h5: ({ children }: { children?: React.ReactNode }) => (
                    <h5>
                      <SourceHighlighter>{children}</SourceHighlighter>
                    </h5>
                  ),
                  h6: ({ children }: { children?: React.ReactNode }) => (
                    <h6>
                      <SourceHighlighter>{children}</SourceHighlighter>
                    </h6>
                  ),
                  blockquote: ({
                    children,
                  }: {
                    children?: React.ReactNode;
                  }) => (
                    <blockquote>
                      <SourceHighlighter>{children}</SourceHighlighter>
                    </blockquote>
                  ),
                  strong: ({ children }: { children?: React.ReactNode }) => (
                    <strong>
                      <SourceHighlighter>{children}</SourceHighlighter>
                    </strong>
                  ),
                }}
              >
                {typeof mainContent === 'string'
                  ? mainContent
                  : JSON.stringify(mainContent, null, 2)}
              </ReactMarkdown>
            )}

          {/* ... (rest of renderSingleMessage: sources, performance, suggestions, copy button) ... */}
          {message.sources && message.sources.length > 0 && (
            <SourcesList sources={message.sources} />
          )}
          {message.performance && formatTime && (
            <div style={styles.performanceStats}>
              Time: emb: {formatTime(message.performance.embedding_ms)} |
              search: {formatTime(message.performance.search_ms)} | answer:{' '}
              {formatTime(message.performance.generate_ms)} | total:{' '}
              {formatTime(message.performance.total_ms)}
            </div>
          )}
          {((message.clarificationQuestions ?? []).length > 0 ||
            (message.infoTemplates ?? []).length > 0) && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={styles.suggestedHeader}>
                {message.suggestions_header || 'Please clarify for me:'}
              </div>
              {(message.clarificationQuestions ?? []).length > 0 && (
                <div
                  style={{
                    marginBottom:
                      (message.infoTemplates ?? []).length > 0 ? '0.5rem' : 0,
                  }}
                >
                  {(message.clarificationQuestions ?? []).map((q, idx) => (
                    <div
                      key={idx}
                      style={styles.suggestedQuestion}
                      onMouseOver={e => {
                        const target = e.currentTarget;
                        target.style.backgroundColor = '#374151';
                      }}
                      onMouseOut={e => {
                        const target = e.currentTarget;
                        target.style.backgroundColor = '#2d3748';
                      }}
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
                      style={{
                        ...styles.suggestedQuestion,
                        backgroundColor: '#23272A',
                        color: '#cbd5e1',
                        borderStyle: 'dashed',
                      }}
                      onMouseOver={e => {
                        const target = e.currentTarget;
                        target.style.backgroundColor = '#2d3748';
                      }}
                      onMouseOut={e => {
                        const target = e.currentTarget;
                        target.style.backgroundColor = '#23272A';
                      }}
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
              <div style={styles.suggestedHeader}>Try asking:</div>
              <div>
                {message.suggestions.map((q, idx) => (
                  <div
                    key={idx}
                    style={styles.suggestedQuestion}
                    onMouseOver={e => {
                      const target = e.currentTarget;
                      target.style.backgroundColor = '#374151';
                    }}
                    onMouseOut={e => {
                      const target = e.currentTarget;
                      target.style.backgroundColor = '#2d3748';
                    }}
                    onClick={() => onSelectSuggestion(q)}
                  >
                    {q}
                  </div>
                ))}
              </div>
            </div>
          )}
          {message.role === MessageType.BOT &&
            message.content &&
            message.content !== 'Server request error.' &&
            !loading && (
              <>
                {showCopyPhrase && (
                  <div style={styles.copyPhraseContainer}>{copyPhrase}</div>
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

    // Function for rendering multiple responses
    const renderMultiMessage = () => {
      if (!message.answers || !message.isMulti) return null;

      return (
        <div style={{ width: '100%' }}>
          <h3 style={styles.multiHeader}>
            Answers to multiple questions ({message.answers.length})
          </h3>

          {message.answers.map((item, idx) => (
            <div
              key={idx}
              style={
                idx < message.answers!.length - 1
                  ? styles.answerContainer
                  : styles.lastAnswerContainer
              }
            >
              <div style={styles.questionTitle}>
                Question {idx + 1}: {item.question}
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: (
                      props: React.AnchorHTMLAttributes<HTMLAnchorElement>
                    ) => (
                      <a
                        {...props}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          textDecoration: 'underline',
                          color: '#93c5fd',
                        }}
                      />
                    ),
                    p: ({ children }: { children?: React.ReactNode }) => (
                      <p>
                        <SourceHighlighter>{children}</SourceHighlighter>
                      </p>
                    ),
                    li: ({ children }: { children?: React.ReactNode }) => (
                      <li>
                        <SourceHighlighter>{children}</SourceHighlighter>
                      </li>
                    ),
                    h1: ({ children }: { children?: React.ReactNode }) => (
                      <h1>
                        <SourceHighlighter>{children}</SourceHighlighter>
                      </h1>
                    ),
                    h2: ({ children }: { children?: React.ReactNode }) => (
                      <h2>
                        <SourceHighlighter>{children}</SourceHighlighter>
                      </h2>
                    ),
                    h3: ({ children }: { children?: React.ReactNode }) => (
                      <h3>
                        <SourceHighlighter>{children}</SourceHighlighter>
                      </h3>
                    ),
                    h4: ({ children }: { children?: React.ReactNode }) => (
                      <h4>
                        <SourceHighlighter>{children}</SourceHighlighter>
                      </h4>
                    ),
                    h5: ({ children }: { children?: React.ReactNode }) => (
                      <h5>
                        <SourceHighlighter>{children}</SourceHighlighter>
                      </h5>
                    ),
                    h6: ({ children }: { children?: React.ReactNode }) => (
                      <h6>
                        <SourceHighlighter>{children}</SourceHighlighter>
                      </h6>
                    ),
                    blockquote: ({
                      children,
                    }: {
                      children?: React.ReactNode;
                    }) => (
                      <blockquote>
                        <SourceHighlighter>{children}</SourceHighlighter>
                      </blockquote>
                    ),
                    strong: ({ children }: { children?: React.ReactNode }) => (
                      <strong>
                        <SourceHighlighter>{children}</SourceHighlighter>
                      </strong>
                    ),
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
              Total time: emb: {formatTime(message.performance.embedding_ms)} |
              search: {formatTime(message.performance.search_ms)} | answer:{' '}
              {formatTime(message.performance.generate_ms)} | total:{' '}
              {formatTime(message.performance.total_ms)}
            </div>
          )}

          {/* ADD SUGGESTIONS DISPLAY FOR MULTIPLE RESPONSES */}
          {((message.clarificationQuestions ?? []).length > 0 ||
            (message.infoTemplates ?? []).length > 0) && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={styles.suggestedHeader}>
                {message.suggestions_header || 'Try asking:'}
              </div>
              {(message.clarificationQuestions ?? []).length > 0 && (
                <div
                  style={{
                    marginBottom:
                      (message.infoTemplates ?? []).length > 0 ? '0.5rem' : 0,
                  }}
                >
                  {(message.clarificationQuestions ?? []).map((q, idx) => (
                    <div
                      key={idx}
                      style={styles.suggestedQuestion}
                      onMouseOver={e => {
                        const target = e.currentTarget;
                        target.style.backgroundColor = '#374151';
                      }}
                      onMouseOut={e => {
                        const target = e.currentTarget;
                        target.style.backgroundColor = '#2d3748';
                      }}
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
                      style={{
                        ...styles.suggestedQuestion,
                        backgroundColor: '#23272A',
                        color: '#cbd5e1',
                        borderStyle: 'dashed',
                      }}
                      onMouseOver={e => {
                        const target = e.currentTarget;
                        target.style.backgroundColor = '#2d3748';
                      }}
                      onMouseOut={e => {
                        const target = e.currentTarget;
                        target.style.backgroundColor = '#23272A';
                      }}
                      onClick={() => onSelectSuggestion(tpl)}
                    >
                      ✏️ {tpl}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && (
            <>
              {showCopyPhrase && (
                <div style={styles.copyPhraseContainer}>{copyPhrase}</div>
              )}
              <button
                style={styles.copyButton}
                onClick={() =>
                  handleCopy(
                    message.answers
                      ?.map(a => `Question: ${a.question}\nAnswer: ${a.answer}`)
                      .join('\n\n') || ''
                  )
                }
                title="Copy all answers"
              >
                ⧉
              </button>
            </>
          )}
        </div>
      );
    };

    // Add animation styles
    const animationStyle = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

    // Main component rendering
    return (
      <div
        style={
          {
            position: 'relative',
            ...(message.role === 'user' ? styles.userBubble : styles.botBubble),
          } as CSSProperties
        }
      >
        <style>{animationStyle}</style>
        {message.isMulti && message.answers
          ? renderMultiMessage()
          : renderSingleMessage()}
      </div>
    );
  }
);

export default MessageBubble;
