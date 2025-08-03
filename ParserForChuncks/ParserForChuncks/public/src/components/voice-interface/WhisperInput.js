import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Lightbulb, X } from 'lucide-react';
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
const WhisperInput = ({ onTranscriptReceived, onSuggestionContextUpdated, messageSentTrigger, disabled, userId, sessionId, currentInput, isProactiveAgentEnabled }) => {
    const [status, setStatus] = useState('idle');
    const [suggestions, setSuggestions] = useState([]);
    const [lastInputLength, setLastInputLength] = useState(0);
    const [suggestionCount, setSuggestionCount] = useState(0); // Счетчик подсказок
    const [maxSuggestions] = useState(2); // Максимум 2 подсказки для одного запроса
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const suggestionTimerRef = useRef(null);
    // Сброс счетчика подсказок при изменении messageSentTrigger (отправке сообщения)
    useEffect(() => {
        if (messageSentTrigger && messageSentTrigger > 0) {
            setSuggestionCount(0);
            setSuggestions([]);
            console.log('🔄 [WhisperInput] Suggestion counter reset due to message sent');
        }
    }, [messageSentTrigger]);
    // Отслеживание изменений длины ввода
    useEffect(() => {
        setLastInputLength(currentInput.length);
    }, [currentInput]);
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
        console.log('🎤 [WhisperInput] Попытка начать запись, status:', status, 'disabled:', disabled);
        if (status !== 'idle' || disabled) {
            console.log('🎤 [WhisperInput] Запись заблокирована - неправильный статус или отключена');
            return;
        }
        try {
            console.log('🎤 [WhisperInput] Запрос доступа к микрофону...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('🎤 [WhisperInput] Доступ к микрофону получен');
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
                    if (!response.ok)
                        throw new Error('Transcription error');
                    const result = await response.json();
                    const newTranscript = result.transcript;
                    onTranscriptReceived(newTranscript);
                    // 2. После получения транскрипции, запускаем проактивный анализ (если включено)
                    if (isProactiveAgentEnabled) {
                        analyzeProactively(newTranscript);
                    }
                }
                catch (error) {
                    console.error('Error sending audio to server:', error);
                }
                finally {
                    setStatus('idle');
                    stream.getTracks().forEach(track => track.stop());
                }
            };
            audioChunksRef.current = [];
            console.log('🎤 [WhisperInput] Начинаем запись...');
            mediaRecorderRef.current.start();
            setStatus('recording');
            console.log('🎤 [WhisperInput] Статус изменен на recording');
            // Подсказки не сбрасываем при записи, они остаются для истории
        }
        catch (error) {
            console.error('🎤 [WhisperInput] Ошибка доступа к микрофону:', error);
            setStatus('idle');
        }
    };
    const analyzeProactively = async (transcript) => {
        // Проверяем, не превысили ли мы лимит подсказок
        if (suggestionCount >= maxSuggestions) {
            console.log('🔄 [ProactiveAgent] Reached maximum suggestions limit, skipping analysis');
            return;
        }
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
                        const newSuggestion = {
                            id: Date.now().toString(),
                            text: data.suggestion,
                            timestamp: Date.now(),
                            isActive: true
                        };
                        // Возвращаем массив с ОДНОЙ актуальной подсказкой
                        return [newSuggestion];
                    });
                    // Увеличиваем счетчик подсказок
                    setSuggestionCount(prev => prev + 1);
                    // Передаем контекст подсказки в родительский компонент
                    if (onSuggestionContextUpdated) {
                        onSuggestionContextUpdated(data.suggestion);
                    }
                }
            }
        }
        catch (error) {
            console.error('Ошибка проактивного анализа:', error);
        }
    };
    const handleStopRecording = () => {
        console.log('🎤 [WhisperInput] Остановка записи, mediaRecorder:', !!mediaRecorderRef.current, 'status:', status);
        if (mediaRecorderRef.current && status === 'recording') {
            console.log('🎤 [WhisperInput] Останавливаем MediaRecorder');
            mediaRecorderRef.current.stop();
        }
        else {
            console.log('🎤 [WhisperInput] Не удалось остановить запись - неправильное состояние');
        }
    };
    const renderIcon = () => {
        switch (status) {
            case 'recording':
                // Анимация "дыхания" теперь на самой кнопке, иконка остается статичной для чистоты
                return _jsx(MicOff, { size: 24, style: { color: 'white' } });
            case 'transcribing':
                // Новая стильная волновая анимация
                return (_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }, children: [_jsx("span", { style: { position: 'absolute', left: '-9999px' }, children: "\u041E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430..." }), _jsx("div", { style: {
                                width: '3px',
                                backgroundColor: '#93c5fd',
                                borderRadius: '2px',
                                height: '12px',
                                animation: 'wave-animation-1 1.2s infinite ease-in-out'
                            } }), _jsx("div", { style: {
                                width: '3px',
                                backgroundColor: '#93c5fd',
                                borderRadius: '2px',
                                height: '16px',
                                animation: 'wave-animation-2 1.2s infinite ease-in-out 0.1s'
                            } }), _jsx("div", { style: {
                                width: '3px',
                                backgroundColor: '#93c5fd',
                                borderRadius: '2px',
                                height: '8px',
                                animation: 'wave-animation-3 1.2s infinite ease-in-out 0.2s'
                            } }), _jsx("div", { style: {
                                width: '3px',
                                backgroundColor: '#93c5fd',
                                borderRadius: '2px',
                                height: '14px',
                                animation: 'wave-animation-4 1.2s infinite ease-in-out 0.3s'
                            } }), _jsx("div", { style: {
                                width: '3px',
                                backgroundColor: '#93c5fd',
                                borderRadius: '2px',
                                height: '10px',
                                animation: 'wave-animation-5 1.2s infinite ease-in-out 0.4s'
                            } })] }));
            case 'idle':
            default:
                return _jsx(Mic, { size: 24, style: { color: '#9ca3af' } });
        }
    };
    const handleClick = () => {
        console.log('🎤 [WhisperInput] Кнопка нажата, status:', status, 'disabled:', disabled);
        if (disabled) {
            console.log('🎤 [WhisperInput] Кнопка отключена, игнорируем нажатие');
            return;
        }
        if (status === 'idle') {
            console.log('🎤 [WhisperInput] Начинаем запись...');
            handleStartRecording();
        }
        else {
            console.log('🎤 [WhisperInput] Останавливаем запись...');
            handleStopRecording();
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx("style", { children: animationStyle }), _jsxs("div", { style: { position: 'relative', display: 'flex', alignItems: 'center' }, children: [_jsx("button", { onClick: handleClick, disabled: disabled, className: status === 'recording' ? 'recording-button-animation' : '', style: {
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
                        }, title: status === 'recording' ? 'Stop recording' : 'Voice input', children: renderIcon() }), suggestions.length > 0 && (_jsx("div", { style: { position: 'fixed', bottom: '120px', right: '20px', zIndex: 9999 }, children: suggestions.map((suggestion, index) => {
                            const isActive = suggestion.isActive;
                            // Активная подсказка всегда видна, неактивные имеют уменьшенную прозрачность
                            const opacity = isActive ? 1 : Math.max(0.4, 1 - (suggestions.length - index - 1) * 0.1);
                            const bottomOffset = index * 110; // Увеличенное расстояние между подсказками (избегаем наложения)
                            // Если сейчас идет запись, делаем все подсказки слегка прозрачными
                            const recordingOpacity = status === 'recording' ? 0.7 : 1;
                            return (_jsxs("div", { className: `voice-input-suggestion ${isActive ? 'active' : 'inactive'} ${status === 'recording' ? 'recording' : ''}`, style: {
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
                                }, children: [_jsx(Lightbulb, { size: 18, style: {
                                            marginTop: '2px',
                                            flexShrink: 0,
                                            opacity: isActive ? 1 : 0.7
                                        } }), _jsx("span", { style: {
                                            lineHeight: '1.4',
                                            wordWrap: 'break-word',
                                            whiteSpace: 'normal',
                                            flex: 1,
                                            opacity: isActive ? 1 : 0.8
                                        }, children: suggestion.text }), _jsx("button", { onClick: () => setSuggestions(prev => prev.filter(s => s.id !== suggestion.id)), style: {
                                            background: 'transparent',
                                            border: 'none',
                                            width: '32px',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                            marginTop: '1px',
                                            opacity: 1,
                                            transition: 'all 0.2s ease'
                                        }, title: "Close this suggestion", onMouseEnter: (e) => {
                                            e.currentTarget.style.transform = 'scale(1.2)';
                                        }, onMouseLeave: (e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }, children: _jsx(X, { size: 28, color: "#000000", strokeWidth: 5, style: { filter: 'drop-shadow(0 2px 4px rgba(255,255,255,0.8)) drop-shadow(0 0 2px rgba(255,255,255,1))' } }) })] }, suggestion.id));
                        }) }))] })] }));
};
export default WhisperInput;
