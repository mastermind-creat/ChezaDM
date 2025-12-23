
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
    bg: 'bg-[#f8f5f0]',
    text: 'text-stone-900',
    accent: 'bg-[#E1302A]',
    card: 'bg-white',
    bubbleMe: 'bg-[#E1302A] text-white shadow-lg shadow-red-500/20',
    bubbleThem: 'bg-[#006600] text-white shadow-lg shadow-green-500/20',
    input: 'bg-white',
    border: 'border-[#E1302A]/20'
  },
  midnight: {
    bg: 'bg-[#020617]',
    text: 'text-slate-100',
    accent: 'bg-indigo-500',
    card: 'bg-slate-900/80',
    bubbleMe: 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/10',
    bubbleThem: 'bg-slate-800 text-slate-100 border border-slate-700',
    input: 'bg-slate-950',
    border: 'border-slate-800'
  },
  sunset: {
    bg: 'bg-[#fff5f5]',
    text: 'text-orange-950',
    accent: 'bg-orange-500',
    card: 'bg-white/80',
    bubbleMe: 'bg-gradient-to-br from-orange-500 to-rose-500 text-white',
    bubbleThem: 'bg-orange-50 text-orange-950 border border-orange-100',
    input: 'bg-white',
    border: 'border-orange-100'
  },
  matrix: {
    bg: 'bg-black',
    text: 'text-green-500',
    accent: 'bg-green-600',
    card: 'bg-black/90',
    bubbleMe: 'bg-green-900/30 text-green-400 border border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.1)]',
    bubbleThem: 'bg-zinc-950 text-green-500 border border-green-900/50',
    input: 'bg-black text-green-500 border-green-900',
    border: 'border-green-900/50'
  }
};

export const CHAT_BGS = [
  { id: 'none', url: '', label: 'Clean' },
  { id: 'luxe_gold', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpwaG54Znp3b3J4eWZ4eWZ4eWZ4eWZ4eWZ4eWZ4eWZ4ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKVUn7iM8FMEU24/giphy.gif', label: 'Luxe Gold' },
  { id: 'crystal_frost', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExenF2bnJ2amZqOHZnb3p1ZzVndndzZzRyeGZ4eWZ4eWZ4eWZ4eWZ4ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/vA5mj9v6Me5tS/giphy.gif', label: 'Crystal Frost' },
  { id: 'deep_nebula', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZ0bm56eXhjZ3R3Z3B6Z3R3Z3B6Z3R3Z3B6ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKv6FeYpXmG9WdW/giphy.gif', label: 'Deep Nebula' },
  { id: 'silk_flow', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHUxd2pndnd6Z3R3Z3B6Z3R3Z3B6Z3R3Z3B6ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/VseX2p2WvTGlW/giphy.gif', label: 'Silk Flow' },
  { id: 'cyber_neon', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcm5vMzl5emh5eHJtZzN6Z3R3Z3B6Z3R3Z3B6Z3R3Z3B6ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/A06UFEx8jLU7m/giphy.gif', label: 'Cyber Neon' },
  { id: 'aura', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNXpwaG54Znp3b3J4eWZ4eWZ4eWZ4eWZ4eWZ4eWZ4eWZ4ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l41lTfO7K9L2x1rCE/giphy.gif', label: 'Aura Glow' }
];
