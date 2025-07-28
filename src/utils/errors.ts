/**
 * Professional error handling system
 * Replaces catch (error: any) with type-safe error handling
 */

import { logger } from './logger.js';
import { ApplicationError, ErrorDetails } from '../types/strict.types.js';

// Base application error class
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: ErrorDetails;
  public readonly timestamp: string;
  public readonly requestId?: string;
  public readonly userId?: string;
  public readonly sessionId?: string;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: ErrorDetails,
    context?: {
      requestId?: string;
      userId?: string;
      sessionId?: string;
    }
  ) {
    super(message);

    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.requestId = context?.requestId;
    this.userId = context?.userId;
    this.sessionId = context?.sessionId;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): ApplicationError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      requestId: this.requestId,
      userId: this.userId,
      sessionId: this.sessionId,
    };
  }
}

// Specific error classes for different domains
export class ValidationError extends AppError {
  constructor(message: string, field?: string, value?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, true, {
      context: { field, value },
      suggestions: [
        'Check input format',
        'Ensure all required fields are provided',
      ],
    });
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, operation: string, table?: string) {
    super(message, 'DATABASE_ERROR', 500, true, {
      context: { operation, table },
      suggestions: ['Check database connection', 'Verify query syntax'],
    });
  }
}

export class AIServiceError extends AppError {
  constructor(message: string, model: string, operation: string) {
    super(message, 'AI_SERVICE_ERROR', 500, true, {
      context: { model, operation },
      suggestions: [
        'Check API key',
        'Verify model availability',
        'Try again later',
      ],
    });
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', context?: any) {
    super(message, 'AUTHENTICATION_ERROR', 401, true, {
      context,
      suggestions: ['Check credentials', 'Refresh token', 'Login again'],
    });
  }
}

export class AuthorizationError extends AppError {
  constructor(
    message: string = 'Access denied',
    resource?: string,
    context?: any
  ) {
    super(message, 'AUTHORIZATION_ERROR', 403, true, {
      context: { resource, ...context },
      suggestions: ['Check permissions', 'Contact administrator'],
    });
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    super(
      `${resource} not found${identifier ? `: ${identifier}` : ''}`,
      'NOT_FOUND_ERROR',
      404,
      true,
      {
        context: { resource, identifier },
        suggestions: ['Check identifier', 'Verify resource exists'],
      }
    );
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, setting?: string, context?: any) {
    super(message, 'CONFIGURATION_ERROR', 500, false, {
      context: { setting, ...context },
      suggestions: ['Check environment variables', 'Verify configuration file'],
    });
  }
}

export class RateLimitError extends AppError {
  constructor(limit: number, window: string, context?: any) {
    super(
      `Rate limit exceeded: ${limit} requests per ${window}`,
      'RATE_LIMIT_ERROR',
      429,
      true,
      {
        context: { limit, window, ...context },
        suggestions: ['Wait before retrying', 'Reduce request frequency'],
      }
    );
  }
}

export class VoiceProcessingError extends AppError {
  constructor(message: string, stage: string, context?: any) {
    super(message, 'VOICE_PROCESSING_ERROR', 500, true, {
      context: { stage, ...context },
      suggestions: [
        'Check audio format',
        'Verify file size',
        'Try different model',
      ],
    });
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string, operation: string, context?: any) {
    super(message, 'BUSINESS_LOGIC_ERROR', 400, true, {
      context: { operation, ...context },
      suggestions: ['Review business rules', 'Check input data'],
    });
  }
}

// Error handling utilities
export type ErrorHandler<T = void> = (error: Error) => T | Promise<T>;

export class ErrorManager {
  private static instance: ErrorManager;
  private errorHandlers: Map<string, ErrorHandler> = new Map();

  static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }

  registerHandler(errorType: string, handler: ErrorHandler): void {
    this.errorHandlers.set(errorType, handler);
  }

  async handleError(
    error: Error,
    context?: Record<string, unknown>
  ): Promise<void> {
    // Log the error
    logger.error('Application error occurred', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      ...context,
    });

    // Call specific handler if registered
    const handler = this.errorHandlers.get(error.constructor.name);
    if (handler) {
      try {
        await handler(error);
      } catch (handlerError) {
        logger.error('Error handler failed', {
          originalError: error.message,
          handlerError:
            handlerError instanceof Error ? handlerError.message : 'Unknown',
        });
      }
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      await this.sendToMonitoring(error, context);
    }
  }

  private async sendToMonitoring(
    error: Error,
    context?: Record<string, unknown>
  ): Promise<void> {
    // Implementation would send to monitoring service (Sentry, DataDog, etc.)
    // For now, just log
    logger.error('Error sent to monitoring', {
      error: error.message,
      type: error.constructor.name,
      context,
    });
  }
}

// Convert unknown errors to AppError
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR', 500, false, {
      cause: error.name,
      context: { originalStack: error.stack },
    });
  }

  return new AppError(
    typeof error === 'string' ? error : 'An unknown error occurred',
    'UNKNOWN_ERROR',
    500,
    false
  );
}

// Type-safe async wrapper
export async function safeAsync<T>(
  operation: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: AppError }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const appError = normalizeError(error);
    logger.error('Operation failed', {
      error: appError.message,
      code: appError.code,
    });
    return { success: false, error: appError };
  }
}

// Validation helpers
export function validateRequired<T>(
  value: T | null | undefined,
  fieldName: string
): T {
  if (value === null || value === undefined) {
    throw new ValidationError(`${fieldName} is required`, fieldName, value);
  }
  return value;
}

export function validateString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new ValidationError(
      `${fieldName} must be a string`,
      fieldName,
      value
    );
  }
  return value;
}

export function validateNumber(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(
      `${fieldName} must be a valid number`,
      fieldName,
      value
    );
  }
  return value;
}

// Export singleton error manager
export const errorManager = ErrorManager.getInstance();
