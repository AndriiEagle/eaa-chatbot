import { BehaviorPattern } from '../suggestion.types';
import { ChatSession, ChatMessage } from '../../../types/database.types';

/**
 * 🎯 ENTERPRISE-LEVEL BEHAVIOR PATTERN ANALYZER
 * 
 * Advanced behavioral analytics using:
 * - Temporal analysis
 * - Communication pattern detection
 * - Learning curve analysis
 * - Engagement scoring
 */
export class BehaviorPatternAnalyzer {
  
  async analyze(userSessions: ChatSession[], sessionMessages: ChatMessage[]): Promise<BehaviorPattern[]> {
    const patterns: BehaviorPattern[] = [];

    // 1. TEMPORAL BEHAVIOR ANALYSIS
    const temporalPatterns = this.analyzeTemporalBehavior(userSessions);
    patterns.push(...temporalPatterns);

    // 2. COMMUNICATION STYLE ANALYSIS
    const communicationPatterns = this.analyzeCommunicationStyle(sessionMessages);
    patterns.push(...communicationPatterns);

    // 3. LEARNING PROGRESSION ANALYSIS
    const learningPatterns = this.analyzeLearningProgression(sessionMessages);
    patterns.push(...learningPatterns);

    // 4. ENGAGEMENT PATTERN ANALYSIS
    const engagementPatterns = this.analyzeEngagementPatterns(userSessions, sessionMessages);
    patterns.push(...engagementPatterns);

    // 5. PROBLEM-SOLVING BEHAVIOR
    const problemSolvingPatterns = this.analyzeProblemSolvingBehavior(sessionMessages);
    patterns.push(...problemSolvingPatterns);

    console.log(`🔄 [BEHAVIOR] Detected ${patterns.length} behavior patterns`);
    return patterns;
  }

  private analyzeTemporalBehavior(sessions: ChatSession[]): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = [];

    if (sessions.length === 0) return patterns;

    // Sort sessions by creation date
    const sortedSessions = sessions.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Calculate session intervals
    const intervals: number[] = [];
    for (let i = 1; i < sortedSessions.length; i++) {
      const interval = new Date(sortedSessions[i].created_at).getTime() - 
                      new Date(sortedSessions[i-1].created_at).getTime();
      intervals.push(interval / (1000 * 60 * 60 * 24)); // Convert to days
    }

    // Frequency analysis
    if (sessions.length >= 5) {
      const avgInterval = intervals.reduce((sum, int) => sum + int, 0) / intervals.length;
      
      if (avgInterval < 1) {
        patterns.push({
          type: 'intensive_user',
          frequency: sessions.length,
          context: 'High message volume indicates deep engagement',
          significance: 0.8
        });
      } else if (avgInterval < 7) {
        patterns.push({
          type: 'regular_user',
          frequency: sessions.length,
          context: 'Moderate engagement level',
          significance: 0.6
        });
      } else {
        patterns.push({
          type: 'sporadic_user',
          frequency: sessions.length,
          context: 'Light engagement, may need more guidance',
          significance: 0.4
        });
      }
    }

    // Session duration analysis
    const activeSessions = sessions.filter(s => s.is_active);
    if (activeSessions.length > 1) {
      patterns.push({
        type: 'multi_session_user',
        frequency: activeSessions.length,
        context: 'Returns across multiple sessions, shows sustained interest',
        significance: 0.7
      });
    }

    return patterns;
  }

  private analyzeCommunicationStyle(messages: ChatMessage[]): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = [];
    const userMessages = messages.filter(m => m.role === 'user');

    if (userMessages.length === 0) return patterns;

    // Message length analysis
    const messageLengths = userMessages.map(m => m.content.length);
    const avgLength = messageLengths.reduce((sum, len) => sum + len, 0) / messageLengths.length;
    const maxLength = Math.max(...messageLengths);
    const minLength = Math.min(...messageLengths);

    if (avgLength > 200) {
      patterns.push({
        type: 'detailed_communicator',
        frequency: avgLength / 200,
        context: 'Provides detailed context in questions',
        significance: 0.6
      });
    } else if (avgLength < 50) {
      patterns.push({
        type: 'concise_communicator',
        frequency: 1 - (avgLength / 100),
        context: 'Prefers brief, direct communication',
        significance: 0.5
      });
    }

    // Question complexity analysis
    const complexQuestions = userMessages.filter(m => 
      m.content.includes('?') && m.content.split('?').length > 2
    );

    if (complexQuestions.length > userMessages.length * 0.3) {
      patterns.push({
        type: 'complex_thinker',
        frequency: complexQuestions.length,
        context: 'Uses diverse vocabulary, likely handles complex concepts well',
        significance: 0.8
      });
    }

    // Technical language usage
    const technicalTerms = ['api', 'css', 'html', 'accessibility', 'wcag', 'audit', 'testing', 'implementation'];
    const technicalMessages = userMessages.filter(m => 
      technicalTerms.some(term => m.content.toLowerCase().includes(term.toLowerCase()))
    );

    if (technicalMessages.length > userMessages.length * 0.4) {
      patterns.push({
        type: 'technical_oriented',
        frequency: technicalMessages.length,
        context: 'Shows familiarity with technical concepts',
        significance: 0.9
      });
    }

    return patterns;
  }

  private analyzeLearningProgression(messages: ChatMessage[]): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = [];
    const userMessages = messages.filter(m => m.role === 'user');

    if (userMessages.length < 3) return patterns;

    // Analyze question sophistication over time
    const questionComplexity = userMessages.map((message, index) => {
      const content = message.content.toLowerCase();
      let complexity = 0;

      // Basic question indicators
      if (content.includes('what is') || content.includes('how to')) complexity += 1;
      
      // Intermediate question indicators
      if (content.includes('why') || content.includes('when')) complexity += 2;
      
      // Advanced question indicators
      if (content.includes('implement') || content.includes('integrate')) complexity += 3;
      
      // Expert question indicators
      if (content.includes('optimize') || content.includes('best practice')) complexity += 4;

      return { index, complexity, timestamp: message.created_at };
    });

    // Check for learning progression
    const earlyComplexity = questionComplexity.slice(0, Math.ceil(questionComplexity.length / 3))
                                             .reduce((sum, q) => sum + q.complexity, 0);
    const lateComplexity = questionComplexity.slice(-Math.ceil(questionComplexity.length / 3))
                                            .reduce((sum, q) => sum + q.complexity, 0);

    if (lateComplexity > earlyComplexity * 1.5) {
      patterns.push({
        type: 'fast_learner',
        frequency: questionComplexity.length,
        context: 'Accelerates learning by introducing advanced topics',
        significance: 0.8
      });
    } else if (lateComplexity < earlyComplexity * 0.8) {
      patterns.push({
        type: 'needs_reinforcement',
        frequency: questionComplexity.length,
        context: 'Needs more foundational content and examples',
        significance: 0.6
      });
    }

    return patterns;
  }

  private analyzeEngagementPatterns(sessions: ChatSession[], messages: ChatMessage[]): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = [];

    // Calculate messages per session
    const messagesPerSession = sessions.map(session => ({
      sessionId: session.id,
      messageCount: messages.filter(m => m.session_id === session.id).length,
      duration: this.calculateSessionDuration(session, messages)
    }));

    const avgMessagesPerSession = messagesPerSession.reduce((sum, s) => sum + s.messageCount, 0) / messagesPerSession.length;

    if (avgMessagesPerSession > 10) {
      patterns.push({
        type: 'highly_engaged',
        frequency: Math.round(avgMessagesPerSession),
        context: 'Maintains high engagement with interactive content',
        significance: 0.8
      });
    } else if (avgMessagesPerSession < 3) {
      patterns.push({
        type: 'low_engagement',
        frequency: Math.round(avgMessagesPerSession),
        context: 'Needs more digestible content to increase engagement',
        significance: 0.6
      });
    }

    return patterns;
  }

  private analyzeProblemSolvingBehavior(messages: ChatMessage[]): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = [];
    const userMessages = messages.filter(m => m.role === 'user');

    // Analyze problem-solving approach
    const problemSolvingKeywords = {
      systematic: ['step by step', 'process', 'methodology', 'approach'],
      urgent: ['quickly', 'asap', 'urgent', 'immediately', 'fast'],
      research: ['documentation', 'guide', 'tutorial', 'learn more'],
      practical: ['example', 'demo', 'show me', 'how to implement']
    };

    const approaches: Record<string, number> = {};

    userMessages.forEach(message => {
      const content = message.content.toLowerCase();
      Object.entries(problemSolvingKeywords).forEach(([approach, keywords]) => {
        if (keywords.some(keyword => content.includes(keyword))) {
          approaches[approach] = (approaches[approach] || 0) + 1;
        }
      });
    });

    // Determine dominant approach
    const dominantApproach = Object.entries(approaches)
      .sort(([,a], [,b]) => b - a)[0];

    if (dominantApproach) {
      const [approach, frequency] = dominantApproach;
      patterns.push({
        type: `${approach}_problem_solver`,
        frequency,
        context: this.getProblemSolvingRecommendation(approach),
        significance: 0.8
      });
    }

    return patterns;
  }

  private calculateSessionDuration(session: ChatSession, messages: ChatMessage[]): number {
    const sessionMessages = messages.filter(m => m.session_id === session.id);
    if (sessionMessages.length < 2) return 0;

    const firstMessage = sessionMessages[0];
    const lastMessage = sessionMessages[sessionMessages.length - 1];
    
    return new Date(lastMessage.created_at).getTime() - new Date(firstMessage.created_at).getTime();
  }

  private getProblemSolvingRecommendation(approach: string): string {
    const recommendations: Record<string, string> = {
      systematic: 'Provide structured, step-by-step guides with clear progression',
      urgent: 'Prioritize quick solutions and actionable immediate steps',
      research: 'Include comprehensive resources and further reading materials',
      practical: 'Focus on hands-on examples and implementation details'
    };

    return recommendations[approach] || 'Adapt response style to user preferences';
  }
} 