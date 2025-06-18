import { Router } from 'express';
import { askController, healthController, configController, welcomeController } from '../controllers/index.js';
import { transcribeAudio } from '../controllers/whisperController.js';
import { analyzeTextProactively } from '../controllers/proactiveAgentController.js';
import { generateAISuggestions } from '../controllers/aiSuggestionsController.js';
import { chatMemory } from '../utils/memory/index.js';
import { RequestHandler, Request, Response } from 'express';
import { explainTermController } from '../controllers/explainTermController.js';

const router = Router();

// Основные маршруты
router.get('/health', healthController as RequestHandler);
router.get('/config', configController as RequestHandler);
router.post('/ask', askController as RequestHandler);

// Маршрут для приветственного сообщения с подсказками
router.get('/welcome/:userId', welcomeController as RequestHandler);

// Маршрут для Whisper
router.post('/whisper/transcribe', transcribeAudio as RequestHandler);

// Маршрут для проактивного агента
router.post('/agent/proactive-analysis', analyzeTextProactively as RequestHandler);

// Маршрут для ИИ-генерации подсказок
router.post('/agent/ai-suggestions', generateAISuggestions as RequestHandler);

// Добавляем новый endpoint для объяснения терминов
router.post('/explain-term', explainTermController);

// Маршруты для работы с сессиями
router.get('/chat/sessions/:userId', async (req: Request, res: Response) => {
  try {
    const sessions = await chatMemory.getUserSessions(req.params.userId);
    res.status(200).json({ sessions });
  } catch (error) {
    console.error('❌ Error getting user sessions:', error);
    res.status(500).json({ error: 'Ошибка при получении сессий пользователя' });
  }
});

router.get('/chat/messages/:sessionId', async (req: Request, res: Response) => {
  try {
    const messages = await chatMemory.getSessionMessages(req.params.sessionId);
    res.status(200).json({ messages });
  } catch (error) {
    console.error('❌ Error getting session messages:', error);
    res.status(500).json({ error: 'Ошибка при получении сообщений сессии' });
  }
});

router.delete('/chat/sessions/:sessionId', async (req: Request, res: Response) => {
    try {
      await chatMemory.deleteSession(req.params.sessionId);
      res.status(200).json({ success: true, message: 'Сессия успешно удалена' });
    } catch (error) {
      console.error('❌ Error deleting session:', error);
      res.status(500).json({ error: 'Ошибка при удалении сессии' });
    }
});

export default router; 