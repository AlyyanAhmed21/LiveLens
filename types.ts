export interface DetectedText {
  original: string;
  language: string;
  translation: string;
  context: string;
  culturalNotes?: string;
  pronunciation?: string;
}

export interface CameraAnalysisResult {
  detectedTexts: DetectedText[];
  sceneContext: {
    english: string;
    translated: string;
  };
  suggestions: string[];
  searchQueries: string[];
}

export interface DocumentAnalysisResult {
  detectedLanguage: string;
  documentType: string;
  summary: string;
  fullTranslation: string;
  keySections: {
    title: string;
    content: string;
    explanation: string;
  }[];
  warnings: string[];
  actionItems: string[];
}

export interface ChatMessage {
  id: string;
  speaker: 'user' | 'other' | 'system';
  original: string;
  translation: string;
  language: string;
  timestamp: number;
}

export type AppMode = 'camera' | 'conversation' | 'document';

export interface Language {
  code: string;
  name: string;
  flag: string;
}