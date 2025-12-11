import { Language } from './types';

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'ur-PK', name: 'Urdu', flag: '🇵🇰' },
  { code: 'ar-SA', name: 'Arabic', flag: '🇸🇦' },
  { code: 'zh-CN', name: 'Chinese', flag: '🇨🇳' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
  { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
  { code: 'pt-PT', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru-RU', name: 'Russian', flag: '🇷🇺' },
  { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
];

export const PROMPTS = {
  CAMERA_ANALYSIS: `
  Analyze this image. 
  1. Determine the visual structure: Is it a Menu, a Price List, a Schedule, or General Text?
  2. If it is a Menu or List, extract the data structurally.
  3. Identify all visible text, detect source language, and translate.
  4. Provide context and cultural notes.
  
  Format response as valid JSON ONLY:
  {
    "detectedTexts": [{
      "original": "string",
      "language": "string",
      "translation": "string",
      "context": "string",
      "culturalNotes": "string",
      "pronunciation": "string"
    }],
    "sceneContext": {
       "english": "string",
       "translated": "string"
    },
    "suggestions": ["string"],
    "searchQueries": ["string"],
    "structuredOutput": {
       "type": "MENU" | "TABLE" | "STANDARD",
       "title": "string (e.g. Restaurant Name or Main Title)",
       "sections": [
          {
             "title": "string (e.g. Appetizers, Drinks)",
             "items": [
                {
                   "label": "string (Translated Name)",
                   "value": "string (Price or Value)",
                   "description": "string (Brief description or original text if needed)",
                   "original": "string (Original source text)"
                }
             ]
          }
       ]
    }
  }
  `,
  DOCUMENT_ANALYSIS: `
  This is a document image.
  Analyze its structure and content.
  
  Format as valid JSON ONLY:
  {
    "detectedLanguage": "string",
    "documentType": "string",
    "summary": "string",
    "fullTranslation": "string",
    "keySections": [{
      "title": "string",
      "content": "string",
      "explanation": "string"
    }],
    "warnings": ["string"],
    "actionItems": ["string"],
    "structuredOutput": {
       "type": "MENU" | "TABLE" | "STANDARD",
       "title": "string",
       "sections": [
          {
             "title": "string",
             "items": [
                {
                   "label": "string",
                   "value": "string",
                   "description": "string",
                   "original": "string"
                }
             ]
          }
       ]
    }
  }
  `,
  CONVERSATION_TRANSLATION: (sourceLang: string, targetLang: string, history: string, newInput: string) => `
  Act as a real-time translator between ${sourceLang} and ${targetLang}.
  
  Conversation History:
  ${history}
  
  New Input (${sourceLang}): "${newInput}"
  
  Task: Translate the new input to ${targetLang}.
  Maintain conversational flow, tone, and cultural nuance.
  Return ONLY the translation text.
  `
};

export const COLORS = {
  primary: '#1E40AF',
  accent: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  darkBg: '#0F172A',
};