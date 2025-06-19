import React, { useState, useEffect } from 'react';
import { Message, Notification as NotificationType, MessageType, ChatSession } from './types';
import ChatLayout from './components/ChatLayout';
import Notification from './components/Notification';
import { formatTime, getRelevanceColor, getRandom } from './utils/stringUtils';
import { logDebug, initLogger } from './utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { API_URL } from './constants/config';
import ChatHeader from './components/ChatHeader';
import SessionsList from './components/SessionsList';
import Settings from './components/Settings';
import { loaderPhrases, copyPhrases, defaultSettings } from './constants/phrases';

// Инициализация логгера и очистка истории при запуске
initLogger();

function getHistory(): Message[] {
  logDebug('data', 'Получение истории сообщений из localStorage');
  try {
    const history = JSON.parse(localStorage.getItem('chat_history') || '[]');
    logDebug('success', `Загружено ${history.length} сообщений из истории`);
    return history;
  } catch (e) {
    logDebug('error', 'Ошибка при чтении истории сообщений', e);
    return [];
  }
}

function saveHistory(history: Message[]) {
  logDebug('data', `Сохранение ${history.length} сообщений в localStorage`);
  localStorage.setItem('chat_history', JSON.stringify(history));
}

function getDefaultBotMessage(): Message {
  return {
    role: MessageType.BOT,
    content: 'Привет! Я помогу вам быстро понять требования European Accessibility Act. Задайте вопрос или уточните пару деталей о компании — и я подскажу, что делать.',
    ts: Date.now(),
    suggestions: [
      'Веб-сервис в ЕС — подпадаём ли мы под EAA?',
      'Какой штраф за недоступное мобильное приложение?',
      'С чего начать аудит доступности?',
      'Мы продаём SaaS в Германии — что требует EAA?',
      'Мой бизнес в сфере —'
    ]
  };
}

// Получение или генерация идентификатора пользователя
function getUserId(): string {
  const userId = localStorage.getItem('user_id');
  if (userId) {
    return userId;
  }
  const newUserId = uuidv4();
  localStorage.setItem('user_id', newUserId);
  logDebug('info', `Сгенерирован новый userId: ${newUserId}`);
  return newUserId;
}

/**
 * Функция для санитации ответа от сервера перед обновлением state
 * Предотвращает проблемы с [object Object] и другими неправильными форматами
 */
function sanitizeResponse(data: any): any {
  // Рекурсивная функция для обхода объекта и преобразования всех значений
  function sanitizeValue(value: any): any {
    // Если значение - массив, обрабатываем каждый элемент
    if (Array.isArray(value)) {
      return value.map(item => sanitizeValue(item));
    }
    
    // Если значение - объект, обрабатываем его свойства
    if (value !== null && typeof value === 'object') {
      const result: Record<string, any> = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          result[key] = sanitizeValue(value[key]);
        }
      }
      return result;
    }
    
    // Если значение - строка, возвращаем как есть
    if (typeof value === 'string') {
      return value;
    }
    
    // Для других типов (числа, булевы, null, undefined) - преобразуем в строку, если это не null или undefined
    return value !== null && value !== undefined ? String(value) : value;
  }
  
  // Начинаем обход с корневого объекта
  if (data !== null && typeof data === 'object') {
    return sanitizeValue(data);
  }
  
  return data;
}

export default function App() {
  // Основное состояние приложения
  const [messages, setMessages] = useState<Message[]>(() => {
    const history = getHistory();
    if (history.length === 0) {
      // Инициализируем временным сообщением-заглушкой, заменим после загрузки приветствия
      return [];
    }
    return history;
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Настройки приложения
  const [datasetId, setDatasetId] = useState(defaultSettings.datasetId);
  const [similarityThreshold, setSimilarityThreshold] = useState(defaultSettings.threshold);
  const [maxChunks, setMaxChunks] = useState(defaultSettings.maxChunks);
  
  // Для лоадер-фразы и уведомлений
  const [loaderPhrase, setLoaderPhrase] = useState(getRandom(loaderPhrases));
  const [notification, setNotification] = useState<NotificationType>({ 
    message: '', type: 'info', visible: false 
  });
  
  // Состояние для управления сессиями
  const [userId] = useState<string>(getUserId);
  const [sessionId, setSessionId] = useState<string>(() => {
    const savedSessionId = localStorage.getItem('current_session_id');
    return savedSessionId || uuidv4();
  });
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isProactiveAgentEnabled, setIsProactiveAgentEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('isProactiveAgentEnabled');
    return saved !== null ? JSON.parse(saved) : true; // По умолчанию включен
  });
  
  // Обновляем фразу загрузки при изменении состояния loading
  useEffect(() => {
    if (loading) setLoaderPhrase(getRandom(loaderPhrases));
  }, [loading]);

  // Сохраняем сообщения в localStorage при изменении
  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  // Сохраняем настройки в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('dataset_id', datasetId);
    localStorage.setItem('similarity_threshold', similarityThreshold.toString());
    localStorage.setItem('max_chunks', maxChunks.toString());
  }, [datasetId, similarityThreshold, maxChunks]);
  
  // Сохраняем текущую сессию в localStorage
  useEffect(() => {
    localStorage.setItem('current_session_id', sessionId);
    logDebug('info', `Установлена текущая сессия: ${sessionId}`);
  }, [sessionId]);

  useEffect(() => {
    localStorage.setItem('isProactiveAgentEnabled', JSON.stringify(isProactiveAgentEnabled));
  }, [isProactiveAgentEnabled]);
  
  // Загружаем список сессий при монтировании компонента
  useEffect(() => {
    fetchSessions();
  }, [userId]); // Добавляем userId в зависимости, чтобы сессии загружались при его изменении
  
  // Загружаем персонализированное приветствие и подсказки
  useEffect(() => {
    const fetchWelcome = async () => {
      try {
        const response = await fetch(`${API_URL.replace('/ask', '')}/welcome/${userId}`);
        if (!response.ok) throw new Error('Failed welcome');
        const data = await response.json();

        const greetingMsg: Message = {
          role: MessageType.BOT,
          content: data.greeting || 'Привет! Давайте поговорим о European Accessibility Act.',
          ts: Date.now()
        };

        const suggestionsArr: string[] = Array.isArray(data.suggestions) ? data.suggestions.slice(0, 3) : [];

        const suggestionsMsg: Message | null = suggestionsArr.length > 0 ? {
          role: MessageType.BOT,
          content: '',
          ts: Date.now() + 1,
          suggestions: suggestionsArr
        } : null;

        setMessages([greetingMsg, ...(suggestionsMsg ? [suggestionsMsg] : [])]);
      } catch (e) {
        console.error('Ошибка загрузки приветствия:', e);
        // Фолбэк на статичное сообщение
        setMessages([getDefaultBotMessage()]);
      }
    };

    // Выполняем загрузку, только если история пуста
    if (getHistory().length === 0) {
      fetchWelcome();
    }
  }, [userId]);
  
  // Функция для загрузки списка сессий с сервера
  const fetchSessions = async () => {
    try {
      logDebug('info', `Загрузка списка сессий для пользователя ${userId}`);
      const response = await fetch(`${API_URL.replace('/ask', '')}/chat/sessions/${userId}`);
      if (!response.ok) {
        throw new Error('Error loading sessions');
      }
      const data = await response.json();
      setSessions(data);
      logDebug('success', `Загружено ${data.length} сессий`);
    } catch (error) {
      logDebug('error', 'Ошибка при загрузке списка сессий', error);
      showNotification('Не удалось загрузить список сессий', 'error');
    }
  };
  
  // Функция для загрузки сообщений конкретной сессии
  const loadSession = async (newSessionId: string) => {
    try {
      logDebug('info', `Загрузка сообщений для сессии ${newSessionId}`);
      setLoading(true);
      
      const response = await fetch(`${API_URL.replace('/ask', '')}/chat/messages/${newSessionId}`);
      if (!response.ok) {
        throw new Error('Error loading session messages');
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        // Если сессия пустая, добавляем приветственное сообщение
        setMessages([getDefaultBotMessage()]);
      } else {
        setMessages(data);
      }
      
      setSessionId(newSessionId);
      setShowSessions(false);
      showNotification('Сессия загружена', 'success');
      logDebug('success', `Загружено ${data.length} сообщений из сессии ${newSessionId}`);
    } catch (error) {
      logDebug('error', 'Ошибка при загрузке сообщений сессии', error);
      showNotification('Не удалось загрузить сообщения сессии', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Функция для создания новой сессии
  const createNewSession = () => {
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    setMessages([getDefaultBotMessage()]);
    setShowSessions(false);
    showNotification('Создана новая сессия', 'success');
    logDebug('info', `Создана новая сессия с ID: ${newSessionId}`);
  };
  
  // Функция для удаления сессии
  const deleteSession = async (id: string) => {
    try {
      logDebug('info', `Удаление сессии ${id}`);
      
      const response = await fetch(`${API_URL.replace('/ask', '')}/chat/sessions/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Error deleting session');
      }
      
      // Обновляем список сессий
      fetchSessions();
      
      // Если удалили текущую сессию, создаем новую
      if (id === sessionId) {
        createNewSession();
      }
      
      showNotification('Сессия удалена', 'success');
    } catch (error) {
      logDebug('error', 'Ошибка при удалении сессии', error);
      showNotification('Не удалось удалить сессию', 'error');
    }
  };

  // Функция для отображения уведомлений
  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warn' = 'info') => {
    setNotification({ message, type, visible: true });
    logDebug(type, message);
  };

  // Закрытие уведомления
  const closeNotification = () => {
    setNotification((prev: NotificationType) => ({ ...prev, visible: false }));
  };

  // Отправка сообщения
  const sendMessage = async (inputText: string) => {
    if (!inputText.trim() || loading) return;
    
    const userMsg: Message = { role: MessageType.USER, content: inputText, ts: Date.now() };
    const botMsgPlaceholder: Message = { role: MessageType.BOT, content: '...', ts: Date.now() };
    
    setMessages((msgs: Message[]) => [...msgs, userMsg, botMsgPlaceholder]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMsg.content,
          dataset_id: datasetId,
          similarity_threshold: similarityThreshold,
          max_chunks: maxChunks,
          user_id: userId,
          session_id: sessionId,
          stream: true // Мы всегда предпочитаем стриминг
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(`Server error: ${res.status} - ${errorData.message || 'Unknown error'}`);
      }
      
      if (!res.body) {
        throw new Error('Response body is missing');
      }

      const contentType = res.headers.get('content-type') || '';
      
      // =================================================================
      // УНИВЕРСАЛЬНЫЙ ОБРАБОТЧИК: JSON ИЛИ STREAM
      // =================================================================

      // СЦЕНАРИЙ 1: Сервер вернул обычный JSON (например, для простых запросов или мульти-вопросов)
      if (contentType.includes('application/json')) {
        const data = await res.json();
        
        const finalBotMsg = {
          role: MessageType.BOT,
          ts: Date.now(),
          ...data,
          // Преобразуем 'answer' в 'content' для совместимости с MessageBubble
          content: data.answer || data.content || data.results || 'Ответ получен',
        };

        setMessages((msgs: Message[]) => {
          const newMsgs = [...msgs];
          newMsgs[newMsgs.length - 1] = finalBotMsg;
          return newMsgs;
        });

      } 
      // СЦЕНАРИЙ 2: Сервер вернул потоковый ответ
      else if (contentType.includes('text/event-stream')) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        
        let fullContent = '';
        let metadata: any = {};
        let isMultiAnswer = false;
        let multiAnswerAcc: any = { answers: [], performance: {}, suggestions: [], clarificationQuestions: [] };

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
        
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                // Обработка различных типов событий
                if (data.type === 'done') {
                  break;
                } else if (data.type === 'new_answer') {
                  // Множественные ответы
                  if (!isMultiAnswer) {
                    isMultiAnswer = true;
                    setMessages((msgs: Message[]) => {
                      const newMsgs = [...msgs];
                      newMsgs[newMsgs.length - 1] = {
                        ...newMsgs[newMsgs.length - 1],
                        isMulti: true,
                        content: '',
                        answers: [],
                      };
                      return newMsgs;
                    });
                  }
                  multiAnswerAcc.answers.push(data.content);
                } else if (data.type === 'meta' && data.content) {
                  // Метаданные
                  metadata = { ...metadata, ...data.content };
                  if (isMultiAnswer) {
                    multiAnswerAcc = { ...multiAnswerAcc, ...data.content };
                  }
                } else if (data.chunk || data.content) {
                  // Обычный контент - накапливаем
                  const content = data.chunk || data.content;
                  fullContent += content;
                }
                
                // Обновляем UI
                setMessages((msgs: Message[]) => {
                  const newMsgs = [...msgs];
                  const lastMsgIndex = newMsgs.length - 1;
                  
                  if (newMsgs[lastMsgIndex]?.role === MessageType.BOT) {
                    if (isMultiAnswer) {
                      // Множественные ответы
                      newMsgs[lastMsgIndex] = {
                        ...newMsgs[lastMsgIndex],
                        answers: [...multiAnswerAcc.answers],
                        performance: multiAnswerAcc.performance,
                        suggestions: multiAnswerAcc.clarificationQuestions,
                        suggestions_header: multiAnswerAcc.suggestions_header,
                      };
                    } else {
                      // Обычный ответ
                      newMsgs[lastMsgIndex] = {
                        ...newMsgs[lastMsgIndex],
                        content: fullContent,
                        ...metadata,
                      };
                    }
                  }
                  return newMsgs;
                });

              } catch (e) {
                console.error('Error parsing stream event:', line, e);
              }
            }
          }
        }
      } else {
        throw new Error(`Unsupported content type: ${contentType}`);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg: Message = { 
        role: MessageType.BOT, 
        content: `Произошла ошибка: ${error instanceof Error ? error.message : 'Unknown error'}. Пожалуйста, попробуйте еще раз.`, 
        ts: Date.now() 
      };
      setMessages((msgs: Message[]) => {
          const newMsgs = [...msgs];
          if (newMsgs[newMsgs.length - 1]?.role === MessageType.BOT) {
            newMsgs[newMsgs.length - 1] = errorMsg;
          } else {
            newMsgs.push(errorMsg);
          }
          return newMsgs;
      });
    } finally {
      setLoading(false);
      await fetchSessions();
    }
  };
  
  // Обработчик для выбора предложенного вопроса
  const handleSuggestedQuestion = (question: string) => {
    logDebug('event', 'Выбран предложенный вопрос:', question);
    
    // Проверяем, заканчивается ли вопрос на дефис (незавершенный шаблон)
    if (question.trim().endsWith('-')) {
      // Помещаем в поле ввода вместо отправки
      setInput(question + ' ');
      logDebug('info', 'Шаблон помещен в поле ввода для завершения пользователем');
    } else {
      // Обычный вопрос - отправляем сразу
      sendMessage(question);
    }
  };
  
  // Очистка истории сообщений
  const clearHistory = () => {
    logDebug('event', 'Очистка истории сообщений');
    setMessages([getDefaultBotMessage()]);
    saveHistory([getDefaultBotMessage()]);
    showNotification('История чата очищена', 'info');
  };
  
  // Обработка копирования текста
  const handleCopy = (text: string) => {
    logDebug('event', `Копирование текста длиной ${text.length} символов`);
    navigator.clipboard.writeText(text)
      .then(() => {
        showNotification(getRandom(copyPhrases), 'success');
        logDebug('success', 'Текст скопирован в буфер обмена');
      })
      .catch(err => {
        showNotification('Не удалось скопировать текст', 'error');
        logDebug('error', 'Ошибка при копировании в буфер обмена:', err);
      });
  };
  
  // Переключение видимости панели сессий
  const toggleSessions = () => {
    setShowSessions(!showSessions);
    if (!showSessions) {
      // Обновляем список сессий при открытии панели
      fetchSessions();
    }
  };
  
  // Переключение видимости настроек
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };
  
  return (
    <div>
      {notification.visible && (
        <Notification 
          notification={notification}
          onClose={closeNotification} 
        />
      )}
      
      <div style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#1e2124',
        color: '#ffffff',
      }}>
        <ChatHeader 
          onToggleSettings={toggleSettings}
          onToggleHistory={toggleSessions}
          onCreateNewSession={createNewSession}
        />
  
        <main style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        }}>
          {showSettings && (
            <Settings 
              datasetId={datasetId}
              setDatasetId={setDatasetId}
              similarityThreshold={similarityThreshold}
              setSimilarityThreshold={setSimilarityThreshold}
              maxChunks={maxChunks}
              setMaxChunks={setMaxChunks}
              clearHistory={clearHistory}
              isProactiveAgentEnabled={isProactiveAgentEnabled}
              setIsProactiveAgentEnabled={setIsProactiveAgentEnabled}
            />
          )}
          
          {showSessions && (
            <SessionsList 
              sessions={sessions}
              activeSessionId={sessionId}
              onSelectSession={loadSession}
              onDeleteSession={deleteSession}
              onCreateNewSession={createNewSession}
            />
          )}
          
          <ChatLayout 
            messages={messages}
            loading={loading}
            onSendMessage={sendMessage}
            onCopy={handleCopy}
            onSelectSuggestion={handleSuggestedQuestion}
            loaderPhrase={loaderPhrase}
            input={input}
            setInput={setInput}
            userId={userId}
            sessionId={sessionId}
            isProactiveAgentEnabled={isProactiveAgentEnabled}
          />
        </main>
      </div>
    </div>
  );
}
