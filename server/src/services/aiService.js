// server/src/services/aiService.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the client once, using the API key from environment variables.
// Never hardcode the key — it must only ever live in server/.env.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Custom error type so the controller can distinguish
 * "AI/parsing failed" from other unexpected errors (DB errors, etc.)
 * and respond with the correct HTTP status.
 */
class AIAnalysisError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AIAnalysisError';
  }
}

/**
 * Builds the prompt sent to Gemini.
 * The transcript is wrapped in <transcript> tags so the model treats it
 * strictly as data to analyze, not as instructions to follow.
 */
function buildPrompt(transcript) {
  return `You are an assistant that analyzes meeting transcripts for a project management tool.

Read the transcript below and return a JSON object with exactly this structure:

{
  "summary": "A concise 2-3 sentence summary of the meeting",
  "keyPoints": ["Key point 1", "Key point 2"],
  "tasks": [
    {
      "title": "Short, actionable task title",
      "description": "One sentence of extra context, or empty string if none",
      "priority": "low" | "medium" | "high",
      "suggestedAssignee": "Name mentioned in transcript, or empty string if unclear"
    }
  ]
}

Rules:
- Only extract tasks that are clearly actionable items or decisions from the transcript.
- If no tasks are found, return an empty array for "tasks".
- "priority" must be exactly one of: "low", "medium", "high".
- Do not invent information that is not present in the transcript.

<transcript>
${transcript}
</transcript>`;
}

/**
 * Validates that the parsed JSON actually matches the schema we expect.
 * Throws AIAnalysisError with a specific message if anything is wrong,
 * so debugging a bad AI response is easy later.
 */
function validateShape(data) {
  if (typeof data !== 'object' || data === null) {
    throw new AIAnalysisError('AI response is not a JSON object');
  }

  if (typeof data.summary !== 'string') {
    throw new AIAnalysisError('AI response missing valid "summary" string');
  }

  if (!Array.isArray(data.keyPoints)) {
    throw new AIAnalysisError('AI response missing valid "keyPoints" array');
  }

  if (!Array.isArray(data.tasks)) {
    throw new AIAnalysisError('AI response missing valid "tasks" array');
  }

  const validPriorities = ['low', 'medium', 'high'];

  for (const task of data.tasks) {
    if (typeof task.title !== 'string' || task.title.trim() === '') {
      throw new AIAnalysisError('One of the AI-extracted tasks is missing a title');
    }
    if (!validPriorities.includes(task.priority)) {
      throw new AIAnalysisError(`Invalid priority "${task.priority}" in AI-extracted task`);
    }
    // description and suggestedAssignee are allowed to be empty strings,
    // so we only check that they exist and are strings.
    if (typeof task.description !== 'string' || typeof task.suggestedAssignee !== 'string') {
      throw new AIAnalysisError('AI-extracted task has invalid description or assignee field');
    }
  }
}

/**
 * Main exported function.
 * Takes a raw transcript string, returns { summary, keyPoints, tasks }.
 * Throws AIAnalysisError on any failure — callers must catch this.
 */
async function analyzeTranscript(transcript) {
  if (!transcript || transcript.trim() === '') {
    throw new AIAnalysisError('Transcript is empty, nothing to analyze');
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash',
    generationConfig: {
      // Forces Gemini to return raw JSON — no markdown fences, no prose.
      responseMimeType: 'application/json',
    },
  });

  let rawText;
  try {
    const result = await model.generateContent(buildPrompt(transcript));
    rawText = result.response.text();
  } catch (err) {
    // Network error, invalid API key, rate limit, etc.
    throw new AIAnalysisError(`Gemini API call failed: ${err.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    // Even with responseMimeType set, keep this as a safety net.
    throw new AIAnalysisError('AI response was not valid JSON');
  }

  validateShape(parsed);

  return parsed;
}

module.exports = { analyzeTranscript, AIAnalysisError };