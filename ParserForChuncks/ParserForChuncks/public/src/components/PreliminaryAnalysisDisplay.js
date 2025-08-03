import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SourceHighlighter from './SourceHighlighter'; // Assuming it's needed for consistency
const PreliminaryAnalysisDisplay = ({ analysisData }) => {
    const formatAnalysisToString = (pa) => {
        let formattedText = `##### 🔍 Preliminary Analysis\n`; // Using Markdown for title
        if (pa.completeness !== undefined) {
            formattedText += `*(based on ${Math.round(pa.completeness * 100)}% of available data)*\n\n`;
        }
        if (pa.businessType)
            formattedText += `- **Business Type**: ${pa.businessType}\n`;
        if (pa.businessSize)
            formattedText += `- **Company Size**: ${pa.businessSize}\n`;
        if (pa.summary && pa.summary.trim() !== '')
            formattedText += `\n${pa.summary.trim()}\n`;
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
            overflow: 'hidden',
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
    const markdownComponents = {
        p: ({ children }) => _jsx("p", { style: { margin: '0 0 8px 0' }, children: _jsx(SourceHighlighter, { children: children }) }),
        li: ({ children }) => _jsx("li", { style: { marginLeft: '20px' }, children: _jsx(SourceHighlighter, { children: children }) }),
        h5: ({ children }) => _jsx("h5", { style: { marginTop: '0', marginBottom: '8px' }, children: _jsx(SourceHighlighter, { children: children }) }),
        strong: ({ children }) => _jsx("strong", { children: _jsx(SourceHighlighter, { children: children }) }),
    };
    return (_jsxs("div", { style: styles.container, children: [percent !== null && (_jsx("div", { style: styles.progressOuter, children: _jsx("div", { style: { ...styles.progressInner, width: `${percent}%` } }) })), _jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], components: markdownComponents, children: analysisString })] }));
};
export default PreliminaryAnalysisDisplay;
