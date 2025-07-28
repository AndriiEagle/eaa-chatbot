import { logQuery } from './supabaseService.js';
import { logger } from '../utils/logger.js';

export interface PerformanceMetrics {
  queryId: string;
  userId: string;
  sessionId: string;
  totalTime: number;
}

/**
 * 🎯 ANALYTICS SERVICE
 *
 * Handles all analytics, logging, and performance tracking.
 * Single responsibility: Data collection and analysis.
 */
export class AnalyticsService {
  async logQuery(
    question: string,
    answer: string,
    datasetId: string,
    queryId: string
  ): Promise<void> {
    logger.info('Logging query for analytics', { queryId, datasetId });

    try {
      await logQuery(question, null, answer, datasetId, [], queryId);
    } catch (error) {
      logger.error('Error logging query', { error, queryId });
    }
  }

  async logPerformance(metrics: PerformanceMetrics): Promise<void> {
    logger.info('Logging performance metrics', {
      queryId: metrics.queryId,
      userId: metrics.userId,
      totalTime: metrics.totalTime,
    });

    try {
      // In a real implementation, this would send to analytics service
      logger.info('Performance metrics recorded', metrics);
    } catch (error) {
      logger.error('Error logging performance', {
        error,
        queryId: metrics.queryId,
      });
    }
  }

  async trackUserEvent(
    userId: string,
    event: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    logger.info('Tracking user event', { userId, event });

    try {
      // In a real implementation, this would send to analytics service
      logger.info('User event tracked', { userId, event, metadata });
    } catch (error) {
      logger.error('Error tracking user event', { error, userId, event });
    }
  }
}
