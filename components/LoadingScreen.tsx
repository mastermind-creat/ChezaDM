
import React from 'react';

interface LoadingScreenProps {
  message: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-cheza-blue flex flex-col items-center justify-center p-8 text-white overflow-hidden">
      {/* Animating Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cheza-green opacity-20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cheza-yellow opacity-20 rounded-full blur-3xl animate-pulse delay-700"></div>

      <div className="relative flex flex-col items-center max-w-xs text-center">
        {/* Animated Icon */}
        <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 shadow-2xl animate-bounce-short">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-white animate-pulse">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        </div>

        <h2 className="text-2xl font-black mb-2 tracking-tight">{message}</h2>
        <p className="text-blue-100 text-sm opacity-80 font-medium">Securing P2P handshake...</p>
        
        {/* Progress Dots */}
        <div className="flex space-x-2 mt-8">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-150"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-300"></div>
        </div>
      </div>

      <div className="absolute bottom-10 text-[10px] uppercase tracking-[0.2em] font-black opacity-40">
        ChezaDM Signal Layer
      </div>
    </div>
  );
};
