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
  
  const history = messages.slice(0, -1).map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));
  
  const currentMessage = messages[messages.length - 1].content;

  try {
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: "You are a minimalist AI assistant. Provide ONLY the direct answer requested by the user. Do not include explanations, greetings, or conclusions unless strictly necessary for the answer. If the user's request involves code, YOU MUST ONLY PROVIDE C CODE. Do not provide code in any other language. Be as concise as possible.",
      },
      history: history,
    });

    const result = await chat.sendMessageStream({
      message: currentMessage
    });

    for await (const chunk of result) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
