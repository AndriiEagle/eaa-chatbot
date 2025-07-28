// Set up test environment variables BEFORE any imports
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'sk-test-mock-openai-key-for-ci-testing';
process.env.SUPABASE_URL = 'https://test-project-ci.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-mock-service-key-for-ci';

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
 * - Setting up global mocks
 * 
 * ✅ FIXES: `ChatMemoryManager not initialized` error in tests.
 */

beforeAll(async () => {
  console.log('🧪 [GLOBAL SETUP] Initializing test environment...');
  
  try {
    // Initialize ChatMemoryManager before any tests run
    await chatMemory.initialize(supabase, openai);
    console.log('✅ [GLOBAL SETUP] ChatMemoryManager initialized.');
    
    // For tests, we can skip actual service initialization or use mocks
    // This prevents real API calls during testing
    console.log('🔧 [GLOBAL SETUP] Environment variables are now handled by conditional logic.');
    
    // Mock the chatMemory initialization for tests
    // In a real scenario, you might want to create proper mocks
    console.log('✅ [GLOBAL SETUP] Test environment setup completed successfully.');
    
  } catch (error) {
    console.error('❌ [GLOBAL SETUP] Failed to initialize test environment:', error);
    // Re-throw to fail the test suite
    throw error;
  }
}); 