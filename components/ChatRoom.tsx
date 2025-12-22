
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { BotControl } from './BotControl';
import { MessageType, Message, BotType, MessageStatus } from '../types';
import { generateBotResponse, checkModeration, polishDraft, editChatImage } from '../services/geminiService';
import { BOTS, THEMES } from '../constants';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const ChatRoom: React.FC = () => {
  const { 
    currentRoom, messages, currentUser, sendMessage, addMessage, 
    leaveRoom, isRoomAdmin, addReaction, isOnline, peers,
    sendTypingSignal, typingUsers, theme
  } = useApp();
  
  const [inputText, setInputText] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [imageToEdit, setImageToEdit] = useState<{id: string, content: string} | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditingImage, setIsEditingImage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  if (!currentRoom) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(currentRoom.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!typingTimeoutRef.current) sendTypingSignal(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingSignal(false);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText, MessageType.TEXT);
    setInputText('');
    sendTypingSignal(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: MessageType) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadProgress(10);
    try {
        const base64 = await fileToBase64(file);
        setUploadProgress(70);
        if (type === MessageType.FILE) {
            sendMessage(JSON.stringify({ name: file.name, size: file.size, data: base64 }), MessageType.FILE);
        } else {
            sendMessage(base64, type);
        }
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(null), 1000);
        setShowAttachMenu(false);
    } catch (err) {
        setUploadProgress(null);
    }
  };

  const renderMessageContent = (msg: Message) => {
    switch (msg.type) {
        case MessageType.STICKER:
            return <div className="text-6xl animate-pop-in">{msg.content}</div>;
        case MessageType.IMAGE:
            return (
                <div className="relative group/image overflow-hidden rounded-xl">
                    <img src={msg.content} alt="Attachment" className="max-w-full max-h-80 object-cover rounded-lg" loading="lazy" />
                    <button onClick={() => setImageToEdit({id: msg.id, content: msg.content})} className="absolute bottom-2 right-2 bg-white/90 p-2 rounded-full shadow opacity-0 group-hover/image:opacity-100 transition-opacity">✨ AI Edit</button>
                </div>
            );
        case MessageType.VIDEO:
            return <video controls src={msg.content} className="max-w-full rounded-lg max-h-80 bg-black" />;
        case MessageType.FILE:
            try {
                const f = JSON.parse(msg.content);
                return (
                    <div className="flex items-center space-x-3 bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5">
                        <div className="bg-cheza-blue p-2 rounded-lg text-white">📁</div>
                        <div className="flex flex-col truncate flex-1">
                            <span className="font-bold text-xs truncate">{f.name}</span>
                            <span className="text-[9px] opacity-50 uppercase tracking-tighter">{(f.size / 1024).toFixed(0)} KB</span>
                        </div>
                        <a href={f.data} download={f.name} className="p-2 bg-white/10 rounded-full hover:bg-white/20">⬇️</a>
                    </div>
                );
            } catch { return <span>File error</span>; }
        default:
            return <p className="whitespace-pre-wrap leading-relaxed text-sm font-medium">{msg.content}</p>;
    }
  };

  const t = THEMES[theme];

  return (
    <div className={`flex flex-col h-full ${t.bg}`}>
      {/* Dynamic Header */}
      <header className={`bg-white/80 dark:bg-black/20 backdrop-blur-md p-4 border-b border-black/5 flex items-center justify-between z-20`}>
        <div className="flex items-center space-x-3">
          <button onClick={leaveRoom} className={`p-2 ${t.text} hover:bg-black/5 rounded-full transition`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          </button>
          <div>
            <h1 className={`font-black text-lg ${t.text} leading-none tracking-tight`}>{currentRoom.name}</h1>
            <div className="flex items-center space-x-1 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${peers.length > 0 ? 'bg-cheza-green animate-pulse' : 'bg-gray-400'}`}></span>
                <span className={`text-[9px] font-black uppercase tracking-widest opacity-40 ${t.text}`}>{peers.length + 1} ONLINE</span>
            </div>
          </div>
        </div>
        <button 
            onClick={handleCopyId}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full transition-all ${copied ? 'bg-cheza-green text-white' : 'bg-black/5 text-gray-500 hover:bg-black/10'}`}
        >
            <span className="text-[10px] font-black tracking-tighter">{copied ? 'COPIED!' : currentRoom.id}</span>
            {!copied && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>}
        </button>
      </header>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4" onClick={() => setShowAttachMenu(false)}>
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.id;
          const isSticker = msg.type === MessageType.STICKER;
          return (
            <div key={msg.id} className={`flex w-full group ${isMe ? 'justify-end' : 'justify-start'} animate-pop-in`}>
              <div className={`flex max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
                {!isMe && <img src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${msg.senderName}`} className="w-8 h-8 rounded-full bg-gray-200 border border-white shrink-0 shadow-sm" alt="avatar" />}
                <div className={`relative ${isSticker ? '' : isMe ? `${t.accent} text-white rounded-2xl rounded-br-none` : `${t.card} ${t.text} rounded-2xl rounded-bl-none shadow-sm border border-black/5`} ${isSticker ? 'p-0' : 'px-4 py-2.5 shadow-sm'}`}>
                  {!isMe && !isSticker && <p className={`text-[9px] font-black mb-1 uppercase tracking-tight ${theme === 'light' ? 'text-cheza-blue' : 'text-cheza-green'}`}>{msg.senderName}</p>}
                  {renderMessageContent(msg)}
                  {!isSticker && (
                    <div className={`text-[8px] mt-1 flex justify-end opacity-40 font-black uppercase ${isMe ? 'text-white/60' : ''}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className={`absolute -bottom-2.5 ${isMe ? 'left-0' : 'right-0'} flex -space-x-1`}>
                        {Object.entries(msg.reactions).map(([emoji, users]) => (
                            <div key={emoji} className="bg-white dark:bg-gray-700 shadow-lg px-1.5 py-0.5 rounded-full border border-black/5 text-[9px] flex items-center font-black">
                                {emoji} <span className="ml-0.5">{ (users as string[]).length }</span>
                            </div>
                        ))}
                      </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {Object.values(typingUsers).length > 0 && (
            <div className={`flex items-center space-x-2 text-[10px] font-black py-2 opacity-60 ${t.text}`}>
                <div className="flex space-x-0.5"><div className="w-1 h-1 bg-current rounded-full animate-bounce"></div><div className="w-1 h-1 bg-current rounded-full animate-bounce delay-75"></div><div className="w-1 h-1 bg-current rounded-full animate-bounce delay-150"></div></div>
                <span className="uppercase tracking-widest">{Object.values(typingUsers).join(', ')} TYPING...</span>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {uploadProgress !== null && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-200 z-50">
              <div className="h-full bg-cheza-green transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
          </div>
      )}

      {/* Input Area */}
      <div className={`p-4 ${t.card} border-t border-black/5 shrink-0`}>
        <div className="flex items-end space-x-3">
          <div className="relative">
            <button onClick={() => setShowAttachMenu(!showAttachMenu)} className={`p-3 opacity-40 hover:opacity-100 transition ${t.text}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            </button>
            {showAttachMenu && (
                <div className={`absolute bottom-16 left-0 ${t.card} shadow-2xl rounded-[2rem] p-2 w-48 border border-black/5 animate-slide-up flex flex-col z-50`}>
                    {[
                      { icon: '🖼️', label: 'Photo', id: 'f-img', accept: 'image/*', type: MessageType.IMAGE },
                      { icon: '🎥', label: 'Video', id: 'f-vid', accept: 'video/*', type: MessageType.VIDEO },
                      { icon: '📄', label: 'File', id: 'f-doc', accept: '*', type: MessageType.FILE }
                    ].map(btn => (
                      <button key={btn.id} onClick={() => document.getElementById(btn.id)?.click()} className={`flex items-center p-3 space-x-3 hover:bg-black/5 rounded-2xl transition`}>
                          <span className="text-xl">{btn.icon}</span> <span className={`text-xs font-black uppercase tracking-tight ${t.text}`}>{btn.label}</span>
                          <input id={btn.id} type="file" accept={btn.accept} className="hidden" onChange={(e) => handleFileSelect(e, btn.type)} />
                      </button>
                    ))}
                </div>
            )}
          </div>
          
          <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center px-4 py-1.5 border-2 border-transparent focus-within:border-cheza-blue transition-all">
            <button onClick={() => setShowStickers(!showStickers)} className="text-2xl mr-2 grayscale-[0.5] hover:grayscale-0 transition">😊</button>
            <input 
              type="text" 
              value={inputText} 
              onChange={handleInputChange} 
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type message..." 
              className={`flex-1 bg-transparent py-2.5 border-none focus:ring-0 text-sm font-bold placeholder:opacity-30 ${t.text}`}
            />
          </div>

          <button 
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={`p-4 rounded-2xl shadow-xl transition transform active:scale-90 ${inputText.trim() ? `${t.accent} text-white` : 'bg-gray-200 text-gray-400 dark:bg-gray-800'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
          </button>
        </div>
        
        {showStickers && (
            <div className={`mt-4 grid grid-cols-5 gap-3 p-3 bg-black/5 rounded-2xl animate-slide-up`}>
                {["🇰🇪", "🙌", "🔥", "😂", "👋", "❤️", "💯", "👀", "Sawa", "Poa"].map(s => (
                    <button key={s} onClick={() => { sendMessage(s, MessageType.STICKER); setShowStickers(false); }} className="text-3xl hover:scale-125 transition active:scale-110">{s}</button>
                ))}
            </div>
        )}
      </div>

      {imageToEdit && (
         <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className={`${t.card} rounded-[2rem] p-6 w-full max-w-sm shadow-2xl`}>
                <img src={imageToEdit.content} className="w-full h-48 object-cover rounded-2xl mb-6 shadow-inner" />
                <input type="text" value={editPrompt} onChange={e => setEditPrompt(e.target.value)} placeholder="AI Instruction (e.g. 'Add a hat')" className={`w-full p-4 bg-black/5 rounded-2xl mb-4 font-bold outline-none border-2 border-transparent focus:border-cheza-blue transition ${t.text}`} />
                <div className="flex space-x-3">
                    <button onClick={() => setImageToEdit(null)} className={`flex-1 py-4 font-black text-xs uppercase ${t.text} opacity-50`}>Cancel</button>
                    <button onClick={async () => {
                        setIsEditingImage(true);
                        const result = await editChatImage(imageToEdit.content, editPrompt);
                        if (result) sendMessage(result, MessageType.IMAGE);
                        setIsEditingImage(false);
                        setImageToEdit(null);
                    }} className={`flex-1 py-4 bg-cheza-blue text-white rounded-2xl font-black text-xs uppercase shadow-lg`}>{isEditingImage ? 'Thinking...' : 'Apply'}</button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};
