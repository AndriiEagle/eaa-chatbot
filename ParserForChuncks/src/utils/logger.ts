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
}

// Export singleton instance
export const logger = new Logger(); 