
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MessageType, Message } from '../types';
import { editChatImage } from '../services/geminiService';
import { THEMES } from '../constants';

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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, msg: Message } | null>(null);
  
  const [imageToEdit, setImageToEdit] = useState<{id: string, content: string} | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditingImage, setIsEditingImage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const t = THEMES[theme];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers, replyTo]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
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
    if (!file) return;
    setUploadProgress(10);
    try {
        const base64 = await fileToBase64(file);
        setUploadProgress(100);
        sendMessage(type === MessageType.FILE ? JSON.stringify({ name: file.name, size: file.size, data: base64 }) : base64, type);
        setTimeout(() => setUploadProgress(null), 1000);
        setShowAttachMenu(false);
    } catch (err) { setUploadProgress(null); }
  };

  const renderMessageContent = (msg: Message) => {
    if (msg.isDeleted) return <p className="italic opacity-50 text-xs">This message was deleted</p>;
    switch (msg.type) {
        case MessageType.IMAGE:
            return (
                <div className="relative group/image">
                    <img src={msg.content} className="max-w-full max-h-80 object-cover rounded-lg" loading="lazy" />
                    <button onClick={() => setImageToEdit({id: msg.id, content: msg.content})} className="absolute bottom-2 right-2 bg-white/90 p-1.5 rounded-full text-[10px] font-bold opacity-0 group-hover/image:opacity-100 transition-opacity">✨ AI EDIT</button>
                </div>
            );
        case MessageType.FILE:
            try {
                const f = JSON.parse(msg.content);
                return <div className="flex items-center space-x-2 p-2 rounded-lg bg-black/5"><span>📁</span><span className="text-xs font-bold truncate flex-1">{f.name}</span><a href={f.data} download={f.name} className="opacity-50">⬇️</a></div>;
            } catch { return <span>File error</span>; }
        default:
            return <p className="whitespace-pre-wrap leading-relaxed text-sm font-medium">{msg.content}{msg.isEdited && <span className="ml-1 text-[8px] opacity-40 uppercase tracking-tighter">(edited)</span>}</p>;
    }
  };

  return (
    <div className={`flex flex-col h-full ${t.bg} transition-all duration-300 relative`}>
      {/* Dynamic Background */}
      {chatBg && <div className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-700" style={{ backgroundImage: `url(${chatBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>}
      
      <header className={`${t.card} p-4 border-b ${t.border} flex items-center justify-between z-20 shadow-sm`}>
        <div className="flex items-center space-x-3">
          <button onClick={leaveRoom} className={`p-2 ${t.text} rounded-full transition`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          </button>
          <div>
            <h1 className={`font-black text-lg ${t.text}`}>{currentRoom?.name}</h1>
            <div className="flex items-center space-x-1">
                <span className={`w-1.5 h-1.5 rounded-full ${peers.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                <span className={`text-[9px] font-black uppercase opacity-40 ${t.text}`}>{peers.length + 1} ONLINE</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-1">
            <div className={`px-3 py-1 bg-black/5 rounded-full text-[10px] font-black ${t.text}`}>{currentRoom?.id}</div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 z-10" onClick={() => { setContextMenu(null); setShowAttachMenu(false); }}>
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.id;
          const repliedMsg = msg.replyTo ? messages.find(m => m.id === msg.replyTo) : null;
          return (
            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-pop-in`}>
              <div 
                className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, msg }); }}
              >
                {repliedMsg && (
                    <div className={`mb-1 px-3 py-1.5 rounded-xl text-[10px] bg-black/5 border-l-4 border-cheza-blue opacity-70 max-w-full truncate ${t.text}`}>
                        <span className="font-black mr-1">{repliedMsg.senderName}:</span>{repliedMsg.content}
                    </div>
                )}
                <div className={`relative px-4 py-2.5 rounded-2xl shadow-sm ${isMe ? t.bubbleMe + ' rounded-br-none' : t.bubbleThem + ' rounded-bl-none'}`}>
                  {!isMe && <p className={`text-[9px] font-black mb-1 uppercase ${theme === 'matrix' ? 'text-green-300' : 'text-cheza-blue'}`}>{msg.senderName}</p>}
                  {renderMessageContent(msg)}
                  <div className={`text-[8px] mt-1 flex justify-end opacity-40 font-black uppercase`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {Object.values(typingUsers).length > 0 && (
            <div className={`text-[10px] font-black opacity-50 ${t.text} animate-pulse`}>
                {Object.values(typingUsers).join(', ')} typing...
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Context Menu */}
      {contextMenu && (
          <div className={`fixed z-[100] ${t.card} shadow-2xl rounded-2xl p-1 border ${t.border}`} style={{ left: Math.min(contextMenu.x, window.innerWidth - 150), top: Math.min(contextMenu.y, window.innerHeight - 150) }}>
              <button onClick={() => handleReply(contextMenu.msg)} className={`w-full text-left px-4 py-2 text-xs font-bold ${t.text} hover:bg-black/5 rounded-xl`}>Reply</button>
              {contextMenu.msg.senderId === currentUser?.id && !contextMenu.msg.isDeleted && (
                  <>
                      <button onClick={() => handleEdit(contextMenu.msg)} className={`w-full text-left px-4 py-2 text-xs font-bold ${t.text} hover:bg-black/5 rounded-xl`}>Edit</button>
                      <button onClick={() => handleDelete(contextMenu.msg)} className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl">Delete</button>
                  </>
              )}
          </div>
      )}

      {/* Input Tray */}
      <div className={`p-4 ${t.card} border-t ${t.border} z-20`}>
        {replyTo && (
            <div className="mb-2 p-2 bg-black/5 rounded-xl flex items-center justify-between border-l-4 border-cheza-blue">
                <div className="truncate flex-1">
                    <p className="text-[10px] font-black text-cheza-blue uppercase">Replying to {replyTo.senderName}</p>
                    <p className={`text-xs truncate opacity-70 ${t.text}`}>{replyTo.content}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="p-1 opacity-50">✕</button>
            </div>
        )}
        {editingId && (
            <div className="mb-2 p-2 bg-black/5 rounded-xl flex items-center justify-between border-l-4 border-yellow-500">
                <div className="truncate flex-1">
                    <p className="text-[10px] font-black text-yellow-500 uppercase">Editing Message</p>
                </div>
                <button onClick={() => { setEditingId(null); setInputText(''); }} className="p-1 opacity-50">✕</button>
            </div>
        )}
        
        <div className="flex items-end space-x-3">
          <div className="relative">
            <button onClick={() => setShowAttachMenu(!showAttachMenu)} className={`p-3 opacity-40 hover:opacity-100 transition ${t.text}`}>📎</button>
            {showAttachMenu && (
                <div className={`absolute bottom-16 left-0 ${t.card} shadow-2xl rounded-2xl p-2 w-48 border ${t.border} animate-slide-up flex flex-col z-50`}>
                    {[
                      { icon: '🖼️', label: 'Photo', id: 'f-img', accept: 'image/*', type: MessageType.IMAGE },
                      { icon: '🎥', label: 'Video', id: 'f-vid', accept: 'video/*', type: MessageType.VIDEO },
                      { icon: '📄', label: 'File', id: 'f-doc', accept: '*', type: MessageType.FILE }
                    ].map(btn => (
                      <button key={btn.id} onClick={() => document.getElementById(btn.id)?.click()} className={`flex items-center p-3 space-x-3 hover:bg-black/5 rounded-xl transition`}>
                          <span>{btn.icon}</span> <span className={`text-xs font-black uppercase ${t.text}`}>{btn.label}</span>
                          <input id={btn.id} type="file" accept={btn.accept} className="hidden" onChange={(e) => handleFileSelect(e, btn.type)} />
                      </button>
                    ))}
                </div>
            )}
          </div>
          <div className={`${t.input} rounded-2xl flex-1 flex items-center px-4 py-1.5 border ${t.border} shadow-inner`}>
            <input 
              type="text" value={inputText} onChange={(e) => { setInputText(e.target.value); sendTypingSignal(true); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Type message..." 
              className={`flex-1 bg-transparent py-2.5 outline-none text-sm font-bold placeholder:opacity-30 ${t.text}`}
            />
          </div>
          <button onClick={handleSend} disabled={!inputText.trim()} className={`p-4 rounded-2xl shadow-xl transition transform active:scale-95 ${inputText.trim() ? t.accent + ' text-white' : 'bg-gray-200 text-gray-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
          </button>
        </div>
      </div>

      {imageToEdit && (
         <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className={`${t.card} rounded-3xl p-6 w-full max-w-sm shadow-2xl`}>
                <img src={imageToEdit.content} className="w-full h-48 object-cover rounded-2xl mb-6 shadow-inner" />
                <input type="text" value={editPrompt} onChange={e => setEditPrompt(e.target.value)} placeholder="AI Instruction..." className={`w-full p-4 bg-black/5 rounded-2xl mb-4 font-bold outline-none border-2 border-transparent focus:border-cheza-blue transition ${t.text}`} />
                <div className="flex space-x-3">
                    <button onClick={() => setImageToEdit(null)} className={`flex-1 py-4 font-black text-xs uppercase ${t.text} opacity-50`}>Cancel</button>
                    <button onClick={async () => {
                        setIsEditingImage(true);
                        const res = await editChatImage(imageToEdit.content, editPrompt);
                        if (res) sendMessage(res, MessageType.IMAGE);
                        setIsEditingImage(false); setImageToEdit(null);
                    }} className={`flex-1 py-4 bg-cheza-blue text-white rounded-2xl font-black text-xs uppercase`}>{isEditingImage ? 'Thinking...' : 'Apply'}</button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};
