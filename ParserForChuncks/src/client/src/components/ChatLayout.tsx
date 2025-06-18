import React, { useRef, useEffect, CSSProperties, useState } from 'react';
import { Rnd } from 'react-rnd';
import { Message } from '../types';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { formatTime, getRelevanceColor } from '../utils/stringUtils';
import WhisperInput from './voice-interface/WhisperInput';
import LoadingIndicator from './LoadingIndicator';

interface ChatLayoutProps {
  messages: Message[];
  loading: boolean;
  onSendMessage: (message: string) => void;
  onCopy: (text: string) => void;
  onSelectSuggestion: (question: string) => void;
  loaderPhrase: string;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  userId: string;
  sessionId: string;
  isProactiveAgentEnabled: boolean;
}

/**
 * Component for displaying the overall chat structure
 */
const ChatLayout: React.FC<ChatLayoutProps> = ({
  messages,
  loading,
  onSendMessage,
  onCopy,
  onSelectSuggestion,
  loaderPhrase,
  input,
  setInput,
  userId,
  sessionId,
  isProactiveAgentEnabled
}) => {
  const chatRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: '80rem', height: '90vh' });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Load saved size and position on mount
  useEffect(() => {
    const savedSize = localStorage.getItem('chat-window-size');
    const savedPosition = localStorage.getItem('chat-window-position');
    if (savedSize) {
      setSize(JSON.parse(savedSize));
    }
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition));
    }

    // Center window if position not saved
    if (!savedPosition) {
      const initialX = (window.innerWidth - 1280) / 2; // 80rem approx
      const initialY = (window.innerHeight * 0.05); // 90vh, 5% from top
      setPosition({ x: initialX > 0 ? initialX : 0, y: initialY > 0 ? initialY : 0 });
    }
  }, []);

  // Save size and position
  const handleSaveLayout = () => {
    localStorage.setItem('chat-window-size', JSON.stringify(size));
    localStorage.setItem('chat-window-position', JSON.stringify(position));
    alert('Window position and size saved!');
  };

  // Scroll to last message when new one is added
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({ 
        top: chatRef.current.scrollHeight, 
        behavior: 'smooth' 
      });
    }
  }, [messages]);

  return (
    <Rnd
      size={size}
      position={position}
      onDragStop={(e, d) => { setPosition({ x: d.x, y: d.y }) }}
      onResizeStop={(e, direction, ref, delta, position) => {
        setSize({
          width: ref.style.width,
          height: ref.style.height,
        });
        setPosition(position);
      }}
      minWidth={400}
      minHeight={500}
      bounds="window"
      dragHandleClassName="drag-handle"
      style={{
        background: '#23272A',
        borderRadius: '1rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      } as CSSProperties}
    >
      <div className="drag-handle" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 'calc(100% - 100px)', // Don't capture save button
        height: '40px',
        cursor: 'move',
        zIndex: 1
      }}></div>
      <button 
        onClick={handleSaveLayout}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 2,
          padding: '5px 10px',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        } as CSSProperties}
      >
        Save
      </button>

      {/* Messages */}
      <div 
        ref={chatRef} 
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          marginTop: '40px', // Margin for drag-handle
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        } as CSSProperties}
      >
        {messages.length === 0 && (
          <div style={{
            color: '#9ca3af',
            textAlign: 'center',
          } as CSSProperties}>
            No messages
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div
            key={msg.ts + '-' + i}
            style={{ 
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            } as CSSProperties}
          >
            {msg.role === 'bot' && (
              <div style={{ 
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                background: '#4b5563',
                margin: '0 0.5rem',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              } as CSSProperties}>
                <img 
                  src="/bot_avatar.png" 
                  alt="Bot" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    borderRadius: '50%', 
                    objectFit: 'cover' 
                  } as CSSProperties} 
                />
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <MessageBubble 
                message={msg}
                onCopy={onCopy}
                formatTime={formatTime}
                getRelevanceColor={getRelevanceColor}
                onSelectSuggestion={onSelectSuggestion}
              />
              
              {/* Show LoadingIndicator only for the last bot message during loading */}
              {msg.role === 'bot' && loading && i === messages.length - 1 && (
                <LoadingIndicator loading={loading} messages={messages} />
              )}
            </div>
            
            {msg.role === 'user' && (
              <div style={{ 
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                background: '#3b82f6',
                margin: '0 0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
              } as CSSProperties}>
                🧑
              </div>
            )}
          </div>
        ))}
        
        {/* Показываем LoadingIndicator, если нет сообщений бота, но идет загрузка */}
        {loading && (messages.length === 0 || messages[messages.length - 1]?.role !== 'bot') && (
          <div style={{ 
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
          } as CSSProperties}>
            <div style={{ 
              width: '2rem',
              height: '2rem',
              borderRadius: '50%',
              background: '#4b5563',
              margin: '0 0.5rem',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            } as CSSProperties}>
              <img 
                src="/bot_avatar.png" 
                alt="Bot" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: '50%', 
                  objectFit: 'cover' 
                } as CSSProperties} 
              />
            </div>
            <LoadingIndicator loading={loading} messages={messages} />
          </div>
        )}
      </div>
      
      {/* Поле ввода */}
      <div style={{
        borderTop: '1px solid #333',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '1rem',
        background: '#202225'
      }}>
        <div style={{ flex: 1 }}>
          <ChatInput 
            onSendMessage={onSendMessage} 
            loading={loading}
            input={input}
            setInput={setInput}
          />
        </div>
        <WhisperInput 
          onTranscriptReceived={(transcript) => {
            setInput(prevInput => `${prevInput}${prevInput ? ' ' : ''}${transcript}`);
          }}
          disabled={loading}
          userId={userId}
          sessionId={sessionId}
          currentInput={input}
          isProactiveAgentEnabled={isProactiveAgentEnabled}
        />
      </div>
    </Rnd>
  );
};

export default ChatLayout;
