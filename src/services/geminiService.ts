import { GoogleGenAI } from "@google/genai";

export interface Message {
  role: 'user' | 'model';
  content: string;
}

export async function* sendMessageStream(messages: Message[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    yield "Error: Gemini API Key is missing. Please check your Secrets panel in AI Studio settings.";
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
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    const errorMessage = error?.message || "Internal AI Error";
    yield `Error: ${errorMessage}. Please ensure your API key is valid and you have quota available.`;
  }
}
