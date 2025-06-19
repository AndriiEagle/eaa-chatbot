import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
  // Получаем все чанки
  const { data, error } = await supabase.from('documents').select('content');
  if (error) {
    console.error('Ошибка при извлечении:', error);
    return;
  }

  // Сохраняем в файл
  const allText = data.map(row => row.content).join('\n\n---\n\n');
  fs.writeFileSync('all_chunks_from_supabase.txt', allText, 'utf8');

  // Считаем количество слов
  const wordCount = allText.split(/\s+/).filter(Boolean).length;
  console.log(`Всего слов в извлечённых чанках: ${wordCount}`);
}

main(); 