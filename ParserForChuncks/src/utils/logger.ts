/**
 * Professional logging utility for production applications
 * Replaces console.log with structured, configurable logging
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
  sessionId?: string;
  userId?: string;
  requestId?: string;
}

class Logger {
  private level: LogLevel;
  private isProduction: boolean;

  constructor() {
    this.level =
      process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private formatLogEntry(
    level: string,
    message: string,
    context?: Record<string, any>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context }),
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  private output(entry: LogEntry): void {
    if (this.isProduction) {
      // In production, use structured JSON logging
      console.log(JSON.stringify(entry));
    } else {
      // In development, use formatted output
      const contextStr = entry.context
        ? ` ${JSON.stringify(entry.context)}`
        : '';
      console.log(
        `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}`
      );
    }
  }

  error(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.output(this.formatLogEntry('error', message, context));
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.output(this.formatLogEntry('warn', message, context));
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.output(this.formatLogEntry('info', message, context));
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.output(this.formatLogEntry('debug', message, context));
    }
  }

  // Business logic specific logging methods
  businessOperation(operation: string, context: Record<string, any>): void {
    this.info(`Business operation: ${operation}`, {
      category: 'business',
      ...context,
    });
  }

  apiRequest(
    method: string,
    path: string,
    context?: Record<string, any>
  ): void {
    this.info(`API ${method} ${path}`, {
      category: 'api',
      method,
      path,
      ...context,
    });
  }

  performanceMetric(
    metric: string,
    value: number,
    unit: string,
    context?: Record<string, any>
  ): void {
    this.info(`Performance: ${metric}`, {
      category: 'performance',
      metric,
      value,
      unit,
      ...context,
    });
  }

  securityEvent(event: string, context?: Record<string, any>): void {
    this.warn(`Security event: ${event}`, {
      category: 'security',
      event,
      ...context,
    });
  }

  aiOperation(
    operation: string,
    model: string,
    context?: Record<string, any>
  ): void {
    this.info(`AI operation: ${operation}`, {
      category: 'ai',
      operation,
      model,
      ...context,
    });
  }

  databaseOperation(
    operation: string,
    table: string,
    context?: Record<string, any>
  ): void {
    this.debug(`Database ${operation} on ${table}`, {
      category: 'database',
      operation,
      table,
      ...context,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export commonly used functions for backwards compatibility
export const logInfo = (message: string, context?: Record<string, any>) =>
  logger.info(message, context);
export const logError = (message: string, context?: Record<string, any>) =>
  logger.error(message, context);
export const logDebug = (message: string, context?: Record<string, any>) =>
  logger.debug(message, context);
export const logWarn = (message: string, context?: Record<string, any>) =>
  logger.warn(message, context);

// Structured logging helpers for common patterns
export const logApiCall = (
  endpoint: string,
  method: string,
  duration?: number,
  statusCode?: number
) => {
  logger.apiRequest(method, endpoint, { duration, statusCode });
};

export const logPerformance = (operation: string, startTime: number) => {
  const duration = Date.now() - startTime;
  logger.performanceMetric(operation, duration, 'ms');
};

export const logBusinessEvent = (
  event: string,
  userId?: string,
  sessionId?: string,
  data?: Record<string, any>
) => {
  logger.businessOperation(event, { userId, sessionId, ...data });
};
