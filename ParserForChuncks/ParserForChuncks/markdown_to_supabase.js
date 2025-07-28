import fs from 'fs';
import matter from 'gray-matter';
import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';
import removeMd from 'remove-markdown';
import tokenizer from 'sbd';
import { get_encoding } from '@dqbd/tiktoken';

// В package.json добавь: "type": "module"

// 1. Setup
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const datasetId = uuidv4(); // 🔁 One dataset for all chunks
const MAX_TOKENS = 300;
const MIN_TOKENS = 10;
const MODEL = 'text-embedding-ada-002';

// 2. Load markdown и нормализуем переносы строк
let markdown = fs.readFileSync('ALL_Chapters_0-6.md', 'utf8');
markdown = markdown.replace(/\r\n/g, '\n');
const { content } = matter(markdown); // Remove frontmatter if any

// 3. Split into chunks с очисткой markdown
const chunks = [];
const lines = content.split(/(?=^## )/gm);

function splitToSentences(text) {
  return tokenizer.sentences(text, {newline_boundaries: true});
}

// Инициализация энкодера для OpenAI
const enc = get_encoding("cl100k_base"); // используется для text-embedding-ada-002

function countTokens(text) {
  return enc.encode(text).length;
}

(async () => {
  async function clearTable() {
    // Очищаем таблицу для текущего dataset_id
    const { error } = await supabase.from('documents').delete().eq('dataset_id', datasetId);
    if (error) console.error('Ошибка очистки таблицы:', error);
  }

  await clearTable();
  let chunkIndex = 0;
  let sectionIndex = 0;
  for (const section of lines) {
    const titleMatch = section.match(/^##\s+(.*)/);
    const sectionTitle = titleMatch ? titleMatch[1] : 'Untitled';
    // Фильтруем пустые параграфы
    const paragraphs = section.trim().split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 0);
    let buffer = '';
    for (const p of paragraphs) {
      // Очищаем markdown
      const cleanP = removeMd(p);
      const sentences = splitToSentences(cleanP);
      for (const s of sentences) {
        const sTokens = countTokens(s);
        const bufferTokens = countTokens(buffer);
        // Если предложение само по себе больше лимита — режем его
        if (sTokens > MAX_TOKENS) {
          const words = s.split(' ').filter(Boolean);
          let wordBuffer = [];
          for (let i = 0; i < words.length; i++) {
            wordBuffer.push(words[i]);
            const chunkText = wordBuffer.join(' ');
            if (countTokens(chunkText) >= MAX_TOKENS) {
              if (countTokens(chunkText) >= MIN_TOKENS) {
                chunks.push({ sectionTitle, sectionIndex, chunkIndex, lang: 'en', content: chunkText });
                chunkIndex++;
              }
              wordBuffer = [];
            }
          }
          if (wordBuffer.length > 0 && countTokens(wordBuffer.join(' ')) >= MIN_TOKENS) {
            chunks.push({ sectionTitle, sectionIndex, chunkIndex, lang: 'en', content: wordBuffer.join(' ') });
            chunkIndex++;
          }
          continue;
        }
        if (bufferTokens + sTokens > MAX_TOKENS) {
          if (buffer && countTokens(buffer) >= MIN_TOKENS) {
            chunks.push({ sectionTitle, sectionIndex, chunkIndex, lang: 'en', content: buffer.trim() });
            chunkIndex++;
          }
          buffer = s;
        } else {
          buffer += (buffer ? ' ' : '') + s;
        }
      }
    }
    if (buffer.trim().length > 0 && countTokens(buffer) >= MIN_TOKENS) {
      chunks.push({ sectionTitle, sectionIndex, chunkIndex, lang: 'en', content: buffer.trim() });
      chunkIndex++;
    }
    sectionIndex++;
  }

  // 4. Process chunks: embedding + upload + отчёт
  let successCount = 0;
  let failCount = 0;
  const failedChunks = [];
  for (const chunk of chunks) {
    try {
      const embeddingRes = await openai.embeddings.create({
        model: MODEL,
        input: chunk.content,
      });
      const embedding = embeddingRes.data[0].embedding;
      const tokenCount = countTokens(chunk.content);
      const { error } = await supabase.from('documents').insert({
        id: uuidv4(),
        created_at: new Date().toISOString(),
        dataset_id: datasetId,
        section_title: chunk.sectionTitle,
        section_index: chunk.sectionIndex,
        chunk_index: chunk.chunkIndex,
        lang: 'en',
        content: chunk.content,
        token_count: tokenCount,
        url: null,
        embedding,
      });
      if (error) {
        failCount++;
        failedChunks.push({ ...chunk, error });
        console.error(`❌ Error uploading chunk [${chunk.chunkIndex}]:`, error);
      } else {
        successCount++;
        console.log(`✅ Uploaded chunk: ${chunk.sectionTitle} [${chunk.chunkIndex}] (${tokenCount} tokens)`);
      }
    } catch (err) {
      failCount++;
      failedChunks.push({ ...chunk, error: err });
      console.error(`❌ Exception for chunk [${chunk.chunkIndex}]:`, err);
    }
  }
  console.log('🎉 All chunks processed.');
  console.log(`Успешно загружено чанков: ${successCount}`);
  console.log(`Неудачных чанков: ${failCount}`);
  if (failCount > 0) {
    fs.writeFileSync('failed_chunks.json', JSON.stringify(failedChunks, null, 2), 'utf8');
    console.log('Неудачные чанки сохранены в failed_chunks.json');
  }
})(); 