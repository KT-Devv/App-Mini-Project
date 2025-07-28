import axios from 'axios';

const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;


export async function queryMistral(userMessage: string): Promise<string> {
  const maxTokens = userMessage.length < 50 ? 150 : 300;

  
  try {
    const response = await axios.post(
      HF_API_URL,
      {
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        messages: [
          {
            role: 'system',
            content: `You are a concise assistant. Respond directly to the user’s prompt. Do not explain your reasoning, add examples, lists, or follow-up questions unless the user explicitly asks.`,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        stream: false,
        max_tokens: maxTokens,
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

    // Clean out thoughts, internal narration, timestamps, numbered options
    content = content
      .replace(/<think[^>]*>[\s\S]*?<\/think>/gi, '')
      .replace(/<\/?think[^>]*>/gi, '')
      .replace(/^(Thought|Reasoning|Reflection|Thinking):.*$/gim, '')
      .replace(/^Assistant:\s*/gim, '')
      .replace(/^\d{1,2}:\d{2}.*$/gm, '')
      .replace(/^Okay, the user.*$/gim, '')
      .replace(/^Let me (think|see|start).*$/gim, '')
      .replace(/^I should.*$/gim, '')
      .replace(/^Then I need to.*$/gim, '')
      .replace(/^[[(].*[\])].*$/gm, '')
      .replace(/^\d+\.\s.*$/gm, '') // remove numbered list items
      .replace(/^[ \t]*\n/gm, '')   // remove empty lines
      .trim();

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
