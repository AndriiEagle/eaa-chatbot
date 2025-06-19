import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

// Получаем текущую директорию
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Создаем клиент Supabase напрямую с переменными окружения
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Ошибка: Не найдены переменные окружения SUPABASE_URL или SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL() {
  try {
    // Читаем файл SQL
    const sqlFilePath = path.resolve(__dirname, '../../sql/escalation_schema_update.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Выполняем SQL запрос для обновления схемы...');
    
    // Выполняем SQL запрос через RPC
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Ошибка при выполнении SQL:', error);
      console.log('\n===== ПОПРОБУЙТЕ ВЫПОЛНИТЬ СЛЕДУЮЩИЙ SQL ЗАПРОС В РЕДАКТОРЕ SUPABASE ВРУЧНУЮ =====\n');
      console.log(sqlContent);
      console.log('\n==================================================================================\n');
    } else {
      console.log('✅ SQL запрос выполнен успешно! Схема обновлена.');
    }
  } catch (err) {
    console.error('❌ Исключение при выполнении SQL:', err);
  }
}

// Запускаем обновление схемы
executeSQL();

// Запускаем обновление схемы
executeSQL()
  .then(() => {
    console.log('Операция выполнения SQL завершена.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Ошибка при выполнении операции:', err);
    process.exit(1);
  }); 