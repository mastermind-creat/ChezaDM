
import React, { useState, useRef } from 'react';
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
  const { theme, setAppTheme, currentUser, updateUser, chatBg, setChatBg } = useApp();
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [showWA, setShowWA] = useState(false);
  const [waConfig, setWaConfig] = useState(currentUser?.whatsappBot || { apiKey: '', webhookUrl: '', enabled: false });
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const t = THEMES[theme];

  const handleSaveProfile = () => {
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
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className={`w-full max-w-lg ${t.card} rounded-[2.5rem] p-8 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto border ${t.border}`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className={`text-3xl font-black ${t.text} tracking-tight`}>Settings</h2>
          <button onClick={onClose} className={`p-2 hover:bg-black/5 rounded-full transition ${t.text}`}>✕</button>
        </div>

        <div className="space-y-10">
          {/* Profile Section */}
          <section>
            <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-6 opacity-40 ${t.text}`}>My Profile</h3>
            <div className="flex items-center space-x-6 mb-6">
                <div className="relative">
                  <img src={currentUser?.avatarUrl} className="w-24 h-24 rounded-[2rem] border-4 border-cheza-blue shadow-lg bg-white" alt="Avatar" />
                  <button onClick={() => avatarInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-cheza-blue text-white p-2 rounded-full shadow-xl">📷</button>
                  <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </div>
                <div className="flex-1 space-y-2">
                   <input 
                      type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)}
                      className={`w-full p-4 rounded-2xl font-bold border ${t.border} ${t.input} ${t.text}`} placeholder="Nickname"
                   />
                   <p className="text-[10px] font-black opacity-30 uppercase tracking-tighter">ID: {currentUser?.id}</p>
                </div>
            </div>
          </section>

          {/* Visual Theme Section */}
          <section>
            <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-6 opacity-40 ${t.text}`}>Visual Style</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {(Object.keys(THEMES) as ThemeType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setAppTheme(type)}
                  className={`flex items-center p-4 rounded-2xl border-2 transition-all ${
                    theme === type ? 'border-cheza-blue bg-cheza-blue/5' : 'border-transparent bg-black/5'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full mr-3 ${THEMES[type].bubbleMe.split(' ')[0]}`}></div>
                  <span className={`text-sm font-black capitalize ${t.text}`}>{type}</span>
                </button>
              ))}
            </div>

            <h4 className={`text-[10px] font-black uppercase tracking-widest mb-4 opacity-40 ${t.text}`}>Chat Background</h4>
            <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide">
              {CHAT_BGS.map(bg => (
                <button 
                  key={bg.id} onClick={() => setChatBg(bg.url)}
                  className={`shrink-0 w-24 h-32 rounded-2xl border-4 transition-all relative overflow-hidden ${chatBg === bg.url ? 'border-cheza-blue' : 'border-transparent'}`}
                >
                  {bg.url ? <img src={bg.url} className="absolute inset-0 w-full h-full object-cover opacity-50" /> : <div className="bg-black/5 w-full h-full" />}
                  <span className="absolute bottom-2 left-0 right-0 text-[8px] font-black text-white bg-black/50 py-1 uppercase">{bg.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* WhatsApp Bot Section */}
          <section className={`p-6 rounded-[2rem] ${theme === 'matrix' ? 'bg-green-900/10 border-green-500/20' : 'bg-green-50 border-green-100'} border-2`}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                 <span className="text-2xl">💬</span>
                 <h3 className={`text-lg font-black ${t.text}`}>WhatsApp Sync</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={waConfig.enabled} onChange={() => setWaConfig({...waConfig, enabled: !waConfig.enabled})} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            
            {waConfig.enabled && (
                <div className="space-y-4 mt-6 animate-slide-up">
                  <div>
                    <p className="text-[9px] font-black opacity-40 uppercase mb-2">Bot API Key</p>
                    <input type="password" value={waConfig.apiKey} onChange={e => setWaConfig({...waConfig, apiKey: e.target.value})} className={`w-full p-4 rounded-xl text-xs font-bold border border-green-200 bg-white/50`} placeholder="PASTE API KEY" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black opacity-40 uppercase mb-2">Forwarding Webhook</p>
                    <input type="text" value={waConfig.webhookUrl} onChange={e => setWaConfig({...waConfig, webhookUrl: e.target.value})} className={`w-full p-4 rounded-xl text-xs font-bold border border-green-200 bg-white/50`} placeholder="HTTPS://API.MYBOT.COM/HOOK" />
                  </div>
                </div>
            )}
          </section>

          <button 
            onClick={handleSaveProfile}
            className="w-full py-5 bg-cheza-blue text-white font-black text-xl rounded-2xl shadow-2xl active:scale-95 transition"
          >
            Save All Changes
          </button>
        </div>
      </div>
    </div>
  );
};
