import { FrustrationProfile } from '../suggestion.types';
import { FrustrationAnalysis, ChatMessage } from '../../../types/database.types';
import OpenAI from 'openai';
import { extractJson } from '../../../utils/formatting/extractJson.js';

/**
 * 🤖 AI-POWERED FRUSTRATION ANALYZER
 * 
 * Uses GPT-4o-mini for deep psychological analysis:
 * - Emotional state detection
 * - Escalation risk prediction
 * - Sentiment analysis with context
 * - Adaptive communication strategy
 */
export class AIFrustrationAnalyzer {
  private openai: OpenAI;

  constructor(openai: OpenAI) {
    this.openai = openai;
  }

  async analyze(frustrationHistory: FrustrationAnalysis[], sessionMessages: ChatMessage[]): Promise<FrustrationProfile> {
    console.log(`🤖 [AI-FRUSTRATION] Starting AI emotional analysis of ${frustrationHistory.length} historical records and ${sessionMessages.length} messages`);

    try {
      // Prepare emotional data for AI analysis
      const emotionalData = this.prepareEmotionalDataForAI(frustrationHistory, sessionMessages);
      
      // Get AI frustration analysis
      const aiAnalysis = await this.getAIFrustrationAnalysis(emotionalData);
      
      // Parse AI response into structured profile
      const profile = this.parseAIFrustrationResponse(aiAnalysis);
      
      console.log(`🤖 [AI-FRUSTRATION] AI analysis complete: Level ${(profile.currentLevel * 100).toFixed(1)}%, Risk ${(profile.escalationRisk * 100).toFixed(1)}%`);
      return profile;

    } catch (error) {
      console.error('❌ [AI-FRUSTRATION] AI analysis failed, using fallback:', error);
      return this.fallbackFrustrationAnalysis(frustrationHistory, sessionMessages);
    }
  }

  private prepareEmotionalDataForAI(history: FrustrationAnalysis[], messages: ChatMessage[]): string {
    const userMessages = messages.filter(m => m.role === 'user');
    const recentMessages = userMessages.slice(-10);

    const emotionalProfile = {
      historicalContext: {
        totalAnalyses: history.length,
        recentTrend: history.slice(0, 3).map(h => ({
          level: h.frustration_level,
          escalationRisk: h.escalation_risk,
          triggers: h.trigger_phrases,
          timestamp: h.created_at,
          recommendation: h.recommendation
        })),
        averageHistoricalLevel: history.length > 0 ? 
          history.reduce((sum, h) => sum + h.frustration_level, 0) / history.length : 0
      },
      currentConversation: {
        totalMessages: userMessages.length,
        recentMessages: recentMessages.map(m => ({
          content: m.content,
          timestamp: m.created_at,
          length: m.content.length,
          hasQuestions: m.content.includes('?'),
          hasExclamations: m.content.includes('!')
        })),
        conversationLength: messages.length,
        timeSpan: messages.length > 1 ? {
          start: messages[0].created_at,
          end: messages[messages.length - 1].created_at
        } : null
      },
      linguisticPatterns: {
        averageMessageLength: userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length,
        questionDensity: userMessages.filter(m => m.content.includes('?')).length / userMessages.length,
        exclamationDensity: userMessages.filter(m => m.content.includes('!')).length / userMessages.length,
        capsUsage: this.calculateCapsUsage(userMessages),
        repetitivePatterns: this.detectRepetitivePatterns(userMessages)
      },
      contextualFactors: {
        topicComplexity: this.assessTopicComplexity(userMessages),
        technicalLevel: this.assessTechnicalLevel(userMessages),
        urgencyIndicators: this.detectUrgencyIndicators(userMessages),
        businessContext: this.detectBusinessContext(userMessages)
      }
    };

    return JSON.stringify(emotionalProfile, null, 2);
  }

  private async getAIFrustrationAnalysis(emotionalData: string): Promise<string> {
    const prompt = `
Ты - эксперт-психолог по анализу эмоционального состояния пользователей в системах поддержки.

Проанализируй эмоциональное состояние пользователя на основе его истории взаимодействий и текущих сообщений:

ЭМОЦИОНАЛЬНЫЕ ДАННЫЕ:
${emotionalData}

ЗАДАЧА: Определи текущий уровень фрустрации, риск эскалации и оптимальную стратегию общения.

КОНТЕКСТ: Пользователь обращается за помощью по European Accessibility Act (EAA) - это может быть стрессовой темой из-за юридических требований и технической сложности.

ФОРМАТ ОТВЕТА (строго JSON):
{
  "currentLevel": число_от_0_до_1,
  "escalationRisk": число_от_0_до_1,
  "triggers": ["список конкретных триггеров фрустрации"],
  "recommendedApproach": "gentle|direct|technical|business_focused",
  "psychologicalProfile": {
    "emotionalState": "описание текущего эмоционального состояния",
    "stressFactors": ["основные факторы стресса"],
    "copingStyle": "стиль совладания со стрессом",
    "communicationNeeds": "потребности в общении"
  },
  "escalationPrediction": {
    "timeToEscalation": "оценка времени до возможной эскалации",
    "escalationTriggers": ["что может вызвать эскалацию"],
    "preventionStrategy": "стратегия предотвращения эскалации"
  },
  "adaptiveStrategy": {
    "toneRecommendation": "рекомендуемый тон общения",
    "contentStyle": "стиль подачи информации",
    "responseLength": "рекомендуемая длина ответов",
    "supportLevel": "уровень поддержки (high|medium|low)"
  },
  "confidence": число_от_0_до_1
}

ВАЖНО:
- Учитывай культурные особенности и деловой контекст
- Анализируй не только слова, но и паттерны поведения
- Предсказывай будущее эмоциональное состояние
- Давай конкретные, actionable рекомендации
- Учитывай, что EAA - это юридическая тема, которая может вызывать тревогу
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2, // Lower temperature for more consistent emotional analysis
      max_tokens: 2500
    });

    return response.choices[0]?.message?.content || '{}';
  }

  private parseAIFrustrationResponse(aiResponse: string): FrustrationProfile {
    try {
      const jsonString = extractJson(aiResponse);
      const parsed = JSON.parse(jsonString);
      
      return {
        currentLevel: parsed.currentLevel || 0,
        triggers: parsed.triggers || [],
        escalationRisk: parsed.escalationRisk || 0,
        patterns: [],
        insights: parsed.psychologicalProfile,
        aiInsights: {
          ...parsed.adaptiveStrategy,
          ...parsed.escalationPrediction,
          confidence: parsed.confidence || 0.5,
          analysisTimestamp: new Date().toISOString(),
        },
      };

    } catch (error) {
      console.error('❌ [AI-FRUSTRATION] Failed to parse AI response:', error);
      return this.createFallbackProfile();
    }
  }

  private fallbackFrustrationAnalysis(history: FrustrationAnalysis[], messages: ChatMessage[]): FrustrationProfile {
    const latestHistory = history[0];
    const currentLevel = latestHistory?.frustration_level || 0.0;
    
    return {
      currentLevel: currentLevel,
      triggers: latestHistory?.trigger_phrases || [],
      escalationRisk: latestHistory?.escalation_risk || currentLevel * 0.8,
      patterns: []
    };
  }

  private createFallbackProfile(): FrustrationProfile {
    return {
      currentLevel: 0.3,
      triggers: ['unknown'],
      escalationRisk: 0.2,
      patterns: []
    };
  }

  // Helper methods for emotional data preparation
  private calculateCapsUsage(messages: ChatMessage[]): number {
    let totalChars = 0;
    let capsChars = 0;

    messages.forEach(message => {
      totalChars += message.content.length;
      capsChars += (message.content.match(/[A-Z]/g) || []).length;
    });

    return totalChars > 0 ? capsChars / totalChars : 0;
  }

  private detectRepetitivePatterns(messages: ChatMessage[]): string[] {
    const patterns: string[] = [];
    const phrases = new Map<string, number>();

    messages.forEach(message => {
      const words = message.content.toLowerCase().split(' ');
      
      // Look for repeated 2-3 word phrases
      for (let i = 0; i < words.length - 1; i++) {
        const phrase = words.slice(i, i + 2).join(' ');
        if (phrase.length > 5) { // Ignore very short phrases
          phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
        }
      }
    });

    // Find phrases repeated more than once
    phrases.forEach((count, phrase) => {
      if (count > 1) {
        patterns.push(phrase);
      }
    });

    return patterns.slice(0, 5); // Return top 5 repetitive patterns
  }

  private assessTopicComplexity(messages: ChatMessage[]): number {
    const complexityIndicators = [
      'compliance', 'regulation', 'legal', 'requirement', 'standard',
      'implementation', 'technical', 'specification', 'guideline'
    ];

    let complexityScore = 0;
    messages.forEach(message => {
      const content = message.content.toLowerCase();
      complexityIndicators.forEach(indicator => {
        if (content.includes(indicator)) {
          complexityScore++;
        }
      });
    });

    return Math.min(1.0, complexityScore / (messages.length * 2));
  }

  private assessTechnicalLevel(messages: ChatMessage[]): number {
    const technicalTerms = [
      'WCAG', 'API', 'HTML', 'CSS', 'JavaScript', 'accessibility',
      'screen reader', 'alt text', 'ARIA', 'semantic'
    ];

    let technicalCount = 0;
    messages.forEach(message => {
      const content = message.content.toLowerCase();
      technicalTerms.forEach(term => {
        if (content.includes(term.toLowerCase())) {
          technicalCount++;
        }
      });
    });

    return technicalCount / messages.length;
  }

  private detectUrgencyIndicators(messages: ChatMessage[]): string[] {
    const urgencyWords = [
      'urgent', 'asap', 'immediately', 'quickly', 'rush', 'deadline',
      'critical', 'emergency', 'priority', 'time sensitive'
    ];

    const foundIndicators: string[] = [];
    messages.forEach(message => {
      const content = message.content.toLowerCase();
      urgencyWords.forEach(word => {
        if (content.includes(word) && !foundIndicators.includes(word)) {
          foundIndicators.push(word);
        }
      });
    });

    return foundIndicators;
  }

  private detectBusinessContext(messages: ChatMessage[]): string[] {
    const businessTerms = [
      'business', 'company', 'organization', 'website', 'customers',
      'users', 'product', 'service', 'revenue', 'compliance cost'
    ];

    const foundTerms: string[] = [];
    messages.forEach(message => {
      const content = message.content.toLowerCase();
      businessTerms.forEach(term => {
        if (content.includes(term) && !foundTerms.includes(term)) {
          foundTerms.push(term);
        }
      });
    });

    return foundTerms;
  }
} 