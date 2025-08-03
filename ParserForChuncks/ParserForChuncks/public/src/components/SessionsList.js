import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Component for displaying chat sessions list
 */
const SessionsList = ({ sessions, activeSessionId, onSelectSession, onDeleteSession, onCreateNewSession }) => {
    // Date formatting
    const formatDate = (dateString) => {
        if (!dateString)
            return 'Recently';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        if (diffMinutes < 1)
            return 'Just now';
        if (diffMinutes < 60)
            return `${diffMinutes} min. ago`;
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24)
            return `${diffHours} h. ago`;
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    return (_jsxs("div", { style: styles.container, children: [_jsxs("div", { style: styles.header, children: [_jsx("h2", { style: styles.title, children: "Session History" }), _jsx("button", { style: styles.newButton, onClick: onCreateNewSession, children: "+ New session" })] }), _jsx("div", { style: styles.sessionsList, children: sessions.length === 0 ? (_jsx("div", { style: styles.emptyState, children: "No saved sessions" })) : (sessions.map(session => (_jsx("div", { style: {
                        ...styles.sessionItem,
                        ...(session.id === activeSessionId ? styles.activeSession : {})
                    }, onClick: () => onSelectSession(session.id), children: _jsxs("div", { style: styles.sessionContent, children: [_jsxs("div", { style: styles.sessionHeader, children: [_jsx("span", { style: styles.sessionDate, children: formatDate(session.last_activity) }), _jsx("button", { style: styles.deleteButton, onClick: (e) => {
                                            e.stopPropagation();
                                            onDeleteSession(session.id);
                                        }, title: "Delete session", children: "\u2715" })] }), _jsx("div", { style: styles.sessionSummary, children: session.summary?.summary ? (session.summary.summary) : (_jsx("span", { style: styles.noSummary, children: "Summary not created" })) }), session.summary?.key_topics && session.summary.key_topics.length > 0 && (_jsx("div", { style: styles.topicsList, children: session.summary.key_topics.slice(0, 3).map((topic, index) => (_jsx("span", { style: styles.topicTag, children: topic }, index))) }))] }) }, session.id)))) })] }));
};
const styles = {
    container: {
        position: 'absolute',
        top: '0',
        right: '0',
        width: '320px',
        maxHeight: 'calc(100vh - 60px)',
        background: '#2c2f33',
        borderLeft: '1px solid #4b5563',
        borderRadius: '0 0 0 8px',
        boxShadow: '-4px 4px 10px rgba(0, 0, 0, 0.2)',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    header: {
        padding: '16px',
        borderBottom: '1px solid #4b5563',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        margin: 0,
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#fff',
    },
    newButton: {
        background: '#3b82f6',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        padding: '4px 8px',
        fontSize: '12px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    sessionsList: {
        overflowY: 'auto',
        flex: 1,
        padding: '8px',
    },
    emptyState: {
        padding: '16px',
        textAlign: 'center',
        color: '#9ca3af',
        fontStyle: 'italic',
    },
    sessionItem: {
        background: '#23272A',
        borderRadius: '6px',
        marginBottom: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        borderLeft: '3px solid transparent',
    },
    activeSession: {
        borderLeftColor: '#3b82f6',
        background: '#2d3748',
    },
    sessionContent: {
        padding: '12px',
    },
    sessionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
    },
    sessionDate: {
        fontSize: '12px',
        color: '#9ca3af',
    },
    deleteButton: {
        background: 'none',
        border: 'none',
        color: '#9ca3af',
        cursor: 'pointer',
        fontSize: '12px',
        padding: '2px 6px',
        borderRadius: '4px',
        transition: 'all 0.2s',
    },
    sessionSummary: {
        fontSize: '13px',
        lineHeight: '1.4',
        color: '#e5e7eb',
        marginBottom: '8px',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    noSummary: {
        fontStyle: 'italic',
        color: '#9ca3af',
    },
    topicsList: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
    },
    topicTag: {
        background: '#4b5563',
        color: '#e5e7eb',
        fontSize: '10px',
        padding: '2px 6px',
        borderRadius: '4px',
        display: 'inline-block',
    },
};
export default SessionsList;
