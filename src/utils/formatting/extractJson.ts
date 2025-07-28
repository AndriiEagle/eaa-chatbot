/**
 * 🚀 PROFESSIONAL JSON EXTRACTION UTILITY
 *
 * Extracts a JSON string from a larger string,
 * typically one returned by an AI model that might include markdown code blocks.
 *
 * ✅ FIXES: `SyntaxError: Unexpected token '`'` in JSON parsing.
 */
export function extractJson(str: string): string {
  if (!str) {
    return '{}';
  }

  // Find the first '{' and the last '}'
  const firstBrace = str.indexOf('{');
  const lastBrace = str.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    console.warn(
      `[extractJson] No valid JSON object found in string: ${str.substring(0, 100)}...`
    );
    // Attempt to find JSON within markdown code blocks as a fallback
    const match = str.match(/```json\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      return match[1].trim();
    }
    return '{}';
  }

  // Extract the substring that looks like a JSON object
  const jsonString = str.substring(firstBrace, lastBrace + 1);

  return jsonString.trim();
}
