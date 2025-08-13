import { Request, Response } from 'express';
import OpenAI from 'openai';
import formidable, { Fields, Files } from 'formidable';
import fs from 'fs';
import { toFile } from 'openai/uploads';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const transcribeAudio = async (req: Request, res: Response) => {
  console.log('🎤 [Whisper] Получен запрос на транскрибацию');

  const form = formidable({
    multiples: false,
    maxFileSize: 25 * 1024 * 1024, // 25MB
  });

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
    const originalFilePath = file.filepath as string;
    const originalName = (file as any).originalFilename || 'audio.webm';
    const mimeType = (file as any).mimetype || 'audio/webm';

    try {
      console.log(
        `🔊 [Whisper] Файл получен: ${originalName}, размер: ${file.size} байт, mime: ${mimeType}`
      );
      console.log(`📁 [Whisper] Оригинальный файл: ${originalFilePath}`);

      // Читаем файл в память и оборачиваем в совместимый FileLike для SDK
      const buffer = await fs.promises.readFile(originalFilePath);
      const fileForOpenAI = await toFile(buffer, originalName, { type: mimeType });

      console.log('⏳ [Whisper] Отправка файла в OpenAI Whisper API...');
      const transcription = await openai.audio.transcriptions.create({
        file: fileForOpenAI,
        model: 'whisper-1',
        language: 'ru',
      });

      console.log('✅ [Whisper] Транскрипция успешно получена');

      // Удаляем исходный временный файл после обработки
      fs.unlink(originalFilePath, unlinkErr => {
        if (unlinkErr) {
          console.error('⚠️ [Whisper] Не удалось удалить исходный файл:', unlinkErr);
        }
      });

      res.status(200).json({ transcript: transcription.text });
    } catch (error: any) {
      // Попытка удалить файл даже в случае ошибки
      fs.unlink(originalFilePath, unlinkErr => {
        if (unlinkErr) {
          console.error(
            '⚠️ [Whisper] Не удалось удалить исходный файл после ошибки:',
            unlinkErr
          );
        }
      });

      const details = error?.response?.data || error?.message || 'Unknown error';
      console.error('❌ [Whisper] Ошибка при транскрибации:', details);

      res.status(500).json({ error: 'Ошибка транскрибации.', details });
    }
  });
};
