import OpenAI from 'openai';
import { chatMemory } from '../utils/memory/index.js';
import { CHAT_MODEL } from '../config/environment.js';
import { supabase } from './supabaseService.js';
import { logger } from '../utils/logger.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AISuggestionsRequest {
  userId: string;
  sessionId: string;
  currentQuestion?: string;
  isFirstInteraction?: boolean;
}

interface FullContext {
  persona: {
    type: string;
    confidence: number;
    experienceLevel: string;
    communicationStyle: string;
  };
  business: {
    maturityLevel: string;
    urgencyLevel: string;
    complianceReadiness: number;
    budgetSensitivity: string;
  };
  emotion: {
    frustrationLevel: number;
    confidence: number;
    preferredApproach: string;
  };
  conversation: {
    stage: string;
    completeness: number;
    topicsFocused: string[];
    nextLogicalSteps: string[];
  };
}

interface SmartSuggestion {
  text: string;
  category: string;
  priority: number;
  businessValue: number;
  reasoning: string;
}

interface AISuggestionsResult {
  suggestions: SmartSuggestion[];
  header: string;
  reasoning: string;
  analytics: {
    userPersona: string;
    businessMaturity: string;
    conversationStage: string;
    frustrationLevel: number;
    suggestionsBreakdown: Array<{
      category: string;
      priority: number;
      businessValue: number;
    }>;
  };
}

/**
 * 🤖 AI SUGGESTIONS SERVICE
 * 
 * Handles all AI-powered suggestion generation logic.
 * Moved from controller to maintain separation of concerns.
 */
export class AISuggestionsService {
  private aiAnalyzer: AIContextAnalyzer;

  constructor() {
    this.aiAnalyzer = new AIContextAnalyzer(openai);
  }

  async generateSuggestions(request: AISuggestionsRequest): Promise<AISuggestionsResult> {
    logger.info('Generating AI suggestions', { 
      userId: request.userId, 
      sessionId: request.sessionId 
    });

    try {
      // 📊 Get user data
      const [userFacts, sessionMessages] = await Promise.all([
        chatMemory.getUserFacts(request.userId),
        chatMemory.getSessionMessages(request.sessionId)
      ]);

      // 🧠 AI context analysis
      const context = await this.aiAnalyzer.analyzeContext(
        userFacts, 
        sessionMessages, 
        request.currentQuestion || ''
      );

      // 💡 Generate suggestions
      const suggestions = await this.aiAnalyzer.generateSuggestions(context);

      // 📝 Generate header
      const header = await this.aiAnalyzer.generateHeader(context);

      // 💾 Save analytics
      await this.saveAnalytics(request.userId, request.sessionId, context, suggestions.length);

      return {
        suggestions,
        header,
        reasoning: `AI analysis: ${context.persona.type} user at ${context.conversation.stage} stage`,
        analytics: {
          userPersona: context.persona.type,
          businessMaturity: context.business.maturityLevel,
          conversationStage: context.conversation.stage,
          frustrationLevel: context.emotion.frustrationLevel,
          suggestionsBreakdown: suggestions.map(s => ({
            category: s.category,
            priority: s.priority,
            businessValue: s.businessValue
          }))
        }
      };

    } catch (error) {
      logger.error('Failed to generate AI suggestions', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: request.userId,
        sessionId: request.sessionId
      });
      throw error;
    }
  }

  private async saveAnalytics(
    userId: string, 
    sessionId: string, 
    context: FullContext, 
    suggestionsCount: number
  ): Promise<void> {
    try {
      await supabase.from('advanced_suggestion_analytics').insert({
        user_id: userId,
        session_id: sessionId,
        user_persona_type: context.persona.type,
        business_maturity: context.business.maturityLevel,
        emotional_frustration: context.emotion.frustrationLevel,
        conversation_stage: context.conversation.stage,
        suggestions_count: suggestionsCount,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      logger.warn('Failed to save analytics', { error });
    }
  }
}

/**
 * 🤖 AI CONTEXT ANALYZER
 * 
 * Handles all AI-powered context analysis.
 */
class AIContextAnalyzer {
  private openai: OpenAI;

  constructor(openaiClient: OpenAI) {
    this.openai = openaiClient;
  }

  async analyzeContext(
    userFacts: unknown[], 
    sessionMessages: unknown[], 
    currentQuestion: string
  ): Promise<FullContext> {
    const contextPrompt = `
Analyze this EAA chatbot conversation and user context. Return ONLY valid JSON:

USER FACTS: ${JSON.stringify(userFacts)}
RECENT MESSAGES: ${JSON.stringify(sessionMessages.slice(-10))}
CURRENT QUESTION: "${currentQuestion}"

Return exactly this JSON structure:
{
  "persona": {
    "type": "technical_expert|business_owner|newcomer|compliance_officer|frustrated_user",
    "confidence": 0.0-1.0,
    "experienceLevel": "beginner|intermediate|advanced", 
    "communicationStyle": "direct|detailed|cautious|urgent"
  },
  "business": {
    "maturityLevel": "startup|growing|established|enterprise",
    "urgencyLevel": "immediate|moderate|planning",
    "complianceReadiness": 0.0-1.0,
    "budgetSensitivity": "high|medium|low"
  },
  "emotion": {
    "frustrationLevel": 0.0-1.0,
    "confidence": 0.0-1.0,
    "preferredApproach": "gentle|direct|technical|business_focused"
  },
  "conversation": {
    "stage": "discovery|exploration|deep_dive|implementation|troubleshooting",
    "completeness": 0.0-1.0,
    "topicsFocused": ["topic1", "topic2"],
    "nextLogicalSteps": ["step1", "step2"]
  }
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          { role: 'system', content: 'You are an expert EAA consultant analyzer. Return only valid JSON.' },
          { role: 'user', content: contextPrompt }
        ],
        temperature: 0.1,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
      logger.error('AI Context Analysis failed', { error });
      // Safe fallback
      return {
        persona: { type: 'newcomer', confidence: 0.5, experienceLevel: 'beginner', communicationStyle: 'cautious' },
        business: { maturityLevel: 'startup', urgencyLevel: 'moderate', complianceReadiness: 0.3, budgetSensitivity: 'high' },
        emotion: { frustrationLevel: 0.2, confidence: 0.7, preferredApproach: 'gentle' },
        conversation: { stage: 'discovery', completeness: 0.2, topicsFocused: [], nextLogicalSteps: [] }
      };
    }
  }

  async generateSuggestions(context: FullContext): Promise<SmartSuggestion[]> {
    const suggestionsPrompt = `
Based on this user analysis, generate 3 perfect EAA suggestions in ENGLISH:

CONTEXT: ${JSON.stringify(context)}

Generate exactly this JSON array:
[
  {
    "text": "Perfect suggestion in English",
    "category": "immediate_need|business_opportunity|learning_path|problem_solving|compliance_critical",
    "priority": 1-10,
    "businessValue": 0.0-1.0,
    "reasoning": "Why this fits this user perfectly"
  }
]

Requirements:
- ALL suggestions in ENGLISH language
- Perfectly match user's persona and business context
- Consider frustration level and conversation stage
- High business value and relevance`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          { role: 'system', content: 'You are an EAA expert generating perfect suggestions in ENGLISH only.' },
          { role: 'user', content: suggestionsPrompt }
        ],
        temperature: 0.3,
        max_tokens: 600,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content || '[]');
      return Array.isArray(result) ? result : result.suggestions || [];
    } catch (error) {
      logger.error('AI Suggestions generation failed', { error });
      return [];
    }
  }

  async generateHeader(context: FullContext): Promise<string> {
    const headerPrompt = `
Create a perfect header for EAA suggestions based on this context:
${JSON.stringify(context)}

Return ONLY the header text in English, considering:
- User's frustration level: ${context.emotion.frustrationLevel}
- Conversation stage: ${context.conversation.stage}  
- User type: ${context.persona.type}

Examples:
- High frustration: "🆘 Let us solve your problem right now:"
- Business owner: "💼 Business solutions for EAA compliance:"
- Technical expert: "⚙️ Technical EAA recommendations:"
- Newcomer: "🎓 Starting EAA basics:"

Return just the header text with emoji.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          { role: 'system', content: 'Generate perfect suggestion headers in English.' },
          { role: 'user', content: headerPrompt }
        ],
        temperature: 0.4,
        max_tokens: 100
      });

      return completion.choices[0].message.content?.trim() || 'Try asking:';
    } catch (error) {
      logger.error('AI Header generation failed', { error });
      return 'Try asking:';
    }
  }
} 