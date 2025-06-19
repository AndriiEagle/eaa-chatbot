import OpenAI from 'openai';
import { SuggestionRepository } from '../../repositories/suggestion.repository';
import { AIUserPersonaAnalyzer } from './analyzers/ai-user-persona.analyzer';
import { AIBehaviorPatternAnalyzer } from './analyzers/ai-behavior-pattern.analyzer';
import { AIFrustrationAnalyzer } from './analyzers/ai-frustration.analyzer';
import { BusinessMaturityAnalyzer } from './analyzers/business-maturity.analyzer';
import { ConversationStageAnalyzer } from './analyzers/conversation-stage.analyzer';
import { NeedsPredictor } from './analyzers/needs.predictor';
import { 
  RevolutionaryContext, 
  SmartSuggestion, 
  UserPersona, 
  BusinessMaturity, 
  FrustrationProfile, 
  ConversationStage,
  PredictedNeed
} from './suggestion.types';

export interface SuggestionRequest {
  userId: string;
  sessionId: string;
  currentQuestion?: string;
  metadata?: any;
}

export interface SuggestionResponse {
  clarificationQuestions: string[];
  infoTemplates: string[];
  suggestions_header: string;
  reasoning: string;
  analytics: {
    userPersona: string;
    businessMaturity: string;
    conversationStage: string;
    opportunityScore: number;
    suggestionsBreakdown: Array<{
      category: string;
      priority: number;
      businessValue: number;
    }>;
  };
  generated_by: string;
  model_used: string;
}

// This file contains the main orchestration logic for generating revolutionary suggestions.
export class SuggestionService {
  private repository: SuggestionRepository;
  
  // AI-POWERED ANALYZERS 🤖
  private aiUserPersonaAnalyzer: AIUserPersonaAnalyzer;
  private aiBehaviorAnalyzer: AIBehaviorPatternAnalyzer;
  private aiFrustrationAnalyzer: AIFrustrationAnalyzer;
  
  // Traditional analyzers for fallback
  private businessMaturityAnalyzer: BusinessMaturityAnalyzer;
  private conversationStageAnalyzer: ConversationStageAnalyzer;
  private needsPredictor: NeedsPredictor;

  constructor(
    private openai: OpenAI
  ) {
    this.repository = new SuggestionRepository();
    
    // Initialize AI-powered analyzers
    this.aiUserPersonaAnalyzer = new AIUserPersonaAnalyzer();
    this.aiBehaviorAnalyzer = new AIBehaviorPatternAnalyzer();
    this.aiFrustrationAnalyzer = new AIFrustrationAnalyzer();
    
    // Initialize traditional analyzers as fallback
    this.businessMaturityAnalyzer = new BusinessMaturityAnalyzer();
    this.conversationStageAnalyzer = new ConversationStageAnalyzer();
    this.needsPredictor = new NeedsPredictor();

    console.log('🤖 [SUGGESTION-SERVICE] Initialized with AI-POWERED analyzers');
  }

  async generateRevolutionarySuggestions(request: SuggestionRequest): Promise<SuggestionResponse> {
    const { userId, sessionId, currentQuestion = '', metadata = {} } = request;

    console.log('\n🎯 [REVOLUTIONARY] Starting multi-layer suggestion analysis...');
    console.log(`👤 User: ${userId} | 💬 Session: ${sessionId}`);

    try {
      // 🎪 STAGE 1: GATHERING ALL USER DATA
      const [userFacts, sessionMessages, userSessions, frustrationHistory] = await Promise.all([
        this.repository.getUserFacts(userId),
        this.repository.getSessionMessages(sessionId),
        this.repository.getUserSessions(userId),
        this.repository.getFrustrationHistory(userId)
      ]);

      // 🎪 STAGE 2-7: AI-ANALYSIS USING SPECIALIZED ANALYZERS
             const [
         aiUserPersona,
         aiBehaviorPatterns,
         aiFrustrationProfile,
         businessMaturity,
         conversationStage
       ] = await Promise.all([
         this.aiUserPersonaAnalyzer.analyze(userFacts, sessionMessages),
         this.aiBehaviorAnalyzer.analyze(userSessions, sessionMessages),
         this.aiFrustrationAnalyzer.analyze(frustrationHistory, sessionMessages),
         this.businessMaturityAnalyzer.analyze(userFacts, sessionMessages as any),
         this.conversationStageAnalyzer.analyze(sessionMessages as any, userFacts as any)
       ]);

             console.log(`🤖 [SUGGESTION-SERVICE] AI Analysis Complete:`);
       console.log(`   👤 User Persona: ${aiUserPersona.type} (${aiUserPersona.confidence})`);
       console.log(`   🔄 Behavior Patterns: ${aiBehaviorPatterns.length} detected`);
       console.log(`   😤 Frustration Level: ${(aiFrustrationProfile.currentLevel * 100).toFixed(1)}%`);
       console.log(`   🏢 Business Maturity: ${businessMaturity.level}`);
       console.log(`   💬 Conversation Stage: ${conversationStage.stage}`);

       // 🎪 STAGE 8: PREDICTION OF NEEDS
       const predictedNeeds = await this.needsPredictor.predict(aiUserPersona, businessMaturity, conversationStage);
       console.log(`🔮 [PREDICTION] ${predictedNeeds.length} predicted needs identified`);

      // 🎪 STAGE 9: BUILD REVOLUTIONARY CONTEXT
      const revolutionaryContext: RevolutionaryContext = {
        userId, sessionId, currentQuestion,
        userPersona: aiUserPersona,
        businessMaturity,
        frustrationProfile: aiFrustrationProfile,
        conversationStage,
        behaviorPatterns: aiBehaviorPatterns,
        predictedNeeds,
        opportunityScore: this.calculateOpportunityScore(businessMaturity, aiFrustrationProfile, conversationStage)
      };

      // 🎪 STAGE 10: GENERATE SMART SUGGESTIONS
      const smartSuggestions = await this.generateSmartSuggestions(revolutionaryContext);
      console.log(`💡 [SUGGESTIONS] Generated ${smartSuggestions.length} smart suggestions`);

      // 🎪 STAGE 11: OPTIMIZE SUGGESTIONS
      const optimizedSuggestions = this.optimizeSuggestionsForUser(smartSuggestions, revolutionaryContext);
      console.log(`🎯 [OPTIMIZATION] Optimized to ${optimizedSuggestions.length} top suggestions`);

      // 🎉 FINAL RESPONSE
      return {
        clarificationQuestions: optimizedSuggestions.map(s => s.text),
        infoTemplates: [],
        suggestions_header: this.generateDynamicHeader(aiUserPersona, aiFrustrationProfile, conversationStage),
        reasoning: `Revolutionary AI analysis: ${aiUserPersona.type} user at ${conversationStage.stage} stage with ${(aiFrustrationProfile.currentLevel * 100).toFixed(0)}% frustration`,
        analytics: {
          userPersona: aiUserPersona.type,
          businessMaturity: businessMaturity.level,
          conversationStage: conversationStage.stage,
          opportunityScore: revolutionaryContext.opportunityScore,
          suggestionsBreakdown: optimizedSuggestions.map(s => ({
            category: s.category,
            priority: this.mapPriorityToNumber(s.priority),
            businessValue: s.businessValue
          }))
        },
        generated_by: 'revolutionary_ai_system',
        model_used: 'gpt-4o-mini + predictive_analytics'
      };

    } catch (error: any) {
      console.error('❌ [REVOLUTIONARY] Critical error:', error);
      
      // Intelligent fallback
      return this.generateIntelligentFallback(userId, sessionId, currentQuestion);
    }
  }

  // Helper methods for suggestion generation
  private calculateOpportunityScore(businessMaturity: BusinessMaturity, frustrationProfile: FrustrationProfile, conversationStage: ConversationStage): number {
    const readinessFactor = businessMaturity.eaaReadiness;
    const frustrationFactor = 1 - frustrationProfile.currentLevel;
    
    let stageFactor = 0.5;
    if (['deep_dive', 'implementation'].includes(conversationStage.stage)) {
        stageFactor = 1.0;
    } else if (conversationStage.stage === 'exploration') {
        stageFactor = 0.7;
    }

    const score = (readinessFactor * 0.4) + (frustrationFactor * 0.4) + (stageFactor * 0.2);
    return parseFloat(score.toFixed(2));
  }

  private async generateSmartSuggestions(context: RevolutionaryContext): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];
    
    // 🎯 ALGORITHM 1: ADAPTATION FOR FRUSTRATION
    if (context.frustrationProfile.currentLevel > 0.6) {
      suggestions.push({
        text: 'Get a quick EAA compliance checklist for my website',
        category: 'problem_solving',
        priority: 'urgent',
        reasoning: 'User is frustrated - needs quick solution',
        expectedOutcome: 'Immediate actionable steps',
        businessValue: 0.9
      });
    }
    
    // 🎯 ALGORITHM 2: PERSONALIZATION FOR USER TYPE
    switch (context.userPersona.type) {
      case 'business_owner':
        suggestions.push({
          text: `How much will EAA implementation cost for a ${context.businessMaturity.level} business?`,
          category: 'business_opportunity',
          priority: 'high',
          reasoning: 'Business owner focuses on ROI',
          expectedOutcome: 'Clear figures and budget',
          businessValue: 0.95
        });
        break;
        
      case 'technical_expert':
        suggestions.push({
          text: 'What are the best automated WCAG testing tools?',
          category: 'learning_path',
          priority: 'high',
          reasoning: 'Technical expert seeks tools',
          expectedOutcome: 'Specific technical solutions',
          businessValue: 0.8
        });
        break;
        
      case 'newcomer':
        suggestions.push({
          text: 'Explain in simple terms: what is EAA and why do I need it?',
          category: 'learning_path',
          priority: 'urgent',
          reasoning: 'Newcomer needs basic understanding',
          expectedOutcome: 'Clear understanding of basics',
          businessValue: 0.85
        });
        break;
    }
    
    // 🎯 ALGORITHM 3: CONVERSATION STAGE
    switch (context.conversationStage.stage) {
      case 'discovery':
        suggestions.push({
          text: 'Check: does my business fall under EAA requirements?',
          category: 'immediate_need',
          priority: 'high',
          reasoning: 'User is in exploration stage',
          expectedOutcome: 'Clarity on EAA applicability',
          businessValue: 0.9
        });
        break;
        
      case 'implementation':
        suggestions.push({
          text: 'Step-by-step plan for implementing accessibility on my website',
          category: 'immediate_need',
          priority: 'urgent',
          reasoning: 'User is ready for action',
          expectedOutcome: 'Concrete action plan',
          businessValue: 0.95
        });
        break;
    }
    
    // 🎯 ALGORITHM 4: PREDICTIVE NEEDS
    for (const need of context.predictedNeeds.slice(0, 2)) {
      const suggestion = this.mapNeedToSuggestion(need, context);
      if (suggestion) suggestions.push(suggestion);
    }
    
    return suggestions.slice(0, 8);
  }

  private mapNeedToSuggestion(need: PredictedNeed, context: RevolutionaryContext): SmartSuggestion | null {
    return {
      text: `Tell me more about: ${need.description}`,
      category: 'learning_path',
      priority: 'medium',
      reasoning: `Predicted need based on user behavior`,
      expectedOutcome: 'Enhanced understanding',
      businessValue: need.probability
    };
  }

  private optimizeSuggestionsForUser(suggestions: SmartSuggestion[], context: RevolutionaryContext): SmartSuggestion[] {
    // Filter out suggestions that are too similar to current question
    const filtered = suggestions.filter(s => 
      s.text.toLowerCase() !== context.currentQuestion.toLowerCase()
    );

    // Sort by complex scoring algorithm
    const scored = filtered.map(s => ({
      ...s,
      complexScore: this.calculatePriorityScore(s.priority) + (s.businessValue * 0.3) + (context.opportunityScore * 0.3)
    }));

    // Return top 5 suggestions
    return scored
      .sort((a, b) => b.complexScore - a.complexScore)
      .slice(0, 5);
  }

  private calculatePriorityScore(priority: 'low' | 'medium' | 'high' | 'urgent'): number {
    const priorityMap: { [key: string]: number } = {
      'urgent': 10,
      'high': 8,
      'medium': 6,
      'low': 4
    };
    return priorityMap[priority] || 5;
  }

  private generateIntelligentFallback(userId: string, sessionId: string, currentQuestion: string): SuggestionResponse {
    return {
      clarificationQuestions: [
        'What specific EAA requirements concern you most?',
        'How can I help you prepare for EAA compliance?',
        'What aspect of accessibility would you like to explore?'
      ],
      infoTemplates: [],
      suggestions_header: 'How can I assist you with EAA compliance?',
      reasoning: 'Intelligent fallback based on user context',
      analytics: {
        userPersona: 'unknown',
        businessMaturity: 'unknown',
        conversationStage: 'unknown',
        opportunityScore: 0.5,
        suggestionsBreakdown: []
      },
      generated_by: 'intelligent_fallback',
      model_used: 'fallback_system'
    };
  }

  private generateDynamicHeader(userPersona: UserPersona, frustrationProfile: FrustrationProfile, conversationStage: ConversationStage): string {
    let header = "Smart Suggestions for You";
    
    // Adjust based on user type
    switch (userPersona.type) {
      case 'business_owner':
        header = "Business-Focused Recommendations";
        break;
      case 'technical_expert':
        header = "Technical Implementation Guide";
        break;
      case 'newcomer':
        header = "Getting Started with EAA";
        break;
      default:
        header = "Personalized EAA Guidance";
    }
    
    // Adjust for conversation stage
    if (conversationStage.stage === 'implementation') {
      header = "Ready to Implement? " + header;
    } else if (conversationStage.stage === 'deep_dive') {
      header = "Advanced " + header;
    }
    
    return header;
  }

  private mapPriorityToNumber(priority: 'low' | 'medium' | 'high' | 'urgent'): number {
    const priorityMap: { [key: string]: number } = {
      'urgent': 1,
      'high': 2,
      'medium': 3,
      'low': 4
    };
    return priorityMap[priority] || 5;
  }
} 