
import { GoogleGenAI } from "@google/genai";
import { BotType, Message } from "../types";
import { BOTS } from "../constants";

// Initialize Gemini API with named parameter as required
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBotResponse = async (
  botType: BotType,
  userMessage: string,
  chatHistory: Message[] = []
): Promise<string> => {
  const botConfig = BOTS[botType];
  
  // Use search tool for Helper bot. Use gemini-3-flash-preview for general text tasks.
  const tools = botType === BotType.HELPER ? [{ googleSearch: {} }] : undefined;
  const modelId = 'gemini-3-flash-preview'; 

  try {
    let prompt = userMessage;

    // Special handling for Summary bot which needs history
    if (botType === BotType.SUMMARY) {
      const historyText = chatHistory
        .slice(-20) // Last 20 messages
        .map(m => `${m.senderName}: ${m.content}`)
        .join('\n');
      prompt = `Here is the chat history:\n${historyText}\n\nPlease summarize this.`;
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

    // Handle Search Grounding Metadata
    if (botType === BotType.HELPER && response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      const chunks = response.candidates[0].groundingMetadata.groundingChunks;
      const links = chunks
        .map((chunk: any) => chunk.web ? `[${chunk.web.title}](${chunk.web.uri})` : null)
        .filter(Boolean);
      
      if (links.length > 0) {
        textResponse += "\n\nSources:\n" + links.map((l: string) => `- ${l}`).join("\n");
      }
    }

    return textResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble connecting right now.";
  }
};

export const checkModeration = async (text: string): Promise<{ safe: boolean; reason?: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: text,
      config: {
        systemInstruction: BOTS[BotType.MODERATOR].systemInstruction,
        temperature: 0, // Deterministic
      },
    });

    const result = response.text?.trim();
    if (result === 'SAFE') {
      return { safe: true };
    }
    return { safe: false, reason: result };
  } catch (e) {
    console.error("Moderation check failed", e);
    return { safe: true }; 
  }
};

export const polishDraft = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Rewrite the following chat message to be clear, grammatically correct, and engaging (keep it casual but polished): "${text}"`,
    });
    // Extract text and remove wrapping quotes if present
    return response.text?.replace(/^"|"$/g, '') || text;
  } catch (e) {
    console.error("Polish failed", e);
    return text;
  }
};

export const editChatImage = async (base64Image: string, prompt: string): Promise<string | null> => {
  // Strip header if present to get raw base64
  const base64Data = base64Image.split(',')[1] || base64Image;
  // Detect mime type or default to png
  let mimeType = 'image/png';
  if (base64Image.includes('image/jpeg')) mimeType = 'image/jpeg';
  if (base64Image.includes('image/webp')) mimeType = 'image/webp';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { 
            inlineData: { 
              mimeType: mimeType, 
              data: base64Data 
            } 
          },
          { text: prompt }
        ]
      }
    });

    // Find image part in candidates
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
