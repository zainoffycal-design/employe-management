import { AI_TOOL_DEFINITIONS, executeAITool } from './aiChatTools';
import { buildSystemPrompt } from './aiChatKnowledge';

const MAX_TOOL_ROUNDS = 6;
const MAX_RETRIES = 2;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4.1-mini';

const getApiKey = () => import.meta.env.VITE_OPENAI_API_KEY;
const getModel = () => import.meta.env.VITE_OPENAI_MODEL || DEFAULT_MODEL;

export const isAIChatConfigured = () => Boolean(getApiKey());

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableOverload = (status, message) =>
  status === 503 || status === 500 || /overload|unavailable|temporarily/i.test(message || '');

const toOpenAITools = () =>
  AI_TOOL_DEFINITIONS.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }));

const parseToolArgs = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const toAssistantMessage = (message) => {
  const next = {
    role: 'assistant',
    content: message.content || ''
  };
  if (message.tool_calls?.length) next.tool_calls = message.tool_calls;
  return next;
};

const callOpenAI = async (body, apiKey) => {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      return response.json();
    }

    const err = await response.json().catch(() => ({}));
    const message = err.error?.message || `OpenAI request failed (${response.status})`;

    if (response.status === 429) {
      throw new Error(
        'OpenAI rate limit or quota was reached. Wait a moment and try again, or check billing on your OpenAI API key.'
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
    throw new Error('OpenAI API key is missing. Add VITE_OPENAI_API_KEY to .env.local');
  }

  const conversation = [
    { role: 'system', content: buildSystemPrompt(ctx.currentUser, ctx.currentPath) },
    ...messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content || '' }))
  ];

  const requestBody = {
    model: getModel(),
    messages: conversation,
    tools: toOpenAITools(),
    tool_choice: 'auto',
    temperature: 0.4
  };

  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds += 1;

    const data = await callOpenAI(requestBody, apiKey);
    const message = data.choices?.[0]?.message;

    if (!message) {
      throw new Error('No response from AI');
    }

    const toolCalls = message.tool_calls || [];

    if (toolCalls.length) {
      conversation.push(toAssistantMessage(message));

      for (const toolCall of toolCalls) {
        const name = toolCall.function?.name;
        const result = await executeAITool(name, parseToolArgs(toolCall.function?.arguments), ctx);
        conversation.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name,
          content: JSON.stringify(result)
        });
      }

      requestBody.messages = conversation;
      continue;
    }

    const text = (message.content || '').trim();
    return { content: text || 'Done.' };
  }

  return { content: 'I completed the actions. Let me know if you need anything else.' };
};
