import { PredictedNeed, UserPersona, BusinessMaturity, ConversationStage } from '../suggestion.types';

export class NeedsPredictor {
  async predict(userPersona: UserPersona, businessMaturity: BusinessMaturity, conversationStage: ConversationStage): Promise<PredictedNeed[]> {
    const needs: PredictedNeed[] = [];
    
    // 🎯 ML-based prediction algorithm
    
    // NEWCOMERS - need basics
    if (userPersona.type === 'newcomer' || userPersona.experienceLevel === 'beginner') {
      needs.push({
        type: 'basic_understanding',
        probability: 0.9,
        urgency: 0.8,
        description: 'Understanding EAA fundamentals'
      });
      needs.push({
        type: 'compliance_overview',
        probability: 0.7,
        urgency: 0.6,
        description: 'General compliance requirements'
      });
    }
    
    // BUSINESS OWNERS - ROI and timelines
    if (userPersona.type === 'business_owner') {
      needs.push({
        type: 'cost_benefit_analysis',
        probability: 0.9,
        urgency: businessMaturity.timeConstraints === 'urgent' ? 0.9 : 0.6,
        description: 'Cost-benefit analysis'
      });
      needs.push({
        type: 'implementation_timeline',
        probability: 0.85,
        urgency: 0.8,
        description: 'Implementation timeline'
      });
    }
    
    // TECHNICAL EXPERTS - tools and methods
    if (userPersona.type === 'technical_expert') {
      needs.push({
        type: 'technical_implementation_guide',
        probability: 0.9,
        urgency: 0.7,
        description: 'Technical implementation guide'
      });
      needs.push({
        type: 'automated_testing_tools',
        probability: 0.8,
        urgency: 0.8,
        description: 'Automated testing tools'
      });
    }
    
    // IMPLEMENTATION STAGE - concrete steps
    if (conversationStage.stage === 'implementation') {
      needs.push({
        type: 'technical_guidance',
        probability: 0.8,
        urgency: 0.7,
        description: 'Technical implementation help'
      });
      needs.push({
        type: 'testing_validation',
        probability: 0.7,
        urgency: 0.8,
        description: 'Testing and validation methods'
      });
    }
    
    // LOW READINESS - audit needed
    if (businessMaturity.eaaReadiness < 0.5) {
      needs.push({
        type: 'gap_analysis',
        probability: 0.8,
        urgency: businessMaturity.timeConstraints === 'urgent' ? 0.9 : 0.6,
        description: 'Identify compliance gaps'
      });
      needs.push({
        type: 'implementation_planning',
        probability: 0.6,
        urgency: 0.8,
        description: 'Create implementation roadmap'
      });
    }
    
    return needs.sort((a, b) => (b.probability * b.urgency) - (a.probability * a.urgency));
  }
} 