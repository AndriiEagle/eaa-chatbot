// userDataAnalysis.ts
import { UserFact, UserDataAnalysisResult } from '../types/common';

/**
 * Function for analyzing user data
 * @param userFacts - Facts about the user
 * @param originalQuestion - Original question
 * @returns User data analysis result
 */
export function analyzeUserData(userFacts, originalQuestion = '') {
  console.log('[UserDataAnalysis] Analyzing user data based on facts:', userFacts);
  
  // Define required fact types
  const requiredFactTypes = [
    'business_type',          // Business type
    'business_size',          // Business size
    'customer_base',          // Target audience
    'physical_location',      // Physical location
    'web_presence',           // Web presence
    'service_types',          // Service types
    'compliance_status'       // Compliance status
  ];
  
  // Calculate completeness
  const existingFactTypes = userFacts.map(fact => fact.type);
  const missingFactTypes = requiredFactTypes.filter(type => !existingFactTypes.includes(type));
  const completeness = (requiredFactTypes.length - missingFactTypes.length) / requiredFactTypes.length;
  
  // Extract business type and size
  const businessType = userFacts.find(fact => fact.type === 'business_type')?.value || '';
  const businessSize = userFacts.find(fact => fact.type === 'business_size')?.value || '';
  
  // Generate summary
  let summary = 'User profile: ';
  if (businessType) summary += `${businessType} business`;
  if (businessSize) summary += ` (${businessSize})`;
  if (userFacts.length === 0) summary = 'No user data collected yet';
  
  // Generate specific questions based on missing data
  const specificQuestions = generateSpecificQuestions(missingFactTypes, businessType, originalQuestion);
  
  // Generate AI instructions
  const aiInstructions = generateAIInstructions(missingFactTypes, completeness);
  
  // Convert missing data to human-readable format
  const humanReadableMissingData = formatMissingDataTypes(missingFactTypes);
  
  console.log(`[UserDataAnalysis] Completeness: ${Math.round(completeness * 100)}%`);
  console.log(`[UserDataAnalysis] Missing data: ${missingFactTypes.length} types`);
  
  return {
    completeness,
    existingData: existingFactTypes,
    missingData: missingFactTypes,
    businessType,
    businessSize,
    summary,
    specificQuestions,
    aiInstructions,
    humanReadableMissingData
  };
} 

/**
 * Function for formatting data types into human-readable strings
 * Used in userDataAnalysis and in askController
 * @param dataTypes - Data types for formatting
 * @returns Formatted string
 */
export function formatMissingDataTypes(dataTypes) {
  if (!dataTypes || dataTypes.length === 0) {
    return 'No missing data';
  }
  
  const typeMap = {
    'business_type': 'business type',
    'business_size': 'business size', 
    'customer_base': 'target audience',
    'physical_location': 'physical location',
    'web_presence': 'web presence',
    'service_types': 'service types',
    'compliance_status': 'compliance status'
  };
  
  return dataTypes
    .map(type => typeMap[type] || type)
    .join(', ');
} 

/**
 * Generate specific questions based on missing data
 */
function generateSpecificQuestions(missingFactTypes, businessType, originalQuestion) {
  const questions = [];
  
  if (missingFactTypes.includes('web_presence') && 
      !originalQuestion.toLowerCase().includes('website') && 
      !originalQuestion.toLowerCase().includes('application')) {
    questions.push('Do you have a website or mobile application?');
  }
  
  if (missingFactTypes.includes('service_types') || missingFactTypes.includes('product_types')) {
    questions.push(`What specific ${businessType ? 'services or products do you offer in ' + businessType : 'services or products do you offer'}?`);
  }
  
  if (missingFactTypes.includes('customer_base')) {
    questions.push('Who is your target audience?');
  }
  
  if (missingFactTypes.includes('physical_location')) {
    questions.push('In which EU countries does your company operate?');
  }
  
  return questions;
}

/**
 * Generate AI instructions for further data collection
 */
function generateAIInstructions(missingFactTypes, completeness) {
  if (missingFactTypes.length === 0) {
    return 'User profile is complete. Focus on providing specific EAA guidance.';
  }
  
  let instructions = `Continue collecting information about: ${missingFactTypes.map(type => type.replace('business_', '')).join(', ')}. `;
  
  if (completeness < 0.5) {
    instructions += 'Priority: gather basic business information first. ';
  } else {
    instructions += 'Priority: collect specific compliance-related details. ';
  }
  
  return instructions;
} 