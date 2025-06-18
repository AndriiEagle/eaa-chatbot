import { Request, Response } from 'express';
import OpenAI from 'openai';
import { chatMemory } from '../utils/memory/index.js';
import { PROACTIVE_AGENT_SYSTEM_PROMPT } from '../config/prompts.js';

// Duplicate interfaces to work around import issues
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
interface UserFact {
  fact_type: string;
  fact_value: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = PROACTIVE_AGENT_SYSTEM_PROMPT;

interface ProactiveAnalysisRequest {
  currentText: string;
  userId: string;
  sessionId: string;
}

export const analyzeTextProactively = async (req: Request, res: Response) => {
  const { currentText, userId, sessionId } = req.body as ProactiveAnalysisRequest;

  if (!currentText || !userId || !sessionId) {
    return res.status(400).json({ error: 'Missing required parameters: currentText, userId, sessionId' });
  }

  try {
    const userFacts: UserFact[] = await chatMemory.getUserFacts(userId);
    // First get all messages, then slice to last 5
    const allMessages: ChatMessage[] = await chatMemory.getSessionMessages(sessionId);
    const recentMessages = allMessages.slice(-5);

    const factsString = userFacts.map((f: UserFact) => `- ${f.fact_type}: ${f.fact_value}`).join('\n');
    const historyString = recentMessages.map((m: ChatMessage) => `${m.role === 'user' ? 'User' : 'Bot'}: ${m.content}`).join('\n');

    const contextForLLM = `
### Known facts about the user
${factsString || 'No data'}

### Recent message history
${historyString || 'No data'}

### Current user text (analyze this)
"${currentText}"
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: contextForLLM }
      ],
      temperature: 0.5,
      max_tokens: 50,
    });

    const suggestion = completion.choices[0].message.content?.trim() || '';

    res.status(200).json({ suggestion });

  } catch (error: any) {
    console.error('❌ [ProactiveAgent] Analysis error:', error);
    res.status(500).json({ error: 'Internal error during text analysis.', details: error.message });
  }
}; 