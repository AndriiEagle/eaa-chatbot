import OpenAI from 'openai';
import { CHAT_MODEL } from '../config/environment.js';
import { TERM_ANALYSIS_SYSTEM_PROMPT } from '../config/prompts.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface DetectedTerm {
  term: string;
  context: string;
  confidence: number;
  category: 'technical' | 'legal' | 'process' | 'abbreviation';
}

interface TermAnalysis {
  detectedTerms: DetectedTerm[];
  contextualSuggestions: string[];
  shouldGenerateClarifications: boolean;
  analysisReasoning: string;
}

/**
 * 🧠 REVOLUTIONARY AI AGENT FOR TERM ANALYSIS
 *
 * Automatically detects complex terms in bot responses and generates
 * contextual suggestions to explain them. Solves the "gap analysis"
 * problem forever!
 */
export class TermAnalysisAgent {
  private readonly TERM_ANALYSIS_SYSTEM_PROMPT = TERM_ANALYSIS_SYSTEM_PROMPT;

  /**
   * 🔍 MAIN METHOD FOR ANALYZING BOT RESPONSE
   */
  async analyzeResponse(
    botResponse: string,
    sessionId: string,
    userId: string = 'anonymous'
  ): Promise<TermAnalysis> {
    console.log(
      '\n🔍 [TermAnalysis] Starting term analysis in bot response...'
    );
    console.log(`📝 Response length: ${botResponse.length} characters`);
    console.log(
      `🔍 First 100 characters: "${botResponse.substring(0, 100)}..."`
    );

    try {
      // Quick check - should we analyze this response
      if (!this.shouldAnalyzeResponse(botResponse)) {
        console.log(
          '⏭️ [TermAnalysis] Response does not require term analysis'
        );
        return this.createEmptyAnalysis();
      }

      // Send response to AI for analysis
      const analysis = await this.getAITermAnalysis(botResponse);

      // Apply additional checks
      const validatedAnalysis = this.validateAndEnhanceAnalysis(analysis);

      console.log(
        `✅ [TermAnalysis] Found ${validatedAnalysis.detectedTerms.length} terms`
      );
      console.log(
        `🎯 Generated ${validatedAnalysis.contextualSuggestions.length} suggestions`
      );

      return validatedAnalysis;
    } catch (error) {
      console.error('❌ [TermAnalysis] Error in term analysis:', error);
      return this.createEmptyAnalysis();
    }
  }

  /**
   * Checks if we should analyze a given response
   */
  private shouldAnalyzeResponse(response: string): boolean {
    // Skip too short responses
    if (response.length < 100) return false;

    // Skip simple greetings
    const simpleGreetings = ['hello', 'hi', 'thank you', 'please'];
    if (
      simpleGreetings.some(
        greeting =>
          response.toLowerCase().includes(greeting) && response.length < 200
      )
    ) {
      return false;
    }

    // Analyze if there are potentially complex words
    const complexPatterns = [
      /\b[A-Z]{2,}\b/g, // Abbreviations in English
      /analysis\s+\w+/gi, // "analysis of something"
      /\b\w*bility\b/gi, // -bility (accessibility)
      /\b\w*tion\b/gi, // -tion (validation, verification)
      /\b\w*ment\b/gi, // -ment (assessment, requirement)
    ];

    return complexPatterns.some(pattern => pattern.test(response));
  }

  /**
   * Gets term analysis from GPT-4o-mini
   */
  private async getAITermAnalysis(botResponse: string): Promise<TermAnalysis> {
    try {
      console.log(
        '🤖 [TermAnalysis] Sending request to GPT-4o-mini for term analysis...'
      );

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: this.TERM_ANALYSIS_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Analyze this response for EAA terms: ${botResponse}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 800,
      });

      const rawResponse = completion.choices[0].message.content?.trim();

      if (!rawResponse) {
        throw new Error('Empty response from GPT-4o-mini');
      }

      console.log('✅ [TermAnalysis] AI analysis completed');

      try {
        const analysis = JSON.parse(rawResponse);
        return this.validateAndEnhanceAnalysis(analysis);
      } catch (parseError) {
        console.error('❌ [TermAnalysis] JSON parsing error:', parseError);
        console.error('Raw response:', rawResponse);
        throw new Error(`Invalid JSON from AI: ${rawResponse}`);
      }
    } catch (error) {
      console.error('❌ [TermAnalysis] Error in AI term analysis:', error);
      throw error;
    }
  }

  /**
   * Validates and enhances AI analysis
   */
  private validateAndEnhanceAnalysis(analysis: any): TermAnalysis {
    // Check structure of the response
    if (!analysis.detectedTerms || !Array.isArray(analysis.detectedTerms)) {
      analysis.detectedTerms = [];
    }

    if (
      !analysis.contextualSuggestions ||
      !Array.isArray(analysis.contextualSuggestions)
    ) {
      analysis.contextualSuggestions = [];
    }

    // Limit the number of suggestions
    analysis.contextualSuggestions = analysis.contextualSuggestions.slice(0, 3);

    // Filter out terms with low confidence
    analysis.detectedTerms = analysis.detectedTerms.filter(
      (term: any) => term.confidence && term.confidence > 0.6
    );

    // Remove duplicates in suggestions
    analysis.contextualSuggestions = [
      ...new Set(analysis.contextualSuggestions),
    ];

    return {
      detectedTerms: analysis.detectedTerms || [],
      contextualSuggestions: analysis.contextualSuggestions || [],
      shouldGenerateClarifications: analysis.detectedTerms.length > 0,
      analysisReasoning:
        analysis.analysisReasoning || 'Automated term analysis',
    };
  }

  /**
   * Creates an empty analysis for cases when analysis is not needed
   */
  private createEmptyAnalysis(): TermAnalysis {
    return {
      detectedTerms: [],
      contextualSuggestions: [],
      shouldGenerateClarifications: false,
      analysisReasoning: 'Term analysis not required',
    };
  }

  /**
   * 🎯 ADDITIONAL METHOD: Generation of explanation for a specific term
   * Used when user directly asks about a term
   */
  async explainTerm(term: string, context: string = ''): Promise<string> {
    console.log(`🔍 [TermAnalysis] Generating explanation for term: "${term}"`);

    try {
      const completion = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert on EAA. Explain the term in simple terms with examples.`,
          },
          {
            role: 'user',
            content: `Explain the term "${term}" in the context of the European Accessibility Act. ${context ? `Context: ${context}` : ''}`,
          },
        ],
        temperature: 0.4,
        max_tokens: 300,
      });

      const explanation = completion.choices[0].message.content?.trim() || '';
      console.log(
        `✅ [TermAnalysis] Explanation generated (${explanation.length} characters)`
      );

      return explanation;
    } catch (error) {
      console.error('❌ [TermAnalysis] Error in explaining term:', error);
      return `Sorry, I couldn't generate an explanation for the term "${term}". Please try reformulating the question.`;
    }
  }
}

// Export singleton instance
export const termAnalysisAgent = new TermAnalysisAgent();
