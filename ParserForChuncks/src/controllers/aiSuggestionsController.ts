import { Request, Response } from 'express';
import OpenAI from 'openai';
import { chatMemory } from '../utils/memory/index.js';
import { CHAT_MODEL } from '../config/environment.js';
import { supabase } from '../services/supabaseService.js';

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

/**
 * 🤖 AI-FIRST CONTEXT ANALYZER
 * The single class for all analytics via GPT-4o-mini
 */
class AIContextAnalyzer {
  private openai: OpenAI;

  constructor(openaiClient: OpenAI) {
    this.openai = openaiClient;
  }

  /**
   * 🧠 FULL USER CONTEXT ANALYSIS VIA AI
   */
  async analyzeContext(
    userFacts: any[], 
    sessionMessages: any[], 
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
      console.error('❌ AI Context Analysis failed:', error);
      // Minimal safe fallback
      return {
        persona: { type: 'newcomer', confidence: 0.5, experienceLevel: 'beginner', communicationStyle: 'cautious' },
        business: { maturityLevel: 'startup', urgencyLevel: 'moderate', complianceReadiness: 0.3, budgetSensitivity: 'high' },
        emotion: { frustrationLevel: 0.2, confidence: 0.7, preferredApproach: 'gentle' },
        conversation: { stage: 'discovery', completeness: 0.2, topicsFocused: [], nextLogicalSteps: [] }
      };
    }
  }

  /**
   * 💡 PERSONALIZED SUGGESTION GENERATION VIA AI
   */
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
      console.error('❌ AI Suggestions generation failed:', error);
      return [];
    }
  }

  /**
   * 📝 DYNAMIC HEADER GENERATION VIA AI
   */
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
      console.error('❌ AI Header generation failed:', error);
      return 'Try asking:';
    }
  }
}

// 🚀 CREATE AI AGENT
const aiAnalyzer = new AIContextAnalyzer(openai);

/**
 * 🎯 MAIN FUNCTION - REVOLUTIONARILY SIMPLIFIED
 */
export const generateAISuggestions = async (req: Request, res: Response) => {
  const { userId, sessionId, currentQuestion = '', isFirstInteraction = false } = req.body;

  if (!userId || !sessionId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    console.log('\n🤖 [AI-FIRST] Generating suggestions...');
    console.log(`👤 User: ${userId} | 💬 Session: ${sessionId}`);

    // 📊 GETTING DATA
    const [userFacts, sessionMessages] = await Promise.all([
      chatMemory.getUserFacts(userId),
      chatMemory.getSessionMessages(sessionId)
    ]);

    console.log(`📊 [DATA] Facts: ${userFacts.length}, Messages: ${sessionMessages.length}`);

    // 🧠 AI CONTEXT ANALYSIS
    const context = await aiAnalyzer.analyzeContext(userFacts, sessionMessages, currentQuestion);
    console.log(`🎭 [AI-CONTEXT] ${context.persona.type} (${context.conversation.stage})`);

    // 💡 AI SUGGESTION GENERATION
    const suggestions = await aiAnalyzer.generateSuggestions(context);
    console.log(`💡 [AI-SUGGESTIONS] Generated: ${suggestions.length}`);

    // 📝 AI HEADER GENERATION
    const header = await aiAnalyzer.generateHeader(context);
    console.log(`📝 [AI-HEADER] "${header}"`);

    // 💾 SAVING ANALYTICS
    await saveAnalytics(userId, sessionId, context, suggestions.length);

    // 🎉 FINAL RESPONSE
    res.status(200).json({
      clarificationQuestions: suggestions.map(s => s.text),
      infoTemplates: [],
      suggestions_header: header,
      reasoning: `AI-first analysis: ${context.persona.type} user at ${context.conversation.stage} stage`,
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
      },
      generated_by: 'ai_first_system_v3',
      model_used: 'gpt-4o-mini'
    });

  } catch (error: any) {
    console.error('❌ [AI-FIRST] Critical error:', error);
    res.status(500).json({ error: 'AI analysis failed' });
  }
};

/**
 * 💾 SAVE ANALYTICS
 */
async function saveAnalytics(
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
    console.error('Failed to save analytics:', error);
  }
}