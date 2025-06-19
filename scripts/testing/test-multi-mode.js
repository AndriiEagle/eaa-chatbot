const API_URL = 'http://localhost:3000/api/v1';

async function testMultiMode() {
    console.log('🎯 ТЕСТИРОВАНИЕ РЕЖИМА МНОЖЕСТВЕННЫХ ВОПРОСОВ...\n');
    
    try {
        // Тестируем вопрос, который должен вызвать multi-режим
        const complexQuestions = [
            "Что такое EAA?",
            "Что такое European Accessibility Act?", 
            "Какие требования EAA для веб-сайтов?",
            "Какие штрафы за нарушение EAA и как проверить соответствие?"
        ];
        
        for (let i = 0; i < complexQuestions.length; i++) {
            const question = complexQuestions[i];
            console.log(`\n${i + 1}️⃣ ТЕСТИРУЕМ: "${question}"`);
            console.log('=' .repeat(60));
            
            const requestBody = {
                question: question,
                user_id: "multi-test-user",
                session_id: "multi-test-session",
                dataset_id: "eaa",
                similarity_threshold: 0.75,
                max_chunks: 3
            };
            
            const startTime = Date.now();
            const response = await fetch(`${API_URL}/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            const responseTime = Date.now() - startTime;
            
            console.log(`⏱️ Время ответа: ${responseTime}ms`);
            console.log(`📊 HTTP статус: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ HTTP ошибка: ${response.status}`);
                console.error(`❌ Ответ: ${errorText}`);
                continue;
            }
            
            const data = await response.json();
            
            // Анализируем режим работы
            if (data.multi) {
                console.log(`🔀 MULTI-РЕЖИМ: ${data.answers?.length || 0} вопросов`);
                
                if (data.answers) {
                    data.answers.forEach((answer, idx) => {
                        console.log(`\n   📝 Вопрос ${idx + 1}: ${answer.question}`);
                        console.log(`   💬 Ответ: ${answer.answer.substring(0, 80)}...`);
                        console.log(`   📚 Источники: ${answer.sources?.length || 0}`);
                        console.log(`   ⚡ Performance: emb=${answer.performance?.embedding_ms}ms, search=${answer.performance?.search_ms}ms, gen=${answer.performance?.generate_ms}ms`);
                        
                        // Проверяем на ошибку
                        if (answer.answer.includes('Произошла ошибка при обработке этого вопроса')) {
                            console.log(`   ❌ ОШИБКА В ОТВЕТЕ!`);
                        }
                    });
                }
            } else {
                console.log(`📝 SINGLE-РЕЖИМ`);
                console.log(`💬 Ответ: ${data.answer?.substring(0, 80)}...`);
                console.log(`📚 Источники: ${data.sources?.length || 0}`);
                console.log(`🔍 Нужно уточнение: ${data.needs_clarification}`);
            }
            
            console.log(`🎯 Подсказки: ${data.clarificationQuestions?.length || 0}`);
            console.log(`📋 Шаблоны: ${data.infoTemplates?.length || 0}`);
        }
        
        console.log('\n🏁 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО');
        
    } catch (error) {
        console.error('\n💥 КРИТИЧЕСКАЯ ОШИБКА:', error);
    }
}

testMultiMode(); 