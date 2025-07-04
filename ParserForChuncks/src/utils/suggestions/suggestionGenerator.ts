/**
 * NEW AI AGENT FOR GENERATING SUGGESTIONS
 * Replaces static algorithm with intelligent system,
 * which analyzes entire conversation and user memory
 * 
 * Features:
 * - Analyzes conversation history and user facts
 * - Generates contextual suggestions based on user profile
 * - Adapts to user experience level and business type
 * - Provides fallback mechanisms for edge cases
 * - Integrates with GPT-4o-mini for intelligent analysis
 */

interface SuggestionResult {
  clarificationQuestions: string[];
  infoTemplates: string[];
  header: string;
}

/**
 * Generates personalized suggestions via AI agent
 * @param userFacts array of user facts (Keep for compatibility, but not used)
 * @param clarificationQuestions array of clarification questions (Keep for compatibility)
 * @param isFirstInteraction whether this is the first interaction
 * @param currentQuestion current user question
 * @param userId user identifier
 * @param sessionId session identifier
 * @returns Promise with suggestion result
 */
export async function generatePersonalizedSuggestions(
  userFacts: any[], // Keep for compatibility, but not used
  clarificationQuestions: string[] = [], // Keep for compatibility
  isFirstInteraction: boolean = false,
  currentQuestion: string = '',
  userId: string = 'anonymous',
  sessionId: string = 'default'
): Promise<SuggestionResult> {
  
  console.log(`🤖 [AI_SUGGESTIONS] Calling AI agent for generating suggestions`);
  console.log(`👤 User: ${userId} | 💬 Session: ${sessionId} | 🆕 First: ${isFirstInteraction}`);

  try {
    // Call AI agent via internal API
    const response = await fetch('http://localhost:3000/api/v1/agent/ai-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        sessionId,
        currentQuestion,
        isFirstInteraction
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const aiResult = await response.json();
    
    console.log(`✅ [AI_SUGGESTIONS] AI agent generated ${aiResult.clarificationQuestions?.length || 0} suggestions`);
    console.log(`🧠 [AI_SUGGESTIONS] AI logic: ${aiResult.reasoning}`);

    return {
      clarificationQuestions: aiResult.clarificationQuestions || [],
      infoTemplates: aiResult.infoTemplates || [],
      header: aiResult.suggestions_header || 'Choose a suggestion or ask a clarifying question:'
    };

  } catch (error) {
    console.error('❌ [AI_SUGGESTIONS] Error calling AI agent:', error);
    
    // Fallback - minimal suggestions on error
    console.log('🔄 [AI_SUGGESTIONS] Using fallback suggestions');
    
    const fallbackSuggestions = isFirstInteraction 
      ? [
          'Am I obligated to comply with EAA for my digital product?',
          'What penalties might I face for not complying with EAA?',
          'Where do I start preparing for EAA compliance?'
        ]
      : [
          'How do I conduct an accessibility audit of my website?',
          'What tools can help me check WCAG compliance?',
          'How much time do I need to implement EAA requirements?'
        ];

    return {
      clarificationQuestions: fallbackSuggestions,
      infoTemplates: [],
      header: 'Choose a suggestion or ask a clarifying question:'
    };
  }
}

/**
 * СИНХРОННАЯ ВЕРСИЯ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ
 * Возвращает базовые подсказки, если нет возможности вызвать ИИ-агента
 */
export function generatePersonalizedSuggestionsSync(
  userFacts: any[], 
  clarificationQuestions: string[] = [],
  isFirstInteraction: boolean = false,
  currentQuestion: string = '',
  userId: string = 'anonymous',
  sessionId: string = 'default'
): SuggestionResult {
  
  console.log('⚠️ [SYNC_SUGGESTIONS] Using synchronous version - AI not available');
  
  const fallbackSuggestions = isFirstInteraction 
    ? [
        'Am I obligated to comply with EAA for my digital product?',
        'What penalties might I face for not complying with EAA?',
        'Where do I start preparing for EAA compliance?'
      ]
    : [
        'How do I conduct an accessibility audit of my website?',
        'What tools can help me check WCAG compliance?',
        'How much time do I need to implement EAA requirements?'
      ];

  // Filter duplicates with current question
  const filteredSuggestions = fallbackSuggestions.filter(suggestion => 
    suggestion.toLowerCase() !== currentQuestion.toLowerCase()
  );

  return {
    clarificationQuestions: filteredSuggestions.slice(0, 3),
    infoTemplates: [],
    header: 'Choose a suggestion or ask a clarifying question:'
  };
} 