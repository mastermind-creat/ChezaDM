import React from 'react';
import { useApp } from '../context/AppContext';
import { BOTS } from '../constants';
import { BotType } from '../types';

interface BotControlProps {
  onClose: () => void;
}

export const BotControl: React.FC<BotControlProps> = ({ onClose }) => {
  const { currentRoom, addBotToRoom, removeBotFromRoom } = useApp();

  if (!currentRoom) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center animate-fade-in">
      <div className="bg-white dark:bg-gray-800 w-full sm:w-96 rounded-t-2xl sm:rounded-2xl p-6 shadow-xl max-h-[80%] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manage AI Assistants</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Admins can invite bots to help with translation, moderation, or fun.
        </p>

        <div className="space-y-3">
          {(Object.keys(BOTS) as BotType[]).map((botKey) => {
            const bot = BOTS[botKey];
            const isActive = currentRoom.activeBots.includes(botKey);
            
            return (
              <div key={botKey} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl bg-white dark:bg-gray-600 p-2 rounded-full shadow-sm">{bot.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{bot.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-300 line-clamp-1">{bot.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => isActive ? removeBotFromRoom(botKey) : addBotToRoom(botKey)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                      : 'bg-kenya-green text-white shadow-md hover:bg-green-700'
                  }`}
                >
                  {isActive ? 'Remove' : 'Add'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};