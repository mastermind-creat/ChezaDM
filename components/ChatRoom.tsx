
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MessageType, Message } from '../types';
import { editChatImage } from '../services/geminiService';
import { THEMES } from '../constants';
import { MatrixBackground } from './MatrixBackground';
import { StarfieldBackground } from './StarfieldBackground';

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
    currentRoom, messages, currentUser, sendMessage, editMessage, deleteMessage,
    leaveRoom, addReaction, peers, sendTypingSignal, typingUsers, theme, chatBg 
  } = useApp();
  
  const [inputText, setInputText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, msg: Message } | null>(null);
  const [imageToEdit, setImageToEdit] = useState<{id: string, content: string} | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditingImage, setIsEditingImage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = THEMES[theme];
  const isConnected = peers.length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers, replyTo]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !isConnected) return;
    
    if (editingId) {
      editMessage(editingId, inputText);
      setEditingId(null);
    } else {
      sendMessage(inputText, MessageType.TEXT, replyTo?.id);
    }
    setInputText('');
    setReplyTo(null);
    sendTypingSignal(false);
  };

  const handleReply = (msg: Message) => {
    if (msg.isDeleted) return;
    setReplyTo(msg);
    setEditingId(null);
    setContextMenu(null);
  };

  const handleEdit = (msg: Message) => {
    if (msg.senderId !== currentUser?.id || msg.isDeleted) return;
    setEditingId(msg.id);
    setInputText(msg.content);
    setReplyTo(null);
    setContextMenu(null);
  };

  const handleDelete = (msg: Message) => {
    if (msg.senderId !== currentUser?.id) return;
    deleteMessage(msg.id);
    setContextMenu(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: MessageType) => {
    const file = e.target.files?.[0];
    if (!file || !isConnected) return;
    try {
        const base64 = await fileToBase64(file);
        sendMessage(type === MessageType.FILE ? JSON.stringify({ name: file.name, size: file.size, data: base64 }) : base64, type);
        setShowAttachMenu(false);
    } catch (err) { console.error("File error", err); }
  };

  const renderMessageContent = (msg: Message) => {
    if (msg.isDeleted) return <p className="italic opacity-50 text-xs">This message was deleted</p>;
    switch (msg.type) {
        case MessageType.IMAGE:
            return (
                <div className="relative group/image">
                    <img src={msg.content} className="max-w-full max-h-80 object-cover rounded-xl shadow-md" loading="lazy" />
                    <button onClick={() => setImageToEdit({id: msg.id, content: msg.content})} className="absolute top-2 right-2 bg-white/90 backdrop-blur-md p-2 rounded-full text-[10px] font-black opacity-0 group-hover/image:opacity-100 transition-all transform hover:scale-110 shadow-lg text-cheza-blue">✨ MAGIC EDIT</button>
                </div>
            );
        case MessageType.FILE:
            try {
                const f = JSON.parse(msg.content);
                return <div className="flex items-center space-x-3 p-3 rounded-xl bg-black/5 border border-black/5">
                  <div className="text-2xl">📄</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black truncate">{f.name}</p>
                    <p className="text-[9px] opacity-40 uppercase">{(f.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <a href={f.data} download={f.name} className="p-2 hover:bg-black/10 rounded-full transition">⬇️</a>
                </div>;
            } catch { return <span>File error</span>; }
        default:
            return <p className="whitespace-pre-wrap leading-relaxed text-sm font-bold tracking-tight">{msg.content}{msg.isEdited && <span className="ml-1 text-[8px] opacity-40 uppercase tracking-tighter">(edited)</span>}</p>;
    }
  };

  return (
    <div className={`flex flex-col h-full ${t.bg} transition-all duration-300 relative overflow-hidden`}>
      {/* Advanced Background Layering */}
      {theme === 'matrix' && <MatrixBackground />}
      {theme === 'midnight' && !chatBg && <StarfieldBackground />}
      
      {chatBg && (
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-1000 z-0 scale-105 animate-pulse" 
          style={{ backgroundImage: `url(${chatBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        ></div>
      )}
      
      <header className={`${t.card} p-4 border-b ${t.border} flex items-center justify-between z-20 shadow-md backdrop-blur-xl bg-opacity-80`}>
        <div className="flex items-center space-x-4">
          <button onClick={leaveRoom} className={`p-2.5 ${t.text} rounded-2xl transition hover:bg-black/5 active:scale-90`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          </button>
          <div className="flex flex-col">
            <h1 className={`font-black text-lg ${t.text} leading-none mb-1 truncate max-w-[150px]`}>{currentRoom?.name}</h1>
            <div className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'} animate-pulse`}></span>
                <span className={`text-[9px] font-black uppercase tracking-widest opacity-60 ${t.text}`}>
                  {isConnected ? `${peers.length + 1} ACTIVE` : 'DISCONNECTED'}
                </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 bg-black/5 rounded-lg text-[9px] font-black ${t.text} opacity-30 select-none border ${t.border}`}>ID: {currentRoom?.id.slice(0, 4)}..</div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6 z-10" onClick={() => { setContextMenu(null); setShowAttachMenu(false); }}>
        {!isConnected && (
          <div className="flex flex-col items-center justify-center h-full space-y-4 animate-pop-in">
            <div className="w-20 h-20 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center text-4xl animate-pulse">📡</div>
            <div className="text-center space-y-1">
              <p className={`font-black uppercase tracking-[0.3em] text-[10px] ${t.text}`}>Handshake Required</p>
              <p className={`text-xs opacity-40 font-bold max-w-[180px] leading-tight ${t.text}`}>Share your Session ID to allow peers to join the secure tunnel.</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.senderId === currentUser?.id;
          const repliedMsg = msg.replyTo ? messages.find(m => m.id === msg.replyTo) : null;
          return (
            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group/msg transition-all duration-300`}>
              <div 
                className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, msg }); }}
              >
                {repliedMsg && (
                    <div className={`mb-1 px-3 py-2 rounded-t-2xl text-[10px] bg-black/5 border-l-4 border-cheza-blue opacity-80 max-w-full truncate ${t.text} backdrop-blur-sm`}>
                        <span className="font-black text-cheza-blue mr-1">{repliedMsg.senderName}:</span>{repliedMsg.content}
                    </div>
                )}
                <div className={`relative px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 transform hover:scale-[1.02] ${isMe ? t.bubbleMe + ' rounded-tr-none' : t.bubbleThem + ' rounded-tl-none'} backdrop-blur-md bg-opacity-95`}>
                  {!isMe && <p className={`text-[10px] font-black mb-1.5 uppercase tracking-tighter ${theme === 'matrix' ? 'text-green-300' : 'text-cheza-blue'}`}>{msg.senderName}</p>}
                  {renderMessageContent(msg)}
                  <div className={`text-[8px] mt-2 flex justify-end opacity-30 font-black uppercase tracking-widest`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {Object.values(typingUsers).length > 0 && (
            <div className={`flex items-center space-x-2 px-2 animate-pulse`}>
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-cheza-blue rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-cheza-blue rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-cheza-blue rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest opacity-40 ${t.text}`}>Typing...</span>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {contextMenu && (
          <div className={`fixed z-[100] ${t.card} shadow-2xl rounded-2xl p-1.5 border ${t.border} backdrop-blur-2xl bg-opacity-90 animate-pop-in`} style={{ left: Math.min(contextMenu.x, window.innerWidth - 180), top: Math.min(contextMenu.y, window.innerHeight - 150) }}>
              <button onClick={() => handleReply(contextMenu.msg)} className={`w-full text-left px-5 py-3 text-xs font-black uppercase tracking-widest ${t.text} hover:bg-black/5 rounded-xl transition`}>Reply</button>
              {contextMenu.msg.senderId === currentUser?.id && !contextMenu.msg.isDeleted && (
                  <>
                      <button onClick={() => handleEdit(contextMenu.msg)} className={`w-full text-left px-5 py-3 text-xs font-black uppercase tracking-widest ${t.text} hover:bg-black/5 rounded-xl transition`}>Edit</button>
                      <button onClick={() => handleDelete(contextMenu.msg)} className="w-full text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl transition">Delete</button>
                  </>
              )}
          </div>
      )}

      <div className={`p-4 ${t.card} border-t ${t.border} z-20 backdrop-blur-xl bg-opacity-90 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]`}>
        {replyTo && (
            <div className="mb-3 p-3 bg-black/5 rounded-2xl flex items-center justify-between border-l-4 border-cheza-blue animate-slide-up backdrop-blur-md">
                <div className="truncate flex-1">
                    <p className="text-[9px] font-black text-cheza-blue uppercase tracking-widest mb-0.5">Replying to {replyTo.senderName}</p>
                    <p className={`text-xs truncate opacity-70 font-bold ${t.text}`}>{replyTo.content}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className={`ml-3 p-1.5 rounded-full hover:bg-black/5 ${t.text}`}>✕</button>
            </div>
        )}
        {editingId && (
            <div className="mb-3 p-3 bg-black/5 rounded-2xl flex items-center justify-between border-l-4 border-yellow-500 animate-slide-up">
                <div className="truncate flex-1">
                    <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">Editing Draft</p>
                </div>
                <button onClick={() => { setEditingId(null); setInputText(''); }} className={`ml-3 p-1.5 rounded-full hover:bg-black/5 ${t.text}`}>✕</button>
            </div>
        )}
        
        <div className={`flex items-end space-x-3 transition-all duration-500 ${isConnected ? 'opacity-100' : 'opacity-20 grayscale cursor-not-allowed'}`}>
          <div className="relative">
            <button 
              onClick={() => isConnected && setShowAttachMenu(!showAttachMenu)} 
              className={`p-3.5 rounded-2xl hover:bg-black/5 transition-all text-2xl active:scale-75 ${t.text}`}
              disabled={!isConnected}
            >
              📎
            </button>
            {showAttachMenu && (
                <div className={`absolute bottom-20 left-0 ${t.card} shadow-3xl rounded-[2rem] p-3 w-56 border ${t.border} animate-slide-up flex flex-col z-50 backdrop-blur-2xl`}>
                    {[
                      { icon: '🖼️', label: 'Photo', id: 'f-img', accept: 'image/*', type: MessageType.IMAGE },
                      { icon: '🎥', label: 'Video', id: 'f-vid', accept: 'video/*', type: MessageType.VIDEO },
                      { icon: '📄', label: 'File', id: 'f-doc', accept: '*', type: MessageType.FILE }
                    ].map(btn => (
                      <button key={btn.id} onClick={() => document.getElementById(btn.id)?.click()} className={`flex items-center p-4 space-x-4 hover:bg-black/5 rounded-2xl transition group active:scale-95`}>
                          <span className="text-2xl transition-transform group-hover:scale-125">{btn.icon}</span> 
                          <span className={`text-xs font-black uppercase tracking-widest ${t.text}`}>{btn.label}</span>
                          <input id={btn.id} type="file" accept={btn.accept} className="hidden" onChange={(e) => handleFileSelect(e, btn.type)} />
                      </button>
                    ))}
                </div>
            )}
          </div>
          <div className={`${t.input} rounded-[1.5rem] flex-1 flex items-center px-5 py-1.5 border ${t.border} shadow-inner transition-all focus-within:ring-4 focus-within:ring-cheza-blue focus-within:ring-opacity-10`}>
            <textarea 
              rows={1}
              value={inputText} 
              onChange={(e) => { 
                setInputText(e.target.value); 
                if (isConnected) sendTypingSignal(true); 
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isConnected ? "Compose message..." : "Waiting for peer..."} 
              className={`flex-1 bg-transparent py-3 outline-none text-sm font-bold placeholder:opacity-30 resize-none max-h-32 ${t.text}`}
              disabled={!isConnected}
            />
          </div>
          <button 
            onClick={handleSend} 
            disabled={!inputText.trim() || !isConnected} 
            className={`p-4 rounded-2xl shadow-xl transition-all transform active:scale-90 ${inputText.trim() && isConnected ? t.accent + ' text-white hover:brightness-110 shadow-blue-500/20' : 'bg-gray-200 text-gray-400 grayscale'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
          </button>
        </div>
      </div>

      {imageToEdit && (
         <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
            <div className={`${t.card} rounded-[3rem] p-8 w-full max-w-sm shadow-3xl border ${t.border}`}>
                <div className="relative group rounded-3xl overflow-hidden mb-8 shadow-2xl">
                    <img src={imageToEdit.content} className="w-full h-56 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                        <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Original Asset</span>
                    </div>
                </div>
                <input 
                    type="text" value={editPrompt} onChange={e => setEditPrompt(e.target.value)} 
                    placeholder="E.g. Add a sunset or make it futuristic..." 
                    className={`w-full p-5 bg-black/5 rounded-2xl mb-6 font-bold outline-none border-2 border-transparent focus:border-cheza-blue transition-all text-sm ${t.text}`} 
                />
                <div className="flex space-x-4">
                    <button onClick={() => setImageToEdit(null)} className={`flex-1 py-4 font-black text-xs uppercase tracking-widest ${t.text} opacity-50 active:scale-95`}>Cancel</button>
                    <button 
                      onClick={async () => {
                          setIsEditingImage(true);
                          const res = await editChatImage(imageToEdit.content, editPrompt);
                          if (res) sendMessage(res, MessageType.IMAGE);
                          setIsEditingImage(false); setImageToEdit(null);
                      }} 
                      disabled={isEditingImage || !editPrompt.trim()}
                      className={`flex-1 py-4 bg-cheza-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-20 transition-all`}
                    >
                      {isEditingImage ? 'Handshaking...' : 'Re-Imagine'}
                    </button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};
