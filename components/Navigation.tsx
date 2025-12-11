import React from 'react';
import { Camera, MessageSquare, FileText } from 'lucide-react';
import { AppMode } from '../types';

interface NavigationProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentMode, onModeChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 pb-safe pt-2 px-6 flex justify-around items-center z-50 h-20">
      <button
        onClick={() => onModeChange('conversation')}
        className={`flex flex-col items-center gap-1 p-2 transition-colors ${
          currentMode === 'conversation' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
        }`}
      >
        <MessageSquare size={24} />
        <span className="text-xs font-medium">Chat</span>
      </button>

      <button
        onClick={() => onModeChange('camera')}
        className={`flex flex-col items-center gap-1 p-2 -mt-6 transition-transform ${
          currentMode === 'camera' ? 'scale-110 text-cyan-400' : 'text-slate-400 hover:text-white'
        }`}
      >
        <div className={`p-4 rounded-full ${currentMode === 'camera' ? 'bg-cyan-500/20 ring-2 ring-cyan-500' : 'bg-slate-800'}`}>
          <Camera size={32} className={currentMode === 'camera' ? 'text-cyan-400' : 'text-white'} />
        </div>
        <span className="text-xs font-medium mt-1">Live</span>
      </button>

      <button
        onClick={() => onModeChange('document')}
        className={`flex flex-col items-center gap-1 p-2 transition-colors ${
          currentMode === 'document' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
        }`}
      >
        <FileText size={24} />
        <span className="text-xs font-medium">Doc</span>
      </button>
    </div>
  );
};

export default Navigation;