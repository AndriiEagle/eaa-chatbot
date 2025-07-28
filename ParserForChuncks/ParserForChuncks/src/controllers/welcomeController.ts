import { Request, Response } from 'express';
import { chatMemory } from '../utils/memory/index.js';
import { generatePersonalizedSuggestions } from '../utils/suggestions/suggestionGenerator.js';

/**
 * Controller for generating personalized greetings and suggestions.
 * GET /welcome/:userId
 */
export const welcomeController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.userId || 'anonymous';

    // Get user facts from vector database (if available)
    let userFacts: any[] = [];
    try {
      userFacts = await chatMemory.getUserFacts(userId);
    } catch (e) {
      console.error('⚠️ [WELCOME] Failed to retrieve user facts:', e);
    }

    const isFirstInteraction = userFacts.length === 0;

    // Generate AI-powered personalized greeting based on vector database
    let greeting =
      "Hello! I'll help you navigate the European Accessibility Act requirements.";

    if (!isFirstInteraction) {
      const businessType = userFacts.find(
        (f: any) => f.fact_type === 'business_type' && f.confidence > 0.6
      )?.fact_value;
      const businessLocation = userFacts.find(
        (f: any) => f.fact_type === 'business_location' && f.confidence > 0.6
      )?.fact_value;
      const digitalPresence = userFacts.find(
        (f: any) =>
          f.fact_type === 'business_digital_presence' && f.confidence > 0.6
      )?.fact_value;
      const auditDone =
        userFacts.find(
          (f: any) =>
            f.fact_type === 'accessibility_audit_done' && f.confidence > 0.5
        )?.fact_value === 'true';

      // Construct dynamic AI-powered phrase based on user vector data
      const parts: string[] = ['Hello'];

      if (businessType) {
        parts.push(`I see you represent a ${businessType} business`);
      }
      if (businessLocation) {
        parts.push(`based in ${businessLocation}`);
      }
      if (digitalPresence) {
        parts.push(`with ${digitalPresence}`);
      }

      greeting = parts.join(' ') + '. ';
      greeting += auditDone
        ? "Excellent! Your accessibility audit is complete — let's discuss next steps for EAA compliance."
        : "I'm ready to help you with EAA requirements and accessibility auditing.";
    }

    // Generate AI-powered suggestions (maximum 3) based on user vector profile
    const { clarificationQuestions } = await generatePersonalizedSuggestions(
      userFacts,
      [],
      isFirstInteraction,
      '',
      userId,
      userId // Use full userId as sessionId
    );
    const suggestions = clarificationQuestions.slice(0, 3);

    res.status(200).json({ greeting, suggestions });
  } catch (error) {
    console.error('❌ [WELCOME] Error generating AI-powered greeting:', error);
    res
      .status(500)
      .json({
        greeting: "Hello! Let's discuss the European Accessibility Act.",
        suggestions: [],
      });
  }
};
