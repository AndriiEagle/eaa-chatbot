import { BusinessMaturity } from '../suggestion.types';
import { UserFact, ChatMessage } from '../../../utils/memory/types';

/**
 * SINGLE SOURCE OF TRUTH for Business Maturity Analysis
 * Consolidates duplicate logic from revolutionarySuggestionsController
 */
export class BusinessMaturityAnalyzer {
  analyze(userFacts: UserFact[], sessionMessages: ChatMessage[]): BusinessMaturity {
    let level: BusinessMaturity['level'] = 'startup';
    let eaaReadiness = 0.1;
    
    // Analyze facts for business maturity indicators
    const businessType = userFacts.find(f => f.fact_type === 'business_type')?.fact_value || '';
    const hasWebsite = userFacts.some(f => f.fact_type === 'business_digital_presence' && f.fact_value.includes('website'));
    const hasAudit = userFacts.some(f => f.fact_type === 'accessibility_audit_done' && f.fact_value === 'true');
    
    // Determine maturity level based on facts
    if (businessType.includes('enterprise') || businessType.includes('corporation')) {
      level = 'enterprise';
      eaaReadiness = 0.8;
    } else if (hasAudit || businessType.includes('medium')) {
      level = 'medium_business';
      eaaReadiness = 0.6;
    } else if (hasWebsite || businessType.includes('small')) {
      level = 'small_business';
      eaaReadiness = 0.4;
    }
    
    // Analyze session messages for additional indicators
    const allMessageText = sessionMessages.map(m => m.content).join(' ').toLowerCase();
    const complianceGaps: string[] = [];
    
    if (!hasAudit && !allMessageText.includes('audit')) {
      complianceGaps.push('accessibility_audit');
    }
    
    if (!allMessageText.includes('wcag')) {
      complianceGaps.push('wcag_knowledge');
    }
    
    // Determine time constraints
    let timeConstraints: BusinessMaturity['timeConstraints'] = 'planning_ahead';
    if (allMessageText.includes('urgent') || allMessageText.includes('deadline')) {
      timeConstraints = 'urgent';
    } else if (allMessageText.includes('soon') || allMessageText.includes('quickly')) {
      timeConstraints = 'moderate';
    }
    
    return {
      level,
      eaaReadiness: Math.min(1.0, eaaReadiness),
      complianceGaps,
      timeConstraints
    };
  }
} 