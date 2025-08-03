import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * 🎤 Revolutionary Voice Input Component
 * Advanced voice interface with real-time visualization and long-form support
 * Революционный голосовой интерфейс с визуализацией в реальном времени
 */
import { useState, useEffect, useRef, useCallback } from 'react';
const VoiceInputComponent = ({ onTranscriptReceived, onError, disabled = false, language = 'auto', enableRealTime = true, maxDuration = 300, // 5 minutes default
theme = 'light', showAdvancedControls = false }) => {
    // Core state
    const [recordingState, setRecordingState] = useState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        audioLevel: 0,
        quality: 0
    });
    const [processingState, setProcessingState] = useState({
        isProcessing: false,
        progress: null,
        stage: '',
        estimatedTime: 0
    });
    const [visualizationData, setVisualizationData] = useState({
        waveform: new Array(128).fill(0),
        frequency: new Array(64).fill(0),
        volume: 0,
        speechDetected: false
    });
    // Advanced settings
    const [audioQuality, setAudioQuality] = useState('balanced');
    const [noiseReduction, setNoiseReduction] = useState(true);
    const [voiceActivation, setVoiceActivation] = useState(true);
    // Refs
    const mediaRecorderRef = useRef(null);
    const audioStreamRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const processorRef = useRef(null);
    const animationRef = useRef(null);
    const recordingTimerRef = useRef(null);
    // Audio chunks for processing
    const audioChunksRef = useRef([]);
    // State для голосового управления
    const [voiceState, setVoiceState] = useState({
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
        errorCount: 0
    });
    // State для настроек
    const [settings, setSettings] = useState({
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
        confidenceThreshold: 0.7
    });
    // State для доступности
    const [accessibility, setAccessibility] = useState({
        visualIndicators: true,
        audioFeedback: false,
        hapticFeedback: false,
        highContrastMode: false,
        largeButtons: false,
        keyboardShortcuts: true,
        screenReaderSupport: true,
        captionsEnabled: false
    });
    // State для интерфейса
    const [showSettings, setShowSettings] = useState(false);
    const [showTranscript, setShowTranscript] = useState(true);
    // State для аудиовизуализации
    const [audioVisualization, setAudioVisualization] = useState({
        enabled: true,
        type: 'volume',
        sensitivity: 1.0,
        color: '#3b82f6',
        showLevels: true
    });
    // Refs
    const recognitionRef = useRef(null);
    const synthRef = useRef(null);
    const microphoneRef = useRef(null);
    const sessionStartRef = useRef(0);
    const animationFrameRef = useRef(0);
    const canvasRef = useRef(null);
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
                    channelCount: 1
                }
            });
            audioStreamRef.current = stream;
            // Setup audio analysis
            // Настройка анализа аудио
            await setupAudioAnalysis(stream);
            // Configure MediaRecorder
            // Настройка MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus',
                bitsPerSecond: audioQuality === 'quality' ? 128000 :
                    audioQuality === 'balanced' ? 64000 : 32000
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
                duration: 0
            }));
            // Start visualization and timers
            // Запуск визуализации и таймеров
            startVisualization();
            startRecordingTimer();
            // Real-time processing setup
            // Настройка обработки в реальном времени
            if (enableRealTime && processorRef.current) {
                processorRef.current.processRealTime(stream, {
                    language: language === 'auto' ? undefined : language,
                    enableNoiseReduction: noiseReduction,
                    enableVAD: voiceActivation,
                    qualityLevel: audioQuality
                }, handleRealTimeTranscript);
            }
        }
        catch (error) {
            onError?.(`Failed to start recording: ${error.message}`);
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
                isRecording: false
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
            }
            else {
                mediaRecorderRef.current.pause();
            }
            setRecordingState(prev => ({
                ...prev,
                isPaused: !prev.isPaused
            }));
        }
    }, [recordingState.isPaused]);
    /**
     * Setup audio analysis for visualization
     * Настройка анализа аудио для визуализации
     */
    const setupAudioAnalysis = async (stream) => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
            if (!analyserRef.current || !recordingState.isRecording)
                return;
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
                speechDetected
            });
            setRecordingState(prev => ({
                ...prev,
                audioLevel: volume,
                quality
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
    const handleAudioData = (event) => {
        if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
        }
    };
    /**
     * Handle recording stop and process final audio
     * Обработка остановки записи и обработка финального аудио
     */
    const handleRecordingStop = async () => {
        if (audioChunksRef.current.length === 0)
            return;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setProcessingState({
            isProcessing: true,
            progress: null,
            stage: 'Preparing audio...',
            estimatedTime: 0
        });
        try {
            if (processorRef.current) {
                const result = await processorRef.current.processLongAudio(audioBlob, {
                    language: language === 'auto' ? undefined : language,
                    enableNoiseReduction: noiseReduction,
                    enableVAD: voiceActivation,
                    qualityLevel: audioQuality,
                    responseFormat: 'verbose_json'
                }, handleProcessingProgress);
                onTranscriptReceived(result.transcript, {
                    confidence: result.confidence,
                    language: result.language,
                    duration: result.duration,
                    emotions: result.emotions,
                    segments: result.segments
                });
            }
        }
        catch (error) {
            onError?.(`Processing failed: ${error.message}`);
        }
        finally {
            setProcessingState({
                isProcessing: false,
                progress: null,
                stage: '',
                estimatedTime: 0
            });
            cleanupAudioResources();
        }
    };
    /**
     * Handle real-time transcript updates
     * Обработка обновлений транскрипта в реальном времени
     */
    const handleRealTimeTranscript = (transcript, isFinal) => {
        if (isFinal) {
            onTranscriptReceived(transcript, { isRealTime: false, isFinal: true });
        }
        else {
            onTranscriptReceived(transcript, { isRealTime: true, isFinal: false });
        }
    };
    /**
     * Handle processing progress updates
     * Обработка обновлений прогресса обработки
     */
    const handleProcessingProgress = (progress) => {
        setProcessingState(prev => ({
            ...prev,
            progress,
            stage: getStageDescription(progress.stage),
            estimatedTime: progress.estimatedTimeRemaining || 0
        }));
    };
    const getStageDescription = (stage) => {
        const stages = {
            'preprocessing': 'Preparing audio / Подготовка аудио',
            'chunking': 'Segmenting audio / Сегментация аудио',
            'transcription': 'Converting speech / Конвертация речи',
            'postprocessing': 'Finalizing / Финализация'
        };
        return stages[stage] || stage;
    };
    const calculateAudioQuality = (frequencyData) => {
        // Simple quality calculation based on frequency distribution
        // Простое вычисление качества на основе распределения частот
        const midRange = Array.from(frequencyData.slice(20, 80));
        const average = midRange.reduce((sum, val) => sum + val, 0) / midRange.length;
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
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    const formatTimeRemaining = (ms) => {
        const seconds = Math.ceil(ms / 1000);
        return seconds > 60 ? `${Math.ceil(seconds / 60)}m` : `${seconds}s`;
    };
    return (_jsxs("div", { className: `voice-input-component ${theme} ${disabled ? 'disabled' : ''}`, children: [_jsxs("div", { className: "voice-main-interface", children: [_jsxs("button", { className: `voice-record-btn ${recordingState.isRecording ? 'recording' : ''} ${recordingState.isPaused ? 'paused' : ''}`, onClick: recordingState.isRecording ? stopRecording : startRecording, disabled: disabled || processingState.isProcessing, style: {
                            background: recordingState.isRecording
                                ? `radial-gradient(circle, rgba(255,0,0,${0.3 + visualizationData.volume * 0.7}) 0%, rgba(255,0,0,0.1) 100%)`
                                : undefined
                        }, children: [_jsx("div", { className: "voice-btn-icon", children: processingState.isProcessing ? (_jsx("div", { className: "processing-spinner" })) : recordingState.isRecording ? (_jsx("div", { className: "stop-icon" })) : (_jsx("div", { className: "mic-icon" })) }), _jsx("div", { className: "voice-btn-text", children: processingState.isProcessing
                                    ? 'Processing...'
                                    : recordingState.isRecording
                                        ? 'Stop Recording'
                                        : 'Start Recording' })] }), recordingState.isRecording && (_jsx("button", { className: "voice-pause-btn", onClick: togglePause, title: recordingState.isPaused ? "Resume" : "Pause", children: recordingState.isPaused ? '▶️' : '⏸️' }))] }), (recordingState.isRecording || processingState.isProcessing) && (_jsxs("div", { className: "voice-status-panel", children: [recordingState.isRecording && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "status-item", children: [_jsx("span", { className: "status-label", children: "Duration:" }), _jsx("span", { className: "status-value", children: formatDuration(recordingState.duration) })] }), _jsxs("div", { className: "status-item", children: [_jsx("span", { className: "status-label", children: "Quality:" }), _jsx("div", { className: "quality-bar", children: _jsx("div", { className: "quality-fill", style: { width: `${recordingState.quality * 100}%` } }) })] }), _jsxs("div", { className: "status-item", children: [_jsx("span", { className: "status-label", children: "Speech:" }), _jsx("span", { className: `speech-indicator ${visualizationData.speechDetected ? 'active' : ''}`, children: visualizationData.speechDetected ? '🎙️' : '🔇' })] })] })), processingState.isProcessing && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "status-item", children: [_jsx("span", { className: "status-label", children: "Stage:" }), _jsx("span", { className: "status-value", children: processingState.stage })] }), processingState.progress && (_jsxs("div", { className: "status-item", children: [_jsx("span", { className: "status-label", children: "Progress:" }), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${processingState.progress.progress}%` } }) }), _jsxs("span", { className: "progress-text", children: [Math.round(processingState.progress.progress), "%"] })] })), processingState.estimatedTime > 0 && (_jsxs("div", { className: "status-item", children: [_jsx("span", { className: "status-label", children: "ETA:" }), _jsx("span", { className: "status-value", children: formatTimeRemaining(processingState.estimatedTime) })] }))] }))] })), recordingState.isRecording && (_jsxs("div", { className: "voice-visualization", children: [_jsx("div", { className: "waveform-container", children: visualizationData.waveform.map((amplitude, index) => (_jsx("div", { className: "waveform-bar", style: {
                                height: `${Math.abs(amplitude) * 100}%`,
                                backgroundColor: visualizationData.speechDetected ? '#4CAF50' : '#9E9E9E'
                            } }, index))) }), _jsx("div", { className: "volume-meter", children: _jsx("div", { className: "volume-level", style: { width: `${visualizationData.volume * 100}%` } }) })] })), showAdvancedControls && (_jsxs("div", { className: "voice-advanced-controls", children: [_jsxs("div", { className: "control-group", children: [_jsx("label", { children: "Audio Quality:" }), _jsxs("select", { value: audioQuality, onChange: (e) => setAudioQuality(e.target.value), disabled: recordingState.isRecording, children: [_jsx("option", { value: "fast", children: "Fast" }), _jsx("option", { value: "balanced", children: "Balanced" }), _jsx("option", { value: "quality", children: "High Quality" })] })] }), _jsx("div", { className: "control-group", children: _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: noiseReduction, onChange: (e) => setNoiseReduction(e.target.checked), disabled: recordingState.isRecording }), "Noise Reduction"] }) }), _jsx("div", { className: "control-group", children: _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: voiceActivation, onChange: (e) => setVoiceActivation(e.target.checked), disabled: recordingState.isRecording }), "Voice Activation"] }) })] }))] }));
};
export default VoiceInputComponent;
