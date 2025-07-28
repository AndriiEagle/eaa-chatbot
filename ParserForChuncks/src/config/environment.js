import 'dotenv/config';
import { z } from 'zod';

// Schema definition for environment variables
const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  SUPABASE_URL: z.string().url('Valid Supabase URL is required'),
  SUPABASE_SERVICE_KEY: z.string().min(1, 'Supabase service key is required'),
  PORT: z.string().optional(),
});

// Function to provide clear error messages when environment variables are missing
function validateEnvironmentVariables() {
  // Skip validation in test environment but provide dummy keys
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'test-openai-key',
      SUPABASE_URL: process.env.SUPABASE_URL || 'http://test.supabase.co',
      SUPABASE_SERVICE_KEY:
        process.env.SUPABASE_SERVICE_KEY || 'test-supabase-service-key',
      PORT: process.env.PORT,
    };
  }

  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('\n🚨 ============ CONFIGURATION ERROR ============ 🚨');
      console.error('❌ REQUIRED API KEYS ARE MISSING!');
      console.error('This application cannot run without proper API keys.\n');

      console.error('📋 MISSING CONFIGURATION:');
      error.errors.forEach(err => {
        console.error(`   • ${err.path.join('.')}: ${err.message}`);
      });

      console.error('\n🔧 TO FIX THIS ISSUE:');
      console.error('1. Copy the env.example file to .env:');
      console.error('   cp env.example .env');
      console.error('\n2. Edit .env file and add your API keys:');
      console.error('   • OPENAI_API_KEY=your_openai_api_key_here');
      console.error('   • SUPABASE_URL=https://your-project.supabase.co');
      console.error('   • SUPABASE_SERVICE_KEY=your_supabase_service_key_here');
      console.error('\n🔗 GET API KEYS FROM:');
      console.error('   • OpenAI: https://platform.openai.com/api-keys');
      console.error(
        '   • Supabase: https://supabase.com/dashboard (Project Settings > API)'
      );
      console.error(
        '\n⚠️  WITHOUT THESE KEYS, THE APPLICATION WILL NOT START!'
      );
      console.error('================================================\n');

      // Exit the process with error code
      process.exit(1);
    }
    throw error;
  }
}

// Validate environment variables
export const env = validateEnvironmentVariables();

// Configuration settings
export const PORT = Number(env.PORT ?? 3000);
export const EMBEDDING_MODEL = 'text-embedding-ada-002';
export const CHAT_MODEL = 'gpt-4o-mini'; // cheaper GPT‑4‑turbo variant
export const MAX_CONTEXT_CHUNKS = 5;
export const MIN_SIMILARITY = 0.78;
