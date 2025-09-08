import axios from 'axios';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Keep AI outputs concise and practical by default
const SYSTEM_INSTRUCTION = [
  "You are a concise study assistant.",
  "Respond in at most 3 short bullet points or 2 short sentences.",
  "Avoid long lectures, headings, and heavy formatting.",
  "Only include essential facts or steps."
].join(' ');


export async function queryGemini(userMessage: string): Promise<string> {
  const greetings = ['hi', 'hello', 'hey', 'greetings'];
  if (greetings.includes(userMessage.trim().toLowerCase())) {
    return 'Hello! What are we learning today?';
  }

  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          system_instruction: {
            role: 'system',
            parts: [{ text: SYSTEM_INSTRUCTION }]
          },
          generationConfig: {
            maxOutputTokens: 120,
            temperature: 0.2,
            topP: 0.9,
            candidateCount: 1
          },
          contents: [
            {
              role: 'user',
              parts: [
                { text: userMessage }
              ]
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Gemini returns the response in response.data.candidates[0].content.parts[0].text
      let content = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '[No response]';
      return content;
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null) {
        const err = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
        if (err.response?.data?.error?.message) {
          console.error('Gemini API Error:', err.response.data.error.message);
          alert('Gemini API error: ' + err.response.data.error.message);
        }
      } else {
        console.error('Gemini API Error:', String(error));
      }
      return 'Sorry, the AI is currently unavailable.';
    }
  }
  return 'Sorry, the AI is currently unavailable.';
}