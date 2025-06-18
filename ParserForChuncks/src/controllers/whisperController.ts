import { Request, Response } from 'express';
import OpenAI from 'openai';
import formidable, { Fields, Files } from 'formidable';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import os from 'os';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Функция для конвертации аудио в WAV формат
const convertToWav = (inputPath: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('wav')
      .on('end', () => {
        console.log('🔄 [Whisper] Конвертация в WAV завершена');
        resolve();
      })
      .on('error', (err) => {
        console.error('❌ [Whisper] Ошибка конвертации:', err);
        reject(err);
      })
      .save(outputPath);
  });
};

export const transcribeAudio = async (req: Request, res: Response) => {
  console.log('🎤 [Whisper] Получен запрос на транскрибацию');

  const form = formidable({});

  form.parse(req, async (err: Error | null, fields: Fields, files: Files) => {
    if (err) {
      console.error('❌ [Whisper] Ошибка при парсинге формы:', err);
      return res.status(500).json({ error: 'Ошибка обработки файла.', details: err.message });
    }

    const audioFile = files.audio;

    if (!audioFile || !Array.isArray(audioFile) || audioFile.length === 0) {
      return res.status(400).json({ error: 'Аудиофайл не найден в запросе.' });
    }

    const file = audioFile[0];
    const originalFilePath = file.filepath;
    
    // Создаем правильный путь для WAV файла
    const tempDir = os.tmpdir();
    const uniqueId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const wavFilePath = path.join(tempDir, `whisper_${uniqueId}.wav`);

    try {
      console.log(`🔊 [Whisper] Файл получен: ${file.originalFilename}, размер: ${file.size} байт`);
      console.log(`📁 [Whisper] Оригинальный файл: ${originalFilePath}`);
      console.log(`📁 [Whisper] WAV файл будет: ${wavFilePath}`);
      
      // Конвертируем файл в WAV формат
      console.log('🔄 [Whisper] Конвертация аудио в WAV формат...');
      await convertToWav(originalFilePath, wavFilePath);
      
      console.log(`⏳ [Whisper] Отправка WAV файла в OpenAI Whisper API...`);

      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(wavFilePath),
        model: 'whisper-1',
        language: 'ru',
      });

      console.log('✅ [Whisper] Транскрипция успешно получена:', transcription.text);

      // Удаляем временные файлы после обработки
      fs.unlink(originalFilePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('⚠️ [Whisper] Не удалось удалить оригинальный файл:', unlinkErr);
        }
      });
      
      fs.unlink(wavFilePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('⚠️ [Whisper] Не удалось удалить WAV файл:', unlinkErr);
        }
      });

      res.status(200).json({ transcript: transcription.text });
    } catch (error: any) {
      console.error('❌ [Whisper] Ошибка:', error.response ? error.response.data : error.message);
      
      // Попытка удалить файлы даже в случае ошибки
      fs.unlink(originalFilePath, (unlinkErr) => {
        if (unlinkErr) console.error('⚠️ [Whisper] Не удалось удалить оригинальный файл после ошибки:', unlinkErr);
      });
      
      fs.unlink(wavFilePath, (unlinkErr) => {
        if (unlinkErr) console.error('⚠️ [Whisper] Не удалось удалить WAV файл после ошибки:', unlinkErr);
      });
      
      res.status(500).json({ error: 'Ошибка транскрибации.', details: error.message });
    }
  });
}; 