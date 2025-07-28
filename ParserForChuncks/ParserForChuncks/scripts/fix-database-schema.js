#!/usr/bin/env node

/**
 * 🚨 КРИТИЧНОЕ ИСПРАВЛЕНИЕ СХЕМЫ БД
 * 
 * Автоматически исправляет проблему с отсутствующей колонкой user_id 
 * в таблице frustration_analysis
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Загружаем переменные среды
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚨 НАЧИНАЕМ КРИТИЧНОЕ ИСПРАВЛЕНИЕ СХЕМЫ БД...\n');

// Проверяем наличие переменных среды
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ ОШИБКА: Не найдены переменные среды SUPABASE_URL или SUPABASE_SERVICE_KEY');
  console.error('   Проверьте файл .env');
  process.exit(1);
}

// Создаем клиент Supabase с правами администратора
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixDatabase() {
  try {
    console.log('📝 Читаем SQL-скрипт исправления...');
    
    // Читаем SQL-скрипт
    const sqlPath = join(__dirname, '..', 'sql', 'fix_frustration_analysis_table.sql');
    const sqlScript = readFileSync(sqlPath, 'utf8');
    
    console.log('🔧 Применяем исправления к базе данных...');
    
    // Выполняем SQL-скрипт
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_script: sqlScript
    });
    
    if (error) {
      console.error('❌ ОШИБКА при выполнении SQL:', error);
      
      // Пробуем альтернативный метод - прямое выполнение через query
      console.log('🔄 Пробуем альтернативный метод...');
      
      const commands = [
        // Добавляем колонку user_id если её нет
        `DO $$ 
         BEGIN 
           IF NOT EXISTS (
             SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'frustration_analysis' AND column_name = 'user_id'
           ) THEN
             ALTER TABLE frustration_analysis ADD COLUMN user_id TEXT;
             RAISE NOTICE 'Колонка user_id добавлена';
           END IF;
         END $$;`,
        
        // Создаем индекс
        `CREATE INDEX IF NOT EXISTS idx_frustration_analysis_user_id ON frustration_analysis(user_id);`
      ];
      
      for (const command of commands) {
        console.log(`⚡ Выполняем: ${command.substring(0, 50)}...`);
        const { error: cmdError } = await supabase.query(command);
        if (cmdError) {
          console.error(`❌ Ошибка в команде: ${cmdError.message}`);
        } else {
          console.log('✅ Команда выполнена успешно');
        }
      }
    } else {
      console.log('✅ SQL-скрипт выполнен успешно!');
      console.log('📊 Результат:', data);
    }
    
    // Проверяем результат
    console.log('\n🔍 Проверяем структуру таблицы...');
    
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'frustration_analysis')
      .order('ordinal_position');
    
    if (columnError) {
      console.error('❌ Ошибка при проверке структуры:', columnError);
    } else {
      console.log('📋 Структура таблицы frustration_analysis:');
      console.table(columns);
      
      // Проверяем наличие user_id
      const hasUserId = columns.some(col => col.column_name === 'user_id');
      
      if (hasUserId) {
        console.log('\n🎉 УСПЕХ! Колонка user_id найдена в таблице!');
        console.log('✅ Проблема решена. Теперь тесты должны работать.');
      } else {
        console.log('\n❌ ПРОБЛЕМА: Колонка user_id все еще отсутствует');
        console.log('🔧 Нужно выполнить SQL вручную в Supabase Dashboard');
      }
    }
    
  } catch (error) {
    console.error('💥 КРИТИЧНАЯ ОШИБКА:', error.message);
    console.log('\n📋 ИНСТРУКЦИИ ДЛЯ РУЧНОГО ИСПРАВЛЕНИЯ:');
    console.log('1. Откройте Supabase Dashboard');
    console.log('2. Перейдите в SQL Editor');
    console.log('3. Выполните команду:');
    console.log('   ALTER TABLE frustration_analysis ADD COLUMN user_id TEXT;');
    console.log('4. Создайте индекс:');
    console.log('   CREATE INDEX idx_frustration_analysis_user_id ON frustration_analysis(user_id);');
  }
}

// Запускаем исправление
fixDatabase()
  .then(() => {
    console.log('\n🏁 ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!');
    console.log('🔄 Теперь запустите тесты снова: npm test');
  })
  .catch((error) => {
    console.error('💥 ФАТАЛЬНАЯ ОШИБКА:', error);
    process.exit(1);
  }); 