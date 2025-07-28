# Модуль Памяти Чата

Модульная система для управления историей диалогов, контекстом и данными пользователей.

## Структура модуля

```
memory/
├── chatMemoryManager.ts   - Основной менеджер памяти чата
├── factManager.ts         - Менеджер фактов о пользователях
├── messageManager.ts      - Менеджер сообщений чата
├── sessionManager.ts      - Менеджер сессий чата
├── summaryManager.ts      - Менеджер саммаризации и контекста
├── types.ts               - Общие типы данных
├── index.ts               - Точка входа для экспорта
└── db_schema.sql          - SQL-схема для Supabase
```

## Быстрый старт

### Инициализация

```typescript
import { chatMemory } from '../utils/memory/index.js';
import { supabase } from '../config/supabase.js';
import { openai } from '../config/openai.js';

// Инициализация
chatMemory.initialize(supabase, openai);
```

### Работа с сессиями

```typescript
// Создание новой сессии
const sessionId = await chatMemory.createSession('user123', { 
  source: 'web_app', 
  userAgent: 'Chrome/98.0'
});

// Проверка существования сессии
const exists = await chatMemory.sessionExists(sessionId);

// Получение сессий пользователя
const sessions = await chatMemory.getUserSessions('user123');

// Удаление сессии
await chatMemory.deleteSession(sessionId);
```

### Сообщения

```typescript
// Сохранение вопроса пользователя
const messageId = await chatMemory.saveMessage(
  'Что такое European Accessibility Act?',
  'user',
  sessionId
);

// Сохранение ответа ассистента
const assistantMessageId = await chatMemory.saveMessage(
  'European Accessibility Act (EAA) - это...',
  'assistant',
  sessionId,
  { sources: ['document1.pdf', 'document2.pdf'] }
);

// Получение истории сообщений
const messages = await chatMemory.getSessionMessages(sessionId);

// Сохранение пары сообщений (вопрос-ответ)
const [userMsgId, assistantMsgId] = await chatMemory.saveConversationPair(
  sessionId,
  'В чем суть директивы?',
  'Суть директивы заключается в...',
  { sources: ['document3.pdf'] }
);
```

### Контекст и саммаризация

```typescript
// Получение контекста для запроса
const context = await chatMemory.createContextForRequest(
  'user123',
  sessionId,
  'Какие требования к мобильным приложениям?'
);

// Обновление саммари сессии
await chatMemory.updateSessionSummary(sessionId);
```

### Факты о пользователях

```typescript
// Сохранение факта
await chatMemory.saveUserFact(
  'user123',
  'business_type',
  'Транспортная компания',
  0.9,
  'message_id_123'
);

// Получение фактов
const facts = await chatMemory.getUserFacts('user123');
```

## Миграция со старого API

Для обеспечения обратной совместимости создан файл `chat_memory_legacy.ts`, который экспортирует все функции старого API. В процессе обновления кода необходимо заменить импорты и вызовы следующим образом:

```typescript
// Было:
import { saveMessage, createSession } from '../utils/chat_memory.js';

// Стало:
import { chatMemory } from '../utils/memory/index.js';
```

## Схема базы данных

Запустите SQL-скрипт из файла `db_schema.sql` в SQL-редакторе Supabase для создания или обновления необходимых таблиц и функций. 