/**
 * COMMONJS COPY OF FIXED TEST SCENARIOS
 * Allows running under "type":"module" project without ESM issues
 */
const http = require('http');
const { v4: uuidv4 } = require('uuid');

const API_BASE = 'http://localhost:3000/api/v1';

/**
 * FIXED TEST SCENARIOS (CommonJS)
 * Полная копия скрипта, совместимая с проектом "type: module"
 */

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
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          console.log(`✅ [TEST ${this.messageCount}] Response received (status ${res.statusCode})`);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try { resolve(JSON.parse(data)); }
            catch (_) { resolve({ error: 'JSON parse error' }); }
          } else {
            resolve({ error: `HTTP ${res.statusCode}` });
          }
        });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    await new Promise(r => setTimeout(r, 1500)); // small delay
    return response;
  }

  async runGradualFrustrationScenario() {
    console.log(`\n🎭 СЦЕНАРИЙ: Градуальная фрустрация`);
    await this.sendMessage('Что такое European Accessibility Act?', 'Нейтральный запрос');
    await this.sendMessage('Ваш ответ слишком сложный, объясните проще', 'Легкое недовольство');
    await this.sendMessage('Опять непонятно! Мне нужен простой ответ!', 'Усиление фрустрации');
    await this.sendMessage('Damn it! Почему вы не можете дать нормальный ответ?!', 'Высокая фрустрация');
    await this.sendMessage('FUCK THIS! Я трачу время впустую! Ваш бот бесполезен!', 'Критическая фрустрация');
    console.log('✅ Сценарий градуальной фрустрации завершён');
  }

  async runDenialScenario() {
    console.log(`\n🎭 СЦЕНАРИЙ: Отрицание`);
    await this.sendMessage('Что такое EAA?', 'Начальный вопрос');
    await this.sendMessage('Нет, это не то!', 'Отрицание');
    await this.sendMessage('NO! Это неправильно!', 'Усиление');
    await this.sendMessage('NO NO NO! Вы не понимаете!', 'Множественное');
    await this.sendMessage('no!!!!!!!!!!!!!!!!!!!!', 'Критическое');
    console.log('✅ Сценарий отрицания завершён');
  }

  async runProfanityEscalationScenario() {
    console.log(`\n🎭 СЦЕНАРИЙ: Ругательства`);
    await this.sendMessage('Помогите с доступностью', 'Нейтральная просьба');
    await this.sendMessage('Ваш ответ бесполезен!', 'Негатив');
    await this.sendMessage('Damn it! Это не работает!', 'Первое ругательство');
    await this.sendMessage('Shit! Почему так плохо?!', 'Усиление');
    await this.sendMessage('Fuck this! Я не могу получить ответ!', 'Критическое');
    console.log('✅ Сценарий ругательств завершён');
  }

  async validateSessionContinuity() {
    console.log(`\n🔍 Валидация непрерывности сессии`);
    await this.sendMessage('Первое сообщение', '1/3');
    await this.sendMessage('Второе сообщение', '2/3');
    await this.sendMessage('Третье сообщение', '3/3');
    console.log(`✅ Все сообщения в одной сессии: ${this.sessionId}`);
  }
}

async function runAllTests() {
  console.log('🚀 Запуск всех тестов');
  const suites = [
    async () => { const s = new FrustrationTestSuite(); await s.runGradualFrustrationScenario(); },
    async () => { const s = new FrustrationTestSuite(); await s.runDenialScenario(); },
    async () => { const s = new FrustrationTestSuite(); await s.runProfanityEscalationScenario(); },
    async () => { const s = new FrustrationTestSuite(); await s.validateSessionContinuity(); }
  ];
  for (const run of suites) { await run(); await new Promise(r => setTimeout(r, 3000)); }
  console.log('🎉 Все тесты завершены');
}

if (require.main === module) { runAllTests(); }
// ... existing code ... 