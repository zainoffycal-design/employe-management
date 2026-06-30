import { AI_TOOL_DEFINITIONS, executeAITool } from './aiChatTools';
import { buildSystemPrompt } from './aiChatKnowledge';

const API_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_TOOL_ROUNDS = 6;

const getApiKey = () => import.meta.env.VITE_OPENAI_API_KEY;
const getModel = () => import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';

export const isAIChatConfigured = () => Boolean(getApiKey());

export const sendAIChatMessage = async (messages, ctx) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('OpenAI API key is missing. Add VITE_OPENAI_API_KEY to .env.local');
  }

  const conversation = [
    {
      role: 'system',
      content: buildSystemPrompt(ctx.currentUser, ctx.currentPath)
    },
    ...messages
  ];

  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds += 1;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: getModel(),
        messages: conversation,
        tools: AI_TOOL_DEFINITIONS,
        tool_choice: 'auto',
        temperature: 0.4
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI request failed (${response.status})`);
    }

    const data = await response.json();
    const choice = data.choices?.[0]?.message;

    if (!choice) {
      throw new Error('No response from AI');
    }

    if (choice.tool_calls?.length) {
      conversation.push({
        role: 'assistant',
        content: choice.content || null,
        tool_calls: choice.tool_calls
      });

      for (const toolCall of choice.tool_calls) {
        const fn = toolCall.function;
        let args = {};
        try {
          args = JSON.parse(fn.arguments || '{}');
        } catch {
          args = {};
        }

        const result = await executeAITool(fn.name, args, ctx);
        conversation.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });
      }

      continue;
    }

    return {
      content: choice.content || 'Done.',
      raw: choice
    };
  }

  return { content: 'I completed the actions. Let me know if you need anything else.' };
};
