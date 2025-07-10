import { beforeAll } from 'vitest';
import { chatMemory } from '../src/utils/memory';

/**
 * 🚀 PROFESSIONAL TEST SETUP
 * 
 * This file runs ONCE before all tests.
 * It's used for global setup tasks like:
 * - Initializing singletons (e.g., ChatMemoryManager)
 * - Seeding a test database
 * - Setting up global mocks
 * 
 * ✅ FIXES: `ChatMemoryManager not initialized` error in tests.
 */

beforeAll(async () => {
  console.log('🧪 [GLOBAL SETUP] Initializing test environment...');
  
  // Check if environment variables are set
  const hasRequiredEnvVars = process.env.OPENAI_API_KEY && 
                           process.env.SUPABASE_URL && 
                           process.env.SUPABASE_SERVICE_KEY;
  
  if (!hasRequiredEnvVars) {
    console.error('\n🚨 ============ TEST ENVIRONMENT ERROR ============ 🚨');
    console.error('❌ REQUIRED API KEYS ARE MISSING FOR TESTS!');
    console.error('Cannot run tests without proper API keys.\n');
    
    console.error('🔧 TO FIX THIS ISSUE:');
    console.error('1. Copy the env.example file to .env:');
    console.error('   cp env.example .env');
    console.error('\n2. Edit .env file and add your API keys:');
    console.error('   • OPENAI_API_KEY=your_openai_api_key_here');
    console.error('   • SUPABASE_URL=https://your-project.supabase.co');
    console.error('   • SUPABASE_SERVICE_KEY=your_supabase_service_key_here');
    console.error('\n🔗 GET API KEYS FROM:');
    console.error('   • OpenAI: https://platform.openai.com/api-keys');
    console.error('   • Supabase: https://supabase.com/dashboard (Project Settings > API)');
    console.error('\n⚠️  TESTS CANNOT RUN WITHOUT THESE KEYS!');
    console.error('=================================================\n');
    
    // Exit the test process
    process.exit(1);
  }
  
  try {
    // Import services only after environment check
    const { supabase } = await import('../src/services/supabaseService');
    const { openai } = await import('../src/services/openaiService');
    
    if (supabase && openai) {
      // Initialize the singleton ChatMemoryManager
      chatMemory.initialize(supabase, openai);
      console.log('✅ [GLOBAL SETUP] ChatMemoryManager initialized for all tests.');
    } else {
      console.error('❌ [GLOBAL SETUP] Supabase or OpenAI client not available. Cannot initialize ChatMemoryManager.');
      throw new Error('Critical test setup failed: Supabase/OpenAI clients missing.');
    }
  } catch (error) {
    console.error('❌ [GLOBAL SETUP] Failed to initialize test environment:', error);
    // Re-throw to fail the test suite
    throw error;
  }
}); 