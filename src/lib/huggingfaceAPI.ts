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
            role: 'user',
            content: userMessage,
          },
        ],
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let content = response.data.choices?.[0]?.message?.content || '[No response]';

    content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

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
