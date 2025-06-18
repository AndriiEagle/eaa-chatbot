/**
 * 🚀 MODERN WHISPER CHAT INTERFACE 2024
 * Революционный чат-интерфейс с интегрированным WHISPER
 * Супер современный дизайн + голосовой ввод + параллельный AI анализ
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import OpenAI from 'openai';
import { 
  Mic, 
  MicOff, 
  Send, 
  Bot, 
  User, 
  Settings,
  Loader2,
  Brain,
  ToggleLeft,
  ToggleRight,
  MessageSquare,
  Volume2,
  Clock
} from 'lucide-react';

// Импорт WHISPER модуля
import { WhisperAdvancedProcessor, ProcessingProgress, VoiceProcessingResult } from '../services/voice-processing/WhisperAdvancedProcessor';
import { PerformanceMonitor } from '../monitoring/performance-metrics/PerformanceMonitor';

interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  isVoiceGenerated?: boolean;
  audioMetadata?: VoiceProcessingResult;
  aiPreAnalysis?: string;
}

interface VoiceState {
  isRecording: boolean;
  isProcessing: boolean;
  audioLevel: number;
  duration: number;
  currentTranscript: string;
  isReadyToSend: boolean;
}

interface ChatSettings {
  enableAutoAnalysis: boolean;
  language: 'ru' | 'en' | 'auto';
  theme: 'light' | 'dark';
  voiceEnabled: boolean;
  realTimeProcessing: boolean;
}

interface ModernWhisperChatProps {
  onSendMessage?: (message: string, metadata?: any) => void;
  onVoiceTranscript?: (transcript: string, metadata?: any) => void;
  disabled?: boolean;
  placeholder?: string;
  chatbotApiEndpoint?: string;
}

const ModernWhisperChatInterface: React.FC<ModernWhisperChatProps> = ({
  onSendMessage,
  onVoiceTranscript,
  disabled = false,
  placeholder = "Enter message or press 🎤 for voice input...",
  chatbotApiEndpoint = "/api/chat"
}) => {
  // Core State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isRecording: false,
    isProcessing: false,
    audioLevel: 0,
    duration: 0,
    currentTranscript: '',
    isReadyToSend: false
  });

  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    enableAutoAnalysis: true,
    language: 'ru',
    theme: 'light',
    voiceEnabled: true,
    realTimeProcessing: true
  });

  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress | null>(null);
  const [aiPreAnalysis, setAiPreAnalysis] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const whisperProcessorRef = useRef<WhisperAdvancedProcessor | null>(null);
  const openaiClientRef = useRef<OpenAI | null>(null);
  const performanceMonitorRef = useRef<PerformanceMonitor | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WHISPER
  useEffect(() => {
    const initializeWhisper = async () => {
      try {
        // Initialize OpenAI client (в реальном проекте - из env)
        openaiClientRef.current = new OpenAI({
          apiKey: process.env.REACT_APP_OPENAI_API_KEY || 'demo-key',
          dangerouslyAllowBrowser: true
        });

        // Initialize Performance Monitor
        performanceMonitorRef.current = new PerformanceMonitor();

        // Initialize WHISPER Processor
        whisperProcessorRef.current = new WhisperAdvancedProcessor(
          openaiClientRef.current,
          performanceMonitorRef.current
        );

        console.log('🎤 WHISPER successfully initialized!');
      } catch (error) {
        console.error('❌ Error initializing WHISPER:', error);
      }
    };

    initializeWhisper();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Recording timer
  useEffect(() => {
    if (voiceState.isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setVoiceState(prev => ({
          ...prev,
          duration: prev.duration + 1
        }));
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [voiceState.isRecording]);

  // START VOICE RECORDING
  const startVoiceRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = handleRecordingStop;

      mediaRecorderRef.current.start(1000); // Collect data every second

      setVoiceState({
        isRecording: true,
        isProcessing: false,
        audioLevel: 0,
        duration: 0,
        currentTranscript: '',
        isReadyToSend: false
      });

      console.log('🎤 Recording started...');
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      alert('Failed to get microphone access. Check permissions.');
    }
  }, []);

  // STOP VOICE RECORDING
  const stopVoiceRecording = useCallback(() => {
    if (mediaRecorderRef.current && voiceState.isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      setVoiceState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: true
      }));

      console.log('⏹️ Recording stopped, starting processing...');
    }
  }, [voiceState.isRecording]);

  // HANDLE RECORDING STOP
  const handleRecordingStop = useCallback(async () => {
    if (audioChunksRef.current.length === 0) {
      console.warn('⚠️ No data to process');
      return;
    }

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    
    try {
      if (!whisperProcessorRef.current) {
        throw new Error('WHISPER processor not initialized');
      }

      // WHISPER processing
      const result = await whisperProcessorRef.current.processLongAudio(
        audioBlob,
        {
          language: chatSettings.language === 'auto' ? undefined : chatSettings.language,
          responseFormat: 'json',
          enableNoiseReduction: true,
          enableVAD: true
        },
        (progress) => {
          setProcessingProgress(progress);
        }
      );

      console.log('✅ WHISPER result:', result);

      // Insert text into input field
      setInputText(result.transcript);
      setVoiceState(prev => ({
        ...prev,
        currentTranscript: result.transcript,
        isProcessing: false,
        isReadyToSend: true
      }));

      // PARALLEL AI ANALYSIS (if enabled)
      if (chatSettings.enableAutoAnalysis) {
        performAutoAnalysis(result.transcript);
      }

      // Callback
      onVoiceTranscript?.(result.transcript, result);

    } catch (error) {
      console.error('❌ WHISPER processing error:', error);
      setVoiceState(prev => ({
        ...prev,
        isProcessing: false
      }));
      alert('Voice processing error. Please try again.');
    }
  }, [chatSettings, onVoiceTranscript]);

  // AUTO ANALYSIS
  const performAutoAnalysis = useCallback(async (transcript: string) => {
    if (!chatbotApiEndpoint) return;

    try {
      console.log('🧠 Starting auto-analysis:', transcript);
      
      const response = await fetch(chatbotApiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: transcript,
          mode: 'pre_analysis',
          settings: {
            quick: true,
            suggest_clarifications: true
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiPreAnalysis(data.response || data.message || '');
        
        // Add system message with analysis
        const analysisMessage: Message = {
          id: Date.now().toString() + '_analysis',
          type: 'system',
          content: `🤖 Auto-analysis: ${data.response || 'Ready to answer your question'}`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, analysisMessage]);
      }
    } catch (error) {
      console.error('❌ Auto-analysis error:', error);
    }
  }, [chatbotApiEndpoint]);

  // SEND MESSAGE
  const sendMessage = useCallback(async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
      isVoiceGenerated: voiceState.isReadyToSend
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputText.trim();
    setInputText('');
    setVoiceState(prev => ({ ...prev, isReadyToSend: false, currentTranscript: '' }));
    setAiPreAnalysis('');

    // Callback
    onSendMessage?.(messageToSend, { isVoiceGenerated: voiceState.isReadyToSend });

    // If no auto-analysis, send regular request
    if (!chatSettings.enableAutoAnalysis && chatbotApiEndpoint) {
      try {
        const response = await fetch(chatbotApiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageToSend,
            mode: 'full_response'
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const botMessage: Message = {
            id: Date.now().toString() + '_bot',
            type: 'bot',
            content: data.response || data.message || 'Received response from bot',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botMessage]);
        }
      } catch (error) {
        console.error('❌ Error sending message:', error);
      }
    }
  }, [inputText, voiceState.isReadyToSend, chatSettings.enableAutoAnalysis, onSendMessage, chatbotApiEndpoint]);

  // TOGGLE SETTINGS
  const toggleAutoAnalysis = () => {
    setChatSettings(prev => ({
      ...prev,
      enableAutoAnalysis: !prev.enableAutoAnalysis
    }));
  };

  // FORMAT TIME
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="modern-whisper-chat">
      {/* HEADER */}
      <div className="chat-header">
        <div className="header-content">
          <div className="title-section">
            <MessageSquare className="title-icon" />
            <h2>AI Chat with WHISPER</h2>
          </div>
          
          <div className="header-controls">
            {/* AUTO ANALYSIS TOGGLE */}
            <div className="setting-toggle">
              <span className="toggle-label">Auto-analysis</span>
              <button 
                className="toggle-btn"
                onClick={toggleAutoAnalysis}
                title={chatSettings.enableAutoAnalysis ? 'Disable auto-analysis' : 'Enable auto-analysis'}
              >
                {chatSettings.enableAutoAnalysis ? 
                  <ToggleRight className="toggle-on" /> : 
                  <ToggleLeft className="toggle-off" />
                }
              </button>
            </div>

            <button 
              className="settings-btn"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings />
            </button>
          </div>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="messages-area">
        {messages.length === 0 && (
          <div className="welcome-message">
            <Bot className="welcome-icon" />
            <h3>Welcome to AI chat with WHISPER! 🎤</h3>
            <p>Enter text or use voice input for conversation</p>
          </div>
        )}

        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message message-${message.type}`}
          >
            <div className="message-avatar">
              {message.type === 'user' && <User />}
              {message.type === 'bot' && <Bot />}
              {message.type === 'system' && <Brain className="system-icon" />}
            </div>
            
            <div className="message-content">
              <div className="message-text">{message.content}</div>
              <div className="message-meta">
                {message.isVoiceGenerated && (
                  <span className="voice-indicator">
                    <Volume2 className="voice-icon" />
                    Voice
                  </span>
                )}
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* AI PRE-ANALYSIS PANEL */}
      {aiPreAnalysis && (
        <div className="pre-analysis-panel">
          <Brain className="analysis-icon" />
          <div className="analysis-content">
            <span className="analysis-label">AI ready to answer:</span>
            <p>{aiPreAnalysis}</p>
          </div>
        </div>
      )}

      {/* PROCESSING INDICATOR */}
      {voiceState.isProcessing && processingProgress && (
        <div className="processing-panel">
          <Loader2 className="processing-spinner" />
          <div className="processing-info">
            <span>Voice processing: {processingProgress.stage}</span>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${processingProgress.progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* INPUT AREA */}
      <div className="input-area">
        <div className="input-container">
          {/* VOICE BUTTON */}
          <button
            className={`voice-btn ${voiceState.isRecording ? 'recording' : ''} ${voiceState.isProcessing ? 'processing' : ''}`}
            onClick={voiceState.isRecording ? stopVoiceRecording : startVoiceRecording}
            disabled={disabled || voiceState.isProcessing}
            title={voiceState.isRecording ? 'Stop recording' : 'Start voice recording'}
          >
            {voiceState.isProcessing ? (
              <Loader2 className="processing-icon" />
            ) : voiceState.isRecording ? (
              <>
                <MicOff className="mic-icon" />
                <div className="recording-indicator">
                  <span className="recording-dot" />
                  <span className="recording-time">{formatTime(voiceState.duration)}</span>
                </div>
              </>
            ) : (
              <Mic className="mic-icon" />
            )}
          </button>

          {/* TEXT INPUT */}
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={placeholder}
            disabled={disabled || voiceState.isRecording}
            className="text-input"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />

          {/* SEND BUTTON */}
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={disabled || !inputText.trim() || voiceState.isRecording}
            title="Send message"
          >
            <Send className="send-icon" />
          </button>
        </div>

        {/* VOICE TRANSCRIPT PREVIEW */}
        {voiceState.currentTranscript && (
          <div className="transcript-preview">
            <Volume2 className="transcript-icon" />
            <span>Recognized: "{voiceState.currentTranscript}"</span>
          </div>
        )}
      </div>

      {/* STYLES */}
      <style>{`
        .modern-whisper-chat {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 800px;
          margin: 0 auto;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .chat-header {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding: 20px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .title-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .title-icon {
          color: white;
          width: 24px;
          height: 24px;
        }

        .chat-header h2 {
          color: white;
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .setting-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toggle-label {
          color: white;
          font-size: 0.9rem;
        }

        .toggle-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .toggle-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .toggle-on {
          color: #4ade80;
          width: 24px;
          height: 24px;
        }

        .toggle-off {
          color: rgba(255, 255, 255, 0.6);
          width: 24px;
          height: 24px;
        }

        .settings-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .settings-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .welcome-message {
          text-align: center;
          color: white;
          padding: 40px 20px;
        }

        .welcome-icon {
          width: 48px;
          height: 48px;
          margin-bottom: 16px;
          opacity: 0.8;
        }

        .welcome-message h3 {
          margin: 0 0 8px 0;
          font-size: 1.4rem;
        }

        .welcome-message p {
          margin: 0;
          opacity: 0.8;
        }

        .message {
          display: flex;
          gap: 12px;
          animation: messageSlideIn 0.3s ease-out;
        }

        @keyframes messageSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message-user {
          flex-direction: row-reverse;
        }

        .message-system {
          justify-content: center;
        }

        .message-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .message-user .message-avatar {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
        }

        .message-bot .message-avatar {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
          color: white;
        }

        .message-system .message-avatar {
          background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
          color: #666;
        }

        .system-icon {
          width: 20px;
          height: 20px;
        }

        .message-content {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 16px;
          padding: 12px 16px;
          max-width: 70%;
          word-wrap: break-word;
        }

        .message-user .message-content {
          background: rgba(71, 85, 255, 0.9);
          color: white;
        }

        .message-system .message-content {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          max-width: 90%;
        }

        .message-text {
          margin-bottom: 4px;
          line-height: 1.4;
        }

        .message-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          opacity: 0.7;
        }

        .voice-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .voice-icon {
          width: 12px;
          height: 12px;
        }

        .pre-analysis-panel {
          background: rgba(255, 255, 255, 0.1);
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          padding: 16px 20px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          animation: panelSlideIn 0.3s ease-out;
        }

        @keyframes panelSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .analysis-icon {
          color: #4ade80;
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .analysis-content {
          color: white;
          flex: 1;
        }

        .analysis-label {
          font-weight: 600;
          font-size: 0.9rem;
          display: block;
          margin-bottom: 4px;
        }

        .analysis-content p {
          margin: 0;
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .processing-panel {
          background: rgba(255, 255, 255, 0.1);
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          padding: 16px 20px;
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .processing-spinner {
          color: #4ade80;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .processing-info {
          color: white;
          flex: 1;
        }

        .progress-bar {
          background: rgba(255, 255, 255, 0.2);
          height: 4px;
          border-radius: 2px;
          margin-top: 8px;
          overflow: hidden;
        }

        .progress-fill {
          background: linear-gradient(90deg, #4ade80, #22c55e);
          height: 100%;
          transition: width 0.3s ease;
        }

        .input-area {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          padding: 20px;
        }

        .input-container {
          display: flex;
          gap: 12px;
          align-items: flex-end;
        }

        .voice-btn {
          background: linear-gradient(135deg, #ff6b6b, #ee5a24);
          border: none;
          color: white;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .voice-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
        }

        .voice-btn.recording {
          background: linear-gradient(135deg, #ff4757, #c44569);
          animation: recordingPulse 1.5s ease-in-out infinite;
        }

        @keyframes recordingPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.7);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(255, 71, 87, 0);
          }
        }

        .voice-btn.processing {
          background: linear-gradient(135deg, #ffa726, #ff9800);
        }

        .mic-icon {
          width: 24px;
          height: 24px;
        }

        .processing-icon {
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
        }

        .recording-indicator {
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }

        .recording-dot {
          width: 6px;
          height: 6px;
          background: #ff4757;
          border-radius: 50%;
          animation: recordingBlink 1s ease-in-out infinite;
        }

        @keyframes recordingBlink {
          0%, 50% {
            opacity: 1;
          }
          51%, 100% {
            opacity: 0.3;
          }
        }

        .text-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 1rem;
          font-family: inherit;
          resize: none;
          outline: none;
          transition: all 0.2s;
          min-height: 50px;
          max-height: 120px;
        }

        .text-input:focus {
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
        }

        .text-input:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .send-btn {
          background: linear-gradient(135deg, #4facfe, #00f2fe);
          border: none;
          color: white;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .send-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(79, 172, 254, 0.4);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .send-icon {
          width: 20px;
          height: 20px;
        }

        .transcript-preview {
          margin-top: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: white;
          font-size: 0.9rem;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .transcript-icon {
          width: 16px;
          height: 16px;
          color: #4ade80;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .modern-whisper-chat {
            height: 100vh;
            border-radius: 0;
          }

          .message-content {
            max-width: 85%;
          }

          .input-container {
            gap: 8px;
          }

          .voice-btn,
          .send-btn {
            width: 45px;
            height: 45px;
          }
        }
      `}</style>
    </div>
  );
};

export default ModernWhisperChatInterface; 