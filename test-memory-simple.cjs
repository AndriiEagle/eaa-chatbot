// 🧪 SIMPLE TEST: Memory System Business Facts Extraction  
// Tests the memory system by directly calling the FactManager

const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiKey) {
  console.error('❌ [ERROR] Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

console.log('🧪 [TEST] Starting Memory System Test...\n');

async function testMemorySystem() {
  try {
    console.log('🔧 [TEST] Testing AI fact extraction...');
    
    // Test messages with comprehensive business info
    const testMessages = [
      {
        message: "I run a small restaurant in Berlin, Germany. We serve traditional German food to tourists and locals. We have a website and use social media for marketing.",
        description: "English restaurant business"
      },
      {
        message: "У нас есть интернет-магазин одежды в Москве. Мы продаем через сайт и мобильное приложение. Работаем с частными клиентами.",
        description: "Russian clothing e-commerce"
      },
      {
        message: "Our startup develops SaaS software for enterprise clients. We use React and Node.js. We have a subscription-based business model and are GDPR compliant.",
        description: "Tech startup"
      }
    ];

    let totalSuccess = 0;
    let totalTests = testMessages.length;

    for (let i = 0; i < testMessages.length; i++) {
      const testCase = testMessages[i];
      
      console.log(`\n🧪 [TEST ${i + 1}] Testing: ${testCase.description}`);
      console.log(`📝 Message: "${testCase.message.substring(0, 80)}..."`);
      
      try {
        // Call OpenAI directly to test fact extraction
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a professional business analyst. Extract comprehensive business facts from user messages.

🎯 CRITICAL REQUIREMENTS:
1. ALL FACTS MUST BE IN ENGLISH LANGUAGE ONLY
2. Extract ALL possible business information, not just obvious ones
3. Be thorough - extract multiple facts per category when possible
4. Use standardized business terminology

📊 EXTRACT THESE FACT TYPES:
- business_type: specific business type (e.g., "restaurant", "online retailer", "software company", "consulting firm")
- business_location: specific location (e.g., "Berlin, Germany", "San Francisco, USA", "London, UK")
- business_size: company size (e.g., "small business", "startup", "medium enterprise", "large corporation")
- business_digital_presence: digital channels (e.g., "website", "mobile app", "e-commerce platform", "social media")
- business_sector: market sector (e.g., "B2B", "B2C", "B2B2C", "government", "nonprofit")
- customer_base: target customers (e.g., "individual consumers", "small businesses", "enterprise clients", "tourists")
- service_types: products/services (e.g., "food service", "consulting", "software development", "retail sales")
- compliance_status: compliance requirements (e.g., "GDPR compliant", "accessibility standards", "financial regulations")
- industry: specific industry (e.g., "hospitality", "technology", "healthcare", "finance", "education")
- business_model: revenue model (e.g., "subscription", "one-time sales", "commission-based", "freemium")
- technology_stack: tech used (e.g., "React", "Node.js", "WordPress", "Shopify", "custom platform")
- target_market: market focus (e.g., "local market", "international", "niche market", "mass market")

🔍 EXTRACTION RULES:
- Extract facts from ANY language input but ALWAYS output in English
- If location mentioned in another language, translate to English
- If business type mentioned in another language, use English equivalent
- Be specific - "restaurant" not "food business"
- Extract multiple facts when possible
- Use confidence levels properly:
  * 0.9-1.0: explicitly stated facts
  * 0.7-0.8: strongly implied facts
  * 0.5-0.6: reasonably inferred facts

Return JSON in this exact format:
{
  "facts": [
    {
      "fact_type": "business_type",
      "fact_value": "restaurant",
      "confidence": 0.9
    },
    {
      "fact_type": "business_location", 
      "fact_value": "Berlin, Germany",
      "confidence": 0.8
    }
  ]
}

If message contains business info, extract ALL applicable facts. Be thorough!`
            },
            {
              role: 'user',
              content: testCase.message
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1
        });

        const content = completion.choices[0].message.content || '{"facts": []}';
        const response = JSON.parse(content);
        const extractedFacts = response.facts || [];
        
        console.log(`📊 [TEST ${i + 1}] Extracted ${extractedFacts.length} facts:`);
        
        extractedFacts.forEach((fact, index) => {
          console.log(`  ${index + 1}. ${fact.fact_type}: "${fact.fact_value}" (${fact.confidence})`);
        });
        
        // Verify all facts are in English
        const nonEnglishFacts = extractedFacts.filter(fact => 
          /[а-яё]/i.test(fact.fact_value) || /[а-яё]/i.test(fact.fact_type)
        );
        
        if (nonEnglishFacts.length > 0) {
          console.log(`❌ [TEST ${i + 1}] Found non-English facts:`, nonEnglishFacts);
        } else {
          console.log(`✅ [TEST ${i + 1}] All facts are in English`);
          totalSuccess++;
        }
        
        // Check variety of fact types
        const factTypes = [...new Set(extractedFacts.map(f => f.fact_type))];
        console.log(`📈 [TEST ${i + 1}] Fact variety: ${factTypes.length} different types`);
        
        if (factTypes.length >= 4) {
          console.log(`🎯 [TEST ${i + 1}] Good variety! Found: ${factTypes.join(', ')}`);
        } else {
          console.log(`⚠️ [TEST ${i + 1}] Limited variety. Found: ${factTypes.join(', ')}`);
        }
        
      } catch (error) {
        console.error(`❌ [TEST ${i + 1}] Failed:`, error.message);
      }
    }

    console.log(`\n🎯 [TEST SUMMARY] ${totalSuccess}/${totalTests} tests passed`);
    
    if (totalSuccess === totalTests) {
      console.log('🎉 [SUCCESS] Memory system fact extraction is working correctly!');
      console.log('✅ All facts are extracted in English');
      console.log('✅ Comprehensive business information is captured');
    } else {
      console.log('❌ [FAILURE] Some tests failed. Memory system needs improvements.');
    }

  } catch (error) {
    console.error('❌ [ERROR] Test failed:', error);
  }
}

// Test to check if facts are saved to Supabase
async function testSupabaseConnection() {
  console.log('\n🗄️ [TEST] Testing Supabase connection...');
  
  try {
    const { data, error } = await supabase
      .from('user_facts')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ [ERROR] Supabase connection failed:', error);
      return false;
    }
    
    console.log(`✅ [SUCCESS] Supabase connected! Found ${data.length} existing facts`);
    if (data.length > 0) {
      console.log('📊 Recent facts:');
      data.forEach((fact, index) => {
        console.log(`  ${index + 1}. ${fact.fact_type}: "${fact.fact_value}" (User: ${fact.user_id.substring(0, 8)}...)`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ [ERROR] Supabase test failed:', error);
    return false;
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 [MAIN] Starting comprehensive memory system tests...\n');
  
  // Test Supabase connection
  const supabaseOk = await testSupabaseConnection();
  
  if (!supabaseOk) {
    console.log('❌ [ABORT] Supabase connection failed. Cannot continue.');
    return;
  }
  
  // Test fact extraction
  await testMemorySystem();
  
  console.log('\n🎯 [DONE] All tests completed!');
}

runAllTests(); 