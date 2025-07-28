/**
 * 🚀 БЫСТРЫЙ ТЕСТ ФРУСТРАЦИИ
 * 
 * Простой скрипт для тестирования одного сценария
 */

// Проверка поддержки fetch
if (typeof fetch === 'undefined') {
  console.error('❌ Fetch не поддерживается в этой версии Node.js. Используйте Node.js 18+ или установите node-fetch');
  process.exit(1);
}

const QUICK_FRUSTRATION_SCENARIO = [
  "Помогите с European Accessibility Act",
  "Ваш ответ бесполезен, мне нужна помощь!",
  "Damn it! Это не работает вообще!",
  "Shit! Почему этот бот такой плохой?!",
  "Fuck this! Я не могу получить нормальный ответ!"
];

async function runQuickTest() {
  console.log('🎭 Быстрый тест фрустрации...\n');
  
  const baseUrl = 'http://localhost:3001';
  const sessionId = `quick-test-${Date.now()}`;
  const userId = `user-${Date.now()}`;
  
  console.log(`📋 Session ID: ${sessionId}`);
  console.log(`👤 User ID: ${userId}\n`);
  
  for (let i = 0; i < QUICK_FRUSTRATION_SCENARIO.length; i++) {
    const message = QUICK_FRUSTRATION_SCENARIO[i];
    
    console.log(`📤 Сообщение ${i + 1}: "${message}"`);
    
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
      
      // Пауза между сообщениями
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`❌ Ошибка запроса: ${error.message}`);
    }
  }
  
  console.log('\n🏁 Быстрый тест завершен!');
  console.log('📧 Проверьте email для уведомлений о фрустрации');
  console.log(`🔍 Session ID для поиска: ${sessionId}`);
}

// Запуск теста
runQuickTest().catch(console.error); 