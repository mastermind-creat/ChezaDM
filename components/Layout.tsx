
import React from 'react';
import { useApp } from '../context/AppContext';
import { THEMES } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme } = useApp();
  const t = THEMES[theme];

  return (
    <div className={`flex flex-col h-full w-full max-w-md mx-auto shadow-2xl relative overflow-hidden transition-colors duration-500 ${t.bg}`}>
      {/* Dynamic Status Bar Color */}
      <div className={`h-safe-top w-full ${theme === 'kenya' ? 'bg-[#E1302A]' : theme === 'midnight' ? 'bg-[#0F172A]' : 'bg-transparent'}`}></div>
      
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {children}
      </main>
      
      <div className="h-safe-bottom w-full"></div>
    </div>
  );
};
