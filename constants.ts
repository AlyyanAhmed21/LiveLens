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
  Analyze this image. Identify all visible text in any language.
  For each text element:
  - Detect source language
  - Translate to the target language (default to English if not specified)
  - Identify context (menu, sign, document, etc.)
  - Provide cultural context if relevant
  - Explain any idioms or cultural references
  
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
       "english": "string (description in English)",
       "translated": "string (description in Target Language)"
    },
    "suggestions": ["string (questions to ask the AI about the scene)"],
    "searchQueries": ["string (google search queries to find/buy the object or related info)"]
  }
  `,
  DOCUMENT_ANALYSIS: `
  This is a document image.
  Provide:
  1. Detect the source language of the document.
  2. Full translation to English (or target language)
  3. Document summary (3-4 sentences)
  4. Key sections breakdown with explanations
  5. Important warnings or action items
  6. Plain language interpretation
  
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
    "actionItems": ["string"]
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