# 🔐 GitHub Secrets Setup Guide

## Обзор

Этот документ описывает, как настроить GitHub Secrets для безопасной работы CI/CD пайплайна без раскрытия реальных API ключей.

## 🛡️ Принципы безопасности

✅ **БЕЗОПАСНО:**
- Использование GitHub Secrets для хранения API ключей
- Mock-значения для тестов по умолчанию
- Никогда не коммитим реальные ключи в репозиторий

❌ **НЕБЕЗОПАСНО:**
- Хранение API ключей в коде
- Использование реальных ключей в публичных репозиториях
- Передача ключей через незащищенные каналы

## 🔧 Настройка GitHub Secrets

### 1. Перейдите в настройки репозитория

1. Откройте ваш репозиторий на GitHub
2. Нажмите на вкладку **Settings**
3. В левом меню выберите **Secrets and variables** → **Actions**

### 2. Добавьте необходимые секреты

Нажмите **New repository secret** и добавьте следующие секреты:

#### Для тестирования (опционально):

| Имя секрета | Описание | Пример значения |
|-------------|----------|-----------------|
| `OPENAI_API_KEY_TEST` | OpenAI API ключ для тестов | `sk-test-your-key-here` |
| `SUPABASE_URL_TEST` | URL Supabase проекта для тестов | `https://your-test-project.supabase.co` |
| `SUPABASE_SERVICE_KEY_TEST` | Service ключ Supabase для тестов | `eyJhbGciOiJIUzI1NiIs...` |

#### Для продакшена:

| Имя секрета | Описание | Пример значения |
|-------------|----------|-----------------|
| `OPENAI_API_KEY_PROD` | OpenAI API ключ для продакшена | `sk-prod-your-key-here` |
| `SUPABASE_URL_PROD` | URL Supabase проекта для продакшена | `https://your-prod-project.supabase.co` |
| `SUPABASE_SERVICE_KEY_PROD` | Service ключ Supabase для продакшена | `eyJhbGciOiJIUzI1NiIs...` |

### 3. Получение API ключей

#### OpenAI API Key:
1. Перейдите на [platform.openai.com](https://platform.openai.com/api-keys)
2. Войдите в аккаунт
3. Создайте новый API ключ
4. Скопируйте ключ (он начинается с `sk-`)

#### Supabase Keys:
1. Перейдите в [supabase.com/dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **Settings** → **API**
4. Скопируйте:
   - **URL** (Project URL)
   - **service_role key** (НЕ anon key!)

## 🧪 Как работают тесты

### Без GitHub Secrets:
```bash
# Тесты используют mock-значения автоматически
npm test
```

### С GitHub Secrets:
```yaml
# В GitHub Actions используются реальные ключи, если они настроены
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY_TEST }}
```

## 🔍 Проверка настройки

### 1. Локальная проверка:
```bash
cd ParserForChuncks
npm test
```

### 2. Проверка в GitHub Actions:
1. Сделайте коммит и push
2. Перейдите на вкладку **Actions**
3. Проверьте, что тесты проходят успешно

## 🚨 Устранение проблем

### Проблема: "API keys are missing"
**Решение:** Тесты теперь используют mock-значения по умолчанию. Эта ошибка не должна появляться.

### Проблема: "Unauthorized" в тестах
**Решение:** 
1. Проверьте правильность API ключей в GitHub Secrets
2. Убедитесь, что используете service_role key, а не anon key для Supabase

### Проблема: Тесты падают в CI/CD
**Решение:**
1. Проверьте логи GitHub Actions
2. Убедитесь, что все секреты настроены правильно
3. Проверьте, что имена секретов совпадают с конфигурацией

## 📝 Примечания

- **Mock-значения безопасны** - они не подключаются к реальным сервисам
- **GitHub Secrets зашифрованы** - GitHub автоматически скрывает их в логах
- **Тесты работают без настройки** - благодаря mock-значениям по умолчанию

## 🔗 Полезные ссылки

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [Supabase Dashboard](https://supabase.com/dashboard) 