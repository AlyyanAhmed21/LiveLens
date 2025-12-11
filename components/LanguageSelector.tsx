import React from 'react';
import { SUPPORTED_LANGUAGES } from '../constants';
import { Language } from '../types';
import { X, Check } from 'lucide-react';

interface LanguageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLanguage: string;
  onSelect: (langCode: string) => void;
  title?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ isOpen, onClose, selectedLanguage, onSelect, title = "Select Language" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-md sm:rounded-2xl rounded-t-2xl max-h-[80vh] flex flex-col border border-slate-700 shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-2 scrollbar-hide">
          <div className="grid gap-1">
            {SUPPORTED_LANGUAGES.map((lang: Language) => (
              <button
                key={lang.code}
                onClick={() => {
                  onSelect(lang.code);
                  onClose();
                }}
                className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                  selectedLanguage === lang.name 
                    ? 'bg-blue-600/20 border border-blue-500/50' 
                    : 'hover:bg-slate-800 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <span className={`text-base ${selectedLanguage === lang.name ? 'text-blue-400 font-medium' : 'text-slate-300'}`}>
                    {lang.name}
                  </span>
                </div>
                {selectedLanguage === lang.name && <Check size={18} className="text-blue-400" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;