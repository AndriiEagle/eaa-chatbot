# 🤝 Contributing to EAA ChatBot

Спасибо за интерес к участию в развитии EAA ChatBot! Ваш вклад поможет сделать веб более доступным для всех.

## 📋 Содержание

- [Как внести вклад](#как-внести-вклад)
- [Сообщение о багах](#сообщение-о-багах)
- [Предложение функций](#предложение-функций)
- [Процесс разработки](#процесс-разработки)
- [Стандарты кода](#стандарты-кода)
- [Тестирование](#тестирование)
- [Документация](#документация)

## 🚀 Как внести вклад

### 1. Fork репозитория
```bash
git clone https://github.com/your-username/eaa-chatbot.git
cd eaa-chatbot
```

### 2. Создайте ветку для изменений
```bash
git checkout -b feature/amazing-feature
# или
git checkout -b fix/issue-123
# или  
git checkout -b docs/update-readme
```

### 3. Настройте окружение разработки
```bash
cd ParserForChuncks
npm install
cp env.example .env
# Отредактируйте .env с вашими ключами
```

### 4. Внесите изменения
- Следуйте [стандартам кода](#стандарты-кода)
- Добавьте тесты для новой функциональности
- Обновите документацию если необходимо

### 5. Протестируйте изменения
```bash
npm run build
npm run test
```

### 6. Создайте Pull Request
- Заполните шаблон PR
- Добавьте описание изменений
- Свяжите с соответствующим issue

## 🐛 Сообщение о багах

### Перед созданием issue проверьте:
- [ ] Баг воспроизводится на последней версии
- [ ] Нет дублирующих issues
- [ ] Проверили документацию

### Шаблон для баг-репорта:
```markdown
**Описание бага:**
Краткое описание проблемы

**Шаги для воспроизведения:**
1. Перейти к '...'
2. Нажать на '...'
3. Увидеть ошибку

**Ожидаемое поведение:**
Что должно было произойти

**Фактическое поведение:**
Что произошло на самом деле

**Окружение:**
- OS: [e.g. Windows 10]
- Node.js: [e.g. 18.17.0]
- Browser: [e.g. Chrome 119]

**Дополнительная информация:**
Логи, скриншоты, и т.д.
```

## ✨ Предложение функций

### Шаблон для feature request:
```markdown
**Описание функции:**
Что вы хотите добавить?

**Мотивация:**
Зачем это нужно? Какую проблему решает?

**Подробное описание:**
Как это должно работать?

**Альтернативы:**
Какие есть альтернативные решения?

**Дополнительная информация:**
Mockups, примеры, ссылки и т.д.
```

## 🛠️ Процесс разработки

### Структура веток:
- `main` - стабильная продакшн версия
- `dev` - основная ветка разработки  
- `feature/*` - новые функции
- `fix/*` - исправления багов
- `docs/*` - изменения документации

### Workflow:
1. **Создайте issue** для обсуждения изменений
2. **Создайте ветку** от `dev`
3. **Разрабатывайте** с частыми коммитами
4. **Тестируйте** все изменения
5. **Создайте PR** в `dev` ветку
6. **Пройдите code review**
7. **Merge** после одобрения

## 📝 Стандарты кода

### TypeScript
```typescript
// ✅ Хорошо
interface UserRequest {
  question: string;
  userId: string;
  sessionId: string;
}

const processRequest = async (request: UserRequest): Promise<Response> => {
  // implementation
};

// ❌ Плохо
const processRequest = (request: any) => {
  // implementation
};
```

### Именование:
- **Переменные/функции**: camelCase (`getUserData`)
- **Классы/интерфейсы**: PascalCase (`UserManager`)
- **Константы**: SCREAMING_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Файлы**: kebab-case (`user-service.ts`)

### Комментарии:
```typescript
/**
 * Анализирует фрустрацию пользователя на основе сообщения
 * @param message - Сообщение пользователя для анализа
 * @param userId - ID пользователя для контекста
 * @returns Результат анализа с уровнем фрустрации
 */
async function analyzeFrustration(message: string, userId: string): Promise<FrustrationAnalysis> {
  // Используем ИИ для анализа тональности
  const sentiment = await openai.analyzeMessage(message);
  
  return {
    level: sentiment.frustration,
    confidence: sentiment.confidence,
    triggers: sentiment.triggers
  };
}
```

### ESLint правила:
- Точка с запятой обязательна
- Одинарные кавычки для строк
- Максимум 100 символов в строке
- Trailing comma везде где возможно

## 🧪 Тестирование

### Запуск тестов:
```bash
# Все тесты
npm run test

# Конкретный тест
node test-frustration-system.js

# Интеграционные тесты
npm run test:integration
```

### Написание тестов:
```typescript
describe('FrustrationDetectionAgent', () => {
  it('should detect high frustration', async () => {
    const message = "Это просто ужас! Ничего не работает!";
    const result = await agent.analyze(message, 'user123');
    
    expect(result.level).toBeGreaterThan(0.75);
    expect(result.confidence).toBeGreaterThan(0.85);
  });
  
  it('should not detect frustration in neutral message', async () => {
    const message = "Как добавить кнопку на сайт?";
    const result = await agent.analyze(message, 'user123');
    
    expect(result.level).toBeLessThan(0.3);
  });
});
```

### Минимальные требования:
- ✅ Все новые функции покрыты тестами
- ✅ Все тесты проходят
- ✅ Покрытие кода > 80%

## 📖 Документация

### Обновление README:
- Добавьте новые API эндпоинты
- Обновите примеры использования
- Добавьте новые переменные окружения

### Комментарии в коде:
- JSDoc для всех публичных функций
- Комментарии для сложной бизнес-логики
- TODO комментарии для будущих улучшений

### Changelog:
Обновите `CHANGELOG.md` в соответствии с [Keep a Changelog](https://keepachangelog.com/):

```markdown
## [Unreleased]

### ✨ Добавлено
- Новая функция X для улучшения Y

### 🐛 Исправлено  
- Исправлена проблема с Z в ситуации W
```

## 🎯 Приоритетные области для вкладов

### 🔥 Высокий приоритет:
- Исправление багов безопасности
- Улучшение производительности
- Добавление тестов
- Исправление accessibility проблем

### 📈 Средний приоритет:
- Новые функции ИИ агентов
- Улучшение UX/UI
- Документация и примеры
- Интеграции с внешними сервисами

### 💡 Низкий приоритет:
- Рефакторинг кода
- Оптимизация сборки
- Дополнительные языки
- Экспериментальные функции

## ❓ Вопросы?

- 💬 Создайте [Discussion](https://github.com/your-repo/discussions)
- 📧 Напишите на support@eaa-chatbot.com
- 📖 Изучите [Wiki](https://github.com/your-repo/wiki)

## 📜 Лицензия

Внося вклад в этот проект, вы соглашаетесь с тем, что ваши изменения будут лицензированы под [MIT License](LICENSE).

---

<div align="center">
  <b>Спасибо за вклад в создание более доступного интернета! 🌍</b>
</div> 