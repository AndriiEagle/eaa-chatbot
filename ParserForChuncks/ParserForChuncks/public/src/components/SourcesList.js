import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { getRelevanceColor } from '../utils/stringUtils';
import { ChevronDown, ChevronUp } from 'lucide-react';
const INITIAL_VISIBLE_SOURCES = 3;
/**
 * Component for displaying list of sources with their relevance and additional information
 */
const SourcesList = ({ sources, containerStyles }) => {
    // State for storing ID of source being hovered over
    const [hoveredSourceId, setHoveredSourceId] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    if (!sources || sources.length === 0) {
        return null;
    }
    const visibleSources = isExpanded ? sources : sources.slice(0, INITIAL_VISIBLE_SOURCES);
    // Log for debugging
    console.log(`[SourcesList] Displaying ${sources.length} sources:`, sources);
    return (_jsxs("div", { style: {
            marginTop: '0.75rem',
            fontSize: '0.75rem',
            color: '#9ca3af',
            paddingTop: '0.75rem',
            borderTop: '1px solid #4b5563',
            ...containerStyles
        }, children: [_jsxs("div", { style: { fontWeight: 600, marginBottom: '0.75rem' }, children: ["Sources (", sources.length, "):"] }), _jsx("div", { style: {
                    display: 'flex',
                    flexWrap: 'wrap',
                    marginTop: '0.5rem'
                }, children: visibleSources.map((source, idx) => (_jsxs("div", { style: {
                        flex: '0 0 33.333%',
                        marginBottom: '0.5rem'
                    }, onMouseEnter: () => source.id && setHoveredSourceId(source.id), onMouseLeave: () => setHoveredSourceId(null), children: [_jsxs("div", { style: {
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '0.25rem'
                            }, children: [_jsxs("div", { style: {
                                        minWidth: '1.5rem',
                                        marginRight: '0.5rem',
                                        textAlign: 'right',
                                        color: '#a78bfa',
                                        fontWeight: 'bold'
                                    }, children: [idx + 1, "."] }), _jsxs("div", { style: {
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }, children: [_jsx("span", { style: {
                                                cursor: 'pointer',
                                                borderBottom: '1px dotted #a78bfa'
                                            }, title: source.text_preview || 'No preview available', children: source.title || `Source ${idx + 1}` }), _jsxs("span", { style: {
                                                marginLeft: '0.5rem',
                                                color: getRelevanceColor(source.relevance),
                                                fontFamily: 'monospace'
                                            }, children: [(source.relevance * 100).toFixed(1), "%"] })] })] }), hoveredSourceId === source.id && source.text_preview && (_jsxs("div", { style: {
                                backgroundColor: '#2d3748',
                                border: '1px solid #4b5563',
                                borderRadius: '4px',
                                padding: '0.5rem',
                                marginLeft: '2rem',
                                marginRight: '0.5rem',
                                fontSize: '0.7rem',
                                color: '#e2e8f0',
                                maxHeight: '60px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                position: 'relative'
                            }, children: [source.text_preview, _jsx("div", { style: {
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: '20px',
                                        background: 'linear-gradient(transparent, #2d3748)'
                                    } })] }))] }, idx))) }), sources.length > INITIAL_VISIBLE_SOURCES && (_jsxs("button", { onClick: () => setIsExpanded(!isExpanded), style: {
                    background: 'none',
                    border: '1px solid #4b5563',
                    color: '#d1d5db',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.75rem'
                }, children: [isExpanded ? 'Collapse' : `Show ${sources.length - INITIAL_VISIBLE_SOURCES} more`, isExpanded
                        ? _jsx(ChevronUp, { size: 14, style: { marginLeft: '0.25rem' } })
                        : _jsx(ChevronDown, { size: 14, style: { marginLeft: '0.25rem' } })] }))] }));
};
export default SourcesList;
