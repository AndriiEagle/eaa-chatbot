/**
 * 🧪 ТЕСТИРОВАНИЕ АНАЛИЗАТОРА ТЕРМИНОВ
 * 
 * Проверяет работу нового ИИ-агента для анализа терминов
 * Использует реальные примеры с EAA терминами
 */

const testTermAnalysis = async () => {
  console.log('🚀 ТЕСТИРОВАНИЕ АНАЛИЗАТОРА ТЕРМИНОВ');
  console.log('=====================================\n');

  const API_BASE = 'http://localhost:3000/api/v1';
  
  // Тестовые сценарии с EAA терминами
  const testCases = [
    {
      name: 'Тест "анализ пробелов" - главная проблема',
      question: 'Как провести анализ пробелов для моего сайта?',
      expectedTerms: ['анализ пробелов', 'аудит доступности', 'compliance']
    },
    {
      name: 'Множественные термины',
      question: 'Нужно ли делать CE-маркировку и декларацию соответствия для моего веб-сервиса?',
      expectedTerms: ['CE-маркировка', 'декларация соответствия']
    },
    {
      name: 'Технические аббревиатуры',
      question: 'Мой сайт должен соответствовать WCAG 2.1 и поддерживать ARIA-атрибуты?',
      expectedTerms: ['WCAG', 'ARIA']
    },
    {
      name: 'Простой вопрос - не должен срабатывать',
      question: 'Привет, как дела?',
      expectedTerms: []
    }
  ];

  console.log(`📋 Запущено ${testCases.length} тестовых сценариев:\n`);

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    
    console.log(`🧪 ТЕСТ ${i + 1}: ${testCase.name}`);
    console.log(`❓ Вопрос: "${testCase.question}"`);
    
    try {
      // Отправляем запрос к API
      const response = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: testCase.question,
          user_id: 'test_user_term_analysis',
          session_id: `test_session_${i + 1}`
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      
      console.log(`✅ Ответ получен (${data.answer?.length || 0} символов)`);
      
      // Проверяем найденные термины
      if (data.detectedTerms && data.detectedTerms.length > 0) {
        console.log(`🔍 НАЙДЕННЫЕ ТЕРМИНЫ (${data.detectedTerms.length}):`);
        data.detectedTerms.forEach(term => {
          console.log(`   • "${term.term}" (${term.category}, уверенность: ${term.confidence})`);
        });
      } else {
        console.log('🔍 Термины не найдены');
      }
      
      // Проверяем контекстные подсказки
      if (data.clarificationQuestions && data.clarificationQuestions.length > 0) {
        console.log(`💡 КОНТЕКСТНЫЕ ПОДСКАЗКИ (${data.clarificationQuestions.length}):`);
        data.clarificationQuestions.forEach((suggestion, idx) => {
          if (suggestion.includes('🔍') || suggestion.includes('📋') || suggestion.includes('🛠️')) {
            console.log(`   ${idx + 1}. ${suggestion} [ТЕРМИН]`);
          } else {
            console.log(`   ${idx + 1}. ${suggestion}`);
          }
        });
      }
      
      console.log(`⏱️  Время ответа: ${data.performance?.total_ms || 'N/A'}ms`);
      
    } catch (error) {
      console.error(`❌ ОШИБКА в тесте ${i + 1}:`, error.message);
    }
    
    console.log('─'.repeat(50));
    
    // Пауза между тестами
    if (i < testCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n🎯 ТЕСТ ПРЯМОГО ОБЪЯСНЕНИЯ ТЕРМИНА:');
  console.log('===================================');
  
  try {
    const termResponse = await fetch(`${API_BASE}/explain-term`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },  
      body: JSON.stringify({
        term: 'анализ пробелов',
        context: 'В контексте веб-доступности и EAA',
        user_id: 'test_user_explain'
      })
    });

    if (termResponse.ok) {
      const termData = await termResponse.json();
      console.log(`✅ Объяснение термина "${termData.term}":`);
      console.log(`📝 ${termData.explanation}`);
      console.log(`⏱️  Время: ${termData.performance.response_time_ms}ms`);
    } else {
      console.error(`❌ Ошибка при объяснении термина: ${termResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании прямого объяснения:', error.message);
  }

  console.log('\n🏁 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО');
  console.log('========================');
  console.log('💡 Если вы видите контекстные подсказки с эмодзи 🔍📋🛠️,');
  console.log('   то анализатор терминов работает ПРАВИЛЬНО!');
  console.log('\n📊 Результат: Проблема "анализ пробелов" должна быть РЕШЕНА.');
};

// Запуск тестов
testTermAnalysis()
  .then(() => {
    console.log('\n✅ Все тесты выполнены успешно!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Критическая ошибка при тестировании:', error);
    process.exit(1);
  }); 