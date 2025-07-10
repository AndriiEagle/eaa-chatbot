// 🧪 COMPREHENSIVE TEST: Memory System - All Business Facts Extraction
// Tests if the updated memory system extracts ALL types of business facts in English

import { chatMemory } from './src/utils/memory/chatMemoryManager.js';
import { supabase } from './src/services/supabaseService.js';
import { openai } from './src/services/openaiService.js';
import { v4 as uuidv4 } from 'uuid';

console.log('🧪 [TEST] Starting Comprehensive Memory System Test...\n');

async function testComprehensiveMemorySystem() {
  try {
    // Initialize the memory system
    console.log('🔧 [TEST] Initializing ChatMemoryManager...');
    chatMemory.initialize(supabase, openai);
    
    // Test messages with various business information
    const testMessages = [
      {
        message: "I run a small restaurant in Berlin, Germany. We serve traditional German food to tourists and locals. We have a website and use social media for marketing.",
        expected: ['business_type', 'business_location', 'business_size', 'customer_base', 'service_types', 'business_digital_presence']
      },
      {
        message: "У нас есть интернет-магазин одежды в Москве. Мы продаем через сайт и мобильное приложение. Работаем с частными клиентами.",
        expected: ['business_type', 'business_location', 'business_digital_presence', 'customer_base', 'service_types']
      },
      {
        message: "Our startup develops SaaS software for enterprise clients. We use React and Node.js. We have a subscription-based business model and are GDPR compliant.",
        expected: ['business_type', 'business_size', 'customer_base', 'technology_stack', 'business_model', 'compliance_status']
      }
    ];

    let totalTests = 0;
    let passedTests = 0;

    for (let i = 0; i < testMessages.length; i++) {
      const testCase = testMessages[i];
      const testUserId = `test-user-${Date.now()}-${i}`;
      
      console.log(`\n🧪 [TEST ${i + 1}] Testing message: "${testCase.message.substring(0, 60)}..."`);
      
      // Create test session
      const testSessionId = uuidv4();
      await chatMemory.createSession(testUserId, testSessionId);
      
      // Add user message (this should trigger fact extraction)
      const messageId = uuidv4();
      await chatMemory.addMessage(testSessionId, {
        id: messageId,
        sessionId: testSessionId,
        content: testCase.message,
        role: 'user',
        timestamp: new Date().toISOString()
      });

      // Wait for fact extraction to complete
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check extracted facts
      const extractedFacts = await chatMemory.getUserFacts(testUserId);
      
      console.log(`📊 [TEST ${i + 1}] Extracted ${extractedFacts.length} facts:`);
      extractedFacts.forEach(fact => {
        console.log(`  - ${fact.fact_type}: "${fact.fact_value}" (${fact.confidence})`);
      });

      // Verify facts are in English
      const nonEnglishFacts = extractedFacts.filter(fact => 
        /[а-яё]/i.test(fact.fact_value) || /[а-яё]/i.test(fact.fact_type)
      );
      
      if (nonEnglishFacts.length > 0) {
        console.log(`❌ [TEST ${i + 1}] Found non-English facts:`, nonEnglishFacts);
      } else {
        console.log(`✅ [TEST ${i + 1}] All facts are in English`);
        passedTests++;
      }
      
      totalTests++;
    }

    console.log(`\n🎯 [TEST SUMMARY] ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 [SUCCESS] All tests passed! Memory system is working correctly.');
    } else {
      console.log('❌ [FAILURE] Some tests failed. Memory system needs improvements.');
    }

  } catch (error) {
    console.error('❌ [ERROR] Test failed:', error);
  }
}

// Run the test
testComprehensiveMemorySystem(); 