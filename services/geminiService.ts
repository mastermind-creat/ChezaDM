
import { GoogleGenAI } from "@google/genai";
import { BotType, Message } from "../types";
import { BOTS } from "../constants";

// Helper to get AI instance safely
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateBotResponse = async (
  botType: BotType,
  userMessage: string,
  chatHistory: Message[] = []
): Promise<string> => {
  const ai = getAI();
  const botConfig = BOTS[botType];
  
  const tools = botType === BotType.HELPER ? [{ googleSearch: {} }] : undefined;
  const modelId = 'gemini-3-flash-preview'; 

  try {
    let prompt = userMessage;

    if (botType === BotType.SUMMARY) {
      const historyText = chatHistory
        .slice(-20)
        .map(m => `${m.senderName}: ${m.content}`)
        .join('\n');
      prompt = `Here is the chat history:\n${historyText}\n\nPlease summarize this for the user in a friendly way.`;
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: botConfig.systemInstruction,
        temperature: 0.7,
        tools: tools,
      },
    });

    let textResponse = response.text || "...";

    if (botType === BotType.HELPER && response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      const chunks = response.candidates[0].groundingMetadata.groundingChunks;
      const links = chunks
        .map((chunk: any) => chunk.web ? `[${chunk.web.title}](${chunk.web.uri})` : null)
        .filter(Boolean);
      
      if (links.length > 0) {
        textResponse += "\n\nSources:\n" + [...new Set(links)].map((l: string) => `- ${l}`).join("\n");
      }
    }

    return textResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Pole! I'm having trouble connecting to the network right now. Try again soon.";
  }
};

export const checkModeration = async (text: string): Promise<{ safe: boolean; reason?: string }> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: text,
      config: {
        systemInstruction: BOTS[BotType.MODERATOR].systemInstruction,
        temperature: 0,
      },
    });

    const result = response.text?.trim();
    if (result === 'SAFE') {
      return { safe: true };
    }
    return { safe: false, reason: result };
  } catch (e) {
    return { safe: true }; 
  }
};

export const polishDraft = async (text: string): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Rewrite this message for a chat app. Keep it casual, maybe add a relevant emoji, and ensure it sounds natural: "${text}"`,
    });
    return response.text?.replace(/^"|"$/g, '') || text;
  } catch (e) {
    return text;
  }
};

export const editChatImage = async (base64Image: string, prompt: string): Promise<string | null> => {
  const ai = getAI();
  const base64Data = base64Image.split(',')[1] || base64Image;
  let mimeType = 'image/png';
  if (base64Image.includes('image/jpeg')) mimeType = 'image/jpeg';
  if (base64Image.includes('image/webp')) mimeType = 'image/webp';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: prompt }
        ]
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
           return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (e) {
    console.error("Image edit failed", e);
    return null;
  }
};
