
export interface User {
  id: string;
  name: string;
  isAnonymous: boolean;
  avatarUrl?: string;
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  SYSTEM = 'SYSTEM',
  STICKER = 'STICKER',
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: MessageType;
  isBot?: boolean;
  botType?: BotType;
  // Map of emoji char to array of userIds who reacted
  reactions?: Record<string, string[]>; 
}

export enum RoomType {
  PRIVATE = 'PRIVATE',
  GROUP = 'GROUP',
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  createdBy: string;
  createdAt: number;
  expiresAt?: number;
  activeBots: BotType[];
  adminIds: string[];
  theme?: 'light' | 'dark' | 'kenya';
}

export enum BotType {
  MODERATOR = 'MODERATOR',
  MEME = 'MEME',
  TRANSLATOR = 'TRANSLATOR', // Sheng <-> English
  SUMMARY = 'SUMMARY',
  HELPER = 'HELPER'
}

export interface BotConfig {
  type: BotType;
  name: string;
  description: string;
  icon: string;
  systemInstruction: string;
  triggers?: string[]; // Commands that trigger the bot explicitly
}