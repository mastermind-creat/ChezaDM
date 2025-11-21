
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { BotControl } from './BotControl';
import { MessageType, Message, BotType } from '../types';
import { generateBotResponse, checkModeration } from '../services/geminiService';
import { BOTS } from '../constants';

// Base64 for a simple "pop" sound (shortened for brevity, but functional)
const POP_SOUND = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; 
// Note: A real full base64 string would be longer. For simulation we use a placeholder logic or assume it works.
// Let's use a dummy empty one to prevent crash, but in real app use a real file.
// Since I cannot upload files, I will rely on UI visual feedback if sound fails, but provide logic.

const STICKERS = [
  "🇰🇪", "🙌", "🔥", "😂", "👋", "❤️", "💯", "👀", 
  "Mazuri", "Ndio Hiyo!", "Eish!", "Sawa", "Aje?", "Poa", "Tucheze!"
];

const REACTIONS = ["❤️", "😂", "👍", "😮", "😭"];

export const ChatRoom: React.FC = () => {
  const { currentRoom, messages, currentUser, sendMessage, addMessage, leaveRoom, isRoomAdmin, addReaction } = useApp();
  const [inputText, setInputText] = useState('');
  const [showBotPanel, setShowBotPanel] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCreatedModal, setShowCreatedModal] = useState(false);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(new Audio(POP_SOUND));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial "Created" Modal
  useEffect(() => {
    if (isRoomAdmin && messages.length <= 1 && currentRoom?.createdBy === currentUser?.id) {
      // Check if we haven't shown it yet (simple logic: if msg count is low)
      setShowCreatedModal(true);
    }
  }, [currentRoom, isRoomAdmin]); // eslint-disable-line

  // Audio Effect
  useEffect(() => {
    if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.senderId !== currentUser?.id) {
            // Play sound
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3"); // Public domain short pop
            audio.volume = 0.5;
            audio.play().catch(() => {}); // Catch autoplay errors
        }
    }
  }, [messages.length, currentUser?.id, messages]);


  // Bot Logic Trigger
  useEffect(() => {
    if (!currentRoom || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    
    // Avoid loops: don't reply to self or other bots or system messages
    if (lastMessage.senderId === currentUser?.id && !lastMessage.isBot && lastMessage.type !== MessageType.SYSTEM) {
      processBotResponses(lastMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, currentRoom, currentUser]);

  const processBotResponses = async (msg: Message) => {
    if (!currentRoom) return;

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

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText, MessageType.TEXT);
    setInputText('');
    setShowStickers(false);
  };

  const handleStickerClick = (sticker: string) => {
    sendMessage(sticker, MessageType.STICKER);
    setShowStickers(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, upload to storage and get URL.
      // Here we fake it.
      sendMessage(`[Image] ${file.name}`, MessageType.IMAGE);
    }
  };

  const handleShare = async () => {
    if (!currentRoom) return;
    const shareData = {
      title: 'Join my ChezaDM Chat',
      text: `Join my ${currentRoom.name} on ChezaDM! Use code: ${currentRoom.id}`,
      url: window.location.href 
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(currentRoom.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.log('Share failed:', err);
    }
  };

  const toggleReaction = (msgId: string, emoji: string) => {
    addReaction(msgId, emoji);
    setActiveReactionMsgId(null);
  };

  if (!currentRoom) return null;

  return (
    <div className="flex flex-col h-full bg-[#e5ddd5] dark:bg-[#0b141a]">
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
            <div className="text-xs opacity-90 flex items-center space-x-1 font-mono bg-black/20 px-1.5 py-0.5 rounded w-fit">
              <span>{currentRoom.id}</span>
              <button onClick={handleShare} className="opacity-70 hover:opacity-100 ml-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path fillRule="evenodd" d="M15.988 3.012A2.25 2.25 0 0118 5.25v6.5A2.25 2.25 0 0115.75 14H13.5V7A2.5 2.5 0 0011 4.5H8.128l6.25-1.25a2.25 2.25 0 011.61.238zm-5.238 1.488h-5.5a2.25 2.25 0 00-2.25 2.25v9.5a2.25 2.25 0 002.25 2.25h5.5a2.25 2.25 0 002.25-2.25v-9.5a2.25 2.25 0 00-2.25-2.25z" clipRule="evenodd" />
                    </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {/* Share Button */}
          <button onClick={handleShare} className="p-2 hover:bg-white/10 rounded-full relative">
            {copied ? (
              <span className="text-xs font-bold bg-cheza-green text-black px-2 py-1 rounded absolute -bottom-8 -left-4 shadow animate-bounce-short">Copied!</span>
            ) : null}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
          </button>
          
          {/* Bot Control (Admin Only) */}
          {isRoomAdmin && (
            <button onClick={() => setShowBotPanel(true)} className="p-2 hover:bg-white/10 rounded-full">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </button>
          )}
        </div>
      </header>

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
                  <p className="text-sm text-gray-500 mb-4">Share this code with friends to start chatting.</p>
                  
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-xl font-mono text-xl font-bold tracking-widest mb-4 border border-gray-200 dark:border-gray-600">
                      {currentRoom.id}
                  </div>

                  <button 
                    onClick={() => {
                        handleShare();
                        setShowCreatedModal(false);
                    }}
                    className="w-full py-3 bg-cheza-blue text-white rounded-xl font-bold shadow-lg mb-2"
                  >
                      Copy & Close
                  </button>
              </div>
          </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-safe relative" onClick={() => setActiveReactionMsgId(null)}>
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.id;
          const isSystem = msg.type === MessageType.SYSTEM;
          const isAdminMsg = currentRoom.adminIds.includes(msg.senderId);
          const isSticker = msg.type === MessageType.STICKER;
          
          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <span className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full shadow-sm">
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
                    relative px-4 py-2 shadow-sm text-sm cursor-pointer transition-all active:scale-95
                    ${isSticker 
                        ? 'bg-transparent shadow-none p-0' 
                        : isMe 
                            ? 'bg-cheza-blue text-white rounded-2xl rounded-br-none' 
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-none'
                    }
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
                  {isSticker ? (
                      <div className="text-6xl drop-shadow-lg animate-pop-in">{msg.content}</div>
                  ) : msg.type === MessageType.IMAGE ? (
                    <div className="flex flex-col">
                       <div className="w-48 h-32 bg-gray-200 animate-pulse rounded mb-1 flex items-center justify-center text-gray-500">Image Placeholder</div>
                       <span>{msg.content}</span>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}

                  {/* Timestamp */}
                  {!isSticker && (
                    <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  )}

                  {/* Reactions Display */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className={`absolute -bottom-3 ${isMe ? '-left-2' : '-right-2'} flex space-x-1`}>
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

      {/* Input Area */}
      <div className="p-3 bg-gray-100 dark:bg-gray-900 pb-safe-offset-2 shrink-0">
        {showStickers && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-lg mb-3 animate-slide-up overflow-x-auto">
                <div className="flex space-x-2 pb-2">
                    {STICKERS.map((sticker, i) => (
                        <button 
                            key={i} 
                            onClick={() => handleStickerClick(sticker)}
                            className="text-3xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition transform hover:scale-110"
                        >
                            {sticker}
                        </button>
                    ))}
                </div>
            </div>
        )}

        <form onSubmit={handleSend} className="flex items-center space-x-2">
           <button 
            type="button" 
            onClick={() => setShowStickers(!showStickers)}
            className={`p-3 rounded-full shadow-sm transition ${showStickers ? 'bg-cheza-yellow text-black' : 'bg-white dark:bg-gray-800 text-gray-500'}`}
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
            </svg>
           </button>

           <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-500 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:text-cheza-blue transition"
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
           </button>
           <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             onChange={handleFileUpload} 
             accept="image/*"
           />
           
           <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            onFocus={() => setShowStickers(false)}
            className="flex-1 p-3 rounded-full border-none focus:ring-2 focus:ring-cheza-blue bg-white dark:bg-gray-800 dark:text-white shadow-inner text-base"
           />

           <button 
            type="submit" 
            disabled={!inputText.trim()}
            className="p-3 bg-cheza-blue text-white rounded-full shadow-lg disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95 transition-all"
           >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
           </button>
        </form>
      </div>

      {showBotPanel && <BotControl onClose={() => setShowBotPanel(false)} />}
    </div>
  );
};