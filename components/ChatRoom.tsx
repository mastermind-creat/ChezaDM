
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { BotControl } from './BotControl';
import { MessageType, Message, BotType, MessageStatus } from '../types';
import { generateBotResponse, checkModeration, polishDraft, editChatImage } from '../services/geminiService';
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
  const { currentRoom, messages, currentUser, sendMessage, addMessage, leaveRoom, isRoomAdmin, addReaction, isOnline } = useApp();
  
  // Input States
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showBotPanel, setShowBotPanel] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  
  // Image Editing State
  const [imageToEdit, setImageToEdit] = useState<{id: string, content: string} | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditingImage, setIsEditingImage] = useState(false);

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
        if (lastMsg.senderId !== currentUser?.id && lastMsg.type !== MessageType.SYSTEM) {
            const audio = new Audio(POP_SOUND);
            audio.volume = 0.5;
            audio.play().catch(() => {}); 
        }
    }
  }, [messages.length, currentUser?.id, messages]);

  // Bot Processing (Only when Online)
  useEffect(() => {
    if (!isOnline) return; // Skip bot logic if offline
    if (!currentRoom || messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.senderId === currentUser?.id && !lastMessage.isBot && lastMessage.type !== MessageType.SYSTEM) {
      processBotResponses(lastMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, currentRoom, currentUser, isOnline]);

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
          botType: BotType.MODERATOR,
          status: MessageStatus.SENT
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
          botType: botType,
          status: MessageStatus.SENT
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

  const handleMagicPolish = async () => {
    if (!inputText.trim()) return;
    setIsPolishing(true);
    const polished = await polishDraft(inputText);
    setInputText(polished);
    setIsPolishing(false);
    showToast("Draft polished! ✨");
  };

  const handleImageEditSubmit = async () => {
    if (!imageToEdit || !editPrompt.trim()) return;
    setIsEditingImage(true);
    const newImage = await editChatImage(imageToEdit.content, editPrompt);
    setIsEditingImage(false);
    
    if (newImage) {
        sendMessage(newImage, MessageType.IMAGE);
        setImageToEdit(null);
        setEditPrompt('');
        showToast("Image edited successfully! 🎨");
    } else {
        showToast("Failed to edit image.");
    }
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
            const content = JSON.stringify({ name: file.name, size: file.size, data: base64 });
            sendMessage(content, MessageType.FILE);
        } else {
            sendMessage(base64, type);
        }
        setShowAttachMenu(false);
    } catch (err) {
        console.error("File read error", err);
        showToast("Failed to attach file");
    }
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

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        showToast("ID Copied to Clipboard! 📋");
      } else {
        throw new Error("Clipboard API unavailable");
      }
    } catch (err) {
      fallbackCopyToClipboard(text);
    }
  };

  const fallbackCopyToClipboard = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) showToast("ID Copied to Clipboard! 📋");
      else showToast("Failed to copy ID");
    } catch (err) {
      showToast("Failed to copy ID manually");
    }
  };

  const handleShare = async () => {
    if (!currentRoom) return;
    const shareText = `Join my ${currentRoom.name} on ChezaDM! Code: ${currentRoom.id}`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'ChezaDM Chat',
                text: shareText,
                url: window.location.href
            });
        } catch (err) {
            copyToClipboard(currentRoom.id);
        }
    } else {
        copyToClipboard(currentRoom.id);
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
              <div className="relative group/image">
                 <img src={msg.content} alt="Attachment" className="max-w-full rounded-lg max-h-64 object-cover" loading="lazy"/>
                 <button 
                    onClick={(e) => { e.stopPropagation(); setImageToEdit({id: msg.id, content: msg.content}); }}
                    className="absolute top-2 right-2 bg-white/90 text-gray-800 p-1.5 rounded-full shadow-md opacity-0 group-hover/image:opacity-100 transition-opacity"
                    title="AI Edit"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576L8.279 5.044A.75.75 0 019 4.5zM18 15a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 15zM16.5 2.25a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0116.5 2.25z" clipRule="evenodd" /></svg>
                 </button>
              </div>
            );
        case MessageType.VIDEO:
            return (
                <video controls playsInline className="max-w-full rounded-lg max-h-64 bg-black">
                    <source src={msg.content} />
                </video>
            );
        case MessageType.AUDIO:
            return (
                <div className="flex items-center min-w-[150px] p-1">
                   <audio controls src={msg.content} className="w-full h-8" />
                </div>
            );
        case MessageType.FILE:
            try {
                const fileData = JSON.parse(msg.content);
                return (
                    <a href={fileData.data} download={fileData.name} className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                        <div className="bg-cheza-blue text-white p-2 rounded-lg">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="font-bold truncate text-sm">{fileData.name}</span>
                            <span className="text-xs text-gray-500">Tap to download</span>
                        </div>
                    </a>
                );
            } catch { return <span className="text-red-500 text-xs">Invalid File</span>; }
        case MessageType.TEXT:
        default:
            return <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>;
    }
  };

  if (!currentRoom) return null;

  return (
    <div className="flex flex-col h-full bg-[#e5ddd5] dark:bg-[#0b141a] relative">
      
      {/* OFFLINE BANNER */}
      {!isOnline && (
          <div className="bg-red-500 text-white text-xs font-bold text-center py-1 shadow-md z-20">
            You are offline. Messages will send when connected.
          </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
          <div className="absolute top-16 left-0 right-0 z-50 flex justify-center animate-slide-up pointer-events-none">
              <div className="bg-cheza-black text-white px-6 py-2 rounded-full shadow-2xl flex items-center space-x-2">
                  <span className="font-bold text-sm">{toastMessage}</span>
              </div>
          </div>
      )}

      {/* Header */}
      <header className="bg-cheza-blue text-white p-3 shadow-md flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center space-x-2">
          <button onClick={leaveRoom} className="p-1.5 hover:bg-white/10 rounded-full">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          </button>
          <div className="flex flex-col">
            <h1 className="font-bold text-base leading-tight flex items-center">
                {currentRoom.name}
            </h1>
            <div className="text-xs opacity-90 flex items-center space-x-1 font-mono bg-black/20 px-1.5 py-0.5 rounded w-fit cursor-pointer active:scale-95 transition" onClick={() => copyToClipboard(currentRoom.id)}>
              <span>{currentRoom.id}</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 opacity-70"><path fillRule="evenodd" d="M15.988 3.012A2.25 2.25 0 0118 5.25v6.5A2.25 2.25 0 0115.75 14H13.5V7A2.5 2.5 0 0011 4.5H8.128l6.25-1.25a2.25 2.25 0 011.61.238zm-5.238 1.488h-5.5a2.25 2.25 0 00-2.25 2.25v9.5a2.25 2.25 0 002.25 2.25h5.5a2.25 2.25 0 002.25-2.25v-9.5a2.25 2.25 0 00-2.25-2.25z" clipRule="evenodd" /></svg>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button onClick={handleShare} className="p-2 hover:bg-white/10 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
          </button>
          {isRoomAdmin && isOnline && (
            <button onClick={() => setShowBotPanel(true)} className="p-2 hover:bg-white/10 rounded-full">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>
            </button>
          )}
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-safe relative" onClick={() => { setActiveReactionMsgId(null); setShowAttachMenu(false); }}>
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.id;
          const isSystem = msg.type === MessageType.SYSTEM;
          const isSticker = msg.type === MessageType.STICKER;
          const isPending = msg.status === MessageStatus.PENDING;
          
          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <span className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full shadow-sm font-medium">{msg.content}</span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex w-full group ${isMe ? 'justify-end' : 'justify-start'} mb-4 ${isPending ? 'opacity-70' : ''}`}>
              <div className={`flex max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end relative`}>
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 mr-2 flex items-center justify-center overflow-hidden shrink-0 border border-white shadow-sm">
                     {msg.isBot ? <span className="text-sm">{BOTS[msg.botType || BotType.HELPER]?.icon}</span> : <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderName}`} alt="av" />}
                  </div>
                )}

                <div 
                    onClick={(e) => { e.stopPropagation(); setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id); }}
                    className={`relative shadow-sm text-sm cursor-pointer transition-all active:scale-95 ${isSticker ? 'bg-transparent shadow-none p-0' : isMe ? 'bg-cheza-blue text-white rounded-2xl rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-none'} ${!isSticker ? 'px-4 py-2' : ''}`}
                >
                  {!isMe && !isSticker && (
                    <div className="flex items-center space-x-1 mb-1">
                      <p className={`text-[10px] font-bold ${msg.isBot ? 'text-cheza-blue' : 'text-orange-600'}`}>{msg.senderName} {msg.isBot && '🤖'}</p>
                    </div>
                  )}

                  {renderMessageContent(msg)}

                  {!isSticker && (
                    <div className={`text-[9px] mt-1 text-right flex justify-end items-center space-x-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        {isMe && (
                          <span>{isPending ? '🕒' : '✓'}</span>
                        )}
                    </div>
                  )}

                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className={`absolute -bottom-3 ${isMe ? '-left-2' : '-right-2'} flex space-x-1 z-10`}>
                        {Object.entries(msg.reactions).map(([emoji, users]: [string, string[]]) => (
                          <span key={emoji} className="bg-white dark:bg-gray-700 shadow-sm text-[10px] px-1 rounded-full border border-gray-100 dark:border-gray-600 flex items-center">
                            {emoji} <span className="ml-0.5 text-gray-500 dark:text-gray-400">{users.length}</span>
                          </span>
                        ))}
                      </div>
                  )}
                </div>
              </div>
              
              {activeReactionMsgId === msg.id && (
                <div className={`absolute -top-10 ${isMe ? 'right-0' : 'left-0'} z-20 bg-white dark:bg-gray-800 rounded-full shadow-xl p-1 flex space-x-1 animate-pop-in`}>
                  {REACTIONS.map(emoji => (
                    <button key={emoji} onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, emoji); }} className="hover:scale-125 transition transform p-1.5 text-lg">{emoji}</button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {isTyping && <div className="text-xs text-gray-500 dark:text-gray-400 ml-12 animate-pulse">Typing...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-end space-x-2 relative z-20">
        <div className="relative">
            <button onClick={() => setShowAttachMenu(!showAttachMenu)} className="p-3 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
            </button>
            {showAttachMenu && (
                <div className="absolute bottom-14 left-0 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-3 flex flex-col space-y-3 animate-slide-up w-40 border border-gray-100 dark:border-gray-700">
                    <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg></div>
                        <span className="text-sm font-medium">Photo</span>
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => handleFileSelect(e, MessageType.IMAGE)} />
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition">
                        <div className="p-2 bg-pink-100 text-pink-600 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg></div>
                        <span className="text-sm font-medium">Video</span>
                        <input type="file" accept="video/*" className="hidden" ref={videoInputRef} onChange={(e) => handleFileSelect(e, MessageType.VIDEO)} />
                    </label>
                </div>
            )}
        </div>

        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center px-2 py-1">
            <button onClick={() => setShowStickers(!showStickers)} className="p-2 text-gray-400 hover:text-gray-600">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg>
            </button>
            <form onSubmit={handleSend} className="flex-1">
                <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type a message..." className="w-full bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-500 py-3 px-2" />
            </form>
            {inputText && (
              <button 
                onClick={handleMagicPolish} 
                disabled={isPolishing}
                className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition ${isPolishing ? 'text-purple-300 animate-pulse' : 'text-purple-500'}`}
                title="Magic Polish"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576-2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576L8.279 5.044A.75.75 0 019 4.5zM18 15a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 15zM16.5 2.25a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0116.5 2.25z" clipRule="evenodd" /></svg>
              </button>
            )}
        </div>

        {inputText ? (
             <button onClick={handleSend} className="p-3 bg-cheza-blue text-white rounded-full shadow-lg hover:bg-blue-600 transition transform active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 pl-0.5"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
            </button>
        ) : (
            <button onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording} className={`p-3 rounded-full shadow-lg transition transform active:scale-90 ${isRecording ? 'bg-red-500 animate-pulse text-white' : 'bg-cheza-green text-white'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
            </button>
        )}
      </div>

      {showStickers && (
          <div className="bg-white dark:bg-gray-900 p-4 grid grid-cols-5 gap-4 overflow-y-auto max-h-60 border-t border-gray-100 dark:border-gray-800 absolute bottom-16 w-full z-10 animate-slide-up">
              {STICKERS.map((sticker, idx) => (
                  <button key={idx} onClick={() => handleStickerClick(sticker)} className="text-2xl hover:scale-110 transition">{sticker}</button>
              ))}
          </div>
      )}

      {showBotPanel && <BotControl onClose={() => setShowBotPanel(false)} />}

      {/* Image Edit Modal */}
      {imageToEdit && (
         <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center px-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 w-full max-w-sm shadow-2xl space-y-4">
               <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Image Edit</h3>
               <img src={imageToEdit.content} alt="To edit" className="w-full h-48 object-cover rounded-lg opacity-80" />
               <input 
                  type="text" 
                  value={editPrompt} 
                  onChange={(e) => setEditPrompt(e.target.value)} 
                  placeholder="e.g. Add a retro filter..." 
                  className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-700 border-none"
               />
               <div className="flex space-x-3">
                  <button onClick={() => setImageToEdit(null)} className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 rounded-xl font-bold">Cancel</button>
                  <button 
                    onClick={handleImageEditSubmit} 
                    disabled={isEditingImage || !editPrompt}
                    className="flex-1 py-3 bg-cheza-blue text-white rounded-xl font-bold flex justify-center items-center"
                  >
                     {isEditingImage ? <span className="animate-spin mr-2">⏳</span> : '✨ Generate'}
                  </button>
               </div>
            </div>
         </div>
      )}

      {showCreatedModal && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center px-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl transform scale-100">
            <div className="w-16 h-16 bg-green-100 text-cheza-green rounded-full flex items-center justify-center mx-auto mb-4">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Session Ready!</h2>
            <p className="text-gray-500 mb-6">Share this ID or Link with friends to start chatting instantly. ID expires in 20 minutes.</p>
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl mb-6 border-2 border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-3xl font-mono font-bold tracking-wider text-cheza-blue">{currentRoom.id}</p>
            </div>
            <div className="flex flex-col space-y-3">
                <button onClick={() => copyToClipboard(currentRoom.id)} className="w-full py-3 bg-cheza-blue text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition">Copy Session ID</button>
                <button onClick={handleShare} className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition">Share Invite Link</button>
            </div>
            <button onClick={() => setShowCreatedModal(false)} className="mt-6 text-sm text-gray-400 underline">Close & Start Chatting</button>
          </div>
        </div>
      )}
    </div>
  );
};
