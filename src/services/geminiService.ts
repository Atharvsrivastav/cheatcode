import { GoogleGenAI } from "@google/genai";

export interface Message {
  role: 'user' | 'model';
  content: string;
}

export async function* sendMessageStream(messages: Message[]) {
  // Check both standard and VITE_ prefixed env variables
  const apiKey = process.env.GEMINI_API_KEY || 
                 (import.meta as any).env?.VITE_GEMINI_API_KEY || 
                 process.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.length < 5) {
    yield `Error: Gemini API Key is missing or invalid. \n\nFound key: ${apiKey ? (apiKey.length > 5 ? '***' + apiKey.slice(-3) : 'Too short') : 'None'} \n\nIf you are on Vercel, you must add GEMINI_API_KEY in Settings > Environment Variables and then REDEPLOY your project.`;
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = "gemini-3-flash-preview";
  
  const contents = messages.map(msg => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  try {
    const result = await ai.models.generateContentStream({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: "You are a minimalist assistant. Answer the user's question directly. If they ask for code, provide only the code in C. Avoid unnecessary talk.",
        temperature: 0.1,
      },
    });

    for await (const chunk of result) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    const errorMessage = error?.message || "Internal AI Error";
    yield `Error: ${errorMessage}. If you are on Vercel, check your Environment Variables.`;
  }
}
