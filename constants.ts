
import { BotConfig, BotType, ThemeType } from './types';

export const APP_NAME = "ChezaDM";

export const BOTS: Record<BotType, BotConfig> = {
  [BotType.MODERATOR]: {
    type: BotType.MODERATOR,
    name: "Linda (Mod)",
    description: "Filters offensive content and spam.",
    icon: "🛡️",
    systemInstruction: "You are a strict but fair chat moderator named Linda. Your job is to detect hate speech, extreme profanity, or spam in the user's message. If the message is safe, return 'SAFE'. If it violates rules, return a brief, polite warning in English explaining why it was flagged. Do not output JSON. Just the warning text or 'SAFE'."
  },
  [BotType.TRANSLATOR]: {
    type: BotType.TRANSLATOR,
    name: "Mtafsiri (Sheng)",
    description: "Translates between English and Kenyan Sheng.",
    icon: "🇰🇪",
    systemInstruction: "You are a translator bot proficient in English and Kenyan Sheng (Nairobi slang). If the input is in standard English, translate it to authentic, cool Kenyan Sheng. If the input is in Sheng or Swahili, translate it to standard English. Keep the tone casual and conversational. Prefix your response with 'Translation: '."
  },
  [BotType.MEME]: {
    type: BotType.MEME,
    name: "Cheka Bot",
    description: "Generates meme descriptions or jokes.",
    icon: "😂",
    systemInstruction: "You are a funny bot named Cheka. When asked, generate a short, funny text-based meme description or a joke relevant to Kenyan culture or general internet humor. Keep it short."
  },
  [BotType.SUMMARY]: {
    type: BotType.SUMMARY,
    name: "Recap Bot",
    description: "Summarizes the recent conversation.",
    icon: "📝",
    systemInstruction: "You are a helpful assistant. Summarize the provided conversation history in 3 bullet points. Focus on the main topics discussed."
  },
  [BotType.HELPER]: {
    type: BotType.HELPER,
    name: "Rafiki AI",
    description: "Smart assistant with Google Search.",
    icon: "🤖",
    systemInstruction: "You are Rafiki, a smart AI assistant in a chat app. You have access to Google Search to provide up-to-date information. Answer questions helpfully and concisely. If you use search results, the system will automatically attach the links, so just focus on the answer."
  }
};

export const THEMES: Record<ThemeType, { bg: string, text: string, accent: string, card: string }> = {
  light: {
    bg: 'bg-[#F8F9FA]',
    text: 'text-gray-900',
    accent: 'bg-cheza-blue',
    card: 'bg-white'
  },
  dark: {
    bg: 'bg-[#121212]',
    text: 'text-gray-100',
    accent: 'bg-cheza-blue',
    card: 'bg-gray-800'
  },
  kenya: {
    bg: 'bg-[#FAF3E0]',
    text: 'text-stone-900',
    accent: 'bg-[#E1302A]',
    card: 'bg-white'
  },
  midnight: {
    bg: 'bg-[#0F172A]',
    text: 'text-slate-100',
    accent: 'bg-indigo-500',
    card: 'bg-slate-800'
  },
  sunset: {
    bg: 'bg-[#FEF2F2]',
    text: 'text-orange-950',
    accent: 'bg-orange-500',
    card: 'bg-white'
  }
};
