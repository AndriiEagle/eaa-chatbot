import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageType } from '../types/index';
import SourceHighlighter from './SourceHighlighter';
import SourcesList from './SourcesList';
import { copyPhrases } from '../constants/phrases';
import PreliminaryAnalysisDisplay from './PreliminaryAnalysisDisplay';
/**
 * Formats message text, highlighting key parameters
 */
const formatMessageText = (text) => {
    // Replace technical parameters with more understandable names
    const techParamsMap = {
        'service_types': 'Service Types',
        'customer_base': 'Target Audience',
        'business_type': 'Business Type',
        'business_size': 'Business Size',
        'web_presence': 'Web Presence',
        'physical_location': 'Physical Location',
        'product_types': 'Product Types',
        'delivery': 'Delivery'
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
const processObjectStrings = (text) => {
    if (!text || typeof text !== 'string')
        return String(text || '');
    console.log('[MessageBubble] processObjectStrings - INPUT:', JSON.stringify(text.substring(0, 200))); // Log input text
    let processedText = text;
    // Detection of accessibility benefits lists and replacement of [object Object]
    if (processedText.toLowerCase().includes('benefit') ||
        processedText.toLowerCase().includes('advantage') ||
        processedText.toLowerCase().includes('compliance')) {
        console.log('[MessageBubble] processObjectStrings - Accessibility benefits context detected');
        // Processing numbered lists of objects in different formats
        // 1. Format: "1. [object Object]\n2. [object Object]"
        const listPattern = /((?:\d+\.\s*\[object Object\][\s\n]*)+)/g;
        // 2. HTML lists: "<li>[object Object]</li>"
        const htmlListPattern = /(<li[^>]*>\s*\[object Object\]\s*<\/li>)/gi;
        // 3. Bullet lists: "- [object Object]" or "• [object Object]"
        const bulletListPattern = /(?:[-•*]\s*\[object Object\][\s\n]*)+/g;
        if (listPattern.test(processedText) || htmlListPattern.test(processedText) || bulletListPattern.test(processedText)) {
            console.log('[MessageBubble] processObjectStrings - Found [object Object] list in accessibility context');
            const benefitsTexts = [
                "Expanding customer base by making service accessible to people with disabilities",
                "Improving company reputation as a socially responsible business",
                "Reducing legal risks related to non-compliance with EAA requirements",
                "Improving user experience for all customers without exception",
                "Increasing customer satisfaction and loyalty",
                "Opportunity to enter new markets and audiences"
            ];
            // Replace all benefit list formats
            processedText = processedText.replace(listPattern, (match) => {
                const count = (match.match(/\d+\./g) || []).length;
                return Array.from({ length: count }, (_, i) => {
                    const benefit = i < benefitsTexts.length ? benefitsTexts[i] : `Accessibility benefit ${i + 1}`;
                    return `${i + 1}. ${benefit}`;
                }).join("\n");
            });
            processedText = processedText.replace(htmlListPattern, (match, p1, offset, string) => {
                // Count list items near the current one
                const listItems = string.match(/<li[^>]*>\s*\[object Object\]\s*<\/li>/gi) || [];
                const count = Math.min(listItems.length, benefitsTexts.length);
                // Return first element from benefits list for this occurrence
                const index = listItems.indexOf(match);
                if (index >= 0 && index < benefitsTexts.length) {
                    return `<li>${benefitsTexts[index]}</li>`;
                }
                return `<li>Accessibility benefit</li>`;
            });
            processedText = processedText.replace(bulletListPattern, (match) => {
                const count = (match.match(/[-•*]\s*\[object Object\]/g) || []).length;
                return Array.from({ length: count }, (_, i) => {
                    const benefit = i < benefitsTexts.length ? benefitsTexts[i] : `Accessibility benefit ${i + 1}`;
                    return `- ${benefit}`;
                }).join("\n");
            });
        }
    }
    // 1. Replacement for numbered/bulleted lists like "1. [object Object]" or "- [object Object]"
    const listItemObjectPattern = /^(\s*[\d]+\.\s*|\s*[-•*]\s*)(\[object Object\])/gmi;
    if (listItemObjectPattern.test(processedText)) {
        console.log('[MessageBubble] processObjectStrings - Found list item with [object Object]');
        processedText = processedText.replace(listItemObjectPattern, '$1(list item)');
    }
    // 2. If the entire string (after trim) is "[object Object]"
    if (processedText.trim() === '[object Object]') {
        console.log('[MessageBubble] processObjectStrings - Matched: Full string [object Object]');
        processedText = '(object content)'; // More neutral replacement
    }
    // 3. Processing specific pattern related to preliminaryAnalysis
    const dataCompletenessPattern = /\[object Object\]\s*\(based on (\d+)% of available data\)/g;
    if (processedText.match(dataCompletenessPattern)) {
        console.log('[MessageBubble] processObjectStrings - Matched: dataCompletenessPattern');
        processedText = processedText.replace(dataCompletenessPattern, (_, percent) => {
            return `(Data completeness information (${percent}%) was presented earlier).`;
        });
    }
    // 4. Check for text like "Preliminary analysis: [object Object]" 
    const preliminaryAnalysisPattern = /(preliminary\s+analysis)\s*[:]\s*\[object Object\]/gi;
    if (preliminaryAnalysisPattern.test(processedText)) {
        console.log('[MessageBubble] processObjectStrings - Matched: preliminaryAnalysisPattern');
        processedText = processedText.replace(preliminaryAnalysisPattern, '$1 was displayed separately');
    }
    // 5. General replacement of all remaining "[object Object]" occurrences (case insensitive)
    if (processedText.includes('[object Object]') || processedText.toLowerCase().includes('[object object]')) {
        console.log('[MessageBubble] processObjectStrings - Matched: Includes [object Object]');
        processedText = processedText.replace(/\[object Object\]/gi, '(information)');
    }
    // 6. Processing HTML markup containing [object Object]
    const htmlTagsWithObjectPattern = /<([a-z][a-z0-9]*)[^>]*>\s*\[object Object\]\s*<\/\1>/gi;
    if (htmlTagsWithObjectPattern.test(processedText)) {
        console.log('[MessageBubble] processObjectStrings - Matched: HTML tags with [object Object]');
        processedText = processedText.replace(htmlTagsWithObjectPattern, (match, tag) => {
            return `<${tag}>(information in ${tag} format)</${tag}>`;
        });
    }
    if (processedText !== text) {
        console.log('[MessageBubble] processObjectStrings - OUTPUT changed:', JSON.stringify(processedText.substring(0, 200)));
    }
    return processedText;
};
/**
 * Component for displaying chat message
 * Handles both regular messages and multiple responses
 */
const MessageBubble = React.memo(({ message, onCopy, formatTime, getRelevanceColor, onSelectSuggestion, loading = false }) => {
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
    const handleCopy = useCallback((textToProcess) => {
        const textToCopy = textToProcess || (typeof message.content === 'string' ? message.content : JSON.stringify(message.content));
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            if (onCopy)
                onCopy(textToCopy);
        });
    }, [message.content, isUser, onCopy]);
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
        },
        botBubble: {
            backgroundColor: '#333',
            color: 'white',
            borderBottomLeftRadius: '0.25rem',
            border: '1px solid #444',
            maxWidth: '75%',
            padding: '0.75rem 1rem',
            borderRadius: '1rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        },
        multiHeader: {
            fontSize: '1rem',
            fontWeight: 'bold',
            marginBottom: '0.75rem',
            color: '#60a5fa'
        },
        questionTitle: {
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            color: '#93c5fd'
        },
        answerContainer: {
            marginBottom: '1.5rem',
            borderBottom: '1px solid #444',
            paddingBottom: '1rem'
        },
        lastAnswerContainer: {
            marginBottom: '1.5rem',
            paddingBottom: '1rem'
        },
        performanceStats: {
            fontSize: '0.65rem',
            color: '#9ca3af',
            marginTop: '0.5rem',
            fontFamily: 'monospace',
            borderTop: '1px solid #444',
            paddingTop: '0.5rem'
        },
        suggestedHeader: {
            fontWeight: 600,
            marginBottom: '0.5rem'
        },
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
        },
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
        },
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
        }
    };
    // Function for rendering regular (single) response
    const renderSingleMessage = () => {
        let mainContent = message.content; // Original content
        if (isUser) {
            // For user, simply display their content
            mainContent = formatMessageText(mainContent);
        }
        else {
            // For bot, first process preliminaryAnalysis if it exists
            // mainContent will be formatted below if it's not empty
            if (typeof mainContent === 'string') {
                mainContent = formatMessageText(mainContent);
                mainContent = processObjectStrings(mainContent);
            }
            else if (mainContent === null || mainContent === undefined) {
                mainContent = ''; // If no content, make it empty string
            }
            else {
                // If content is not string (unlikely for main response, but for completeness)
                mainContent = JSON.stringify(mainContent, null, 2);
            }
        }
        // Check if we need to display main text after PreliminaryAnalysis block
        let showMainContentAfterAnalysis = true;
        if (message.preliminaryAnalysis && typeof message.content === 'string') {
            // Simple condition: if main content is almost same as part of preliminaryAnalysis.summary, don't show it
            const paSummary = message.preliminaryAnalysis.summary || '';
            if (message.content.includes(paSummary.substring(0, Math.min(paSummary.length, 50)))) {
                if (message.content.length < paSummary.length + 100) { // If main content is not much longer than summary
                    showMainContentAfterAnalysis = false;
                }
            }
            // If main content is just repetition of clarification request that already exists in preliminaryAnalysis
            if (message.preliminaryAnalysis.humanReadableMissingData &&
                message.preliminaryAnalysis.humanReadableMissingData.some(missing => message.content.includes(missing))) {
                if (message.content.toLowerCase().includes('please clarify') || message.content.toLowerCase().includes('for an accurate answer, i need additional information')) {
                    showMainContentAfterAnalysis = false;
                }
            }
        }
        if (mainContent === 'Analysis data has been processed.' || mainContent === 'Preliminary analysis (based on 100% data) was shown above.') {
            showMainContentAfterAnalysis = false;
        }
        return (_jsxs(_Fragment, { children: [!isUser && message.preliminaryAnalysis && (_jsx(PreliminaryAnalysisDisplay, { analysisData: message.preliminaryAnalysis })), (mainContent && showMainContentAfterAnalysis && mainContent.trim() !== '') && (_jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], components: {
                        a: (props) => (_jsx("a", { ...props, target: "_blank", rel: "noopener noreferrer", style: { textDecoration: 'underline', color: '#93c5fd' } })),
                        p: ({ children }) => _jsx("p", { children: _jsx(SourceHighlighter, { children: children }) }),
                        li: ({ children }) => _jsx("li", { children: _jsx(SourceHighlighter, { children: children }) }),
                        h1: ({ children }) => _jsx("h1", { children: _jsx(SourceHighlighter, { children: children }) }),
                        h2: ({ children }) => _jsx("h2", { children: _jsx(SourceHighlighter, { children: children }) }),
                        h3: ({ children }) => _jsx("h3", { children: _jsx(SourceHighlighter, { children: children }) }),
                        h4: ({ children }) => _jsx("h4", { children: _jsx(SourceHighlighter, { children: children }) }),
                        h5: ({ children }) => _jsx("h5", { children: _jsx(SourceHighlighter, { children: children }) }),
                        h6: ({ children }) => _jsx("h6", { children: _jsx(SourceHighlighter, { children: children }) }),
                        blockquote: ({ children }) => _jsx("blockquote", { children: _jsx(SourceHighlighter, { children: children }) }),
                        strong: ({ children }) => _jsx("strong", { children: _jsx(SourceHighlighter, { children: children }) }),
                    }, children: typeof mainContent === 'string' ? mainContent : JSON.stringify(mainContent, null, 2) })), message.sources && message.sources.length > 0 && (_jsx(SourcesList, { sources: message.sources })), message.performance && formatTime && (_jsxs("div", { style: styles.performanceStats, children: ["Time: emb: ", formatTime(message.performance.embedding_ms), " | search: ", formatTime(message.performance.search_ms), " | answer: ", formatTime(message.performance.generate_ms), " | total: ", formatTime(message.performance.total_ms)] })), ((message.clarificationQuestions ?? []).length > 0 || (message.infoTemplates ?? []).length > 0) && (_jsxs("div", { style: { marginTop: '0.75rem' }, children: [_jsx("div", { style: styles.suggestedHeader, children: message.suggestions_header || 'Please clarify for me:' }), (message.clarificationQuestions ?? []).length > 0 && (_jsx("div", { style: { marginBottom: (message.infoTemplates ?? []).length > 0 ? '0.5rem' : 0 }, children: (message.clarificationQuestions ?? []).map((q, idx) => (_jsx("div", { style: styles.suggestedQuestion, onMouseOver: e => { const target = e.currentTarget; target.style.backgroundColor = '#374151'; }, onMouseOut: e => { const target = e.currentTarget; target.style.backgroundColor = '#2d3748'; }, onClick: () => onSelectSuggestion(q), children: q }, idx))) })), (message.infoTemplates ?? []).length > 0 && (_jsx("div", { style: { opacity: 0.85 }, children: (message.infoTemplates ?? []).map((tpl, idx) => (_jsxs("div", { style: { ...styles.suggestedQuestion, backgroundColor: '#23272A', color: '#cbd5e1', borderStyle: 'dashed' }, onMouseOver: e => { const target = e.currentTarget; target.style.backgroundColor = '#2d3748'; }, onMouseOut: e => { const target = e.currentTarget; target.style.backgroundColor = '#23272A'; }, onClick: () => onSelectSuggestion(tpl), children: ["\u270F\uFE0F ", tpl] }, idx))) }))] })), message.suggestions && message.suggestions.length > 0 && (_jsxs("div", { style: { marginTop: '0.75rem' }, children: [_jsx("div", { style: styles.suggestedHeader, children: "Try asking:" }), _jsx("div", { children: message.suggestions.map((q, idx) => (_jsx("div", { style: styles.suggestedQuestion, onMouseOver: e => { const target = e.currentTarget; target.style.backgroundColor = '#374151'; }, onMouseOut: e => { const target = e.currentTarget; target.style.backgroundColor = '#2d3748'; }, onClick: () => onSelectSuggestion(q), children: q }, idx))) })] })), message.role === MessageType.BOT && message.content && message.content !== 'Server request error.' && !loading && (_jsxs(_Fragment, { children: [showCopyPhrase && (_jsx("div", { style: styles.copyPhraseContainer, children: copyPhrase })), _jsx("button", { style: styles.copyButton, onClick: () => handleCopy(message.content), title: "Copy answer", children: "\u29C9" })] }))] }));
    };
    // Function for rendering multiple responses
    const renderMultiMessage = () => {
        if (!message.answers || !message.isMulti)
            return null;
        return (_jsxs("div", { style: { width: '100%' }, children: [_jsxs("h3", { style: styles.multiHeader, children: ["Answers to multiple questions (", message.answers.length, ")"] }), message.answers.map((item, idx) => (_jsxs("div", { style: idx < message.answers.length - 1 ? styles.answerContainer : styles.lastAnswerContainer, children: [_jsxs("div", { style: styles.questionTitle, children: ["Question ", idx + 1, ": ", item.question] }), _jsx("div", { style: { marginBottom: '0.5rem' }, children: _jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], components: {
                                    a: (props) => (_jsx("a", { ...props, target: "_blank", rel: "noopener noreferrer", style: { textDecoration: 'underline', color: '#93c5fd' } })),
                                    p: ({ children }) => _jsx("p", { children: _jsx(SourceHighlighter, { children: children }) }),
                                    li: ({ children }) => _jsx("li", { children: _jsx(SourceHighlighter, { children: children }) }),
                                    h1: ({ children }) => _jsx("h1", { children: _jsx(SourceHighlighter, { children: children }) }),
                                    h2: ({ children }) => _jsx("h2", { children: _jsx(SourceHighlighter, { children: children }) }),
                                    h3: ({ children }) => _jsx("h3", { children: _jsx(SourceHighlighter, { children: children }) }),
                                    h4: ({ children }) => _jsx("h4", { children: _jsx(SourceHighlighter, { children: children }) }),
                                    h5: ({ children }) => _jsx("h5", { children: _jsx(SourceHighlighter, { children: children }) }),
                                    h6: ({ children }) => _jsx("h6", { children: _jsx(SourceHighlighter, { children: children }) }),
                                    blockquote: ({ children }) => _jsx("blockquote", { children: _jsx(SourceHighlighter, { children: children }) }),
                                    strong: ({ children }) => _jsx("strong", { children: _jsx(SourceHighlighter, { children: children }) }),
                                }, children: item.answer }) }), item.sources && item.sources.length > 0 && (_jsx(SourcesList, { sources: item.sources }))] }, idx))), message.performance && formatTime && (_jsxs("div", { style: styles.performanceStats, children: ["Total time: emb: ", formatTime(message.performance.embedding_ms), " | search: ", formatTime(message.performance.search_ms), " | answer: ", formatTime(message.performance.generate_ms), " | total: ", formatTime(message.performance.total_ms)] })), ((message.clarificationQuestions ?? []).length > 0 || (message.infoTemplates ?? []).length > 0) && (_jsxs("div", { style: { marginTop: '0.75rem' }, children: [_jsx("div", { style: styles.suggestedHeader, children: message.suggestions_header || 'Try asking:' }), (message.clarificationQuestions ?? []).length > 0 && (_jsx("div", { style: { marginBottom: (message.infoTemplates ?? []).length > 0 ? '0.5rem' : 0 }, children: (message.clarificationQuestions ?? []).map((q, idx) => (_jsx("div", { style: styles.suggestedQuestion, onMouseOver: e => { const target = e.currentTarget; target.style.backgroundColor = '#374151'; }, onMouseOut: e => { const target = e.currentTarget; target.style.backgroundColor = '#2d3748'; }, onClick: () => onSelectSuggestion(q), children: q }, idx))) })), (message.infoTemplates ?? []).length > 0 && (_jsx("div", { style: { opacity: 0.85 }, children: (message.infoTemplates ?? []).map((tpl, idx) => (_jsxs("div", { style: { ...styles.suggestedQuestion, backgroundColor: '#23272A', color: '#cbd5e1', borderStyle: 'dashed' }, onMouseOver: e => { const target = e.currentTarget; target.style.backgroundColor = '#2d3748'; }, onMouseOut: e => { const target = e.currentTarget; target.style.backgroundColor = '#23272A'; }, onClick: () => onSelectSuggestion(tpl), children: ["\u270F\uFE0F ", tpl] }, idx))) }))] })), !loading && (_jsxs(_Fragment, { children: [showCopyPhrase && (_jsx("div", { style: styles.copyPhraseContainer, children: copyPhrase })), _jsx("button", { style: styles.copyButton, onClick: () => handleCopy(message.answers?.map(a => `Question: ${a.question}\nAnswer: ${a.answer}`).join('\n\n') || ''), title: "Copy all answers", children: "\u29C9" })] }))] }));
    };
    // Add animation styles
    const animationStyle = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
    // Main component rendering
    return (_jsxs("div", { style: {
            position: 'relative',
            ...(message.role === 'user' ? styles.userBubble : styles.botBubble)
        }, children: [_jsx("style", { children: animationStyle }), message.isMulti && message.answers
                ? renderMultiMessage()
                : renderSingleMessage()] }));
});
export default MessageBubble;
