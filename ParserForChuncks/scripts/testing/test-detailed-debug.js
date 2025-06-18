const API_URL = 'http://localhost:3000/api/v1';

async function detailedDebugTest() {
    console.log('🔍 ДЕТАЛЬНАЯ ОТЛАДКА API...\n');
    
    try {
        console.log('1️⃣ Проверяем простой health check...');
        const healthResponse = await fetch(`${API_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health OK:', healthData.status);
        
        console.log('\n2️⃣ Отправляем максимально простой запрос...');
        
        const simpleAskBody = {
            question: "EAA",
            user_id: "debug-user",
            session_id: "debug-session",
            dataset_id: "eaa",
            similarity_threshold: 0.75,
            max_chunks: 3
        };
        
        console.log('📤 Отправляем:', JSON.stringify(simpleAskBody, null, 2));
        
        const startTime = Date.now();
        const askResponse = await fetch(`${API_URL}/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(simpleAskBody)
        });
        const responseTime = Date.now() - startTime;
        
        console.log(`\n📊 Время ответа: ${responseTime}ms`);
        console.log(`📊 Статус ответа: ${askResponse.status}`);
        console.log('📊 Заголовки ответа:');
        askResponse.headers.forEach((value, key) => {
            console.log(`   ${key}: ${value}`);
        });
        
        if (!askResponse.ok) {
            const errorText = await askResponse.text();
            console.error('\n❌ HTTP ERROR:');
            console.error('Status:', askResponse.status);
            console.error('Response:', errorText);
            return;
        }
        
        const askData = await askResponse.json();
        console.log('\n📨 ПОЛНЫЙ ОТВЕТ:');
        console.log(JSON.stringify(askData, null, 2));
        
        // Анализируем структуру ответа
        console.log('\n🔍 АНАЛИЗ ОТВЕТА:');
        console.log(`- Multi-режим: ${askData.multi}`);
        console.log(`- Количество answers: ${askData.answers?.length || 0}`);
        console.log(`- Performance total: ${askData.performance?.total_ms}ms`);
        
        if (askData.answers) {
            askData.answers.forEach((answer, index) => {
                console.log(`\n📝 ANSWER ${index + 1}:`);
                console.log(`   Question: ${answer.question}`);
                console.log(`   Answer: ${answer.answer.substring(0, 100)}...`);
                console.log(`   Sources: ${answer.sources?.length || 0}`);
                console.log(`   Performance: emb=${answer.performance?.embedding_ms}ms, search=${answer.performance?.search_ms}ms, gen=${answer.performance?.generate_ms}ms`);
            });
        }
        
        console.log('\n🎯 ПРОБЛЕМА: Все ответы содержат "Произошла ошибка при обработке этого вопроса"');
        console.log('🔧 РЕШЕНИЕ: Проверь логи сервера на конкретные ошибки при обработке!');
        
    } catch (error) {
        console.error('\n💥 КРИТИЧЕСКАЯ ОШИБКА В ТЕСТЕ:', error);
    }
}

detailedDebugTest(); 