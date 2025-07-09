import { FrustrationDetectionAgent } from './frustrationDetectionAgent.js';
import { EmailComposerAgent } from './emailComposerAgent.js';
import { chatMemory } from '../utils/memory/index.js';
import { logger } from '../utils/logger.js';

/**
 * 🎯 FRUSTRATION SERVICE
 * 
 * Handles frustration detection and escalation.
 * Single responsibility: User frustration management.
 */
export class FrustrationService {
  private frustrationAgent: FrustrationDetectionAgent;
  private emailComposer: EmailComposerAgent;

  constructor() {
    this.frustrationAgent = new FrustrationDetectionAgent();
    this.emailComposer = new EmailComposerAgent();
  }

  async analyzeAndHandle(userId: string, sessionId: string, question: string, answer: string): Promise<string | null> {
    logger.info('Analyzing frustration', { userId, sessionId });

    try {
      // Получение контекста с улучшенным логированием
      console.log(`📚 [FrustrationAgent] Loading context for session ${sessionId}`);
      const sessionMessages = await chatMemory.getSessionMessages(sessionId);
      console.log(`📚 [FrustrationAgent] Loaded ${sessionMessages.length} recent messages`);

      // Убеждаемся, что контекст не пустой
      if (sessionMessages.length === 0) {
        console.log(`⚠️ [FrustrationAgent] No recent messages found, this might be first message in session`);
      }

      const contextSummary = sessionMessages.map(msg => `${msg.role}: ${msg.content.substring(0, 50)}...`).join('; ');
      console.log(`📝 [FrustrationAgent] Context summary: ${contextSummary}`);
      
      // Call with correct signature: (currentMessage, recentMessages, sessionId, userId)
      const frustrationResult = await this.frustrationAgent.analyzeFrustration(
        question, 
        sessionMessages as any[], 
        sessionId, 
        userId
      );
      
      if (frustrationResult.shouldEscalate) {
        return await this.handleEscalation(userId, sessionId, question, answer, frustrationResult);
      }
      
      return null; // No escalation needed
    } catch (error) {
      logger.error('Error in frustration analysis', { error, userId, sessionId });
      return null;
    }
  }

  private async handleEscalation(
    userId: string, 
    sessionId: string, 
    question: string, 
    answer: string, 
    frustrationResult: any
  ): Promise<string> {
    logger.warn('High frustration detected - escalating', { 
      userId, 
      sessionId, 
      frustrationLevel: frustrationResult.frustrationLevel 
    });
    
    try {
      // Get user context for email
      const [userFacts, recentMessages] = await Promise.all([
        chatMemory.getUserFacts(userId),
        chatMemory.getSessionMessages(sessionId)
      ]);
      
      // Use the correct generateEmail method with proper context
      const emailDraft = await this.emailComposer.generateEmail({
        userId,
        sessionId,
        frustrationAnalysis: frustrationResult,
        userFacts: userFacts as any[],
        recentMessages: recentMessages as any[]
      });

      logger.info('Frustration escalation email generated successfully', { 
        userId, 
        sessionId,
        subject: emailDraft.subject 
      });

      // 🎯 RETURN NOTIFICATION MESSAGE FOR USER
      return `
🚨 **Ваш вопрос передан менеджеру!**

Мы заметили, что у вас возникли трудности с получением нужной информации. Ваш запрос был автоматически передан нашему менеджеру по работе с клиентами.

📧 **Что происходит сейчас:**
• Менеджер получил подробную информацию о вашем вопросе
• В ближайшее время с вами свяжется специалист
• Вы получите персональную помощь по вашему вопросу

⏰ **Время ответа:** обычно 2-4 часа в рабочее время

А пока я продолжу отвечать на ваши вопросы!
      `.trim();
      
    } catch (error) {
      logger.error('Error in frustration escalation', { error, userId, sessionId });
      return `
🚨 **Ваш вопрос передан менеджеру!**

Мы заметили сложности с получением нужной информации и передали ваш запрос менеджеру. Скоро с вами свяжется специалист для персональной помощи.
      `.trim();
    }
  }
} 