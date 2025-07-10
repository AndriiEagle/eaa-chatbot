// 🧪 QUICK TEST: Memory System Fact Extraction
// This script tests if the updated memory system correctly extracts facts from user messages

import { chatMemory } from './src/utils/memory/index.js';
import { supabase } from './src/services/supabaseService.js';
import { openai } from './src/services/openaiService.js';
import { v4 as uuidv4 } from 'uuid';

console.log('🧪 [TEST] Starting Memory System Test...\n');

async function testMemorySystem() {
  try {
    // Initialize the memory system
    console.log('🔧 [TEST] Initializing ChatMemoryManager...');
    chatMemory.initialize(supabase, openai);
    
    // Create a test session
    console.log('📝 [TEST] Creating test session...');
    const testUserId = 'test-memory-user-' + Date.now();
    const testSessionId = await chatMemory.createSession(testUserId, { test: true });
    console.log(`✅ [TEST] Created session: ${testSessionId}`);
    
    // Test business message that should trigger fact extraction
    const businessMessage = "I run a small restaurant in Berlin. We have a website and serve about 100 customers daily. We're looking to improve our accessibility compliance.";
    
    console.log('\n💬 [TEST] Saving business message...');
    console.log(`Message: "${businessMessage}"`);
    
    const messageId = await chatMemory.saveMessage(
      businessMessage,
      'user',
      testSessionId,
      { test: true }
    );
    
    console.log(`✅ [TEST] Message saved with ID: ${messageId}`);
    
    // Wait a bit for fact extraction to complete
    console.log('\n⏳ [TEST] Waiting for fact extraction to complete...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if facts were extracted
    console.log('\n🔍 [TEST] Checking extracted facts...');
    const extractedFacts = await chatMemory.getUserFacts(testUserId);
    
    console.log(`\n📊 [TEST] Results:`);
    console.log(`• Total facts extracted: ${extractedFacts.length}`);
    
    if (extractedFacts.length > 0) {
      console.log('\n✅ [TEST] SUCCESS! Facts were extracted:');
      extractedFacts.forEach((fact, index) => {
        console.log(`   ${index + 1}. ${fact.fact_type}: ${fact.fact_value} (confidence: ${fact.confidence})`);
      });
    } else {
      console.log('\n❌ [TEST] FAILED! No facts were extracted from the business message.');
    }
    
    // Clean up test data
    console.log('\n🧹 [TEST] Cleaning up test data...');
    await chatMemory.deleteSession(testSessionId);
    console.log('✅ [TEST] Test cleanup completed');
    
  } catch (error) {
    console.error('\n❌ [TEST] Error during memory system test:', error);
  }
}

// Run the test
testMemorySystem()
  .then(() => {
    console.log('\n🎉 [TEST] Memory system test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 [TEST] Test failed:', error);
    process.exit(1);
  }); 