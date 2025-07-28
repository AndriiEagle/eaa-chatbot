/**
 * 🎯 КОМПЛЕКСНОЕ ТЕСТИРОВАНИЕ АНАЛИЗАТОРА ТЕРМИНОВ EAA
 * 
 * Реальные сценарии для проверки бота на основе документа ALL_Chapters_0-6.md
 * Предотвращает повторение проблем типа "анализ пробелов"
 */

const API_BASE = 'http://localhost:3000/api/v1';

// 🔍 ИЗВЛЕЧЕННЫЕ ИЗ ДОКУМЕНТА ТЕРМИНЫ ДЛЯ ТЕСТИРОВАНИЯ
const EAA_TERMS_DATABASE = {
  // Процессы и методологии
  processes: [
    'анализ пробелов', 'gap analysis', 'аудит доступности', 'conformity assessment',
    'market surveillance', 'диспропорциональная нагрузка', 'fundamental alteration',
    'внутренний контроль производства', 'presumption of conformity'
  ],
  
  // Юридические понятия
  legal: [
    'CE-маркировка', 'декларация соответствия', 'EU Declaration of Conformity',
    'техническая документация', 'harmonized standards', 'technical specifications',
    'экономические операторы', 'микропредприятия', 'переходные периоды'
  ],
  
  // Технические аббревиатуры
  technical: [
    'WCAG', 'EAA', 'ARIA', 'API', 'DOM', 'ICT', 'ATM', 'PDF',
    'HTML', 'CSS', 'JSON', 'XML', 'HTTP', 'HTTPS'
  ],
  
  // Специализированные концепции
  specialized: [
    'assistive technologies', 'screen readers', 'text-to-speech',
    'real-time text', 'total conversation services', 'cochlear implants',
    'refreshable braille displays', 'voice control', 'eye tracking'
  ],
  
  // Бизнес-процессы
  business: [
    'manufacturers', 'importers', 'distributors', 'service providers',
    'conformity procedures', 'market placement', 'product recall',
    'corrective measures', 'enforcement actions'
  ]
};

// 📋 РЕАЛЬНЫЕ ТЕСТОВЫЕ СЦЕНАРИИ НА ОСНОВЕ ДОКУМЕНТА
const COMPREHENSIVE_TEST_SCENARIOS = [
  {
    category: 'КРИТИЧЕСКИЕ ТЕРМИНЫ',
    description: 'Тесты терминов, которые часто вызывают непонимание',
    tests: [
      {
        name: 'Анализ пробелов - главная проблема',
        question: 'Как провести анализ пробелов для соответствия EAA?',
        expectedTerms: ['анализ пробелов', 'gap analysis'],
        expectedSuggestions: ['🔍 Что такое', '📋 Показать примеры', '🛠️ Какие инструменты'],
        context: 'Строка 335-336 документа: Find gaps where your products or services don\'t meet the rules'
      },
      {
        name: 'Диспропорциональная нагрузка',
        question: 'Когда можно применить исключение по диспропорциональной нагрузке?',
        expectedTerms: ['диспропорциональная нагрузка', 'disproportionate burden'],
        expectedSuggestions: ['🔍 Что означает', '📊 Критерии оценки'],
        context: 'Раздел 3.7 документа подробно описывает этот процесс'
      },
      {
        name: 'Fundamental alteration',
        question: 'Что такое fundamental alteration в контексте EAA?',
        expectedTerms: ['fundamental alteration', 'фундаментальное изменение'],
        expectedSuggestions: ['🔍 Определение', '📋 Примеры применения'],
        context: 'Раздел 3.8 документа объясняет эту концепцию'
      }
    ]
  },
  
  {
    category: 'ПРОЦЕДУРНЫЕ ТЕРМИНЫ',
    description: 'Термины связанные с процедурами соответствия',
    tests: [
      {
        name: 'Conformity assessment',
        question: 'Какие процедуры conformity assessment требует EAA?',
        expectedTerms: ['conformity assessment', 'оценка соответствия'],
        expectedSuggestions: ['🔍 Что включает', '📋 Этапы процедуры'],
        context: 'Раздел 5.8 документа описывает процедуры оценки'
      },
      {
        name: 'Internal production control',
        question: 'Что такое internal production control (Module A)?',
        expectedTerms: ['internal production control', 'Module A'],
        expectedSuggestions: ['🔍 Объяснить процедуру', '📋 Требования'],
        context: 'Раздел 5.8.2 документа объясняет эту процедуру'
      },
      {
        name: 'Market surveillance',
        question: 'Как работает market surveillance для EAA продуктов?',
        expectedTerms: ['market surveillance', 'надзор за рынком'],
        expectedSuggestions: ['🔍 Что это', '🛠️ Как проводится'],
        context: 'Раздел 6.3 документа описывает надзор за рынком'
      }
    ]
  },
  
  {
    category: 'ТЕХНИЧЕСКИЕ СТАНДАРТЫ',
    description: 'Термины связанные с техническими стандартами',
    tests: [
      {
        name: 'Harmonized standards',
        question: 'Какие harmonized standards применяются для EAA?',
        expectedTerms: ['harmonized standards', 'гармонизированные стандарты'],
        expectedSuggestions: ['🔍 Что это', '📋 Список стандартов'],
        context: 'Раздел 5.6 документа объясняет гармонизированные стандарты'
      },
      {
        name: 'WCAG compliance',
        question: 'Как обеспечить WCAG compliance для веб-сервисов?',
        expectedTerms: ['WCAG', 'Web Content Accessibility Guidelines'],
        expectedSuggestions: ['🔍 Расшифровка WCAG', '📋 Требования'],
        context: 'Раздел 2.1.1 документа упоминает принципы WCAG'
      },
      {
        name: 'Assistive technologies',
        question: 'Какие assistive technologies должны поддерживать продукты EAA?',
        expectedTerms: ['assistive technologies', 'вспомогательные технологии'],
        expectedSuggestions: ['🔍 Что включает', '📋 Примеры технологий'],
        context: 'Раздел 2.6.2 документа описывает поддержку assistive technologies'
      }
    ]
  },
  
  {
    category: 'БИЗНЕС-ОБЯЗАТЕЛЬСТВА',
    description: 'Термины связанные с обязательствами бизнеса',
    tests: [
      {
        name: 'Economic operators',
        question: 'Какие обязательства у economic operators по EAA?',
        expectedTerms: ['economic operators', 'экономические операторы'],
        expectedSuggestions: ['🔍 Кто это', '📋 Обязательства'],
        context: 'Глава 4 документа подробно описывает обязательства'
      },
      {
        name: 'Manufacturers obligations',
        question: 'Что должны делать manufacturers для соответствия EAA?',
        expectedTerms: ['manufacturers', 'производители'],
        expectedSuggestions: ['🔍 Определение', '📋 Список обязательств'],
        context: 'Раздел 4.2 документа описывает обязательства производителей'
      },
      {
        name: 'Service providers',
        question: 'Какие требования EAA к service providers?',
        expectedTerms: ['service providers', 'поставщики услуг'],
        expectedSuggestions: ['🔍 Кто относится', '📋 Требования'],
        context: 'Раздел 4.5 документа описывает обязательства поставщиков услуг'
      }
    ]
  },
  
  {
    category: 'СЛОЖНЫЕ КОНЦЕПЦИИ',
    description: 'Многокомпонентные термины и концепции',
    tests: [
      {
        name: 'Functional performance criteria',
        question: 'Что такое functional performance criteria в EAA?',
        expectedTerms: ['functional performance criteria', 'критерии функциональной производительности'],
        expectedSuggestions: ['🔍 Определение', '📋 Список критериев'],
        context: 'Раздел 2.9 документа подробно описывает эти критерии'
      },
      {
        name: 'Built environment accessibility',
        question: 'Какие требования EAA к built environment accessibility?',
        expectedTerms: ['built environment', 'доступность среды'],
        expectedSuggestions: ['🔍 Что включает', '📋 Требования'],
        context: 'Раздел 2.10 документа описывает требования к среде'
      },
      {
        name: 'Presumption of conformity',
        question: 'Как работает presumption of conformity при использовании стандартов?',
        expectedTerms: ['presumption of conformity', 'презумпция соответствия'],
        expectedSuggestions: ['🔍 Что означает', '📋 Как получить'],
        context: 'Раздел 5.6.2 документа объясняет эту концепцию'
      }
    ]
  },
  
  {
    category: 'КОНТРОЛЬНЫЕ ТЕСТЫ',
    description: 'Тесты для проверки ложных срабатываний',
    tests: [
      {
        name: 'Простое приветствие',
        question: 'Привет! Как дела?',
        expectedTerms: [],
        expectedSuggestions: [],
        context: 'Не должно срабатывать - простое приветствие'
      },
      {
        name: 'Общий вопрос',
        question: 'Спасибо за помощь!',
        expectedTerms: [],
        expectedSuggestions: [],
        context: 'Не должно срабатывать - благодарность'
      },
      {
        name: 'Короткий ответ',
        question: 'Да, понятно.',
        expectedTerms: [],
        expectedSuggestions: [],
        context: 'Не должно срабатывать - короткий ответ'
      }
    ]
  }
];

// 🎯 СПЕЦИАЛЬНЫЕ ТЕСТЫ НА ОСНОВЕ РЕАЛЬНОГО КОНТЕНТА ДОКУМЕНТА
const DOCUMENT_BASED_TESTS = [
  {
    name: 'Тест цитаты из документа - анализ пробелов',
    question: 'Объясни что означает "Find gaps where your products or services don\'t meet the rules"',
    expectedTerms: ['gaps', 'анализ пробелов'],
    documentReference: 'Строка 335-336: * Find gaps where your products or services don\'t meet the rules.',
    expectedBehavior: 'Должен объяснить концепцию анализа пробелов и предложить подсказки'
  },
  {
    name: 'Тест сложного процесса',
    question: 'Как выполнить conformity assessment procedure согласно Module A?',
    expectedTerms: ['conformity assessment', 'Module A', 'internal production control'],
    documentReference: 'Раздел 5.8.2 описывает процедуру Module A',
    expectedBehavior: 'Должен выявить все технические термины и предложить их объяснение'
  },
  {
    name: 'Тест юридических терминов',
    question: 'Когда нужна EU Declaration of Conformity и CE marking?',
    expectedTerms: ['EU Declaration of Conformity', 'CE marking', 'декларация соответствия'],
    documentReference: 'Разделы 5.4 и 5.5 описывают эти документы',
    expectedBehavior: 'Должен предложить объяснение каждого юридического термина'
  }
];

/**
 * 🚀 ГЛАВНАЯ ФУНКЦИЯ ТЕСТИРОВАНИЯ
 */
async function runComprehensiveTests() {
  console.log('🎯 ЗАПУСК КОМПЛЕКСНОГО ТЕСТИРОВАНИЯ АНАЛИЗАТОРА ТЕРМИНОВ EAA');
  console.log('='.repeat(80));
  console.log(`📊 Всего категорий: ${COMPREHENSIVE_TEST_SCENARIOS.length}`);
  console.log(`🧪 Всего тестов: ${COMPREHENSIVE_TEST_SCENARIOS.reduce((sum, cat) => sum + cat.tests.length, 0)}`);
  console.log(`📋 Специальных тестов: ${DOCUMENT_BASED_TESTS.length}`);
  console.log('='.repeat(80));

  const results = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    categories: {},
    criticalIssues: [],
    recommendations: []
  };

  // Тестируем каждую категорию
  for (const category of COMPREHENSIVE_TEST_SCENARIOS) {
    console.log(`\n📂 КАТЕГОРИЯ: ${category.category}`);
    console.log(`📝 ${category.description}`);
    console.log('-'.repeat(60));

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
      console.log(`📍 Контекст: ${test.context}`);

      try {
        const testResult = await runSingleTest(test);
        
        if (testResult.success) {
          results.passedTests++;
          categoryResults.passed++;
          console.log('✅ ТЕСТ ПРОЙДЕН');
        } else {
          results.failedTests++;
          categoryResults.failed++;
          console.log('❌ ТЕСТ НЕ ПРОЙДЕН');
          categoryResults.issues.push({
            test: test.name,
            issues: testResult.issues
          });
          
          if (testResult.critical) {
            results.criticalIssues.push({
              category: category.category,
              test: test.name,
              issue: testResult.issues[0]
            });
          }
        }

        // Анализируем результат
        analyzeTestResult(test, testResult, results);

      } catch (error) {
        results.failedTests++;
        categoryResults.failed++;
        console.error(`💥 ОШИБКА В ТЕСТЕ: ${error.message}`);
        categoryResults.issues.push({
          test: test.name,
          issues: [`Техническая ошибка: ${error.message}`]
        });
      }

      // Пауза между тестами
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    results.categories[category.category] = categoryResults;
    
    console.log(`\n📊 РЕЗУЛЬТАТЫ КАТЕГОРИИ "${category.category}":`);
    console.log(`✅ Пройдено: ${categoryResults.passed}/${categoryResults.total}`);
    console.log(`❌ Не пройдено: ${categoryResults.failed}/${categoryResults.total}`);
    console.log(`📈 Успешность: ${Math.round((categoryResults.passed / categoryResults.total) * 100)}%`);
  }

  // Специальные тесты на основе документа
  console.log('\n📚 СПЕЦИАЛЬНЫЕ ТЕСТЫ НА ОСНОВЕ ДОКУМЕНТА');
  console.log('='.repeat(60));

  for (const docTest of DOCUMENT_BASED_TESTS) {
    results.totalTests++;
    console.log(`\n📖 ДОКУМЕНТ-ТЕСТ: ${docTest.name}`);
    console.log(`❓ Вопрос: "${docTest.question}"`);
    console.log(`📄 Ссылка на документ: ${docTest.documentReference}`);

    try {
      const testResult = await runDocumentBasedTest(docTest);
      
      if (testResult.success) {
        results.passedTests++;
        console.log('✅ ДОКУМЕНТ-ТЕСТ ПРОЙДЕН');
      } else {
        results.failedTests++;
        console.log('❌ ДОКУМЕНТ-ТЕСТ НЕ ПРОЙДЕН');
        console.log(`🔍 Проблемы: ${testResult.issues.join(', ')}`);
      }
    } catch (error) {
      results.failedTests++;
      console.error(`💥 ОШИБКА В ДОКУМЕНТ-ТЕСТЕ: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Финальный отчет
  generateFinalReport(results);
}

/**
 * 🔬 ВЫПОЛНЕНИЕ ОДНОГО ТЕСТА
 */
async function runSingleTest(test) {
  const response = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: test.question,
      user_id: 'test_comprehensive',
      session_id: `test_${Date.now()}`
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  const issues = [];
  let success = true;

  // Проверяем найденные термины
  const foundTerms = data.detectedTerms || [];
  const foundTermNames = foundTerms.map(t => t.term.toLowerCase());
  
  console.log(`🔍 Найденные термины (${foundTerms.length}): ${foundTermNames.join(', ')}`);

  for (const expectedTerm of test.expectedTerms) {
    const found = foundTermNames.some(term => 
      term.includes(expectedTerm.toLowerCase()) || 
      expectedTerm.toLowerCase().includes(term)
    );
    
    if (!found) {
      issues.push(`Не найден ожидаемый термин: "${expectedTerm}"`);
      success = false;
    }
  }

  // Проверяем подсказки
  const suggestions = data.clarificationQuestions || [];
  console.log(`💡 Подсказки (${suggestions.length}): ${suggestions.slice(0, 3).join(' | ')}`);

  for (const expectedSuggestion of test.expectedSuggestions) {
    const found = suggestions.some(suggestion => 
      suggestion.toLowerCase().includes(expectedSuggestion.toLowerCase())
    );
    
    if (!found) {
      issues.push(`Не найдена ожидаемая подсказка: "${expectedSuggestion}"`);
      success = false;
    }
  }

  // Проверяем качество ответа
  const answerLength = data.answer?.length || 0;
  if (answerLength < 100) {
    issues.push('Ответ слишком короткий');
    success = false;
  }

  return {
    success,
    issues,
    critical: test.expectedTerms.length > 0 && foundTerms.length === 0,
    data
  };
}

/**
 * 📖 ВЫПОЛНЕНИЕ ТЕСТА НА ОСНОВЕ ДОКУМЕНТА
 */
async function runDocumentBasedTest(docTest) {
  const response = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: docTest.question,
      user_id: 'test_document_based',
      session_id: `doc_test_${Date.now()}`
    })
  });

  const data = await response.json();
  const issues = [];
  let success = true;

  // Проверяем, что найдены ожидаемые термины
  const foundTerms = (data.detectedTerms || []).map(t => t.term.toLowerCase());
  
  for (const expectedTerm of docTest.expectedTerms) {
    const found = foundTerms.some(term => 
      term.includes(expectedTerm.toLowerCase()) || 
      expectedTerm.toLowerCase().includes(term)
    );
    
    if (!found) {
      issues.push(`Документ-тест: не найден термин "${expectedTerm}"`);
      success = false;
    }
  }

  // Проверяем, что ответ содержит релевантную информацию
  const answer = data.answer?.toLowerCase() || '';
  const hasRelevantContent = docTest.expectedTerms.some(term => 
    answer.includes(term.toLowerCase())
  );

  if (!hasRelevantContent) {
    issues.push('Ответ не содержит релевантной информации из документа');
    success = false;
  }

  return { success, issues, data };
}

/**
 * 📊 АНАЛИЗ РЕЗУЛЬТАТА ТЕСТА
 */
function analyzeTestResult(test, result, globalResults) {
  // Анализируем качество обнаружения терминов
  if (test.expectedTerms.length > 0) {
    const detectionRate = (result.data.detectedTerms?.length || 0) / test.expectedTerms.length;
    
    if (detectionRate < 0.5) {
      globalResults.recommendations.push({
        type: 'term_detection',
        message: `Низкая точность обнаружения терминов в тесте "${test.name}" (${Math.round(detectionRate * 100)}%)`,
        suggestion: 'Улучшить алгоритм распознавания терминов'
      });
    }
  }

  // Анализируем качество подсказок
  const suggestions = result.data.clarificationQuestions || [];
  const contextualSuggestions = suggestions.filter(s => 
    s.includes('🔍') || s.includes('📋') || s.includes('🛠️')
  );

  if (test.expectedTerms.length > 0 && contextualSuggestions.length === 0) {
    globalResults.recommendations.push({
      type: 'suggestion_quality',
      message: `Отсутствуют контекстные подсказки в тесте "${test.name}"`,
      suggestion: 'Проверить генерацию контекстных подсказок для терминов'
    });
  }
}

/**
 * 📋 ГЕНЕРАЦИЯ ФИНАЛЬНОГО ОТЧЕТА
 */
function generateFinalReport(results) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 ФИНАЛЬНЫЙ ОТЧЕТ КОМПЛЕКСНОГО ТЕСТИРОВАНИЯ');
  console.log('='.repeat(80));

  const successRate = Math.round((results.passedTests / results.totalTests) * 100);
  
  console.log(`\n🎯 ОБЩИЕ РЕЗУЛЬТАТЫ:`);
  console.log(`📈 Успешность: ${successRate}% (${results.passedTests}/${results.totalTests})`);
  console.log(`✅ Пройдено тестов: ${results.passedTests}`);
  console.log(`❌ Не пройдено тестов: ${results.failedTests}`);

  console.log(`\n📂 РЕЗУЛЬТАТЫ ПО КАТЕГОРИЯМ:`);
  for (const [category, categoryResult] of Object.entries(results.categories)) {
    const categoryRate = Math.round((categoryResult.passed / categoryResult.total) * 100);
    console.log(`   ${category}: ${categoryRate}% (${categoryResult.passed}/${categoryResult.total})`);
    
    if (categoryResult.issues.length > 0) {
      console.log(`   ⚠️  Проблемы: ${categoryResult.issues.length}`);
    }
  }

  if (results.criticalIssues.length > 0) {
    console.log(`\n🚨 КРИТИЧЕСКИЕ ПРОБЛЕМЫ (${results.criticalIssues.length}):`);
    results.criticalIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.category} - ${issue.test}: ${issue.issue}`);
    });
  }

  if (results.recommendations.length > 0) {
    console.log(`\n💡 РЕКОМЕНДАЦИИ ПО УЛУЧШЕНИЮ (${results.recommendations.length}):`);
    results.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. [${rec.type}] ${rec.message}`);
      console.log(`      💡 ${rec.suggestion}`);
    });
  }

  console.log(`\n🎯 ОЦЕНКА ГОТОВНОСТИ СИСТЕМЫ:`);
  if (successRate >= 90) {
    console.log('🟢 ОТЛИЧНО: Система готова к продакшену');
  } else if (successRate >= 75) {
    console.log('🟡 ХОРОШО: Система почти готова, требуются небольшие доработки');
  } else if (successRate >= 60) {
    console.log('🟠 УДОВЛЕТВОРИТЕЛЬНО: Требуются значительные улучшения');
  } else {
    console.log('🔴 НЕУДОВЛЕТВОРИТЕЛЬНО: Система требует серьезной доработки');
  }

  console.log('\n🏁 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО');
  console.log('='.repeat(80));
}

// 🚀 ЗАПУСК ТЕСТИРОВАНИЯ
if (require.main === module) {
  runComprehensiveTests()
    .then(() => {
      console.log('\n✅ Все тесты выполнены успешно!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Критическая ошибка при тестировании:', error);
      process.exit(1);
    });
}

module.exports = {
  runComprehensiveTests,
  EAA_TERMS_DATABASE,
  COMPREHENSIVE_TEST_SCENARIOS,
  DOCUMENT_BASED_TESTS
}; 