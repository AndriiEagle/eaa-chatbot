import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import ToggleSwitch from './ToggleSwitch';
/**
 * App settings component
 */
const Settings = ({ datasetId, setDatasetId, similarityThreshold, setSimilarityThreshold, maxChunks, setMaxChunks, clearHistory, isProactiveAgentEnabled, setIsProactiveAgentEnabled }) => {
    const styles = {
        container: {
            position: 'fixed',
            right: '2rem',
            top: '2rem',
            zIndex: 10,
            background: '#202225',
            border: '1px solid #333',
            borderRadius: '0.75rem',
            padding: '1rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            width: '18rem',
        },
        title: {
            fontWeight: 600,
            fontSize: '0.875rem',
            marginBottom: '0.25rem',
            userSelect: 'none',
        },
        label: {
            fontSize: '0.75rem',
            fontWeight: 600,
        },
        mono: {
            fontFamily: 'monospace',
        },
        slider: {
            width: '100%',
            accentColor: '#3b82f6',
        },
        helpText: {
            fontSize: '0.75rem',
            color: '#9ca3af',
        },
        input: {
            background: '#23272A',
            color: 'white',
            border: '1px solid #333',
            borderRadius: '0.375rem',
            padding: '0.25rem 0.5rem',
        },
        inputSmall: {
            width: '5rem',
        },
        inputFull: {
            width: '100%',
        },
        clearButton: {
            marginTop: '0.5rem',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            padding: '0.25rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
        },
    };
    return (_jsxs("div", { style: styles.container, children: [_jsx("div", { style: styles.title, children: "Search Settings" }), _jsxs("label", { style: styles.label, children: ["Similarity Threshold (UI): ", _jsx("span", { style: styles.mono, children: similarityThreshold })] }), _jsx("input", { type: "range", min: "0", max: "1", step: "0.01", value: similarityThreshold, onChange: e => setSimilarityThreshold(parseFloat(e.target.value)), style: styles.slider }), _jsx("span", { style: styles.helpText, children: "Higher values = more precise, but fewer results. Lower values = more results, but noisier." }), _jsxs("label", { style: { ...styles.label, marginTop: '0.5rem' }, children: ["Max Chunks: ", _jsx("span", { style: styles.mono, children: maxChunks })] }), _jsx("input", { type: "number", min: "1", max: "20", value: maxChunks, onChange: e => setMaxChunks(Math.max(1, Math.min(20, parseInt(e.target.value) || 1))), style: { ...styles.input, ...styles.inputSmall } }), _jsx("label", { style: { ...styles.label, marginTop: '0.5rem' }, children: "dataset_id:" }), _jsx("input", { style: { ...styles.input, ...styles.inputFull }, value: datasetId, onChange: e => setDatasetId(e.target.value), placeholder: "dataset_id" }), _jsx("div", { style: { borderTop: '1px solid #333', margin: '0.75rem 0' } }), _jsx("div", { style: styles.title, children: "Experimental Features" }), _jsx(ToggleSwitch, { label: "Proactive AI Assistant", enabled: isProactiveAgentEnabled, setEnabled: setIsProactiveAgentEnabled, helpText: "Agent analyzes input text and provides suggestions in real-time." }), _jsx("button", { style: styles.clearButton, onMouseOver: e => {
                    const target = e.currentTarget;
                    target.style.background = '#dc2626';
                }, onMouseOut: e => {
                    const target = e.currentTarget;
                    target.style.background = '#ef4444';
                }, onClick: clearHistory, children: "Clear Chat" })] }));
};
export default Settings;
