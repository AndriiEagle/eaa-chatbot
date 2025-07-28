import { openai } from '../../services/openaiService.js';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

/**
 * Determines if the query is short or single question
 * @param text - User query text
 * @returns true if the query is short or single
 */
export function isShortOrSingleQuestion(text: string): boolean {
  // Question is considered short if less than 30 characters
  if (text.length < 30) return true;

  // Check for question marks - more detailed analysis
  const questionMarks = (text.match(/\?/g) || []).length;

  // Log for debugging
  console.log(`🔍 [DEBUG] Found ${questionMarks} question marks in text`);

  // If more than 1 question mark - consider it multiple
  if (questionMarks > 1) {
    console.log(
      '🔍 [DEBUG] Found multiple question marks, consider it multiple question'
    );
    return false;
  }

  // If no or only one question mark, check for keywords
  // Extended list of keywords for queries
  const questionWords = [
    // Russian questions
    'что',
    'как',
    'где',
    'когда',
    'почему',
    'зачем',
    'кто',
    'какой',
    'какая',
    'какое',
    'какие',
    'чей',
    'который',
    // English questions
    'what',
    'how',
    'where',
    'when',
    'why',
    'who',
    'which',
    'whose',
    'whom',
    // Descriptive constructions in Russian
    'нужно',
    'надо',
    'необходимо',
    'требуется',
    'хочу',
    'интересует',
    'расскажи',
    'объясни',
    'помоги',
    'подскажи',
    // Descriptive constructions in English
    'need',
    'want',
    'should',
    'must',
    'required',
    'tell',
    'explain',
    'help',
    'interested',
    'provide',
  ];

  const lower = text.toLowerCase();
  let found = 0;
  for (const w of questionWords) {
    if (lower.includes(w)) {
      found++;
      console.log(`🔍 [DEBUG] Found keyword: "${w}"`);
    }
    if (found > 1) {
      console.log(
        '🔍 [DEBUG] Found more than one keyword, consider it multiple question'
      );
      return false;
    }
  }

  // Check for multiple sentences (possible hidden questions)
  const sentenceCount = text.split(/[.!?]+\s+/).filter(Boolean).length;
  console.log(`🔍 [DEBUG] Found ${sentenceCount} sentences in text`);
  if (sentenceCount > 1) {
    // If there are multiple sentences, use GPT for analysis
    console.log(
      '🔍 [DEBUG] More than one sentence, will use additional analysis'
    );
    return false;
  }

  return true;
}

/**
 * Simple splitting of complex query into simple
 * @param query - User query text
 * @returns Array of separate questions
 */
export function splitComplexQuery(query: string): string[] {
  console.log('\n🔍 [DEBUG] Starting to split complex question:', query);
  // Split by quotes, commas and question marks
  const rawQuestions = query
    .split(/(?<=\?)|(?<="),\s*(?=")|(?<=\w),\s*(?=\w)/)
    .map(q => q.trim())
    .filter(q => q.length > 5) // Minimum question length
    .map(q => q.replace(/^"/, '').replace(/"$/, '')); // Remove quotes

  console.log('🔍 [DEBUG] Split result (unprocessed):', rawQuestions);

  // Remove duplicates
  const result = [...new Set(rawQuestions)];
  console.log('🔍 [DEBUG] Final split result:', result);
  return result;
}

/**
 * Smart splitting of questions using different methods
 * @param input - User query text
 * @returns Array of separate questions
 */
export async function smartSplitQuestions(input: string): Promise<string[]> {
  if (isShortOrSingleQuestion(input)) {
    console.log('🔍 [DEBUG] Determined as single question, not split');
    return [input];
  }

  // Improved question splitting using regex
  const parts =
    input
      .match(/[^?]+\?/g)
      ?.map(q => q.trim())
      .filter(q => q.length > 2) || [];
  console.log(
    `🔍 [DEBUG] Split by question marks gave ${parts.length} parts:`,
    parts
  );

  if (parts.length > 1) {
    return parts;
  }

  // If it didn't work - send to GPT for semantic splitting
  console.log(
    "🔍 [DEBUG] Regular split didn't work, use semantic splitting through GPT"
  );
  return await semanticSplitQuestions(input);
}

/**
 * Semantic splitting of questions using GPT
 * @param input - User query text
 * @returns Array of semantically split questions
 */
export async function semanticSplitQuestions(input: string): Promise<string[]> {
  const splitPrompt = `Break this text into unique, non-duplicating questions. Each question should be a separate element in the resulting array. Return only a JSON array of strings, without comments.\n\nIMPORTANT: If the text contains multiple questions, be sure to break them down, even if they are related in meaning. Pay attention to question marks and semantic divisions.`;

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content:
        'You are an assistant that helps break down long user queries into unique questions.',
    },
    { role: 'user', content: `${splitPrompt}\n\nText: ${input}` },
  ];

  console.log('🔍 [DEBUG] Sending request to GPT for semantic splitting');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0].message.content || '';
  console.log('🔍 [DEBUG] Got response from GPT for semantic splitting:', raw);

  try {
    // Try to extract array from JSON response
    const parsedResponse = JSON.parse(raw);

    // Check for questions array or separate array in root
    if (parsedResponse.questions && Array.isArray(parsedResponse.questions)) {
      console.log(
        '🔍 [DEBUG] Successfully extracted questions array from JSON'
      );
      return parsedResponse.questions
        .map((q: string) => String(q).trim())
        .filter(Boolean);
    }

    // Look for first array in object
    for (const key in parsedResponse) {
      if (Array.isArray(parsedResponse[key])) {
        console.log(`🔍 [DEBUG] Successfully extracted array ${key} from JSON`);
        return parsedResponse[key]
          .map((q: string) => String(q).trim())
          .filter(Boolean);
      }
    }

    // If response is an array itself
    if (Array.isArray(parsedResponse)) {
      console.log('🔍 [DEBUG] Response itself is an array');
      return parsedResponse
        .map((q: string) => String(q).trim())
        .filter(Boolean);
    }

    // Try to find JSON array in response as string
    const match = raw.match(/\[.*\]/s);
    if (match) {
      console.log('🔍 [DEBUG] Found JSON array in text response');
      const arr = JSON.parse(match[0]);
      if (Array.isArray(arr)) {
        return arr.map(q => String(q).trim()).filter(Boolean);
      }
    }
  } catch (e) {
    console.error('[SEMANTIC SPLIT] Failed to parse model response:', e);
    console.log('[SEMANTIC SPLIT] Raw response:', raw);
  }

  // If all methods failed, do basic splitting
  console.log('🔍 [DEBUG] All parsing methods failed, use basic splitting');
  return splitComplexQuery(input);
}
