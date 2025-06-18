import React, { CSSProperties } from 'react';

interface ChatHeaderProps {
  onToggleSettings: () => void;
  onToggleHistory: () => void;
  onCreateNewSession: () => void;
  showHistoryButton?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  onToggleSettings,
  onToggleHistory,
  onCreateNewSession,
  showHistoryButton = true,
}) => {
  return (
    <header style={styles.header}>
      <h1 style={styles.title}>EAA Chatbot</h1>
      <div style={styles.buttons}>
        {showHistoryButton && (
          <button 
            style={styles.button} 
            onClick={onToggleHistory}
            title="Chat history"
          >
            <span style={styles.icon}>📋</span> Chat history
          </button>
        )}
        <button 
          style={styles.button} 
          onClick={onCreateNewSession}
          title="Create new session"
        >
          <span style={styles.icon}>✨</span> Create new session
        </button>
        <button 
          style={styles.button} 
          onClick={onToggleSettings}
          title="Settings"
        >
          <span style={styles.icon}>⚙️</span> Settings
        </button>
      </div>
    </header>
  );
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
  } as CSSProperties,
  
  title: {
    margin: 0,
    fontSize: '18px',
    color: '#fff',
    fontWeight: 'bold',
  } as CSSProperties,
  
  buttons: {
    display: 'flex',
    gap: '10px',
  } as CSSProperties,
  
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
  } as CSSProperties,
  
  icon: {
    fontSize: '16px',
  } as CSSProperties,
};

export default ChatHeader; 