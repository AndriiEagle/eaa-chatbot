/**
 * 🚀 БЫСТРАЯ ДЕМОНСТРАЦИЯ СИСТЕМЫ ТЕСТИРОВАНИЯ
 * 
 * Краткий тест для демонстрации решения проблемы "анализ пробелов"
 */

const API_BASE = 'http://localhost:3000/api/v1';

// 🎯 ДЕМОНСТРАЦИОННЫЕ ТЕСТЫ
const DEMO_TESTS = [
  {
    name: '🎯 ИСХОДНАЯ ПРОБЛЕМА: Анализ пробелов',
    description: 'Воспроизведение исходной проблемы пользователя',
    steps: [
      {
        step: 1,
        user: 'Как обеспечить соответствие моего веб-сайта требованиям EAA?',
        expectation: 'Бот должен использовать термин "анализ пробелов" в ответе'
      },
      {
        step: 2,
        user: 'Что такое анализ пробелов?',
        expectation: 'Система должна найти термин и предложить релевантные подсказки'
      }
    ]
  },
  {
    name: '🔍 ТЕСТ ОБНАРУЖЕНИЯ ТЕРМИНОВ',
    description: 'Проверка работы анализатора терминов',
    steps: [
      {
        step: 1,
        user: 'Нужна ли CE маркировка для мобильного приложения?',
        expectation: 'Должен найти термин "CE маркировка" и объяснить разницу продукты/услуги'
      }
    ]
  },
  {
    name: '🛠️ ТЕСТ ТЕХНИЧЕСКИХ ТЕРМИНОВ',
    description: 'Проверка сложных технических концепций',
    steps: [
      {
        step: 1,
        user: 'Что такое conformity assessment для assistive technologies?',
        expectation: 'Должен найти оба термина и предложить контекстные подсказки'
      }
    ]
  }
];

/**
 * 🚀 ЗАПУСК БЫСТРОЙ ДЕМОНСТРАЦИИ
 */
async function runQuickDemo() {
  console.log('🚀 БЫСТРАЯ ДЕМОНСТРАЦИЯ СИСТЕМЫ ТЕСТИРОВАНИЯ');
  console.log('='.repeat(70));
  console.log('🎯 Демонстрация решения проблемы "анализ пробелов"');
  console.log('📚 База: ALL_Chapters_0-6.md (2744 строки)');
  console.log('='.repeat(70));

  // Проверяем доступность API
  console.log('\n🔍 Проверка API...');
  try {
    await checkAPI();
    console.log('✅ API готов к тестированию');
  } catch (error) {
    console.error('❌ API недоступен:', error.message);
    console.log('\n💡 Убедитесь, что сервер запущен:');
    console.log('   cd ParserForChuncks');
    console.log('   npm start');
    return;
  }

  const results = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    demonstrations: []
  };

  // Выполняем демонстрационные тесты
  for (const demo of DEMO_TESTS) {
    console.log(`\n${demo.name}`);
    console.log(`📝 ${demo.description}`);
    console.log('-'.repeat(50));

    const demoResult = {
      name: demo.name,
      steps: [],
      success: true,
      issues: []
    };

    const sessionId = `demo_${Date.now()}`;

    for (const step of demo.steps) {
      results.totalTests++;
      console.log(`\n📍 ШАГ ${step.step}`);
      console.log(`👤 Пользователь: "${step.user}"`);
      console.log(`🎯 Ожидание: ${step.expectation}`);

      try {
        const startTime = Date.now();
        
        const response = await fetch(`${API_BASE}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: step.user,
            user_id: 'demo_user',
            session_id: sessionId
          })
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // Анализируем результат
        const answer = data.answer || '';
        const foundTerms = (data.detectedTerms || []).map(t => t.term);
        const suggestions = data.clarificationQuestions || [];

        console.log(`🤖 Ответ (${answer.length} символов): "${answer.substring(0, 100)}..."`);
        console.log(`🔍 Найденные термины: ${foundTerms.join(', ')}`);
        console.log(`💡 Подсказки: ${suggestions.slice(0, 2).join(' | ')}`);
        console.log(`⏱️ Время ответа: ${responseTime}ms`);

        // Оценка результата
        let stepPassed = true;
        const stepIssues = [];

        // Специальная логика для каждого теста
        if (demo.name.includes('ИСХОДНАЯ ПРОБЛЕМА')) {
          if (step.step === 1) {
            // Проверяем, использует ли бот термин "анализ пробелов"
            const usesGapAnalysis = answer.toLowerCase().includes('анализ пробелов') || 
                                   answer.toLowerCase().includes('gap analysis');
            if (usesGapAnalysis) {
              console.log('✅ Бот использует термин "анализ пробелов"');
            } else {
              console.log('❌ Бот НЕ использует термин "анализ пробелов"');
              stepIssues.push('Бот не использует проблемный термин');
              stepPassed = false;
            }
          } else if (step.step === 2) {
            // Проверяем обнаружение термина и подсказки
            const hasGapTerm = foundTerms.some(term => 
              term.toLowerCase().includes('анализ пробелов') || 
              term.toLowerCase().includes('gap')
            );
            const hasRelevantSuggestions = suggestions.some(s => 
              s.toLowerCase().includes('анализ') || 
              s.toLowerCase().includes('gap') ||
              s.toLowerCase().includes('пробел')
            );

            if (hasGapTerm) {
              console.log('✅ Термин "анализ пробелов" обнаружен');
            } else {
              console.log('❌ Термин "анализ пробелов" НЕ обнаружен');
              stepIssues.push('Термин не найден системой');
              stepPassed = false;
            }

            if (hasRelevantSuggestions) {
              console.log('✅ Релевантные подсказки предложены');
            } else {
              console.log('❌ Релевантные подсказки НЕ предложены');
              stepIssues.push('Нет контекстных подсказок');
              stepPassed = false;
            }
          }
        } else {
          // Общая проверка для других тестов
          if (foundTerms.length > 0) {
            console.log('✅ Термины обнаружены');
          } else {
            console.log('⚠️ Термины не обнаружены');
            stepIssues.push('Не найдены ожидаемые термины');
            stepPassed = false;
          }

          if (suggestions.length > 0) {
            console.log('✅ Подсказки предложены');
          } else {
            console.log('⚠️ Подсказки не предложены');
            stepIssues.push('Отсутствуют подсказки');
          }
        }

        if (stepPassed) {
          results.passedTests++;
          console.log('🎉 ШАГ ПРОЙДЕН УСПЕШНО');
        } else {
          results.failedTests++;
          console.log('❌ ШАГ НЕ ПРОЙДЕН');
          console.log(`🔍 Проблемы: ${stepIssues.join(', ')}`);
          demoResult.success = false;
          demoResult.issues.push(...stepIssues);
        }

        demoResult.steps.push({
          step: step.step,
          passed: stepPassed,
          responseTime,
          foundTerms: foundTerms.length,
          suggestions: suggestions.length,
          issues: stepIssues
        });

      } catch (error) {
        results.failedTests++;
        console.error(`💥 Ошибка в шаге: ${error.message}`);
        demoResult.success = false;
        demoResult.issues.push(`Техническая ошибка: ${error.message}`);
      }

      // Пауза между шагами
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    results.demonstrations.push(demoResult);
    
    console.log(`\n📊 РЕЗУЛЬТАТ ДЕМОНСТРАЦИИ "${demo.name}":`);
    console.log(`${demoResult.success ? '✅ УСПЕШНО' : '❌ НЕУСПЕШНО'}`);
    if (!demoResult.success) {
      console.log(`🔍 Проблемы: ${demoResult.issues.join(', ')}`);
    }
  }

  // Итоговый отчет
  generateDemoReport(results);
}

/**
 * 🔍 ПРОВЕРКА API
 */
async function checkAPI() {
  try {
    const response = await fetch(`${API_BASE}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'test',
        user_id: 'health_check',
        session_id: 'health_check'
      }),
      timeout: 5000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return true;
  } catch (error) {
    throw new Error(`API недоступен: ${error.message}`);
  }
}

/**
 * 📊 ГЕНЕРАЦИЯ ОТЧЕТА ДЕМОНСТРАЦИИ
 */
function generateDemoReport(results) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 ОТЧЕТ БЫСТРОЙ ДЕМОНСТРАЦИИ');
  console.log('='.repeat(70));

  const successRate = Math.round((results.passedTests / results.totalTests) * 100);
  
  console.log(`\n🎯 ОБЩИЕ РЕЗУЛЬТАТЫ:`);
  console.log(`📈 Успешность: ${successRate}% (${results.passedTests}/${results.totalTests})`);
  console.log(`✅ Пройдено шагов: ${results.passedTests}`);
  console.log(`❌ Не пройдено шагов: ${results.failedTests}`);

  console.log(`\n🎭 РЕЗУЛЬТАТЫ ПО ДЕМОНСТРАЦИЯМ:`);
  results.demonstrations.forEach((demo, index) => {
    const status = demo.success ? '✅' : '❌';
    console.log(`   ${index + 1}. ${status} ${demo.name}`);
    if (!demo.success) {
      console.log(`      🔍 Проблемы: ${demo.issues.slice(0, 2).join(', ')}`);
    }
  });

  // Специальная оценка исходной проблемы
  const originalProblemDemo = results.demonstrations.find(d => d.name.includes('ИСХОДНАЯ ПРОБЛЕМА'));
  if (originalProblemDemo) {
    console.log(`\n🎯 ОЦЕНКА ИСХОДНОЙ ПРОБЛЕМЫ "АНАЛИЗ ПРОБЕЛОВ":`);
    if (originalProblemDemo.success) {
      console.log('🎉 ПРОБЛЕМА РЕШЕНА! Система теперь корректно обрабатывает термины');
      console.log('   ✅ Бот использует термин в ответе');
      console.log('   ✅ Система обнаруживает термин при follow-up вопросе');
      console.log('   ✅ Предлагаются релевантные подсказки');
    } else {
      console.log('❌ ПРОБЛЕМА НЕ РЕШЕНА! Требуется доработка системы');
      console.log(`   🔍 Проблемы: ${originalProblemDemo.issues.join(', ')}`);
    }
  }

  console.log(`\n🎯 ИТОГОВАЯ ОЦЕНКА:`);
  if (successRate >= 90) {
    console.log('🟢 ОТЛИЧНО: Система работает превосходно');
  } else if (successRate >= 80) {
    console.log('🟡 ХОРОШО: Система работает хорошо с небольшими недочетами');
  } else if (successRate >= 70) {
    console.log('🟠 УДОВЛЕТВОРИТЕЛЬНО: Есть проблемы для устранения');
  } else {
    console.log('🔴 НЕУДОВЛЕТВОРИТЕЛЬНО: Требуется серьезная доработка');
  }

  console.log('\n💡 СЛЕДУЮЩИЕ ШАГИ:');
  if (successRate >= 90) {
    console.log('   🚀 Запустите полное тестирование: node test-master-suite.js');
    console.log('   📋 Система готова к продакшену');
  } else {
    console.log('   🔧 Исправьте выявленные проблемы');
    console.log('   🧪 Повторите демонстрацию: node test-quick-demo.js');
    console.log('   📋 Затем запустите полное тестирование');
  }

  console.log('\n🏁 БЫСТРАЯ ДЕМОНСТРАЦИЯ ЗАВЕРШЕНА');
  console.log('='.repeat(70));
}

// 🚀 ЗАПУСК ДЕМОНСТРАЦИИ
if (require.main === module) {
  runQuickDemo()
    .then(() => {
      console.log('\n✅ Демонстрация завершена!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Критическая ошибка:', error);
      process.exit(1);
    });
}

module.exports = {
  runQuickDemo,
  DEMO_TESTS
}; 