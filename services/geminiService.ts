import { GoogleGenAI, Type } from "@google/genai";
import { PROMPTS, SUPPORTED_LANGUAGES } from '../constants';
import { CameraAnalysisResult, DocumentAnalysisResult } from '../types';

// Helper to get API key safely
const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    console.error("API Key not found in environment variables");
    throw new Error("API Key missing");
  }
  return key;
};

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Shared Schema Definition for Structured Output
const structuredOutputSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ["MENU", "TABLE", "STANDARD"] },
        title: { type: Type.STRING },
        sections: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    items: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                label: { type: Type.STRING },
                                value: { type: Type.STRING },
                                description: { type: Type.STRING },
                                original: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        }
    }
};

/**
 * Analyzes an image from the camera (Snapshot)
 */
export const analyzeCameraImage = async (
  base64Image: string, 
  targetLanguage: string = 'English'
): Promise<CameraAnalysisResult> => {
  try {
    const modelId = 'gemini-2.5-flash'; 

    // Clean base64 string if it contains data URI prefix
    const data = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `${PROMPTS.CAMERA_ANALYSIS} \n Target Language: ${targetLanguage}`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data } },
          { text: prompt }
        ]
      },
      config: {
        // Enable thinking to allow the model to reason about visual structure (Menu vs Text)
        thinkingConfig: { thinkingBudget: 2048 },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedTexts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  language: { type: Type.STRING },
                  translation: { type: Type.STRING },
                  context: { type: Type.STRING },
                  culturalNotes: { type: Type.STRING },
                  pronunciation: { type: Type.STRING }
                }
              }
            },
            sceneContext: { 
                type: Type.OBJECT,
                properties: {
                    english: { type: Type.STRING },
                    translated: { type: Type.STRING }
                }
            },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            searchQueries: { type: Type.ARRAY, items: { type: Type.STRING } },
            structuredOutput: structuredOutputSchema
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from Gemini");
    
    return JSON.parse(resultText) as CameraAnalysisResult;

  } catch (error) {
    console.error("Error analyzing camera image:", error);
    throw error;
  }
};

/**
 * Analyzes a full document
 */
export const analyzeDocument = async (
  base64Image: string,
  targetLanguage: string = 'English'
): Promise<DocumentAnalysisResult> => {
  try {
    const modelId = 'gemini-2.5-flash'; 

    const data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const prompt = `${PROMPTS.DOCUMENT_ANALYSIS} \n Target Language: ${targetLanguage}`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data } },
          { text: prompt }
        ]
      },
      config: {
        thinkingConfig: { thinkingBudget: 2048 },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLanguage: { type: Type.STRING },
            documentType: { type: Type.STRING },
            summary: { type: Type.STRING },
            fullTranslation: { type: Type.STRING },
            keySections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                }
              }
            },
            warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
            structuredOutput: structuredOutputSchema
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from Gemini");

    return JSON.parse(resultText) as DocumentAnalysisResult;
  } catch (error) {
    console.error("Error analyzing document:", error);
    throw error;
  }
};

/**
 * Translates conversation text
 */
export const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string,
  history: string
): Promise<string> => {
  try {
    const modelId = 'gemini-2.5-flash';
    const prompt = PROMPTS.CONVERSATION_TRANSLATION(sourceLang, targetLang, history, text);

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: [{ text: prompt }] }
    });

    return response.text || "";
  } catch (error) {
    console.error("Error translating text:", error);
    return "Translation failed.";
  }
};

/**
 * Handles voice queries about the scene
 */
export const askVoiceQuestion = async (
  question: string,
  contextData: CameraAnalysisResult | null,
  base64Image?: string
): Promise<string> => {
    try {
        const modelId = 'gemini-2.5-flash';
        
        let contents: any[] = [];
        
        if (base64Image) {
            const data = base64Image.replace(/^data:image\/\w+;base64,/, "");
            contents.push({ inlineData: { mimeType: 'image/jpeg', data } });
        }

        let prompt = `User Question: "${question}"\n\n`;

        if (contextData) {
            prompt += `Context (Previously analyzed data): ${JSON.stringify(contextData)}\n\n`;
        }
        
        prompt += `Provide a natural, helpful, and conversational response (max 2 sentences) based on the image/context provided.`;

        contents.push({ text: prompt });
        
        const response = await ai.models.generateContent({
            model: modelId,
            contents: { parts: contents }
        });
        
        return response.text || "I'm not sure how to answer that.";
    } catch (error) {
        console.error("Error processing voice question", error);
        return "Sorry, I couldn't process that question.";
    }
};

// --- AUDIO UTILITIES FOR GEMINI TTS ---

let audioCtx: AudioContext | null = null;

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function createAudioBuffer(ctx: AudioContext, data: Uint8Array, sampleRate: number = 24000): AudioBuffer {
    const pcmData = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, pcmData.length, sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < pcmData.length; i++) {
        channelData[i] = pcmData[i] / 32768.0;
    }
    return buffer;
}

/**
 * Cloud TTS Fallback
 */
export const speakViaGemini = async (text: string) => {
    try {
        console.log("Generating speech via Gemini for:", text);
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash-preview-tts',
             contents: { parts: [{ text }] },
             config: {
                 responseModalities: ['AUDIO'],
                 speechConfig: {
                     voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } 
                 }
             }
        });

        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!audioData) {
            console.warn("No audio data returned from Gemini TTS");
            return;
        }

        if (!audioCtx) {
            audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

        const uint8 = base64ToUint8Array(audioData);
        const buffer = createAudioBuffer(audioCtx, uint8, 24000);
        
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start();
        
    } catch (e) {
        console.error("Gemini TTS failed", e);
    }
};

/**
 * Robust Smart TTS (Local -> Cloud Fallback)
 */
export const playSmartTTS = (text: string, languageName: string, forceLangCode?: string) => {
    window.speechSynthesis.cancel();
    
    const langObj = SUPPORTED_LANGUAGES.find(l => l.name === languageName);
    let codeToUse = forceLangCode || (langObj ? langObj.code : 'en-US');
    
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => v.lang === codeToUse);

    if (!selectedVoice) {
        const shortCode = codeToUse.split('-')[0];
        selectedVoice = voices.find(v => v.lang === shortCode || v.lang.startsWith(shortCode));
        if (selectedVoice) {
            codeToUse = selectedVoice.lang;
        } else if (langObj) {
            selectedVoice = voices.find(v => v.name.toLowerCase().includes(langObj.name.toLowerCase()));
            if (selectedVoice) codeToUse = selectedVoice.lang;
        }
    }

    if (selectedVoice) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = codeToUse;
        utterance.voice = selectedVoice;
        console.log("Speaking with local voice:", selectedVoice.name);
        window.speechSynthesis.speak(utterance);
    } else {
        console.log(`No local voice found for ${codeToUse}. Using Gemini Cloud TTS.`);
        speakViaGemini(text);
    }
};