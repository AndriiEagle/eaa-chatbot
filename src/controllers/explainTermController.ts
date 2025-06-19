import { Request, Response } from 'express';
import { termAnalysisAgent } from '../services/termAnalysisAgent.js';

/**
 * 🔍 КОНТРОЛЛЕР ДЛЯ ПРЯМОГО ОБЪЯСНЕНИЯ ТЕРМИНОВ
 * 
 * Обрабатывает запросы пользователей вида:
 * - "Что такое анализ пробелов?"
 * - "Объясни термин CE-маркировка"
 * - "Что означает WCAG?"
 */
export const explainTermController = async (req: Request, res: Response): Promise<void> => {
  console.log('\n🔍 [EXPLAIN_TERM] Получен запрос на объяснение термина');
  
  try {
    // Проверяем метод запроса
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed. Use POST instead.' });
      return;
    }

    // Получаем параметры запроса
    const { 
      term, 
      context = '', 
      session_id = null, 
      user_id = 'anonymous' 
    } = req.body;

    // Валидация входных данных
    if (!term || typeof term !== 'string' || term.trim().length === 0) {
      res.status(400).json({ 
        error: 'Параметр "term" обязателен и должен быть непустой строкой.' 
      });
      return;
    }

    const cleanTerm = term.trim();
    console.log(`🎯 [EXPLAIN_TERM] Объясняю термин: "${cleanTerm}"`);
    console.log(`👤 [EXPLAIN_TERM] User: ${user_id} | Session: ${session_id || 'new'}`);
    
    if (context) {
      console.log(`📝 [EXPLAIN_TERM] Контекст: "${context.substring(0, 100)}..."`);
    }

    // Запускаем таймер для измерения производительности
    const startTime = performance.now();

    // Получаем объяснение термина от ИИ-агента
    const explanation = await termAnalysisAgent.explainTerm(cleanTerm, context);
    
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    console.log(`✅ [EXPLAIN_TERM] Объяснение сгенерировано за ${responseTime}ms`);
    console.log(`📄 [EXPLAIN_TERM] Длина объяснения: ${explanation.length} символов`);

    // Формируем ответ
    const response = {
      term: cleanTerm,
      explanation,
      context: context || null,
      performance: {
        response_time_ms: responseTime
      },
      session_id: session_id || 'no-session',
      user_id,
      timestamp: new Date().toISOString()
    };

    // Отправляем результат
    res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ [EXPLAIN_TERM] Ошибка при объяснении термина:', error);
    
    // Формируем ответ об ошибке
    const errorResponse = {
      error: 'Произошла ошибка при объяснении термина',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      term: req.body?.term || 'unknown',
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(errorResponse);
  }
}; 