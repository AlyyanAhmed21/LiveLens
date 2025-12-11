import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RefreshCw, Zap, Volume2, Mic, Info, X, Languages, Search, ExternalLink } from 'lucide-react';
import { analyzeCameraImage, askVoiceQuestion, playSmartTTS } from '../services/geminiService';
import { CameraAnalysisResult } from '../types';
import LanguageSelector from './LanguageSelector';
import { SUPPORTED_LANGUAGES } from '../constants';

const CameraView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CameraAnalysisResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState('English');
  const [showLangSelector, setShowLangSelector] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Voice response state
  const [voiceResponse, setVoiceResponse] = useState<{question: string, answer: string} | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  // Context Language State
  const [showEnglishContext, setShowEnglishContext] = useState(false);

  // Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      const setupStream = (mediaStream: MediaStream) => {
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        const track = mediaStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any; 
        const settings = track.getSettings();

        console.log(`Camera Active: ${settings.width}x${settings.height}`);

        if (capabilities?.focusMode?.includes('continuous')) {
          track.applyConstraints({
            advanced: [{ focusMode: 'continuous' }] as any
          }).catch(err => console.log("Focus mode not supported", err));
        }
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { min: 1920, ideal: 3840 },
            height: { min: 1080, ideal: 2160 }
          }
        });
        setupStream(stream);
      } catch (highResErr) {
        console.warn("High-res camera init failed, falling back to default.", highResErr);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          setupStream(stream);
        } catch (fallbackErr) {
          console.error("Camera access failed completely:", fallbackErr);
          alert("Could not access camera. Please check permissions.");
        }
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (analysisResult) {
        setShowEnglishContext(targetLang === 'English');
    }
  }, [analysisResult, targetLang]);

  const getSnapshot = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const captureAndAnalyze = useCallback(async () => {
    setIsProcessing(true);
    setAnalysisResult(null);
    setVoiceResponse(null);

    const imageBase64 = getSnapshot();
    if (!imageBase64) {
        setIsProcessing(false);
        return;
    }
    
    setCapturedImage(imageBase64);

    try {
      const result = await analyzeCameraImage(imageBase64, targetLang);
      setAnalysisResult(result);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [targetLang]);

  const resetCamera = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setVoiceResponse(null);
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice input not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    const langObj = SUPPORTED_LANGUAGES.find(l => l.name === targetLang);
    recognition.lang = langObj ? langObj.code : 'en-US';

    recognition.onstart = () => {
        setIsListening(true);
        if (voiceResponse) setVoiceResponse(null);
    };
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
         handleQuestion(transcript);
      }
    };

    recognition.start();
  };

  const handleQuestion = async (questionText: string) => {
     setIsThinking(true);
     setVoiceResponse({ question: questionText, answer: "Thinking..." });
     
     let contextData = analysisResult;
     let imageForContext = undefined;

     if (!contextData) {
         const snap = getSnapshot();
         if (snap) imageForContext = snap;
     }

     const answer = await askVoiceQuestion(questionText, contextData, imageForContext);
     setVoiceResponse({ question: questionText, answer });
     setIsThinking(false);
     playSmartTTS(answer, targetLang);
  };

  return (
    <div className="relative h-full w-full bg-black overflow-hidden flex flex-col">
      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${capturedImage ? 'opacity-0' : 'opacity-100'}`}
      />
      
      {/* Captured Image Overlay */}
      {capturedImage && (
        <img src={capturedImage} alt="Captured" className="absolute inset-0 w-full h-full object-cover" />
      )}

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Bar - Higher Z-Index to stay above panel */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-safe flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent z-50 pointer-events-none">
        <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-md pointer-events-auto">LiveLens</h1>
        
        <div className="flex gap-2 pointer-events-auto">
            {capturedImage && (
                <button 
                    onClick={resetCamera}
                    className="bg-red-500/90 backdrop-blur-md border border-white/20 p-2.5 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-all shadow-lg ring-1 ring-white/20"
                    title="Reset Camera"
                >
                    <RefreshCw size={18} />
                </button>
            )}

            <button 
            onClick={() => setShowLangSelector(true)}
            className="bg-black/40 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium text-white hover:bg-black/60 transition-all shadow-lg"
            >
                <span>🇺🇸 ➔ {targetLang}</span>
            </button>
        </div>
      </div>

      {/* Voice Response Overlay */}
      {voiceResponse && (
          <div className="absolute top-20 left-4 right-4 z-40 animate-in slide-in-from-top duration-300">
              <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl relative">
                  <button 
                    onClick={() => setVoiceResponse(null)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-white"
                  >
                      <X size={16} />
                  </button>
                  <p className="text-sm text-slate-400 mb-1">You: "{voiceResponse.question}"</p>
                  <div className="flex items-start gap-2">
                      {isThinking ? (
                          <div className="mt-1 w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                      ) : (
                          <div className="mt-1 w-2 h-2 rounded-full bg-green-400" />
                      )}
                      <p className="text-white font-medium text-lg leading-snug">{voiceResponse.answer}</p>
                  </div>
              </div>
          </div>
      )}

      {/* Loading State */}
      {isProcessing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-30">
          <div className="relative">
             <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
             <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400 animate-pulse" size={24} />
          </div>
          <p className="mt-4 text-blue-100 font-medium animate-pulse">Analyzing Scene...</p>
        </div>
      )}

      {/* Results Panel Slide-up */}
      {analysisResult && !voiceResponse && (
         <div className="absolute bottom-20 left-0 right-0 max-h-[75vh] overflow-y-auto scrollbar-hide glass-panel rounded-t-3xl p-6 pb-20 z-20 animate-in slide-in-from-bottom duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 sticky top-0" />
            
            {/* Scene Context */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Scene Context</h3>
                    
                    {/* Context Controls */}
                    <div className="flex gap-2">
                         <button 
                            onClick={() => {
                                const text = showEnglishContext ? analysisResult.sceneContext.english : analysisResult.sceneContext.translated;
                                const langCode = showEnglishContext ? 'en-US' : undefined; 
                                playSmartTTS(text, targetLang, langCode);
                            }}
                            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10"
                            title="Speak Context"
                         >
                            <Volume2 size={16} />
                         </button>
                         {targetLang !== 'English' && (
                             <button 
                                onClick={() => setShowEnglishContext(!showEnglishContext)}
                                className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-md text-xs font-medium text-white hover:bg-white/20 transition-colors"
                             >
                                <Languages size={14} />
                                {showEnglishContext ? `Show ${targetLang}` : 'Show English'}
                             </button>
                         )}
                    </div>
                </div>
                
                <p className="text-white text-lg leading-relaxed animate-in fade-in">
                    {showEnglishContext ? analysisResult.sceneContext.english : analysisResult.sceneContext.translated}
                </p>
            </div>

            {/* Detected Text */}
            <div className="space-y-4 mb-6">
               {analysisResult.detectedTexts.map((text, idx) => (
                   <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4">
                       <div className="flex justify-between items-start mb-2">
                           <span className="text-xs font-medium text-slate-400 uppercase">{text.language}</span>
                           <button onClick={() => playSmartTTS(text.translation, targetLang)} className="text-cyan-400 hover:text-cyan-300">
                               <Volume2 size={18} />
                           </button>
                       </div>
                       <p className="text-2xl font-bold text-white mb-1">{text.translation}</p>
                       <p className="text-sm text-slate-400 italic mb-3">"{text.original}"</p>
                       {text.culturalNotes && (
                           <div className="flex items-start gap-2 bg-blue-900/20 p-3 rounded-lg border border-blue-500/20">
                               <Info size={16} className="text-blue-400 mt-0.5 shrink-0" />
                               <p className="text-sm text-blue-100">{text.culturalNotes}</p>
                           </div>
                       )}
                   </div>
               ))}
            </div>

            {/* Suggestions & Search */}
            <div className="space-y-4">
                
                {/* Google Search Queries - Using Anchor Tags for Reliable Linking */}
                {analysisResult.searchQueries && analysisResult.searchQueries.length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Search size={12} /> Related Searches
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {analysisResult.searchQueries.map((q, i) => (
                                <a 
                                    key={`search-${i}`} 
                                    href={`https://www.google.com/search?q=${encodeURIComponent(q)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 bg-indigo-900/40 border border-indigo-500/40 rounded-lg text-sm text-indigo-100 hover:bg-indigo-900/60 transition-colors w-full sm:w-auto justify-center"
                                >
                                    <span>{q}</span>
                                    <ExternalLink size={14} className="opacity-70" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* AI Chat Suggestions */}
                {analysisResult.suggestions.length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Zap size={12} /> Ask AI
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {analysisResult.suggestions.map((s, i) => (
                                <button 
                                    key={`sugg-${i}`} 
                                    onClick={() => handleQuestion(s)}
                                    type="button"
                                    className="px-3 py-2 bg-emerald-900/30 border border-emerald-500/30 rounded-lg text-sm text-emerald-100 hover:bg-emerald-900/50 transition-colors text-left"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
         </div>
      )}

      {/* Controls (Live Mode Only) - Removed Reset Button from here to prevent overlap */}
      {!capturedImage && (
          <div className="absolute bottom-24 left-0 right-0 flex justify-center items-center gap-8 z-20 px-6">
                <button 
                    onClick={handleVoiceInput}
                    className={`bg-slate-800/80 backdrop-blur text-white p-3 rounded-full shadow-lg transition-all ${isListening ? 'ring-2 ring-red-500 bg-red-500/20' : 'hover:bg-slate-700'}`}
                >
                    <Mic size={24} className={isListening ? "animate-pulse text-red-400" : ""} />
                </button>

                <button 
                    onClick={captureAndAnalyze}
                    className="bg-white rounded-full p-1.5 shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-transform active:scale-95"
                >
                    <div className="w-16 h-16 rounded-full border-4 border-black flex items-center justify-center">
                        <div className="w-14 h-14 bg-white rounded-full border-2 border-slate-300" />
                    </div>
                </button>

                <div className="w-12" /> {/* Spacer for symmetry */}
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
      />
    </div>
  );
};

export default CameraView;