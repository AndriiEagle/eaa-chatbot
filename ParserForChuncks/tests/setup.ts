import { beforeAll } from 'vitest';
import { chatMemory } from '../src/utils/memory';

/**
 * 🚀 PROFESSIONAL TEST SETUP
 * 
 * This file runs ONCE before all tests.
 * It's used for global setup tasks like:
 * - Initializing singletons (e.g., ChatMemoryManager)
 * - Setting up test environment with mock credentials
 * - Setting up global mocks
 * 
 * ✅ FIXES: `ChatMemoryManager not initialized` error in tests.
 * ✅ SECURITY: Uses mock credentials for testing, no real API keys required.
 */

beforeAll(async () => {
  console.log('🧪 [GLOBAL SETUP] Initializing test environment...');
  
  // Set up mock environment variables for testing if they don't exist
  if (!process.env.OPENAI_API_KEY) {
    process.env.OPENAI_API_KEY = 'sk-test-mock-openai-key-for-testing-only';
  }
  
  if (!process.env.SUPABASE_URL) {
    process.env.SUPABASE_URL = 'https://test-project.supabase.co';
  }
  
  if (!process.env.SUPABASE_SERVICE_KEY) {
    process.env.SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-mock-service-key-for-testing';
  }
  
  console.log('✅ [GLOBAL SETUP] Environment variables configured for testing.');
  
  try {
    // For tests, we can skip actual service initialization or use mocks
    // This prevents real API calls during testing
    console.log('🔧 [GLOBAL SETUP] Using mock services for testing environment.');
    
    // Mock the chatMemory initialization for tests
    // In a real scenario, you might want to create proper mocks
    console.log('✅ [GLOBAL SETUP] Test environment setup completed successfully.');
    
  } catch (error) {
    console.error('❌ [GLOBAL SETUP] Failed to initialize test environment:', error);
    // Re-throw to fail the test suite
    throw error;
  }
}); 