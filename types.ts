export interface DetectedText {
  original: string;
  language: string;
  translation: string;
  context: string;
  culturalNotes?: string;
  pronunciation?: string;
}

export interface StructuredItem {
  label: string; // e.g. "Beef Curry"
  value: string; // e.g. "980 Yen"
  description?: string; // e.g. "Spicy beef with rice"
  original?: string; // e.g. "ビーフカレー"
}

export interface StructuredSection {
  title: string; // e.g. "Meals" or "Drinks"
  items: StructuredItem[];
}

export interface StructuredOutput {
  type: 'MENU' | 'TABLE' | 'STANDARD';
  title?: string;
  sections: StructuredSection[];
}

export interface CameraAnalysisResult {
  detectedTexts: DetectedText[];
  sceneContext: {
    english: string;
    translated: string;
  };
  suggestions: string[];
  searchQueries: string[];
  structuredOutput?: StructuredOutput;
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
  structuredOutput?: StructuredOutput;
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