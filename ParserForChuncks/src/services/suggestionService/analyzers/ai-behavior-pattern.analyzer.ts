import { BehaviorPattern } from '../suggestion.types';
import { ChatSession, ChatMessage } from '../../../types/database.types';
import OpenAI from 'openai';
import { extractJson } from '../../../utils/formatting/extractJson.js';

/**
 * 🤖 REAL AI-POWERED BEHAVIOR PATTERN ANALYZER
 *
 * Uses GPT-4o-mini for advanced behavioral analysis:
 * - Deep psychological profiling
 * - Learning pattern recognition
 * - Communication style analysis
 * - Predictive behavior modeling
 */
export class AIBehaviorPatternAnalyzer {
  private openai: OpenAI;

  constructor(openai: OpenAI) {
    this.openai = openai;
  }

  async analyze(
    userSessions: ChatSession[],
    sessionMessages: ChatMessage[]
  ): Promise<BehaviorPattern[]> {
    console.log(
      `🤖 [AI-BEHAVIOR] Starting AI analysis of ${userSessions.length} sessions and ${sessionMessages.length} messages`
    );

    try {
      // Prepare data for AI analysis
      const behaviorData = this.prepareDataForAI(userSessions, sessionMessages);

      // Get AI analysis
      const aiAnalysis = await this.getAIBehaviorAnalysis(behaviorData);

      // Convert AI response to structured patterns
      const patterns = this.parseAIResponse(aiAnalysis);

      console.log(
        `🤖 [AI-BEHAVIOR] AI detected ${patterns.length} sophisticated behavior patterns`
      );
      return patterns;
    } catch (error) {
      console.error(
        '❌ [AI-BEHAVIOR] AI analysis failed, falling back to basic analysis:',
        error
      );
      return this.fallbackAnalysis(userSessions, sessionMessages);
    }
  }

  private prepareDataForAI(
    sessions: ChatSession[],
    messages: ChatMessage[]
  ): string {
    const userMessages = messages.filter(m => m.role === 'user');

    // Create comprehensive behavior profile for AI
    const profile = {
      sessionMetrics: {
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => s.is_active).length,
        sessionDuration: this.calculateAverageSessionDuration(
          sessions,
          messages
        ),
        sessionFrequency: this.calculateSessionFrequency(sessions),
      },
      communicationMetrics: {
        totalMessages: userMessages.length,
        averageMessageLength:
          userMessages.reduce((sum, m) => sum + m.content.length, 0) /
          userMessages.length,
        questionRatio:
          userMessages.filter(m => m.content.includes('?')).length /
          userMessages.length,
        exclamationRatio:
          userMessages.filter(m => m.content.includes('!')).length /
          userMessages.length,
      },
      contentAnalysis: {
        technicalTermsUsage: this.calculateTechnicalTermsUsage(userMessages),
        urgencyIndicators: this.calculateUrgencyIndicators(userMessages),
        politenesLevel: this.calculatePolitenesLevel(userMessages),
        emotionalTone: this.calculateEmotionalTone(userMessages),
      },
      temporalPatterns: {
        messageTimestamps: messages.slice(-10).map(m => m.created_at),
        conversationFlow: this.analyzeConversationFlow(messages.slice(-20)),
      },
      recentMessages: userMessages.slice(-5).map(m => ({
        content: m.content.substring(0, 200), // Limit for AI context
        timestamp: m.created_at,
        length: m.content.length,
      })),
    };

    return JSON.stringify(profile, null, 2);
  }

  private async getAIBehaviorAnalysis(behaviorData: string): Promise<string> {
    const prompt = `
Ты - эксперт по анализу поведения пользователей в системах поддержки клиентов. 

Проанализируй данные поведения пользователя и определи ключевые поведенческие паттерны:

ДАННЫЕ ПОЛЬЗОВАТЕЛЯ:
${behaviorData}

ЗАДАЧА: Определи 3-5 наиболее значимых поведенческих паттернов и дай конкретные рекомендации.

ФОРМАТ ОТВЕТА (строго JSON):
{
  "patterns": [
    {
      "pattern": "название_паттерна",
      "frequency": число_от_1_до_100,
      "impact": "positive|negative|neutral",
      "recommendation": "конкретная рекомендация для этого паттерна",
      "confidence": число_от_0_до_1,
      "insights": "глубокий психологический инсайт"
    }
  ],
  "overallProfile": {
    "userType": "тип пользователя (например: technical_expert, business_owner, frustrated_beginner)",
    "communicationStyle": "стиль общения",
    "learningApproach": "подход к обучению",
    "supportNeeds": "потребности в поддержке"
  },
  "predictiveInsights": {
    "likelyNextActions": ["список вероятных следующих действий"],
    "escalationRisk": число_от_0_до_1,
    "satisfactionPrediction": число_от_0_до_1
  }
}

ВАЖНО: 
- Анализируй глубокие психологические паттерны, не поверхностные метрики
- Учитывай контекст EAA (European Accessibility Act) - это система помощи по доступности
- Давай actionable рекомендации, не общие фразы
- Используй данные о временных паттернах для предсказания поведения
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || '{}';
  }

  private parseAIResponse(aiResponse: string): BehaviorPattern[] {
    try {
      const jsonString = extractJson(aiResponse);
      const parsed = JSON.parse(jsonString);

      if (!parsed.patterns || !Array.isArray(parsed.patterns)) {
        console.warn(
          '[AI-BEHAVIOR] AI response is missing "patterns" array. Returning empty.',
          parsed
        );
        return [];
      }

      return parsed.patterns.map((pattern: any) => ({
        type: pattern.pattern || 'unknown_pattern',
        frequency: pattern.frequency || 1,
        context: pattern.impact || 'neutral',
        significance: pattern.confidence || 0.5,
        aiInsights: {
          confidence: pattern.confidence || 0.5,
          psychologicalInsight: pattern.insights || '',
          userType: parsed.overallProfile?.userType || 'unknown',
          communicationStyle:
            parsed.overallProfile?.communicationStyle || 'unknown',
          escalationRisk: parsed.predictiveInsights?.escalationRisk || 0,
          satisfactionPrediction:
            parsed.predictiveInsights?.satisfactionPrediction || 0.5,
        },
      }));
    } catch (error) {
      console.error('❌ [AI-BEHAVIOR] Failed to parse AI response:', error);
      return [];
    }
  }

  private fallbackAnalysis(
    sessions: ChatSession[],
    messages: ChatMessage[]
  ): BehaviorPattern[] {
    // Simple fallback when AI fails
    const patterns: BehaviorPattern[] = [];

    if (sessions.length > 3) {
      patterns.push({
        type: 'frequent_user',
        frequency: sessions.length,
        context: `User has ${sessions.length} sessions`,
        significance: 0.6,
      });
    }

    const userMessages = messages.filter(m => m.role === 'user');
    const avgLength =
      userMessages.reduce((sum, m) => sum + m.content.length, 0) /
      userMessages.length;

    if (avgLength > 100) {
      patterns.push({
        type: 'detailed_communicator',
        frequency: userMessages.length,
        context: `User sent ${userMessages.length} messages`,
        significance: 0.5,
      });
    }

    return patterns;
  }

  // Helper methods for data preparation
  private calculateAverageSessionDuration(
    sessions: ChatSession[],
    messages: ChatMessage[]
  ): number {
    if (sessions.length === 0) return 0;

    const durations = sessions.map(session => {
      const sessionMessages = messages.filter(m => m.session_id === session.id);
      if (sessionMessages.length < 2) return 0;

      const firstMessage = sessionMessages[0];
      const lastMessage = sessionMessages[sessionMessages.length - 1];

      return (
        new Date(lastMessage.created_at).getTime() -
        new Date(firstMessage.created_at).getTime()
      );
    });

    const avgDuration =
      durations.reduce((sum, d) => sum + d, 0) / durations.length;
    return avgDuration / (1000 * 60); // Convert to minutes
  }

  private calculateSessionFrequency(sessions: ChatSession[]): number {
    if (sessions.length < 2) return 0;

    const sortedSessions = sessions.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const intervals = [];
    for (let i = 1; i < sortedSessions.length; i++) {
      const interval =
        new Date(sortedSessions[i].created_at).getTime() -
        new Date(sortedSessions[i - 1].created_at).getTime();
      intervals.push(interval / (1000 * 60 * 60 * 24)); // Convert to days
    }

    return (
      intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
    );
  }

  private calculateTechnicalTermsUsage(messages: ChatMessage[]): number {
    const technicalTerms = [
      'WCAG',
      'API',
      'HTML',
      'CSS',
      'JavaScript',
      'accessibility',
      'compliance',
      'implementation',
    ];
    let technicalCount = 0;
    let totalWords = 0;

    messages.forEach(message => {
      const words = message.content.toLowerCase().split(' ');
      totalWords += words.length;

      technicalTerms.forEach(term => {
        if (message.content.toLowerCase().includes(term.toLowerCase())) {
          technicalCount++;
        }
      });
    });

    return totalWords > 0 ? technicalCount / totalWords : 0;
  }

  private calculateUrgencyIndicators(messages: ChatMessage[]): number {
    const urgencyWords = [
      'urgent',
      'asap',
      'immediately',
      'quickly',
      'rush',
      'deadline',
    ];
    let urgencyCount = 0;

    messages.forEach(message => {
      urgencyWords.forEach(word => {
        if (message.content.toLowerCase().includes(word)) {
          urgencyCount++;
        }
      });
    });

    return urgencyCount / messages.length;
  }

  private calculatePolitenesLevel(messages: ChatMessage[]): number {
    const politeWords = ['please', 'thank you', 'thanks', 'sorry', 'excuse me'];
    let politeCount = 0;

    messages.forEach(message => {
      politeWords.forEach(word => {
        if (message.content.toLowerCase().includes(word)) {
          politeCount++;
        }
      });
    });

    return politeCount / messages.length;
  }

  private calculateEmotionalTone(messages: ChatMessage[]): number {
    const emotionalWords = [
      'frustrated',
      'angry',
      'confused',
      'happy',
      'satisfied',
      'worried',
    ];
    let emotionalCount = 0;

    messages.forEach(message => {
      emotionalWords.forEach(word => {
        if (message.content.toLowerCase().includes(word)) {
          emotionalCount++;
        }
      });
    });

    return emotionalCount / messages.length;
  }

  private analyzeConversationFlow(messages: ChatMessage[]): string[] {
    return messages.map(m => `${m.role}: ${m.content.substring(0, 50)}...`);
  }
}
