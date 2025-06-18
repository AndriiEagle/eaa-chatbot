import React, { CSSProperties } from 'react';
import { SessionsListProps } from '../types';

/**
 * Компонент для отображения списка сессий чата
 */
const SessionsList: React.FC<SessionsListProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onCreateNewSession
}) => {
  // Форматирование даты
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min. ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} h. ago`;
    
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Session History</h2>
        <button
          style={styles.newButton}
          onClick={onCreateNewSession}
        >
          + New session
        </button>
      </div>
      
      <div style={styles.sessionsList}>
        {sessions.length === 0 ? (
          <div style={styles.emptyState}>
            No saved sessions
          </div>
        ) : (
          sessions.map(session => (
            <div
              key={session.id}
              style={{
                ...styles.sessionItem,
                ...(session.id === activeSessionId ? styles.activeSession : {})
              }}
              onClick={() => onSelectSession(session.id)}
            >
              <div style={styles.sessionContent}>
                <div style={styles.sessionHeader}>
                  <span style={styles.sessionDate}>
                    {formatDate(session.last_activity)}
                  </span>
                  <button
                    style={styles.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    title="Delete session"
                  >
                    ✕
                  </button>
                </div>
                
                <div style={styles.sessionSummary}>
                  {session.summary?.summary ? (
                    session.summary.summary
                  ) : (
                    <span style={styles.noSummary}>Summary not created</span>
                  )}
                </div>
                
                {session.summary?.key_topics && session.summary.key_topics.length > 0 && (
                  <div style={styles.topicsList}>
                    {session.summary.key_topics.slice(0, 3).map((topic, index) => (
                      <span key={index} style={styles.topicTag}>
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
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
  } as CSSProperties,
  
  header: {
    padding: '16px',
    borderBottom: '1px solid #4b5563',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as CSSProperties,
  
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#fff',
  } as CSSProperties,
  
  newButton: {
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  } as CSSProperties,
  
  sessionsList: {
    overflowY: 'auto',
    flex: 1,
    padding: '8px',
  } as CSSProperties,
  
  emptyState: {
    padding: '16px',
    textAlign: 'center',
    color: '#9ca3af',
    fontStyle: 'italic',
  } as CSSProperties,
  
  sessionItem: {
    background: '#23272A',
    borderRadius: '6px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderLeft: '3px solid transparent',
  } as CSSProperties,
  
  activeSession: {
    borderLeftColor: '#3b82f6',
    background: '#2d3748',
  } as CSSProperties,
  
  sessionContent: {
    padding: '12px',
  } as CSSProperties,
  
  sessionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  } as CSSProperties,
  
  sessionDate: {
    fontSize: '12px',
    color: '#9ca3af',
  } as CSSProperties,
  
  deleteButton: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '2px 6px',
    borderRadius: '4px',
    transition: 'all 0.2s',
  } as CSSProperties,
  
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
  } as CSSProperties,
  
  noSummary: {
    fontStyle: 'italic',
    color: '#9ca3af',
  } as CSSProperties,
  
  topicsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  } as CSSProperties,
  
  topicTag: {
    background: '#4b5563',
    color: '#e5e7eb',
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '4px',
    display: 'inline-block',
  } as CSSProperties,
};

export default SessionsList; 