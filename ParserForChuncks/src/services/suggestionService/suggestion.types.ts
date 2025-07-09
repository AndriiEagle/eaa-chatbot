// This file contains all the type definitions for the revolutionary suggestion service.

export interface RevolutionaryContext {
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

export interface UserPersona {
  type: 'technical_expert' | 'business_owner' | 'compliance_manager' | 'developer' | 'consultant' | 'end_user' | 'newcomer';
  confidence: number;
  role: 'technical_expert' | 'business_owner' | 'compliance_manager' | 'developer' | 'consultant' | 'end_user';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  primaryMotivation: 'compliance' | 'business_growth' | 'technical_excellence' | 'problem_solving';
  communicationStyle: 'formal' | 'casual' | 'technical' | 'business_focused';
  learningPreference: 'visual' | 'textual' | 'hands_on' | 'conceptual';
  decisionMakingStyle: 'analytical' | 'intuitive' | 'collaborative' | 'decisive';
  
  // AI-enhanced fields
  aiInsights?: AIInsights;
}

export interface BusinessMaturity {
  level: 'startup' | 'small_business' | 'medium_business' | 'enterprise';
  eaaReadiness: number;
  complianceGaps: string[];
  timeConstraints: 'urgent' | 'moderate' | 'planning_ahead';
}

export interface FrustrationProfile {
  currentLevel: number;
  triggers: string[];
  escalationRisk: number;
  patterns: string[];
  
  // AI-enhanced fields
  insights?: {
    historicalTrend?: 'increasing' | 'decreasing' | 'stable' | 'unknown';
    communicationStyle?: 'formal' | 'casual' | 'technical' | 'emotional';
    urgencyLevel?: number;
    messageFrequency?: number;
    averageMessageLength?: number;
    questionRatio?: number;
    politenesScore?: number;
    technicalLevel?: number;
    [key: string]: any;
  };
  aiInsights?: {
    psychologicalProfile?: any;
    escalationPrediction?: any;
    adaptiveStrategy?: any;
    confidence?: number;
    analysisTimestamp?: string;
    [key: string]: any;
  };
}

export interface ConversationStage {
  stage: 'discovery' | 'exploration' | 'deep_dive' | 'implementation';
  confidence: number;
  nextSteps: string[];
}

export interface BehaviorPattern {
  type: string;
  frequency: number;
  context: string;
  significance: number;
  
  // AI-enhanced fields
  aiInsights?: {
    confidence: number;
    psychologicalInsight?: string;
    userType?: string;
    communicationStyle?: string;
    escalationRisk?: number;
    satisfactionPrediction?: number;
    [key: string]: any;
  };
}

export interface PredictedNeed {
  type: string;
  probability: number;
  urgency: number;
  description: string;
}

export interface SmartSuggestion {
  text: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reasoning: string;
  expectedOutcome: string;
  businessValue: number;
}

export interface BaseSuggestion {
  text: string;
  category: 'learning_path' | 'business_opportunity' | 'immediate_need' | 'problem_solving';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reasoning: string;
  expectedOutcome: string;
  businessValue: number;
}

// Extended AI insights for enhanced analysis
export interface AIInsights {
  confidence: number;
  analysisTimestamp: string;
  [key: string]: any; // Flexible structure for AI-specific data
}

// Analyzer interfaces
export interface AnalysisResult {
  confidence: number;
  reasoning: string;
  metadata?: Record<string, any>;
}

export interface UserPersonaAnalysis extends AnalysisResult {
  persona: UserPersona;
}

export interface BusinessMaturityAnalysis extends AnalysisResult {
  maturity: BusinessMaturity;
}

export interface ConversationStageAnalysis extends AnalysisResult {
  stage: ConversationStage;
}

export interface FrustrationAnalysis extends AnalysisResult {
  profile: FrustrationProfile;
}

export interface BehaviorAnalysis extends AnalysisResult {
  patterns: BehaviorPattern[];
}

export interface NeedsAnalysis extends AnalysisResult {
  needs: PredictedNeed[];
}

// Data types from database
export interface UserFact {
  fact_type: string;
  fact_value: string;
  confidence: number;
  source: string;
  timestamp: string;
}

export interface SessionMessage {
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface UserSession {
  session_id: string;
  created_at: string;
  message_count: number;
  topics: string[];
}

export interface FrustrationRecord {
  level: number;
  trigger: string;
  timestamp: string;
  resolution: string;
} 