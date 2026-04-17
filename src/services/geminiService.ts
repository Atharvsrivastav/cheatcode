import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

export interface Message {
  role: 'user' | 'model';
  content: string;
}

export async function* sendMessageStream(messages: Message[]) {
  const model = "gemini-3-flash-preview";
  
  // Format all messages (history + current) for the contents array
  const contents = messages.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));

  try {
    const result = await ai.models.generateContentStream({
      model: model,
      contents: contents,
      config: {
        systemInstruction: "You are a minimalist AI assistant. Provide ONLY the direct answer requested by the user. Do not include explanations, greetings, or conclusions unless strictly necessary for the answer. If the user's request involves code, YOU MUST ONLY PROVIDE C CODE. Do not provide code in any other language. Be as concise as possible.",
        temperature: 0.7,
      },
    });

    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  } catch (error) {
    console.error("Gemini API Error Detail:", error);
    // Re-throw to be caught by the UI
    throw error;
  }
}
