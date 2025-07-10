// 🗄️ CHECK SUPABASE FACTS
// This script checks all facts in the user_facts table and identifies language issues

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ [ERROR] Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabaseFacts() {
  try {
    console.log('🗄️ [CHECK] Analyzing user_facts table...\n');
    
    // Get all facts from Supabase
    const { data: facts, error } = await supabase
      .from('user_facts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ [ERROR] Failed to fetch facts:', error);
      return;
    }
    
    console.log(`📊 [FACTS] Found ${facts.length} total facts in database\n`);
    
    // Analyze language distribution
    const russianFacts = facts.filter(fact => 
      /[а-яё]/i.test(fact.fact_value) || /[а-яё]/i.test(fact.fact_type)
    );
    
    const englishFacts = facts.filter(fact => 
      !/[а-яё]/i.test(fact.fact_value) && !/[а-яё]/i.test(fact.fact_type)
    );
    
    console.log(`🔍 [ANALYSIS] Language distribution:`);
    console.log(`  📝 Russian facts: ${russianFacts.length}`);
    console.log(`  📝 English facts: ${englishFacts.length}`);
    console.log(`  📊 English percentage: ${((englishFacts.length / facts.length) * 100).toFixed(1)}%\n`);
    
    // Show Russian facts (problems)
    if (russianFacts.length > 0) {
      console.log('❌ [PROBLEMS] Facts in Russian (should be English):');
      russianFacts.forEach((fact, index) => {
        console.log(`  ${index + 1}. ${fact.fact_type}: "${fact.fact_value}" (User: ${fact.user_id.substring(0, 8)}..., Created: ${fact.created_at?.substring(0, 10)})`);
      });
      console.log();
    }
    
    // Show recent English facts (correct)
    if (englishFacts.length > 0) {
      console.log('✅ [CORRECT] Recent facts in English:');
      englishFacts.slice(0, 10).forEach((fact, index) => {
        console.log(`  ${index + 1}. ${fact.fact_type}: "${fact.fact_value}" (User: ${fact.user_id.substring(0, 8)}..., Created: ${fact.created_at?.substring(0, 10)})`);
      });
      console.log();
    }
    
    // Show fact type distribution
    const factTypes = {};
    facts.forEach(fact => {
      factTypes[fact.fact_type] = (factTypes[fact.fact_type] || 0) + 1;
    });
    
    console.log('📈 [DISTRIBUTION] Fact types:');
    Object.entries(factTypes)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count} facts`);
      });
    
    // Show user distribution
    const userCounts = {};
    facts.forEach(fact => {
      const shortUserId = fact.user_id.substring(0, 8);
      userCounts[shortUserId] = (userCounts[shortUserId] || 0) + 1;
    });
    
    console.log('\n👥 [USERS] Facts per user:');
    Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([userId, count]) => {
        console.log(`  ${userId}...: ${count} facts`);
      });
    
    // Recommendations
    console.log('\n🎯 [RECOMMENDATIONS]:');
    
    if (russianFacts.length > 0) {
      console.log(`❌ ${russianFacts.length} facts are in Russian - should be cleaned up`);
      console.log('  Recommendation: Delete or translate these facts to English');
    }
    
    if (englishFacts.length > 0) {
      console.log(`✅ ${englishFacts.length} facts are correctly in English`);
      console.log('  The updated memory system is working correctly!');
    }
    
    console.log('\n🔧 [NEXT STEPS]:');
    console.log('1. Clean up Russian facts (optional)');
    console.log('2. Continue testing with new messages');
    console.log('3. Verify that new facts are extracted in English');
    
  } catch (error) {
    console.error('❌ [ERROR] Failed to check facts:', error);
  }
}

checkSupabaseFacts(); 