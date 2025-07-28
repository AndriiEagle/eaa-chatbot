import { Request, Response } from 'express';
import { SuggestionService } from '../services/suggestionService/suggestion.service';
import { SuggestionRepository } from '../repositories/suggestion.repository.js';
import { openai } from '../services/openaiService.js';

// Create service with proper constructor
const suggestionService = new SuggestionService(openai);

/**
 * 🎯 NEW REVOLUTIONARY SUGGESTION CONTROLLER
 *
 * This is how a controller SHOULD look like:
 * - Thin and focused
 * - Only handles HTTP concerns
 * - Delegates business logic to services
 * - Clean error handling
 * - Single responsibility: HTTP request/response handling
 */
export const generateRevolutionarySuggestions = async (
  req: Request,
  res: Response
) => {
  const { userId, sessionId, currentQuestion = '', metadata = {} } = req.body;

  // Input validation
  if (!userId || !sessionId) {
    return res.status(400).json({
      error: 'Missing required parameters',
      required: ['userId', 'sessionId'],
    });
  }

  try {
    // Call the service - this is where all the magic happens
    const result = await suggestionService.generateRevolutionarySuggestions({
      userId,
      sessionId,
      currentQuestion,
      metadata,
    });

    // Return the result
    res.status(200).json(result);
  } catch (error: any) {
    console.error('❌ [CONTROLLER] Error in suggestion generation:', error);

    // Return error response
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate suggestions',
      generated_by: 'error_handler',
    });
  }
};

export const suggestionsController = {
  async generateSuggestions(req: Request, res: Response) {
    try {
      const { user_id, session_id, current_question } = req.body;

      if (!user_id || !session_id) {
        return res.status(400).json({
          error: 'Missing required fields: user_id, session_id',
        });
      }

      const suggestions =
        await suggestionService.generateRevolutionarySuggestions({
          userId: user_id,
          sessionId: session_id,
          currentQuestion: current_question || '',
        });

      res.json(suggestions);
    } catch (error: any) {
      console.error('Suggestions error:', error);
      res.status(500).json({
        error: 'Failed to generate suggestions',
        details: error.message,
      });
    }
  },
};
