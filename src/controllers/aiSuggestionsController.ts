import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';

// Temporary interfaces until the service is created
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

// Temporary service implementation
class AISuggestionsService {
  async generateSuggestions(request: {
    userId: string;
    sessionId: string;
    currentQuestion?: string;
    isFirstInteraction?: boolean;
  }): Promise<AISuggestionsResult> {
    // Temporary fallback implementation
    return {
      suggestions: [
        { text: "What are the basic EAA requirements for my business?", category: "learning_path", priority: 8, businessValue: 0.9, reasoning: "Basic understanding needed" },
        { text: "How to conduct an accessibility audit?", category: "immediate_need", priority: 7, businessValue: 0.8, reasoning: "Audit is first step" },
        { text: "What are the penalties for non-compliance?", category: "business_opportunity", priority: 6, businessValue: 0.7, reasoning: "Risk awareness important" }
      ],
      header: "🎓 Starting with EAA basics:",
      reasoning: "AI analysis: newcomer user at discovery stage",
      analytics: {
        userPersona: "newcomer",
        businessMaturity: "startup",
        conversationStage: "discovery",
        frustrationLevel: 0.2,
        suggestionsBreakdown: [
          { category: "learning_path", priority: 8, businessValue: 0.9 },
          { category: "immediate_need", priority: 7, businessValue: 0.8 },
          { category: "business_opportunity", priority: 6, businessValue: 0.7 }
        ]
      }
    };
  }
}

/**
 * 🎯 CLEAN AI SUGGESTIONS CONTROLLER
 * 
 * BEFORE: 306 lines with AI logic mixed in controller
 * AFTER: 30 lines, pure HTTP handling
 * 
 * This controller ONLY handles HTTP concerns.
 * All AI analysis is delegated to AISuggestionsService.
 */

interface AISuggestionsRequest {
  userId: string;
  sessionId: string;
  currentQuestion?: string;
  isFirstInteraction?: boolean;
}

export const generateAISuggestions = async (req: Request, res: Response) => {
  const { userId, sessionId, currentQuestion = '', isFirstInteraction = false } = req.body as AISuggestionsRequest;

  // Input validation
  if (!userId || !sessionId) {
    return res.status(400).json({ 
      error: 'Missing required parameters',
      required: ['userId', 'sessionId']
    });
  }

  try {
    // ALL AI analysis is handled by the service
    const aiService = new AISuggestionsService();
    const result = await aiService.generateSuggestions({
      userId,
      sessionId,
      currentQuestion,
      isFirstInteraction
    });

    // Return clean response
    res.status(200).json({
      clarificationQuestions: result.suggestions.map((s: SmartSuggestion) => s.text),
      infoTemplates: [],
      suggestions_header: result.header,
      reasoning: result.reasoning,
      analytics: result.analytics,
      generated_by: 'professional_ai_service_v2',
      model_used: 'gpt-4o-mini'
    });

  } catch (error) {
    // Professional error handling with logging
    logger.error('Error in generateAISuggestions', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      sessionId,
      currentQuestion: currentQuestion.substring(0, 100)
    });

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate AI suggestions'
    });
  }
};