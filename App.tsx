import React, { useState } from 'react';
import Navigation from './components/Navigation';
import CameraView from './components/CameraView';
import DocumentView from './components/DocumentView';
import ConversationView from './components/ConversationView';
import { AppMode } from './types';

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>('camera');

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        <div className={`absolute inset-0 transition-opacity duration-300 ${currentMode === 'camera' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
           <CameraView />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${currentMode === 'document' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
           {currentMode === 'document' && <DocumentView />}
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${currentMode === 'conversation' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
           {currentMode === 'conversation' && <ConversationView />}
        </div>
      </main>

      {/* Navigation */}
      <Navigation currentMode={currentMode} onModeChange={setCurrentMode} />
    </div>
  );
};

export default App;