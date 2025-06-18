/**
 * 👥 ТЕСТИРОВАНИЕ РЕАЛЬНЫХ ПОЛЬЗОВАТЕЛЬСКИХ СЦЕНАРИЕВ
 * 
 * Симуляция реальных диалогов пользователей с ботом EAA
 * Основано на типичных вопросах о European Accessibility Act
 */

const API_BASE = 'http://localhost:3000/api/v1';

// 👤 РЕАЛЬНЫЕ ПОЛЬЗОВАТЕЛЬСКИЕ СЦЕНАРИИ
const REAL_USER_SCENARIOS = [
  {
    persona: 'НОВИЧОК В EAA',
    description: 'Пользователь впервые слышит о EAA и не знает терминологии',
    scenarios: [
      {
        name: 'Первое знакомство с EAA',
        conversation: [
          {
            user: 'Что такое European Accessibility Act?',
            expectedTerms: ['European Accessibility Act', 'EAA'],
            expectedSuggestions: ['🔍 Подробнее о EAA', '📋 Кого касается', '🛠️ Что нужно делать']
          },
          {
            user: 'А что такое анализ пробелов?',
            expectedTerms: ['анализ пробелов', 'gap analysis'],
            expectedSuggestions: ['🔍 Что такое анализ пробелов', '📋 Как провести', '🛠️ Инструменты'],
            context: 'Пользователь не понял термин из предыдущего ответа'
          },
          {
            user: 'Покажи пример анализа пробелов',
            expectedTerms: ['анализ пробелов'],
            expectedSuggestions: ['📋 Пошаговый план', '🛠️ Чек-лист', '📊 Шаблоны']
          }
        ]
      },
      {
        name: 'Путаница с терминами',
        conversation: [
          {
            user: 'Мне нужна CE маркировка для сайта?',
            expectedTerms: ['CE маркировка'],
            expectedSuggestions: ['🔍 Что такое CE маркировка', '📋 Для каких продуктов', '❌ Не для сайтов'],
            context: 'Пользователь путает продукты и услуги'
          },
          {
            user: 'А что тогда нужно для сайта?',
            expectedTerms: ['service providers', 'веб-доступность'],
            expectedSuggestions: ['📋 Требования к сайтам', '🛠️ WCAG стандарты', '📊 Как проверить']
          }
        ]
      }
    ]
  },

  {
    persona: 'РАЗРАБОТЧИК',
    description: 'Технический специалист, знакомый с веб-разработкой',
    scenarios: [
      {
        name: 'Техническая реализация доступности',
        conversation: [
          {
            user: 'Какие WCAG требования нужно выполнить для EAA?',
            expectedTerms: ['WCAG', 'Web Content Accessibility Guidelines'],
            expectedSuggestions: ['🔍 WCAG 2.1 уровни', '📋 Критерии успеха', '🛠️ Инструменты тестирования']
          },
          {
            user: 'Что такое assistive technologies в контексте веб-разработки?',
            expectedTerms: ['assistive technologies', 'screen readers'],
            expectedSuggestions: ['🔍 Типы AT', '📋 Поддержка в коде', '🛠️ Тестирование с AT']
          },
          {
            user: 'Как тестировать совместимость с screen readers?',
            expectedTerms: ['screen readers', 'тестирование доступности'],
            expectedSuggestions: ['🛠️ Инструменты тестирования', '📋 Чек-лист', '🔍 Популярные screen readers']
          }
        ]
      }
    ]
  },

  {
    persona: 'БИЗНЕС-ВЛАДЕЛЕЦ',
    description: 'Владелец малого бизнеса, обеспокоенный соответствием',
    scenarios: [
      {
        name: 'Обязательства малого бизнеса',
        conversation: [
          {
            user: 'Мой интернет-магазин должен соответствовать EAA?',
            expectedTerms: ['интернет-магазин', 'e-commerce', 'service providers'],
            expectedSuggestions: ['🔍 Требования к e-commerce', '📋 Что нужно сделать', '💰 Исключения для малого бизнеса']
          },
          {
            user: 'Что такое microenterprises exemption?',
            expectedTerms: ['microenterprises', 'микропредприятия', 'exemption'],
            expectedSuggestions: ['🔍 Критерии микропредприятий', '📋 Какие льготы', '⚠️ Ограничения']
          },
          {
            user: 'Сколько это будет стоить? Можно ли получить disproportionate burden?',
            expectedTerms: ['disproportionate burden', 'диспропорциональная нагрузка'],
            expectedSuggestions: ['🔍 Что такое disproportionate burden', '📊 Критерии оценки', '📋 Как оформить']
          }
        ]
      }
    ]
  },

  {
    persona: 'ПРОИЗВОДИТЕЛЬ ПРОДУКТОВ',
    description: 'Компания, производящая физические продукты',
    scenarios: [
      {
        name: 'Соответствие продуктов EAA',
        conversation: [
          {
            user: 'Наши банкоматы должны соответствовать EAA?',
            expectedTerms: ['банкоматы', 'ATM', 'self-service terminals'],
            expectedSuggestions: ['🔍 Требования к банкоматам', '📋 Технические требования', '🛠️ Как модернизировать']
          },
          {
            user: 'Что такое conformity assessment для продуктов?',
            expectedTerms: ['conformity assessment', 'оценка соответствия'],
            expectedSuggestions: ['🔍 Процедура оценки', '📋 Необходимые документы', '🛠️ Этапы процесса']
          },
          {
            user: 'Нужна ли technical documentation и что в неё включать?',
            expectedTerms: ['technical documentation', 'техническая документация'],
            expectedSuggestions: ['📋 Состав документации', '🔍 Требования к содержанию', '⏰ Сроки хранения']
          }
        ]
      }
    ]
  },

  {
    persona: 'ЮРИСТ/КОМПЛАЕНС',
    description: 'Специалист по соответствию нормативным требованиям',
    scenarios: [
      {
        name: 'Правовые аспекты EAA',
        conversation: [
          {
            user: 'Какие penalties предусмотрены за несоответствие EAA?',
            expectedTerms: ['penalties', 'штрафы', 'enforcement'],
            expectedSuggestions: ['🔍 Виды санкций', '📋 Полномочия органов', '⚖️ Национальные различия']
          },
          {
            user: 'Как работает market surveillance для EAA?',
            expectedTerms: ['market surveillance', 'надзор за рынком'],
            expectedSuggestions: ['🔍 Процедуры надзора', '📋 Полномочия органов', '🛠️ Как подготовиться']
          },
          {
            user: 'Что такое EU safeguard procedure?',
            expectedTerms: ['EU safeguard procedure', 'процедура защиты'],
            expectedSuggestions: ['🔍 Когда применяется', '📋 Этапы процедуры', '⚖️ Последствия']
          }
        ]
      }
    ]
  }
];

// 🎭 ПРОБЛЕМНЫЕ СЦЕНАРИИ (на основе реальных проблем)
const PROBLEMATIC_SCENARIOS = [
  {
    name: 'Сценарий "анализ пробелов" - исходная проблема',
    description: 'Воспроизведение исходной проблемы с терминами',
    conversation: [
      {
        user: 'Как обеспечить соответствие моего веб-сайта требованиям EAA?',
        botResponse: 'Для обеспечения соответствия веб-сайта требованиям EAA необходимо провести анализ пробелов...',
        followUp: 'Что за анализ пробелов?',
        expectedTerms: ['анализ пробелов'],
        expectedSuggestions: ['🔍 Что такое анализ пробелов', '📋 Как провести', '🛠️ Инструменты'],
        problemDescription: 'Бот использует термин, но не предлагает его объяснение'
      }
    ]
  },
  {
    name: 'Каскад непонятных терминов',
    description: 'Когда один непонятный термин ведет к другим',
    conversation: [
      {
        user: 'Что нужно для conformity assessment?',
        botResponse: 'Для conformity assessment необходимо провести internal production control согласно Module A...',
        followUp: 'Что такое internal production control?',
        expectedTerms: ['internal production control'],
        expectedSuggestions: ['🔍 Что такое internal production control', '📋 Процедура Module A'],
        problemDescription: 'Объяснение одного термина порождает новые непонятные термины'
      }
    ]
  },
  {
    name: 'Смешение продуктов и услуг',
    description: 'Путаница между требованиями к продуктам и услугам',
    conversation: [
      {
        user: 'Нужна ли CE marking для моего мобильного приложения?',
        botResponse: 'CE marking применяется к продуктам, а мобильные приложения относятся к услугам...',
        followUp: 'А что тогда нужно для услуг?',
        expectedTerms: ['service providers', 'услуги'],
        expectedSuggestions: ['🔍 Требования к услугам', '📋 Отличия от продуктов'],
        problemDescription: 'Пользователь путает категории EAA'
      }
    ]
  }
];

/**
 * 🚀 ЗАПУСК ТЕСТИРОВАНИЯ ПОЛЬЗОВАТЕЛЬСКИХ СЦЕНАРИЕВ
 */
async function runRealUserScenarios() {
  console.log('👥 ЗАПУСК ТЕСТИРОВАНИЯ РЕАЛЬНЫХ ПОЛЬЗОВАТЕЛЬСКИХ СЦЕНАРИЕВ');
  console.log('='.repeat(80));
  
  const results = {
    totalScenarios: 0,
    passedScenarios: 0,
    failedScenarios: 0,
    personas: {},
    conversationIssues: [],
    termDetectionIssues: [],
    suggestionQualityIssues: []
  };

  // Тестируем сценарии по персонам
  for (const persona of REAL_USER_SCENARIOS) {
    console.log(`\n👤 ПЕРСОНА: ${persona.persona}`);
    console.log(`📝 ${persona.description}`);
    console.log('-'.repeat(60));

    const personaResults = {
      total: persona.scenarios.length,
      passed: 0,
      failed: 0,
      issues: []
    };

    for (const scenario of persona.scenarios) {
      results.totalScenarios++;
      console.log(`\n🎭 СЦЕНАРИЙ: ${scenario.name}`);

      try {
        const scenarioResult = await runConversationScenario(scenario.conversation, persona.persona);
        
        if (scenarioResult.success) {
          results.passedScenarios++;
          personaResults.passed++;
          console.log('✅ СЦЕНАРИЙ ПРОЙДЕН УСПЕШНО');
        } else {
          results.failedScenarios++;
          personaResults.failed++;
          console.log('❌ СЦЕНАРИЙ НЕ ПРОЙДЕН');
          
          personaResults.issues.push({
            scenario: scenario.name,
            issues: scenarioResult.issues
          });

          // Классифицируем проблемы
          scenarioResult.issues.forEach(issue => {
            if (issue.includes('термин')) {
              results.termDetectionIssues.push({
                persona: persona.persona,
                scenario: scenario.name,
                issue
              });
            } else if (issue.includes('подсказк')) {
              results.suggestionQualityIssues.push({
                persona: persona.persona,
                scenario: scenario.name,
                issue
              });
            } else {
              results.conversationIssues.push({
                persona: persona.persona,
                scenario: scenario.name,
                issue
              });
            }
          });
        }

      } catch (error) {
        results.failedScenarios++;
        personaResults.failed++;
        console.error(`💥 ОШИБКА В СЦЕНАРИИ: ${error.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    results.personas[persona.persona] = personaResults;
    
    console.log(`\n📊 РЕЗУЛЬТАТЫ ПЕРСОНЫ "${persona.persona}":`);
    console.log(`✅ Пройдено: ${personaResults.passed}/${personaResults.total}`);
    console.log(`❌ Не пройдено: ${personaResults.failed}/${personaResults.total}`);
  }

  // Тестируем проблемные сценарии
  console.log('\n🚨 ТЕСТИРОВАНИЕ ПРОБЛЕМНЫХ СЦЕНАРИЕВ');
  console.log('='.repeat(60));

  for (const problemScenario of PROBLEMATIC_SCENARIOS) {
    results.totalScenarios++;
    console.log(`\n⚠️ ПРОБЛЕМНЫЙ СЦЕНАРИЙ: ${problemScenario.name}`);
    console.log(`📝 ${problemScenario.description}`);

    try {
      const scenarioResult = await runProblematicScenario(problemScenario);
      
      if (scenarioResult.success) {
        results.passedScenarios++;
        console.log('✅ ПРОБЛЕМНЫЙ СЦЕНАРИЙ РЕШЕН');
      } else {
        results.failedScenarios++;
        console.log('❌ ПРОБЛЕМНЫЙ СЦЕНАРИЙ НЕ РЕШЕН');
        console.log(`🔍 Проблемы: ${scenarioResult.issues.join(', ')}`);
      }
    } catch (error) {
      results.failedScenarios++;
      console.error(`💥 ОШИБКА В ПРОБЛЕМНОМ СЦЕНАРИИ: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Генерируем отчет
  generateUserScenarioReport(results);
}

/**
 * 💬 ВЫПОЛНЕНИЕ СЦЕНАРИЯ ДИАЛОГА
 */
async function runConversationScenario(conversation, persona) {
  const issues = [];
  let success = true;
  const sessionId = `scenario_${persona}_${Date.now()}`;

  console.log(`\n💬 НАЧИНАЕМ ДИАЛОГ (${conversation.length} реплик):`);

  for (let i = 0; i < conversation.length; i++) {
    const turn = conversation[i];
    console.log(`\n👤 Пользователь: "${turn.user}"`);

    try {
      const response = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: turn.user,
          user_id: `test_${persona.toLowerCase().replace(/\s+/g, '_')}`,
          session_id: sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`🤖 Бот: "${data.answer?.substring(0, 100)}..."`);

      // Проверяем найденные термины
      const foundTerms = (data.detectedTerms || []).map(t => t.term.toLowerCase());
      console.log(`🔍 Найденные термины: ${foundTerms.join(', ')}`);

      for (const expectedTerm of turn.expectedTerms || []) {
        const found = foundTerms.some(term => 
          term.includes(expectedTerm.toLowerCase()) || 
          expectedTerm.toLowerCase().includes(term)
        );
        
        if (!found) {
          issues.push(`Реплика ${i + 1}: не найден термин "${expectedTerm}"`);
          success = false;
        }
      }

      // Проверяем подсказки
      const suggestions = data.clarificationQuestions || [];
      console.log(`💡 Подсказки: ${suggestions.slice(0, 2).join(' | ')}`);

      for (const expectedSuggestion of turn.expectedSuggestions || []) {
        const found = suggestions.some(suggestion => 
          suggestion.toLowerCase().includes(expectedSuggestion.toLowerCase())
        );
        
        if (!found) {
          issues.push(`Реплика ${i + 1}: не найдена подсказка "${expectedSuggestion}"`);
          success = false;
        }
      }

      // Проверяем контекст (если указан)
      if (turn.context) {
        console.log(`📍 Контекст: ${turn.context}`);
        // Дополнительная проверка контекстной релевантности
      }

    } catch (error) {
      issues.push(`Реплика ${i + 1}: техническая ошибка - ${error.message}`);
      success = false;
    }

    // Пауза между репликами диалога
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  return { success, issues };
}

/**
 * ⚠️ ВЫПОЛНЕНИЕ ПРОБЛЕМНОГО СЦЕНАРИЯ
 */
async function runProblematicScenario(problemScenario) {
  const issues = [];
  let success = true;
  const sessionId = `problem_${Date.now()}`;

  for (const conversation of problemScenario.conversation) {
    console.log(`\n👤 Пользователь: "${conversation.user}"`);
    
    // Первый запрос
    const firstResponse = await fetch(`${API_BASE}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: conversation.user,
        user_id: 'test_problematic',
        session_id: sessionId
      })
    });

    const firstData = await firstResponse.json();
    console.log(`🤖 Бот: "${firstData.answer?.substring(0, 150)}..."`);

    // Проверяем, что бот использует термин (симулируем botResponse)
    const botUsesTerms = conversation.expectedTerms.some(term => 
      firstData.answer?.toLowerCase().includes(term.toLowerCase())
    );

    if (botUsesTerms) {
      console.log(`✅ Бот использует ожидаемые термины`);
      
      // Задаем follow-up вопрос
      console.log(`\n👤 Follow-up: "${conversation.followUp}"`);
      
      const followUpResponse = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: conversation.followUp,
          user_id: 'test_problematic',
          session_id: sessionId
        })
      });

      const followUpData = await followUpResponse.json();
      console.log(`🤖 Follow-up ответ: "${followUpData.answer?.substring(0, 100)}..."`);

      // Проверяем, что система правильно обработала follow-up
      const foundTerms = (followUpData.detectedTerms || []).map(t => t.term.toLowerCase());
      const suggestions = followUpData.clarificationQuestions || [];

      console.log(`🔍 Найденные термины в follow-up: ${foundTerms.join(', ')}`);
      console.log(`💡 Подсказки в follow-up: ${suggestions.slice(0, 2).join(' | ')}`);

      // Проверяем, что найдены ожидаемые термины
      for (const expectedTerm of conversation.expectedTerms) {
        const found = foundTerms.some(term => 
          term.includes(expectedTerm.toLowerCase()) || 
          expectedTerm.toLowerCase().includes(term)
        );
        
        if (!found) {
          issues.push(`Follow-up: не найден термин "${expectedTerm}"`);
          success = false;
        }
      }

      // Проверяем подсказки
      for (const expectedSuggestion of conversation.expectedSuggestions || []) {
        const found = suggestions.some(suggestion => 
          suggestion.toLowerCase().includes(expectedSuggestion.toLowerCase())
        );
        
        if (!found) {
          issues.push(`Follow-up: не найдена подсказка "${expectedSuggestion}"`);
          success = false;
        }
      }

    } else {
      issues.push('Бот не использует ожидаемые термины в первом ответе');
      success = false;
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  return { success, issues };
}

/**
 * 📊 ГЕНЕРАЦИЯ ОТЧЕТА ПО ПОЛЬЗОВАТЕЛЬСКИМ СЦЕНАРИЯМ
 */
function generateUserScenarioReport(results) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 ОТЧЕТ ПО ТЕСТИРОВАНИЮ ПОЛЬЗОВАТЕЛЬСКИХ СЦЕНАРИЕВ');
  console.log('='.repeat(80));

  const successRate = Math.round((results.passedScenarios / results.totalScenarios) * 100);
  
  console.log(`\n🎯 ОБЩИЕ РЕЗУЛЬТАТЫ:`);
  console.log(`📈 Успешность: ${successRate}% (${results.passedScenarios}/${results.totalScenarios})`);
  console.log(`✅ Пройдено сценариев: ${results.passedScenarios}`);
  console.log(`❌ Не пройдено сценариев: ${results.failedScenarios}`);

  console.log(`\n👥 РЕЗУЛЬТАТЫ ПО ПЕРСОНАМ:`);
  for (const [persona, personaResult] of Object.entries(results.personas)) {
    const personaRate = Math.round((personaResult.passed / personaResult.total) * 100);
    console.log(`   ${persona}: ${personaRate}% (${personaResult.passed}/${personaResult.total})`);
  }

  if (results.termDetectionIssues.length > 0) {
    console.log(`\n🔍 ПРОБЛЕМЫ С ОБНАРУЖЕНИЕМ ТЕРМИНОВ (${results.termDetectionIssues.length}):`);
    results.termDetectionIssues.slice(0, 5).forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.persona} - ${issue.scenario}: ${issue.issue}`);
    });
  }

  if (results.suggestionQualityIssues.length > 0) {
    console.log(`\n💡 ПРОБЛЕМЫ С КАЧЕСТВОМ ПОДСКАЗОК (${results.suggestionQualityIssues.length}):`);
    results.suggestionQualityIssues.slice(0, 5).forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.persona} - ${issue.scenario}: ${issue.issue}`);
    });
  }

  if (results.conversationIssues.length > 0) {
    console.log(`\n💬 ПРОБЛЕМЫ С ДИАЛОГОМ (${results.conversationIssues.length}):`);
    results.conversationIssues.slice(0, 5).forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.persona} - ${issue.scenario}: ${issue.issue}`);
    });
  }

  console.log(`\n🎯 ОЦЕНКА ПОЛЬЗОВАТЕЛЬСКОГО ОПЫТА:`);
  if (successRate >= 90) {
    console.log('🟢 ОТЛИЧНО: Система обеспечивает отличный пользовательский опыт');
  } else if (successRate >= 80) {
    console.log('🟡 ХОРОШО: Система работает хорошо для большинства пользователей');
  } else if (successRate >= 70) {
    console.log('🟠 УДОВЛЕТВОРИТЕЛЬНО: Есть проблемы с пользовательским опытом');
  } else {
    console.log('🔴 НЕУДОВЛЕТВОРИТЕЛЬНО: Серьезные проблемы с пользовательским опытом');
  }

  console.log('\n🏁 ТЕСТИРОВАНИЕ ПОЛЬЗОВАТЕЛЬСКИХ СЦЕНАРИЕВ ЗАВЕРШЕНО');
  console.log('='.repeat(80));
}

// 🚀 ЗАПУСК ТЕСТИРОВАНИЯ
if (require.main === module) {
  runRealUserScenarios()
    .then(() => {
      console.log('\n✅ Тестирование пользовательских сценариев завершено!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Критическая ошибка:', error);
      process.exit(1);
    });
}

module.exports = {
  runRealUserScenarios,
  REAL_USER_SCENARIOS,
  PROBLEMATIC_SCENARIOS
}; 