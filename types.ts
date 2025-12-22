
export interface User {
  id: string;
  name: string;
  isAnonymous: boolean;
  avatarUrl?: string;
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
  STICKER = 'STICKER',
}

export enum MessageStatus {
  SENT = 'SENT',
  PENDING = 'PENDING',
  ERROR = 'ERROR'
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: MessageType;
  status?: MessageStatus;
  isBot?: boolean;
  botType?: BotType;
  reactions?: Record<string, string[]>; 
}

export enum RoomType {
  PRIVATE = 'PRIVATE',
  GROUP = 'GROUP',
}

export type ThemeType = 'light' | 'dark' | 'kenya' | 'midnight' | 'sunset';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  createdBy: string;
  createdAt: number;
  expiresAt?: number;
  activeBots: BotType[];
  adminIds: string[];
  theme?: ThemeType;
}

export enum BotType {
  MODERATOR = 'MODERATOR',
  MEME = 'MEME',
  TRANSLATOR = 'TRANSLATOR',
  SUMMARY = 'SUMMARY',
  HELPER = 'HELPER'
}

export interface BotConfig {
  type: BotType;
  name: string;
  description: string;
  icon: string;
  systemInstruction: string;
  triggers?: string[];
}

// P2P Signaling Types
export type SignalType = 'CHAT_MESSAGE' | 'TYPING_INDICATOR' | 'REACTION' | 'PEER_JOIN' | 'PEER_LEAVE' | 'JOIN_REQUEST' | 'JOIN_ACCEPTED';

export interface P2PSignal {
  type: SignalType;
  payload: any;
  senderId: string;
  senderName: string;
}
