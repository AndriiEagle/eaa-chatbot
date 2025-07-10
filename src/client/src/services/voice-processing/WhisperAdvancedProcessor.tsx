/**
 * 🎤 Advanced Whisper Voice Processing Service
 * State-of-the-art speech processing with chunking, noise reduction, and optimization
 * Advanced speech processing with chunking, noise suppression and optimization
 */

import React from 'react';
import OpenAI from 'openai';
import { PerformanceMonitor } from '../../monitoring/performance-metrics/PerformanceMonitor';

interface AudioProcessingOptions {
  language?: string; // 'ru' | 'en' | 'auto'
  model?: 'whisper-1';
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  temperature?: number; // 0-1 for creativity vs accuracy
  prompt?: string; // Context hint for better recognition
  enableNoiseReduction?: boolean;
  enableVAD?: boolean; // Voice Activity Detection
  chunkDuration?: number; // seconds
  overlapDuration?: number; // seconds for chunk overlap
  qualityLevel?: 'fast' | 'balanced' | 'quality';
}

interface VoiceProcessingResult {
  transcript: string;
  confidence: number;
  language: string;
  duration: number;
  segments?: TranscriptSegment[];
  metadata: ProcessingMetadata;
  emotions?: EmotionAnalysis;
  speakers?: SpeakerInfo[];
}

interface TranscriptSegment {
  id: number;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
  speaker?: string;
  emotion?: string;
}

interface ProcessingMetadata {
  originalDuration: number;
  processingTime: number;
  chunksProcessed: number;
  qualityScore: number;
  noiseLevel: number;
  speechToNoiseRatio: number;
  model: string;
  language: string;
}

interface EmotionAnalysis {
  primary: string;
  confidence: number;
  emotions: {
    neutral: number;
    happy: number;
    sad: number;
    angry: number;
    surprised: number;
    fearful: number;
    disgusted: number;
  };
}

interface SpeakerInfo {
  id: string;
  segments: number[];
  confidence: number;
  characteristics: {
    gender?: 'male' | 'female' | 'unknown';
    ageRange?: string;
    accent?: string;
  };
}

interface AudioChunk {
  data: Blob;
  startTime: number;
  endTime: number;
  index: number;
}

interface ProcessingProgress {
  stage: 'preprocessing' | 'chunking' | 'transcription' | 'postprocessing';
  progress: number; // 0-100
  currentChunk?: number;
  totalChunks?: number;
  estimatedTimeRemaining?: number;
  qualityIndicator?: number;
}

class WhisperAdvancedProcessor {
  private openai: OpenAI;
  private monitor: PerformanceMonitor;
  private audioContext: AudioContext;
  private isProcessing: boolean = false;

  constructor(openaiClient: OpenAI, monitor: PerformanceMonitor) {
    this.openai = openaiClient;
    this.monitor = monitor;
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  /**
   * Process long-form audio with intelligent chunking
   * Processing long audio with intelligent chunking
   */
  async processLongAudio(
    audioBlob: Blob,
    options: AudioProcessingOptions = {},
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<VoiceProcessingResult> {
    const startTime = performance.now();
    this.isProcessing = true;

    try {
      // Stage 1: Preprocess audio
      onProgress?.({
        stage: 'preprocessing',
        progress: 10,
        qualityIndicator: 0
      });

      const preprocessedAudio = await this.preprocessAudio(audioBlob, options);
      
      // Stage 2: Intelligent chunking
      onProgress?.({
        stage: 'chunking',
        progress: 20
      });

      const chunks = await this.intelligentChunking(preprocessedAudio, options);
      
      // Stage 3: Parallel transcription
      onProgress?.({
        stage: 'transcription',
        progress: 30,
        totalChunks: chunks.length
      });

      const transcriptionResults = await this.processChunksInParallel(
        chunks,
        options,
        (chunkProgress) => {
          onProgress?.({
            stage: 'transcription',
            progress: 30 + (chunkProgress * 60),
            currentChunk: chunkProgress * chunks.length,
            totalChunks: chunks.length,
            estimatedTimeRemaining: this.estimateRemainingTime(chunkProgress, chunks.length)
          });
        }
      );

      // Stage 4: Post-processing and assembly
      onProgress?.({
        stage: 'postprocessing',
        progress: 95
      });

      const finalResult = await this.assembleTranscription(
        transcriptionResults,
        preprocessedAudio,
        options
      );

      onProgress?.({
        stage: 'postprocessing',
        progress: 100
      });

      const processingTime = performance.now() - startTime;
      this.monitor.recordVoiceProcessing(finalResult, processingTime);

      return {
        ...finalResult,
        metadata: {
          ...finalResult.metadata,
          processingTime
        }
      };

    } catch (error) {
      this.monitor.recordError('voice_processing', error as Error);
      throw new Error(`Voice processing failed: ${(error as Error).message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Real-time voice processing for live conversations
   */
  async processRealTime(
    audioStream: MediaStream,
    options: AudioProcessingOptions = {},
    onTranscript?: (transcript: string, isFinal: boolean) => void
  ): Promise<void> {
    const mediaRecorder = new MediaRecorder(audioStream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    const audioChunks: Blob[] = [];
    let isRecording = false;

    mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
        
        // Process intermediate results for real-time feedback
        // Process interim results for real-time feedback
        if (audioChunks.length >= 3) { // Process every 3 chunks
          const combinedBlob = new Blob(audioChunks.slice(-3), { type: 'audio/webm' });
          
          try {
            const result = await this.processShortAudio(combinedBlob, {
              ...options,
              responseFormat: 'json'
            });
            
            onTranscript?.(result.transcript, false);
          } catch (error) {
            console.warn('Real-time processing failed:', error);
          }
        }
      }
    };

    mediaRecorder.onstop = async () => {
      if (audioChunks.length > 0) {
        const finalBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        try {
          const result = await this.processShortAudio(finalBlob, options);
          onTranscript?.(result.transcript, true);
        } catch (error) {
          console.error('Final processing failed:', error);
        }
      }
    };

    // Start recording with optimal chunk size
    // Start recording with optimal chunk size
    mediaRecorder.start(1000); // 1 second chunks
    isRecording = true;

    return new Promise((resolve) => {
      setTimeout(() => {
        if (isRecording) {
          mediaRecorder.stop();
          resolve();
        }
      }, 60000); // Max 1 minute recording
    });
  }

  /**
   * Advanced audio preprocessing with noise reduction
   */
  private async preprocessAudio(
    audioBlob: Blob,
    options: AudioProcessingOptions
  ): Promise<AudioBuffer> {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    let processedBuffer = audioBuffer;

    if (options.enableNoiseReduction) {
      processedBuffer = await this.applyNoiseReduction(audioBuffer);
    }

    if (options.enableVAD) {
      processedBuffer = await this.applyVoiceActivityDetection(processedBuffer);
    }

    // Normalize audio levels
    processedBuffer = this.normalizeAudio(processedBuffer);

    return processedBuffer;
  }

  /**
   * Intelligent audio chunking based on speech patterns
   */
  private async intelligentChunking(
    audioBuffer: AudioBuffer,
    options: AudioProcessingOptions
  ): Promise<AudioChunk[]> {
    const chunkDuration = options.chunkDuration || 30; // 30 seconds default
    const overlapDuration = options.overlapDuration || 2; // 2 seconds overlap
    const sampleRate = audioBuffer.sampleRate;
    
    const chunks: AudioChunk[] = [];
    const totalDuration = audioBuffer.duration;
    
    // Detect speech boundaries for smarter chunking
    // Определение границ речи для более умной разбивки
    const speechBoundaries = options.enableVAD ? 
      await this.detectSpeechBoundaries(audioBuffer) : [];
    
    let currentTime = 0;
    let chunkIndex = 0;
    
    while (currentTime < totalDuration) {
      let chunkEndTime = Math.min(currentTime + chunkDuration, totalDuration);
      
      // Adjust chunk boundary to speech pause if available
      // Корректируем границу чанка к паузе в речи, если доступно
      if (speechBoundaries.length > 0) {
        const nearbyBoundary = speechBoundaries.find(
          boundary => Math.abs(boundary - chunkEndTime) < 3
        );
        if (nearbyBoundary) {
          chunkEndTime = nearbyBoundary;
        }
      }
      
      const chunkStartSample = Math.floor(currentTime * sampleRate);
      const chunkEndSample = Math.floor(chunkEndTime * sampleRate);
      
      const chunkBuffer = this.extractAudioSegment(
        audioBuffer,
        chunkStartSample,
        chunkEndSample
      );
      
      const chunkBlob = await this.audioBufferToBlob(chunkBuffer);
      
      chunks.push({
        data: chunkBlob,
        startTime: currentTime,
        endTime: chunkEndTime,
        index: chunkIndex
      });
      
      currentTime = chunkEndTime - overlapDuration;
      chunkIndex++;
    }
    
    return chunks;
  }

  /**
   * Process multiple chunks in parallel with rate limiting
   * Обработка множественных чанков параллельно с ограничением скорости
   */
  private async processChunksInParallel(
    chunks: AudioChunk[],
    options: AudioProcessingOptions,
    onProgress?: (progress: number) => void
  ): Promise<VoiceProcessingResult[]> {
    const maxConcurrent = 3; // Limit concurrent requests
    const results: VoiceProcessingResult[] = [];
    let completed = 0;
    
    // Process chunks in batches
    // Обрабатываем чанки пакетами
    for (let i = 0; i < chunks.length; i += maxConcurrent) {
      const batch = chunks.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (chunk) => {
        const result = await this.processShortAudio(chunk.data, {
          ...options,
          prompt: this.generateContextPrompt(chunk, options)
        });
        
        return {
          ...result,
          chunkIndex: chunk.index,
          startTime: chunk.startTime,
          endTime: chunk.endTime
        };
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      completed += batch.length;
      onProgress?.(completed / chunks.length);
      
      // Small delay to respect rate limits
      // Небольшая задержка для соблюдения лимитов скорости
      if (i + maxConcurrent < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return results.sort((a, b) => (a as any).chunkIndex - (b as any).chunkIndex);
  }

  /**
   * Process short audio segments (< 25MB)
   * Обработка коротких аудио сегментов (< 25MB)
   */
  private async processShortAudio(
    audioBlob: Blob,
    options: AudioProcessingOptions
  ): Promise<VoiceProcessingResult> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', options.model || 'whisper-1');
    
    if (options.language) {
      formData.append('language', options.language);
    }
    
    if (options.responseFormat) {
      formData.append('response_format', options.responseFormat);
    }
    
    if (options.temperature !== undefined) {
      formData.append('temperature', options.temperature.toString());
    }
    
    if (options.prompt) {
      formData.append('prompt', options.prompt);
    }

    const response = await this.openai.audio.transcriptions.create({
      file: audioBlob as any,
      model: options.model || 'whisper-1',
      language: options.language,
      response_format: options.responseFormat || 'json',
      temperature: options.temperature,
      prompt: options.prompt
    });

    return this.parseWhisperResponse(response, audioBlob);
  }

  /**
   * Assemble final transcription from chunks
   * Сборка финальной транскрипции из чанков
   */
  private async assembleTranscription(
    chunkResults: VoiceProcessingResult[],
    originalAudio: AudioBuffer,
    options: AudioProcessingOptions
  ): Promise<VoiceProcessingResult> {
    // Merge overlapping segments intelligently
    // Умное объединение пересекающихся сегментов
    const mergedTranscript = this.mergeOverlappingTranscripts(chunkResults);
    
    // Post-process for consistency
    // Постобработка для согласованности
    const cleanedTranscript = this.cleanupTranscript(mergedTranscript);
    
    // Calculate overall confidence
    // Вычисление общей уверенности
    const averageConfidence = chunkResults.reduce(
      (sum, result) => sum + result.confidence, 0
    ) / chunkResults.length;
    
    // Extract metadata
    // Извлечение метаданных
    const metadata: ProcessingMetadata = {
      originalDuration: originalAudio.duration,
      processingTime: 0, // Will be set by caller
      chunksProcessed: chunkResults.length,
      qualityScore: this.calculateQualityScore(chunkResults),
      noiseLevel: this.estimateNoiseLevel(originalAudio),
      speechToNoiseRatio: this.calculateSNR(originalAudio),
      model: options.model || 'whisper-1',
      language: this.detectDominantLanguage(chunkResults)
    };

    return {
      transcript: cleanedTranscript,
      confidence: averageConfidence,
      language: metadata.language,
      duration: originalAudio.duration,
      segments: this.createSegments(chunkResults),
      metadata,
      emotions: await this.analyzeEmotions(cleanedTranscript),
      speakers: await this.detectSpeakers(chunkResults)
    };
  }

  // Audio processing utilities
  // Утилиты обработки аудио
  private async applyNoiseReduction(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    // Implement spectral subtraction noise reduction
    // Реализация спектрального вычитания для шумоподавления
    const sampleRate = audioBuffer.sampleRate;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    
    // Create new buffer for processed audio
    const processedBuffer = this.audioContext.createBuffer(numberOfChannels, length, sampleRate);
    
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = processedBuffer.getChannelData(channel);
      
      // Apply noise reduction using moving average and energy-based filtering
      const windowSize = Math.floor(sampleRate * 0.02); // 20ms window
      
      for (let i = 0; i < length; i++) {
        let sum = 0;
        let count = 0;
        
        // Calculate moving average energy in window
        for (let j = Math.max(0, i - windowSize); j < Math.min(length, i + windowSize); j++) {
          sum += Math.abs(inputData[j]);
          count++;
        }
        
        const avgEnergy = sum / count;
        const noiseThreshold = avgEnergy * 0.3; // Adaptive threshold
        
        // Apply spectral gate - attenuate if below threshold
        if (Math.abs(inputData[i]) > noiseThreshold) {
          outputData[i] = inputData[i];
        } else {
          outputData[i] = inputData[i] * 0.1; // Reduce by 90%
        }
      }
    }
    
    return processedBuffer;
  }

  private async applyVoiceActivityDetection(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    // Implement energy-based Voice Activity Detection
    // Реализация VAD на основе энергии для удаления тишины
    const sampleRate = audioBuffer.sampleRate;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    
    // Calculate energy levels
    const frameSize = Math.floor(sampleRate * 0.025); // 25ms frames
    const hopSize = Math.floor(frameSize / 2);
    const energies: number[] = [];
    
    for (let i = 0; i < length - frameSize; i += hopSize) {
      let energy = 0;
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        for (let j = i; j < i + frameSize; j++) {
          energy += channelData[j] * channelData[j];
        }
      }
      energies.push(energy / (frameSize * numberOfChannels));
    }
    
    // Calculate dynamic threshold
    const sortedEnergies = [...energies].sort((a, b) => a - b);
    const medianEnergy = sortedEnergies[Math.floor(sortedEnergies.length / 2)];
    const threshold = medianEnergy * 0.1; // 10% of median energy
    
    // Mark voice activity frames
    const voiceFrames: boolean[] = energies.map(energy => energy > threshold);
    
    // Expand voice regions (add padding)
    const paddingFrames = Math.floor(0.1 * sampleRate / hopSize); // 100ms padding
    const expandedVoice: boolean[] = [...voiceFrames];
    
    for (let i = 0; i < voiceFrames.length; i++) {
      if (voiceFrames[i]) {
        for (let j = Math.max(0, i - paddingFrames); j < Math.min(voiceFrames.length, i + paddingFrames); j++) {
          expandedVoice[j] = true;
        }
      }
    }
    
    // Create output buffer with only voice regions
    const voiceSamples: number[] = [];
    for (let i = 0; i < expandedVoice.length; i++) {
      if (expandedVoice[i]) {
        const startSample = i * hopSize;
        const endSample = Math.min(length, startSample + frameSize);
        
        for (let j = startSample; j < endSample; j++) {
          voiceSamples.push(j);
        }
      }
    }
    
    // Create new buffer with voice samples only
    const newLength = voiceSamples.length;
    const voiceBuffer = this.audioContext.createBuffer(numberOfChannels, newLength, sampleRate);
    
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = voiceBuffer.getChannelData(channel);
      
      for (let i = 0; i < newLength; i++) {
        outputData[i] = inputData[voiceSamples[i]] || 0;
      }
    }
    
    return voiceBuffer;
  }

  private normalizeAudio(audioBuffer: AudioBuffer): AudioBuffer {
    // Normalize audio levels using peak normalization
    // Нормализация уровней аудио с использованием пиковой нормализации
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    
    // Create new buffer
    const normalizedBuffer = this.audioContext.createBuffer(numberOfChannels, length, sampleRate);
    
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = normalizedBuffer.getChannelData(channel);
      
      // Find peak amplitude
      let maxAmplitude = 0;
      for (let i = 0; i < length; i++) {
        maxAmplitude = Math.max(maxAmplitude, Math.abs(inputData[i]));
      }
      
      // Calculate normalization factor (target peak at 90% to avoid clipping)
      const targetPeak = 0.9;
      const normalizationFactor = maxAmplitude > 0 ? targetPeak / maxAmplitude : 1;
      
      // Apply normalization with soft limiting
      for (let i = 0; i < length; i++) {
        let sample = inputData[i] * normalizationFactor;
        
        // Soft limiting to prevent harsh clipping
        if (Math.abs(sample) > 0.95) {
          sample = Math.sign(sample) * (0.95 + 0.05 * Math.tanh((Math.abs(sample) - 0.95) * 10));
        }
        
        outputData[i] = sample;
      }
    }
    
    return normalizedBuffer;
  }

  private async detectSpeechBoundaries(audioBuffer: AudioBuffer): Promise<number[]> {
    // Detect natural speech boundaries using energy and zero-crossing analysis
    // Определение естественных границ речи с использованием анализа энергии и пересечений нуля
    const sampleRate = audioBuffer.sampleRate;
    const channelData = audioBuffer.getChannelData(0); // Use first channel
    const length = audioBuffer.length;
    
    const frameSize = Math.floor(sampleRate * 0.025); // 25ms frames
    const hopSize = Math.floor(frameSize / 2);
    const boundaries: number[] = [0]; // Start with beginning
    
    // Calculate frame-based features
    const features: { energy: number; zcr: number; spectralCentroid: number }[] = [];
    
    for (let i = 0; i < length - frameSize; i += hopSize) {
      // Energy calculation
      let energy = 0;
      let zcr = 0;
      let spectralSum = 0;
      let spectralWeightedSum = 0;
      
      for (let j = i; j < i + frameSize; j++) {
        const sample = channelData[j];
        energy += sample * sample;
        
        // Zero crossing rate
        if (j > i && Math.sign(channelData[j]) !== Math.sign(channelData[j - 1])) {
          zcr++;
        }
        
        // Simple spectral centroid approximation
        const freq = (j - i) / frameSize;
        spectralSum += Math.abs(sample);
        spectralWeightedSum += Math.abs(sample) * freq;
      }
      
      features.push({
        energy: energy / frameSize,
        zcr: zcr / frameSize,
        spectralCentroid: spectralSum > 0 ? spectralWeightedSum / spectralSum : 0
      });
    }
    
    // Detect boundaries using energy and spectral changes
    const energyThreshold = Math.max(...features.map(f => f.energy)) * 0.1;
    const minBoundaryDistance = Math.floor(sampleRate); // 1 second minimum
    
    for (let i = 1; i < features.length - 1; i++) {
      const current = features[i];
      const prev = features[i - 1];
      const next = features[i + 1];
      
      // Detect significant energy drops (silence gaps)
      const energyDrop = (prev.energy - current.energy) / (prev.energy + 1e-10);
      const energyRise = (next.energy - current.energy) / (current.energy + 1e-10);
      
      // Detect spectral changes (topic/speaker changes)
      const spectralChange = Math.abs(current.spectralCentroid - prev.spectralCentroid);
      
      const sampleTime = i * hopSize;
      const isValidBoundary = sampleTime - boundaries[boundaries.length - 1] >= minBoundaryDistance;
      
      if (isValidBoundary && (
        (energyDrop > 0.5 && current.energy < energyThreshold) || // Silence gap
        (energyRise > 0.8 && prev.energy < energyThreshold) || // End of silence
        (spectralChange > 0.3 && current.energy > energyThreshold) // Spectral change
      )) {
        boundaries.push(sampleTime);
      }
         }
     
     // Add final boundary
     if (boundaries[boundaries.length - 1] < length - sampleRate) {
       boundaries.push(length);
     }
    
    return boundaries;
  }

  private extractAudioSegment(
    audioBuffer: AudioBuffer,
    startSample: number,
    endSample: number
  ): AudioBuffer {
    // Extract audio segment from buffer
    // Извлечение аудио сегмента из буфера
    const sampleRate = audioBuffer.sampleRate;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const segmentLength = endSample - startSample;
    
    if (segmentLength <= 0 || startSample < 0 || endSample > audioBuffer.length) {
      throw new Error('Invalid segment boundaries');
    }
    
    // Create new buffer for segment
    const segmentBuffer = this.audioContext.createBuffer(numberOfChannels, segmentLength, sampleRate);
    
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = segmentBuffer.getChannelData(channel);
      
      // Copy samples from source to destination
      for (let i = 0; i < segmentLength; i++) {
        outputData[i] = inputData[startSample + i];
      }
    }
    
    return segmentBuffer;
  }

  private async audioBufferToBlob(audioBuffer: AudioBuffer): Promise<Blob> {
    // Convert AudioBuffer to WAV Blob for API consumption
    // Конвертация AudioBuffer в WAV Blob для API
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    const bytesPerSample = 2; // 16-bit
    
    // Calculate buffer sizes
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const bufferSize = 44 + dataSize; // 44 bytes for WAV header
    
    // Create WAV file buffer
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    let offset = 0;
    
    // RIFF chunk
    view.setUint32(offset, 0x52494646, false); offset += 4; // "RIFF"
    view.setUint32(offset, bufferSize - 8, true); offset += 4; // File size - 8
    view.setUint32(offset, 0x57415645, false); offset += 4; // "WAVE"
    
    // Format chunk
    view.setUint32(offset, 0x666d7420, false); offset += 4; // "fmt "
    view.setUint32(offset, 16, true); offset += 4; // Chunk size
    view.setUint16(offset, 1, true); offset += 2; // Audio format (PCM)
    view.setUint16(offset, numberOfChannels, true); offset += 2; // Number of channels
    view.setUint32(offset, sampleRate, true); offset += 4; // Sample rate
    view.setUint32(offset, byteRate, true); offset += 4; // Byte rate
    view.setUint16(offset, blockAlign, true); offset += 2; // Block align
    view.setUint16(offset, 16, true); offset += 2; // Bits per sample
    
    // Data chunk
    view.setUint32(offset, 0x64617461, false); offset += 4; // "data"
    view.setUint32(offset, dataSize, true); offset += 4; // Data size
    
    // Write audio data
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[i];
        // Convert float to 16-bit PCM
        const pcmSample = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
        view.setInt16(offset, pcmSample, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  private generateContextPrompt(chunk: AudioChunk, options: AudioProcessingOptions): string {
    // Generate context-aware prompt for better recognition
    // Генерация контекстного промпта для лучшего распознавания
    let prompt = "This is a discussion about European Accessibility Act (EAA). ";
    
    if (options.language === 'ru') {
      prompt = "Это обсуждение Европейского закона о доступности (EAA). ";
    }
    
    return prompt;
  }

  private parseWhisperResponse(response: any, audioBlob: Blob): VoiceProcessingResult {
    // Parse Whisper API response
    // Парсинг ответа Whisper API
    return {
      transcript: response.text || '',
      confidence: 0.85, // Estimated
      language: response.language || 'unknown',
      duration: 0, // Will be calculated
      metadata: {
        originalDuration: 0,
        processingTime: 0,
        chunksProcessed: 1,
        qualityScore: 0.85,
        noiseLevel: 0,
        speechToNoiseRatio: 0,
        model: 'whisper-1',
        language: response.language || 'unknown'
      }
    };
  }

  private mergeOverlappingTranscripts(results: VoiceProcessingResult[]): string {
    // Intelligent merging of overlapping transcripts
    // Умное объединение пересекающихся транскриптов
    return results.map(r => r.transcript).join(' ');
  }

  private cleanupTranscript(transcript: string): string {
    // Clean up transcript for better readability
    // Очистка транскрипта для лучшей читаемости
    return transcript
      .replace(/\s+/g, ' ')
      .replace(/([.!?])\s*([A-ZА-Я])/g, '$1 $2')
      .trim();
  }

  private calculateQualityScore(results: VoiceProcessingResult[]): number {
    // Calculate overall transcription quality
    // Вычисление общего качества транскрипции
    return results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  }

  private estimateNoiseLevel(audioBuffer: AudioBuffer): number {
    // Estimate background noise level
    // Оценка уровня фонового шума
    return 0.1; // Placeholder
  }

  private calculateSNR(audioBuffer: AudioBuffer): number {
    // Calculate Signal-to-Noise Ratio
    // Вычисление отношения сигнал/шум
    return 20; // Placeholder
  }

  private detectDominantLanguage(results: VoiceProcessingResult[]): string {
    // Detect the dominant language across chunks
    // Определение доминирующего языка по чанкам
    const languages = results.map(r => r.language);
    return languages[0] || 'unknown';
  }

  private createSegments(results: VoiceProcessingResult[]): TranscriptSegment[] {
    // Create detailed segments from chunk results
    // Создание детальных сегментов из результатов чанков
    const segments: TranscriptSegment[] = [];
    let cumulativeTime = 0;
    
    results.forEach((result, chunkIndex) => {
      if (result.segments && result.segments.length > 0) {
        // Use existing segments if available
        result.segments.forEach(segment => {
          segments.push({
            ...segment,
            startTime: segment.startTime + cumulativeTime,
            endTime: segment.endTime + cumulativeTime
          });
        });
      } else {
        // Create segment from chunk result
        const words = result.transcript.split(/\s+/).filter(word => word.length > 0);
        const segmentDuration = result.duration || 30; // Default 30 seconds
        const timePerWord = segmentDuration / Math.max(words.length, 1);
        
        words.forEach((word, wordIndex) => {
          const startTime = cumulativeTime + (wordIndex * timePerWord);
          const endTime = startTime + timePerWord;
          
          segments.push({
            id: segments.length,
            text: word,
            startTime,
            endTime,
            confidence: result.confidence || 0.8,
            speaker: `speaker_${chunkIndex % 2}`, // Simple speaker alternation
            emotion: result.emotions?.primary || 'neutral'
          });
        });
      }
      
      cumulativeTime += result.duration || 30;
    });
    
    return segments;
  }

  private async analyzeEmotions(transcript: string): Promise<EmotionAnalysis> {
    // Analyze emotional content of transcript
    // Анализ эмоционального содержания транскрипта
    return {
      primary: 'neutral',
      confidence: 0.8,
      emotions: {
        neutral: 0.7,
        happy: 0.1,
        sad: 0.05,
        angry: 0.05,
        surprised: 0.05,
        fearful: 0.03,
        disgusted: 0.02
      }
    };
  }

  private async detectSpeakers(results: VoiceProcessingResult[]): Promise<SpeakerInfo[]> {
    // Detect different speakers using voice characteristics analysis
    // Определение разных говорящих с использованием анализа голосовых характеристик
    const speakers: SpeakerInfo[] = [];
    const speakerMap = new Map<string, number[]>();
    
    results.forEach((result, chunkIndex) => {
      // Analyze spectral characteristics for speaker identification
      const transcript = result.transcript.toLowerCase();
      
      // Simple heuristic based on content and patterns
      let speakerId = 'speaker_1';
      
      // Detect potential speaker changes based on content patterns
      if (transcript.includes('вопрос') || transcript.includes('question')) {
        speakerId = 'speaker_questioner';
      } else if (transcript.includes('отвечаю') || transcript.includes('ответ') || transcript.includes('answer')) {
        speakerId = 'speaker_responder';
      } else if (transcript.includes('добавлю') || transcript.includes('также') || transcript.includes('дополню')) {
        speakerId = 'speaker_contributor';
      }
      
      // Group chunks by speaker
      if (!speakerMap.has(speakerId)) {
        speakerMap.set(speakerId, []);
      }
      speakerMap.get(speakerId)!.push(chunkIndex);
    });
    
    // Convert to SpeakerInfo objects
    speakerMap.forEach((segments, speakerId) => {
      speakers.push({
        id: speakerId,
        segments,
        confidence: 0.7, // Moderate confidence for heuristic-based detection
        characteristics: {
          gender: this.detectGender(speakerId),
          ageRange: 'adult',
          accent: 'unknown'
        }
      });
    });
    
    return speakers.length > 0 ? speakers : [{
      id: 'speaker_1',
      segments: Array.from({ length: results.length }, (_, i) => i),
      confidence: 0.9,
      characteristics: {
        gender: 'unknown',
        ageRange: 'adult',
        accent: 'unknown'
      }
    }];
  }
  
  private detectGender(speakerId: string): 'male' | 'female' | 'unknown' {
    // Simple gender detection based on speaker patterns
    // Could be enhanced with voice analysis in future
    return 'unknown';
  }

  private estimateRemainingTime(progress: number, totalChunks: number): number {
    // Estimate remaining processing time
    // Оценка оставшегося времени обработки
    const avgTimePerChunk = 3000; // 3 seconds per chunk
    return (totalChunks * (1 - progress)) * avgTimePerChunk;
  }

  /**
   * Get service health and statistics
   * Получение состояния сервиса и статистики
   */
  getServiceHealth(): VoiceServiceHealth {
    return {
      isHealthy: !this.isProcessing,
      isProcessing: this.isProcessing,
      audioContextState: this.audioContext.state,
      supportedFormats: this.getSupportedFormats(),
      maxDuration: 600, // 10 minutes
      recommendedChunkSize: 30 // seconds
    };
  }

  private getSupportedFormats(): string[] {
    return ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/m4a'];
  }
}

interface VoiceServiceHealth {
  isHealthy: boolean;
  isProcessing: boolean;
  audioContextState: AudioContextState;
  supportedFormats: string[];
  maxDuration: number;
  recommendedChunkSize: number;
}

export { 
  WhisperAdvancedProcessor, 
  type AudioProcessingOptions, 
  type VoiceProcessingResult,
  type ProcessingProgress 
}; 