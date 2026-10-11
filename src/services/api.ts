import {
  Attachment,
  Conversation,
  ModelId,
  ModelInfo,
  UserMemory,
  UserProfile,
  AcademicPaper,
} from '../types';

export async function fetchModels(): Promise<{ models: ModelInfo[]; hasApiKey: boolean }> {
  const res = await fetch('/api/models');
  if (!res.ok) throw new Error('Failed to fetch models');
  return res.json();
}

export async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch('/api/conversations');
  if (!res.ok) throw new Error('Failed to load conversations');
  const data = await res.json();
  return data.conversations || [];
}

export async function saveConversation(conv: Conversation): Promise<Conversation> {
  const res = await fetch('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(conv),
  });
  if (!res.ok) throw new Error('Failed to save conversation');
  const data = await res.json();
  return data.conversation;
}

export async function deleteConversation(id: string): Promise<boolean> {
  const res = await fetch(`/api/conversations/${id}`, {
    method: 'DELETE',
  });
  return res.ok;
}

export interface StreamChatParams {
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  model: ModelId;
  temperature: number;
  systemInstruction?: string;
  enableWebSearch?: boolean;
  attachments?: Attachment[];
  signal?: AbortSignal;
  onChunk: (textChunk: string) => void;
  onDone: (metadata: { citations?: any[] }) => void;
  onError: (err: string) => void;
}

export async function streamChat({
  messages,
  model,
  temperature,
  systemInstruction,
  enableWebSearch,
  attachments,
  signal,
  onChunk,
  onDone,
  onError,
}: StreamChatParams): Promise<void> {
  try {
    const res = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model,
        temperature,
        systemInstruction,
        enableWebSearch,
        attachments,
      }),
      signal,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Connection failed' }));
      onError(errData.error || `HTTP ${res.status}: ${res.statusText}`);
      return;
    }

    if (!res.body) {
      onError('ReadableStream not supported by browser.');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulatedCitations: any[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const block of lines) {
        const line = block.trim();
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.error) {
              onError(data.error);
              return;
            }
            if (data.text) {
              onChunk(data.text);
            }
            if (data.done) {
              if (data.citations) accumulatedCitations = data.citations;
            }
          } catch (e) {
            console.error('Failed to parse SSE line:', line, e);
          }
        }
      }
    }

    onDone({ citations: accumulatedCitations });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      onDone({});
      return;
    }
    onError(err.message || 'Stream generation failed');
  }
}

export async function generateImage(prompt: string, aspectRatio = '1:1'): Promise<{ imageUrl: string; description: string }> {
  const res = await fetch('/api/image/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, aspectRatio }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to generate image');
  }
  return res.json();
}

export async function searchResearchPapers(query: string, limit = 6): Promise<{ papers: AcademicPaper[]; count: number }> {
  const res = await fetch('/api/research/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit }),
  });
  if (!res.ok) {
    throw new Error('Scholarly literature search failed');
  }
  return res.json();
}

export async function parseDocument(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');
    const isText = file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json') || file.name.endsWith('.md');

    reader.onload = async () => {
      const base64 = reader.result as string;

      let type: 'image' | 'document' | 'audio' | 'data' = 'document';
      if (isImage) type = 'image';
      else if (isAudio) type = 'audio';
      else if (file.name.endsWith('.csv') || file.name.endsWith('.json')) type = 'data';

      try {
        const parseRes = await fetch('/api/documents/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileContent: base64,
            mimeType: file.type || 'application/octet-stream',
          }),
        });

        if (parseRes.ok) {
          const parsed = await parseRes.json();
          resolve({
            id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(7),
            name: file.name,
            type,
            mimeType: file.type,
            size: file.size,
            base64: isImage || isAudio ? base64 : undefined,
            textContent: parsed.textContent || '',
          });
          return;
        }
      } catch (err) {
        console.warn('Document parse API warning:', err);
      }

      // Fallback
      resolve({
        id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(7),
        name: file.name,
        type,
        mimeType: file.type,
        size: file.size,
        base64: base64,
      });
    };

    reader.onerror = () => reject(new Error('Failed to read file'));

    if (isText) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  });
}

export async function fetchMemories(): Promise<UserMemory[]> {
  const res = await fetch('/api/memories');
  if (!res.ok) return [];
  const data = await res.json();
  return data.memories || [];
}

export async function addMemory(content: string, category: string): Promise<UserMemory> {
  const res = await fetch('/api/memories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, category }),
  });
  const data = await res.json();
  return data.memory;
}

export async function deleteMemory(id: string): Promise<boolean> {
  const res = await fetch(`/api/memories/${id}`, { method: 'DELETE' });
  return res.ok;
}

export async function fetchUserProfile(): Promise<UserProfile | null> {
  const res = await fetch('/api/auth/me');
  if (!res.ok) return null;
  const data = await res.json();
  return data.user;
}

export async function loginUser(email: string): Promise<UserProfile> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  return data.user;
}

export async function runDiagnostics(): Promise<any[]> {
  const res = await fetch('/api/test/suite', { method: 'POST' });
  const data = await res.json();
  return data.results || [];
}
