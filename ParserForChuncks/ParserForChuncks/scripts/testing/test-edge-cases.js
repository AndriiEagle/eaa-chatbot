/**
 * 🔬 ТЕСТИРОВАНИЕ ГРАНИЧНЫХ СЛУЧАЕВ И ПОТЕНЦИАЛЬНЫХ ПРОБЛЕМ
 * 
 * Специальные тесты для выявления слабых мест в анализаторе терминов
 * Основано на реальном содержимом документа ALL_Chapters_0-6.md
 */

const API_BASE = 'http://localhost:3000/api/v1';

// 🎯 ГРАНИЧНЫЕ СЛУЧАИ ДЛЯ ТЕСТИРОВАНИЯ
const EDGE_CASE_TESTS = [
  {
    category: 'СМЕШАННЫЕ ЯЗЫКИ',
    description: 'Тесты с терминами на разных языках',
    tests: [
      {
        name: 'Английские термины в русском тексте',
        question: 'Мне нужно провести gap analysis и убедиться в WCAG compliance моего сайта',
        expectedTerms: ['gap analysis', 'WCAG compliance'],
        expectedBehavior: 'Должен найти английские термины и предложить их объяснение на русском'
      },
      {
        name: 'Русские термины с английскими аббревиатурами',
        question: 'Как получить CE marking для продукта с учетом требований к доступности?',
        expectedTerms: ['CE marking', 'доступность'],
        expectedBehavior: 'Должен обработать смешанную терминологию'
      },
      {
        name: 'Полностью английский запрос',
        question: 'How to conduct conformity assessment for assistive technologies under EAA?',
        expectedTerms: ['conformity assessment', 'assistive technologies', 'EAA'],
        expectedBehavior: 'Должен найти термины на английском и предложить объяснения'
      }
    ]
  },

  {
    category: 'КОНТЕКСТНЫЕ ВАРИАЦИИ',
    description: 'Различные формулировки одних концепций',
    tests: [
      {
        name: 'Синонимы анализа пробелов',
        question: 'Как найти недостатки в доступности моего продукта и выявить пробелы в соответствии требованиям?',
        expectedTerms: ['пробелы', 'анализ пробелов', 'недостатки'],
        expectedBehavior: 'Должен связать синонимы с основным термином "анализ пробелов"'
      },
      {
        name: 'Различные названия одного процесса',
        question: 'Нужна ли оценка соответствия или conformity assessment для моего устройства?',
        expectedTerms: ['оценка соответствия', 'conformity assessment'],
        expectedBehavior: 'Должен понимать, что это один и тот же процесс'
      },
      {
        name: 'Неформальные формулировки',
        question: 'Как сделать так, чтобы мой сайт подходил для людей с инвалидностью?',
        expectedTerms: ['доступность', 'люди с инвалидностью', 'persons with disabilities'],
        expectedBehavior: 'Должен связать неформальную формулировку с официальными терминами'
      }
    ]
  },

  {
    category: 'СЛОЖНЫЕ КОНСТРУКЦИИ',
    description: 'Длинные предложения с множественными терминами',
    tests: [
      {
        name: 'Множественные термины в одном предложении',
        question: 'Manufacturers должны провести conformity assessment, подготовить technical documentation и получить CE marking для products, предназначенных для persons with disabilities.',
        expectedTerms: ['Manufacturers', 'conformity assessment', 'technical documentation', 'CE marking', 'products', 'persons with disabilities'],
        expectedBehavior: 'Должен найти все термины и не путать их между собой'
      },
      {
        name: 'Вложенные технические концепции',
        question: 'Как обеспечить functional performance criteria для assistive technologies, включая screen readers и voice control systems, в рамках harmonized standards?',
        expectedTerms: ['functional performance criteria', 'assistive technologies', 'screen readers', 'voice control systems', 'harmonized standards'],
        expectedBehavior: 'Должен обработать иерархию терминов'
      },
      {
        name: 'Очень длинный запрос с контекстом',
        question: 'В рамках подготовки к June 2025 deadline нашей компании как manufacturer необходимо провести gap analysis для всех наших products, включая self-service terminals и mobile applications, чтобы убедиться в compliance с accessibility requirements для persons with disabilities, особенно касающихся screen reader compatibility and keyboard navigation support.',
        expectedTerms: ['June 2025', 'manufacturer', 'gap analysis', 'products', 'self-service terminals', 'mobile applications', 'compliance', 'accessibility requirements', 'persons with disabilities', 'screen reader', 'keyboard navigation'],
        expectedBehavior: 'Должен обработать длинный контекст и найти все ключевые термины'
      }
    ]
  },

  {
    category: 'ПОТЕНЦИАЛЬНЫЕ ЛОЖНЫЕ СРАБАТЫВАНИЯ',
    description: 'Проверка на неправильные срабатывания',
    tests: [
      {
        name: 'Общие слова, не являющиеся терминами',
        question: 'Мне нужна помощь с пониманием того, как работает система.',
        expectedTerms: [],
        expectedBehavior: 'НЕ должен находить термины в общих словах'
      },
      {
        name: 'Слова, похожие на термины',
        question: 'Я хочу провести анализ рынка и найти пробелы в конкуренции.',
        expectedTerms: [],
        expectedBehavior: 'НЕ должен путать "анализ рынка" с "анализ пробелов"'
      },
      {
        name: 'Контекст не связанный с EAA',
        question: 'Как получить сертификат качества для пищевых продуктов?',
        expectedTerms: [],
        expectedBehavior: 'НЕ должен находить EAA термины в неподходящем контексте'
      }
    ]
  },

  {
    category: 'СПЕЦИФИЧЕСКИЕ ПРОБЛЕМЫ EAA',
    description: 'Проблемные ситуации из документа',
    tests: [
      {
        name: 'Путаница между продуктами и услугами',
        question: 'Нужна ли CE маркировка для веб-сайта?',
        expectedTerms: ['CE маркировка', 'веб-сайт'],
        expectedBehavior: 'Должен объяснить разницу между продуктами и услугами'
      },
      {
        name: 'Неправильное понимание сроков',
        question: 'До какого числа нужно внедрить EAA требования?',
        expectedTerms: ['EAA', 'June 2025'],
        expectedBehavior: 'Должен найти правильную дату из документа'
      },
      {
        name: 'Путаница с исключениями',
        question: 'Мое микропредприятие освобождено от всех требований EAA?',
        expectedTerms: ['микропредприятие', 'microenterprises', 'исключения'],
        expectedBehavior: 'Должен объяснить ограничения исключений'
      }
    ]
  },

  {
    category: 'ПРОИЗВОДИТЕЛЬНОСТЬ И НАГРУЗКА',
    description: 'Тесты производительности',
    tests: [
      {
        name: 'Быстрый ответ на простой термин',
        question: 'Что такое EAA?',
        expectedTerms: ['EAA'],
        maxResponseTime: 2000,
        expectedBehavior: 'Должен ответить быстро на простой вопрос'
      },
      {
        name: 'Обработка сложного запроса',
        question: 'Объясни весь процесс conformity assessment для manufacturers, включая все этапы от gap analysis до получения CE marking.',
        expectedTerms: ['conformity assessment', 'manufacturers', 'gap analysis', 'CE marking'],
        maxResponseTime: 8000,
        expectedBehavior: 'Должен обработать сложный запрос в разумное время'
      }
    ]
  }
];

/**
 * 🚀 ЗАПУСК ТЕСТИРОВАНИЯ ГРАНИЧНЫХ СЛУЧАЕВ
 */
async function runEdgeCaseTests() {
  console.log('🔬 ЗАПУСК ТЕСТИРОВАНИЯ ГРАНИЧНЫХ СЛУЧАЕВ');
  console.log('='.repeat(70));
  
  const results = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    categories: {},
    issues: [],
    falsePositives: [],
    performanceIssues: []
  };

  for (const category of EDGE_CASE_TESTS) {
    console.log(`\n📂 КАТЕГОРИЯ: ${category.category}`);
    console.log(`📝 ${category.description}`);
    console.log('-'.repeat(50));

    const categoryResults = {
      total: category.tests.length,
      passed: 0,
      failed: 0,
      issues: []
    };

    for (const test of category.tests) {
      results.totalTests++;
      console.log(`\n🧪 ТЕСТ: ${test.name}`);
      console.log(`❓ Вопрос: "${test.question}"`);
      console.log(`🎯 Ожидаемые термины: ${test.expectedTerms.join(', ')}`);
      console.log(`📋 Поведение: ${test.expectedBehavior}`);

      try {
        const startTime = Date.now();
        
        const response = await fetch(`${API_BASE}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: test.question,
            user_id: 'edge_case_test',
            session_id: `edge_${Date.now()}`
          })
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const foundTerms = (data.detectedTerms || []).map(t => t.term.toLowerCase());
        const suggestions = data.clarificationQuestions || [];

        console.log(`🔍 Найденные термины: ${foundTerms.join(', ')}`);
        console.log(`💡 Подсказки: ${suggestions.slice(0, 2).join(' | ')}`);
        console.log(`⏱️ Время ответа: ${responseTime}ms`);

        // Проверяем результат
        let testPassed = true;
        const testIssues = [];

        // Проверка ожидаемых терминов
        for (const expectedTerm of test.expectedTerms) {
          const found = foundTerms.some(term => 
            term.includes(expectedTerm.toLowerCase()) || 
            expectedTerm.toLowerCase().includes(term)
          );
          
          if (!found) {
            testIssues.push(`Не найден ожидаемый термин: "${expectedTerm}"`);
            testPassed = false;
          }
        }

        // Проверка на ложные срабатывания (если ожидается пустой список)
        if (test.expectedTerms.length === 0 && foundTerms.length > 0) {
          testIssues.push(`Ложное срабатывание: найдены термины ${foundTerms.join(', ')}`);
          results.falsePositives.push({
            test: test.name,
            foundTerms: foundTerms
          });
          testPassed = false;
        }

        // Проверка производительности
        if (test.maxResponseTime && responseTime > test.maxResponseTime) {
          testIssues.push(`Медленный ответ: ${responseTime}ms > ${test.maxResponseTime}ms`);
          results.performanceIssues.push({
            test: test.name,
            responseTime,
            maxTime: test.maxResponseTime
          });
          testPassed = false;
        }

        if (testPassed) {
          results.passedTests++;
          categoryResults.passed++;
          console.log('✅ ТЕСТ ПРОЙДЕН');
        } else {
          results.failedTests++;
          categoryResults.failed++;
          console.log('❌ ТЕСТ НЕ ПРОЙДЕН');
          console.log(`🔍 Проблемы: ${testIssues.join(', ')}`);
          
          categoryResults.issues.push({
            test: test.name,
            issues: testIssues
          });
          
          results.issues.push({
            category: category.category,
            ...errorIssue
          });
        }

      } catch (error) {
        results.failedTests++;
        categoryResults.failed++;
        console.error(`💥 ОШИБКА В ТЕСТЕ: ${error.message}`);
        
        const errorIssue = {
          test: test.name,
          issues: [`Техническая ошибка: ${error.message}`]
        };
        
        categoryResults.issues.push(errorIssue);
        results.issues.push({
          category: category.category,
          ...errorIssue
        });
      }

      // Пауза между тестами
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    results.categories[category.category] = categoryResults;
    
    console.log(`\n📊 РЕЗУЛЬТАТЫ КАТЕГОРИИ "${category.category}":`);
    console.log(`✅ Пройдено: ${categoryResults.passed}/${categoryResults.total}`);
    console.log(`❌ Не пройдено: ${categoryResults.failed}/${categoryResults.total}`);
  }

  // Генерируем отчет
  generateEdgeCaseReport(results);
}

/**
 * 📊 ГЕНЕРАЦИЯ ОТЧЕТА ПО ГРАНИЧНЫМ СЛУЧАЯМ
 */
function generateEdgeCaseReport(results) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 ОТЧЕТ ПО ТЕСТИРОВАНИЮ ГРАНИЧНЫХ СЛУЧАЕВ');
  console.log('='.repeat(70));

  const successRate = Math.round((results.passedTests / results.totalTests) * 100);
  
  console.log(`\n🎯 ОБЩИЕ РЕЗУЛЬТАТЫ:`);
  console.log(`📈 Успешность: ${successRate}% (${results.passedTests}/${results.totalTests})`);
  console.log(`✅ Пройдено тестов: ${results.passedTests}`);
  console.log(`❌ Не пройдено тестов: ${results.failedTests}`);

  console.log(`\n📂 РЕЗУЛЬТАТЫ ПО КАТЕГОРИЯМ:`);
  for (const [categoryName, categoryResult] of Object.entries(results.categories)) {
    const categoryRate = Math.round((categoryResult.passed / categoryResult.total) * 100);
    console.log(`   ${categoryName}: ${categoryRate}% (${categoryResult.passed}/${categoryResult.total})`);
  }

  if (results.falsePositives.length > 0) {
    console.log(`\n⚠️ ЛОЖНЫЕ СРАБАТЫВАНИЯ (${results.falsePositives.length}):`);
    results.falsePositives.forEach((fp, index) => {
      console.log(`   ${index + 1}. ${fp.test}: ${fp.foundTerms.join(', ')}`);
    });
  }

  if (results.performanceIssues.length > 0) {
    console.log(`\n⏱️ ПРОБЛЕМЫ ПРОИЗВОДИТЕЛЬНОСТИ (${results.performanceIssues.length}):`);
    results.performanceIssues.forEach((pi, index) => {
      console.log(`   ${index + 1}. ${pi.test}: ${pi.responseTime}ms (лимит: ${pi.maxTime}ms)`);
    });
  }

  if (results.issues.length > 0) {
    console.log(`\n🔍 ОСНОВНЫЕ ПРОБЛЕМЫ (${results.issues.length}):`);
    results.issues.slice(0, 10).forEach((issue, index) => {
      console.log(`   ${index + 1}. [${issue.category}] ${issue.test}: ${issue.issues.join(', ')}`);
    });
  }

  console.log(`\n�� ОЦЕНКА УСТОЙЧИВОСТИ К ГРАНИЧНЫМ СЛУЧАЯМ:`);
  if (successRate >= 90) {
    console.log('🟢 ОТЛИЧНО: Система устойчива к граничным случаям');
  } else if (successRate >= 80) {
    console.log('🟡 ХОРОШО: Система в основном справляется с граничными случаями');
  } else if (successRate >= 70) {
    console.log('🟠 УДОВЛЕТВОРИТЕЛЬНО: Есть проблемы с граничными случаями');
  } else {
    console.log('🔴 НЕУДОВЛЕТВОРИТЕЛЬНО: Серьезные проблемы с граничными случаями');
  }

  console.log('\n🏁 ТЕСТИРОВАНИЕ ГРАНИЧНЫХ СЛУЧАЕВ ЗАВЕРШЕНО');
  console.log('='.repeat(70));
}

// 🚀 ЗАПУСК ТЕСТИРОВАНИЯ
if (require.main === module) {
  runEdgeCaseTests()
    .then(() => {
      console.log('\n✅ Тестирование граничных случаев завершено!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Критическая ошибка:', error);
      process.exit(1);
    });
}

module.exports = {
  runEdgeCaseTests,
  EDGE_CASE_TESTS
}; 