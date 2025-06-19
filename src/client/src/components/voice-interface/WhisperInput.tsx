import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Send, Lightbulb, X } from 'lucide-react';

// Стиль для анимации. Добавлен прямо в компонент для простоты.
const animationStyle = `
  @keyframes breathing-animation {
    0% {
      transform: scale(1);
      box-shadow: 0 0 10px rgba(220, 38, 38, 0.4);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 0 25px rgba(220, 38, 38, 0.7);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 10px rgba(220, 38, 38, 0.4);
    }
  }

  .recording-button-animation {
    animation: breathing-animation 2s infinite ease-in-out;
  }

  @keyframes wave-animation-1 {
    0%, 100% { height: 12px; }
    50% { height: 20px; }
  }
  
  @keyframes wave-animation-2 {
    0%, 100% { height: 16px; }
    50% { height: 24px; }
  }
  
  @keyframes wave-animation-3 {
    0%, 100% { height: 8px; }
    50% { height: 16px; }
  }
  
  @keyframes wave-animation-4 {
    0%, 100% { height: 14px; }
    50% { height: 22px; }
  }
  
  @keyframes wave-animation-5 {
    0%, 100% { height: 10px; }
    50% { height: 18px; }
  }

  .animate-wave-1 { animation: wave-animation-1 1.2s infinite ease-in-out; }
  .animate-wave-2 { animation: wave-animation-2 1.2s infinite ease-in-out 0.1s; }
  .animate-wave-3 { animation: wave-animation-3 1.2s infinite ease-in-out 0.2s; }
  .animate-wave-4 { animation: wave-animation-4 1.2s infinite ease-in-out 0.3s; }
  .animate-wave-5 { animation: wave-animation-5 1.2s infinite ease-in-out 0.4s; }
`;

// Определяем возможные состояния компонента
type RecordingStatus = 'idle' | 'recording' | 'transcribing';

interface WhisperInputProps {
  onTranscriptReceived: (transcript: string) => void;
  disabled: boolean;
  userId: string;
  sessionId: string;
  currentInput: string;
  isProactiveAgentEnabled: boolean;
}

interface Suggestion {
  id: string;
  text: string;
  timestamp: number;
  isActive: boolean;
}

const WhisperInput: React.FC<WhisperInputProps> = ({ onTranscriptReceived, disabled, userId, sessionId, currentInput, isProactiveAgentEnabled }) => {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [lastInputLength, setLastInputLength] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const suggestionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Очищаем все подсказки когда пользователь отправляет сообщение
  useEffect(() => {
    if (currentInput.length < lastInputLength) {
      // Если текст стал короче - значит сообщение отправлено
      setSuggestions([]);
    }
    setLastInputLength(currentInput.length);
  }, [currentInput, lastInputLength]);

  // Автоматическое исчезновение старых подсказок через 30 секунд
  useEffect(() => {
    if (suggestions.length > 0) {
      if (suggestionTimerRef.current) {
        clearTimeout(suggestionTimerRef.current);
      }
      suggestionTimerRef.current = setTimeout(() => {
        setSuggestions(prev => {
          // Удаляем самую старую подсказку
          if (prev.length > 0) {
            return prev.slice(1);
          }
          return prev;
        });
      }, 30000);
    }
    
    return () => {
      if (suggestionTimerRef.current) {
        clearTimeout(suggestionTimerRef.current);
      }
    };
  }, [suggestions]);

  // Ограничение количества подсказок (максимум 5)
  useEffect(() => {
    if (suggestions.length > 5) {
      setSuggestions(prev => prev.slice(-5)); // Оставляем только последние 5
    }
  }, [suggestions.length]);

  const handleStartRecording = async () => {
    if (status !== 'idle' || disabled) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        setStatus('transcribing');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];

        // 1. Отправляем на транскрибацию
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        try {
          const response = await fetch('/api/v1/whisper/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) throw new Error('Transcription error');

          const result = await response.json();
          const newTranscript = result.transcript;
          onTranscriptReceived(newTranscript);

          // 2. После получения транскрипции, запускаем проактивный анализ (если включено)
          if (isProactiveAgentEnabled) {
            analyzeProactively(newTranscript);
          }

        } catch (error) {
          console.error('Ошибка при отправке аудио на сервер:', error);
        } finally {
          setStatus('idle');
          stream.getTracks().forEach(track => track.stop());
        }
      };

      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setStatus('recording');
      // Подсказки не сбрасываем при записи, они остаются для истории
    } catch (error) {
      console.error('Ошибка доступа к микрофону:', error);
      setStatus('idle');
    }
  };

  const analyzeProactively = async (transcript: string) => {
    try {
      const response = await fetch('/api/v1/agent/proactive-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentText: `${currentInput} ${transcript}`.trim(),
          userId,
          sessionId
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.suggestion) {
          // Добавляем новую подсказку и деактивируем предыдущие
          setSuggestions(() => {
            const newSuggestion: Suggestion = {
              id: Date.now().toString(),
              text: data.suggestion,
              timestamp: Date.now(),
              isActive: true
            };
            // Возвращаем массив с ОДНОЙ актуальной подсказкой
            return [newSuggestion];
          });
        }
      }
    } catch (error) {
      console.error('Ошибка проактивного анализа:', error);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const renderIcon = () => {
    switch (status) {
      case 'recording':
        // Анимация "дыхания" теперь на самой кнопке, иконка остается статичной для чистоты
        return <MicOff size={24} style={{ color: 'white' }} />;
      case 'transcribing':
        // Новая стильная волновая анимация
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
            <span style={{ position: 'absolute', left: '-9999px' }}>Обработка...</span>
            <div style={{ 
              width: '3px', 
              backgroundColor: '#93c5fd', 
              borderRadius: '2px',
              height: '12px',
              animation: 'wave-animation-1 1.2s infinite ease-in-out'
            }}></div>
            <div style={{ 
              width: '3px', 
              backgroundColor: '#93c5fd', 
              borderRadius: '2px',
              height: '16px',
              animation: 'wave-animation-2 1.2s infinite ease-in-out 0.1s'
            }}></div>
            <div style={{ 
              width: '3px', 
              backgroundColor: '#93c5fd', 
              borderRadius: '2px',
              height: '8px',
              animation: 'wave-animation-3 1.2s infinite ease-in-out 0.2s'
            }}></div>
            <div style={{ 
              width: '3px', 
              backgroundColor: '#93c5fd', 
              borderRadius: '2px',
              height: '14px',
              animation: 'wave-animation-4 1.2s infinite ease-in-out 0.3s'
            }}></div>
            <div style={{ 
              width: '3px', 
              backgroundColor: '#93c5fd', 
              borderRadius: '2px',
              height: '10px',
              animation: 'wave-animation-5 1.2s infinite ease-in-out 0.4s'
            }}></div>
          </div>
        );
      case 'idle':
      default:
        return <Mic size={24} style={{ color: '#9ca3af' }} />;
    }
  };

  const handleClick = () => {
    if (disabled) return;
    if (status === 'idle') {
      handleStartRecording();
    } else {
      handleStopRecording();
    }
  };

  return (
    <>
      {/* Внедряем стили для анимации */}
      <style>{animationStyle}</style>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <button
          onClick={handleClick}
          disabled={disabled}
          className={status === 'recording' ? 'recording-button-animation' : ''}
          style={{
            backgroundColor: status === 'recording' ? '#dc2626' : (status === 'transcribing' ? '#2563eb' : '#374151'),
            cursor: disabled ? 'not-allowed' : 'pointer',
            padding: '0.75rem',
            borderRadius: '50%',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '3rem',
            minHeight: '3rem',
            transition: 'all 0.2s ease',
            // Убрали boxShadow отсюда, так как он теперь в keyframes анимации
          }}
          title={status === 'recording' ? 'Stop recording' : 'Voice input'}
        >
          {renderIcon()}
        </button>
        
        {suggestions.length > 0 && (
          <div style={{ position: 'fixed', bottom: '120px', right: '20px', zIndex: 9999 }}>
            {suggestions.map((suggestion, index) => {
              const isActive = suggestion.isActive;
              // Активная подсказка всегда видна, неактивные имеют уменьшенную прозрачность
              const opacity = isActive ? 1 : Math.max(0.4, 1 - (suggestions.length - index - 1) * 0.1);
              const bottomOffset = index * 110; // Увеличенное расстояние между подсказками (избегаем наложения)
              
              // Если сейчас идет запись, делаем все подсказки слегка прозрачными
              const recordingOpacity = status === 'recording' ? 0.7 : 1;
              
              return (
                <div 
                  key={suggestion.id}
                  className={`voice-input-suggestion ${isActive ? 'active' : 'inactive'} ${status === 'recording' ? 'recording' : ''}`}
                  style={{
                    position: 'absolute',
                    bottom: `${bottomOffset}px`,
                    right: '0',
                    background: isActive 
                      ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                      : 'linear-gradient(135deg, #6b7280, #4b5563)',
                    color: isActive ? '#1f2937' : '#d1d5db',
                    padding: '1rem 1.25rem',
                    borderRadius: '1rem',
                    fontSize: '0.95rem',
                    fontWeight: isActive ? '600' : '500',
                    maxWidth: '350px',
                    minWidth: '300px',
                    boxShadow: isActive 
                      ? '0 8px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(245, 158, 11, 0.5)'
                      : '0 4px 15px rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    border: isActive 
                      ? '2px solid rgba(245, 158, 11, 0.8)'
                      : '1px solid rgba(107, 114, 128, 0.5)',
                    backdropFilter: 'blur(10px)',
                    opacity: opacity * recordingOpacity,
                    transform: `scale(${isActive ? 1 : 0.95})`,
                    transition: 'all 0.3s ease',
                    zIndex: 9999 - index,
                    // Специальная анимация появления
                    animation: isActive ? 'slideInFromRight 0.4s ease-out' : 'none'
                  }}
                >
                  <Lightbulb 
                    size={18} 
                    style={{ 
                      marginTop: '2px', 
                      flexShrink: 0,
                      opacity: isActive ? 1 : 0.7
                    }} 
                  />
                  <span style={{ 
                    lineHeight: '1.4',
                    wordWrap: 'break-word',
                    whiteSpace: 'normal',
                    flex: 1,
                    opacity: isActive ? 1 : 0.8
                  }}>{suggestion.text}</span>
                  <button
                    onClick={() => setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))}
                    style={{
                      background: isActive ? 'rgba(31, 41, 55, 0.2)' : 'rgba(209, 213, 219, 0.2)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      marginTop: '1px',
                      opacity: isActive ? 1 : 0.6,
                      transition: 'all 0.2s ease'
                    }}
                    title="Close this suggestion"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.background = isActive ? 'rgba(31, 41, 55, 0.4)' : 'rgba(209, 213, 219, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.background = isActive ? 'rgba(31, 41, 55, 0.2)' : 'rgba(209, 213, 219, 0.2)';
                    }}
                  >
                    <X size={14} color={isActive ? '#1f2937' : '#9ca3af'} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default WhisperInput; 