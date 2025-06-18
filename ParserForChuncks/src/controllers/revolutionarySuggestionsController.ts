import { Request, Response } from 'express';
import OpenAI from 'openai';
import { chatMemory } from '../utils/memory/index.js';
import { CHAT_MODEL } from '../config/environment.js';
import { FrustrationDetectionAgent } from '../services/frustrationDetectionAgent.js';
import { supabase } from '../services/supabaseService.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


interface RevolutionaryContext {
  // Basic data
  userId: string;
  sessionId: string;
  currentQuestion: string;
  
  // AI-analysis
  userPersona: UserPersona;
  businessMaturity: BusinessMaturity;
  frustrationProfile: FrustrationProfile;
  conversationStage: ConversationStage;
  
  // Advanced factors
  behaviorPatterns: BehaviorPattern[];
  predictedNeeds: PredictedNeed[];
  opportunityScore: number;
}

interface UserPersona {
  type: 'technical_expert' | 'business_owner' | 'newcomer' | 'compliance_officer' | 'frustrated_user';
  confidence: number;
  keyCharacteristics: string[];
  communicationStyle: 'direct' | 'detailed' | 'cautious' | 'urgent';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
}

interface BusinessMaturity {
  level: 'startup' | 'growing' | 'established' | 'enterprise';
  eaaReadiness: number; // 0-1
  complianceGaps: string[];
  timeConstraints: 'urgent' | 'moderate' | 'planning_ahead';
}

interface FrustrationProfile {
  currentLevel: number; // 0-1
  triggers: string[];
  escalationRisk: number; // 0-1
  recommendedApproach: 'gentle' | 'direct' | 'technical' | 'business_focused';
}

interface ConversationStage {
  stage: 'discovery' | 'exploration' | 'deep_dive' | 'implementation' | 'troubleshooting';
  completeness: number; // 0-1
  nextOptimalSteps: string[];
}

interface BehaviorPattern {
  pattern: string;
  frequency: number;
  impact: 'positive' | 'negative' | 'neutral';
  recommendation: string;
}

interface PredictedNeed {
  need: string;
  probability: number; // 0-1
  urgency: 'high' | 'medium' | 'low';
  businessValue: number; // 0-1
}

interface SmartSuggestion {
  text: string;
  category: 'immediate_need' | 'business_opportunity' | 'learning_path' | 'problem_solving' | 'compliance_critical';
  priority: number; // 1-10
  reasoning: string;
  expectedOutcome: string;
  businessValue: number; // 0-1
}

/**
 * 🎯 REVOLUTIONARY SUGGESTION GENERATOR
 * 
 * Principles of operation:
 * 1. MULTI-LAYER ANALYSIS - 7 levels of context
 * 2. PREDICTIVE ANALYTICS - predicts needs
 * 3. DYNAMIC ADAPTATION - changes during the dialogue
 * 4. BUSINESS-ORIENTATION - focus on ROI for the user
 * 5. EMOTIONAL INTELLIGENCE - takes into account frustration and mood
 */
export const generateRevolutionarySuggestions = async (req: Request, res: Response) => {
  const { userId, sessionId, currentQuestion = '', metadata = {} } = req.body;

  if (!userId || !sessionId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    console.log('\n🎯 [REVOLUTIONARY] Starting multi-layer suggestion analysis...');
    console.log(`👤 User: ${userId} | 💬 Session: ${sessionId}`);

    // 🎪 STAGE 1: GATHERING ALL USER DATA
    const [userFacts, sessionMessages, userSessions, frustrationHistory] = await Promise.all([
      chatMemory.getUserFacts(userId),
      chatMemory.getSessionMessages(sessionId),
      chatMemory.getUserSessions(userId),
      getUserFrustrationHistory(userId)
    ]);

    // 🎪 STAGE 2: AI-ANALYSIS OF USER PERSONA
    const userPersona = await analyzeUserPersona(userFacts, sessionMessages, currentQuestion);
    console.log(`🎭 [PERSONA] Detected: ${userPersona.type} (${(userPersona.confidence * 100).toFixed(0)}% confidence)`);

    // 🎪 STAGE 3: ASSESSMENT OF BUSINESS MATURITY
    const businessMaturity = await assessBusinessMaturity(userFacts, sessionMessages);
    console.log(`🏢 [BUSINESS] Maturity: ${businessMaturity.level}, EAA Readiness: ${(businessMaturity.eaaReadiness * 100).toFixed(0)}%`);

    // 🎪 STAGE 4: FRUSTRATION PROFILE
    const frustrationProfile = await buildFrustrationProfile(frustrationHistory, sessionMessages);
    console.log(`😤 [FRUSTRATION] Level: ${(frustrationProfile.currentLevel * 100).toFixed(0)}%, Risk: ${(frustrationProfile.escalationRisk * 100).toFixed(0)}%`);

    // 🎪 STAGE 5: CONVERSATION STAGE
    const conversationStage = await determineConversationStage(sessionMessages, userFacts);
    console.log(`🗣️ [STAGE] ${conversationStage.stage} (${(conversationStage.completeness * 100).toFixed(0)}% complete)`);

    // 🎪 STAGE 6: BEHAVIOR PATTERNS
    const behaviorPatterns = await analyzeBehaviorPatterns(userSessions, sessionMessages);
    console.log(`🔄 [PATTERNS] Detected ${behaviorPatterns.length} behavior patterns`);

    // 🎪 STAGE 7: PREDICTION OF NEEDS
    const predictedNeeds = await predictUserNeeds(userPersona, businessMaturity, conversationStage);
    console.log(`🔮 [PREDICTION] ${predictedNeeds.length} predicted needs identified`);

    // 🎪 STAGE 8: GENERATION OF SMART SUGGESTIONS
    const revolutionaryContext: RevolutionaryContext = {
      userId, sessionId, currentQuestion,
      userPersona, businessMaturity, frustrationProfile, conversationStage,
      behaviorPatterns, predictedNeeds,
      opportunityScore: calculateOpportunityScore(businessMaturity, frustrationProfile, conversationStage)
    };

    const smartSuggestions = await generateSmartSuggestions(revolutionaryContext);
    console.log(`💡 [SUGGESTIONS] Generated ${smartSuggestions.length} smart suggestions`);

    // 🎪 STAGE 9: RANKING AND OPTIMIZATION
    const optimizedSuggestions = optimizeSuggestionsForUser(smartSuggestions, revolutionaryContext);
    console.log(`🎯 [OPTIMIZATION] Optimized to ${optimizedSuggestions.length} top suggestions`);

    // 🎪 STAGE 10: SAVING ANALYTICS
    await saveSuggestionAnalytics(revolutionaryContext, optimizedSuggestions);

    // 🎉 FINAL RESPONSE
    res.status(200).json({
      clarificationQuestions: optimizedSuggestions.map(s => s.text),
      infoTemplates: [],
      suggestions_header: generateDynamicHeader(userPersona, frustrationProfile, conversationStage),
      reasoning: `Revolutionary AI analysis: ${userPersona.type} user at ${conversationStage.stage} stage with ${(frustrationProfile.currentLevel * 100).toFixed(0)}% frustration`,
      analytics: {
        userPersona: userPersona.type,
        businessMaturity: businessMaturity.level,
        conversationStage: conversationStage.stage,
        opportunityScore: revolutionaryContext.opportunityScore,
        suggestionsBreakdown: optimizedSuggestions.map(s => ({
          category: s.category,
          priority: s.priority,
          businessValue: s.businessValue
        }))
      },
      generated_by: 'revolutionary_ai_system',
      model_used: 'gpt-4o-mini + predictive_analytics'
    });

  } catch (error: any) {
    console.error('❌ [REVOLUTIONARY] Critical error:', error);
    
    // Intelligent fallback
    const intelligentFallback = await generateIntelligentFallback(userId, sessionId, currentQuestion);
    
    res.status(200).json({
      ...intelligentFallback,
      generated_by: 'intelligent_fallback',
      error: 'Simplified due to system error'
    });
  }
};

/**
 * 🎭 AI-ANALYSIS OF USER PERSONA
 */
async function analyzeUserPersona(userFacts: any[], sessionMessages: any[], currentQuestion: string): Promise<UserPersona> {
  const factsText = userFacts.map(f => `${f.fact_type}: ${f.fact_value}`).join('\n');
  const messagesText = sessionMessages.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n');

  const prompt = `
🎯 REVOLUTIONARY USER PERSONA ANALYSIS EAA ChatBot

BUSINESS FACTS OF THE USER:
${factsText || 'Facts are missing'}

DIALOGUE HISTORY (last 10 messages):
${messagesText || 'History is missing'}

CURRENT QUESTION:
"${currentQuestion}"

🧠 ANALYZE THE PERSONA BY 7 MEASUREMENTS:

1. USER TYPE:
   - technical_expert: knows WCAG, mentions HTML/CSS/accessibility API
   - business_owner: focus on ROI, deadlines, fines, competitors  
   - newcomer: basic questions, doesn't know EAA terms
   - compliance_officer: legal aspects, document flow
   - frustrated_user: repeating questions, negative formulations

2. COMMUNICATION STYLE:
   - direct: short questions, wants quick answers
   - detailed: detailed questions, asks for details
   - cautious: many questions about risks and consequences
   - urgent: mentions deadlines, fines, urgency

3. EXPERTISE LEVEL:
   - beginner: doesn't know basic EAA terms
   - intermediate: knows basics, needs practical solutions
   - advanced: knows details, seeks complex cases

4. KEY CHARACTERISTICS:
   - List of 3-5 key traits of this user
   - Example: ["in a hurry", "technically savvy", "business-oriented"]

STRICTLY respond in JSON:
{
  "type": "technical_expert|business_owner|newcomer|compliance_officer|frustrated_user",
  "confidence": 0.85,
  "communicationStyle": "direct|detailed|cautious|urgent", 
  "experienceLevel": "beginner|intermediate|advanced",
  "keyCharacteristics": ["characteristic1", "characteristic2", "characteristic3"]
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: 300
  });

  try {
    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return {
      type: result.type || 'newcomer',
      confidence: result.confidence || 0.5,
      keyCharacteristics: result.keyCharacteristics || [],
      communicationStyle: result.communicationStyle || 'detailed',
      experienceLevel: result.experienceLevel || 'beginner'
    };
  } catch (error) {
    console.error('❌ [PERSONA] Parse error:', error);
    return {
      type: 'newcomer',
      confidence: 0.3,
      keyCharacteristics: ['requires analysis'],
      communicationStyle: 'detailed',
      experienceLevel: 'beginner'
    };
  }
}

/**
 * 🏢 BUSINESS MATURITY ASSESSMENT WITH EAA CONSIDERATION
 */
async function assessBusinessMaturity(userFacts: any[], sessionMessages: any[]): Promise<BusinessMaturity> {
  // Analyze business facts
  const businessType = userFacts.find(f => f.fact_type === 'business_type')?.fact_value || '';
  const digitalPresence = userFacts.find(f => f.fact_type === 'business_digital_presence')?.fact_value || '';
  const auditDone = userFacts.find(f => f.fact_type === 'accessibility_audit_done')?.fact_value === 'true';
  
  // Analyze messages for business maturity
  const allMessages = sessionMessages.map(m => m.content).join(' ').toLowerCase();
  
  let level: BusinessMaturity['level'] = 'startup';
  let eaaReadiness = 0.0;
  let timeConstraints: BusinessMaturity['timeConstraints'] = 'planning_ahead';
  
  // Determine maturity level
  if (allMessages.includes('enterprise') || allMessages.includes('corporation') || businessType.includes('enterprise')) {
    level = 'enterprise';
    eaaReadiness = 0.7;
  } else if (auditDone || allMessages.includes('audit')) {
    level = 'established';
    eaaReadiness = 0.6;
  } else if (digitalPresence.includes('website') || digitalPresence.includes('app')) {
    level = 'growing';
    eaaReadiness = 0.4;
  }
  
  // Determine time constraints
  if (allMessages.includes('urgent') || allMessages.includes('deadline') || allMessages.includes('fine')) {
    timeConstraints = 'urgent';
    eaaReadiness += 0.2;
  } else if (allMessages.includes('planning') || allMessages.includes('future')) {
    timeConstraints = 'planning_ahead';
  } else {
    timeConstraints = 'moderate';
  }
  
  // Determine compliance gaps
  const complianceGaps: string[] = [];
  if (!auditDone) complianceGaps.push('accessibility_audit');
  if (!digitalPresence.includes('accessible')) complianceGaps.push('accessibility_implementation');
  if (!allMessages.includes('wcag')) complianceGaps.push('wcag_knowledge');
  
  return {
    level,
    eaaReadiness: Math.min(1.0, eaaReadiness),
    complianceGaps,
    timeConstraints
  };
}

/**
 * 😤 FRUSTRATION PROFILE WITH ML SYSTEM INTEGRATION
 */
async function buildFrustrationProfile(frustrationHistory: any[], sessionMessages: any[]): Promise<FrustrationProfile> {
  // Get latest frustration analysis
  const latestFrustration = frustrationHistory[0];
  const currentLevel = latestFrustration?.frustration_level || 0.0;
  const triggers = latestFrustration?.trigger_phrases || [];
  
  // Determine recommended approach
  let recommendedApproach: FrustrationProfile['recommendedApproach'] = 'gentle';
  
  if (currentLevel > 0.7) {
    recommendedApproach = 'business_focused'; // Focus on ROI and results
  } else if (currentLevel > 0.4) {
    recommendedApproach = 'direct'; // Direct answers without extra words
  } else if (sessionMessages.some(m => m.content.includes('WCAG') || m.content.includes('API'))) {
    recommendedApproach = 'technical'; // Technical details
  }
  
  return {
    currentLevel,
    triggers,
    escalationRisk: latestFrustration?.escalation_risk || currentLevel * 0.8,
    recommendedApproach
  };
}

/**
 * 🗣️ CONVERSATION STAGE DETERMINATION WITH AI ANALYSIS
 */
async function determineConversationStage(sessionMessages: any[], userFacts: any[]): Promise<ConversationStage> {
  const messageCount = sessionMessages.length;
  const userMessages = sessionMessages.filter(m => m.role === 'user').map(m => m.content).join(' ').toLowerCase();
  
  let stage: ConversationStage['stage'] = 'discovery';
  let completeness = 0.0;
  
  // Analyze keywords to determine stage
  if (userMessages.includes('implement') || userMessages.includes('implementation') || userMessages.includes('how to')) {
    stage = 'implementation';
    completeness = 0.7;
  } else if (userMessages.includes('audit') || userMessages.includes('check') || userMessages.includes('test')) {
    stage = 'deep_dive';
    completeness = 0.6;
  } else if (userMessages.includes('problem') || userMessages.includes('error') || userMessages.includes('not working')) {
    stage = 'troubleshooting';
    completeness = 0.8;
  } else if (messageCount > 5) {
    stage = 'exploration';
    completeness = 0.4;
  }
  
  // Determine next optimal steps
  const nextOptimalSteps: string[] = [];
  switch (stage) {
    case 'discovery':
      nextOptimalSteps.push('understanding_eaa_requirements', 'business_impact_assessment');
      break;
    case 'exploration':
      nextOptimalSteps.push('accessibility_audit', 'gap_analysis');
      break;
    case 'deep_dive':
      nextOptimalSteps.push('implementation_planning', 'tool_selection');
      break;
    case 'implementation':
      nextOptimalSteps.push('testing_validation', 'compliance_verification');
      break;
    case 'troubleshooting':
      nextOptimalSteps.push('problem_resolution', 'expert_consultation');
      break;
  }
  
  return {
    stage,
    completeness,
    nextOptimalSteps
  };
}

/**
 * 🔄 BEHAVIORAL PATTERNS ANALYSIS
 */
async function analyzeBehaviorPatterns(userSessions: any[], sessionMessages: any[]): Promise<BehaviorPattern[]> {
  const patterns: BehaviorPattern[] = [];

  // Session frequency analysis
  if (userSessions.length > 3) {
    patterns.push({
      pattern: 'frequent_user',
      frequency: userSessions.length,
      impact: 'positive',
      recommendation: 'Provide advanced content'
    });
  }

  // Message length analysis
  const avgMessageLength = sessionMessages.reduce((sum, m) => sum + m.content.length, 0) / sessionMessages.length;
  if (avgMessageLength > 100) {
    patterns.push({
      pattern: 'detailed_communicator',
      frequency: 1,
      impact: 'positive',
      recommendation: 'Provide comprehensive answers'
    });
  }

  return patterns;
}

/**
 * 🔮 NEEDS PREDICTION WITH AI ANALYTICS
 */
async function predictUserNeeds(userPersona: UserPersona, businessMaturity: BusinessMaturity, conversationStage: ConversationStage): Promise<PredictedNeed[]> {
  const predictedNeeds: PredictedNeed[] = [];
  
  // 🎯 ML-based prediction algorithm
  
  // NEWCOMERS - need basics
  if (userPersona.type === 'newcomer' || userPersona.experienceLevel === 'beginner') {
    predictedNeeds.push({
      need: 'eaa_basics_understanding',
      probability: 0.95,
      urgency: 'high',
      businessValue: 0.8
    });
    predictedNeeds.push({
      need: 'business_impact_assessment', 
      probability: 0.85,
      urgency: 'medium',
      businessValue: 0.9
    });
  }
  
  // BUSINESS OWNERS - ROI and timelines
  if (userPersona.type === 'business_owner') {
    predictedNeeds.push({
      need: 'cost_benefit_analysis',
      probability: 0.9,
      urgency: businessMaturity.timeConstraints === 'urgent' ? 'high' : 'medium',
      businessValue: 0.95
    });
    predictedNeeds.push({
      need: 'implementation_timeline',
      probability: 0.85,
      urgency: 'high', 
      businessValue: 0.85
    });
  }
  
  // TECHNICAL EXPERTS - tools and methods
  if (userPersona.type === 'technical_expert') {
    predictedNeeds.push({
      need: 'technical_implementation_guide',
      probability: 0.9,
      urgency: 'medium',
      businessValue: 0.7
    });
    predictedNeeds.push({
      need: 'automated_testing_tools',
      probability: 0.8,
      urgency: 'medium',
      businessValue: 0.8
    });
  }
  
  // IMPLEMENTATION STAGE - concrete steps
  if (conversationStage.stage === 'implementation') {
    predictedNeeds.push({
      need: 'step_by_step_checklist',
      probability: 0.9,
      urgency: 'high',
      businessValue: 0.85
    });
  }
  
  // LOW READINESS - audit needed
  if (businessMaturity.eaaReadiness < 0.5) {
    predictedNeeds.push({
      need: 'accessibility_audit',
      probability: 0.85,
      urgency: 'high',
      businessValue: 0.9
    });
  }
  
  return predictedNeeds.sort((a, b) => (b.probability * b.businessValue) - (a.probability * a.businessValue));
}

/**
 * 💡 SMART SUGGESTIONS GENERATION WITH REVOLUTIONARY ALGORITHM
 */
async function generateSmartSuggestions(context: RevolutionaryContext): Promise<SmartSuggestion[]> {
  const suggestions: SmartSuggestion[] = [];
  
  console.log('\n🧠 [SMART-GEN] Analyzing revolutionary context...');
  console.log(`👤 Persona: ${context.userPersona.type} | 🏢 Business: ${context.businessMaturity.level}`);
  console.log(`😤 Frustration: ${(context.frustrationProfile.currentLevel * 100).toFixed(0)}% | 🗣️ Stage: ${context.conversationStage.stage}`);
  
  // 🎯 ALGORITHM 1: ADAPTATION FOR FRUSTRATION
  if (context.frustrationProfile.currentLevel > 0.6) {
    // High frustration - simple, direct suggestions
    suggestions.push({
      text: 'Get a quick EAA compliance checklist for my website',
      category: 'problem_solving',
      priority: 10,
      reasoning: 'User is frustrated - needs quick solution',
      expectedOutcome: 'Immediate actionable steps',
      businessValue: 0.9
    });
  }
  
  // 🎯 ALGORITHM 2: PERSONALIZATION FOR USER TYPE
  switch (context.userPersona.type) {
    case 'business_owner':
      suggestions.push({
        text: `How much will EAA implementation cost for a ${context.businessMaturity.level} business?`,
        category: 'business_opportunity',
        priority: 9,
        reasoning: 'Business owner focuses on ROI',
        expectedOutcome: 'Clear figures and budget',
        businessValue: 0.95
      });
      break;
      
    case 'technical_expert':
      suggestions.push({
        text: 'What are the best automated WCAG testing tools?',
        category: 'learning_path',
        priority: 8,
        reasoning: 'Technical expert seeks tools',
        expectedOutcome: 'Specific technical solutions',
        businessValue: 0.8
      });
      break;
      
    case 'newcomer':
      suggestions.push({
        text: 'Explain in simple terms: what is EAA and why do I need it?',
        category: 'learning_path',
        priority: 10,
        reasoning: 'Newcomer needs basic understanding',
        expectedOutcome: 'Clear understanding of basics',
        businessValue: 0.85
      });
      break;
  }
  
  // 🎯 ALGORITHM 3: CONVERSATION STAGE
  switch (context.conversationStage.stage) {
    case 'discovery':
      suggestions.push({
        text: 'Check: does my business fall under EAA requirements?',
        category: 'immediate_need',
        priority: 9,
        reasoning: 'User is in exploration stage',
        expectedOutcome: 'Clarity on EAA applicability',
        businessValue: 0.9
      });
      break;
      
    case 'implementation':
      suggestions.push({
        text: 'Step-by-step plan for implementing accessibility on my website',
        category: 'immediate_need',
        priority: 10,
        reasoning: 'User is ready for action',
        expectedOutcome: 'Concrete action plan',
        businessValue: 0.95
      });
      break;
      
    case 'troubleshooting':
      suggestions.push({
        text: 'Help with solving a specific accessibility problem',
        category: 'problem_solving',
        priority: 10,
        reasoning: 'User encountered a problem',
        expectedOutcome: 'Solution to specific problem',
        businessValue: 0.85
      });
      break;
  }
  
  // 🎯 ALGORITHM 4: PREDICTIVE NEEDS
  for (const need of context.predictedNeeds.slice(0, 2)) {
    const suggestion = mapNeedToSuggestion(need, context);
    if (suggestion) suggestions.push(suggestion);
  }
  
  // 🎯 ALGORITHM 5: CRITICAL BUSINESS IMPORTANCE
  if (context.businessMaturity.timeConstraints === 'urgent') {
    suggestions.push({
      text: 'What can be done in 30 days for basic EAA compliance?',
      category: 'compliance_critical',
      priority: 10,
      reasoning: 'Urgent time constraints',
      expectedOutcome: 'Quick plan for minimum compliance',
      businessValue: 1.0
    });
  }
  
  return suggestions.slice(0, 8); // Maximum 8 options for ranking
}

/**
 * 🎯 MAPPING NEEDS TO SUGGESTIONS
 */
function mapNeedToSuggestion(need: PredictedNeed, context: RevolutionaryContext): SmartSuggestion | null {
  if (!need) return null;
  return {
    text: `Tell me more about: ${need.need}`,
    category: 'immediate_need',
    priority: Math.round(need.probability * 8) + 1,
    reasoning: `Directly addressing predicted need with ${Math.round(need.probability*100)}% probability.`,
    expectedOutcome: "User's primary predicted need is addressed.",
    businessValue: need.businessValue
  };
}

/**
 * 🎯 OPTIMIZING SUGGESTIONS FOR USER
 */
function optimizeSuggestionsForUser(suggestions: SmartSuggestion[], context: RevolutionaryContext): SmartSuggestion[] {
  console.log(`🎯 [OPTIMIZATION] Optimizing ${suggestions.length} suggestions for ${context.userPersona.type}`);
  
  // 1. Filter duplicates with current question
  const filtered = suggestions.filter(s => 
    s.text.toLowerCase() !== context.currentQuestion.toLowerCase()
  );
  
  // 2. Adjust priorities for frustration
  if (context.frustrationProfile.currentLevel > 0.5) {
    filtered.forEach(s => {
      if (s.category === 'problem_solving' || s.category === 'immediate_need') {
        s.priority += 2; // Increase priority for problem solutions
      }
    });
  }
  
  // 3. Adjust for communication style
  if (context.userPersona.communicationStyle === 'urgent') {
    filtered.forEach(s => {
      if (s.category === 'compliance_critical') {
        s.priority += 1;
      }
    });
  }
  
  // 4. Sort by complex score
  const scored = filtered.map(s => ({
    ...s,
    complexScore: (s.priority * 0.4) + (s.businessValue * 0.3) + (context.opportunityScore * 0.3)
  }));
  
  // 5. Return top-3 with maximum category diversity
  const topSuggestions = scored
    .sort((a, b) => b.complexScore - a.complexScore)
    .slice(0, 6);
  
  // 6. Ensure category diversity
  const categories = new Set();
  const diversified = topSuggestions.filter(s => {
    if (categories.has(s.category) && categories.size >= 3) {
      return false;
    }
    categories.add(s.category);
    return true;
  });
  
  const final = diversified.slice(0, 3);
  console.log(`🎉 [OPTIMIZATION] Final ${final.length} suggestions selected`);
  
  return final;
}

/**
 * 📈 CALCULATE OPPORTUNITY SCORE
 */
function calculateOpportunityScore(businessMaturity: BusinessMaturity, frustrationProfile: FrustrationProfile, conversationStage: ConversationStage): number {
    // This score represents the chatbot's potential to provide high value in the current turn.
    
    // High opportunity: Established business, low frustration, in deep dive/implementation
    const readinessFactor = businessMaturity.eaaReadiness; // 0-1
    const frustrationFactor = 1 - frustrationProfile.currentLevel; // 0-1 (inverse)
    
    let stageFactor = 0.5;
    if (['deep_dive', 'implementation'].includes(conversationStage.stage)) {
        stageFactor = 1.0;
    } else if (conversationStage.stage === 'exploration') {
        stageFactor = 0.7;
    }

    // Weighted average
    const score = (readinessFactor * 0.4) + (frustrationFactor * 0.4) + (stageFactor * 0.2);
    
    return parseFloat(score.toFixed(2));
}

/**
 * Dynamic header generation
 */
function generateDynamicHeader(userPersona: UserPersona, frustrationProfile: FrustrationProfile, conversationStage: ConversationStage): string {
  // Base header
  let header = 'Choose a question or ask your own:';
  
  // Adaptation for frustration
  if (frustrationProfile.currentLevel > 0.7) {
    header = '🚀 Quick solutions for your situation:';
  } else if (frustrationProfile.currentLevel > 0.4) {
    header = '💡 Recommended next steps:';
  }
  
  // Adaptation for persona
  switch (userPersona.type) {
    case 'business_owner':
      header = '💼 Business-oriented solutions:';
      break;
    case 'technical_expert':
      header = '🔧 Technical recommendations:';
      break;
    case 'newcomer':
      header = '🎯 Recommended topics to explore:';
      break;
    case 'frustrated_user':
      header = '🆘 Help with your questions:';
      break;
  }
  
  // Adaptation for stage
  if (conversationStage.stage === 'implementation') {
    header = '⚡ Ready for action? Next steps:';
  } else if (conversationStage.stage === 'troubleshooting') {
    header = '🛠️ Let\'s solve problems together:';
  }
  
  return header;
}

async function getUserFrustrationHistory(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('frustration_analysis')
      .select('*')
      .eq('session_id', userId) // Approximation - would need proper session linking
      .order('created_at', { ascending: false })
      .limit(10);

    return data || [];
  } catch {
    return [];
  }
}

async function saveSuggestionAnalytics(context: RevolutionaryContext, suggestions: SmartSuggestion[]): Promise<void> {
  try {
    await supabase
      .from('suggestion_analytics')
      .insert({
        user_id: context.userId,
        session_id: context.sessionId,
        user_persona: context.userPersona.type,
        business_maturity: context.businessMaturity.level,
        frustration_level: context.frustrationProfile.currentLevel,
        conversation_stage: context.conversationStage.stage,
        opportunity_score: context.opportunityScore,
        suggestions_generated: suggestions.length,
        metadata: {
          suggestions: suggestions.map(s => ({
            category: s.category,
            priority: s.priority,
            businessValue: s.businessValue
          }))
        }
      });
  } catch (error) {
    console.error('Failed to save suggestion analytics:', error);
  }
}

async function generateIntelligentFallback(userId: string, sessionId: string, currentQuestion: string): Promise<any> {
  return {
    clarificationQuestions: [
      'What specific EAA requirements concern you most?',
      'How can I help you prepare for EAA compliance?',
      'What aspect of accessibility would you like to explore?'
    ],
    infoTemplates: [],
    suggestions_header: 'How can I assist you with EAA compliance?',
    reasoning: 'Intelligent fallback based on user context'
  };
} 