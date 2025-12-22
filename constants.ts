
import { BotConfig, BotType, ThemeType } from './types';

export const APP_NAME = "ChezaDM";

export const BOTS: Record<BotType, BotConfig> = {
  [BotType.MODERATOR]: {
    type: BotType.MODERATOR,
    name: "Linda (Mod)",
    description: "Filters offensive content.",
    icon: "🛡️",
    systemInstruction: "Strict moderator. Return 'SAFE' or a warning."
  },
  [BotType.TRANSLATOR]: {
    type: BotType.TRANSLATOR,
    name: "Mtafsiri",
    description: "Sheng ↔ English.",
    icon: "🇰🇪",
    systemInstruction: "Translate Sheng to English or vice-versa."
  },
  [BotType.MEME]: {
    type: BotType.MEME,
    name: "Cheka",
    description: "Kenyan jokes.",
    icon: "😂",
    systemInstruction: "Funny Kenyan memes and jokes."
  },
  [BotType.SUMMARY]: {
    type: BotType.SUMMARY,
    name: "Recap",
    description: "Summarizes chat.",
    icon: "📝",
    systemInstruction: "Summarize chat in 3 bullets."
  },
  [BotType.HELPER]: {
    type: BotType.HELPER,
    name: "Rafiki",
    description: "Smart Assistant.",
    icon: "🤖",
    systemInstruction: "Smart AI with search."
  }
};

export interface ThemeConfig {
  bg: string;
  text: string;
  accent: string;
  card: string;
  bubbleMe: string;
  bubbleThem: string;
  input: string;
  border: string;
}

export const THEMES: Record<ThemeType, ThemeConfig> = {
  light: {
    bg: 'bg-[#F0F2F5]',
    text: 'text-gray-900',
    accent: 'bg-[#007BFF]',
    card: 'bg-white',
    bubbleMe: 'bg-[#007BFF] text-white',
    bubbleThem: 'bg-white text-gray-900 border border-gray-100',
    input: 'bg-white',
    border: 'border-gray-200'
  },
  dark: {
    bg: 'bg-[#0b141a]',
    text: 'text-gray-100',
    accent: 'bg-[#007BFF]',
    card: 'bg-[#1f2c33]',
    bubbleMe: 'bg-[#005c4b] text-white',
    bubbleThem: 'bg-[#202c33] text-gray-100',
    input: 'bg-[#2a3942]',
    border: 'border-[#313d45]'
  },
  kenya: {
    bg: 'bg-[#FAF3E0]',
    text: 'text-stone-900',
    accent: 'bg-[#E1302A]',
    card: 'bg-white',
    bubbleMe: 'bg-[#E1302A] text-white',
    bubbleThem: 'bg-[#006600] text-white',
    input: 'bg-white',
    border: 'border-[#E1302A]/20'
  },
  midnight: {
    bg: 'bg-[#0F172A]',
    text: 'text-slate-100',
    accent: 'bg-indigo-500',
    card: 'bg-slate-800',
    bubbleMe: 'bg-indigo-600 text-white',
    bubbleThem: 'bg-slate-700 text-slate-100',
    input: 'bg-slate-900',
    border: 'border-slate-700'
  },
  sunset: {
    bg: 'bg-[#FEF2F2]',
    text: 'text-orange-950',
    accent: 'bg-orange-500',
    card: 'bg-white',
    bubbleMe: 'bg-orange-500 text-white',
    bubbleThem: 'bg-rose-100 text-orange-950',
    input: 'bg-white',
    border: 'border-orange-100'
  },
  matrix: {
    bg: 'bg-black',
    text: 'text-green-500',
    accent: 'bg-green-600',
    card: 'bg-[#0a0a0a]',
    bubbleMe: 'bg-green-900/40 text-green-300 border border-green-500/50',
    bubbleThem: 'bg-zinc-900/80 text-green-500 border border-green-500/20',
    input: 'bg-black text-green-500 border-green-500/40',
    border: 'border-green-500/20'
  }
};

export const CHAT_BGS = [
  { id: 'none', url: '', label: 'Clean' },
  { id: 'matrix_flow', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcms1Y2l4Mnp0emh5eHJtZzN6Z3R3Z3B6Z3R3Z3B6Z3R3Z3B6ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjP8rC3nC9cM8/giphy.gif', label: 'Matrix Code' },
  { id: 'wa_classic', url: 'https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png', label: 'WhatsApp' },
  { id: 'cyberpunk', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3h2cnB2amZqOHZnb3p1ZzVndndzZzRyeGZ4eWZ4eWZ4eWZ4eWZ4ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Lp9pyC5h0N984/giphy.gif', label: 'Cyber City' },
  { id: 'nebula', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExenF2bnJ2amZqOHZnb3p1ZzVndndzZzRyeGZ4eWZ4eWZ4eWZ4eWZ4ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKMGpxSOfy/giphy.gif', label: 'Nebula' },
  { id: 'digital_rain', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcm5vMzl5emh5eHJtZzN6Z3R3Z3B6Z3R3Z3B6Z3R3Z3B6ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/A06UFEx8jLU7m/giphy.gif', label: 'Rainy Day' }
];
