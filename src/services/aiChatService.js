import { AI_TOOL_DEFINITIONS, executeAITool } from './aiChatTools';
import { buildSystemPrompt } from './aiChatKnowledge';

const MAX_TOOL_ROUNDS = 6;

const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY;
const getModel = () => import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.8-flash';
const getApiUrl = () => `https://generativelanguage.googleapis.com/v1beta/models/${getModel()}:generateContent`;

export const isAIChatConfigured = () => Boolean(getApiKey());

const upperSchemaTypes = (schema) => {
  if (!schema || typeof schema !== 'object') return schema;
  const out = { ...schema };
  if (typeof out.type === 'string') out.type = out.type.toUpperCase();
  if (out.properties) {
    out.properties = Object.fromEntries(
      Object.entries(out.properties).map(([key, value]) => [key, upperSchemaTypes(value)])
    );
  }
  if (out.items) out.items = upperSchemaTypes(out.items);
  return out;
};

const toGeminiTools = () => [
  {
    functionDeclarations: AI_TOOL_DEFINITIONS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: upperSchemaTypes(tool.parameters)
    }))
  }
];

const toGeminiContents = (messages) =>
  messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || '' }]
    }));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableOverload = (status, message) =>
  status === 503 || /overload|high demand|unavailable/i.test(message || '');

const MAX_RETRIES = 2;

const callGemini = async (body, apiKey) => {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const response = await fetch(`${getApiUrl()}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      return response.json();
    }

    const err = await response.json().catch(() => ({}));
    const message = err.error?.message || `Gemini request failed (${response.status})`;

    if (response.status === 429) {
      throw new Error(
        "You're sending messages faster than this AI plan allows (free-tier rate limit). Wait about a minute and try again, or upgrade billing on your Gemini API key."
      );
    }

    lastError = new Error(message);

    if (!isRetryableOverload(response.status, message) || attempt === MAX_RETRIES) {
      throw lastError;
    }

    await sleep(2 ** attempt * 1000);
  }

  throw lastError;
};

export const sendAIChatMessage = async (messages, ctx) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Add VITE_GEMINI_API_KEY to .env.local');
  }

  const contents = toGeminiContents(messages);

  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds += 1;

    const data = await callGemini(
      {
        systemInstruction: {
          parts: [{ text: buildSystemPrompt(ctx.currentUser, ctx.currentPath) }]
        },
        contents,
        tools: toGeminiTools(),
        toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
        generationConfig: { temperature: 0.4 }
      },
      apiKey
    );
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts;

    if (!parts) {
      throw new Error('No response from AI');
    }

    const functionCalls = parts.filter((p) => p.functionCall);

    if (functionCalls.length) {
      contents.push({ role: 'model', parts });

      const responseParts = [];
      for (const part of functionCalls) {
        const { name, args } = part.functionCall;
        const result = await executeAITool(name, args || {}, ctx);
        responseParts.push({
          functionResponse: { name, response: result }
        });
      }
      contents.push({ role: 'function', parts: responseParts });

      continue;
    }

    const text = parts.map((p) => p.text || '').join('').trim();
    return { content: text || 'Done.', raw: candidate };
  }

  return { content: 'I completed the actions. Let me know if you need anything else.' };
};
