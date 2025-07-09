// userDataAnalysis.ts
import { UserFact, UserDataAnalysisResult } from '../types/common.js';

/**
 * Function for analyzing user data
 * @param userFacts - Facts about the user
 * @param originalQuestion - Original question
 * @returns User data analysis result
 */
export function analyzeUserData(userFacts: UserFact[], originalQuestion: string = ''): UserDataAnalysisResult {
  console.log('[UserDataAnalysis] Analyzing user data based on facts:', userFacts);
  
  // Define required fact types
  const requiredFactTypes = [
    'business_type',          // Business type
    'business_size',          // Business size 
    'customer_base',          // Target audience
    'service_types',          // Provided services
    'product_types',          // Product types
    'web_presence',           // Web presence
    'physical_location'       // Physical location
  ];
  
  // Calculate data completeness based on existing facts
  const existingData = userFacts
    .filter(fact => fact.confidence >= 0.7) 
    .map(fact => fact.type)
    .filter(type => requiredFactTypes.includes(type));
  
  // Determine what data is missing
  const missingData = requiredFactTypes.filter(type => !existingData.includes(type));
  
  // Filter facts for quick access to the most important ones
  const businessType = userFacts.find(fact => fact.type === 'business_type')?.value || '';
  const businessSize = userFacts.find(fact => fact.type === 'business_size')?.value || '';
  const customerBase = userFacts.find(fact => fact.type === 'customer_base')?.value || '';
  const serviceTypes = userFacts.find(fact => fact.type === 'service_types')?.value || '';
  
  // Calculate data completeness as ratio of existing facts to required ones
  // But even with 100% data, always leave room for clarification to improve quality
  let completeness = existingData.length / requiredFactTypes.length;
  
  // Adjust data completeness to never reach 100% if important information is missing
  // This solves the problem of mismatch between claimed 100% completeness and clarification requests
  if (missingData.length > 0) {
    // Limit maximum data completeness to 95% if there's at least one missing fact
    completeness = Math.min(completeness, 0.95);
  }
  
  // Collect summary of existing data
  let summary = '';
  if (businessType) {
    summary += `Business type: ${businessType}. `;
  }
  if (businessSize) {
    summary += `Size: ${businessSize}. `;
  }
  if (customerBase) {
    summary += `Target audience: ${customerBase}. `;
  }
  if (serviceTypes) {
    summary += `Services: ${serviceTypes}. `;
  }
  
  // Form specific questions based on missing data
  const specificQuestions: string[] = [];
  if (!existingData.includes('web_presence') && 
      !originalQuestion.toLowerCase().includes('website') && 
      !originalQuestion.toLowerCase().includes('app')) {
    specificQuestions.push('Do you have a website or mobile application?');
  }
  
  if (!existingData.includes('service_types') && !existingData.includes('product_types')) {
    specificQuestions.push(`What specific ${businessType ? 'services or products do you offer in the ' + businessType + ' sector' : 'services or products do you offer'}?`);
  }
  
  if (!existingData.includes('customer_base')) {
    specificQuestions.push('Who is your target audience?');
  }
  
  if (!existingData.includes('physical_location')) {
    specificQuestions.push('In which EU countries does your company operate?');
  }
  
  // Instructions for AI for further clarification
  let aiInstructions = '';
  if (missingData.length > 0) {
    aiInstructions = `Continue collecting information about: ${missingData.map(type => type.replace('business_', '')).join(', ')}. `;
    
    // Add contextual instructions based on business type
    if (businessType) {
      if (businessType.includes('transport')) {
        aiInstructions += 'Especially important to find out: types of transport services, presence of website/app for booking, EU service countries. ';
      } else if (businessType.includes('retail') || businessType.includes('commerce')) {
        aiInstructions += 'Especially important to find out: product types, presence of e-commerce, EU delivery countries. ';
      } else if (businessType.includes('media') || businessType.includes('info')) {
        aiInstructions += 'Especially important to find out: types of media content, distribution formats, accessibility on different devices. ';
      }
    }
  }
  
  // Use helper function to format data types
  const humanReadableMissingData = formatMissingDataTypes(missingData);
  
  // Form structured object for UI display
  const preliminaryAnalysis: UserDataAnalysisResult = {
    completeness,
    existingData,
    missingData,
    businessType,
    businessSize,
    summary,
    specificQuestions,
    aiInstructions,
    // Add string representations for UI use
    humanReadableMissingData
  };
  
  console.log('[UserDataAnalysis] Analysis result:', preliminaryAnalysis);
  
  return preliminaryAnalysis;
} 

/**
 * Function for formatting data types into human-readable strings
 * Used in userDataAnalysis and askController
 * @param dataTypes - Data types to format
 * @returns Formatted data types
 */
export function formatMissingDataTypes(dataTypes: string[]): string[] {
  if (!dataTypes || !Array.isArray(dataTypes)) return [];
  
  return dataTypes.map(type => {
    switch(type) {
      case 'business_size': return 'business size';
      case 'customer_base': return 'target audience';
      case 'service_types': return 'types of provided services';
      case 'product_types': return 'product types';
      case 'web_presence': return 'web presence';
      case 'physical_location': return 'physical location';
      default: return type.replace('business_', '');
    }
  });
} 