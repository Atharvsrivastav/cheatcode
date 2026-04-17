import { GoogleGenAI } from "@google/genai";

export interface Message {
  role: 'user' | 'model';
  content: string;
}

export async function* sendMessageStream(messages: Message[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey.length < 5) {
    yield `Error: GEMINI_API_KEY is missing or invalid in this deployment. Please ensure you have set the GEMINI_API_KEY secret in AI Studio before deploying. Current key: ${apiKey ? '***' + apiKey.slice(-3) : 'NONE'}`;
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
