import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, ArrowRight, Download, Volume2, Globe, Languages, Utensils } from 'lucide-react';
import { analyzeDocument, playSmartTTS } from '../services/geminiService';
import { DocumentAnalysisResult, StructuredOutput } from '../types';
import LanguageSelector from './LanguageSelector';
import { SUPPORTED_LANGUAGES } from '../constants';

const DocumentView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<DocumentAnalysisResult | null>(null);
  const [targetLang, setTargetLang] = useState('English');
  const [showLangSelector, setShowLangSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!preview) return;
    setIsProcessing(true);
    try {
      const analysis = await analyzeDocument(preview, targetLang);
      setResult(analysis);
    } catch (error) {
      alert("Failed to analyze document.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTranslation = () => {
      if (!result) return;
      const element = document.createElement("a");
      const file = new Blob([result.fullTranslation], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = "translated_document.txt";
      document.body.appendChild(element);
      element.click();
  };

  // --- RENDERERS ---

  const renderStructuredMenu = (data: StructuredOutput) => {
    return (
        <div className="space-y-6 mt-6">
            <div className="flex items-center gap-2 mb-4 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div className="bg-amber-500/20 p-2 rounded-lg">
                  <Utensils className="text-amber-400" size={20} />
                </div>
                <div>
                   <h2 className="text-lg font-bold text-white tracking-tight">{data.title || "Menu Translation"}</h2>
                   <p className="text-xs text-slate-400">Structured View</p>
                </div>
            </div>
            
            {data.sections.map((section, idx) => (
                <div key={idx} className="bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
                    <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/50">
                        <h3 className="text-amber-300 font-bold uppercase text-sm tracking-wider">{section.title}</h3>
                    </div>
                    <div className="divide-y divide-slate-800">
                        {section.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="p-4 hover:bg-slate-800/80 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex-1 mr-4">
                                      <p className="text-white font-semibold text-base">{item.label}</p>
                                      {item.original && (
                                          <p className="text-slate-500 text-xs italic mb-1">{item.original}</p>
                                      )}
                                      {item.description && (
                                          <p className="text-slate-400 text-sm leading-snug">{item.description}</p>
                                      )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="block bg-slate-950 px-2 py-1 rounded text-cyan-400 font-mono font-bold text-sm border border-slate-800">
                                            {item.value}
                                        </span>
                                        <button 
                                          onClick={() => playSmartTTS(item.label, targetLang)}
                                          className="mt-2 text-slate-500 hover:text-white inline-block"
                                        >
                                            <Volume2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
  };

  return (
    <div className="h-full w-full bg-slate-950 flex flex-col p-6 overflow-y-auto pb-32">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Document Analysis</h1>
        <button 
          onClick={() => setShowLangSelector(true)}
          className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-full flex items-center gap-2 text-sm font-medium text-blue-300 hover:bg-slate-700 transition-all shadow-md"
        >
           <Globe size={16} />
           <span>Translate to: {targetLang}</span>
        </button>
      </div>

      {/* Upload Area */}
      {!result && (
        <div className="bg-slate-900 border-2 border-dashed border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center mb-6">
          {preview ? (
             <div className="w-full relative">
                <img src={preview} alt="Preview" className="w-full h-64 object-contain rounded-lg mb-4 opacity-80" />
                <button 
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 bg-black/50 text-white px-3 py-1 rounded-full text-xs"
                >
                  Clear
                </button>
             </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer w-full flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                <Upload className="text-blue-500" size={32} />
              </div>
              <h3 className="text-white font-medium mb-1">Upload Document</h3>
              <p className="text-slate-400 text-sm">Photos, PDFs, or Scans</p>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      )}

      {/* Action Button */}
      {preview && !result && (
        <button
          onClick={handleAnalyze}
          disabled={isProcessing}
          className={`w-full py-4 rounded-xl font-bold text-lg mb-6 flex items-center justify-center gap-2 transition-all ${
            isProcessing 
              ? 'bg-slate-800 text-slate-400 cursor-wait' 
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
          }`}
        >
          {isProcessing ? (
             <>
               <span className="animate-spin mr-2">⏳</span> Analyzing...
             </>
          ) : (
             <>
               <FileText size={20} /> Analyze Document
             </>
          )}
        </button>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
          
          {/* Detected Language Banner */}
          <div className="flex items-center justify-between gap-4 text-sm bg-slate-900/80 p-4 rounded-xl border border-slate-800 shadow-md">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-lg">
                    <Languages size={20} />
                </div>
                <div>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Detected Language</p>
                    <p className="text-white font-medium text-lg">{result.detectedLanguage}</p>
                </div>
              </div>
              
              <ArrowRight className="text-slate-600" />
              
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Translated To</p>
                <p className="text-blue-400 font-medium text-lg">{targetLang}</p>
              </div>
          </div>

          {/* Structured Menu View (If available) */}
          {result.structuredOutput && (result.structuredOutput.type === 'MENU' || result.structuredOutput.type === 'TABLE') && (
               renderStructuredMenu(result.structuredOutput)
          )}

          {/* Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                 <FileText size={100} />
             </div>
             
             <div className="flex justify-between items-start mb-4 relative z-10">
                 <div className="flex items-center gap-2">
                     <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-purple-500/20">
                         {result.documentType}
                     </span>
                 </div>
                 <div className="flex gap-2 bg-slate-800/50 p-1 rounded-lg">
                    <button 
                        onClick={() => playSmartTTS(result.fullTranslation || result.summary, targetLang)} 
                        className="text-slate-300 hover:text-white p-2 hover:bg-slate-700 rounded-md transition-colors"
                        title="Listen to translation"
                    >
                        <Volume2 size={20} />
                    </button>
                    <button onClick={downloadTranslation} className="text-slate-300 hover:text-white p-2 hover:bg-slate-700 rounded-md transition-colors" title="Download Text">
                        <Download size={20} />
                    </button>
                 </div>
             </div>
             <p className="text-slate-300 leading-relaxed text-sm relative z-10">
                 {result.summary}
             </p>
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-5">
                  <h3 className="text-amber-400 font-bold flex items-center gap-2 mb-3">
                      <AlertTriangle size={18} /> Important Warnings
                  </h3>
                  <ul className="space-y-2">
                      {result.warnings.map((w, i) => (
                          <li key={i} className="text-amber-100/80 text-sm pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-amber-500">
                              {w}
                          </li>
                      ))}
                  </ul>
              </div>
          )}

          {/* Key Sections (Hidden if Structured Output is shown to avoid duplication, or keep for extra details?) - keeping for now as they serve different purpose */}
          {(!result.structuredOutput || result.structuredOutput.type === 'STANDARD') && (
            <div className="space-y-4">
                <h3 className="text-white font-bold text-lg">Key Sections</h3>
                {result.keySections.map((section, idx) => (
                    <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 transition-colors hover:bg-slate-900/80">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-blue-400 font-semibold text-sm">{section.title}</h4>
                            <button onClick={() => playSmartTTS(section.content, targetLang)} className="text-slate-500 hover:text-blue-400">
                                <Volume2 size={16} />
                            </button>
                        </div>
                        <p className="text-white text-sm mb-3 font-medium">{section.content}</p>
                        <div className="bg-slate-800 p-3 rounded-lg border border-slate-700/50">
                            <p className="text-xs text-slate-400">💡 {section.explanation}</p>
                        </div>
                    </div>
                ))}
            </div>
          )}

          {/* Action Items */}
          {result.actionItems.length > 0 && (
              <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-2xl p-5">
                  <h3 className="text-emerald-400 font-bold flex items-center gap-2 mb-3">
                      <CheckCircle size={18} /> Recommended Actions
                  </h3>
                  <ul className="space-y-2">
                      {result.actionItems.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-emerald-100/80">
                              <ArrowRight size={14} className="mt-1 shrink-0 text-emerald-500" />
                              {item}
                          </li>
                      ))}
                  </ul>
              </div>
          )}
          
          <button 
            onClick={() => { setFile(null); setPreview(null); setResult(null); }}
            className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors shadow-lg"
          >
              Analyze Another Document
          </button>
        </div>
      )}

      <LanguageSelector 
        isOpen={showLangSelector} 
        onClose={() => setShowLangSelector(false)}
        selectedLanguage={targetLang}
        onSelect={(code) => {
            const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
            setTargetLang(lang ? lang.name : 'English');
        }}
        title="Translate Document To"
      />
    </div>
  );
};

export default DocumentView;