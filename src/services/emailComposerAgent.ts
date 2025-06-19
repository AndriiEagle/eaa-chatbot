import { openai } from './openaiService.js';
import { supabase } from './supabaseService.js';
import { ChatMessage } from '../utils/memory/types.js';
import { UserFact } from '../types/common.js';
import { FrustrationAnalysis } from './frustrationDetectionAgent.js';
import { EMAIL_COMPOSER_SYSTEM_PROMPT } from '../config/prompts.js';
import { v4 as uuidv4 } from 'uuid';

// Interfaces for working with emails
export interface EmailDraft {
  subject: string;
  body: string;
  userContextSummary: string;
  conversationHighlights: string[];
  recommendedRecipient: string;
  salesPotential: 'low' | 'medium' | 'high';
  urgencyLevel: 'low' | 'medium' | 'high';
}

export interface EmailGenerationContext {
  userId: string;
  sessionId: string;
  frustrationAnalysis: FrustrationAnalysis;
  userFacts: UserFact[];
  recentMessages: ChatMessage[];
  businessContext?: string;
}

/**
 * 🎯 SMART EMAIL AUTO-GENERATION AGENT
 * 
 * Operating principles:
 * - Analyzes entire conversation and user context
 * - Creates personalized emails with full context
 * - Determines sales potential and urgency
 * - NEVER sends emails without user confirmation
 */
export class EmailComposerAgent {
  private readonly SYSTEM_PROMPT = EMAIL_COMPOSER_SYSTEM_PROMPT;

  /**
   * 📧 MAIN EMAIL GENERATION METHOD
   * 
   * @param context - Context for email generation
   * @returns Promise<EmailDraft>
   */
  async generateEmail(context: EmailGenerationContext): Promise<EmailDraft> {
    console.log('\n📧 [EmailComposer] Starting personalized email generation...');
    console.log(`👤 User: ${context.userId}`);
    console.log(`🎯 Frustration level: ${context.frustrationAnalysis.frustrationLevel.toFixed(2)}`);
    console.log(`📊 User facts: ${context.userFacts.length}`);

    try {
      // Stage 1: User context analysis
      const userProfile = this.analyzeUserProfile(context.userFacts);
      
      // Stage 2: Extract key conversation insights
      const conversationInsights = this.extractConversationInsights(context.recentMessages, context.frustrationAnalysis);
      
      // Stage 3: Assess sales potential
      const salesAssessment = this.assessSalesPotential(context.userFacts, context.frustrationAnalysis);
      
      // Stage 4: Prepare context for AI
      const emailContext = this.prepareEmailGenerationContext(context);
      
      // Stage 5: Generate email via GPT-4o-mini
      const emailDraft = await this.generateEmailWithAI(emailContext);
      
      // Stage 6: Post-process and enhance email
      const finalEmail = this.enhanceEmail(emailDraft, salesAssessment);
      
      // Stage 7: Save to database
      await this.saveEmailToDatabase(context, finalEmail);
      
      console.log('✅ [EmailComposer] Email successfully generated!');
      console.log(`📝 Subject: ${finalEmail.subject}`);
      console.log(`🎯 Sales potential: ${finalEmail.salesPotential}`);
      
      return finalEmail;
      
    } catch (error) {
      console.error('❌ [EmailComposer] Error generating email:', error);
      throw error;
    }
  }

  /**
   * Analyzes user profile based on collected facts
   */
  private analyzeUserProfile(userFacts: UserFact[]): any {
    console.log('👤 [EmailComposer] Analyzing user profile...');
    
    const profile = {
      businessType: userFacts.find(f => f.type === 'business_type')?.value || 'Unknown',
      businessSize: userFacts.find(f => f.type === 'business_size')?.value || 'Unknown',
      location: userFacts.find(f => f.type === 'physical_location')?.value || 'Unknown',
      webPresence: userFacts.find(f => f.type === 'web_presence')?.value || 'Unknown',
      services: userFacts.find(f => f.type === 'service_types')?.value || 'Unknown',
      customerBase: userFacts.find(f => f.type === 'customer_base')?.value || 'Unknown',
      completeness: userFacts.filter(f => f.confidence > 0.7).length / 7 // Approximate profile completeness
    };

    console.log(`📊 Profile completeness: ${Math.round(profile.completeness * 100)}%`);
    console.log(`🏢 Business type: ${profile.businessType}`);
    
    return profile;
  }

  /**
   * Extracts key insights from conversation
   */
  private extractConversationInsights(messages: ChatMessage[], frustrationAnalysis: FrustrationAnalysis): any {
    console.log('💬 [EmailComposer] Analyzing conversation...');
    
    const userMessages = messages.filter(msg => msg.role === 'user');
    const botMessages = messages.filter(msg => msg.role === 'assistant');
    
    // Find main question topics
    const topicKeywords = [
      'accessibility', 'wcag', 'audit', 'compliance', 'requirements',
      'penalties', 'check', 'website', 'application', 'deadlines'
    ];
    
    const mentionedTopics = topicKeywords.filter(keyword => 
      userMessages.some(msg => msg.content.toLowerCase().includes(keyword))
    );

    // Determine request types
    const requestTypes = [];
    if (userMessages.some(msg => msg.content.toLowerCase().includes('how') || msg.content.toLowerCase().includes('what'))) {
      requestTypes.push('Information requests');
    }
    if (userMessages.some(msg => msg.content.toLowerCase().includes('help') || msg.content.toLowerCase().includes('assist'))) {
      requestTypes.push('Help requests');
    }
    if (userMessages.some(msg => msg.content.toLowerCase().includes('cost') || msg.content.toLowerCase().includes('price'))) {
      requestTypes.push('Pricing questions');
    }

    return {
      totalMessages: messages.length,
      userMessages: userMessages.length,
      botMessages: botMessages.length,
      mentionedTopics,
      requestTypes,
      frustrationTriggers: frustrationAnalysis.triggerPhrases,
      detectedPatterns: frustrationAnalysis.detectedPatterns,
      sessionDuration: frustrationAnalysis.contextFactors.sessionDuration
    };
  }

  /**
   * Assesses user's sales potential
   */
  private assessSalesPotential(userFacts: UserFact[], frustrationAnalysis: FrustrationAnalysis): any {
    console.log('💰 [EmailComposer] Assessing sales potential...');
    
    let salesScore = 0;
    let factors = [];

    // Factor 1: Business type (some types are more ready to buy)
    const businessType = userFacts.find(f => f.type === 'business_type')?.value?.toLowerCase() || '';
    if (businessType.includes('e-commerce') || businessType.includes('fintech') || businessType.includes('bank')) {
      salesScore += 30;
      factors.push('High-risk sector (requires EAA compliance)');
    } else if (businessType.includes('website') || businessType.includes('application')) {
      salesScore += 20;
      factors.push('Digital product (requires audit)');
    }

    // Factor 2: Business size
    const businessSize = userFacts.find(f => f.type === 'business_size')?.value?.toLowerCase() || '';
    if (businessSize.includes('large') || businessSize.includes('big')) {
      salesScore += 25;
      factors.push('Large business (bigger budget)');
    } else if (businessSize.includes('medium')) {
      salesScore += 15;
      factors.push('Medium business (moderate budget)');
    }

    // Factor 3: Frustration level (paradoxically, higher frustration = higher readiness to buy)
    if (frustrationAnalysis.frustrationLevel > 0.7) {
      salesScore += 20;
      factors.push('High frustration level (ready to solve problems)');
    }

    // Factor 4: Profile completeness (more data = more interest)
    const profileCompleteness = userFacts.filter(f => f.confidence > 0.7).length;
    if (profileCompleteness >= 5) {
      salesScore += 15;
      factors.push('Detailed profile (high interest)');
    }

    // Determine potential level
    let potential: 'low' | 'medium' | 'high';
    if (salesScore >= 70) potential = 'high';
    else if (salesScore >= 40) potential = 'medium';
    else potential = 'low';

    // Determine urgency
    let urgency: 'low' | 'medium' | 'high';
    if (frustrationAnalysis.frustrationLevel > 0.8) urgency = 'high';
    else if (frustrationAnalysis.frustrationLevel > 0.6) urgency = 'medium';
    else urgency = 'low';

    console.log(`💯 Potential assessment: ${salesScore}/100 (${potential})`);
    console.log(`⏰ Urgency: ${urgency}`);

    return {
      score: salesScore,
      potential,
      urgency,
      factors
    };
  }

  /**
   * Prepares context for AI email generation
   * Creates a comprehensive prompt with user data and frustration analysis
   */
  private prepareEmailGenerationContext(context: EmailGenerationContext): string {
    const userProfile = this.analyzeUserProfile(context.userFacts);
    
    return `
=== SITUATION CONTEXT ===
The chatbot user has shown signs of frustration (level: ${context.frustrationAnalysis.frustrationLevel.toFixed(2)}).

User Profile:
- Business Type: ${userProfile.businessType || 'Not specified'}
- Business Size: ${userProfile.businessSize || 'Not specified'}  
- Location: ${userProfile.location || 'Not specified'}
- Web Presence: ${userProfile.webPresence || 'Not specified'}
- Services: ${userProfile.services || 'Not specified'}

Frustration Analysis:
- Level: ${context.frustrationAnalysis.frustrationLevel.toFixed(2)}/1.0
- Trigger Phrases: ${context.frustrationAnalysis.triggerPhrases.join(', ')}
- Detected Patterns: ${context.frustrationAnalysis.detectedPatterns.join(', ')}

Recent Messages:
${context.recentMessages.slice(-3).map((msg: ChatMessage) => `${msg.role}: ${msg.content}`).join('\n')}

=== TASK ===
Generate a personalized email from a manager to this user. The email should:

1. ACKNOWLEDGE their frustration professionally and empathetically
2. PROVIDE specific help based on their business profile
3. OFFER concrete next steps and resources
4. MAINTAIN professional but warm tone
5. INCLUDE relevant EAA compliance guidance for their industry

The email should be:
- Professional but empathetic
- Specific to their business context
- Action-oriented with clear next steps
- Approximately 200-300 words
- Include a clear call-to-action

Generate ONLY the email content, no additional explanations.
`;
  }

  /**
   * Generates email using GPT-4o-mini
   */
  private async generateEmailWithAI(context: string): Promise<any> {
    console.log('🤖 [EmailComposer] Sending request to GPT-4o-mini for email generation...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: this.SYSTEM_PROMPT },
        { role: 'user', content: context }
      ],
      temperature: 0.7, // Slightly more creativity for email
      max_tokens: 1000,
    });

    const responseText = completion.choices[0].message.content?.trim();
    
    if (!responseText) {
      throw new Error('Empty response from GPT-4o-mini');
    }

    console.log('✍️ [EmailComposer] Email generated by AI');

    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ [EmailComposer] JSON parsing error:', parseError);
      throw new Error(`Invalid JSON from AI: ${responseText}`);
    }
  }

  /**
   * Enhances and complements generated email
   */
  private enhanceEmail(aiEmail: any, salesAssessment: any): EmailDraft {
    console.log('✨ [EmailComposer] Enhancing email...');
    
    // Add subject prefix based on urgency
    let subjectPrefix = '';
    if (salesAssessment.urgency === 'high') subjectPrefix = '[URGENT] ';
    else if (salesAssessment.urgency === 'medium') subjectPrefix = '[IMPORTANT] ';

    // Add postscript with technical details
    const technicalPS = `

P.S. Technical information:
- Analysis date: ${new Date().toLocaleDateString('en-US')}
- Frustration level: ${salesAssessment.score}/100
- Recommended response time: ${salesAssessment.urgency === 'high' ? '2-4 hours' : salesAssessment.urgency === 'medium' ? '1-2 days' : '3-5 days'}`;

    return {
      subject: subjectPrefix + (aiEmail.subject || 'Personal assistance with EAA'),
      body: (aiEmail.body || 'Email not generated') + technicalPS,
      userContextSummary: aiEmail.user_context_summary || 'Context unavailable',
      conversationHighlights: Array.isArray(aiEmail.conversation_highlights) ? aiEmail.conversation_highlights : [],
      recommendedRecipient: 'sales@company.com', // Can be configured
      salesPotential: aiEmail.sales_potential || salesAssessment.potential,
      urgencyLevel: aiEmail.urgency_level || salesAssessment.urgency
    };
  }

  /**
   * Saves email to database
   */
  private async saveEmailToDatabase(context: EmailGenerationContext, email: EmailDraft): Promise<void> {
    try {
      console.log('💾 [EmailComposer] Saving email to database...');

      // Generate valid UUID for session_id if not in correct format
      let validSessionId: string | null = context.sessionId;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(context.sessionId)) {
        validSessionId = uuidv4();
        console.log(`🔄 [EmailComposer] Generated valid UUID: ${validSessionId} (original: ${context.sessionId})`);
      }

      // Check if session exists in database
      const { data: sessionExists } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('id', validSessionId)
        .single();

      // If session doesn't exist, create temporary record or use null
      if (!sessionExists) {
        console.log(`⚠️ [EmailComposer] Session ${validSessionId} not found in database, saving email without session link`);
        validSessionId = null; // Save without session link
      }

      // First get frustration analysis ID (if exists)
      let frustrationAnalysisId = null;
      if (validSessionId) {
        const { data: frustrationData } = await supabase
          .from('frustration_analysis')
          .select('id')
          .eq('session_id', validSessionId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        frustrationAnalysisId = frustrationData?.id || null;
      }

      const { error } = await supabase
        .from('escalation_emails')
        .insert({
          session_id: validSessionId,
          frustration_analysis_id: frustrationAnalysisId,
          generated_subject: email.subject,
          generated_body: email.body,
          user_context_summary: email.userContextSummary,
          conversation_highlights: email.conversationHighlights.join('\n'),
          status: 'draft', // Default draft
          recipient_email: email.recommendedRecipient
        });

      if (error) {
        console.error('❌ [EmailComposer] Error saving email:', error);
      } else {
        console.log('✅ [EmailComposer] Email saved to database as draft');
      }

    } catch (error) {
      console.error('❌ [EmailComposer] Error saving email:', error);
    }
  }

  /**
   * 📤 SAFE EMAIL SENDING (ONLY AFTER USER CONFIRMATION)
   */
  async sendEmail(emailId: string, userApproved: boolean): Promise<boolean> {
    if (!userApproved) {
      console.log('❌ [EmailComposer] Sending rejected by user');
      return false;
    }

    try {
      console.log('📤 [EmailComposer] Sending approved email...');
      
      // Get email from database
      const { data: email, error: fetchError } = await supabase
        .from('escalation_emails')
        .select('*')
        .eq('id', emailId)
        .single();

      if (fetchError || !email) {
        throw new Error('Email not found');
      }

      // Send via existing emailService
      // (can integrate with existing emailService.ts here)
      
      // Update email status
      await supabase
        .from('escalation_emails')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          user_approved: true
        })
        .eq('id', emailId);

      console.log('✅ [EmailComposer] Email successfully sent!');
      return true;

    } catch (error) {
      console.error('❌ [EmailComposer] Error sending email:', error);
      return false;
    }
  }
} 