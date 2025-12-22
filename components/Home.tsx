
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { RoomType } from '../types';
import { THEMES } from '../constants';
import { LoadingScreen } from './LoadingScreen';
import { Settings } from './Settings';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const Home: React.FC = () => {
  const { currentUser, login, createRoom, joinRoom, isConnecting, connectionError, theme } = useApp();
  const [username, setUsername] = useState('');
  const [joinId, setJoinId] = useState('');
  const [activeTab, setActiveTab] = useState<'main' | 'join'>('main');
  const [showSettings, setShowSettings] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const [avatarUrl, setAvatarUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUser) {
       setAvatarUrl(`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(username || 'guest')}`);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [username, currentUser]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const t = THEMES[theme];

  if (isConnecting) {
    return <LoadingScreen message={activeTab === 'join' ? "Joining Room..." : "Creating Space..."} />;
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-br from-cheza-blue via-cheza-black to-black text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #00E676 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <div className="z-10 flex flex-col items-center w-full max-w-sm">
          <div className="relative w-24 h-24 mb-6 animate-bounce-short">
            <div className="absolute inset-0 bg-cheza-yellow rounded-full opacity-20 animate-ping"></div>
            <div className="relative w-full h-full bg-white rounded-[2rem] rounded-bl-none flex items-center justify-center shadow-2xl transform rotate-3">
              <div className="w-14 h-14 bg-cheza-blue rounded-full flex items-center justify-center text-white font-black text-xl">CH</div>
            </div>
          </div>
          <h1 className="text-5xl font-black mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cheza-yellow to-cheza-green">ChezaDM</h1>
          <p className="text-gray-300 mb-8 text-center font-medium">Decentralized. P2P. Secure.</p>
          <div className="w-full space-y-5 animate-slide-up bg-white/10 backdrop-blur-lg p-6 rounded-[2.5rem] border border-white/10 shadow-2xl">
            <div className="flex justify-center mb-2">
               <div className="relative">
                 <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full bg-gray-200 border-4 border-cheza-green shadow-lg object-cover" />
                 <div className="absolute -bottom-2 -right-2 flex space-x-1">
                    <button onClick={() => setAvatarUrl(`https://api.dicebear.com/9.x/avataaars/svg?seed=${Math.random()}`)} className="p-2 bg-white text-cheza-blue rounded-full shadow-md">🎲</button>
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-cheza-blue text-white rounded-full shadow-md">📷</button>
                 </div>
               </div>
            </div>
            <input 
              type="text" placeholder="Your nickname" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full p-4 rounded-2xl text-gray-900 bg-white outline-none shadow-inner font-black text-center"
            />
            <button 
              onClick={() => login(username, avatarUrl)}
              className="w-full py-4 bg-cheza-green text-cheza-black font-black text-lg rounded-2xl shadow-xl transition transform active:scale-95"
            >
              Enter App
            </button>
          </div>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => {
          const file = e.target.files?.[0]; if (file) setAvatarUrl(await fileToBase64(file));
        }} />
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${t.bg} p-6 overflow-y-auto relative`}>
       <div className="flex justify-between items-center mb-10 pt-4">
         <div>
           <h2 className={`text-4xl font-black tracking-tight ${t.text}`}>Sasa,<br/><span className="text-cheza-blue">{currentUser.name}</span></h2>
         </div>
         <div className="flex items-center space-x-3">
            {deferredPrompt && (
              <button 
                onClick={handleInstallClick} 
                className={`p-3 rounded-full bg-cheza-blue text-white shadow-lg animate-pulse`}
                title="Install App"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </button>
            )}
            <button onClick={() => setShowSettings(true)} className={`p-3 rounded-full bg-black/5 hover:bg-black/10 transition ${t.text}`}>
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0m-9.75 0h9.75" /></svg>
            </button>
            <img src={currentUser.avatarUrl} className="w-14 h-14 rounded-full border-4 border-white shadow-xl bg-gray-200 object-cover" alt="me" />
         </div>
       </div>

       {activeTab === 'main' ? (
         <div className="grid gap-6 animate-pop-in">
            <div className={`${t.card} rounded-[2.5rem] p-8 shadow-2xl border-t-[10px] border-cheza-blue group transition-all hover:translate-y-[-4px]`}>
              <div className="flex items-center mb-6">
                 <div className="w-14 h-14 bg-cheza-blue/10 rounded-2xl flex items-center justify-center text-cheza-blue mr-4 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                 </div>
                 <div><h3 className={`text-2xl font-black ${t.text}`}>Private</h3><p className="text-xs font-bold opacity-40 uppercase tracking-widest">End-to-End Handshake</p></div>
              </div>
              <div className="flex space-x-3">
                 <button onClick={() => createRoom(RoomType.PRIVATE)} className="flex-1 py-4 bg-cheza-blue text-white rounded-2xl font-black shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition">NEW</button>
                 <button onClick={() => setActiveTab('join')} className="flex-1 py-4 bg-black/5 dark:bg-white/5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black/10 transition">JOIN</button>
              </div>
            </div>

            <div className={`${t.card} rounded-[2.5rem] p-8 shadow-2xl border-t-[10px] border-cheza-green group transition-all hover:translate-y-[-4px]`}>
              <div className="flex items-center mb-6">
                 <div className="w-14 h-14 bg-cheza-green/10 rounded-2xl flex items-center justify-center text-cheza-green mr-4 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                 </div>
                 <div><h3 className={`text-2xl font-black ${t.text}`}>Group</h3><p className="text-xs font-bold opacity-40 uppercase tracking-widest">Open Session</p></div>
              </div>
              <button onClick={() => createRoom(RoomType.GROUP)} className="w-full py-4 bg-cheza-green text-cheza-black rounded-2xl font-black shadow-lg shadow-green-500/30 hover:bg-green-400 transition">CREATE GROUP</button>
            </div>
         </div>
       ) : (
         <div className="flex flex-col animate-slide-up">
            <button onClick={() => setActiveTab('main')} className={`self-start mb-8 font-black flex items-center hover:text-cheza-blue transition ${t.text}`}>← Back</button>
            <h2 className={`text-4xl font-black mb-2 ${t.text}`}>Join Room</h2>
            <p className="text-gray-500 mb-10 font-medium">Connect directly via the host's Peer ID.</p>
            <div className="space-y-4">
               <input 
                 type="text" placeholder="PASTE PEER ID" value={joinId} onChange={(e) => setJoinId(e.target.value)}
                 className={`w-full p-6 rounded-[1.5rem] ${t.card} border-2 border-black/5 focus:border-cheza-blue transition outline-none font-black text-center text-lg tracking-tighter ${t.text}`}
               />
               {connectionError && <p className="text-red-500 text-xs font-black text-center">{connectionError}</p>}
               <button onClick={() => joinRoom(joinId)} disabled={!joinId} className="w-full py-5 bg-cheza-black dark:bg-white text-white dark:text-cheza-black font-black text-xl rounded-2xl shadow-2xl disabled:opacity-20 transition active:scale-95">CONNECT NOW</button>
            </div>
         </div>
       )}

       {showSettings && <Settings onClose={() => setShowSettings(false)} />}
       
       <div className="mt-auto pt-10 text-center opacity-30 flex flex-col items-center">
         <div className="w-1 h-1 bg-current rounded-full mb-4"></div>
         <p className="text-[10px] font-black tracking-[0.3em] uppercase">Built for Kenyans 🇰🇪</p>
       </div>
    </div>
  );
};
