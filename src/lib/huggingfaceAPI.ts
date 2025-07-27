// src/lib/huggingfaceAPI.ts
import axios from 'axios';

const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;

export async function queryDeepSeek(userMessage: string): Promise<string> {
  try {
    const response = await axios.post(
      HF_API_URL,
      {
        model: 'deepseek-ai/DeepSeek-R1',
        messages: [
          {
            role: 'system',
            content: `You are a helpful, conversational AI assistant. Do NOT include <think> tags or describe your thought process. Respond directly and briefly. After each answer, offer 2–3 numbered options or follow-up questions. Never give a long answer all at once.`,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        stream: false,
        max_tokens: 100, // Lower for shorter answers
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let content = response.data.choices?.[0]?.message?.content || '[No response]';

    // Clean out <think> blocks
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '');

    // Remove lines starting with "Thought:", "Reasoning:", etc.
    content = content.replace(/^(Thought|Reasoning|Reflection):.*$/gim, '');

    // Remove repeated "Assistant:" labels if any
    content = content.replace(/^Assistant:\s*/gi, '');

    // Trim and clean extra newlines
    content = content.replace(/^[ \t]*\n/gm, '').trim();

    return content;
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null) {
      const err = error as { response?: { data?: unknown }; message?: string };
      console.error('AI API Error:', err.response?.data || err.message);
    } else {
      console.error('AI API Error:', String(error));
    }
    return 'Sorry, the AI is currently unavailable.';
  }
}
