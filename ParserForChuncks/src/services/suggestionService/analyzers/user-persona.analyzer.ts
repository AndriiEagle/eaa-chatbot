import OpenAI from 'openai';
import { UserPersona } from '../suggestion.types';

export class UserPersonaAnalyzer {
  constructor(private openai: OpenAI) {}

  async analyze(
    userFacts: any[],
    sessionMessages: any[],
    currentQuestion: string
  ): Promise<UserPersona> {
    const factsText = userFacts
      .map(f => `${f.fact_type}: ${f.fact_value}`)
      .join('\n');
    const messagesText = sessionMessages
      .slice(-10)
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

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

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 300,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return {
        type: result.type || 'end_user',
        confidence: result.confidence || 0.6,
        role: result.role || 'end_user',
        experienceLevel: result.experienceLevel || 'intermediate',
        primaryMotivation: result.primaryMotivation || 'compliance',
        communicationStyle: 'business_focused',
        learningPreference: result.learningPreference || 'textual',
        decisionMakingStyle: result.decisionMakingStyle || 'analytical',
      };
    } catch (error) {
      console.error('❌ [PERSONA] Parse error:', error);
      return {
        type: 'end_user',
        confidence: 0.3,
        role: 'end_user',
        experienceLevel: 'beginner',
        primaryMotivation: 'compliance',
        communicationStyle: 'business_focused',
        learningPreference: 'textual',
        decisionMakingStyle: 'analytical',
      };
    }
  }
}
