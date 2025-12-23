
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
    leaveRoom, addReaction, peers, sendTypingSignal, typingUsers, theme, chatBg, isRoomAdmin
  } = useApp();
  
  const [inputText, setInputText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, msg: Message } | null>(null);
  const [imageToEdit, setImageToEdit] = useState<{id: string, content: string} | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCopyCode = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      {/* Background Layers */}
      {theme === 'matrix' && <MatrixBackground />}
      {theme === 'midnight' && !chatBg && <StarfieldBackground />}
      
      {chatBg && (
        <div 
          className="absolute inset-0 opacity-25 pointer-events-none transition-all duration-1000 z-0 bg-center bg-cover" 
          style={{ backgroundImage: `url(${chatBg})` }}
        ></div>
      )}
      
      <header className={`${t.card} p-4 border-b ${t.border} flex items-center justify-between z-20 shadow-lg backdrop-blur-xl bg-opacity-90`}>
        <div className="flex items-center space-x-3">
          <button onClick={leaveRoom} className={`p-2 ${t.text} rounded-xl transition hover:bg-black/5 active:scale-90`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          </button>
          <div className="flex flex-col">
            <h1 className={`font-black text-base ${t.text} leading-none mb-1 truncate max-w-[120px]`}>{currentRoom?.name}</h1>
            <div className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-orange-500 animate-pulse shadow-[0_0_8px_#f97316]'}`}></span>
                <span className={`text-[8px] font-black uppercase tracking-widest opacity-60 ${t.text}`}>
                  {isConnected ? `${peers.length + 1} ONLINE` : 'WAITING FOR PEER'}
                </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
            <button 
              onClick={handleCopyCode}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border ${t.border} ${copied ? 'bg-green-500 text-white' : 'bg-black/5 ' + t.text} transition-all active:scale-95`}
            >
              <span className="text-[10px] font-black tracking-tighter">{copied ? 'COPIED!' : currentRoom?.id}</span>
              {!copied && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>}
            </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6 z-10 scroll-smooth" onClick={() => { setContextMenu(null); setShowAttachMenu(false); }}>
        {!isConnected && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-6 animate-pop-in">
            <div className={`p-8 rounded-[2.5rem] ${t.card} border-2 border-dashed ${t.border} text-center shadow-2xl backdrop-blur-md bg-opacity-80 max-w-xs mx-auto`}>
               <div className="w-16 h-16 bg-cheza-blue/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 animate-bounce-short">📡</div>
               <h3 className={`text-xl font-black mb-2 ${t.text}`}>Invite Your Friend</h3>
               <p className={`text-xs opacity-50 font-bold mb-6 leading-relaxed ${t.text}`}>Share this 6-character short code to start a secure P2P handshake.</p>
               
               <div className="relative group mb-6" onClick={handleCopyCode}>
                  <div className={`p-5 rounded-2xl bg-black/5 font-black text-3xl tracking-[0.2em] border-2 border-transparent group-hover:border-cheza-blue transition-all cursor-pointer ${t.text}`}>
                    {currentRoom?.id}
                  </div>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cheza-blue text-white text-[8px] px-2 py-1 rounded-full font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Copy Code</div>
               </div>

               <button 
                onClick={handleCopyCode}
                className="w-full py-3 bg-cheza-blue text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
               >
                 {copied ? 'Copied Successfully!' : 'Copy Invite Code'}
               </button>
            </div>
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] opacity-30 ${t.text}`}>Searching for signal...</p>
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
                    <div className={`mb-1 px-3 py-2 rounded-t-2xl text-[10px] bg-black/10 border-l-4 border-cheza-blue opacity-80 max-w-full truncate ${t.text} backdrop-blur-sm`}>
                        <span className="font-black text-cheza-blue mr-1">{repliedMsg.senderName}:</span>{repliedMsg.content}
                    </div>
                )}
                <div className={`relative px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 transform hover:scale-[1.01] ${isMe ? t.bubbleMe + ' rounded-tr-none' : t.bubbleThem + ' rounded-tl-none'} backdrop-blur-md bg-opacity-95`}>
                  {!isMe && <p className={`text-[10px] font-black mb-1.5 uppercase tracking-tighter ${theme === 'matrix' ? 'text-green-300' : 'text-cheza-blue'}`}>{msg.senderName}</p>}
                  {renderMessageContent(msg)}
                  <div className={`text-[8px] mt-1.5 flex justify-end opacity-40 font-black uppercase tracking-widest`}>
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
                  <div className="w-1 h-1 bg-cheza-blue rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-cheza-blue rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1 h-1 bg-cheza-blue rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest opacity-40 ${t.text}`}>Typing...</span>
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

      <div className={`p-4 ${t.card} border-t ${t.border} z-20 backdrop-blur-xl bg-opacity-95 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]`}>
        {replyTo && (
            <div className="mb-3 p-3 bg-black/5 rounded-2xl flex items-center justify-between border-l-4 border-cheza-blue animate-slide-up backdrop-blur-md">
                <div className="truncate flex-1">
                    <p className="text-[9px] font-black text-cheza-blue uppercase tracking-widest mb-0.5">Replying to {replyTo.senderName}</p>
                    <p className={`text-xs truncate opacity-70 font-bold ${t.text}`}>{replyTo.content}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className={`ml-3 p-1.5 rounded-full hover:bg-black/5 ${t.text}`}>✕</button>
            </div>
        )}
        
        <div className={`flex items-end space-x-3`}>
          <div className="relative">
            <button 
              onClick={() => isConnected && setShowAttachMenu(!showAttachMenu)} 
              className={`p-3 rounded-2xl hover:bg-black/5 transition-all text-xl active:scale-75 ${t.text} ${!isConnected && 'opacity-20'}`}
              disabled={!isConnected}
            >
              📎
            </button>
            {showAttachMenu && (
                <div className={`absolute bottom-16 left-0 ${t.card} shadow-3xl rounded-3xl p-2 w-48 border ${t.border} animate-slide-up flex flex-col z-50 backdrop-blur-2xl`}>
                    {[
                      { icon: '🖼️', label: 'Photo', id: 'f-img', accept: 'image/*', type: MessageType.IMAGE },
                      { icon: '🎥', label: 'Video', id: 'f-vid', accept: 'video/*', type: MessageType.VIDEO },
                      { icon: '📄', label: 'File', id: 'f-doc', accept: '*', type: MessageType.FILE }
                    ].map(btn => (
                      <button key={btn.id} onClick={() => document.getElementById(btn.id)?.click()} className={`flex items-center p-3 space-x-4 hover:bg-black/5 rounded-xl transition group active:scale-95`}>
                          <span className="text-xl transition-transform group-hover:scale-110">{btn.icon}</span> 
                          <span className={`text-[10px] font-black uppercase tracking-widest ${t.text}`}>{btn.label}</span>
                          <input id={btn.id} type="file" accept={btn.accept} className="hidden" onChange={(e) => handleFileSelect(e, btn.type)} />
                      </button>
                    ))}
                </div>
            )}
          </div>
          <div className={`${t.input} rounded-2xl flex-1 flex items-center px-4 py-1.5 border ${t.border} shadow-inner transition-all focus-within:ring-2 focus-within:ring-cheza-blue focus-within:ring-opacity-20`}>
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
              placeholder={isConnected ? "Message..." : "Waiting for peer..."} 
              className={`flex-1 bg-transparent py-2.5 outline-none text-sm font-bold placeholder:opacity-30 resize-none max-h-32 ${t.text}`}
              disabled={!isConnected}
            />
          </div>
          <button 
            onClick={handleSend} 
            disabled={!inputText.trim() || !isConnected} 
            className={`p-3.5 rounded-2xl shadow-xl transition-all transform active:scale-90 ${inputText.trim() && isConnected ? t.accent + ' text-white hover:brightness-110' : 'bg-gray-200 text-gray-400 grayscale'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
          </button>
        </div>
      </div>

      {imageToEdit && (
         <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
            <div className={`${t.card} rounded-[2.5rem] p-8 w-full max-w-sm shadow-3xl border ${t.border}`}>
                <div className="relative group rounded-2xl overflow-hidden mb-6 shadow-2xl bg-black">
                    <img src={imageToEdit.content} className="w-full h-48 object-contain" />
                </div>
                <input 
                    type="text" value={editPrompt} onChange={e => setEditPrompt(e.target.value)} 
                    placeholder="Describe changes..." 
                    className={`w-full p-4 bg-black/5 rounded-xl mb-6 font-bold outline-none border-2 border-transparent focus:border-cheza-blue transition-all text-sm ${t.text}`} 
                />
                <div className="flex space-x-3">
                    <button onClick={() => setImageToEdit(null)} className={`flex-1 py-3 font-black text-xs uppercase tracking-widest ${t.text} opacity-50`}>Cancel</button>
                    <button 
                      onClick={async () => {
                          setIsEditingImage(true);
                          const res = await editChatImage(imageToEdit.content, editPrompt);
                          if (res) sendMessage(res, MessageType.IMAGE);
                          setIsEditingImage(false); setImageToEdit(null);
                      }} 
                      disabled={isEditingImage || !editPrompt.trim()}
                      className={`flex-1 py-3 bg-cheza-blue text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-30`}
                    >
                      {isEditingImage ? 'Thinking...' : 'Magic Edit'}
                    </button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};
