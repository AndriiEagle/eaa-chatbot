import { ConversationStage } from '../suggestion.types';
import { ChatMessage } from '../../../types/database.types';
import { UserFact } from '../suggestion.types';

export class ConversationStageAnalyzer {
  analyze(messages: ChatMessage[], userFacts: UserFact[]): ConversationStage {
    let stage: ConversationStage['stage'] = 'discovery';
    let confidence = 0.7;

    if (messages.length === 0) {
      return {
        stage: 'discovery',
        confidence: 0.5,
        nextSteps: ['Ask about your business'],
      };
    }

    const recentMessages = messages.slice(-5);
    const allText = recentMessages
      .map(m => m.content)
      .join(' ')
      .toLowerCase();

    // Analyze conversation patterns
    if (
      allText.includes('implement') ||
      allText.includes('start') ||
      allText.includes('begin')
    ) {
      stage = 'implementation';
      confidence = 0.9;
    } else if (
      allText.includes('details') ||
      allText.includes('specific') ||
      allText.includes('how exactly')
    ) {
      stage = 'deep_dive';
      confidence = 0.8;
    } else if (
      allText.includes('learn') ||
      allText.includes('understand') ||
      allText.includes('explain')
    ) {
      stage = 'exploration';
      confidence = 0.8;
    }

    // Determine next steps based on stage
    const nextSteps: string[] = [];
    switch (stage) {
      case 'discovery':
        nextSteps.push(
          'Tell us about your business',
          'What type of website do you have?'
        );
        break;
      case 'exploration':
        nextSteps.push(
          'Learn about specific requirements',
          'Check compliance guidelines'
        );
        break;
      case 'deep_dive':
        nextSteps.push(
          'Review technical details',
          'Plan implementation approach'
        );
        break;
      case 'implementation':
        nextSteps.push(
          'Start with accessibility audit',
          'Begin implementation steps'
        );
        break;
    }

    return { stage, confidence, nextSteps };
  }
}
