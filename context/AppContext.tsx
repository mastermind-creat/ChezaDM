
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Room, Message, MessageType, RoomType, BotType } from '../types';

interface AppContextType {
  currentUser: User | null;
  currentRoom: Room | null;
  messages: Message[];
  login: (name: string) => void;
  createRoom: (type: RoomType) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  sendMessage: (content: string, type?: MessageType) => void;
  addBotToRoom: (botType: BotType) => void;
  removeBotFromRoom: (botType: BotType) => void;
  addMessage: (msg: Message) => void;
  addReaction: (messageId: string, emoji: string) => void;
  isRoomAdmin: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Load user from local storage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('cheza_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (name: string) => {
    const user: User = {
      id: crypto.randomUUID(),
      name: name || `Guest-${Math.floor(Math.random() * 10000)}`,
      isAnonymous: !name,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
    };
    localStorage.setItem('cheza_user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const createRoom = (type: RoomType) => {
    if (!currentUser) return;

    const roomId = Math.random().toString(36).substring(2, 9);
    const newRoom: Room = {
      id: roomId,
      name: type === RoomType.PRIVATE ? "Private Session" : "Group Space",
      type,
      createdBy: currentUser.id,
      createdAt: Date.now(),
      activeBots: [],
      adminIds: [currentUser.id] // Creator is admin
    };
    
    initializeRoom(newRoom, "You created this secure session. Share the link to invite others.");
  };

  const joinRoom = (roomId: string) => {
    // In a real app, we would fetch room details from DB.
    // For this demo, we infer type from ID or default to GROUP if unknown,
    // and assume we are NOT admin if we are joining via ID.
    const newRoom: Room = {
      id: roomId,
      name: "Joined Session",
      type: RoomType.GROUP, // Default assumption
      createdBy: 'unknown',
      createdAt: Date.now(),
      activeBots: [],
      adminIds: [] // Joining user is not admin
    };
    
    initializeRoom(newRoom, "You joined the session.");
  };

  const initializeRoom = (room: Room, welcomeText: string) => {
    setCurrentRoom(room);
    setMessages([]); 
    
    const sysMsg: Message = {
      id: crypto.randomUUID(),
      roomId: room.id,
      senderId: 'system',
      senderName: 'System',
      content: welcomeText,
      timestamp: Date.now(),
      type: MessageType.SYSTEM
    };
    setMessages([sysMsg]);
  };

  const leaveRoom = () => {
    setCurrentRoom(null);
    setMessages([]);
  };

  const addMessage = (msg: Message) => {
    setMessages(prev => [...prev, msg]);
  };

  const sendMessage = (content: string, type: MessageType = MessageType.TEXT) => {
    if (!currentUser || !currentRoom) return;

    const msg: Message = {
      id: crypto.randomUUID(),
      roomId: currentRoom.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content,
      timestamp: Date.now(),
      type,
      reactions: {}
    };
    
    addMessage(msg);
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;

    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;

      const reactions = msg.reactions || {};
      const currentUsers = reactions[emoji] || [];
      
      // Toggle reaction
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
        id: crypto.randomUUID(),
        roomId: currentRoom.id,
        senderId: 'system',
        senderName: 'System',
        content: `${botType} Bot has been added to the chat.`,
        timestamp: Date.now(),
        type: MessageType.SYSTEM
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
      createRoom,
      joinRoom, 
      leaveRoom, 
      sendMessage,
      addBotToRoom,
      removeBotFromRoom,
      addMessage,
      addReaction,
      isRoomAdmin
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