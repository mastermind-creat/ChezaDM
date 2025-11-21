
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { BotControl } from './BotControl';
import { MessageType, Message, BotType } from '../types';
import { generateBotResponse, checkModeration } from '../services/geminiService';
import { BOTS } from '../constants';

// Sound Effect
const POP_SOUND = "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3";

const STICKERS = [
  "🇰🇪", "🙌", "🔥", "😂", "👋", "❤️", "💯", "👀", 
  "Mazuri", "Ndio Hiyo!", "Eish!", "Sawa", "Aje?", "Poa", "Tucheze!"
];

const REACTIONS = ["❤️", "😂", "👍", "😮", "😭"];

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const ChatRoom: React.FC = () => {
  const { currentRoom, messages, currentUser, sendMessage, addMessage, leaveRoom, isRoomAdmin, addReaction } = useApp();
  
  // Input States
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showBotPanel, setShowBotPanel] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  
  // Interaction States
  const [isTyping, setIsTyping] = useState(false);
  const [showCreatedModal, setShowCreatedModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial "Created" Modal
  useEffect(() => {
    if (isRoomAdmin && messages.length <= 1 && currentRoom?.createdBy === currentUser?.id) {
      setShowCreatedModal(true);
    }
  }, [currentRoom, isRoomAdmin]); // eslint-disable-line

  // Audio Effect
  useEffect(() => {
    if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.senderId !== currentUser?.id) {
            const audio = new Audio(POP_SOUND);
            audio.volume = 0.5;
            audio.play().catch(() => {}); 
        }
    }
  }, [messages.length, currentUser?.id, messages]);

  // Bot Processing
  useEffect(() => {
    if (!currentRoom || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.senderId === currentUser?.id && !lastMessage.isBot && lastMessage.type !== MessageType.SYSTEM) {
      processBotResponses(lastMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, currentRoom, currentUser]);

  const processBotResponses = async (msg: Message) => {
    if (!currentRoom || msg.type !== MessageType.TEXT) return;

    // 1. Moderator Check
    if (currentRoom.activeBots.includes(BotType.MODERATOR)) {
      const modResult = await checkModeration(msg.content);
      if (!modResult.safe) {
         const warningMsg: Message = {
          id: crypto.randomUUID(),
          roomId: currentRoom.id,
          senderId: 'bot-mod',
          senderName: BOTS[BotType.MODERATOR].name,
          content: `⚠️ Message Flagged: ${modResult.reason || 'Content violation'}.`,
          timestamp: Date.now(),
          type: MessageType.TEXT,
          isBot: true,
          botType: BotType.MODERATOR
        };
        addMessage(warningMsg);
        return; 
      }
    }

    // 2. Other Bots
    currentRoom.activeBots.forEach(async (botType) => {
      if (botType === BotType.MODERATOR) return; 

      const shouldRespond = 
        botType === BotType.TRANSLATOR || 
        msg.content.toLowerCase().includes(BOTS[botType].name.toLowerCase()) ||
        msg.content.toLowerCase().includes('bot');

      if (shouldRespond) {
        setIsTyping(true);
        const reply = await generateBotResponse(botType, msg.content, messages);
        setIsTyping(false);

        const botMsg: Message = {
          id: crypto.randomUUID(),
          roomId: currentRoom.id,
          senderId: `bot-${botType}`,
          senderName: BOTS[botType].name,
          content: reply,
          timestamp: Date.now(),
          type: MessageType.TEXT,
          isBot: true,
          botType: botType
        };
        addMessage(botMsg);
      }
    });
  };

  // --- HANDLERS ---

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText, MessageType.TEXT);
    setInputText('');
    setShowStickers(false);
    setShowAttachMenu(false);
  };

  const handleStickerClick = (sticker: string) => {
    sendMessage(sticker, MessageType.STICKER);
    setShowStickers(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: MessageType) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
        const base64 = await fileToBase64(file);
        if (type === MessageType.FILE) {
            // For generic files, we store metadata + base64 in content
            const content = JSON.stringify({ name: file.name, size: file.size, data: base64 });
            sendMessage(content, MessageType.FILE);
        } else {
            // For Image/Video, just base64
            sendMessage(base64, type);
        }
        setShowAttachMenu(false);
    } catch (err) {
        console.error("File read error", err);
        showToast("Failed to attach file");
    }
    // Reset input
    e.target.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          sendMessage(base64data, MessageType.AUDIO);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      showToast("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleShare = async () => {
    if (!currentRoom) return;
    const shareText = `Join my ${currentRoom.name} on ChezaDM! Code: ${currentRoom.id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
            title: 'ChezaDM Chat',
            text: shareText,
            url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(currentRoom.id);
        showToast("ID Copied to Clipboard! 📋");
      }
    } catch (err) {
      // Fallback
      await navigator.clipboard.writeText(currentRoom.id);
      showToast("ID Copied to Clipboard! 📋");
    }
  };

  const toggleReaction = (msgId: string, emoji: string) => {
    addReaction(msgId, emoji);
    setActiveReactionMsgId(null);
  };

  // --- RENDER HELPERS ---

  const renderMessageContent = (msg: Message) => {
    switch (msg.type) {
        case MessageType.STICKER:
            return <div className="text-6xl drop-shadow-lg animate-pop-in">{msg.content}</div>;
        
        case MessageType.IMAGE:
            return (
                <img 
                    src={msg.content} 
                    alt="Attachment" 
                    className="max-w-full rounded-lg max-h-64 object-cover" 
                    loading="lazy"
                />
            );
            
        case MessageType.VIDEO:
            return (
                <video controls className="max-w-full rounded-lg max-h-64">
                    <source src={msg.content} />
                    Your browser does not support video.
                </video>
            );

        case MessageType.AUDIO:
            return (
                <div className="flex items-center min-w-[150px]">
                   <audio controls src={msg.content} className="max-w-[200px] h-10" />
                </div>
            );

        case MessageType.FILE:
            try {
                const fileData = JSON.parse(msg.content);
                return (
                    <a href={fileData.data} download={fileData.name} className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                        <div className="bg-cheza-blue text-white p-2 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="font-bold truncate text-sm">{fileData.name}</span>
                            <span className="text-xs text-gray-500">Click to download</span>
                        </div>
                    </a>
                );
            } catch {
                return <span className="text-red-500 text-xs">Invalid File</span>;
            }

        case MessageType.TEXT:
        default:
            return <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>;
    }
  };

  if (!currentRoom) return null;

  return (
    <div className="flex flex-col h-full bg-[#e5ddd5] dark:bg-[#0b141a] relative">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
          <div className="absolute top-16 left-0 right-0 z-50 flex justify-center animate-slide-up pointer-events-none">
              <div className="bg-cheza-black text-white px-6 py-2 rounded-full shadow-2xl flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-cheza-green">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-bold text-sm">{toastMessage}</span>
              </div>
          </div>
      )}

      {/* Header */}
      <header className="bg-cheza-blue text-white p-3 shadow-md flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center space-x-2">
          <button onClick={leaveRoom} className="p-1.5 hover:bg-white/10 rounded-full">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="flex flex-col">
            <h1 className="font-bold text-base leading-tight flex items-center">
                {currentRoom.name}
            </h1>
            <div className="text-xs opacity-90 flex items-center space-x-1 font-mono bg-black/20 px-1.5 py-0.5 rounded w-fit cursor-pointer" onClick={handleShare}>
              <span>{currentRoom.id}</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 opacity-70">
                <path fillRule="evenodd" d="M15.988 3.012A2.25 2.25 0 0118 5.25v6.5A2.25 2.25 0 0115.75 14H13.5V7A2.5 2.5 0 0011 4.5H8.128l6.25-1.25a2.25 2.25 0 011.61.238zm-5.238 1.488h-5.5a2.25 2.25 0 00-2.25 2.25v9.5a2.25 2.25 0 002.25 2.25h5.5a2.25 2.25 0 002.25-2.25v-9.5a2.25 2.25 0 00-2.25-2.25z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button onClick={handleShare} className="p-2 hover:bg-white/10 rounded-full" title="Copy Link">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
          </button>
          
          {isRoomAdmin && (
            <button onClick={() => setShowBotPanel(true)} className="p-2 hover:bg-white/10 rounded-full">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-safe relative" onClick={() => { setActiveReactionMsgId(null); setShowAttachMenu(false); }}>
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.id;
          const isSystem = msg.type === MessageType.SYSTEM;
          const isAdminMsg = currentRoom.adminIds.includes(msg.senderId);
          const isSticker = msg.type === MessageType.STICKER;
          
          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <span className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full shadow-sm font-medium">
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex w-full group ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
              <div className={`flex max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end relative`}>
                {/* Avatar */}
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 mr-2 flex items-center justify-center overflow-hidden shrink-0 border border-white shadow-sm">
                     {msg.isBot ? (
                       <span className="text-sm">{BOTS[msg.botType || BotType.HELPER]?.icon}</span>
                     ) : (
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderName}`} alt="av" />
                     )}
                  </div>
                )}

                {/* Message Bubble */}
                <div 
                    onClick={(e) => { e.stopPropagation(); setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id); }}
                    className={`
                    relative shadow-sm text-sm cursor-pointer transition-all active:scale-95
                    ${isSticker 
                        ? 'bg-transparent shadow-none p-0' 
                        : isMe 
                            ? 'bg-cheza-blue text-white rounded-2xl rounded-br-none' 
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-none'
                    }
                    ${!isSticker ? 'px-4 py-2' : ''}
                  `}
                >
                  {/* Sender Name (Group only) */}
                  {!isMe && !isSticker && (
                    <div className="flex items-center space-x-1 mb-1">
                      <p className={`text-[10px] font-bold ${msg.isBot ? 'text-cheza-blue' : 'text-orange-600'}`}>
                        {msg.senderName} {msg.isBot && '🤖'}
                      </p>
                      {isAdminMsg && !msg.isBot && (
                        <span className="bg-cheza-yellow text-black text-[8px] px-1 rounded font-bold">ADMIN</span>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  {renderMessageContent(msg)}

                  {/* Timestamp */}
                  {!isSticker && (
                    <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  )}

                  {/* Reactions Display */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className={`absolute -bottom-3 ${isMe ? '-left-2' : '-right-2'} flex space-x-1 z-10`}>
                          {Object.entries(msg.reactions).map(([emoji, users]) => (
                              <span key={emoji} className="bg-white dark:bg-gray-700 rounded-full px-1.5 py-0.5 text-[10px] shadow border border-gray-100 dark:border-gray-600">
                                  {emoji} <span className="font-bold">{users.length}</span>
                              </span>
                          ))}
                      </div>
                  )}

                  {/* Reaction Toolbar Popup */}
                  {activeReactionMsgId === msg.id && (
                      <div className={`absolute -top-10 ${isMe ? 'right-0' : 'left-0'} bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-100 dark:border-gray-700 p-1 flex space-x-1 animate-pop-in z-20`}>
                          {REACTIONS.map(emoji => (
                              <button 
                                key={emoji}
                                onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, emoji); }}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-lg transition hover:scale-110"
                              >
                                  {emoji}
                              </button>
                          ))}
                      </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {isTyping && (
            <div className="flex justify-start w-full mb-4">
                 <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center space-x-1 ml-10">
                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Created Modal for Admin */}
      {showCreatedModal && (
          <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-xs text-center shadow-2xl">
                  <div className="w-16 h-16 bg-cheza-green rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Session Ready!</h3>
                  <p className="text-sm text-gray-500 mb-4">Share this code with friends.</p>
                  
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-xl font-mono text-xl font-bold tracking-widest mb-4 border border-gray-200 dark:border-gray-600 select-all">
                      {currentRoom.id}
                  </div>

                  <button 
                    onClick={() => {
                        handleShare();
                        setShowCreatedModal(false);
                    }}
                    className="w-full py-3 bg-cheza-blue text-white rounded-xl font-bold shadow-lg mb-2"
                  >
                      Copy & Share
                  </button>
              </div>
          </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-gray-100 dark:bg-gray-900 pb-safe-offset-2 shrink-0 relative">
        
        {/* Sticker Panel */}
        {showStickers && (
            <div className="absolute bottom-20 left-3 right-3 bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-lg animate-slide-up z-30">
                <div className="flex overflow-x-auto space-x-2 pb-2">
                    {STICKERS.map((sticker, i) => (
                        <button 
                            key={i} 
                            onClick={() => handleStickerClick(sticker)}
                            className="text-3xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition transform hover:scale-110 shrink-0"
                        >
                            {sticker}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Attachment Menu */}
        {showAttachMenu && (
            <div className="absolute bottom-20 left-3 bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-xl animate-pop-in z-30 flex flex-col space-y-2 w-40">
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl space-x-3 text-gray-700 dark:text-gray-200">
                    <span className="bg-purple-100 text-purple-600 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                    </span>
                    <span className="font-medium text-sm">Photo</span>
                </button>
                <button onClick={() => videoInputRef.current?.click()} className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl space-x-3 text-gray-700 dark:text-gray-200">
                    <span className="bg-red-100 text-red-600 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
                    </span>
                    <span className="font-medium text-sm">Video</span>
                </button>
                <button onClick={() => docInputRef.current?.click()} className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl space-x-3 text-gray-700 dark:text-gray-200">
                    <span className="bg-blue-100 text-blue-600 p-2 rounded-full">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    </span>
                    <span className="font-medium text-sm">Document</span>
                </button>
            </div>
        )}
        
        {/* Hidden Inputs */}
        <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileSelect(e, MessageType.IMAGE)} accept="image/*" />
        <input type="file" ref={videoInputRef} className="hidden" onChange={(e) => handleFileSelect(e, MessageType.VIDEO)} accept="video/*" />
        <input type="file" ref={docInputRef} className="hidden" onChange={(e) => handleFileSelect(e, MessageType.FILE)} accept="*" />

        <form onSubmit={handleSend} className="flex items-center space-x-2">
           {/* Attachment Toggle */}
           <button 
            type="button" 
            onClick={() => { setShowAttachMenu(!showAttachMenu); setShowStickers(false); }}
            className={`p-2.5 rounded-full shadow-sm transition ${showAttachMenu ? 'bg-gray-300 dark:bg-gray-600 rotate-45' : 'bg-white dark:bg-gray-800 text-gray-500'}`}
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
           </button>

           {/* Sticker Toggle */}
           <button 
            type="button" 
            onClick={() => { setShowStickers(!showStickers); setShowAttachMenu(false); }}
            className={`p-2.5 rounded-full shadow-sm transition ${showStickers ? 'bg-cheza-yellow text-black' : 'bg-white dark:bg-gray-800 text-gray-500'}`}
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
            </svg>
           </button>
           
           {/* Main Input / Recording Status */}
           {isRecording ? (
               <div className="flex-1 flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-full border border-red-200 dark:border-red-800 animate-pulse">
                   <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 font-bold text-sm">
                       <div className="w-3 h-3 bg-red-600 rounded-full animate-ping"></div>
                       <span>Recording...</span>
                   </div>
                   <button type="button" onClick={stopRecording} className="text-xs bg-white dark:bg-red-900 text-red-600 px-3 py-1 rounded-full font-bold shadow-sm">
                       STOP
                   </button>
               </div>
           ) : (
               <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                onFocus={() => { setShowStickers(false); setShowAttachMenu(false); }}
                className="flex-1 p-3 rounded-full border-none focus:ring-2 focus:ring-cheza-blue bg-white dark:bg-gray-800 dark:text-white shadow-inner text-base"
               />
           )}

           {/* Send / Mic Button */}
           {inputText.trim() ? (
               <button 
                type="submit" 
                className="p-3 bg-cheza-blue text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
               </button>
           ) : (
               <button 
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-3 rounded-full shadow-lg transition-all ${isRecording ? 'bg-red-500 text-white scale-110' : 'bg-cheza-green text-white hover:bg-green-600'}`}
               >
                 {isRecording ? (
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
                    </svg>
                 ) : (
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                 )}
               </button>
           )}
        </form>
      </div>

      {showBotPanel && <BotControl onClose={() => setShowBotPanel(false)} />}
    </div>
  );
};