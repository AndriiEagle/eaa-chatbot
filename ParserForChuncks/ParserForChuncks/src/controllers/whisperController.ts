import { Request, Response } from 'express';
import OpenAI from 'openai';
import formidable, { Fields, Files } from 'formidable';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const transcribeAudio = async (req: Request, res: Response) => {
  console.log('🎤 [Whisper] Получен запрос на транскрибацию');

  const form = formidable({});

  form.parse(req, async (err: Error | null, fields: Fields, files: Files) => {
    if (err) {
      console.error('❌ [Whisper] Ошибка при парсинге формы:', err);
      return res
        .status(500)
        .json({ error: 'Ошибка обработки файла.', details: err.message });
    }

    const audioFile = files.audio;

    if (!audioFile || !Array.isArray(audioFile) || audioFile.length === 0) {
      return res.status(400).json({ error: 'Аудиофайл не найден в запросе.' });
    }

    const file = audioFile[0];
    const originalFilePath = file.filepath;

    try {
      console.log(
        `🔊 [Whisper] Файл получен: ${file.originalFilename}, размер: ${file.size} байт`
      );
      console.log(`📁 [Whisper] Оригинальный файл: ${originalFilePath}`);

      // Отправляем исходный файл напрямую в Whisper (поддерживает webm/ogg/mp3/wav/mp4 и др.)
      console.log('⏳ [Whisper] Отправка файла в OpenAI Whisper API...');
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(originalFilePath),
        model: 'whisper-1',
        language: 'ru',
      });

      console.log(
        '✅ [Whisper] Транскрипция успешно получена:',
        transcription.text
      );

      // Удаляем исходный временный файл после обработки
      fs.unlink(originalFilePath, unlinkErr => {
        if (unlinkErr) {
          console.error('⚠️ [Whisper] Не удалось удалить исходный файл:', unlinkErr);
        }
      });

      res.status(200).json({ transcript: transcription.text });
    } catch (error: any) {
      console.error(
        '❌ [Whisper] Ошибка:',
        error?.response ? error.response.data : error?.message
      );

      // Попытка удалить файл даже в случае ошибки
      fs.unlink(originalFilePath, unlinkErr => {
        if (unlinkErr) {
          console.error(
            '⚠️ [Whisper] Не удалось удалить исходный файл после ошибки:',
            unlinkErr
          );
        }
      });

      res
        .status(500)
        .json({ error: 'Ошибка транскрибации.', details: error?.message });
    }
  });
};
