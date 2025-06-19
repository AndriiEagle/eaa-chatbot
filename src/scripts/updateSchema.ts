import { supabase } from '../services/supabaseService.js';

async function checkAndUpdateSchema() {
  console.log('Начинаем проверку и обновление схемы базы данных...');

  try {
    // 1. Проверяем наличие колонки updated_at в таблице user_facts
    const { data: columns, error: checkError } = await supabase
      .from('user_facts')
      .select('id, created_at')
      .limit(1);

    if (checkError) {
      if (checkError.message.includes('updated_at does not exist')) {
        console.log('Обнаружена проблема: колонка updated_at отсутствует в таблице user_facts');
        
        // 2. Добавляем колонку updated_at
        const addColumnQuery = `
          ALTER TABLE user_facts 
          ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        `;
        
        const { error: alterError } = await supabase.rpc('exec_sql', { sql: addColumnQuery });
        
        if (alterError) {
          console.error('❌ Ошибка при добавлении колонки updated_at:', alterError);
          
          // Альтернативный метод: используем более простой запрос, если RPC не работает
          try {
            await supabase.rpc('add_column_if_not_exists', {
              table_name: 'user_facts',
              column_name: 'updated_at',
              column_type: 'TIMESTAMP WITH TIME ZONE',
              default_value: 'NOW()'
            });
            console.log('✅ Колонка updated_at успешно добавлена через add_column_if_not_exists');
          } catch (rpcError) {
            console.error('❌ Ошибка при использовании add_column_if_not_exists:', rpcError);
            throw new Error('Failed to update user_facts table schema');
          }
        } else {
          console.log('✅ Колонка updated_at успешно добавлена');
        }
        
        // 3. Копируем created_at в updated_at для существующих записей
        const updateQuery = `
          UPDATE user_facts 
          SET updated_at = created_at 
          WHERE updated_at IS NULL;
        `;
        
        const { error: updateError } = await supabase.rpc('exec_sql', { sql: updateQuery });
        
        if (updateError) {
          console.error('❌ Ошибка при обновлении значений updated_at:', updateError);
        } else {
          console.log('✅ Данные для updated_at успешно обновлены');
        }
      } else {
        // Другая ошибка при проверке таблицы
        console.error('❌ Ошибка при проверке схемы таблицы user_facts:', checkError);
      }
    } else {
      // Попытка обновить напрямую, на случай если проверка не выявила проблему
      try {
        const addColumnQuery = `
          ALTER TABLE user_facts 
          ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
          
          UPDATE user_facts 
          SET updated_at = created_at 
          WHERE updated_at IS NULL;
        `;
        
        const { error: directError } = await supabase.rpc('exec_sql', { sql: addColumnQuery });
        
        if (directError) {
          console.error('❌ Ошибка при прямом обновлении схемы:', directError);
        } else {
          console.log('✅ Схема таблицы user_facts успешно обновлена');
        }
      } catch (directUpdateError) {
        console.error('❌ Исключение при прямом обновлении схемы:', directUpdateError);
      }
    }
    
    // 4. Проверяем результат
    console.log('Проверка обновленной схемы...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('user_facts')
      .select('updated_at')
      .limit(1);
      
    if (finalError) {
      console.error('❌ Итоговая проверка не удалась:', finalError);
    } else {
      console.log('✅ Итоговая проверка успешна. Схема таблицы user_facts обновлена.');
    }
    
  } catch (e) {
    console.error('❌ Исключение при обновлении схемы:', e);
  }
}

// Запускаем обновление схемы
checkAndUpdateSchema()
  .then(() => {
    console.log('Операция проверки и обновления схемы завершена.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Ошибка при выполнении операции:', err);
    process.exit(1);
  }); 