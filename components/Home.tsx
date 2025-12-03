import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { RoomType } from '../types';

// Utility to handle file upload for avatar
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const Home: React.FC = () => {
  const { currentUser, login, updateUser, createRoom, joinRoom } = useApp();
  const [username, setUsername] = useState('');
  const [joinId, setJoinId] = useState('');
  const [activeTab, setActiveTab] = useState<'main' | 'join'>('main');
  
  // Avatar State
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Profile State
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');

  // Initialize avatar for new user based on typed name
  useEffect(() => {
    // Only auto-generate if user hasn't uploaded/randomized yet or if input is empty (reset)
    if (!currentUser && !avatarUrl.startsWith('data:') && !avatarUrl.includes('dicebear.com/9.x/avataaars/svg?seed=' + encodeURIComponent(username))) {
       const seed = username || 'guest';
       setAvatarUrl(`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}`);
    }
  }, [username, currentUser, avatarUrl]);

  // Initialize edit state when opening modal
  useEffect(() => {
    if (showEditProfile && currentUser) {
      setEditName(currentUser.name);
      setAvatarUrl(currentUser.avatarUrl || '');
    }
  }, [showEditProfile, currentUser]);

  const handleRandomizeAvatar = (e: React.MouseEvent) => {
    e.preventDefault();
    const randomSeed = Math.random().toString(36).substring(7);
    setAvatarUrl(`https://api.dicebear.com/9.x/avataaars/svg?seed=${randomSeed}`);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) { // 500KB limit
        alert("⚠️ Please choose an image smaller than 500KB to ensure fast loading.");
        return;
    }
    
    setIsUploading(true);
    try {
      const base64 = await fileToBase64(file);
      setAvatarUrl(base64);
    } catch (err) {
      console.error("Avatar upload failed", err);
      alert("Failed to load image. Please try another.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) return;
    updateUser({ name: editName, avatarUrl: avatarUrl });
    setShowEditProfile(false);
  };

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
          <div className="relative w-24 h-24 mb-6 animate-bounce-short">
            <div className="absolute inset-0 bg-cheza-yellow rounded-full opacity-20 animate-ping"></div>
            <div className="relative w-full h-full bg-white rounded-[2rem] rounded-bl-none flex items-center justify-center shadow-2xl transform rotate-3 transition-transform hover:rotate-0">
              <div className="w-14 h-14 bg-cheza-blue rounded-full flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white ml-1">
                  <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
                </svg>
              </div>
            </div>
          </div>

          <h1 className="text-5xl font-black mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cheza-yellow to-cheza-green">
            ChezaDM
          </h1>
          <p className="text-gray-300 mb-8 text-center font-medium">Secure. Fast. Kenyan Style.</p>
          
          <div className="w-full space-y-5 animate-slide-up bg-white/10 backdrop-blur-lg p-6 rounded-3xl border border-white/10">
            {/* Avatar Picker */}
            <div className="flex justify-center mb-2">
               <div className="relative group">
                 <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-4 border-cheza-green shadow-lg">
                    {isUploading ? (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Loading...</div>
                    ) : (
                        <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                    )}
                 </div>
                 <div className="absolute -bottom-2 -right-2 flex space-x-1">
                    <button 
                      onClick={handleRandomizeAvatar}
                      className="p-2 bg-white text-cheza-blue rounded-full shadow-md hover:bg-gray-100 transition"
                      title="Randomize"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-cheza-blue text-white rounded-full shadow-md hover:bg-blue-600 transition"
                      title="Upload"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleAvatarUpload} 
                    />
                 </div>
               </div>
            </div>

            <input 
              type="text" 
              placeholder="Enter nickname (e.g. Shujaa)" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded-xl text-gray-900 bg-white focus:ring-4 focus:ring-cheza-green outline-none shadow-inner placeholder:text-gray-400 font-medium text-center"
            />
            <button 
              onClick={() => login(username, avatarUrl)}
              className="w-full py-3.5 bg-cheza-green hover:bg-green-600 text-cheza-black font-black text-lg rounded-xl shadow-xl transition transform active:scale-95 flex items-center justify-center space-x-2"
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
    <div className="flex flex-col h-full bg-cheza-light dark:bg-cheza-black p-6 overflow-y-auto relative">
       <div className="flex justify-between items-center mb-8 pt-4">
         <div>
           <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Habari,<br/><span className="text-cheza-blue">{currentUser.name}</span></h2>
         </div>
         
         {/* Clickable Avatar to Edit */}
         <div className="relative cursor-pointer group" onClick={() => setShowEditProfile(true)}>
            <img src={currentUser.avatarUrl} alt="Me" className="w-14 h-14 rounded-full border-4 border-white dark:border-gray-700 shadow-md bg-gray-200 object-cover" />
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-cheza-green border-2 border-white rounded-full"></div>
            <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>
            </div>
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

       {/* Edit Profile Modal */}
       {showEditProfile && (
          <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
             <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-xs shadow-2xl">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">Edit Profile</h3>
                
                <div className="flex justify-center mb-6">
                   <div className="relative">
                     <img src={avatarUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-cheza-blue" />
                     <div className="absolute -bottom-2 -right-2 flex space-x-1">
                        <button onClick={handleRandomizeAvatar} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 transition" title="Randomize">🎲</button>
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-cheza-blue text-white rounded-full hover:bg-blue-600 transition" title="Upload">📷</button>
                     </div>
                   </div>
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleAvatarUpload} 
                />

                <div className="space-y-3">
                   <input 
                      type="text" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Display Name"
                      className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-700 border-none font-medium"
                   />
                   <button onClick={handleSaveProfile} className="w-full py-3 bg-cheza-green text-cheza-black font-bold rounded-xl shadow-lg">Save Changes</button>
                   <button onClick={() => setShowEditProfile(false)} className="w-full py-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium">Cancel</button>
                </div>
             </div>
          </div>
       )}

       <div className="mt-auto pt-10 flex justify-center flex-col items-center text-center opacity-60">
         <p className="text-xs text-gray-400 font-semibold">Designed for 🇰🇪 with ❤️</p>
         <p className="text-[10px] text-gray-300 mt-1">v1.0.0 • PWA Ready</p>
       </div>
    </div>
  );
};