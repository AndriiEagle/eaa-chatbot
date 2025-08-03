import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Send } from 'lucide-react';
/**
 * Component for user message input
 */
const ChatInput = ({ onSendMessage, loading, input, setInput }) => {
    // Component styles
    const styles = {
        form: {
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-end',
            width: '100%',
        },
        textInput: {
            flex: 1,
            padding: '1rem 1.25rem',
            borderRadius: '0.75rem',
            border: '1px solid #333',
            background: '#23272A',
            color: 'white',
            fontSize: '1.1rem',
            lineHeight: '1.5',
            minHeight: '3rem',
            resize: 'vertical',
        },
        sendButton: {
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.75rem',
            padding: '1rem',
            fontSize: '1.1rem',
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: '3rem',
            minWidth: '3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        sendButtonHover: {
            background: '#2563eb',
        },
        sendButtonDisabled: {
            background: '#1d4ed8',
            opacity: 0.5,
            cursor: 'not-allowed',
        },
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim() || loading)
            return;
        onSendMessage(input);
        setInput('');
    };
    return (_jsxs("form", { style: styles.form, onSubmit: handleSubmit, children: [_jsx("textarea", { style: styles.textInput, value: input, onChange: (e) => setInput(e.target.value), placeholder: "Enter your question or use voice input...", disabled: loading, rows: 1, className: "chat-input-focus", onFocus: (e) => {
                    const target = e.target;
                    target.style.borderColor = '#3b82f6';
                    target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }, onBlur: (e) => {
                    const target = e.target;
                    target.style.borderColor = '#333';
                    target.style.boxShadow = 'none';
                }, onKeyDown: (e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !loading && input.trim()) {
                        e.preventDefault();
                        handleSubmit(e);
                    }
                }, onInput: (e) => {
                    const target = e.target;
                    target.style.height = '3rem';
                    target.style.height = Math.min(target.scrollHeight, 150) + 'px';
                }, autoFocus: true }), _jsx("button", { style: {
                    ...styles.sendButton,
                    ...(loading || !input.trim() ? styles.sendButtonDisabled : {})
                }, type: "submit", disabled: loading || !input.trim(), title: "Send message", onMouseOver: (e) => {
                    if (!loading && input.trim()) {
                        const target = e.currentTarget;
                        target.style.background = '#2563eb';
                    }
                }, onMouseOut: (e) => {
                    if (!loading && input.trim()) {
                        const target = e.currentTarget;
                        target.style.background = '#3b82f6';
                    }
                }, children: loading ? (_jsx("div", { className: "animate-spin rounded-full h-5 w-5 border-b-2 border-white" })) : (_jsx(Send, { size: 20 })) })] }));
};
export default ChatInput;
