/**
 * 📊 Performance Monitor for WHISPER
 * Simple performance monitor for tracking voice processing
 */

import React from 'react';

interface VoiceProcessingResult {
  transcript: string;
  confidence: number;
  language: string;
  duration: number;
  metadata?: any;
}

class PerformanceMonitor {
  private metrics: Map<string, any> = new Map();
  private logs: Array<{
    timestamp: Date;
    type: string;
    message: string;
    data?: any;
  }> = [];

  /**
   * Record voice processing metric
   */
  recordVoiceProcessing(result: VoiceProcessingResult, processingTime: number): void {
    const metric = {
      timestamp: new Date(),
      transcript: result.transcript,
      confidence: result.confidence,
      language: result.language,
      duration: result.duration,
      processingTime,
      transcriptLength: result.transcript.length
    };

    this.metrics.set(`voice_${Date.now()}`, metric);
    
    this.log('voice_processing', `Voice processed: ${result.transcript.substring(0, 50)}...`, {
      confidence: result.confidence,
      processingTime,
      language: result.language
    });

    // Limit the number of metrics
    if (this.metrics.size > 100) {
      const firstKey = this.metrics.keys().next().value;
      this.metrics.delete(firstKey);
    }
  }

  /**
   * Record error
   */
  recordError(type: string, error: Error): void {
    const errorMetric = {
      timestamp: new Date(),
      type,
      message: error.message,
      stack: error.stack
    };

    this.metrics.set(`error_${Date.now()}`, errorMetric);
    
    this.log('error', `Error ${type}: ${error.message}`, {
      errorType: type,
      stack: error.stack
    });

    console.error(`[PerformanceMonitor] Error ${type}:`, error);
  }

  /**
   * Record general metric
   */
  recordMetric(name: string, value: number, metadata?: any): void {
    const metric = {
      timestamp: new Date(),
      name,
      value,
      metadata
    };

    this.metrics.set(`metric_${name}_${Date.now()}`, metric);
    
    this.log('metric', `Metric ${name}: ${value}`, metadata);
  }

  /**
   * Record log
   */
  private log(type: string, message: string, data?: any): void {
    this.logs.push({
      timestamp: new Date(),
      type,
      message,
      data
    });

    // Limit the number of logs
    if (this.logs.length > 200) {
      this.logs.shift();
    }

    // Output to console for debugging
    console.log(`[PerformanceMonitor][${type}] ${message}`, data || '');
  }

  /**
   * Get voice processing stats
   */
  getVoiceProcessingStats(): {
    totalProcessed: number;
    averageConfidence: number;
    averageProcessingTime: number;
    languageDistribution: Record<string, number>;
    recentErrors: number;
  } {
    const voiceMetrics = Array.from(this.metrics.values())
      .filter(metric => metric.transcript !== undefined);

    if (voiceMetrics.length === 0) {
      return {
        totalProcessed: 0,
        averageConfidence: 0,
        averageProcessingTime: 0,
        languageDistribution: {},
        recentErrors: 0
      };
    }

    const totalProcessed = voiceMetrics.length;
    const averageConfidence = voiceMetrics.reduce((sum, m) => sum + m.confidence, 0) / totalProcessed;
    const averageProcessingTime = voiceMetrics.reduce((sum, m) => sum + m.processingTime, 0) / totalProcessed;

    const languageDistribution: Record<string, number> = {};
    voiceMetrics.forEach(metric => {
      const lang = metric.language || 'unknown';
      languageDistribution[lang] = (languageDistribution[lang] || 0) + 1;
    });

    // Count errors in the last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentErrors = this.logs.filter(
      log => log.type === 'error' && log.timestamp > tenMinutesAgo
    ).length;

    return {
      totalProcessed,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      averageProcessingTime: Math.round(averageProcessingTime),
      languageDistribution,
      recentErrors
    };
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 50): Array<{
    timestamp: Date;
    type: string;
    message: string;
    data?: any;
  }> {
    return this.logs.slice(-limit);
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.metrics.clear();
    this.logs = [];
    console.log('[PerformanceMonitor] Data cleared');
  }

  /**
   * Get overall stats
   */
  getOverallStats(): {
    totalMetrics: number;
    totalLogs: number;
    memoryUsage: string;
    uptime: string;
  } {
    const startTime = this.logs.length > 0 ? this.logs[0].timestamp : new Date();
    const uptime = Math.round((Date.now() - startTime.getTime()) / 1000);

    return {
      totalMetrics: this.metrics.size,
      totalLogs: this.logs.length,
      memoryUsage: `${Math.round(this.metrics.size * 0.5)}KB`, // Approximate estimate
      uptime: `${Math.floor(uptime / 60)}m ${uptime % 60}s`
    };
  }

  /**
   * Export data for analysis
   */
  exportData(): {
    metrics: any[];
    logs: any[];
    stats: any;
    exportTime: Date;
  } {
    return {
      metrics: Array.from(this.metrics.values()),
      logs: this.logs,
      stats: {
        voice: this.getVoiceProcessingStats(),
        overall: this.getOverallStats()
      },
      exportTime: new Date()
    };
  }
}

export { PerformanceMonitor };
export type { VoiceProcessingResult }; 