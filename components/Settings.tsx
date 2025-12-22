
import React from 'react';
import { useApp } from '../context/AppContext';
import { ThemeType } from '../types';
import { THEMES } from '../constants';

interface SettingsProps {
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { theme, setAppTheme, currentUser, updateUser } = useApp();

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div className={`w-full max-w-md ${THEMES[theme].card} rounded-[2rem] p-6 shadow-2xl animate-slide-up`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-black ${THEMES[theme].text}`}>Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-6 h-6 ${THEMES[theme].text}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-8">
          {/* Themes Section */}
          <section>
            <h3 className={`text-xs font-black uppercase tracking-widest mb-4 opacity-50 ${THEMES[theme].text}`}>Visual Theme</h3>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(THEMES) as ThemeType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setAppTheme(t)}
                  className={`relative flex items-center p-3 rounded-2xl border-2 transition-all ${
                    theme === t 
                      ? 'border-cheza-blue bg-cheza-blue/5' 
                      : 'border-transparent bg-gray-50 dark:bg-gray-700/50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full mr-3 border border-black/10 ${THEMES[t].accent}`}></div>
                  <span className={`text-sm font-bold capitalize ${THEMES[theme].text}`}>{t}</span>
                  {theme === t && (
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 bg-cheza-blue rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Account Info */}
          <section>
             <h3 className={`text-xs font-black uppercase tracking-widest mb-4 opacity-50 ${THEMES[theme].text}`}>Account</h3>
             <div className={`p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 flex items-center space-x-4 border border-black/5`}>
                <img src={currentUser?.avatarUrl} className="w-12 h-12 rounded-full border-2 border-white bg-white" alt="Avatar" />
                <div className="flex-1">
                   <p className={`text-sm font-black ${THEMES[theme].text}`}>{currentUser?.name}</p>
                   <p className="text-[10px] opacity-50 font-bold uppercase truncate">{currentUser?.id}</p>
                </div>
             </div>
          </section>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-cheza-blue text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
