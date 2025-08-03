import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const ChatHeader = ({ onToggleSettings, onToggleHistory, onCreateNewSession, showHistoryButton = true, }) => {
    return (_jsxs("header", { style: styles.header, children: [_jsx("h1", { style: styles.title, children: "EAA Chatbot" }), _jsxs("div", { style: styles.buttons, children: [showHistoryButton && (_jsxs("button", { style: styles.button, onClick: onToggleHistory, title: "Chat history", children: [_jsx("span", { style: styles.icon, children: "\uD83D\uDCCB" }), " Chat history"] })), _jsxs("button", { style: styles.button, onClick: onCreateNewSession, title: "Create new session", children: [_jsx("span", { style: styles.icon, children: "\u2728" }), " Create new session"] }), _jsxs("button", { style: styles.button, onClick: onToggleSettings, title: "Settings", children: [_jsx("span", { style: styles.icon, children: "\u2699\uFE0F" }), " Settings"] })] })] }));
};
const styles = {
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        backgroundColor: '#1e1e1e',
        borderBottom: '1px solid #333',
        height: '60px',
    },
    title: {
        margin: 0,
        fontSize: '18px',
        color: '#fff',
        fontWeight: 'bold',
    },
    buttons: {
        display: 'flex',
        gap: '10px',
    },
    button: {
        backgroundColor: '#2d2d2d',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        padding: '8px 12px',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        '&:hover': {
            backgroundColor: '#3d3d3d',
        },
    },
    icon: {
        fontSize: '16px',
    },
};
export default ChatHeader;
