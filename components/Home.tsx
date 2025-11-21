
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RoomType } from '../types';

export const Home: React.FC = () => {
  const { currentUser, login, createRoom, joinRoom } = useApp();
  const [username, setUsername] = useState('');
  const [joinId, setJoinId] = useState('');
  const [activeTab, setActiveTab] = useState<'main' | 'join'>('main');

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-br from-cheza-blue via-cheza-black to-black text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, #00E676 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}></div>

        <div className="z-10 flex flex-col items-center w-full max-w-sm">
          {/* Logo Area */}
          <div className="relative w-28 h-28 mb-8 animate-bounce-short">
            <div className="absolute inset-0 bg-cheza-yellow rounded-full opacity-20 animate-ping"></div>
            <div className="relative w-full h-full bg-white rounded-[2.5rem] rounded-bl-none flex items-center justify-center shadow-2xl transform rotate-3 transition-transform hover:rotate-0">
              <div className="w-16 h-16 bg-cheza-blue rounded-full flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white ml-1">
                  <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
                </svg>
              </div>
            </div>
          </div>

          <h1 className="text-5xl font-black mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cheza-yellow to-cheza-green">
            ChezaDM
          </h1>
          <p className="text-gray-300 mb-10 text-center font-medium">Secure. Fast. Kenyan Style.</p>
          
          <div className="w-full space-y-4 animate-slide-up">
            <input 
              type="text" 
              placeholder="Enter nickname (e.g. Shujaa)" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-4 rounded-2xl text-gray-900 bg-white/95 backdrop-blur-md focus:ring-4 focus:ring-cheza-green outline-none shadow-lg placeholder:text-gray-400 font-medium"
            />
            <button 
              onClick={() => login(username)}
              className="w-full py-4 bg-cheza-green hover:bg-green-600 text-cheza-black font-black text-lg rounded-2xl shadow-xl transition transform active:scale-95 flex items-center justify-center space-x-2"
            >
              <span>Start Chatting</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="absolute bottom-6 text-xs text-white/30">
          Proudly Kenyan 🇰🇪
        </div>
      </div>
    );
  }

  if (activeTab === 'join') {
    return (
      <div className="flex flex-col h-full bg-cheza-light dark:bg-cheza-black p-6 animate-slide-up">
        <button onClick={() => setActiveTab('main')} className="self-start mb-6 text-gray-500 flex items-center hover:text-cheza-blue transition">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Join Session</h2>
        <p className="text-gray-500 mb-8 font-medium">Paste the Session ID or Link you received to jump in.</p>
        
        <div className="space-y-4">
           <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400">ID:</span>
              </div>
              <input 
                type="text" 
                placeholder="xy7z99a" 
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                className="w-full p-4 pl-12 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-transparent focus:border-cheza-blue focus:ring-0 outline-none shadow-sm font-mono text-lg"
              />
           </div>
          <button 
            onClick={() => { if(joinId) joinRoom(joinId); }}
            disabled={!joinId}
            className="w-full py-4 bg-cheza-black dark:bg-white text-white dark:text-cheza-black font-bold rounded-2xl shadow-lg disabled:opacity-50 disabled:shadow-none hover:shadow-xl transition-all"
          >
            Join Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-cheza-light dark:bg-cheza-black p-6 overflow-y-auto">
       <div className="flex justify-between items-center mb-8 pt-4">
         <div>
           <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Habari,<br/><span className="text-cheza-blue">{currentUser.name}</span></h2>
         </div>
         <div className="relative">
            <img src={currentUser.avatarUrl} alt="Me" className="w-14 h-14 rounded-full border-4 border-white dark:border-gray-700 shadow-md bg-gray-200" />
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-cheza-green border-2 border-white rounded-full"></div>
         </div>
       </div>

       <div className="grid gap-6">
          {/* Private Session Card */}
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-xl border-t-4 border-cheza-blue transform transition hover:-translate-y-1">
            <div className="flex items-center mb-5">
               <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-cheza-blue mr-4 shadow-inner">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
               </div>
               <div>
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white">Private Session</h3>
                 <p className="text-sm text-gray-500 font-medium">Encrypted, one-on-one.</p>
               </div>
            </div>
            <div className="flex space-x-3">
               <button 
                 onClick={() => createRoom(RoomType.PRIVATE)}
                 className="flex-1 py-3.5 bg-cheza-blue text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition"
               >
                 Create New
               </button>
               <button 
                 onClick={() => setActiveTab('join')}
                 className="flex-1 py-3.5 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
               >
                 Join ID
               </button>
            </div>
          </div>

          {/* Group Space Card */}
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-xl border-t-4 border-cheza-green transform transition hover:-translate-y-1">
            <div className="flex items-center mb-5">
               <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center text-cheza-green mr-4 shadow-inner">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
               </div>
               <div>
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white">Group Space</h3>
                 <p className="text-sm text-gray-500 font-medium">Admins, bots & more.</p>
               </div>
            </div>
            <div className="flex space-x-3">
               <button 
                 onClick={() => createRoom(RoomType.GROUP)}
                 className="flex-1 py-3.5 bg-cheza-green text-cheza-black rounded-xl text-sm font-black shadow-lg shadow-green-500/30 hover:bg-green-400 transition"
               >
                 Create Group
               </button>
               <button 
                 onClick={() => setActiveTab('join')}
                 className="flex-1 py-3.5 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
               >
                 Join Group
               </button>
            </div>
          </div>
       </div>

       <div className="mt-auto pt-10 flex justify-center flex-col items-center text-center opacity-60">
         <p className="text-xs text-gray-400 font-semibold">Designed for 🇰🇪 with ❤️</p>
         <p className="text-[10px] text-gray-300 mt-1">v1.0.0 • PWA Ready</p>
       </div>
    </div>
  );
};