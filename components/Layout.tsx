import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto bg-white dark:bg-gray-900 shadow-2xl relative overflow-hidden">
      {/* Status Bar Area filler for mobile standalone */}
      <div className="h-safe-top w-full bg-kenya-red"></div>
      
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {children}
      </main>
      
      {/* Bottom Safe Area filler */}
      <div className="h-safe-bottom w-full bg-white dark:bg-gray-900"></div>
    </div>
  );
};