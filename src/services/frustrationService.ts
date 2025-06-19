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

  async analyzeAndHandle(userId: string, sessionId: string, question: string, answer: string): Promise<void> {
    logger.info('Analyzing frustration', { userId, sessionId });

    try {
      // Get recent messages for context
      const sessionMessages = await chatMemory.getSessionMessages(sessionId);
      
      // Call with correct signature: (currentMessage, recentMessages, sessionId, userId)
      const frustrationResult = await this.frustrationAgent.analyzeFrustration(
        question, 
        sessionMessages as any[], 
        sessionId, 
        userId
      );
      
      if (frustrationResult.shouldEscalate) {
        await this.handleEscalation(userId, sessionId, question, answer, frustrationResult);
      }
    } catch (error) {
      logger.error('Error in frustration analysis', { error, userId, sessionId });
    }
  }

  private async handleEscalation(
    userId: string, 
    sessionId: string, 
    question: string, 
    answer: string, 
    frustrationResult: any
  ): Promise<void> {
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
      
    } catch (error) {
      logger.error('Error in frustration escalation', { error, userId, sessionId });
    }
  }
} 