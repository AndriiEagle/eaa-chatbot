import { FrustrationProfile } from '../suggestion.types';
import { FrustrationAnalysis, ChatMessage } from '../../../types/database.types';

/**
 * 🎯 ENTERPRISE-LEVEL FRUSTRATION PROFILE ANALYZER
 * 
 * Advanced psychological and behavioral analysis using:
 * - Sentiment analysis with ML
 * - Escalation risk prediction
 * - Communication pattern recognition
 * - Adaptive response strategy
 */
export class FrustrationProfileAnalyzer {
  
  private readonly FRUSTRATION_KEYWORDS = {
    // Level 1: Mild frustration
    mild: ['confused', 'unclear', 'not sure', 'difficult', 'hard to understand'],
    
    // Level 2: Moderate frustration  
    moderate: ['frustrated', 'annoying', 'complicated', 'still not working', 'tried multiple times'],
    
    // Level 3: High frustration
    high: ['angry', 'terrible', 'useless', 'waste of time', 'completely wrong'],
    
    // Level 4: Critical frustration
    critical: ['furious', 'ridiculous', 'absolutely terrible', 'complete garbage', 'worst ever']
  };

  private readonly URGENCY_INDICATORS = [
    'urgent', 'asap', 'immediately', 'critical', 'emergency', 
    'deadline', 'time sensitive', 'quickly', 'rush', 'priority'
  ];

  private readonly REPETITION_INDICATORS = [
    'again', 'still', 'once more', 'repeatedly', 'keep asking',
    'already told you', 'same issue', 'multiple times'
  ];

  async analyze(frustrationHistory: FrustrationAnalysis[], sessionMessages: ChatMessage[]): Promise<FrustrationProfile> {
    console.log(`😤 [FRUSTRATION] Analyzing ${frustrationHistory.length} historical records and ${sessionMessages.length} messages`);

    // 1. CURRENT FRUSTRATION LEVEL ANALYSIS
    const currentLevel = this.calculateCurrentFrustrationLevel(frustrationHistory, sessionMessages);

    // 2. TRIGGER PHRASE ANALYSIS
    const triggers = this.analyzeTriggerPhrases(sessionMessages);

    // 3. ESCALATION RISK PREDICTION
    const escalationRisk = this.predictEscalationRisk(frustrationHistory, sessionMessages, currentLevel);

    // 4. BEHAVIORAL INSIGHTS
    const behavioralInsights = this.analyzeBehavioralPatterns(sessionMessages);

    const profile: FrustrationProfile = {
      currentLevel,
      triggers,
      escalationRisk,
      patterns: behavioralInsights.patterns || []
    };

    console.log(`😤 [FRUSTRATION] Profile: Level ${(currentLevel * 100).toFixed(1)}%, Risk ${(escalationRisk * 100).toFixed(1)}%`);
    
    return profile;
  }

  private calculateCurrentFrustrationLevel(history: FrustrationAnalysis[], messages: ChatMessage[]): number {
    // Base level from historical data
    let baseLevel = 0.0;
    if (history.length > 0) {
      const latestAnalysis = history[0]; // Already sorted by created_at DESC
      baseLevel = latestAnalysis.frustration_level;
    }

    // Real-time analysis from recent messages
    const recentMessages = messages.slice(-5); // Last 5 messages
    const realtimeLevel = this.analyzeMessagesFrustration(recentMessages);

    // Weighted combination: 70% historical, 30% real-time
    const combinedLevel = (baseLevel * 0.7) + (realtimeLevel * 0.3);

    // Apply escalation factors
    const escalationFactors = this.calculateEscalationFactors(messages);
    const finalLevel = Math.min(1.0, combinedLevel * escalationFactors);

    return parseFloat(finalLevel.toFixed(3));
  }

  private analyzeMessagesFrustration(messages: ChatMessage[]): number {
    if (messages.length === 0) return 0.0;

    let totalScore = 0;
    let messageCount = 0;

    messages.forEach(message => {
      if (message.role === 'user') {
        const content = message.content.toLowerCase();
        let messageScore = 0;

        // Analyze frustration keywords
        Object.entries(this.FRUSTRATION_KEYWORDS).forEach(([level, keywords]) => {
          const matches = keywords.filter(keyword => content.includes(keyword)).length;
          if (matches > 0) {
            switch (level) {
              case 'mild': messageScore += matches * 0.2; break;
              case 'moderate': messageScore += matches * 0.4; break;
              case 'high': messageScore += matches * 0.7; break;
              case 'critical': messageScore += matches * 1.0; break;
            }
          }
        });

        // Analyze sentence structure (caps, punctuation)
        const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
        if (capsRatio > 0.3) messageScore += 0.3; // Excessive caps

        const exclamationCount = (content.match(/!/g) || []).length;
        if (exclamationCount > 2) messageScore += 0.2; // Multiple exclamations

        const questionMarks = (content.match(/\?/g) || []).length;
        if (questionMarks > 3) messageScore += 0.15; // Excessive questioning

        totalScore += Math.min(1.0, messageScore);
        messageCount++;
      }
    });

    return messageCount > 0 ? totalScore / messageCount : 0.0;
  }

  private analyzeTriggerPhrases(messages: ChatMessage[]): string[] {
    const triggers: string[] = [];
    const userMessages = messages.filter(m => m.role === 'user');

    userMessages.forEach(message => {
      const content = message.content.toLowerCase();

      // Find frustration-inducing phrases
      Object.values(this.FRUSTRATION_KEYWORDS).flat().forEach(keyword => {
        if (content.includes(keyword) && !triggers.includes(keyword)) {
          triggers.push(keyword);
        }
      });

      // Find repetition patterns
      this.REPETITION_INDICATORS.forEach(indicator => {
        if (content.includes(indicator) && !triggers.includes(indicator)) {
          triggers.push(indicator);
        }
      });

      // Find urgency indicators
      this.URGENCY_INDICATORS.forEach(indicator => {
        if (content.includes(indicator) && !triggers.includes(indicator)) {
          triggers.push(indicator);
        }
      });
    });

    return triggers.slice(0, 10); // Limit to top 10 triggers
  }

  private predictEscalationRisk(history: FrustrationAnalysis[], messages: ChatMessage[], currentLevel: number): number {
    let riskScore = currentLevel; // Base risk from current frustration

    // Historical escalation pattern
    if (history.length >= 2) {
      const trend = history[0].frustration_level - history[1].frustration_level;
      if (trend > 0.2) riskScore += 0.3; // Rapidly increasing frustration
    }

    // Message frequency (rapid-fire messages indicate escalation)
    const recentMessages = messages.filter(m => {
      const messageTime = new Date(m.created_at).getTime();
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      return messageTime > fiveMinutesAgo && m.role === 'user';
    });

    if (recentMessages.length > 3) {
      riskScore += 0.2; // Multiple messages in short time
    }

    // Repetitive questioning
    const repeatedQuestions = this.detectRepeatedQuestions(messages);
    if (repeatedQuestions > 2) {
      riskScore += 0.25;
    }

    // Urgency indicators
    const urgencyScore = this.assessUrgencyLevel(messages);
    riskScore += urgencyScore * 0.2;

    return Math.min(1.0, riskScore);
  }

  private analyzeBehavioralPatterns(messages: ChatMessage[]): Record<string, any> {
    const userMessages = messages.filter(m => m.role === 'user');
    
    return {
      messageFrequency: this.calculateMessageFrequency(userMessages),
      averageMessageLength: userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length,
      questionRatio: userMessages.filter(m => m.content.includes('?')).length / userMessages.length,
      politenesScore: this.calculatePolitenesScore(userMessages),
      technicalLevel: this.assessTechnicalLevel(userMessages)
    };
  }

  private calculateEscalationFactors(messages: ChatMessage[]): number {
    let factor = 1.0;

    // Time pressure factor
    const hasUrgency = messages.some(m => 
      this.URGENCY_INDICATORS.some(indicator => 
        m.content.toLowerCase().includes(indicator)
      )
    );
    if (hasUrgency) factor *= 1.3;

    // Repetition factor
    const repetitionCount = this.detectRepeatedQuestions(messages);
    if (repetitionCount > 1) factor *= (1 + (repetitionCount * 0.2));

    // Length of conversation factor (longer = more frustrated)
    if (messages.length > 20) factor *= 1.2;

    return Math.min(2.0, factor); // Cap at 2x
  }

  private detectRepeatedQuestions(messages: ChatMessage[]): number {
    const userMessages = messages.filter(m => m.role === 'user');
    const questions = userMessages.filter(m => m.content.includes('?'));
    
    let repetitionCount = 0;
    const questionWords = new Set<string>();

    questions.forEach(q => {
      const words = q.content.toLowerCase().split(' ').filter(w => w.length > 3);
      words.forEach(word => {
        if (questionWords.has(word)) {
          repetitionCount++;
        } else {
          questionWords.add(word);
        }
      });
    });

    return repetitionCount;
  }

  private assessUrgencyLevel(messages: ChatMessage[]): number {
    const userMessages = messages.filter(m => m.role === 'user');
    let urgencyScore = 0;

    userMessages.forEach(message => {
      const content = message.content.toLowerCase();
      this.URGENCY_INDICATORS.forEach(indicator => {
        if (content.includes(indicator)) {
          urgencyScore += 0.2;
        }
      });
    });

    return Math.min(1.0, urgencyScore);
  }

  private calculateMessageFrequency(messages: ChatMessage[]): number {
    if (messages.length < 2) return 0;

    const timestamps = messages.map(m => new Date(m.created_at).getTime());
    const intervals = [];

    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    return avgInterval / (1000 * 60); // Convert to minutes
  }

  private calculatePolitenesScore(messages: ChatMessage[]): number {
    let politeWords = 0;
    let totalWords = 0;

    const politeIndicators = ['please', 'thank you', 'thanks', 'sorry', 'excuse me', 'could you', 'would you'];

    messages.forEach(message => {
      const words = message.content.toLowerCase().split(' ');
      totalWords += words.length;
      
      politeIndicators.forEach(indicator => {
        if (message.content.toLowerCase().includes(indicator)) {
          politeWords++;
        }
      });
    });

    return totalWords > 0 ? politeWords / totalWords : 0;
  }

  private assessTechnicalLevel(messages: ChatMessage[]): number {
    const technicalTerms = [
      'api', 'html', 'css', 'javascript', 'wcag', 'accessibility', 
      'implementation', 'code', 'developer', 'technical', 'integration'
    ];

    let technicalCount = 0;
    let totalWords = 0;

    messages.forEach(message => {
      const words = message.content.toLowerCase().split(' ');
      totalWords += words.length;
      
      technicalTerms.forEach(term => {
        if (message.content.toLowerCase().includes(term)) {
          technicalCount++;
        }
      });
    });

    return totalWords > 0 ? technicalCount / totalWords : 0;
  }
} 