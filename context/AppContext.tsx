
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, Room, Message, MessageType, RoomType, BotType, MessageStatus, P2PSignal, SignalType, ThemeType } from '../types';
import { generateUUID, generateShortID } from '../utils';

declare var Peer: any;

interface AppContextType {
  currentUser: User | null;
  currentRoom: Room | null;
  messages: Message[];
  login: (name: string, avatarUrl?: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  createRoom: (type: RoomType) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  sendMessage: (content: string, type?: MessageType, replyTo?: string) => void;
  editMessage: (messageId: string, newContent: string) => void;
  deleteMessage: (messageId: string) => void;
  addBotToRoom: (botType: BotType) => void;
  removeBotFromRoom: (botType: BotType) => void;
  addReaction: (messageId: string, emoji: string) => void;
  isRoomAdmin: boolean;
  isOnline: boolean;
  peers: string[];
  sendTypingSignal: (isTyping: boolean) => void;
  typingUsers: Record<string, string>;
  isConnecting: boolean;
  connectionError: string | null;
  theme: ThemeType;
  setAppTheme: (t: ThemeType) => void;
  chatBg: string;
  setChatBg: (url: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeType>('light');
  const [chatBg, setChatBgState] = useState('');
  
  const [peers, setPeers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const peerInstance = useRef<any>(null);
  const activeConnections = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('cheza_user');
      if (savedUser) {
        let user = JSON.parse(savedUser);
        // Migration: If the stored ID is long (UUID style), reset it to a Short ID
        if (user.id && user.id.length > 10) {
          user.id = generateShortID();
          localStorage.setItem('cheza_user', JSON.stringify(user));
        }
        setCurrentUser(user);
      }
      const savedTheme = localStorage.getItem('cheza_theme') as ThemeType;
      if (savedTheme) setTheme(savedTheme);
      const savedBg = localStorage.getItem('cheza_chat_bg');
      if (savedBg) setChatBgState(savedBg);
    } catch (e) {}

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    peerInstance.current = new Peer(currentUser.id, {
      debug: 1,
      config: { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }, { 'urls': 'stun:stun1.l.google.com:19302' }] }
    });
    peerInstance.current.on('connection', setupConnection);
    peerInstance.current.on('error', (err: any) => {
      console.error("PeerJS Error:", err);
      if (isConnecting) { 
        setConnectionError("Room not found or offline."); 
        setIsConnecting(false); 
      }
    });
    return () => peerInstance.current?.destroy();
  }, [currentUser?.id]);

  const setupConnection = (conn: any) => {
    conn.on('open', () => {
      activeConnections.current.set(conn.peer, conn);
      setPeers(prev => [...new Set([...prev, conn.peer])]);
      if (!isRoomAdmin) {
        sendSignalToPeer(conn, 'JOIN_REQUEST', { userId: currentUser?.id, name: currentUser?.name });
      }
    });
    conn.on('data', (data: P2PSignal) => handleIncomingSignal(data, conn));
    conn.on('close', () => {
      activeConnections.current.delete(conn.peer);
      setPeers(prev => prev.filter(id => id !== conn.peer));
    });
  };

  const handleIncomingSignal = (signal: P2PSignal, conn: any) => {
    switch (signal.type) {
      case 'JOIN_REQUEST':
        if (isRoomAdmin) {
           sendSignalToPeer(conn, 'JOIN_ACCEPTED', { room: currentRoom, history: messages });
        }
        break;
      case 'JOIN_ACCEPTED':
        if (isConnecting) {
          setCurrentRoom(signal.payload.room);
          setMessages(signal.payload.history || []);
          setIsConnecting(false);
        }
        break;
      case 'CHAT_MESSAGE':
        const msg = signal.payload as Message;
        setMessages(prev => (prev.find(m => m.id === msg.id) ? prev : [...prev, msg]));
        if (isRoomAdmin) relaySignal(signal, conn.peer);
        break;
      case 'MESSAGE_EDIT':
        const { id, content } = signal.payload;
        setMessages(prev => prev.map(m => m.id === id ? { ...m, content, isEdited: true } : m));
        if (isRoomAdmin) relaySignal(signal, conn.peer);
        break;
      case 'MESSAGE_DELETE':
        const { delId } = signal.payload;
        setMessages(prev => prev.map(m => m.id === delId ? { ...m, content: 'This message was deleted', isDeleted: true } : m));
        if (isRoomAdmin) relaySignal(signal, conn.peer);
        break;
      case 'TYPING_INDICATOR':
        const { isTyping, userName } = signal.payload;
        setTypingUsers(prev => {
          const next = { ...prev };
          if (isTyping) next[signal.senderId] = userName; else delete next[signal.senderId];
          return next;
        });
        if (isRoomAdmin) relaySignal(signal, conn.peer);
        break;
      case 'REACTION':
        const { messageId, emoji } = signal.payload;
        applyReactionLocal(messageId, emoji, signal.senderId);
        if (isRoomAdmin) relaySignal(signal, conn.peer);
        break;
    }
  };

  const relaySignal = (signal: P2PSignal, excludePeerId: string) => {
    activeConnections.current.forEach((conn, peerId) => {
      if (peerId !== excludePeerId && conn.open) conn.send(signal);
    });
  };

  const sendSignalToAll = (type: SignalType, payload: any) => {
    if (!currentUser) return;
    const signal: P2PSignal = { type, payload, senderId: currentUser.id, senderName: currentUser.name };
    activeConnections.current.forEach(conn => { if (conn.open) conn.send(signal); });
  };

  const sendSignalToPeer = (conn: any, type: SignalType, payload: any) => {
    if (!currentUser) return;
    const signal: P2PSignal = { type, payload, senderId: currentUser.id, senderName: currentUser.name };
    if (conn.open) conn.send(signal);
  };

  const login = (name: string, avatarUrl?: string) => {
    const user: User = { 
      id: generateShortID(), 
      name: name || 'Guest', 
      isAnonymous: !name, 
      avatarUrl: avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${name}` 
    };
    localStorage.setItem('cheza_user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const logout = () => {
    localStorage.removeItem('cheza_user');
    setCurrentUser(null);
    setCurrentRoom(null);
    setMessages([]);
    setPeers([]);
    activeConnections.current.forEach(c => c.close());
    activeConnections.current.clear();
  };

  const updateUser = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    localStorage.setItem('cheza_user', JSON.stringify(updatedUser));
  };

  const setAppTheme = (t: ThemeType) => { setTheme(t); localStorage.setItem('cheza_theme', t); };
  const setChatBg = (url: string) => { setChatBgState(url); localStorage.setItem('cheza_chat_bg', url); };

  const createRoom = (type: RoomType) => {
    if (!currentUser) return;
    setIsConnecting(true);
    const newRoom: Room = { 
      id: currentUser.id, 
      name: type === RoomType.PRIVATE ? "Private Session" : "Group Space", 
      type, 
      createdBy: currentUser.id, 
      createdAt: Date.now(), 
      activeBots: [], 
      adminIds: [currentUser.id] 
    };
    setTimeout(() => { 
      setCurrentRoom(newRoom); 
      setMessages([]); 
      setIsConnecting(false); 
    }, 600);
  };

  const joinRoom = (roomId: string) => {
    if (!currentUser || !peerInstance.current) return;
    const cleanId = roomId.trim().toUpperCase();
    setIsConnecting(true); 
    setConnectionError(null);
    const conn = peerInstance.current.connect(cleanId, { reliable: true });
    setupConnection(conn);
    
    const timeout = setTimeout(() => { 
      if (!activeConnections.current.has(cleanId)) {
        setIsConnecting(false); 
        setConnectionError("Could not find peer. Check the code."); 
      }
    }, 8000);
    
    return () => clearTimeout(timeout);
  };

  const leaveRoom = () => {
    activeConnections.current.forEach(c => c.close()); 
    activeConnections.current.clear();
    setCurrentRoom(null); 
    setMessages([]); 
    setPeers([]); 
    setTypingUsers({}); 
    setIsConnecting(false);
  };

  const sendMessage = (content: string, type: MessageType = MessageType.TEXT, replyTo?: string) => {
    if (!currentUser || !currentRoom) return;
    const msg: Message = { 
      id: generateUUID(), 
      roomId: currentRoom.id, 
      senderId: currentUser.id, 
      senderName: currentUser.name, 
      content, 
      timestamp: Date.now(), 
      type, 
      status: MessageStatus.SENT, 
      reactions: {}, 
      replyTo 
    };
    setMessages(prev => [...prev, msg]);
    sendSignalToAll('CHAT_MESSAGE', msg);
  };

  const editMessage = (id: string, content: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content, isEdited: true } : m));
    sendSignalToAll('MESSAGE_EDIT', { id, content });
  };

  const deleteMessage = (delId: string) => {
    setMessages(prev => prev.map(m => m.id === delId ? { ...m, content: 'This message was deleted', isDeleted: true } : m));
    sendSignalToAll('MESSAGE_DELETE', { delId });
  };

  const applyReactionLocal = (messageId: string, emoji: string, userId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;
      const reactions = { ...(msg.reactions || {}) };
      const currentUsers = reactions[emoji] || [];
      reactions[emoji] = currentUsers.includes(userId) ? currentUsers.filter(id => id !== userId) : [...currentUsers, userId];
      if (reactions[emoji].length === 0) delete reactions[emoji];
      return { ...msg, reactions };
    }));
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;
    applyReactionLocal(messageId, emoji, currentUser.id);
    sendSignalToAll('REACTION', { messageId, emoji });
  };

  const addBotToRoom = (botType: BotType) => { 
    if (currentRoom) setCurrentRoom({ ...currentRoom, activeBots: [...currentRoom.activeBots, botType] }); 
  };
  
  const removeBotFromRoom = (botType: BotType) => { 
    if (currentRoom) setCurrentRoom({ ...currentRoom, activeBots: currentRoom.activeBots.filter(b => b !== botType) }); 
  };

  const sendTypingSignal = (isTyping: boolean) => {
    if (!currentUser) return;
    sendSignalToAll('TYPING_INDICATOR', { isTyping, userName: currentUser.name });
  };

  const isRoomAdmin = !!(currentUser && currentRoom && currentRoom.adminIds.includes(currentUser.id));

  return (
    <AppContext.Provider value={{ 
      currentUser, currentRoom, messages, login, logout, updateUser,
      createRoom, joinRoom, leaveRoom, sendMessage, editMessage, deleteMessage,
      addBotToRoom, removeBotFromRoom, addReaction,
      isRoomAdmin, isOnline, peers, sendTypingSignal, typingUsers,
      isConnecting, connectionError, theme, setAppTheme, chatBg, setChatBg
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp error");
  return context;
};
