/**
 * 🎤 Revolutionary Voice Input Component
 * Advanced voice interface with real-time visualization and long-form support
 * Революционный голосовой интерфейс с визуализацией в реальном времени
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  WhisperAdvancedProcessor,
  ProcessingProgress,
  VoiceProcessingResult,
} from '../../services/voice-processing/WhisperAdvancedProcessor';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  Languages,
  Play,
  Pause,
  Square,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Info,
  Headphones,
} from 'lucide-react';

// HACK: Provide a dummy interface for SpeechRecognition for TypeScript
// This is a browser-specific API, and this helps TypeScript compile.
// Это временное решение для TypeScript, чтобы он "узнал" браузерный API.
interface SpeechRecognition extends EventTarget {
  // properties
  grammars: any;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  serviceURI: string;

  // event handlers
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: any) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: any) => any) | null;
  onresult: ((this: SpeechRecognition, ev: any) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;

  // methods
  abort(): void;
  start(): void;
  stop(): void;
}

interface VoiceInputProps {
  onTranscriptReceived: (transcript: string, metadata?: any) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  language?: 'ru' | 'en' | 'auto';
  enableRealTime?: boolean;
  maxDuration?: number; // seconds
  theme?: 'light' | 'dark';
  showAdvancedControls?: boolean;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
  quality: number;
}

interface VisualizationData {
  waveform: number[];
  frequency: number[];
  volume: number;
  speechDetected: boolean;
}

interface ProcessingState {
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  stage: string;
  estimatedTime: number;
}

interface VoiceCommand {
  command: string;
  confidence: number;
  intent: VoiceIntent;
  parameters?: Record<string, any>;
}

interface VoiceIntent {
  name: string;
  category: 'navigation' | 'action' | 'query' | 'control' | 'accessibility';
  description: string;
}

interface VoiceError {
  type: VoiceErrorType;
  message: string;
  code?: string;
  recoverable: boolean;
  suggestions?: string[];
}

type VoiceErrorType =
  | 'not_supported'
  | 'no_microphone'
  | 'permission_denied'
  | 'network_error'
  | 'recognition_failed'
  | 'audio_capture_error'
  | 'language_not_supported'
  | 'timeout';

interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  isSupported: boolean;
  hasPermission: boolean;
  currentTranscript: string;
  finalTranscript: string;
  confidence: number;
  alternatives: SpeechRecognitionAlternative[];
  audioLevel: number;
  sessionDuration: number;
  errorCount: number;
}

interface VoiceSettings {
  language: 'ru' | 'en' | 'auto';
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  sensitivity: 'low' | 'medium' | 'high';
  noiseSuppressionLevel: 'low' | 'medium' | 'high' | 'aggressive';
  enableVoiceCommands: boolean;
  enableKeywordDetection: boolean;
  enableSpeakerRecognition: boolean;
  autoLanguageDetection: boolean;
  customWakeWords: string[];
  confidenceThreshold: number;
}

interface AudioVisualization {
  enabled: boolean;
  type: 'waveform' | 'frequency' | 'volume' | 'simple';
  sensitivity: number;
  color: string;
  showLevels: boolean;
}

interface AccessibilityFeatures {
  visualIndicators: boolean;
  audioFeedback: boolean;
  hapticFeedback: boolean;
  highContrastMode: boolean;
  largeButtons: boolean;
  keyboardShortcuts: boolean;
  screenReaderSupport: boolean;
  captionsEnabled: boolean;
}

const VoiceInputComponent: React.FC<VoiceInputProps> = ({
  onTranscriptReceived,
  onError,
  disabled = false,
  language = 'auto',
  enableRealTime = true,
  maxDuration = 300, // 5 minutes default
  theme = 'light',
  showAdvancedControls = false,
}) => {
  // Core state
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioLevel: 0,
    quality: 0,
  });

  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    progress: null,
    stage: '',
    estimatedTime: 0,
  });

  const [visualizationData, setVisualizationData] = useState<VisualizationData>(
    {
      waveform: new Array(128).fill(0),
      frequency: new Array(64).fill(0),
      volume: 0,
      speechDetected: false,
    }
  );

  // Advanced settings
  const [audioQuality, setAudioQuality] = useState<
    'fast' | 'balanced' | 'quality'
  >('balanced');
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [voiceActivation, setVoiceActivation] = useState(true);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<WhisperAdvancedProcessor | null>(null);
  const animationRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio chunks for processing
  const audioChunksRef = useRef<Blob[]>([]);

  // State для голосового управления
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    isSupported: false,
    hasPermission: false,
    currentTranscript: '',
    finalTranscript: '',
    confidence: 0,
    alternatives: [],
    audioLevel: 0,
    sessionDuration: 0,
    errorCount: 0,
  });

  // State для настроек
  const [settings, setSettings] = useState<VoiceSettings>({
    language,
    continuous: true,
    interimResults: true,
    maxAlternatives: 3,
    sensitivity: 'medium',
    noiseSuppressionLevel: 'medium',
    enableVoiceCommands: true,
    enableKeywordDetection: true,
    enableSpeakerRecognition: false,
    autoLanguageDetection: true,
    customWakeWords: ['привет ассистент', 'hello assistant'],
    confidenceThreshold: 0.7,
  });

  // State для доступности
  const [accessibility, setAccessibility] = useState<AccessibilityFeatures>({
    visualIndicators: true,
    audioFeedback: false,
    hapticFeedback: false,
    highContrastMode: false,
    largeButtons: false,
    keyboardShortcuts: true,
    screenReaderSupport: true,
    captionsEnabled: false,
  });

  // State для интерфейса
  const [showSettings, setShowSettings] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);

  // State для аудиовизуализации
  const [audioVisualization, setAudioVisualization] =
    useState<AudioVisualization>({
      enabled: true,
      type: 'volume',
      sensitivity: 1.0,
      color: '#3b82f6',
      showLevels: true,
    });

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sessionStartRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize audio processor
  useEffect(() => {
    // Initialize Whisper processor when component mounts
    // Инициализируем Whisper процессор при монтировании компонента
    if (!processorRef.current) {
      // processorRef.current = new WhisperAdvancedProcessor(openaiClient, monitor);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      cleanupAudioResources();
    };
  }, []);

  /**
   * Start voice recording with advanced setup
   * Начало записи голоса с продвинутой настройкой
   */
  const startRecording = useCallback(async () => {
    try {
      // Request microphone access with optimal settings
      // Запрос доступа к микрофону с оптимальными настройками
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: noiseReduction,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1,
        },
      });

      audioStreamRef.current = stream;

      // Setup audio analysis
      // Настройка анализа аудио
      await setupAudioAnalysis(stream);

      // Configure MediaRecorder
      // Настройка MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        bitsPerSecond:
          audioQuality === 'quality'
            ? 128000
            : audioQuality === 'balanced'
              ? 64000
              : 32000,
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Handle data chunks
      // Обработка чанков данных
      mediaRecorder.ondataavailable = handleAudioData;
      mediaRecorder.onstop = handleRecordingStop;

      // Start recording
      // Начало записи
      mediaRecorder.start(enableRealTime ? 1000 : undefined); // 1 second chunks for real-time

      setRecordingState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
      }));

      // Start visualization and timers
      // Запуск визуализации и таймеров
      startVisualization();
      startRecordingTimer();

      // Real-time processing setup
      // Настройка обработки в реальном времени
      if (enableRealTime && processorRef.current) {
        processorRef.current.processRealTime(
          stream,
          {
            language: language === 'auto' ? undefined : language,
            enableNoiseReduction: noiseReduction,
            enableVAD: voiceActivation,
            qualityLevel: audioQuality,
          },
          handleRealTimeTranscript
        );
      }
    } catch (error) {
      onError?.(`Failed to start recording: ${(error as Error).message}`);
      console.error('Recording start failed:', error);
    }
  }, [language, enableRealTime, noiseReduction, voiceActivation, audioQuality]);

  /**
   * Stop recording and process audio
   * Остановка записи и обработка аудио
   */
  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();

      setRecordingState(prev => ({
        ...prev,
        isRecording: false,
      }));

      stopVisualization();
      stopRecordingTimer();
    }
  }, [recordingState.isRecording]);

  /**
   * Pause/resume recording
   * Пауза/возобновление записи
   */
  const togglePause = useCallback(() => {
    if (mediaRecorderRef.current) {
      if (recordingState.isPaused) {
        mediaRecorderRef.current.resume();
      } else {
        mediaRecorderRef.current.pause();
      }

      setRecordingState(prev => ({
        ...prev,
        isPaused: !prev.isPaused,
      }));
    }
  }, [recordingState.isPaused]);

  /**
   * Setup audio analysis for visualization
   * Настройка анализа аудио для визуализации
   */
  const setupAudioAnalysis = async (stream: MediaStream) => {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
  };

  /**
   * Start real-time audio visualization
   * Запуск визуализации аудио в реальном времени
   */
  const startVisualization = () => {
    const animate = () => {
      if (!analyserRef.current || !recordingState.isRecording) return;

      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const waveformArray = new Uint8Array(analyser.fftSize);

      analyser.getByteFrequencyData(dataArray);
      analyser.getByteTimeDomainData(waveformArray);

      // Calculate volume and quality metrics
      // Вычисление громкости и метрик качества
      const volume = Math.max(...Array.from(dataArray)) / 255;
      const speechDetected = volume > 0.1; // Simple VAD
      const quality = calculateAudioQuality(dataArray);

      setVisualizationData({
        waveform: Array.from(waveformArray).map(x => (x - 128) / 128),
        frequency: Array.from(dataArray).map(x => x / 255),
        volume,
        speechDetected,
      });

      setRecordingState(prev => ({
        ...prev,
        audioLevel: volume,
        quality,
      }));

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  const stopVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const startRecordingTimer = () => {
    recordingTimerRef.current = setInterval(() => {
      setRecordingState(prev => {
        const newDuration = prev.duration + 1;

        // Auto-stop at max duration
        // Автоостановка при достижении максимальной длительности
        if (newDuration >= maxDuration) {
          stopRecording();
        }

        return { ...prev, duration: newDuration };
      });
    }, 1000);
  };

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  /**
   * Handle audio data chunks
   * Обработка чанков аудио данных
   */
  const handleAudioData = (event: BlobEvent) => {
    if (event.data.size > 0) {
      audioChunksRef.current.push(event.data);
    }
  };

  /**
   * Handle recording stop and process final audio
   * Обработка остановки записи и обработка финального аудио
   */
  const handleRecordingStop = async () => {
    if (audioChunksRef.current.length === 0) return;

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

    setProcessingState({
      isProcessing: true,
      progress: null,
      stage: 'Preparing audio...',
      estimatedTime: 0,
    });

    try {
      if (processorRef.current) {
        const result = await processorRef.current.processLongAudio(
          audioBlob,
          {
            language: language === 'auto' ? undefined : language,
            enableNoiseReduction: noiseReduction,
            enableVAD: voiceActivation,
            qualityLevel: audioQuality,
            responseFormat: 'verbose_json',
          },
          handleProcessingProgress
        );

        onTranscriptReceived(result.transcript, {
          confidence: result.confidence,
          language: result.language,
          duration: result.duration,
          emotions: result.emotions,
          segments: result.segments,
        });
      }
    } catch (error) {
      onError?.(`Processing failed: ${(error as Error).message}`);
    } finally {
      setProcessingState({
        isProcessing: false,
        progress: null,
        stage: '',
        estimatedTime: 0,
      });

      cleanupAudioResources();
    }
  };

  /**
   * Handle real-time transcript updates
   * Обработка обновлений транскрипта в реальном времени
   */
  const handleRealTimeTranscript = (transcript: string, isFinal: boolean) => {
    if (isFinal) {
      onTranscriptReceived(transcript, { isRealTime: false, isFinal: true });
    } else {
      onTranscriptReceived(transcript, { isRealTime: true, isFinal: false });
    }
  };

  /**
   * Handle processing progress updates
   * Обработка обновлений прогресса обработки
   */
  const handleProcessingProgress = (progress: ProcessingProgress) => {
    setProcessingState(prev => ({
      ...prev,
      progress,
      stage: getStageDescription(progress.stage),
      estimatedTime: progress.estimatedTimeRemaining || 0,
    }));
  };

  const getStageDescription = (stage: string): string => {
    const stages: Record<string, string> = {
      preprocessing: 'Preparing audio / Подготовка аудио',
      chunking: 'Segmenting audio / Сегментация аудио',
      transcription: 'Converting speech / Конвертация речи',
      postprocessing: 'Finalizing / Финализация',
    };
    return stages[stage] || stage;
  };

  const calculateAudioQuality = (frequencyData: Uint8Array): number => {
    // Simple quality calculation based on frequency distribution
    // Простое вычисление качества на основе распределения частот
    const midRange = Array.from(frequencyData.slice(20, 80));
    const average =
      midRange.reduce((sum, val) => sum + val, 0) / midRange.length;
    return Math.min(1, average / 128);
  };

  const cleanupAudioResources = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    audioChunksRef.current = [];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeRemaining = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    return seconds > 60 ? `${Math.ceil(seconds / 60)}m` : `${seconds}s`;
  };

  return (
    <div
      className={`voice-input-component ${theme} ${disabled ? 'disabled' : ''}`}
    >
      {/* Main recording interface */}
      <div className="voice-main-interface">
        {/* Recording button with visual feedback */}
        <button
          className={`voice-record-btn ${recordingState.isRecording ? 'recording' : ''} ${recordingState.isPaused ? 'paused' : ''}`}
          onClick={recordingState.isRecording ? stopRecording : startRecording}
          disabled={disabled || processingState.isProcessing}
          style={{
            background: recordingState.isRecording
              ? `radial-gradient(circle, rgba(255,0,0,${0.3 + visualizationData.volume * 0.7}) 0%, rgba(255,0,0,0.1) 100%)`
              : undefined,
          }}
        >
          <div className="voice-btn-icon">
            {processingState.isProcessing ? (
              <div className="processing-spinner" />
            ) : recordingState.isRecording ? (
              <div className="stop-icon" />
            ) : (
              <div className="mic-icon" />
            )}
          </div>

          <div className="voice-btn-text">
            {processingState.isProcessing
              ? 'Processing...'
              : recordingState.isRecording
                ? 'Stop Recording'
                : 'Start Recording'}
          </div>
        </button>

        {/* Pause/Resume button during recording */}
        {recordingState.isRecording && (
          <button
            className="voice-pause-btn"
            onClick={togglePause}
            title={recordingState.isPaused ? 'Resume' : 'Pause'}
          >
            {recordingState.isPaused ? '▶️' : '⏸️'}
          </button>
        )}
      </div>

      {/* Recording status and metrics */}
      {(recordingState.isRecording || processingState.isProcessing) && (
        <div className="voice-status-panel">
          {recordingState.isRecording && (
            <>
              <div className="status-item">
                <span className="status-label">Duration:</span>
                <span className="status-value">
                  {formatDuration(recordingState.duration)}
                </span>
              </div>

              <div className="status-item">
                <span className="status-label">Quality:</span>
                <div className="quality-bar">
                  <div
                    className="quality-fill"
                    style={{ width: `${recordingState.quality * 100}%` }}
                  />
                </div>
              </div>

              <div className="status-item">
                <span className="status-label">Speech:</span>
                <span
                  className={`speech-indicator ${visualizationData.speechDetected ? 'active' : ''}`}
                >
                  {visualizationData.speechDetected ? '🎙️' : '🔇'}
                </span>
              </div>
            </>
          )}

          {processingState.isProcessing && (
            <>
              <div className="status-item">
                <span className="status-label">Stage:</span>
                <span className="status-value">{processingState.stage}</span>
              </div>

              {processingState.progress && (
                <div className="status-item">
                  <span className="status-label">Progress:</span>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${processingState.progress.progress}%` }}
                    />
                  </div>
                  <span className="progress-text">
                    {Math.round(processingState.progress.progress)}%
                  </span>
                </div>
              )}

              {processingState.estimatedTime > 0 && (
                <div className="status-item">
                  <span className="status-label">ETA:</span>
                  <span className="status-value">
                    {formatTimeRemaining(processingState.estimatedTime)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Audio visualization */}
      {recordingState.isRecording && (
        <div className="voice-visualization">
          {/* Waveform display */}
          <div className="waveform-container">
            {visualizationData.waveform.map((amplitude, index) => (
              <div
                key={index}
                className="waveform-bar"
                style={{
                  height: `${Math.abs(amplitude) * 100}%`,
                  backgroundColor: visualizationData.speechDetected
                    ? '#4CAF50'
                    : '#9E9E9E',
                }}
              />
            ))}
          </div>

          {/* Volume meter */}
          <div className="volume-meter">
            <div
              className="volume-level"
              style={{ width: `${visualizationData.volume * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Advanced controls */}
      {showAdvancedControls && (
        <div className="voice-advanced-controls">
          <div className="control-group">
            <label>Audio Quality:</label>
            <select
              value={audioQuality}
              onChange={e => setAudioQuality(e.target.value as any)}
              disabled={recordingState.isRecording}
            >
              <option value="fast">Fast</option>
              <option value="balanced">Balanced</option>
              <option value="quality">High Quality</option>
            </select>
          </div>

          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={noiseReduction}
                onChange={e => setNoiseReduction(e.target.checked)}
                disabled={recordingState.isRecording}
              />
              Noise Reduction
            </label>
          </div>

          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={voiceActivation}
                onChange={e => setVoiceActivation(e.target.checked)}
                disabled={recordingState.isRecording}
              />
              Voice Activation
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceInputComponent;
