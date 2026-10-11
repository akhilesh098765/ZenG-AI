export type ModelId = 
  | 'gemini-3.8-flash'
  | 'gemini-3.1-pro-preview'
  | 'gemini-3.1-flash-lite'
  | 'gemini-3.1-flash-lite-image';

export interface ModelInfo {
  id: ModelId;
  name: string;
  provider: 'ZenG Cognitive Core' | 'Google Gemini' | 'OpenAI' | 'Anthropic' | 'DeepSeek' | string;
  description: string;
  badge: string;
  contextWindow: string;
  maxOutputTokens: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsWebSearch: boolean;
  supportsCodeExecution: boolean;
  isPaidOnly?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'audio' | 'data';
  mimeType: string;
  size: number;
  url?: string;
  base64?: string;
  textContent?: string;
}

export interface Citation {
  title: string;
  url: string;
  snippet?: string;
  source?: string;
  publishedDate?: string;
}

export interface AcademicPaper {
  id: string;
  title: string;
  authors: string[];
  year: string;
  abstract: string;
  doi?: string;
  url?: string;
  journalOrVenue?: string;
  source: 'arXiv' | 'Crossref' | 'Semantic Scholar';
  citationCount?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelUsed?: string;
  attachments?: Attachment[];
  citations?: Citation[];
  academicReferences?: AcademicPaper[];
  isStreaming?: boolean;
  isError?: boolean;
  errorMessage?: string;
  thoughtProcess?: string;
  generatedImageUrl?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  modelId: ModelId;
  systemInstruction?: string;
  temperature?: number;
  pinned?: boolean;
  tags?: string[];
}

export interface UserMemory {
  id: string;
  content: string;
  category: 'preference' | 'bio' | 'project' | 'custom';
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: number;
  preferences: {
    theme: 'dark' | 'light' | 'system';
    streamResponses: boolean;
    webSearchDefault: boolean;
    temperature: number;
    customInstructions?: string;
    sendOnEnter: boolean;
  };
}

export interface GenerationConfig {
  model: ModelId;
  temperature: number;
  systemInstruction?: string;
  enableWebSearch?: boolean;
  enableResearchMode?: boolean;
  attachments?: Attachment[];
}
