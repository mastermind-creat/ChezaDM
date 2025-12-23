
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ThemeType } from '../types';
import { THEMES, CHAT_BGS } from '../constants';

interface SettingsProps {
  onClose: () => void;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { theme, setAppTheme, currentUser, updateUser, chatBg, setChatBg, logout } = useApp();
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [waConfig, setWaConfig] = useState(currentUser?.whatsappBot || { apiKey: '', webhookUrl: '', enabled: false });
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const t = THEMES[theme];

  const handleNameBlur = () => {
    if (profileName.trim() !== currentUser?.name) {
      updateUser({ name: profileName.trim() });
    }
  };

  const handleSaveAll = () => {
    updateUser({ name: profileName, whatsappBot: waConfig });
    onClose();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      updateUser({ avatarUrl: base64 });
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-lg flex items-center justify-center p-4 animate-fade-in">
      <div className={`w-full max-w-lg ${t.card} rounded-[2.5rem] p-8 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto border ${t.border} transition-colors duration-500`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className={`text-3xl font-black ${t.text} tracking-tight`}>Settings</h2>
          <button onClick={onClose} className={`p-2 hover:bg-black/5 rounded-full transition-all ${t.text}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-12">
          {/* Profile Section */}
          <section>
            <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-6 opacity-40 ${t.text}`}>Personalize Profile</h3>
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8 mb-6">
                <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-[2.5rem] flex items-center justify-center transition-opacity z-10">
                    <span className="text-white text-xs font-black">EDIT</span>
                  </div>
                  <img src={currentUser?.avatarUrl} className="w-32 h-32 rounded-[2.5rem] border-4 border-cheza-blue shadow-2xl bg-white object-cover" alt="Avatar" />
                  <div className="absolute -bottom-2 -right-2 bg-cheza-blue text-white p-2.5 rounded-full shadow-xl border-2 border-white z-20">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
                  </div>
                  <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </div>
                <div className="flex-1 w-full space-y-3">
                   <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${t.text}`}>Display Nickname</p>
                   <input 
                      type="text" value={profileName} 
                      onChange={(e) => setProfileName(e.target.value)}
                      onBlur={handleNameBlur}
                      className={`w-full p-4 rounded-2xl font-black border-2 outline-none focus:border-cheza-blue transition-all ${t.border} ${t.input} ${t.text}`} placeholder="Nickname"
                   />
                   <div className="flex items-center justify-between">
                     <p className={`text-[10px] font-black opacity-30 uppercase tracking-tighter ${t.text}`}>UID: {currentUser?.id}</p>
                     <button onClick={() => navigator.clipboard.writeText(currentUser?.id || '')} className="text-[10px] font-black text-cheza-blue uppercase tracking-widest hover:underline">Copy ID</button>
                   </div>
                </div>
            </div>
          </section>

          {/* Visual Theme Section */}
          <section>
            <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-6 opacity-40 ${t.text}`}>App Experience</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {(Object.keys(THEMES) as ThemeType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setAppTheme(type)}
                  className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all group ${
                    theme === type ? 'border-cheza-blue bg-cheza-blue/5' : 'border-transparent bg-black/5 hover:bg-black/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-2xl mb-3 shadow-lg flex items-center justify-center transform group-active:scale-90 transition-transform ${THEMES[type].bubbleMe.split(' ')[0]}`}>
                    {type === 'matrix' ? '01' : type === 'kenya' ? '🇰🇪' : type === 'sunset' ? '☀️' : 'Aa'}
                  </div>
                  <span className={`text-[10px] font-black capitalize tracking-widest ${t.text}`}>{type}</span>
                </button>
              ))}
            </div>

            <h4 className={`text-[10px] font-black uppercase tracking-widest mb-4 opacity-40 ${t.text}`}>Chat Wallpaper</h4>
            <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
              {CHAT_BGS.map(bg => (
                <button 
                  key={bg.id} onClick={() => setChatBg(bg.url)}
                  className={`shrink-0 w-28 h-40 rounded-3xl border-4 transition-all relative overflow-hidden transform hover:scale-105 ${chatBg === bg.url ? 'border-cheza-blue shadow-xl' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  {bg.url ? (
                    <img src={bg.url} className="absolute inset-0 w-full h-full object-cover" alt={bg.label} />
                  ) : (
                    <div className="bg-gradient-to-br from-gray-200 to-gray-400 w-full h-full" />
                  )}
                  <div className="absolute inset-0 bg-black/20" />
                  <span className="absolute bottom-3 left-0 right-0 text-[9px] font-black text-white text-center uppercase tracking-tighter drop-shadow-md">{bg.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* WhatsApp Bot Section */}
          <section className={`p-8 rounded-[3rem] ${theme === 'matrix' ? 'bg-green-900/10 border-green-500/20' : theme === 'dark' ? 'bg-green-950/20 border-green-900/40' : 'bg-green-50 border-green-100'} border-2 transition-all duration-500`}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                 <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg text-2xl">💬</div>
                 <div>
                   <h3 className={`text-xl font-black ${t.text}`}>WA Bot Link</h3>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-green-600">Sync with WhatsApp</p>
                 </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer scale-110">
                <input type="checkbox" checked={waConfig.enabled} onChange={() => setWaConfig({...waConfig, enabled: !waConfig.enabled})} className="sr-only peer" />
                <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
            
            {waConfig.enabled ? (
                <div className="space-y-6 mt-8 animate-slide-up">
                  <div className="relative">
                    <p className={`text-[10px] font-black uppercase mb-2 opacity-50 ${t.text}`}>Bot API Secret</p>
                    <input 
                      type="password" value={waConfig.apiKey} 
                      onChange={e => setWaConfig({...waConfig, apiKey: e.target.value})} 
                      className={`w-full p-5 rounded-2xl text-xs font-black border-2 border-green-200 bg-white/50 focus:border-green-500 outline-none transition-all`} placeholder="PASTE KEY HERE" 
                    />
                  </div>
                  <div className="relative">
                    <p className={`text-[10px] font-black uppercase mb-2 opacity-50 ${t.text}`}>Forwarding Endpoint</p>
                    <input 
                      type="text" value={waConfig.webhookUrl} 
                      onChange={e => setWaConfig({...waConfig, webhookUrl: e.target.value})} 
                      className={`w-full p-5 rounded-2xl text-xs font-black border-2 border-green-200 bg-white/50 focus:border-green-500 outline-none transition-all`} placeholder="HTTPS://API.MYBOT.COM/HOOK" 
                    />
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
                    <p className="text-[10px] font-bold text-green-700 leading-relaxed uppercase">
                      * Enabled bot will automatically relay your ChezaDM outgoing messages to the configured endpoint.
                    </p>
                  </div>
                </div>
            ) : (
              <p className={`text-xs font-medium opacity-50 mt-4 leading-relaxed ${t.text}`}>
                Connect your custom WhatsApp bot API to sync messages across platforms. Ideal for Kenyan entrepreneurs and group admins.
              </p>
            )}
          </section>

          <div className="sticky bottom-0 pt-4 bg-inherit pb-4 space-y-4">
            <button 
              onClick={handleSaveAll}
              className="w-full py-5 bg-cheza-blue text-white font-black text-xl rounded-[2rem] shadow-2xl transform active:scale-95 transition-all hover:bg-blue-600 flex items-center justify-center space-x-3"
            >
              <span>APPLY CHANGES</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            </button>
            <button 
              onClick={logout}
              className={`w-full py-3 bg-red-500/10 text-red-500 font-black text-xs uppercase tracking-widest rounded-2xl border border-red-500/20 hover:bg-red-500/20 transition-all`}
            >
              Logout / Reset Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
