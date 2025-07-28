import { chatMemory } from '../utils/memory/index.js';
import { openai } from './openaiService.js';
import { supabase } from './supabaseService.js';

export interface UserPersona {
  type:
    | 'technical_expert'
    | 'business_owner'
    | 'newcomer'
    | 'compliance_officer'
    | 'frustrated_user';
  confidence: number;
  keyCharacteristics: string[];
  communicationStyle: 'direct' | 'detailed' | 'cautious' | 'urgent';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface BusinessMaturity {
  level: 'startup' | 'growing' | 'established' | 'enterprise';
  eaaReadiness: number;
  complianceGaps: string[];
  timeConstraints: 'urgent' | 'moderate' | 'planning_ahead';
}

export interface FrustrationProfile {
  currentLevel: number;
  triggers: string[];
  escalationRisk: number;
  recommendedApproach: 'gentle' | 'direct' | 'technical' | 'business_focused';
}

export interface ConversationStage {
  stage:
    | 'discovery'
    | 'exploration'
    | 'deep_dive'
    | 'implementation'
    | 'troubleshooting';
  completeness: number;
  nextOptimalSteps: string[];
}

export interface BehaviorPattern {
  pattern: string;
  frequency: number;
  impact: 'positive' | 'negative' | 'neutral';
  recommendation: string;
}

export interface PredictedNeed {
  need: string;
  probability: number;
  urgency: 'high' | 'medium' | 'low';
  businessValue: number;
}

export interface SmartSuggestion {
  text: string;
  category:
    | 'immediate_need'
    | 'business_opportunity'
    | 'learning_path'
    | 'problem_solving'
    | 'compliance_critical';
  priority: number;
  reasoning: string;
  expectedOutcome: string;
  businessValue: number;
}

export interface RevolutionaryContext {
  userId: string;
  sessionId: string;
  currentQuestion: string;
  userPersona: UserPersona;
  businessMaturity: BusinessMaturity;
  frustrationProfile: FrustrationProfile;
  conversationStage: ConversationStage;
  behaviorPatterns: BehaviorPattern[];
  predictedNeeds: PredictedNeed[];
  opportunityScore: number;
}

export class RevolutionaryAnalyzer {
  async analyzeUserContext(
    userId: string,
    sessionId: string,
    currentQuestion: string
  ): Promise<RevolutionaryContext> {
    console.log(
      '🎯 [REVOLUTIONARY] Starting multi-layer suggestion analysis...'
    );

    // Gathering all user data in parallel
    const [userFacts, sessionMessages, userSessions, frustrationHistory] =
      await Promise.all([
        chatMemory.getUserFacts(userId),
        chatMemory.getSessionMessages(sessionId),
        chatMemory.getUserSessions(userId),
        this.getUserFrustrationHistory(userId),
      ]);

    // Analyze user persona, business maturity, frustration, conversation stage, behavior patterns, and predicted needs in parallel
    const [
      userPersona,
      businessMaturity,
      frustrationProfile,
      conversationStage,
      behaviorPatterns,
      predictedNeeds,
    ] = await Promise.all([
      this.analyzeUserPersona(userFacts, sessionMessages, currentQuestion),
      this.assessBusinessMaturity(userFacts, sessionMessages),
      this.buildFrustrationProfile(frustrationHistory, sessionMessages),
      this.determineConversationStage(sessionMessages, userFacts),
      this.analyzeBehaviorPatterns(userSessions, sessionMessages),
      this.predictUserNeeds(userFacts, sessionMessages),
    ]);

    const opportunityScore = this.calculateOpportunityScore(
      businessMaturity,
      frustrationProfile,
      conversationStage
    );

    return {
      userId,
      sessionId,
      currentQuestion,
      userPersona,
      businessMaturity,
      frustrationProfile,
      conversationStage,
      behaviorPatterns,
      predictedNeeds,
      opportunityScore,
    };
  }

  async generateSmartSuggestions(
    context: RevolutionaryContext
  ): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    // Generate suggestions based on predicted needs
    for (const need of context.predictedNeeds) {
      const suggestion = this.mapNeedToSuggestion(need, context);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    // Optimize suggestions for the user
    return this.optimizeSuggestionsForUser(suggestions, context);
  }

  private async analyzeUserPersona(
    userFacts: any[],
    sessionMessages: any[],
    currentQuestion: string
  ): Promise<UserPersona> {
    const factsText = userFacts
      .map(f => `${f.fact_type}: ${f.fact_value}`)
      .join('\n');
    const messagesText = sessionMessages
      .slice(-10)
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = `
🎯 REVOLUTIONARY USER PERSONA ANALYSIS EAA ChatBot

BUSINESS FACTS OF THE USER:
${factsText || 'Facts are missing'}

RECENT MESSAGES IN SESSION:
${messagesText || 'No messages yet'}

CURRENT QUESTION:
${currentQuestion}

Your task is to determine the user's persona from these options:
- technical_expert: knows technology, asks about implementation details
- business_owner: focuses on business impact, ROI, deadlines
- newcomer: asks basic questions, needs guidance
- compliance_officer: focused on legal requirements, documentation
- frustrated_user: shows signs of irritation, confusion, urgency

Respond with JSON only:
{
  "type": "technical_expert",
  "confidence": 0.85,
  "keyCharacteristics": ["tech-savvy", "detail-oriented"],
  "communicationStyle": "detailed",
  "experienceLevel": "advanced"
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        type: result.type || 'newcomer',
        confidence: result.confidence || 0.5,
        keyCharacteristics: result.keyCharacteristics || [],
        communicationStyle: result.communicationStyle || 'detailed',
        experienceLevel: result.experienceLevel || 'beginner',
      };
    } catch (error) {
      console.error('Error analyzing user persona:', error);
      return {
        type: 'newcomer',
        confidence: 0.3,
        keyCharacteristics: ['unknown'],
        communicationStyle: 'detailed',
        experienceLevel: 'beginner',
      };
    }
  }

  private async assessBusinessMaturity(
    userFacts: any[],
    sessionMessages: any[]
  ): Promise<BusinessMaturity> {
    // Simple heuristic-based assessment for now
    const businessKeywords = [
      'company',
      'business',
      'enterprise',
      'startup',
      'revenue',
      'customers',
    ];
    const messages = sessionMessages
      .map(m => m.content?.toLowerCase() || '')
      .join(' ');

    let maturityLevel: BusinessMaturity['level'] = 'startup';
    let eaaReadiness = 0.3;

    if (messages.includes('enterprise') || messages.includes('corporation')) {
      maturityLevel = 'enterprise';
      eaaReadiness = 0.7;
    } else if (messages.includes('growing') || messages.includes('scaling')) {
      maturityLevel = 'growing';
      eaaReadiness = 0.5;
    } else if (messages.includes('established')) {
      maturityLevel = 'established';
      eaaReadiness = 0.6;
    }

    return {
      level: maturityLevel,
      eaaReadiness,
      complianceGaps: ['accessibility-audit', 'documentation', 'testing'],
      timeConstraints: 'moderate',
    };
  }

  private async buildFrustrationProfile(
    frustrationHistory: any[],
    sessionMessages: any[]
  ): Promise<FrustrationProfile> {
    const recentMessages = sessionMessages
      .slice(-5)
      .map(m => m.content?.toLowerCase() || '')
      .join(' ');

    const frustrationIndicators = [
      'confused',
      'frustrated',
      'urgent',
      'help',
      'problem',
      'issue',
      'error',
    ];
    const foundIndicators = frustrationIndicators.filter(indicator =>
      recentMessages.includes(indicator)
    );

    const frustrationLevel = Math.min(
      foundIndicators.length / frustrationIndicators.length,
      1
    );

    return {
      currentLevel: frustrationLevel,
      triggers: foundIndicators,
      escalationRisk: frustrationLevel > 0.6 ? 0.8 : 0.2,
      recommendedApproach: frustrationLevel > 0.6 ? 'gentle' : 'direct',
    };
  }

  private async determineConversationStage(
    sessionMessages: any[],
    userFacts: any[]
  ): Promise<ConversationStage> {
    const messageCount = sessionMessages.length;

    let stage: ConversationStage['stage'] = 'discovery';
    let completeness = 0;

    if (messageCount < 3) {
      stage = 'discovery';
      completeness = 0.2;
    } else if (messageCount < 10) {
      stage = 'exploration';
      completeness = 0.4;
    } else if (messageCount < 20) {
      stage = 'deep_dive';
      completeness = 0.7;
    } else {
      stage = 'implementation';
      completeness = 0.9;
    }

    return {
      stage,
      completeness,
      nextOptimalSteps: [
        'clarify-requirements',
        'provide-examples',
        'suggest-next-steps',
      ],
    };
  }

  private async analyzeBehaviorPatterns(
    userSessions: any[],
    sessionMessages: any[]
  ): Promise<BehaviorPattern[]> {
    // Simplified pattern analysis
    return [
      {
        pattern: 'frequent_questions',
        frequency: userSessions.length,
        impact: 'positive',
        recommendation: 'provide-comprehensive-answers',
      },
    ];
  }

  private async predictUserNeeds(
    userFacts: any[],
    sessionMessages: any[]
  ): Promise<PredictedNeed[]> {
    const commonPatterns = sessionMessages
      .map(m => m.content?.toLowerCase() || '')
      .join(' ');

    const needs: PredictedNeed[] = [];

    if (
      commonPatterns.includes('audit') ||
      commonPatterns.includes('testing')
    ) {
      needs.push({
        need: 'accessibility_audit_guidance',
        probability: 0.8,
        urgency: 'high',
        businessValue: 0.9,
      });
    }

    if (
      commonPatterns.includes('implementation') ||
      commonPatterns.includes('comply')
    ) {
      needs.push({
        need: 'implementation_roadmap',
        probability: 0.7,
        urgency: 'medium',
        businessValue: 0.8,
      });
    }

    return needs;
  }

  private calculateOpportunityScore(
    businessMaturity: BusinessMaturity,
    frustrationProfile: FrustrationProfile,
    conversationStage: ConversationStage
  ): number {
    const maturityWeight = businessMaturity.eaaReadiness * 0.4;
    const frustrationWeight = (1 - frustrationProfile.currentLevel) * 0.3;
    const stageWeight = conversationStage.completeness * 0.3;

    return maturityWeight + frustrationWeight + stageWeight;
  }

  private mapNeedToSuggestion(
    need: PredictedNeed,
    context: RevolutionaryContext
  ): SmartSuggestion | null {
    const suggestionMap: Record<
      string,
      Omit<SmartSuggestion, 'businessValue'>
    > = {
      accessibility_audit_guidance: {
        text: 'Would you like me to guide you through creating an accessibility audit checklist for your specific business?',
        category: 'compliance_critical',
        priority: 9,
        reasoning: 'User shows interest in auditing processes',
        expectedOutcome: 'Comprehensive audit plan',
      },
      implementation_roadmap: {
        text: 'I can help you create a step-by-step EAA compliance implementation roadmap. Shall we start?',
        category: 'business_opportunity',
        priority: 8,
        reasoning: 'User needs structured approach to compliance',
        expectedOutcome: 'Clear implementation timeline',
      },
    };

    const suggestion = suggestionMap[need.need];
    if (suggestion) {
      return {
        ...suggestion,
        businessValue: need.businessValue,
      };
    }

    return null;
  }

  private optimizeSuggestionsForUser(
    suggestions: SmartSuggestion[],
    context: RevolutionaryContext
  ): SmartSuggestion[] {
    // Sort by priority and business value
    return suggestions
      .sort(
        (a, b) => b.priority - a.priority || b.businessValue - a.businessValue
      )
      .slice(0, 5); // Return top 5 suggestions
  }

  private async getUserFrustrationHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_interactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching frustration history:', error);
      return [];
    }
  }

  generateDynamicHeader(
    userPersona: UserPersona,
    frustrationProfile: FrustrationProfile,
    conversationStage: ConversationStage
  ): string {
    const personaHeaders = {
      technical_expert: '🔧 Expert-Level Suggestions',
      business_owner: '💼 Business-Focused Recommendations',
      newcomer: '🌟 Getting Started Guide',
      compliance_officer: '📋 Compliance Checklist',
      frustrated_user: "🤝 Let's Solve This Together",
    };

    return personaHeaders[userPersona.type] || '💡 Personalized Suggestions';
  }
}
