import { GoogleGenAI } from "@google/genai";
import { BotType, Message } from "../types";
import { BOTS } from "../constants";

// Initialize Gemini API
// NOTE: In a production app, calls should be proxied through a backend to hide the API KEY.
// For this client-side demo, we assume the key is available in env.
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateBotResponse = async (
  botType: BotType,
  userMessage: string,
  chatHistory: Message[] = []
): Promise<string> => {
  if (!apiKey) {
    return "Error: API Key not configured.";
  }

  const botConfig = BOTS[botType];
  const modelId = 'gemini-2.5-flash'; // Fast model for chat

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
        maxOutputTokens: 150, // Keep chat responses concise
      },
    });

    return response.text || "...";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble connecting right now.";
  }
};

export const checkModeration = async (text: string): Promise<{ safe: boolean; reason?: string }> => {
  if (!apiKey) return { safe: true };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
    return { safe: true }; // Fail open to avoid blocking in error state (or fail closed depending on policy)
  }
};