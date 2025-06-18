import { openai } from './openaiService.js';
import { supabase } from './supabaseService.js';
import { ChatMessage } from '../utils/memory/types.js';
import { FRUSTRATION_DETECTION_SYSTEM_PROMPT } from '../config/prompts.js';

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
    minimumFrustrationLevel: 0.7, // Very high threshold!
    minimumConfidence: 0.8, // High AI confidence
    minimumTriggers: 2 // Minimum 2 triggers for escalation
  };

  constructor(private customThresholds?: Partial<SafetyThresholds>) {}

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
    
    console.log('\n�� [FrustrationAgent] Starting frustration analysis...');
    console.log(`📝 Current message: "${currentMessage}"`);
    console.log(`📚 Context: ${recentMessages.length} recent messages`);

    try {
      // Step 1: Prepare the context for the AI
      const conversationContext = this.prepareConversationContext(currentMessage, recentMessages);
      
      // Step 2: Get the analysis from GPT-4o-mini
      const aiAnalysis = await this.getAIAnalysis(conversationContext);
      
      // Step 3: Analyze contextual factors
      const contextFactors = this.analyzeContextFactors(currentMessage, recentMessages);
      
      // Step 4: Apply conservative safety checks
      const finalAnalysis = this.applySafetyChecks(aiAnalysis, contextFactors);
      
      // Step 5: Save the result to the database
      await this.saveAnalysisToDatabase(finalAnalysis, sessionId, userId, startTime);
      
      console.log(`✅ [FrustrationAgent] Analysis complete. Frustration level: ${finalAnalysis.frustrationLevel.toFixed(2)}`);
      console.log(`🎯 Escalation recommended: ${finalAnalysis.shouldEscalate ? 'YES' : 'NO'}`);
      
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
  private prepareConversationContext(currentMessage: string, recentMessages: ChatMessage[]): string {
    const historyText = recentMessages
      .slice(-8) // Take a maximum of 8 recent messages
      .map(msg => `${msg.role === 'user' ? 'USER' : 'BOT'}: ${msg.content}`)
      .join('\n');

    return `
=== CONVERSATION CONTEXT ===
${historyText}

=== CURRENT MESSAGE (ANALYZE THIS) ===
USER: ${currentMessage}

=== TASK ===
Analyze the user's frustration level in the current message, considering the conversation context.
`;
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
          { role: 'user', content: context }
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
        return JSON.parse(responseText);
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
  private analyzeContextFactors(currentMessage: string, recentMessages: ChatMessage[]): FrustrationAnalysis['contextFactors'] {
    const userMessages = recentMessages.filter(msg => msg.role === 'user');
    const messageCount = recentMessages.length;
    
    // Look for repeated questions
    const repeatedQuestions = this.detectRepeatedQuestions(userMessages);
    
    // Count negative keywords
    const negativeKeywords = [
      'doesn\'t work', 'not helping', 'useless', 'in vain', 'bad', 
      'terrible', 'awful', 'disappointed', 'don\'t understand'
    ];
    const negativeKeywordsCount = negativeKeywords.filter(keyword => 
      currentMessage.toLowerCase().includes(keyword)
    ).length;
    
    // Check for swear words (basic list)
    const swearWords = ['fuck', 'shit', 'damn', 'hell'];
    const hasSwearing = swearWords.some(word => 
      currentMessage.toLowerCase().includes(word)
    );

    // Approximate session duration (by message count)
    const sessionDuration = messageCount * 2; // Approx. 2 minutes per message

    return {
      repeatedQuestions,
      sessionDuration,
      messageCount,
      negativeKeywordsCount,
      hasSwearing
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
        
        if (similarity > 0.6) { // 60% similarity
          console.log(`🔄 [FrustrationAgent] Detected repeated questions (similarity: ${similarity.toFixed(2)})`);
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
    const words1 = msg1.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const words2 = msg2.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
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
  private applySafetyChecks(aiAnalysis: any, contextFactors: FrustrationAnalysis['contextFactors']): FrustrationAnalysis {
    const thresholds = { ...this.DEFAULT_THRESHOLDS, ...this.customThresholds };
    
    console.log('🛡️ [FrustrationAgent] Applying safety checks...');
    console.log(`📊 AI analysis - level: ${aiAnalysis.frustration_level}, confidence: ${aiAnalysis.confidence}`);
    
    // Parse AI result with checks
    const frustrationLevel = Math.max(0, Math.min(1, aiAnalysis.frustration_level || 0));
    const confidenceScore = Math.max(0, Math.min(1, aiAnalysis.confidence || 0));
    const detectedPatterns = Array.isArray(aiAnalysis.patterns) ? aiAnalysis.patterns : [];
    const triggerPhrases = Array.isArray(aiAnalysis.triggers) ? aiAnalysis.triggers : [];
    
    // 🚨 KEY CHECK: Should we escalate?
    let shouldEscalate = false;
    let escalationReason = '';
    
    // Check 1: Is the frustration level high enough?
    if (frustrationLevel < thresholds.minimumFrustrationLevel) {
      console.log(`⚡ [Safety] Frustration level ${frustrationLevel.toFixed(2)} is below threshold ${thresholds.minimumFrustrationLevel}`);
    } 
    // Check 2: Is the AI confident enough?
    else if (confidenceScore < thresholds.minimumConfidence) {
      console.log(`⚡ [Safety] AI confidence ${confidenceScore.toFixed(2)} is below threshold ${thresholds.minimumConfidence}`);
    }
    // Check 3: Are there enough triggers?
    else if (triggerPhrases.length < thresholds.minimumTriggers) {
      console.log(`⚡ [Safety] Trigger count ${triggerPhrases.length} is below minimum ${thresholds.minimumTriggers}`);
    }
    // Check 4: Are there contextual factors?
    else if (!contextFactors.hasSwearing && !contextFactors.repeatedQuestions && contextFactors.negativeKeywordsCount < 2) {
      console.log(`⚡ [Safety] Not enough contextual factors to escalate`);
    }
    // ✅ ALL CHECKS PASSED - ESCALATION IS POSSIBLE
    else {
      shouldEscalate = true;
      escalationReason = `High frustration level (${frustrationLevel.toFixed(2)}) with AI confidence ${confidenceScore.toFixed(2)}. Detected triggers: ${triggerPhrases.join(', ')}`;
      
      console.log('🚨 [FrustrationAgent] ESCALATION RECOMMENDED!');
      console.log(`📋 Reason: ${escalationReason}`);
    }

    return {
      frustrationLevel,
      confidenceScore,
      detectedPatterns,
      triggerPhrases,
      contextFactors,
      shouldEscalate,
      escalationReason
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

      const { error } = await supabase
        .from('frustration_analysis')
        .insert({
          session_id: sessionId,
          message_id: lastMessage?.id || null,
          frustration_level: analysis.frustrationLevel,
          confidence_score: analysis.confidenceScore,
          detected_patterns: analysis.detectedPatterns,
          trigger_phrases: analysis.triggerPhrases,
          context_factors: analysis.contextFactors,
          should_escalate: analysis.shouldEscalate,
          escalation_reason: analysis.escalationReason,
          processing_time_ms: processingTimeMs
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
          p_new_frustration_incident: true
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
      confidenceScore: 0.0,  // Zero confidence
      detectedPatterns: [],
      triggerPhrases: [],
      contextFactors: {
        repeatedQuestions: false,
        sessionDuration: 0,
        messageCount: 0,
        negativeKeywordsCount: 0,
        hasSwearing: false
      },
      shouldEscalate: false, // NEVER escalate on error
      escalationReason: 'Analysis error - escalation blocked for safety reasons'
    };
  }
} 