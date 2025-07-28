import { z } from 'zod';

// 🎯 ENTERPRISE-LEVEL VALIDATION SCHEMAS
// Using Zod for runtime type validation and sanitization

// Base validation schemas
export const userIdSchema = z
  .string()
  .min(1, 'User ID cannot be empty')
  .max(100, 'User ID too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'User ID contains invalid characters');

export const sessionIdSchema = z
  .string()
  .min(1, 'Session ID cannot be empty')
  .max(100, 'Session ID too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Session ID contains invalid characters');

export const questionSchema = z
  .string()
  .min(1, 'Question cannot be empty')
  .max(2000, 'Question too long')
  .transform(str => str.trim()); // Auto-sanitization

// Suggestion Service schemas
export const suggestionRequestSchema = z.object({
  userId: userIdSchema,
  sessionId: sessionIdSchema,
  currentQuestion: questionSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type SuggestionRequestValidated = z.infer<
  typeof suggestionRequestSchema
>;

// Ask Controller schemas
export const askRequestSchema = z.object({
  question: questionSchema,
  session_id: sessionIdSchema.optional(),
  user_id: userIdSchema.optional().default('anonymous'),
  dataset_id: z.string().min(1).max(50).default('eaa'),
  similarity_threshold: z.number().min(0).max(1).default(0.78),
  max_chunks: z.number().int().min(1).max(20).default(5),
  stream: z.boolean().optional().default(false),
});

export type AskRequestValidated = z.infer<typeof askRequestSchema>;

// User fact validation
export const factTypeSchema = z.enum([
  'business_type',
  'business_size',
  'customer_base',
  'physical_location',
  'web_presence',
  'service_types',
  'compliance_status',
  'business_location',
  'business_digital_presence',
  'accessibility_audit_done',
]);

export const userFactSchema = z.object({
  user_id: userIdSchema,
  fact_type: factTypeSchema,
  fact_value: z.string().min(1).max(500),
  confidence: z.number().min(0).max(1),
  source_message_id: z.string().optional(),
});

// Chat message validation
export const messageRoleSchema = z.enum(['user', 'assistant', 'system']);

export const chatMessageSchema = z.object({
  session_id: sessionIdSchema,
  role: messageRoleSchema,
  content: z.string().min(1).max(10000),
  metadata: z
    .object({
      sources: z.array(z.unknown()).optional(),
      performance: z
        .object({
          embedding_ms: z.number().min(0),
          search_ms: z.number().min(0),
          generate_ms: z.number().min(0),
          total_ms: z.number().min(0),
        })
        .optional(),
      suggestions: z.array(z.string()).optional(),
    })
    .optional(),
});

// Frustration analysis validation
export const frustrationAnalysisSchema = z.object({
  user_id: userIdSchema,
  session_id: sessionIdSchema,
  frustration_level: z.number().min(0).max(1),
  escalation_risk: z.number().min(0).max(1),
  trigger_phrases: z.array(z.string()).max(20),
  confidence: z.number().min(0).max(1),
  recommendation: z.enum(['gentle', 'direct', 'technical', 'business_focused']),
});

// Environment variable validation
export const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3000'),
});

// Validation helper functions
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string = 'data'
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(
        `${context} validation failed: ${firstError.message}`,
        firstError.path.join('.'),
        data
      );
    }
    throw error;
  }
}

export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', '),
      };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

// Rate limiting schemas
export const rateLimitSchema = z.object({
  windowMs: z.number().int().min(1000).default(60000), // 1 minute
  maxRequests: z.number().int().min(1).default(100),
  skipSuccessfulRequests: z.boolean().default(false),
});

// Configuration schemas
export const aiConfigSchema = z.object({
  model: z.string().default('gpt-4o-mini'),
  temperature: z.number().min(0).max(2).default(0.2),
  maxTokens: z.number().int().min(1).max(4000).default(1000),
  timeout: z.number().int().min(1000).default(30000), // 30 seconds
});

export const suggestionConfigSchema = z.object({
  maxSuggestions: z.number().int().min(1).max(20).default(5),
  minConfidence: z.number().min(0).max(1).default(0.5),
  enablePersonalization: z.boolean().default(true),
  enableFrustrationDetection: z.boolean().default(true),
});
