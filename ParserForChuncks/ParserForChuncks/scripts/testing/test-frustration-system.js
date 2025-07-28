/**
 * 🧪 БЕЗОПАСНОЕ ТЕСТИРОВАНИЕ СИСТЕМЫ АНАЛИЗА ФРУСТРАЦИИ
 * 
 * Этот скрипт тестирует новых ИИ агентов в изолированной среде
 * БЕЗ отправки реальных писем и с детальным логированием
 */

import { FrustrationDetectionAgent } from '../../src/services/frustrationDetectionAgent.ts';
import { EmailComposerAgent } from '../../src/services/emailComposerAgent.ts';

// Тестовые данные для безопасного тестирования
const TEST_SCENARIOS = [
  {
    name: 'Спокойный пользователь',
    message: 'Привет! Расскажи про требования EAA для моего сайта.',
    recentMessages: [
      { role: 'user', content: 'Здравствуйте!' },
      { role: 'assistant', content: 'Добро пожаловать! Как дела?' },
      { role: 'user', content: 'Расскажи про требования EAA для моего сайта.' }
    ],
    expectedFrustration: 'low', // Ожидаем низкий уровень
    shouldEscalate: false
  },
  
  {
    name: 'Слегка недовольный пользователь',
    message: 'Не понимаю ваши объяснения, слишком сложно',
    recentMessages: [
      { role: 'user', content: 'Как сделать сайт доступным?' },
      { role: 'assistant', content: 'Вам нужно соблюдать WCAG 2.1...' },
      { role: 'user', content: 'Что за WCAG? Объясните нормально!' },
      { role: 'assistant', content: 'WCAG - это стандарт веб-доступности...' },
      { role: 'user', content: 'Не понимаю ваши объяснения, слишком сложно' }
    ],
    expectedFrustration: 'medium',
    shouldEscalate: false // Еще не критично
  },
  
  {
    name: 'ВЫСОКО ФРУСТРИРОВАННЫЙ пользователь',
    message: 'Это просто ужас! Третий раз спрашиваю одно и то же, а вы мне ерунду отвечаете! Зря время трачу!',
    recentMessages: [
      { role: 'user', content: 'Какие штрафы за несоблюдение EAA?' },
      { role: 'assistant', content: 'Штрафы могут различаться...' },
      { role: 'user', content: 'Конкретно для моего интернет-магазина?' },
      { role: 'assistant', content: 'Для интернет-магазинов применяются...' },
      { role: 'user', content: 'Сколько конкретно денег штрафа???' },
      { role: 'assistant', content: 'Точная сумма зависит от страны...' },
      { role: 'user', content: 'Это просто ужас! Третий раз спрашиваю одно и то же, а вы мне ерунду отвечаете! Зря время трачу!' }
    ],
    expectedFrustration: 'high',
    shouldEscalate: true // ДОЛЖЕН эскалировать
  },
  
  {
    name: 'Агрессивный пользователь с матом',
    message: 'Да что за херня! Ваш бот вообще не помогает, только время тратит! Пошли вы к черту!',
    recentMessages: [
      { role: 'user', content: 'Помогите с аудитом доступности' },
      { role: 'assistant', content: 'Конечно, помогу с аудитом...' },
      { role: 'user', content: 'Сколько это стоит?' },
      { role: 'assistant', content: 'Стоимость зависит от размера...' },
      { role: 'user', content: 'Да что за херня! Ваш бот вообще не помогает, только время тратит! Пошли вы к черту!' }
    ],
    expectedFrustration: 'high',
    shouldEscalate: true // ОБЯЗАТЕЛЬНО должен эскалировать
  }
];

// Тестовые факты о пользователе
const TEST_USER_FACTS = [
  { type: 'business_type', value: 'E-commerce интернет-магазин', confidence: 0.9 },
  { type: 'business_size', value: 'Средний бизнес', confidence: 0.8 },
  { type: 'physical_location', value: 'Польша', confidence: 0.7 },
  { type: 'web_presence', value: 'Сайт + мобильное приложение', confidence: 0.85 },
  { type: 'customer_base', value: 'B2C клиенты по всей Европе', confidence: 0.75 }
];

async function runSafeTest() {
  console.log('🧪 =============================================================');
  console.log('🧪 ЗАПУСК БЕЗОПАСНОГО ТЕСТИРОВАНИЯ СИСТЕМЫ АНАЛИЗА ФРУСТРАЦИИ');
  console.log('🧪 =============================================================\n');

  // Инициализируем агентов с консервативными настройками
  const frustrationAgent = new FrustrationDetectionAgent({
    minimumFrustrationLevel: 0.7,  // Высокий порог
    minimumConfidence: 0.8,        // Высокая уверенность
    minimumTriggers: 2             // Минимум 2 триггера
  });

  const emailComposer = new EmailComposerAgent();

  console.log('✅ Агенты инициализированы с консервативными настройками безопасности\n');

  // Тестируем каждый сценарий
  for (let i = 0; i < TEST_SCENARIOS.length; i++) {
    const scenario = TEST_SCENARIOS[i];
    
    console.log(`🎯 ТЕСТ ${i + 1}/4: ${scenario.name}`);
    console.log(`📝 Сообщение: "${scenario.message}"`);
    console.log(`📊 Ожидаемый уровень фрустрации: ${scenario.expectedFrustration}`);
    console.log(`🚨 Должна ли быть эскалация: ${scenario.shouldEscalate ? 'ДА' : 'НЕТ'}`);
    console.log('─'.repeat(80));

    try {
      // Анализируем фрустрацию
      const frustrationAnalysis = await frustrationAgent.analyzeFrustration(
        scenario.message,
        scenario.recentMessages,
        `test-session-${i}`,
        `test-user-${i}`
      );

      // Выводим результаты
      console.log('📊 РЕЗУЛЬТАТЫ АНАЛИЗА:');
      console.log(`   Уровень фрустрации: ${frustrationAnalysis.frustrationLevel.toFixed(3)} (0-1)`);
      console.log(`   Уверенность ИИ: ${frustrationAnalysis.confidenceScore.toFixed(3)} (0-1)`);
      console.log(`   Обнаруженные паттерны: ${frustrationAnalysis.detectedPatterns.join(', ') || 'Нет'}`);
      console.log(`   Триггеры: ${frustrationAnalysis.triggerPhrases.join(', ') || 'Нет'}`);
      console.log(`   Повторяющиеся вопросы: ${frustrationAnalysis.contextFactors.repeatedQuestions ? 'ДА' : 'НЕТ'}`);
      console.log(`   Негативные слова: ${frustrationAnalysis.contextFactors.negativeKeywordsCount}`);
      console.log(`   Ругательства: ${frustrationAnalysis.contextFactors.hasSwearing ? 'ДА' : 'НЕТ'}`);
      console.log(`   Рекомендована эскалация: ${frustrationAnalysis.shouldEscalate ? '🚨 ДА' : '✅ НЕТ'}`);
      
      if (frustrationAnalysis.escalationReason) {
        console.log(`   Причина эскалации: ${frustrationAnalysis.escalationReason}`);
      }

      // Проверяем правильность работы системы
      const isCorrect = frustrationAnalysis.shouldEscalate === scenario.shouldEscalate;
      console.log(`\n🎯 РЕЗУЛЬТАТ ТЕСТА: ${isCorrect ? '✅ ПРАВИЛЬНО' : '❌ ОШИБКА'}`);
      
      if (!isCorrect) {
        console.log(`   ⚠️  Ожидалась эскалация: ${scenario.shouldEscalate}, получена: ${frustrationAnalysis.shouldEscalate}`);
      }

      // Если рекомендована эскалация, тестируем генерацию письма
      if (frustrationAnalysis.shouldEscalate) {
        console.log('\n📧 ТЕСТИРОВАНИЕ ГЕНЕРАЦИИ ПИСЬМА...');
        
        try {
          const emailDraft = await emailComposer.generateEmail({
            userId: `test-user-${i}`,
            sessionId: `test-session-${i}`,
            frustrationAnalysis: frustrationAnalysis,
            userFacts: TEST_USER_FACTS,
            recentMessages: scenario.recentMessages,
            businessContext: 'EAA Compliance Chatbot Test'
          });

          console.log('✅ ПИСЬМО УСПЕШНО СГЕНЕРИРОВАНО:');
          console.log(`   📝 Тема: "${emailDraft.subject}"`);
          console.log(`   🎯 Потенциал продаж: ${emailDraft.salesPotential}`);
          console.log(`   ⏰ Срочность: ${emailDraft.urgencyLevel}`);
          console.log(`   👤 Краткое описание: ${emailDraft.userContextSummary.substring(0, 100)}...`);
          console.log(`   💌 Первые 200 символов письма: "${emailDraft.body.substring(0, 200)}..."`);
          
          console.log('\n🛡️ БЕЗОПАСНОСТЬ: Письмо НЕ отправлено, сохранено как черновик в БД');

        } catch (emailError) {
          console.log(`❌ ОШИБКА при генерации письма: ${emailError.message}`);
        }
      }

    } catch (error) {
      console.log(`❌ ОШИБКА при анализе фрустрации: ${error.message}`);
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }

  console.log('🎉 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО!');
  console.log('🛡️ Все письма сохранены как черновики, НИ ОДНО НЕ ОТПРАВЛЕНО');
  console.log('📊 Проверьте логи выше для анализа работы системы');
}

// Запускаем тест только если файл вызван напрямую
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
  runSafeTest().catch(error => {
    console.error('💥 КРИТИЧЕСКАЯ ОШИБКА ТЕСТА:', error);
    process.exit(1);
  });
}

export { runSafeTest, TEST_SCENARIOS, TEST_USER_FACTS }; 