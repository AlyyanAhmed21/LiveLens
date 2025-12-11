import React, { useState, useEffect, useRef } from 'react';
import { Mic, RefreshCcw } from 'lucide-react';
import { translateText } from '../services/geminiService';
import LanguageSelector from './LanguageSelector';
import { SUPPORTED_LANGUAGES } from '../constants';

interface Message {
  id: number;
  speaker: 'A' | 'B';
  original: string;
  translation: string;
  lang: string;
}

const ConversationView: React.FC = () => {
  const [langA, setLangA] = useState(SUPPORTED_LANGUAGES[0]); // Default English
  const [langB, setLangB] = useState(SUPPORTED_LANGUAGES[1]); // Default Spanish
  const [isListeningA, setIsListeningA] = useState(false);
  const [isListeningB, setIsListeningB] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showSelectorA, setShowSelectorA] = useState(false);
  const [showSelectorB, setShowSelectorB] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSpeech = (speaker: 'A' | 'B') => {
    const isListening = speaker === 'A' ? isListeningA : isListeningB;
    const setListening = speaker === 'A' ? setIsListeningA : setIsListeningB;
    const lang = speaker === 'A' ? langA : langB;
    const targetLang = speaker === 'A' ? langB : langA;

    if (isListening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang.code; 
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setListening(false);
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      
      // Temporary message while processing
      const tempId = Date.now();
      setMessages(prev => [...prev, {
        id: tempId,
        speaker,
        original: transcript,
        translation: "Translating...",
        lang: lang.name
      }]);

      // Call API
      const historyText = messages.slice(-5).map(m => `${m.speaker === 'A' ? langA.name : langB.name}: ${m.original}`).join('\n');
      const translation = await translateText(transcript, lang.name, targetLang.name, historyText);

      // Update message
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...m, translation } : m
      ));

      // Speak translation
      const utterance = new SpeechSynthesisUtterance(translation);
      utterance.lang = targetLang.code;
      window.speechSynthesis.speak(utterance);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="h-full w-full bg-slate-950 flex flex-col relative pb-24">
       {/* Header */}
       <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center z-10">
          <button 
            onClick={() => setShowSelectorA(true)}
            className="flex flex-col items-center p-2 rounded-xl hover:bg-slate-800 transition-colors w-1/3"
          >
             <span className="text-2xl mb-1">{langA.flag}</span>
             <span className="text-sm font-bold text-white">{langA.name}</span>
          </button>

          <RefreshCcw size={20} className="text-slate-600" />

          <button 
            onClick={() => setShowSelectorB(true)}
            className="flex flex-col items-center p-2 rounded-xl hover:bg-slate-800 transition-colors w-1/3"
          >
             <span className="text-2xl mb-1">{langB.flag}</span>
             <span className="text-sm font-bold text-white">{langB.name}</span>
          </button>
       </div>

       {/* Conversation Area */}
       <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                 <div className="w-16 h-16 rounded-full border-2 border-slate-700 flex items-center justify-center mb-4">
                     <Mic size={32} />
                 </div>
                 <p>Tap a mic to start chatting</p>
             </div>
          )}
          
          {messages.map((msg) => (
             <div 
               key={msg.id} 
               className={`flex flex-col ${msg.speaker === 'A' ? 'items-start' : 'items-end'}`}
             >
                <div 
                  className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                    msg.speaker === 'A' 
                      ? 'bg-blue-900/30 border border-blue-500/30 rounded-tl-none' 
                      : 'bg-emerald-900/30 border border-emerald-500/30 rounded-tr-none'
                  }`}
                >
                   <p className="text-white text-lg mb-1">{msg.translation}</p>
                   <p className="text-slate-400 text-sm italic border-t border-white/5 pt-1 mt-1">{msg.original}</p>
                </div>
             </div>
          ))}
          <div ref={messagesEndRef} />
       </div>

       {/* Controls */}
       <div className="absolute bottom-24 left-0 right-0 px-6 flex justify-between gap-4">
          <button
            onMouseDown={() => handleSpeech('A')}
            onMouseUp={() => { if(isListeningA) recognitionRef.current?.stop(); setIsListeningA(false); }}
            onTouchStart={() => handleSpeech('A')}
            onTouchEnd={() => { if(isListeningA) recognitionRef.current?.stop(); setIsListeningA(false); }}
            className={`flex-1 py-8 rounded-3xl flex flex-col items-center justify-center transition-all ${
                isListeningA 
                ? 'bg-blue-500 scale-95 ring-4 ring-blue-500/30' 
                : 'bg-blue-900/50 hover:bg-blue-900/70 border border-blue-500/30'
            }`}
          >
             <Mic size={32} className={isListeningA ? 'text-white animate-pulse' : 'text-blue-400'} />
             <span className={`text-sm mt-2 font-medium ${isListeningA ? 'text-white' : 'text-blue-200'}`}>
                 {isListeningA ? 'Listening...' : `Speak ${langA.name}`}
             </span>
          </button>

          <button
            onMouseDown={() => handleSpeech('B')}
            onMouseUp={() => { if(isListeningB) recognitionRef.current?.stop(); setIsListeningB(false); }}
            onTouchStart={() => handleSpeech('B')}
            onTouchEnd={() => { if(isListeningB) recognitionRef.current?.stop(); setIsListeningB(false); }}
            className={`flex-1 py-8 rounded-3xl flex flex-col items-center justify-center transition-all ${
                isListeningB 
                ? 'bg-emerald-500 scale-95 ring-4 ring-emerald-500/30' 
                : 'bg-emerald-900/50 hover:bg-emerald-900/70 border border-emerald-500/30'
            }`}
          >
             <Mic size={32} className={isListeningB ? 'text-white animate-pulse' : 'text-emerald-400'} />
             <span className={`text-sm mt-2 font-medium ${isListeningB ? 'text-white' : 'text-emerald-200'}`}>
                 {isListeningB ? 'Listening...' : `Speak ${langB.name}`}
             </span>
          </button>
       </div>

        <LanguageSelector 
            isOpen={showSelectorA} 
            onClose={() => setShowSelectorA(false)} 
            selectedLanguage={langA.name}
            onSelect={(code) => {
               const found = SUPPORTED_LANGUAGES.find((l) => l.code === code);
               if(found) setLangA(found);
            }}
            title={`Select ${langA.name} Speaker Language`}
        />

        <LanguageSelector 
            isOpen={showSelectorB} 
            onClose={() => setShowSelectorB(false)} 
            selectedLanguage={langB.name}
            onSelect={(code) => {
               const found = SUPPORTED_LANGUAGES.find((l) => l.code === code);
               if(found) setLangB(found);
            }}
            title={`Select ${langB.name} Speaker Language`}
        />
    </div>
  );
};

export default ConversationView;