// Mock environment variables for tests
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.SUPABASE_URL = 'https://test-project.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-supabase-key';
process.env.PORT = '3000';

import { beforeAll } from 'vitest';
import { chatMemory } from '../src/utils/memory';
import { supabase } from '../src/services/supabaseService';
import { openai } from '../src/services/openaiService';

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

beforeAll(() => {
  console.log('🧪 [GLOBAL SETUP] Initializing test environment...');
  
  if (supabase && openai) {
    // Initialize the singleton ChatMemoryManager
    chatMemory.initialize(supabase, openai);
    console.log('✅ [GLOBAL SETUP] ChatMemoryManager initialized for all tests.');
  } else {
    console.error('❌ [GLOBAL SETUP] Supabase or OpenAI client not available. Cannot initialize ChatMemoryManager.');
    // Optionally, throw an error to fail all tests if this setup is critical
    // throw new Error('Critical test setup failed: Supabase/OpenAI clients missing.');
  }
}); 