import { Request, Response } from 'express';
import { chatMemory } from '../utils/memory/index.js';
import { generatePersonalizedSuggestions } from '../utils/suggestions/suggestionGenerator.js';

/**
 * Контроллер для генерации приветствия и персонализированных подсказок.
 * GET /welcome/:userId
 */
export const welcomeController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId || 'anonymous';

    // Получаем факты о пользователе (если есть)
    let userFacts: any[] = [];
    try {
      userFacts = await chatMemory.getUserFacts(userId);
    } catch (e) {
      console.error('⚠️ [WELCOME] Не удалось получить факты о пользователе:', e);
    }

    const isFirstInteraction = userFacts.length === 0;

    // Формируем приветствие
    let greeting = 'Привет! Я помогу разобраться с European Accessibility Act.';

    if (!isFirstInteraction) {
      const businessType = userFacts.find((f: any) => f.fact_type === 'business_type' && f.confidence > 0.6)?.fact_value;
      const businessLocation = userFacts.find((f: any) => f.fact_type === 'business_location' && f.confidence > 0.6)?.fact_value;
      const digitalPresence = userFacts.find((f: any) => f.fact_type === 'business_digital_presence' && f.confidence > 0.6)?.fact_value;
      const auditDone = userFacts.find((f: any) => f.fact_type === 'accessibility_audit_done' && f.confidence > 0.5)?.fact_value === 'true';

      // Конструируем динамическую фразу
      const parts: string[] = ['Привет'];

      if (businessType) {
        parts.push(`вижу, что вы представляете ${businessType}`);
      }
      if (businessLocation) {
        parts.push(`из ${businessLocation}`);
      }
      if (digitalPresence) {
        parts.push(`и у вас ${digitalPresence}`);
      }

      greeting = parts.join(' ') + '. ';
      greeting += auditDone
        ? 'Отлично, аудит доступности уже проведён — давайте обсудим дальнейшие шаги.'
        : 'Готов помочь с требованиями EAA и аудитом доступности.';
    }

    // Генерируем подсказки через ИИ-агента (максимум 3)
    const { clarificationQuestions } = await generatePersonalizedSuggestions(
      userFacts, 
      [], 
      isFirstInteraction,
      '',
      userId,
      userId // Используем полный userId как sessionId
    );
    const suggestions = clarificationQuestions.slice(0, 3);

    res.status(200).json({ greeting, suggestions });
  } catch (error) {
    console.error('❌ [WELCOME] Ошибка при генерации приветствия:', error);
    res.status(500).json({ greeting: 'Привет! Давайте поговорим о European Accessibility Act.', suggestions: [] });
  }
}; 