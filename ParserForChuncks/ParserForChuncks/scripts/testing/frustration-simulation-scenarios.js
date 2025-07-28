/**
 * 🎭 СИМУЛЯЦИИ ПЕРЕПИСОК ДЛЯ ТЕСТИРОВАНИЯ СИСТЕМЫ ДЕТЕКЦИИ ФРУСТРАЦИИ
 * 
 * Эти сценарии предназначены для тестирования триггеров отправки email менеджеру
 * когда пользователь становится фрустрированным.
 */

// Сценарий 1: Градуальное нарастание фрустрации
const scenario1_gradual_escalation = {
  name: "Градуальное нарастание фрустрации",
  description: "Пользователь постепенно становится все более фрустрированным",
  messages: [
    "Как провести аудит доступности?",
    "Я не понимаю ваш ответ, можете объяснить проще?",
    "Это все еще не помогает. Мне нужна конкретная информация!",
    "Почему бот не может дать четкий ответ?? Я трачу время зря!",
    "ЭТО УЖАСНО!!! Третий раз спрашиваю одно и то же!!!"
  ]
};

// Сценарий 2: Острая фрустрация с матом
const scenario2_swearing_frustration = {
  name: "Острая фрустрация с ругательствами",
  description: "Пользователь быстро теряет терпение и начинает материться",
  messages: [
    "Помогите с European Accessibility Act",
    "Ваш ответ бесполезен, мне нужна помощь!",
    "Damn it! Это не работает вообще!",
    "Shit! Почему этот бот такой плохой?!",
    "Fuck this! Я не могу получить нормальный ответ!"
  ]
};

// Сценарий 3: Повторяющиеся вопросы
const scenario3_repeated_questions = {
  name: "Повторяющиеся вопросы",
  description: "Пользователь задает один и тот же вопрос несколько раз",
  messages: [
    "Какие требования EAA для веб-сайтов?",
    "Я не понял. Какие конкретно требования EAA для веб-сайтов?",
    "Опять не то! Какие требования European Accessibility Act для веб-сайтов?",
    "Четвертый раз спрашиваю! Какие требования EAA для веб-сайтов?!",
    "Я в отчаянии! Какие требования EAA для веб-сайтов?!!!"
  ]
};

// Сценарий 4: Технические проблемы
const scenario4_technical_issues = {
  name: "Технические проблемы",
  description: "Пользователь сталкивается с техническими проблемами",
  messages: [
    "Система не загружается",
    "Ошибка 500, что делать?",
    "Почему всё время глючит?",
    "Это не работает! Уже полчаса пытаюсь!",
    "УЖАСНО! Система постоянно падает! Это неприемлемо!"
  ]
};

// Сценарий 5: Недовольство качеством ответов
const scenario5_poor_quality_responses = {
  name: "Недовольство качеством ответов",
  description: "Пользователь недоволен качеством ответов бота",
  messages: [
    "Расскажите про аудит доступности",
    "Ваш ответ слишком общий, мне нужны детали",
    "Это не помогает! Дайте конкретные шаги!",
    "Terrible! Бот дает бесполезную информацию!",
    "Awful! Я разочарован! Это пустая трата времени!"
  ]
};

// Сценарий 6: Срочность и давление времени
const scenario6_time_pressure = {
  name: "Срочность и давление времени",
  description: "Пользователь в цейтноте и нервничает",
  messages: [
    "Мне срочно нужна помощь с EAA!",
    "У меня дедлайн завтра! Быстрее!",
    "Я не могу ждать! Дайте четкий ответ!",
    "ЭТО СРОЧНО!!! Почему так медленно?!",
    "Hell! Я опаздываю из-за этого бота!!!"
  ]
};

// Сценарий 7: Языковые барьеры
const scenario7_language_barriers = {
  name: "Языковые барьеры",
  description: "Пользователь не понимает из-за языковых сложностей",
  messages: [
    "I don't understand your answer",
    "Can you explain in simple English?",
    "This is too complicated! I'm confused!",
    "Why can't you give clear answers?!",
    "This is useless! I don't understand anything!!!"
  ]
};

// Сценарий 8: Эмоциональное выгорание
const scenario8_emotional_burnout = {
  name: "Эмоциональное выгорание",
  description: "Пользователь эмоционально выгорел от попыток",
  messages: [
    "Помогите с требованиями доступности",
    "Я устал искать информацию",
    "Уже час пытаюсь разобраться",
    "Я больше не могу... это слишком сложно",
    "Я сдаюсь! Это невозможно! Помогите мне кто-нибудь!"
  ]
};

// Сценарий 9: Отрицание и протест
const scenario9_denial_protest = {
  name: "Отрицание и протест",
  description: "Пользователь активно протестует против ответов",
  messages: [
    "Что такое EAA?",
    "Нет, это не то что я хочу!",
    "NO! Это неправильно!",
    "NO NO NO! Вы не понимаете меня!",
    "no!!!!!!!!!!!!!!!!!!!!"
  ]
};

// Сценарий 10: Профессиональная фрустрация
const scenario10_professional_frustration = {
  name: "Профессиональная фрустрация",
  description: "Профессионал не может получить нужную информацию",
  messages: [
    "Я юрист, мне нужна точная информация по EAA",
    "Ваши ответы слишком общие для профессионального использования",
    "Мне нужны конкретные статьи закона!",
    "Это неприемлемо! Я не могу работать с такой информацией!",
    "Ужасно! Как я могу консультировать клиентов с такими ответами?!"
  ]
};

/**
 * 🎯 ФУНКЦИЯ ДЛЯ АВТОМАТИЧЕСКОГО ТЕСТИРОВАНИЯ СЦЕНАРИЕВ
 */
async function simulateScenario(scenario, baseUrl = 'http://localhost:3001') {
  console.log(`\n🎭 Запуск сценария: ${scenario.name}`);
  console.log(`📝 Описание: ${scenario.description}`);
  console.log(`💬 Сообщений: ${scenario.messages.length}`);
  
  const sessionId = `test-${Date.now()}`;
  const userId = `user-${Date.now()}`;
  
  for (let i = 0; i < scenario.messages.length; i++) {
    const message = scenario.messages[i];
    
    console.log(`\n📤 Сообщение ${i + 1}: "${message}"`);
    
    try {
      const response = await fetch(`${baseUrl}/api/v1/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: message,
          user_id: userId,
          session_id: sessionId,
          stream: false
        })
      });
      
      if (response.ok) {
        console.log(`✅ Ответ получен (${response.status})`);
      } else {
        console.log(`❌ Ошибка ответа (${response.status})`);
      }
      
      // Пауза между сообщениями для реалистичности
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Ошибка запроса: ${error.message}`);
    }
  }
  
  console.log(`\n🏁 Сценарий "${scenario.name}" завершен`);
  console.log(`🔍 Проверьте email для session: ${sessionId}`);
}

/**
 * 🚀 ЗАПУСК ВСЕХ СЦЕНАРИЕВ
 */
async function runAllScenarios() {
  const scenarios = [
    scenario1_gradual_escalation,
    scenario2_swearing_frustration,
    scenario3_repeated_questions,
    scenario4_technical_issues,
    scenario5_poor_quality_responses,
    scenario6_time_pressure,
    scenario7_language_barriers,
    scenario8_emotional_burnout,
    scenario9_denial_protest,
    scenario10_professional_frustration
  ];
  
  console.log('🎬 Начинаем тестирование всех сценариев...\n');
  
  for (const scenario of scenarios) {
    await simulateScenario(scenario);
    
    // Пауза между сценариями
    console.log('\n⏳ Пауза 10 секунд между сценариями...');
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  console.log('\n🎉 Все сценарии завершены!');
  console.log('📧 Проверьте email для уведомлений о фрустрации');
}

/**
 * 🎯 ЗАПУСК ОТДЕЛЬНОГО СЦЕНАРИЯ
 */
async function runSingleScenario(scenarioNumber) {
  const scenarios = [
    scenario1_gradual_escalation,
    scenario2_swearing_frustration,
    scenario3_repeated_questions,
    scenario4_technical_issues,
    scenario5_poor_quality_responses,
    scenario6_time_pressure,
    scenario7_language_barriers,
    scenario8_emotional_burnout,
    scenario9_denial_protest,
    scenario10_professional_frustration
  ];
  
  const scenario = scenarios[scenarioNumber - 1];
  
  if (!scenario) {
    console.error(`❌ Сценарий #${scenarioNumber} не найден`);
    return;
  }
  
  await simulateScenario(scenario);
}

// Экспорт для использования в других модулях (ES модули)
export {
  scenario1_gradual_escalation,
  scenario2_swearing_frustration,
  scenario3_repeated_questions,
  scenario4_technical_issues,
  scenario5_poor_quality_responses,
  scenario6_time_pressure,
  scenario7_language_barriers,
  scenario8_emotional_burnout,
  scenario9_denial_protest,
  scenario10_professional_frustration,
  simulateScenario,
  runAllScenarios,
  runSingleScenario
};

// Если файл запущен напрямую (ES модули)
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🎭 Использование:');
    console.log('node frustration-simulation-scenarios.js all          - запустить все сценарии');
    console.log('node frustration-simulation-scenarios.js 1-10        - запустить конкретный сценарий');
    console.log('\n📋 Доступные сценарии:');
    console.log('1. Градуальное нарастание фрустрации');
    console.log('2. Острая фрустрация с ругательствами');
    console.log('3. Повторяющиеся вопросы');
    console.log('4. Технические проблемы');
    console.log('5. Недовольство качеством ответов');
    console.log('6. Срочность и давление времени');
    console.log('7. Языковые барьеры');
    console.log('8. Эмоциональное выгорание');
    console.log('9. Отрицание и протест');
    console.log('10. Профессиональная фрустрация');
  } else if (args[0] === 'all') {
    runAllScenarios();
  } else {
    const scenarioNumber = parseInt(args[0]);
    if (scenarioNumber >= 1 && scenarioNumber <= 10) {
      runSingleScenario(scenarioNumber);
    } else {
      console.error('❌ Неверный номер сценария. Используйте числа от 1 до 10');
    }
  }
} 