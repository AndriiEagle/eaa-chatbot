import { createEmbedding } from '../../src/services/openaiService.ts';
import { findRelevantChunks } from '../../src/services/supabaseService.ts';

async function testServices() {
    console.log('🧪 ТЕСТИРОВАНИЕ КРИТИЧЕСКИХ СЕРВИСОВ...\n');
    
    // Тест 1: OpenAI Embedding
    console.log('1️⃣ Тестируем OpenAI Embedding API...');
    try {
        const testText = "Что такое EAA?";
        console.log(`   📤 Отправляем: "${testText}"`);
        
        const embedding = await createEmbedding(testText);
        
        console.log(`   ✅ Embedding получен! Размер: ${embedding.length}`);
        console.log(`   📊 Первые 5 значений: [${embedding.slice(0, 5).map(x => x.toFixed(4)).join(', ')}...]`);
        
        // Тест 2: Supabase поиск
        console.log('\n2️⃣ Тестируем Supabase поиск...');
        console.log('   📤 Выполняем векторный поиск...');
        
        const chunks = await findRelevantChunks(
            embedding,     // используем полученный embedding
            'eaa',         // dataset_id
            0.75,          // similarity_threshold
            3              // max_chunks
        );
        
        console.log(`   ✅ Поиск выполнен! Найдено чанков: ${chunks.length}`);
        
        if (chunks.length > 0) {
            console.log('   📚 Первый найденный чанк:');
            console.log(`      - ID: ${chunks[0].id || 'N/A'}`); 
            console.log(`      - Содержимое: ${chunks[0].content?.substring(0, 100) || 'N/A'}...`);
            console.log(`      - Релевантность: ${chunks[0].similarity || 'N/A'}`);
        } else {
            console.log('   ⚠️ Чанки не найдены (возможно, пустая база данных)');
        }
        
        console.log('\n🎉 ВСЕ СЕРВИСЫ РАБОТАЮТ КОРРЕКТНО!');
        console.log('🔧 Проблема НЕ в OpenAI или Supabase API');
        console.log('🔍 Нужно искать проблему в другом месте...');
        
    } catch (embeddingError) {
        console.error('\n❌ ОШИБКА В OpenAI Embedding API:');
        console.error('   Тип ошибки:', embeddingError.name);
        console.error('   Сообщение:', embeddingError.message);
        console.error('   Полная ошибка:', embeddingError);
        
        if (embeddingError.message?.includes('API key')) {
            console.error('\n🔑 ПРОБЛЕМА: Неправильный или отсутствующий OPENAI_API_KEY');
            console.error('   Решение: Проверь переменную OPENAI_API_KEY в .env файле');
        }
        
        if (embeddingError.message?.includes('quota')) {
            console.error('\n💳 ПРОБЛЕМА: Превышен лимит OpenAI API');
            console.error('   Решение: Проверь баланс и лимиты в аккаунте OpenAI');
        }
        
        return; // Выходим, так как без embedding не можем тестировать Supabase
    }
    
    // Если дошли сюда, то OpenAI работает, но может быть проблема с Supabase
    try {
        console.log('\n⚠️ OpenAI работает, но проверим Supabase с тестовым embedding...');
        
        // Создаем тестовый embedding для проверки Supabase
        const testEmbedding = new Array(1536).fill(0.1); // стандартный размер для text-embedding-ada-002
        
        const chunks = await findRelevantChunks(
            testEmbedding,
            'eaa',
            0.75,
            3
        );
        
        console.log(`   ✅ Supabase работает! Найдено: ${chunks.length} чанков`);
        
    } catch (supabaseError) {
        console.error('\n❌ ОШИБКА В Supabase:');
        console.error('   Тип ошибки:', supabaseError.name);
        console.error('   Сообщение:', supabaseError.message);
        console.error('   Полная ошибка:', supabaseError);
        
        if (supabaseError.message?.includes('match_documents')) {
            console.error('\n🗄️ ПРОБЛЕМА: Функция match_documents не существует в Supabase');
            console.error('   Решение: Нужно создать SQL функцию match_documents в базе данных');
        }
        
        if (supabaseError.message?.includes('authentication')) {
            console.error('\n🔑 ПРОБЛЕМА: Ошибка аутентификации Supabase');
            console.error('   Решение: Проверь SUPABASE_URL и SUPABASE_SERVICE_KEY в .env файле');
        }
    }
}

testServices().catch(console.error); 