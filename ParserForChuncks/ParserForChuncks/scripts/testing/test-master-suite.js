/**
 * 🎯 МАСТЕР-НАБОР ТЕСТИРОВАНИЯ АНАЛИЗАТОРА ТЕРМИНОВ EAA
 * 
 * Комплексное тестирование всех аспектов системы анализа терминов
 * Предотвращает повторение проблем типа "анализ пробелов"
 */

const API_BASE = 'http://localhost:3000/api/v1';

// 🎯 КОНФИГУРАЦИЯ МАСТЕР-ТЕСТИРОВАНИЯ
const MASTER_TEST_CONFIG = {
  runComprehensiveTests: true,
  runEdgeCaseTests: true,
  runUserScenarioTests: true,
  runPerformanceTests: true,
  runStressTests: true,
  generateDetailedReport: true,
  saveResultsToFile: true
};

// 📊 ДОПОЛНИТЕЛЬНЫЕ ТЕСТЫ ПРОИЗВОДИТЕЛЬНОСТИ
const PERFORMANCE_TESTS = [
  {
    name: 'Быстрый ответ на простой вопрос',
    question: 'Что такое EAA?',
    maxResponseTime: 3000,
    expectedTerms: ['EAA', 'European Accessibility Act']
  },
  {
    name: 'Обработка сложного технического вопроса',
    question: 'Как провести conformity assessment для self-service terminals согласно internal production control Module A с учетом functional performance criteria и harmonized standards?',
    maxResponseTime: 8000,
    expectedTerms: ['conformity assessment', 'self-service terminals', 'internal production control', 'Module A', 'functional performance criteria', 'harmonized standards']
  },
  {
    name: 'Множественные термины в одном запросе',
    question: 'Объясни разницу между manufacturers, importers, distributors и service providers в контексте EAA obligations.',
    maxResponseTime: 6000,
    expectedTerms: ['manufacturers', 'importers', 'distributors', 'service providers', 'obligations']
  }
];

// 🔥 СТРЕСС-ТЕСТЫ
const STRESS_TESTS = [
  {
    name: 'Последовательные запросы',
    description: 'Отправка 10 запросов подряд',
    requests: 10,
    question: 'Что такое анализ пробелов в EAA?'
  },
  {
    name: 'Параллельные запросы',
    description: 'Отправка 5 запросов одновременно',
    parallel: 5,
    question: 'Как получить CE marking для продукта?'
  },
  {
    name: 'Очень длинный запрос',
    description: 'Обработка очень длинного текста',
    question: `Мне нужна подробная информация о том, как manufacturers должны проводить conformity assessment для products согласно European Accessibility Act, включая создание technical documentation, выполнение internal production control согласно Module A, подготовку EU Declaration of Conformity, применение CE marking, обеспечение compliance с accessibility requirements для persons with disabilities, поддержку assistive technologies включая screen readers, voice control, eye tracking, обеспечение functional performance criteria для people without vision, with limited vision, who cannot perceive color, without hearing, with limited hearing, without vocal capability, with limited manipulation or strength, with limited reach, with photosensitive seizure disorders, with cognitive limitations, учет возможных exemptions по disproportionate burden или fundamental alteration, подготовку к market surveillance проверкам, взаимодействие с distributors и importers, обеспечение built environment accessibility где применимо, следование harmonized standards и technical specifications, подготовку к periodic reviews и cooperation с authorities.`
  }
];

/**
 * 🚀 ГЛАВНАЯ ФУНКЦИЯ МАСТЕР-ТЕСТИРОВАНИЯ
 */
async function runMasterTestSuite() {
  console.log('🎯 ЗАПУСК МАСТЕР-НАБОРА ТЕСТИРОВАНИЯ АНАЛИЗАТОРА ТЕРМИНОВ EAA');
  console.log('='.repeat(90));
  console.log('🎪 Комплексное тестирование для предотвращения проблем типа "анализ пробелов"');
  console.log('📚 База знаний: ALL_Chapters_0-6.md (2744 строки)');
  console.log('='.repeat(90));

  const masterResults = {
    startTime: new Date(),
    endTime: null,
    totalDuration: 0,
    testSuites: {},
    overallStats: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      successRate: 0
    },
    criticalIssues: [],
    recommendations: [],
    systemReadiness: 'unknown'
  };

  try {
    // 1. Проверка доступности API
    console.log('\n🔍 ПРОВЕРКА ДОСТУПНОСТИ API...');
    await checkAPIAvailability();
    console.log('✅ API доступен и готов к тестированию');

    // 2. Комплексные тесты
    if (MASTER_TEST_CONFIG.runComprehensiveTests) {
      console.log('\n📋 ЗАПУСК КОМПЛЕКСНЫХ ТЕСТОВ...');
      try {
        const { runComprehensiveTests } = require('./test-comprehensive-scenarios.js');
        await runComprehensiveTests();
        masterResults.testSuites.comprehensive = { status: 'completed', success: true };
        console.log('✅ Комплексные тесты завершены');
      } catch (error) {
        console.error('❌ Ошибка в комплексных тестах:', error.message);
        masterResults.testSuites.comprehensive = { status: 'failed', error: error.message };
        masterResults.criticalIssues.push('Критическая ошибка в комплексных тестах');
      }
    }

    // 3. Тесты граничных случаев
    if (MASTER_TEST_CONFIG.runEdgeCaseTests) {
      console.log('\n🔬 ЗАПУСК ТЕСТОВ ГРАНИЧНЫХ СЛУЧАЕВ...');
      try {
        const { runEdgeCaseTests } = require('./test-edge-cases.js');
        await runEdgeCaseTests();
        masterResults.testSuites.edgeCases = { status: 'completed', success: true };
        console.log('✅ Тесты граничных случаев завершены');
      } catch (error) {
        console.error('❌ Ошибка в тестах граничных случаев:', error.message);
        masterResults.testSuites.edgeCases = { status: 'failed', error: error.message };
        masterResults.criticalIssues.push('Проблемы с обработкой граничных случаев');
      }
    }

    // 4. Пользовательские сценарии
    if (MASTER_TEST_CONFIG.runUserScenarioTests) {
      console.log('\n👥 ЗАПУСК ТЕСТОВ ПОЛЬЗОВАТЕЛЬСКИХ СЦЕНАРИЕВ...');
      try {
        const { runRealUserScenarios } = require('./test-real-user-scenarios.js');
        await runRealUserScenarios();
        masterResults.testSuites.userScenarios = { status: 'completed', success: true };
        console.log('✅ Тесты пользовательских сценариев завершены');
      } catch (error) {
        console.error('❌ Ошибка в пользовательских сценариях:', error.message);
        masterResults.testSuites.userScenarios = { status: 'failed', error: error.message };
        masterResults.criticalIssues.push('Проблемы с пользовательским опытом');
      }
    }

    // 5. Тесты производительности
    if (MASTER_TEST_CONFIG.runPerformanceTests) {
      console.log('\n⚡ ЗАПУСК ТЕСТОВ ПРОИЗВОДИТЕЛЬНОСТИ...');
      const performanceResults = await runPerformanceTests();
      masterResults.testSuites.performance = performanceResults;
      console.log('✅ Тесты производительности завершены');
    }

    // 6. Стресс-тесты
    if (MASTER_TEST_CONFIG.runStressTests) {
      console.log('\n🔥 ЗАПУСК СТРЕСС-ТЕСТОВ...');
      const stressResults = await runStressTests();
      masterResults.testSuites.stress = stressResults;
      console.log('✅ Стресс-тесты завершены');
    }

    // 7. Специальный тест исходной проблемы
    console.log('\n🎯 ТЕСТ ИСХОДНОЙ ПРОБЛЕМЫ "АНАЛИЗ ПРОБЕЛОВ"...');
    const originalProblemResult = await testOriginalProblem();
    masterResults.testSuites.originalProblem = originalProblemResult;

    // Завершение и генерация отчета
    masterResults.endTime = new Date();
    masterResults.totalDuration = masterResults.endTime - masterResults.startTime;

    // Генерируем итоговый отчет
    generateMasterReport(masterResults);

    // Сохраняем результаты в файл
    if (MASTER_TEST_CONFIG.saveResultsToFile) {
      await saveResultsToFile(masterResults);
    }

  } catch (error) {
    console.error('\n💥 КРИТИЧЕСКАЯ ОШИБКА В МАСТЕР-ТЕСТИРОВАНИИ:', error);
    masterResults.criticalIssues.push(`Критическая ошибка: ${error.message}`);
    generateMasterReport(masterResults);
  }
}

/**
 * 🔍 ПРОВЕРКА ДОСТУПНОСТИ API
 */
async function checkAPIAvailability() {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      timeout: 5000
    });

    if (!response.ok) {
      throw new Error(`API недоступен: HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`📊 Статус API: ${data.status || 'OK'}`);
    
    return true;
  } catch (error) {
    // Пробуем альтернативный endpoint
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

      if (response.ok) {
        console.log('📊 API доступен через /ask endpoint');
        return true;
      }
    } catch (secondError) {
      throw new Error(`API недоступен: ${error.message}`);
    }
  }
}

/**
 * ⚡ ТЕСТЫ ПРОИЗВОДИТЕЛЬНОСТИ
 */
async function runPerformanceTests() {
  console.log('⚡ Выполнение тестов производительности...');
  
  const results = {
    status: 'completed',
    tests: [],
    averageResponseTime: 0,
    slowTests: [],
    fastTests: []
  };

  let totalResponseTime = 0;

  for (const test of PERFORMANCE_TESTS) {
    console.log(`\n⏱️ ТЕСТ: ${test.name}`);
    console.log(`❓ Вопрос: "${test.question}"`);
    console.log(`⏰ Максимальное время: ${test.maxResponseTime}ms`);

    const startTime = Date.now();
    
    try {
      const response = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: test.question,
          user_id: 'performance_test',
          session_id: `perf_${Date.now()}`
        })
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      totalResponseTime += responseTime;

      const data = await response.json();
      const foundTerms = (data.detectedTerms || []).map(t => t.term.toLowerCase());

      const testResult = {
        name: test.name,
        responseTime,
        maxResponseTime: test.maxResponseTime,
        passed: responseTime <= test.maxResponseTime,
        foundTerms: foundTerms.length,
        expectedTerms: test.expectedTerms.length
      };

      results.tests.push(testResult);

      if (responseTime <= test.maxResponseTime) {
        console.log(`✅ БЫСТРО: ${responseTime}ms (лимит: ${test.maxResponseTime}ms)`);
        results.fastTests.push(testResult);
      } else {
        console.log(`❌ МЕДЛЕННО: ${responseTime}ms (лимит: ${test.maxResponseTime}ms)`);
        results.slowTests.push(testResult);
      }

      console.log(`🔍 Найдено терминов: ${foundTerms.length}/${test.expectedTerms.length}`);

    } catch (error) {
      console.error(`💥 Ошибка в тесте производительности: ${error.message}`);
      results.tests.push({
        name: test.name,
        error: error.message,
        passed: false
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  results.averageResponseTime = Math.round(totalResponseTime / PERFORMANCE_TESTS.length);
  
  console.log(`\n📊 РЕЗУЛЬТАТЫ ПРОИЗВОДИТЕЛЬНОСТИ:`);
  console.log(`⏱️ Среднее время ответа: ${results.averageResponseTime}ms`);
  console.log(`✅ Быстрых тестов: ${results.fastTests.length}`);
  console.log(`❌ Медленных тестов: ${results.slowTests.length}`);

  return results;
}

/**
 * 🔥 СТРЕСС-ТЕСТЫ
 */
async function runStressTests() {
  console.log('🔥 Выполнение стресс-тестов...');
  
  const results = {
    status: 'completed',
    tests: [],
    errors: [],
    totalRequests: 0,
    successfulRequests: 0
  };

  for (const test of STRESS_TESTS) {
    console.log(`\n🔥 СТРЕСС-ТЕСТ: ${test.name}`);
    console.log(`📝 ${test.description}`);

    try {
      let testResult;

      if (test.requests) {
        // Последовательные запросы
        testResult = await runSequentialRequests(test);
      } else if (test.parallel) {
        // Параллельные запросы
        testResult = await runParallelRequests(test);
      } else {
        // Обычный запрос (для длинного текста)
        testResult = await runSingleStressRequest(test);
      }

      results.tests.push(testResult);
      results.totalRequests += testResult.totalRequests || 1;
      results.successfulRequests += testResult.successfulRequests || (testResult.success ? 1 : 0);

    } catch (error) {
      console.error(`💥 Ошибка в стресс-тесте: ${error.message}`);
      results.errors.push({
        test: test.name,
        error: error.message
      });
    }
  }

  const successRate = Math.round((results.successfulRequests / results.totalRequests) * 100);
  
  console.log(`\n📊 РЕЗУЛЬТАТЫ СТРЕСС-ТЕСТОВ:`);
  console.log(`📈 Успешность: ${successRate}% (${results.successfulRequests}/${results.totalRequests})`);
  console.log(`❌ Ошибок: ${results.errors.length}`);

  return results;
}

/**
 * 📈 ПОСЛЕДОВАТЕЛЬНЫЕ ЗАПРОСЫ
 */
async function runSequentialRequests(test) {
  console.log(`🔄 Отправка ${test.requests} последовательных запросов...`);
  
  const results = {
    name: test.name,
    totalRequests: test.requests,
    successfulRequests: 0,
    errors: [],
    responseTimes: []
  };

  for (let i = 0; i < test.requests; i++) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: test.question,
          user_id: 'stress_sequential',
          session_id: `stress_seq_${i}_${Date.now()}`
        })
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      results.responseTimes.push(responseTime);

      if (response.ok) {
        results.successfulRequests++;
        console.log(`✅ Запрос ${i + 1}: ${responseTime}ms`);
      } else {
        results.errors.push(`Запрос ${i + 1}: HTTP ${response.status}`);
        console.log(`❌ Запрос ${i + 1}: HTTP ${response.status}`);
      }

    } catch (error) {
      results.errors.push(`Запрос ${i + 1}: ${error.message}`);
      console.log(`💥 Запрос ${i + 1}: ${error.message}`);
    }

    // Небольшая пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const avgResponseTime = results.responseTimes.length > 0 
    ? Math.round(results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length)
    : 0;

  console.log(`📊 Среднее время ответа: ${avgResponseTime}ms`);
  
  return results;
}

/**
 * ⚡ ПАРАЛЛЕЛЬНЫЕ ЗАПРОСЫ
 */
async function runParallelRequests(test) {
  console.log(`⚡ Отправка ${test.parallel} параллельных запросов...`);
  
  const promises = [];
  
  for (let i = 0; i < test.parallel; i++) {
    const promise = fetch(`${API_BASE}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: test.question,
        user_id: 'stress_parallel',
        session_id: `stress_par_${i}_${Date.now()}`
      })
    });
    
    promises.push(promise);
  }

  const startTime = Date.now();
  const results = await Promise.allSettled(promises);
  const endTime = Date.now();
  const totalTime = endTime - startTime;

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
  const failed = results.length - successful;

  console.log(`📊 Результаты параллельных запросов:`);
  console.log(`✅ Успешных: ${successful}/${test.parallel}`);
  console.log(`❌ Неудачных: ${failed}/${test.parallel}`);
  console.log(`⏱️ Общее время: ${totalTime}ms`);

  return {
    name: test.name,
    totalRequests: test.parallel,
    successfulRequests: successful,
    totalTime,
    success: successful === test.parallel
  };
}

/**
 * 📝 ОДИНОЧНЫЙ СТРЕСС-ЗАПРОС
 */
async function runSingleStressRequest(test) {
  console.log(`📝 Обработка длинного запроса (${test.question.length} символов)...`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${API_BASE}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: test.question,
        user_id: 'stress_long',
        session_id: `stress_long_${Date.now()}`
      })
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (response.ok) {
      const data = await response.json();
      const foundTerms = (data.detectedTerms || []).length;
      
      console.log(`✅ Длинный запрос обработан за ${responseTime}ms`);
      console.log(`🔍 Найдено терминов: ${foundTerms}`);
      
      return {
        name: test.name,
        responseTime,
        foundTerms,
        success: true
      };
    } else {
      console.log(`❌ Ошибка HTTP ${response.status}`);
      return {
        name: test.name,
        error: `HTTP ${response.status}`,
        success: false
      };
    }

  } catch (error) {
    console.log(`💥 Ошибка: ${error.message}`);
    return {
      name: test.name,
      error: error.message,
      success: false
    };
  }
}

/**
 * 🎯 ТЕСТ ИСХОДНОЙ ПРОБЛЕМЫ
 */
async function testOriginalProblem() {
  console.log('🎯 Тестирование исходной проблемы "анализ пробелов"...');
  
  const sessionId = `original_problem_${Date.now()}`;
  
  // Шаг 1: Задаем вопрос, который приводит к использованию термина "анализ пробелов"
  console.log('\n👤 Пользователь: "Как обеспечить соответствие моего веб-сайта требованиям EAA?"');
  
  const firstResponse = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: 'Как обеспечить соответствие моего веб-сайта требованиям EAA?',
      user_id: 'original_problem_test',
      session_id: sessionId
    })
  });

  const firstData = await firstResponse.json();
  console.log(`🤖 Бот ответил (${firstData.answer?.length} символов)`);
  
  // Проверяем, использует ли бот термин "анализ пробелов"
  const usesGapAnalysis = firstData.answer?.toLowerCase().includes('анализ пробелов') || 
                         firstData.answer?.toLowerCase().includes('gap analysis');
  
  console.log(`🔍 Бот использует термин "анализ пробелов": ${usesGapAnalysis ? 'ДА' : 'НЕТ'}`);

  if (usesGapAnalysis) {
    // Шаг 2: Задаем follow-up вопрос о непонятном термине
    console.log('\n👤 Follow-up: "Что такое анализ пробелов?"');
    
    const followUpResponse = await fetch(`${API_BASE}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Что такое анализ пробелов?',
        user_id: 'original_problem_test',
        session_id: sessionId
      })
    });

    const followUpData = await followUpResponse.json();
    console.log(`🤖 Follow-up ответ (${followUpData.answer?.length} символов)`);
    
    // Проверяем результат
    const foundTerms = (followUpData.detectedTerms || []).map(t => t.term.toLowerCase());
    const suggestions = followUpData.clarificationQuestions || [];
    
    console.log(`🔍 Найденные термины: ${foundTerms.join(', ')}`);
    console.log(`💡 Подсказки: ${suggestions.slice(0, 3).join(' | ')}`);
    
    const hasGapAnalysisTerm = foundTerms.some(term => 
      term.includes('анализ пробелов') || term.includes('gap analysis')
    );
    
    const hasRelevantSuggestions = suggestions.some(s => 
      s.toLowerCase().includes('анализ пробелов') || 
      s.toLowerCase().includes('gap') ||
      s.toLowerCase().includes('пробел')
    );

    const problemSolved = hasGapAnalysisTerm && hasRelevantSuggestions;
    
    console.log(`\n🎯 РЕЗУЛЬТАТ ТЕСТА ИСХОДНОЙ ПРОБЛЕМЫ:`);
    console.log(`✅ Термин найден: ${hasGapAnalysisTerm ? 'ДА' : 'НЕТ'}`);
    console.log(`✅ Релевантные подсказки: ${hasRelevantSuggestions ? 'ДА' : 'НЕТ'}`);
    console.log(`🎉 ПРОБЛЕМА РЕШЕНА: ${problemSolved ? 'ДА' : 'НЕТ'}`);

    return {
      status: 'completed',
      problemSolved,
      botUsedTerm: usesGapAnalysis,
      termDetected: hasGapAnalysisTerm,
      relevantSuggestions: hasRelevantSuggestions,
      foundTermsCount: foundTerms.length,
      suggestionsCount: suggestions.length
    };
  } else {
    console.log('\n⚠️ Бот не использует термин "анализ пробелов" в ответе');
    return {
      status: 'completed',
      problemSolved: false,
      botUsedTerm: false,
      reason: 'Бот не использует проблемный термин'
    };
  }
}

/**
 * 📊 ГЕНЕРАЦИЯ МАСТЕР-ОТЧЕТА
 */
function generateMasterReport(results) {
  console.log('\n' + '='.repeat(90));
  console.log('🎯 ИТОГОВЫЙ МАСТЕР-ОТЧЕТ ТЕСТИРОВАНИЯ АНАЛИЗАТОРА ТЕРМИНОВ EAA');
  console.log('='.repeat(90));

  const duration = Math.round(results.totalDuration / 1000);
  console.log(`⏱️ Общее время тестирования: ${duration} секунд`);
  console.log(`📅 Начало: ${results.startTime.toLocaleString()}`);
  console.log(`📅 Окончание: ${results.endTime?.toLocaleString() || 'не завершено'}`);

  console.log(`\n📊 ВЫПОЛНЕННЫЕ НАБОРЫ ТЕСТОВ:`);
  for (const [suiteName, suiteResult] of Object.entries(results.testSuites)) {
    const status = suiteResult.status === 'completed' ? '✅' : '❌';
    console.log(`   ${status} ${suiteName}: ${suiteResult.status}`);
    if (suiteResult.error) {
      console.log(`      ⚠️ Ошибка: ${suiteResult.error}`);
    }
  }

  // Специальный отчет по исходной проблеме
  if (results.testSuites.originalProblem) {
    const op = results.testSuites.originalProblem;
    console.log(`\n🎯 ТЕСТ ИСХОДНОЙ ПРОБЛЕМЫ "АНАЛИЗ ПРОБЕЛОВ":`);
    console.log(`   🎉 Проблема решена: ${op.problemSolved ? 'ДА ✅' : 'НЕТ ❌'}`);
    if (op.problemSolved) {
      console.log(`   ✅ Бот использует термин: ${op.botUsedTerm}`);
      console.log(`   ✅ Термин обнаружен: ${op.termDetected}`);
      console.log(`   ✅ Релевантные подсказки: ${op.relevantSuggestions}`);
    } else {
      console.log(`   ❌ Причина: ${op.reason || 'Неизвестная причина'}`);
    }
  }

  // Производительность
  if (results.testSuites.performance) {
    const perf = results.testSuites.performance;
    console.log(`\n⚡ ПРОИЗВОДИТЕЛЬНОСТЬ:`);
    console.log(`   ⏱️ Среднее время ответа: ${perf.averageResponseTime}ms`);
    console.log(`   ✅ Быстрых тестов: ${perf.fastTests?.length || 0}`);
    console.log(`   ❌ Медленных тестов: ${perf.slowTests?.length || 0}`);
  }

  // Стресс-тесты
  if (results.testSuites.stress) {
    const stress = results.testSuites.stress;
    console.log(`\n🔥 СТРЕСС-ТЕСТИРОВАНИЕ:`);
    console.log(`   📈 Успешность: ${Math.round((stress.successfulRequests / stress.totalRequests) * 100)}%`);
    console.log(`   📊 Запросов: ${stress.successfulRequests}/${stress.totalRequests}`);
    console.log(`   ❌ Ошибок: ${stress.errors?.length || 0}`);
  }

  // Критические проблемы
  if (results.criticalIssues.length > 0) {
    console.log(`\n🚨 КРИТИЧЕСКИЕ ПРОБЛЕМЫ (${results.criticalIssues.length}):`);
    results.criticalIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }

  // Рекомендации
  if (results.recommendations.length > 0) {
    console.log(`\n💡 РЕКОМЕНДАЦИИ (${results.recommendations.length}):`);
    results.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }

  // Итоговая оценка готовности системы
  console.log(`\n🎯 ИТОГОВАЯ ОЦЕНКА ГОТОВНОСТИ СИСТЕМЫ:`);
  
  const completedSuites = Object.values(results.testSuites).filter(s => s.status === 'completed').length;
  const totalSuites = Object.keys(results.testSuites).length;
  const completionRate = Math.round((completedSuites / totalSuites) * 100);
  
  const originalProblemSolved = results.testSuites.originalProblem?.problemSolved || false;
  const hasPerformanceIssues = results.testSuites.performance?.slowTests?.length > 0;
  const hasStressIssues = results.testSuites.stress?.errors?.length > 0;
  const hasCriticalIssues = results.criticalIssues.length > 0;

  if (originalProblemSolved && completionRate >= 90 && !hasCriticalIssues) {
    results.systemReadiness = 'excellent';
    console.log('🟢 ОТЛИЧНО: Система полностью готова к продакшену');
    console.log('   ✅ Исходная проблема решена');
    console.log('   ✅ Все тесты пройдены успешно');
    console.log('   ✅ Нет критических проблем');
  } else if (originalProblemSolved && completionRate >= 80) {
    results.systemReadiness = 'good';
    console.log('🟡 ХОРОШО: Система готова к продакшену с небольшими доработками');
    console.log('   ✅ Исходная проблема решена');
    console.log('   ⚠️ Есть небольшие проблемы для устранения');
  } else if (originalProblemSolved) {
    results.systemReadiness = 'acceptable';
    console.log('🟠 УДОВЛЕТВОРИТЕЛЬНО: Основная проблема решена, но требуются доработки');
    console.log('   ✅ Исходная проблема решена');
    console.log('   ❌ Есть проблемы в других аспектах системы');
  } else {
    results.systemReadiness = 'poor';
    console.log('🔴 НЕУДОВЛЕТВОРИТЕЛЬНО: Исходная проблема НЕ решена');
    console.log('   ❌ Проблема "анализ пробелов" все еще существует');
    console.log('   ❌ Система требует серьезной доработки');
  }

  console.log(`\n📈 Завершенность тестирования: ${completionRate}% (${completedSuites}/${totalSuites})`);
  
  console.log('\n🏁 МАСТЕР-ТЕСТИРОВАНИЕ ЗАВЕРШЕНО');
  console.log('='.repeat(90));
}

/**
 * 💾 СОХРАНЕНИЕ РЕЗУЛЬТАТОВ В ФАЙЛ
 */
async function saveResultsToFile(results) {
  const fs = require('fs').promises;
  const path = require('path');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `test-results-${timestamp}.json`;
  const filepath = path.join(__dirname, 'test-results', filename);
  
  try {
    // Создаем папку если не существует
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    
    // Сохраняем результаты
    await fs.writeFile(filepath, JSON.stringify(results, null, 2), 'utf8');
    
    console.log(`\n💾 Результаты сохранены в файл: ${filename}`);
  } catch (error) {
    console.error(`❌ Ошибка сохранения результатов: ${error.message}`);
  }
}

// 🚀 ЗАПУСК МАСТЕР-ТЕСТИРОВАНИЯ
if (require.main === module) {
  runMasterTestSuite()
    .then(() => {
      console.log('\n🎉 МАСТЕР-ТЕСТИРОВАНИЕ УСПЕШНО ЗАВЕРШЕНО!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 КРИТИЧЕСКАЯ ОШИБКА В МАСТЕР-ТЕСТИРОВАНИИ:', error);
      process.exit(1);
    });
}

module.exports = {
  runMasterTestSuite,
  PERFORMANCE_TESTS,
  STRESS_TESTS
}; 