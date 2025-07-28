import { openai } from './openaiService.js';
import { supabase } from './supabaseService.js';
import { ChatMessage } from '../utils/memory/types.js';
import { FRUSTRATION_DETECTION_SYSTEM_PROMPT } from '../config/prompts.js';
import { extractJson } from '../utils/formatting/extractJson.js';

// Interfaces for safe agent operation
export interface FrustrationAnalysis {
  frustrationLevel: number; // 0-1, where 1 = maximum frustration
  confidenceScore: number; // 0-1, AI's confidence in the analysis
  detectedPatterns: string[]; // Detected patterns of dissatisfaction
  triggerPhrases: string[]; // Key trigger phrases
  contextFactors: {
    repeatedQuestions: boolean;
    sessionDuration: number;
    messageCount: number;
    negativeKeywordsCount: number;
    hasSwearing: boolean;
    hasExcessiveExclamations: boolean;
    hasAllCaps: boolean;
    exclamationCount: number;
    allCapsWords: string[];
  };
  shouldEscalate: boolean; // Recommendation for escalation
  escalationReason?: string; // Reason for escalation
}

export interface SafetyThresholds {
  minimumFrustrationLevel: number; // Minimum level for escalation (default: 0.7)
  minimumConfidence: number; // Minimum AI confidence (default: 0.8)
  minimumTriggers: number; // Minimum number of triggers for escalation (default: 2)
}

/**
 * 🛡️ CONSERVATIVE FRUSTRATION DETECTION AGENT
 *
 * Safety Principles:
 * - High thresholds to avoid false positives
 * - Multiple checks and validations
 * - Detailed logging of all decisions
 * - Never escalates without clear signs of problems
 */
export class FrustrationDetectionAgent {
  private readonly SYSTEM_PROMPT = FRUSTRATION_DETECTION_SYSTEM_PROMPT;

  private readonly DEFAULT_THRESHOLDS: SafetyThresholds = {
    minimumFrustrationLevel: 0.6, // Lowered from 0.7 - more sensitive detection
    minimumConfidence: 0.7, // Lowered from 0.8 - trust advanced AI analysis
    minimumTriggers: 1, // Lowered from 2 - AI analysis is primary
  };

  private customThresholds?: Partial<SafetyThresholds>;

  constructor(customThresholds?: Partial<SafetyThresholds>) {
    this.customThresholds = customThresholds;
  }

  /**
   * 🧠 MAIN FRUSTRATION ANALYSIS METHOD
   *
   * @param currentMessage - The user's current message
   * @param recentMessages - The last 5-10 messages for context
   * @param sessionId - Session ID
   * @param userId - User ID
   * @returns Promise<FrustrationAnalysis>
   */
  async analyzeFrustration(
    currentMessage: string,
    recentMessages: ChatMessage[],
    sessionId: string,
    userId: string
  ): Promise<FrustrationAnalysis> {
    const startTime = Date.now();

    console.log('\n [FrustrationAgent] Starting frustration analysis...');
    console.log(`📝 Current message: "${currentMessage}"`);
    console.log(`📚 Context: ${recentMessages.length} recent messages`);

    try {
      // Step 1: Prepare the context for the AI
      const conversationContext = this.prepareConversationContext(
        currentMessage,
        recentMessages
      );

      // Step 2: Get the analysis from GPT-4o-mini
      const aiAnalysis = await this.getAIAnalysis(conversationContext);

      // Step 3: Analyze contextual factors
      const contextFactors = this.analyzeContextFactors(
        currentMessage,
        recentMessages
      );

      // Step 4: Apply conservative safety checks
      const finalAnalysis = this.applySafetyChecks(aiAnalysis, contextFactors);

      // Step 5: Save the result to the database
      await this.saveAnalysisToDatabase(
        finalAnalysis,
        sessionId,
        userId,
        startTime
      );

      console.log(
        `✅ [FrustrationAgent] Analysis complete. Frustration level: ${finalAnalysis.frustrationLevel.toFixed(2)}`
      );
      console.log(
        `🎯 Escalation recommended: ${finalAnalysis.shouldEscalate ? 'YES' : 'NO'}`
      );

      return finalAnalysis;
    } catch (error) {
      console.error('❌ [FrustrationAgent] Error during analysis:', error);

      // Return a safe result on error
      return this.createSafeFailureResponse();
    }
  }

  /**
   * Prepares the conversation context for AI analysis
   */
  private prepareConversationContext(
    currentMessage: string,
    recentMessages: ChatMessage[]
  ): string {
    const historyText = recentMessages
      .slice(-8) // Take a maximum of 8 recent messages
      .map((msg, index) => {
        const timestamp =
          index === recentMessages.length - 1
            ? '[MOST RECENT]'
            : `[${index + 1}]`;
        return `${timestamp} ${msg.role === 'user' ? 'USER' : 'BOT'}: ${msg.content}`;
      })
      .join('\n');

    // Calculate conversation metrics for AI
    const userMessages = recentMessages.filter(msg => msg.role === 'user');
    const conversationLength = recentMessages.length;
    const userQuestionCount = userMessages.length;
    const averageMessageLength =
      userMessages.reduce((sum, msg) => sum + msg.content.length, 0) /
      Math.max(userMessages.length, 1);

    return `
=== CONVERSATION ANALYSIS REQUEST ===

CONVERSATION HISTORY:
${historyText}

CURRENT MESSAGE TO ANALYZE:
[ANALYZING NOW] USER: ${currentMessage}

CONVERSATION METRICS:
- Total messages in conversation: ${conversationLength}
- User questions asked: ${userQuestionCount}
- Average user message length: ${Math.round(averageMessageLength)} characters
- User engagement pattern: ${this.getEngagementPattern(userMessages)}

ANALYSIS TASK:
Perform deep psychological analysis of the user's emotional state based on:
1. The ENTIRE conversation flow and evolution
2. Language patterns and emotional progression
3. Unmet needs and repeated concerns
4. Cultural and linguistic context (Russian/English)
5. User's patience level and satisfaction trajectory

Focus on understanding the USER'S PERSPECTIVE and emotional journey, not just keyword detection.

IMPORTANT: Consider whether the user's frustration (if any) is:
- Justified based on their experience
- Escalating or de-escalating
- Technical confusion vs emotional frustration
- Requiring human intervention vs more patient bot assistance
`;
  }

  private getEngagementPattern(userMessages: ChatMessage[]): string {
    if (userMessages.length <= 1) return 'Initial contact';
    if (userMessages.length <= 3) return 'Early engagement';
    if (userMessages.length <= 6) return 'Active conversation';
    return 'Extended interaction';
  }

  /**
   * Gets analysis from GPT-4o-mini
   */
  private async getAIAnalysis(context: string): Promise<any> {
    try {
      console.log('🤖 [FrustrationAgent] Sending request to GPT-4o-mini...');

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: this.SYSTEM_PROMPT },
          { role: 'user', content: context },
        ],
        temperature: 0.1, // Low temperature for consistent analysis
        max_tokens: 500,
      });

      const responseText = completion.choices[0].message.content?.trim();

      if (!responseText) {
        throw new Error('Empty response from GPT-4o-mini');
      }

      console.log('✅ [FrustrationAgent] AI analysis completed');

      try {
        const cleanedJson = extractJson(responseText);
        return JSON.parse(cleanedJson);
      } catch (parseError) {
        console.error('❌ [FrustrationAgent] JSON parsing error:', parseError);
        console.error('Raw response:', responseText);
        throw new Error(`Invalid JSON from AI: ${responseText}`);
      }
    } catch (error) {
      console.error('❌ [FrustrationAgent] Error getting AI analysis:', error);
      throw error;
    }
  }

  /**
   * Analyzes contextual factors of frustration
   */
  private analyzeContextFactors(
    currentMessage: string,
    recentMessages: ChatMessage[]
  ): FrustrationAnalysis['contextFactors'] {
    const userMessages = recentMessages.filter(msg => msg.role === 'user');
    const messageCount = recentMessages.length;

    // Look for repeated questions
    const repeatedQuestions = this.detectRepeatedQuestions(userMessages);

    // Count negative keywords (English + Russian)
    const negativeKeywords = [
      // English
      "doesn't work",
      'not helping',
      'useless',
      'in vain',
      'bad',
      'terrible',
      'awful',
      'disappointed',
      "don't understand",
      // Russian
      'не работает',
      'не помогает',
      'бесполезно',
      'зря',
      'плохо',
      'ужасно',
      'неверно',
      'не понимаю',
      'не получается',
      'третий раз',
      'четвертый раз',
      'пятый раз',
      'опять',
      'снова',
      'всё время',
      'не то',
      'не так',
      'ошибка',
      'неправильно',
    ];
    const negativeKeywordsCount = negativeKeywords.filter(keyword =>
      currentMessage.toLowerCase().includes(keyword)
    ).length;

    // Check for swear words (basic list - English + Russian)
    const swearWords = [
      'fuck',
      'shit',
      'damn',
      'hell',
      'херня',
      'блять',
      'черт',
      'дерьмо',
    ];
    const hasSwearing = swearWords.some(word =>
      currentMessage.toLowerCase().includes(word)
    );

    // Check for excessive exclamation marks (sign of frustration)
    const exclamationCount = (currentMessage.match(/!/g) || []).length;
    const hasExcessiveExclamations = exclamationCount >= 3;

    // Check for ALL CAPS words (sign of shouting/frustration)
    const allCapsWords = currentMessage.match(/\b[А-ЯA-Z]{3,}\b/g) || [];
    const hasAllCaps = allCapsWords.length > 0;

    // Approximate session duration (by message count)
    const sessionDuration = messageCount * 2; // Approx. 2 minutes per message

    return {
      repeatedQuestions,
      sessionDuration,
      messageCount,
      negativeKeywordsCount,
      hasSwearing,
      hasExcessiveExclamations,
      hasAllCaps,
      exclamationCount,
      allCapsWords,
    };
  }

  /**
   * Detects repeated questions from the user
   */
  private detectRepeatedQuestions(userMessages: ChatMessage[]): boolean {
    if (userMessages.length < 2) return false;

    const lastMessages = userMessages.slice(-3); // Last 3 user messages

    // Simple check for message similarity (by words)
    for (let i = 0; i < lastMessages.length - 1; i++) {
      for (let j = i + 1; j < lastMessages.length; j++) {
        const similarity = this.calculateMessageSimilarity(
          lastMessages[i].content,
          lastMessages[j].content
        );

        if (similarity > 0.6) {
          // 60% similarity
          console.log(
            `🔄 [FrustrationAgent] Detected repeated questions (similarity: ${similarity.toFixed(2)})`
          );
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Calculates the similarity of two messages (simple algorithm)
   */
  private calculateMessageSimilarity(msg1: string, msg2: string): number {
    const words1 = msg1
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2);
    const words2 = msg2
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2);

    if (words1.length === 0 || words2.length === 0) return 0;

    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;

    return commonWords.length / totalWords;
  }

  /**
   * 🛡️ APPLIES CONSERVATIVE SAFETY CHECKS
   *
   * This is the key method - it decides whether to escalate
   */
  private applySafetyChecks(
    aiAnalysis: any,
    contextFactors: FrustrationAnalysis['contextFactors']
  ): FrustrationAnalysis {
    const thresholds = { ...this.DEFAULT_THRESHOLDS, ...this.customThresholds };

    console.log('🛡️ [FrustrationAgent] Applying safety checks...');
    console.log(
      `📊 AI analysis - level: ${aiAnalysis.frustration_level}, confidence: ${aiAnalysis.confidence}`
    );
    console.log(
      `🧠 AI reasoning: ${aiAnalysis.reasoning || 'No reasoning provided'}`
    );

    // Parse AI result with checks
    const frustrationLevel = Math.max(
      0,
      Math.min(1, aiAnalysis.frustration_level || 0)
    );
    const confidenceScore = Math.max(
      0,
      Math.min(1, aiAnalysis.confidence || 0)
    );
    const detectedPatterns = Array.isArray(aiAnalysis.patterns)
      ? aiAnalysis.patterns
      : [];
    const triggerPhrases = Array.isArray(aiAnalysis.triggers)
      ? aiAnalysis.triggers
      : [];

    // 🎯 PRIORITY: AI ANALYSIS FIRST, CONTEXTUAL FACTORS AS SUPPORT
    let shouldEscalate = false;
    let escalationReason = '';

    // 🧠 PRIMARY CHECK: AI Analysis Results
    if (
      frustrationLevel >= thresholds.minimumFrustrationLevel &&
      confidenceScore >= thresholds.minimumConfidence
    ) {
      // ✅ AI DETECTED HIGH FRUSTRATION - Now verify with contextual support
      const supportingFactors = [];

      if (contextFactors.hasSwearing) supportingFactors.push('профанизм');
      if (contextFactors.repeatedQuestions)
        supportingFactors.push('повторные вопросы');
      if (contextFactors.hasExcessiveExclamations)
        supportingFactors.push('избыточные восклицания');
      if (contextFactors.hasAllCaps) supportingFactors.push('заглавные буквы');
      if (contextFactors.negativeKeywordsCount >= 2)
        supportingFactors.push(
          `${contextFactors.negativeKeywordsCount} негативных слов`
        );

      // 🚨 ESCALATE: AI confirms high frustration + at least some supporting evidence
      if (
        supportingFactors.length > 0 ||
        triggerPhrases.length >= thresholds.minimumTriggers
      ) {
        shouldEscalate = true;
        escalationReason = `ИИ-анализ показал высокую фрустрацию (${frustrationLevel.toFixed(2)}) с уверенностью ${confidenceScore.toFixed(2)}. Поддерживающие факторы: ${supportingFactors.join(', ')}. Триггеры: ${triggerPhrases.join(', ')}`;

        console.log('🚨 [FrustrationAgent] ESCALATION RECOMMENDED BY AI!');
        console.log(`📋 AI Reasoning: ${aiAnalysis.reasoning}`);
        console.log(`🔍 Supporting factors: ${supportingFactors.join(', ')}`);
      } else {
        console.log(
          `⚡ [Safety] AI detected high frustration but no supporting contextual evidence`
        );
        escalationReason = `AI detected frustration but insufficient supporting evidence`;
      }
    } else {
      // 📊 Log why escalation was NOT triggered
      if (frustrationLevel < thresholds.minimumFrustrationLevel) {
        console.log(
          `⚡ [Safety] AI frustration level ${frustrationLevel.toFixed(2)} below threshold ${thresholds.minimumFrustrationLevel}`
        );
      }
      if (confidenceScore < thresholds.minimumConfidence) {
        console.log(
          `⚡ [Safety] AI confidence ${confidenceScore.toFixed(2)} below threshold ${thresholds.minimumConfidence}`
        );
      }
    }

    return {
      frustrationLevel,
      confidenceScore,
      detectedPatterns,
      triggerPhrases,
      contextFactors,
      shouldEscalate,
      escalationReason,
    };
  }

  /**
   * Saves the analysis result to the database
   */
  private async saveAnalysisToDatabase(
    analysis: FrustrationAnalysis,
    sessionId: string,
    userId: string,
    startTime: number
  ): Promise<void> {
    const processingTimeMs = Date.now() - startTime;

    try {
      // Get the ID of the last user message in the session
      const { data: lastMessage } = await supabase
        .from('chat_messages')
        .select('id')
        .eq('session_id', sessionId)
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { error } = await supabase.from('frustration_analysis').insert({
        session_id: sessionId,
        message_id: lastMessage?.id || null,
        frustration_level: analysis.frustrationLevel,
        confidence_score: analysis.confidenceScore,
        detected_patterns: analysis.detectedPatterns,
        trigger_phrases: analysis.triggerPhrases,
        context_factors: analysis.contextFactors,
        should_escalate: analysis.shouldEscalate,
        escalation_reason: analysis.escalationReason,
        processing_time_ms: processingTimeMs,
      });

      if (error) {
        console.error('❌ [FrustrationAgent] Error saving to DB:', error);
      } else {
        console.log('💾 [FrustrationAgent] Analysis result saved to DB');
      }

      // Update user statistics
      if (analysis.shouldEscalate) {
        await supabase.rpc('update_user_behavior_stats', {
          p_user_id: userId,
          p_new_frustration_incident: true,
        });
      }
    } catch (error) {
      console.error('❌ [FrustrationAgent] Error during save:', error);
    }
  }

  /**
   * Creates a safe response in case of an analysis error
   */
  private createSafeFailureResponse(): FrustrationAnalysis {
    console.log('🛡️ [FrustrationAgent] Returning safe response on error');

    return {
      frustrationLevel: 0.0, // Safe value
      confidenceScore: 0.0, // Zero confidence
      detectedPatterns: [],
      triggerPhrases: [],
      contextFactors: {
        repeatedQuestions: false,
        sessionDuration: 0,
        messageCount: 0,
        negativeKeywordsCount: 0,
        hasSwearing: false,
        hasExcessiveExclamations: false,
        hasAllCaps: false,
        exclamationCount: 0,
        allCapsWords: [],
      },
      shouldEscalate: false, // NEVER escalate on error
      escalationReason:
        'Analysis error - escalation blocked for safety reasons',
    };
  }
}
