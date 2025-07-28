/**
 * ИСПРАВЛЕННЫЕ ТЕСТОВЫЕ СЦЕНАРИИ
 * Этот файл создает ОДИН разговор с правильной последовательностью сообщений
 */

const http = require('http');
const { v4: uuidv4 } = require('uuid');
const API_BASE = 'http://localhost:3000/api/v1';

class FrustrationTestSuite {
  constructor() {
    this.userId = `test-user-${Date.now()}`;
    this.sessionId = uuidv4();
    this.messageCount = 0;
  }

  async sendMessage(message, description) {
    this.messageCount++;
    
    console.log(`\n📝 [TEST ${this.messageCount}] ${description}`);
    console.log(`👤 User: ${this.userId}`);
    console.log(`💬 Session: ${this.sessionId}`);
    console.log(`❓ Message: "${message}"`);
    
    try {
      const postData = JSON.stringify({
        user_id: this.userId,
        session_id: this.sessionId,
        question: message,
        stream: false
      });

      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/ask',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const response = await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            console.log(`✅ [TEST ${this.messageCount}] Response received`);
            console.log(`📊 Status: ${res.statusCode}`);
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const jsonData = JSON.parse(data);
                resolve(jsonData);
              } catch (parseError) {
                console.error(`❌ [TEST ${this.messageCount}] JSON Parse Error:`, parseError.message);
                resolve({ error: 'JSON Parse Error' });
              }
            } else {
              console.error(`❌ [TEST ${this.messageCount}] HTTP Error: ${res.statusCode}`);
              resolve({ error: `HTTP ${res.statusCode}` });
            }
          });
        });

        req.on('error', (err) => {
          console.error(`❌ [TEST ${this.messageCount}] Request Error:`, err.message);
          reject(err);
        });

        req.write(postData);
        req.end();
      });
      
      // Задержка между сообщениями для имитации реального разговора
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return response;
      
    } catch (error) {
      console.error(`❌ [TEST ${this.messageCount}] Error:`, error.message);
      throw error;
    }
  }

  async runGradualFrustrationScenario() {
    console.log(`\n🎭 ЗАПУСК СЦЕНАРИЯ: ГРАДУАЛЬНАЯ ФРУСТРАЦИЯ`);
    console.log(`================================================`);
    
    try {
      // Сообщение 1: Нейтральное
      await this.sendMessage(
        "Что такое European Accessibility Act?",
        "Нейтральный запрос информации"
      );
      
      // Сообщение 2: Лёгкое недовольство
      await this.sendMessage(
        "Ваш ответ слишком сложный, объясните проще",
        "Легкое недовольство качеством ответа"
      );
      
      // Сообщение 3: Усиление фрустрации
      await this.sendMessage(
        "Опять непонятно! Мне нужен простой ответ!",
        "Усиление фрустрации с восклицаниями"
      );
      
      // Сообщение 4: Высокая фрустрация
      await this.sendMessage(
        "Damn it! Почему вы не можете дать нормальный ответ?!",
        "Высокая фрустрация с ругательствами"
      );
      
      // Сообщение 5: Критическая фрустрация
      await this.sendMessage(
        "FUCK THIS! Я трачу время впустую! Ваш бот бесполезен!",
        "Критическая фрустрация - должна сработать эскалация"
      );
      
      console.log(`\n✅ [SCENARIO] Сценарий градуальной фрустрации завершен`);
      console.log(`📊 Отправлено сообщений: ${this.messageCount}`);
      console.log(`👤 Пользователь: ${this.userId}`);
      console.log(`💬 Сессия: ${this.sessionId}`);
      
    } catch (error) {
      console.error(`❌ [SCENARIO] Ошибка в сценарии:`, error);
    }
  }

  async runDenialScenario() {
    console.log(`\n🎭 ЗАПУСК СЦЕНАРИЯ: ОТРИЦАНИЕ И ПРОТЕСТ`);
    console.log(`================================================`);
    
    try {
      await this.sendMessage("Что такое EAA?", "Начальный вопрос");
      await this.sendMessage("Нет, это не то!", "Отрицание первого ответа");
      await this.sendMessage("NO! Это неправильно!", "Усиление отрицания");
      await this.sendMessage("NO NO NO! Вы не понимаете!", "Множественное отрицание");
      await this.sendMessage("no!!!!!!!!!!!!!!!!!!!!", "Критическое отрицание");
      
      console.log(`\n✅ [SCENARIO] Сценарий отрицания завершен`);
      
    } catch (error) {
      console.error(`❌ [SCENARIO] Ошибка в сценарии отрицания:`, error);
    }
  }

  async runProfanityEscalationScenario() {
    console.log(`\n🎭 ЗАПУСК СЦЕНАРИЯ: ЭСКАЛАЦИЯ С РУГАТЕЛЬСТВАМИ`);
    console.log(`================================================`);
    
    try {
      await this.sendMessage("Помогите с доступностью", "Нейтральная просьба");
      await this.sendMessage("Ваш ответ бесполезен!", "Негативная оценка");
      await this.sendMessage("Damn it! Это не работает!", "Первое ругательство");
      await this.sendMessage("Shit! Почему так плохо?!", "Усиление ругательств");
      await this.sendMessage("Fuck this! Я не могу получить ответ!", "Критическое ругательство");
      
      console.log(`\n✅ [SCENARIO] Сценарий эскалации завершен`);
      
    } catch (error) {
      console.error(`❌ [SCENARIO] Ошибка в сценарии эскалации:`, error);
    }
  }

  async validateSessionContinuity() {
    console.log(`\n🔍 ВАЛИДАЦИЯ НЕПРЕРЫВНОСТИ СЕССИИ`);
    console.log(`================================================`);
    
    // Отправить 3 сообщения и проверить, что они в одной сессии
    const messages = [
      "Первое сообщение",
      "Второе сообщение", 
      "Третье сообщение"
    ];
    
    for (let i = 0; i < messages.length; i++) {
      await this.sendMessage(messages[i], `Тест непрерывности ${i + 1}/3`);
    }
    
    console.log(`\n✅ [VALIDATION] Все сообщения должны быть в сессии: ${this.sessionId}`);
  }
}

// Функция запуска тестов
async function runAllTests() {
  console.log(`🚀 ЗАПУСК ИСПРАВЛЕННЫХ ТЕСТОВЫХ СЦЕНАРИЕВ`);
  console.log(`================================================`);
  console.log(`⏰ Время начала: ${new Date().toISOString()}`);
  
  try {
    // Тест 1: Градуальная фрустрация
    const test1 = new FrustrationTestSuite();
    await test1.runGradualFrustrationScenario();
    
    // Задержка между тестами
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Тест 2: Отрицание
    const test2 = new FrustrationTestSuite();
    await test2.runDenialScenario();
    
    // Задержка между тестами
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Тест 3: Эскалация с ругательствами
    const test3 = new FrustrationTestSuite();
    await test3.runProfanityEscalationScenario();
    
    // Тест 4: Валидация непрерывности
    const test4 = new FrustrationTestSuite();
    await test4.validateSessionContinuity();
    
    console.log(`\n🎉 ВСЕ ТЕСТОВЫЕ СЦЕНАРИИ ЗАВЕРШЕНЫ`);
    console.log(`================================================`);
    console.log(`⏰ Время завершения: ${new Date().toISOString()}`);
    
  } catch (error) {
    console.error(`❌ Критическая ошибка в тестах:`, error);
  }
}

// Запуск
if (require.main === module) {
  runAllTests();
}

module.exports = { FrustrationTestSuite, runAllTests }; 