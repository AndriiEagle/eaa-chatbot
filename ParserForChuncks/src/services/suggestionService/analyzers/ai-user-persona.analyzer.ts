import { UserPersona } from '../suggestion.types';
import { UserFact, ChatMessage } from '../../../types/database.types';
import OpenAI from 'openai';
import { extractJson } from '../../../utils/formatting/extractJson.js';

/**
 * 🤖 AI-POWERED USER PERSONA ANALYZER
 * 
 * Uses GPT-4o-mini for comprehensive persona analysis:
 * - Professional role identification
 * - Psychological profiling
 * - Learning style analysis
 * - Communication preference detection
 */
export class AIUserPersonaAnalyzer {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async analyze(userFacts: UserFact[], sessionMessages: ChatMessage[]): Promise<UserPersona> {
    console.log(`🤖 [AI-PERSONA] Starting AI persona analysis with ${userFacts.length} facts and ${sessionMessages.length} messages`);

    try {
      // Prepare comprehensive persona data for AI
      const personaData = this.preparePersonaDataForAI(userFacts, sessionMessages);
      
      // Get AI persona analysis
      const aiAnalysis = await this.getAIPersonaAnalysis(personaData);
      
      // Parse AI response into structured persona
      const persona = this.parseAIPersonaResponse(aiAnalysis);
      
      console.log(`🤖 [AI-PERSONA] AI identified persona: ${persona.role} (${persona.experienceLevel}) - ${persona.primaryMotivation}`);
      return persona;

    } catch (error) {
      console.error('❌ [AI-PERSONA] AI analysis failed, using fallback:', error);
      return this.fallbackPersonaAnalysis(userFacts, sessionMessages);
    }
  }

  private preparePersonaDataForAI(facts: UserFact[], messages: ChatMessage[]): string {
    const userMessages = messages.filter(m => m.role === 'user');

    const personaData = {
      businessProfile: {
        facts: facts.map(f => ({
          type: f.fact_type,
          value: f.fact_value,
          confidence: f.confidence
        })),
        businessType: facts.find(f => f.fact_type === 'business_type')?.fact_value || 'unknown',
        businessSize: facts.find(f => f.fact_type === 'business_size')?.fact_value || 'unknown',
        webPresence: facts.find(f => f.fact_type === 'web_presence')?.fact_value || 'unknown',
        complianceStatus: facts.find(f => f.fact_type === 'compliance_status')?.fact_value || 'unknown'
      },
      communicationStyle: {
        totalMessages: userMessages.length,
        averageMessageLength: userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length,
        vocabularyComplexity: this.assessVocabularyComplexity(userMessages),
        technicalLanguageUsage: this.assessTechnicalLanguage(userMessages),
        formalityLevel: this.assessFormalityLevel(userMessages),
        questioningStyle: this.analyzeQuestioningStyle(userMessages)
      },
      professionalIndicators: {
        roleIndicators: this.detectRoleIndicators(userMessages),
        industryKnowledge: this.assessIndustryKnowledge(userMessages),
        decisionMakingStyle: this.analyzeDecisionMakingStyle(userMessages),
        problemSolvingApproach: this.analyzeProblemSolvingApproach(userMessages)
      },
      learningPatterns: {
        informationSeeking: this.analyzeInformationSeeking(userMessages),
        detailPreference: this.assessDetailPreference(userMessages),
        exampleUsage: this.analyzeExampleUsage(userMessages),
        followUpBehavior: this.analyzeFollowUpBehavior(messages)
      },
      contextualFactors: {
        urgencyLevel: this.assessUrgencyLevel(userMessages),
        stressIndicators: this.detectStressIndicators(userMessages),
        supportExpectations: this.analyzeSupportExpectations(userMessages),
        goalOrientation: this.analyzeGoalOrientation(userMessages)
      },
      recentInteractions: userMessages.slice(-5).map(m => ({
        content: m.content.substring(0, 300),
        timestamp: m.created_at,
        wordCount: m.content.split(' ').length,
        sentiment: this.basicSentimentAnalysis(m.content)
      }))
    };

    return JSON.stringify(personaData, null, 2);
  }

  private async getAIPersonaAnalysis(personaData: string): Promise<string> {
    const prompt = `
Ты - эксперт по созданию персон пользователей в B2B системах поддержки.

Проанализируй данные пользователя и создай детальную персону:

ДАННЫЕ ПОЛЬЗОВАТЕЛЯ:
${personaData}

КОНТЕКСТ: Пользователь обращается за помощью по European Accessibility Act (EAA). Это юридическое требование для бизнеса в ЕС, касающееся доступности цифровых продуктов.

ЗАДАЧА: Определи роль пользователя, его профессиональный профиль и оптимальную стратегию взаимодействия.

ФОРМАТ ОТВЕТА (строго JSON):
{
  "role": "конкретная профессиональная роль (например: ceo, cto, developer, compliance_manager, business_owner, consultant)",
  "experienceLevel": "beginner|intermediate|advanced|expert",
  "primaryMotivation": "основная мотивация (например: compliance, cost_reduction, user_experience, competitive_advantage)",
  "communicationStyle": "formal|casual|technical|business_focused",
  "learningPreference": "visual|textual|hands_on|conceptual",
  "decisionMakingStyle": "analytical|intuitive|collaborative|directive",
  "personalityTraits": {
    "detailOriented": число_от_0_до_1,
    "riskTolerance": число_от_0_до_1,
    "innovationOpenness": число_от_0_до_1,
    "timeOrientation": "short_term|long_term|balanced",
    "stressLevel": число_от_0_до_1
  },
  "professionalContext": {
    "industryExpertise": число_от_0_до_1,
    "technicalBackground": число_от_0_до_1,
    "managementLevel": "individual|team_lead|middle_management|executive",
    "budgetAuthority": "none|limited|moderate|full",
    "implementationRole": "decision_maker|influencer|implementer|end_user"
  },
  "supportNeeds": {
    "preferredResponseStyle": "brief|detailed|step_by_step|comprehensive",
    "examplePreference": "conceptual|practical|industry_specific|technical",
    "followUpExpectation": "immediate|scheduled|as_needed|minimal",
    "escalationTriggers": ["список триггеров для эскалации"]
  },
  "businessImpact": {
    "urgencyLevel": число_от_0_до_1,
    "businessCriticality": "low|medium|high|critical",
    "potentialValue": "low|medium|high|strategic",
    "implementationComplexity": "simple|moderate|complex|enterprise"
  },
  "predictiveInsights": {
    "likelyNextQuestions": ["список вероятных следующих вопросов"],
    "potentialChallenges": ["список потенциальных проблем"],
    "successFactors": ["факторы успеха для этого пользователя"],
    "churnRisk": число_от_0_до_1
  },
  "confidence": число_от_0_до_1
}

ВАЖНО:
- Анализируй глубокие паттерны, не поверхностные признаки
- Учитывай бизнес-контекст и отраслевую специфику
- Предсказывай будущие потребности и поведение
- Давай конкретные, actionable инсайты
- Учитывай культурные и региональные особенности ЕС
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 3000
    });

    return response.choices[0]?.message?.content || '{}';
  }

  private parseAIPersonaResponse(aiResponse: string): UserPersona {
    try {
      const jsonString = extractJson(aiResponse);
      const parsed = JSON.parse(jsonString);
      
      return {
        type: parsed.type || 'end_user',
        confidence: parsed.confidence || 0.5,
        role: parsed.role || 'end_user',
        experienceLevel: parsed.experienceLevel || 'intermediate',
        primaryMotivation: parsed.primaryMotivation || 'compliance',
        communicationStyle: parsed.communicationStyle || 'business_focused',
        learningPreference: parsed.learningPreference || 'textual',
        decisionMakingStyle: parsed.decisionMakingStyle || 'analytical',
        aiInsights: {
          personalityTraits: parsed.personalityTraits || {},
          professionalContext: parsed.professionalContext || {},
          learningBehavior: parsed.learningBehavior || {},
          communicationPatterns: parsed.communicationPatterns || {},
          emotionalIntelligence: parsed.emotionalIntelligence || {},
          adaptabilityScore: parsed.adaptabilityScore || 0.5,
          confidence: parsed.confidence || 0.5,
          analysisTimestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ [AI-PERSONA] Failed to parse AI response:', error);
      return this.createFallbackPersona();
    }
  }

  private fallbackPersonaAnalysis(facts: UserFact[], messages: ChatMessage[]): UserPersona {
    const businessType = facts.find(f => f.fact_type === 'business_type')?.fact_value || '';
    const businessSize = facts.find(f => f.fact_type === 'business_size')?.fact_value || '';
    
    // Simple heuristic-based analysis
    let role = 'business_owner';
    if (businessSize.includes('large') || businessSize.includes('enterprise')) {
      role = 'compliance_manager';
    }
    
    return {
      type: 'end_user',
      confidence: 0.3,
      role: role as UserPersona["role"],
      experienceLevel: 'intermediate',
      primaryMotivation: 'compliance',
      communicationStyle: 'business_focused',
      learningPreference: 'textual',
      decisionMakingStyle: 'analytical'
    };
  }

  private createFallbackPersona(): UserPersona {
    return {
      type: 'end_user',
      confidence: 0.3,
      role: 'business_owner',
      experienceLevel: 'intermediate',
      primaryMotivation: 'compliance',
      communicationStyle: 'business_focused',
      learningPreference: 'textual',
      decisionMakingStyle: 'analytical'
    };
  }

  // Helper methods for persona data preparation
  private assessVocabularyComplexity(messages: ChatMessage[]): number {
    let complexWords = 0;
    let totalWords = 0;

    const complexWordIndicators = [
      'implementation', 'compliance', 'accessibility', 'regulation',
      'specification', 'requirement', 'optimization', 'integration'
    ];

    messages.forEach(message => {
      const words = message.content.toLowerCase().split(' ');
      totalWords += words.length;
      
      complexWordIndicators.forEach(indicator => {
        if (message.content.toLowerCase().includes(indicator)) {
          complexWords++;
        }
      });
    });

    return totalWords > 0 ? complexWords / totalWords : 0;
  }

  private assessTechnicalLanguage(messages: ChatMessage[]): number {
    const technicalTerms = [
      'API', 'HTML', 'CSS', 'JavaScript', 'WCAG', 'ARIA',
      'screen reader', 'alt text', 'semantic', 'markup'
    ];

    let technicalCount = 0;
    messages.forEach(message => {
      technicalTerms.forEach(term => {
        if (message.content.includes(term)) {
          technicalCount++;
        }
      });
    });

    return technicalCount / messages.length;
  }

  private assessFormalityLevel(messages: ChatMessage[]): number {
    const formalIndicators = ['please', 'thank you', 'could you', 'would you', 'I would appreciate'];
    const informalIndicators = ['hey', 'yeah', 'ok', 'thanks', 'cool'];

    let formalCount = 0;
    let informalCount = 0;

    messages.forEach(message => {
      const content = message.content.toLowerCase();
      
      formalIndicators.forEach(indicator => {
        if (content.includes(indicator)) formalCount++;
      });
      
      informalIndicators.forEach(indicator => {
        if (content.includes(indicator)) informalCount++;
      });
    });

    return formalCount / (formalCount + informalCount + 1); // +1 to avoid division by zero
  }

  private analyzeQuestioningStyle(messages: ChatMessage[]): string {
    const questions = messages.filter(m => m.content.includes('?'));
    
    if (questions.length === 0) return 'statement_based';
    
    const openQuestions = questions.filter(q => 
      q.content.toLowerCase().includes('how') || 
      q.content.toLowerCase().includes('why') ||
      q.content.toLowerCase().includes('what')
    );
    
    const closedQuestions = questions.filter(q => 
      q.content.toLowerCase().includes('is') ||
      q.content.toLowerCase().includes('can') ||
      q.content.toLowerCase().includes('do')
    );

    if (openQuestions.length > closedQuestions.length) {
      return 'exploratory';
    } else {
      return 'specific';
    }
  }

  private detectRoleIndicators(messages: ChatMessage[]): string[] {
    const roleIndicators = {
      'ceo': ['company', 'business', 'strategy', 'revenue', 'growth'],
      'cto': ['technical', 'implementation', 'architecture', 'development'],
      'developer': ['code', 'programming', 'API', 'HTML', 'CSS'],
      'compliance_manager': ['compliance', 'regulation', 'legal', 'audit'],
      'consultant': ['client', 'recommendation', 'best practice', 'industry']
    };

    const foundIndicators: string[] = [];
    
    Object.entries(roleIndicators).forEach(([role, indicators]) => {
      const matches = indicators.filter(indicator => 
        messages.some(m => m.content.toLowerCase().includes(indicator))
      );
      
      if (matches.length > 0) {
        foundIndicators.push(role);
      }
    });

    return foundIndicators;
  }

  private assessIndustryKnowledge(messages: ChatMessage[]): number {
    const industryTerms = [
      'accessibility', 'WCAG', 'EAA', 'compliance', 'audit',
      'screen reader', 'alt text', 'keyboard navigation'
    ];

    let knowledgeScore = 0;
    messages.forEach(message => {
      industryTerms.forEach(term => {
        if (message.content.includes(term)) {
          knowledgeScore++;
        }
      });
    });

    return Math.min(1.0, knowledgeScore / (messages.length * 2));
  }

  private analyzeDecisionMakingStyle(messages: ChatMessage[]): string {
    const analyticalIndicators = ['data', 'analysis', 'compare', 'evaluate', 'research'];
    const intuitiveIndicators = ['feel', 'sense', 'seems', 'appears', 'instinct'];

    let analyticalCount = 0;
    let intuitiveCount = 0;

    messages.forEach(message => {
      const content = message.content.toLowerCase();
      
      analyticalIndicators.forEach(indicator => {
        if (content.includes(indicator)) analyticalCount++;
      });
      
      intuitiveIndicators.forEach(indicator => {
        if (content.includes(indicator)) intuitiveCount++;
      });
    });

    return analyticalCount > intuitiveCount ? 'analytical' : 'intuitive';
  }

  private analyzeProblemSolvingApproach(messages: ChatMessage[]): string {
    const systematicIndicators = ['step', 'process', 'method', 'approach', 'plan'];
    const pragmaticIndicators = ['quick', 'simple', 'easy', 'fast', 'immediate'];

    let systematicCount = 0;
    let pragmaticCount = 0;

    messages.forEach(message => {
      const content = message.content.toLowerCase();
      
      systematicIndicators.forEach(indicator => {
        if (content.includes(indicator)) systematicCount++;
      });
      
      pragmaticIndicators.forEach(indicator => {
        if (content.includes(indicator)) pragmaticCount++;
      });
    });

    return systematicCount > pragmaticCount ? 'systematic' : 'pragmatic';
  }

  private analyzeInformationSeeking(messages: ChatMessage[]): string {
    const broadIndicators = ['overview', 'general', 'understand', 'explain'];
    const specificIndicators = ['how to', 'step by step', 'exactly', 'specific'];

    let broadCount = 0;
    let specificCount = 0;

    messages.forEach(message => {
      const content = message.content.toLowerCase();
      
      broadIndicators.forEach(indicator => {
        if (content.includes(indicator)) broadCount++;
      });
      
      specificIndicators.forEach(indicator => {
        if (content.includes(indicator)) specificCount++;
      });
    });

    return specificCount > broadCount ? 'specific' : 'broad';
  }

  private assessDetailPreference(messages: ChatMessage[]): string {
    const avgMessageLength = messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length;
    return avgMessageLength > 200 ? 'detailed' : 'concise';
  }

  private analyzeExampleUsage(messages: ChatMessage[]): number {
    const exampleIndicators = ['example', 'demo', 'show me', 'sample', 'case study'];
    let exampleCount = 0;

    messages.forEach(message => {
      exampleIndicators.forEach(indicator => {
        if (message.content.toLowerCase().includes(indicator)) {
          exampleCount++;
        }
      });
    });

    return exampleCount / messages.length;
  }

  private analyzeFollowUpBehavior(messages: ChatMessage[]): string {
    const followUpIndicators = ['also', 'additionally', 'another question', 'furthermore'];
    let followUpCount = 0;

    messages.forEach(message => {
      followUpIndicators.forEach(indicator => {
        if (message.content.toLowerCase().includes(indicator)) {
          followUpCount++;
        }
      });
    });

    return followUpCount > messages.length * 0.2 ? 'high' : 'low';
  }

  private assessUrgencyLevel(messages: ChatMessage[]): number {
    const urgencyIndicators = ['urgent', 'asap', 'immediately', 'quickly', 'deadline'];
    let urgencyCount = 0;

    messages.forEach(message => {
      urgencyIndicators.forEach(indicator => {
        if (message.content.toLowerCase().includes(indicator)) {
          urgencyCount++;
        }
      });
    });

    return urgencyCount / messages.length;
  }

  private detectStressIndicators(messages: ChatMessage[]): number {
    const stressIndicators = ['frustrated', 'confused', 'difficult', 'problem', 'issue'];
    let stressCount = 0;

    messages.forEach(message => {
      stressIndicators.forEach(indicator => {
        if (message.content.toLowerCase().includes(indicator)) {
          stressCount++;
        }
      });
    });

    return stressCount / messages.length;
  }

  private analyzeSupportExpectations(messages: ChatMessage[]): string {
    const highExpectationIndicators = ['comprehensive', 'detailed', 'complete', 'thorough'];
    const lowExpectationIndicators = ['quick', 'brief', 'simple', 'basic'];

    let highCount = 0;
    let lowCount = 0;

    messages.forEach(message => {
      const content = message.content.toLowerCase();
      
      highExpectationIndicators.forEach(indicator => {
        if (content.includes(indicator)) highCount++;
      });
      
      lowExpectationIndicators.forEach(indicator => {
        if (content.includes(indicator)) lowCount++;
      });
    });

    return highCount > lowCount ? 'high' : 'moderate';
  }

  private analyzeGoalOrientation(messages: ChatMessage[]): string {
    const taskIndicators = ['need to', 'have to', 'must', 'require'];
    const learningIndicators = ['understand', 'learn', 'know', 'explain'];

    let taskCount = 0;
    let learningCount = 0;

    messages.forEach(message => {
      const content = message.content.toLowerCase();
      
      taskIndicators.forEach(indicator => {
        if (content.includes(indicator)) taskCount++;
      });
      
      learningIndicators.forEach(indicator => {
        if (content.includes(indicator)) learningCount++;
      });
    });

    return taskCount > learningCount ? 'task_oriented' : 'learning_oriented';
  }

  private basicSentimentAnalysis(content: string): string {
    const positiveWords = ['good', 'great', 'excellent', 'helpful', 'thanks'];
    const negativeWords = ['bad', 'terrible', 'frustrated', 'confused', 'difficult'];

    let positiveCount = 0;
    let negativeCount = 0;

    const lowerContent = content.toLowerCase();
    
    positiveWords.forEach(word => {
      if (lowerContent.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (lowerContent.includes(word)) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }
} 