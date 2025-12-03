
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Room, Message, MessageType, RoomType, BotType, MessageStatus } from '../types';
import { generateUUID } from '../utils';

interface AppContextType {
  currentUser: User | null;
  currentRoom: Room | null;
  messages: Message[];
  login: (name: string, avatarUrl?: string) => void;
  updateUser: (updates: Partial<User>) => void;
  createRoom: (type: RoomType) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  sendMessage: (content: string, type?: MessageType) => void;
  addBotToRoom: (botType: BotType) => void;
  removeBotFromRoom: (botType: BotType) => void;
  addMessage: (msg: Message) => void;
  addReaction: (messageId: string, emoji: string) => void;
  isRoomAdmin: boolean;
  isOnline: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Offline Capabilities
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingQueue, setPendingQueue] = useState<Message[]>([]);

  // 1. Load User & Cached Data on Mount
  useEffect(() => {
    try {
        const savedUser = localStorage.getItem('cheza_user');
        if (savedUser) setCurrentUser(JSON.parse(savedUser));

        // Cache recovery
        const savedRoom = localStorage.getItem('cheza_active_room');
        const savedMessages = localStorage.getItem('cheza_active_messages');
        const savedQueue = localStorage.getItem('cheza_offline_queue');

        if (savedRoom) setCurrentRoom(JSON.parse(savedRoom));
        if (savedMessages) setMessages(JSON.parse(savedMessages));
        if (savedQueue) setPendingQueue(JSON.parse(savedQueue));
    } catch (e) {
        console.error("Failed to load cached data", e);
    }

    // Network Listeners
    const handleOnline = () => {
      setIsOnline(true);
      flushOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Persistence Effects
  useEffect(() => {
    try {
        if (currentRoom) {
          localStorage.setItem('cheza_active_room', JSON.stringify(currentRoom));
          localStorage.setItem('cheza_active_messages', JSON.stringify(messages));
        } else {
          localStorage.removeItem('cheza_active_room');
          localStorage.removeItem('cheza_active_messages');
        }
    } catch (e) {
        console.error("Failed to save chat state (Quota Exceeded?)", e);
    }
  }, [currentRoom, messages]);

  // 3. Flush Queue logic
  const flushOfflineQueue = () => {
    setPendingQueue(prevQueue => {
      if (prevQueue.length === 0) return [];
      
      // In a real app, send to backend here. 
      // Here we just mark them as sent in the UI.
      setMessages(currentMsgs => currentMsgs.map(msg => {
        const wasPending = prevQueue.find(p => p.id === msg.id);
        if (wasPending) {
          return { ...msg, status: MessageStatus.SENT };
        }
        return msg;
      }));

      localStorage.removeItem('cheza_offline_queue');
      return [];
    });
  };

  const login = (name: string, avatarUrl?: string) => {
    const safeName = name || `Guest-${Math.floor(Math.random() * 10000)}`;
    
    // Use provided avatar, or generate one using DiceBear v9
    const finalAvatar = avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(safeName)}`;

    const user: User = {
      id: generateUUID(),
      name: safeName,
      isAnonymous: !name,
      avatarUrl: finalAvatar
    };
    
    try {
      localStorage.setItem('cheza_user', JSON.stringify(user));
    } catch (e) {
      console.error("Storage Error (likely image too big)", e);
      alert("Note: Profile image too large to save offline, but you can chat normally.");
    }
    setCurrentUser(user);
  };

  const updateUser = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    try {
        localStorage.setItem('cheza_user', JSON.stringify(updatedUser));
    } catch (e) {
        console.error("Failed to update user profile storage", e);
        alert("Could not save profile changes to storage. (Image too large?)");
    }
  };

  const createRoom = (type: RoomType) => {
    if (!currentUser) return;

    // Generate Time-Encoded ID for Expiration Logic
    // Format: [Base36Timestamp]-[RandomPart]
    const timestampCode = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 6);
    const roomId = `${timestampCode}-${randomPart}`;

    const newRoom: Room = {
      id: roomId,
      name: type === RoomType.PRIVATE ? "Private Session" : "Group Space",
      type,
      createdBy: currentUser.id,
      createdAt: Date.now(),
      activeBots: [],
      adminIds: [currentUser.id]
    };
    
    initializeRoom(newRoom, "You created this secure session. Share the link to invite others.");
  };

  const joinRoom = (roomId: string) => {
    // 1. ID Expiration Check (20 Minutes)
    try {
      const parts = roomId.split('-');
      if (parts.length >= 2) {
        const timePart = parts[0];
        const createdAt = parseInt(timePart, 36);
        
        // Check if valid number
        if (!isNaN(createdAt)) {
           const twentyMinutes = 20 * 60 * 1000;
           const now = Date.now();
           
           if (now - createdAt > twentyMinutes) {
             alert("⚠️ This Join ID has expired (valid for 20 mins). Please ask for a new one.");
             return;
           }
        }
      }
    } catch (e) {
      console.error("ID Parse Error", e);
      // Continue if parse fails (fallback for older IDs or manual entry errors)
    }

    // 2. Mock Join
    const newRoom: Room = {
      id: roomId,
      name: "Joined Session",
      type: RoomType.GROUP,
      createdBy: 'unknown',
      createdAt: Date.now(),
      activeBots: [],
      adminIds: []
    };
    
    initializeRoom(newRoom, "You joined the session.");
  };

  const initializeRoom = (room: Room, welcomeText: string) => {
    setCurrentRoom(room);
    setMessages([]); 
    
    const sysMsg: Message = {
      id: generateUUID(),
      roomId: room.id,
      senderId: 'system',
      senderName: 'System',
      content: welcomeText,
      timestamp: Date.now(),
      type: MessageType.SYSTEM,
      status: MessageStatus.SENT
    };
    setMessages([sysMsg]);
  };

  const leaveRoom = () => {
    setCurrentRoom(null);
    setMessages([]);
    setPendingQueue([]);
    localStorage.removeItem('cheza_active_room');
    localStorage.removeItem('cheza_active_messages');
    localStorage.removeItem('cheza_offline_queue');
  };

  const addMessage = (msg: Message) => {
    setMessages(prev => [...prev, msg]);
  };

  const sendMessage = (content: string, type: MessageType = MessageType.TEXT) => {
    if (!currentUser || !currentRoom) return;

    // Determine Status based on Connectivity
    const status = isOnline ? MessageStatus.SENT : MessageStatus.PENDING;

    const msg: Message = {
      id: generateUUID(),
      roomId: currentRoom.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content,
      timestamp: Date.now(),
      type,
      status,
      reactions: {}
    };
    
    addMessage(msg);

    // Queue if offline
    if (!isOnline) {
      const newQueue = [...pendingQueue, msg];
      setPendingQueue(newQueue);
      try {
        localStorage.setItem('cheza_offline_queue', JSON.stringify(newQueue));
      } catch (e) {
        console.error("Queue storage full", e);
      }
    }
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;

    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;

      const reactions = msg.reactions || {};
      const currentUsers = reactions[emoji] || [];
      
      let newUsers;
      if (currentUsers.includes(currentUser.id)) {
        newUsers = currentUsers.filter(id => id !== currentUser.id);
      } else {
        newUsers = [...currentUsers, currentUser.id];
      }

      const newReactions = { ...reactions };
      if (newUsers.length > 0) {
        newReactions[emoji] = newUsers;
      } else {
        delete newReactions[emoji];
      }

      return { ...msg, reactions: newReactions };
    }));
  };

  const addBotToRoom = (botType: BotType) => {
    if (!currentRoom) return;
    if (currentRoom.activeBots.includes(botType)) return;
    
    setCurrentRoom({
        ...currentRoom,
        activeBots: [...currentRoom.activeBots, botType]
    });

    const sysMsg: Message = {
        id: generateUUID(),
        roomId: currentRoom.id,
        senderId: 'system',
        senderName: 'System',
        content: `${botType} Bot has been added to the chat.`,
        timestamp: Date.now(),
        type: MessageType.SYSTEM,
        status: MessageStatus.SENT
    };
    addMessage(sysMsg);
  };

  const removeBotFromRoom = (botType: BotType) => {
    if (!currentRoom) return;
    setCurrentRoom({
        ...currentRoom,
        activeBots: currentRoom.activeBots.filter(b => b !== botType)
    });
  };

  const isRoomAdmin = !!(currentUser && currentRoom && currentRoom.adminIds.includes(currentUser.id));

  return (
    <AppContext.Provider value={{ 
      currentUser, 
      currentRoom, 
      messages, 
      login, 
      updateUser,
      createRoom,
      joinRoom, 
      leaveRoom, 
      sendMessage,
      addBotToRoom,
      removeBotFromRoom,
      addMessage,
      addReaction,
      isRoomAdmin,
      isOnline
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
