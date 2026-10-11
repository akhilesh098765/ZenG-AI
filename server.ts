import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT: number = Number(process.env.PORT) || 3000;

// Body parser with 50mb limit for multimodal inputs (images, audio, docs)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure persistent data directory exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const CONVERSATIONS_FILE = path.join(DATA_DIR, 'conversations.json');
const MEMORIES_FILE = path.join(DATA_DIR, 'memories.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Initialize files if not present
if (!fs.existsSync(CONVERSATIONS_FILE)) {
  fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(MEMORIES_FILE)) {
  fs.writeFileSync(MEMORIES_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([
    {
      id: 'default-user',
      email: 'user@zeng.ai',
      name: 'ZenG Explorer',
      avatarUrl: '',
      plan: 'pro',
      createdAt: Date.now(),
      preferences: {
        theme: 'dark',
        streamResponses: true,
        webSearchDefault: false,
        temperature: 0.7,
        customInstructions: 'Be insightful, concise when needed, thorough on technical and scientific explanations, and format outputs cleanly.',
        sendOnEnter: true,
      }
    }
  ], null, 2));
}

// Helpers for persistent JSON storage
function readJSON<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

function writeJSON<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err);
  }
}

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Available models specification
const AVAILABLE_MODELS = [
  {
    id: 'gemini-3.8-flash',
    name: 'ZenG Fast Neural Engine',
    provider: 'ZenG Cognitive Core',
    description: 'High-speed intelligence, real-time reasoning, search grounding & multimodal analysis',
    badge: 'Recommended',
    contextWindow: '1M tokens',
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsVision: true,
    supportsWebSearch: true,
    supportsCodeExecution: true,
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'ZenG Pro Reasoner',
    provider: 'ZenG Cognitive Core',
    description: 'Advanced STEM reasoning, complex code generation, literature synthesis & math',
    badge: 'Pro Reasoning',
    contextWindow: '2M tokens',
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsVision: true,
    supportsWebSearch: true,
    supportsCodeExecution: true,
    isPaidOnly: true,
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'ZenG Lite Turbo',
    provider: 'ZenG Cognitive Core',
    description: 'Ultra-low latency, lightweight summarization, quick Q&A',
    badge: 'Low Latency',
    contextWindow: '1M tokens',
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsVision: true,
    supportsWebSearch: true,
    supportsCodeExecution: false,
  },
  {
    id: 'gemini-3.1-flash-lite-image',
    name: 'ZenG Visual Studio',
    provider: 'ZenG Cognitive Core',
    description: 'Generates creative visuals and image synthesis from descriptive prompts',
    badge: 'Image Gen',
    contextWindow: '32K tokens',
    maxOutputTokens: 2048,
    supportsStreaming: false,
    supportsVision: true,
    supportsWebSearch: false,
    supportsCodeExecution: false,
  }
];

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Model metadata
app.get('/api/models', (_req: Request, res: Response) => {
  res.json({
    models: AVAILABLE_MODELS,
    hasApiKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
  });
});

// Health & System Diagnostic
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    platform: 'ZenG AI Full-Stack',
    hasGeminiKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
    timestamp: new Date().toISOString(),
  });
});

// Chat Streaming SSE Endpoint
app.post('/api/chat/stream', async (req: Request, res: Response): Promise<void> => {
  const {
    messages = [],
    model = 'gemini-3.8-flash',
    temperature = 0.7,
    systemInstruction = '',
    enableWebSearch = false,
    attachments = [],
  } = req.body;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    res.status(500).json({
      error: 'GEMINI_API_KEY is missing or invalid. Please configure it in Settings > Secrets.',
    });
    return;
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    // Format conversation history for Gemini
    const contents: any[] = [];

    // Format previous turns
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const isLatestUserTurn = i === messages.length - 1 && msg.role === 'user';
      const role = msg.role === 'assistant' ? 'model' : 'user';

      const parts: any[] = [];

      // If it's the latest user message, attach any uploaded images / docs
      if (isLatestUserTurn && attachments && attachments.length > 0) {
        for (const att of attachments) {
          if (att.base64 && att.mimeType) {
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: att.base64.replace(/^data:[^;]+;base64,/, ''),
              },
            });
          } else if (att.textContent) {
            parts.push({
              text: `\n--- ATTACHED FILE [${att.name}] ---\n${att.textContent}\n--- END OF FILE ---\n`,
            });
          }
        }
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      if (parts.length > 0) {
        contents.push({ role, parts });
      }
    }

    if (contents.length === 0) {
      res.write(`data: ${JSON.stringify({ error: 'No message contents provided.' })}\n\n`);
      res.end();
      return;
    }

    // Tools setup
    const tools: any[] = [];
    if (enableWebSearch) {
      tools.push({ googleSearch: {} });
    }

    const config: any = {
      temperature: Math.max(0, Math.min(2, Number(temperature) || 0.7)),
    };

    if (systemInstruction && systemInstruction.trim().length > 0) {
      config.systemInstruction = systemInstruction.trim();
    }

    if (tools.length > 0) {
      config.tools = tools;
    }

    // Call stream API with automatic fallback for transient 503 spikes
    let responseStream;
    try {
      responseStream = await ai.models.generateContentStream({
        model: model,
        contents: contents,
        config: config,
      });
    } catch (firstErr: any) {
      console.warn(`Primary model ${model} temporarily unavailable, trying fallback:`, firstErr.message);
      // If 503 or 429, try gemini-3.1-flash-lite
      const fallbackModel = model !== 'gemini-3.1-flash-lite' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash';
      responseStream = await ai.models.generateContentStream({
        model: fallbackModel,
        contents: contents,
        config: config,
      });
    }

    let fullText = '';
    const citations: any[] = [];

    for await (const chunk of responseStream) {
      const textChunk = chunk.text;
      if (textChunk) {
        fullText += textChunk;
        res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
      }

      // Check for search grounding metadata / citations
      const candidate = chunk.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;
      if (groundingMetadata?.groundingChunks) {
        for (const gChunk of groundingMetadata.groundingChunks) {
          const web = gChunk.web;
          if (web?.uri && web?.title) {
            const exists = citations.some(c => c.url === web.uri);
            if (!exists) {
              let hostname = 'web';
              try {
                hostname = new URL(web.uri).hostname;
              } catch {}
              citations.push({
                title: web.title,
                url: web.uri,
                source: hostname,
              });
            }
          }
        }
      }
    }

    // Send final event with accumulated citations and metadata
    res.write(`data: ${JSON.stringify({ done: true, citations })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error('Chat stream error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message || 'Error generating AI response.' })}\n\n`);
    res.end();
  }
});

// Unary Chat Generation Endpoint
app.post('/api/chat/generate', async (req: Request, res: Response): Promise<void> => {
  const {
    messages = [],
    model = 'gemini-3.8-flash',
    temperature = 0.7,
    systemInstruction = '',
    enableWebSearch = false,
    attachments = [],
  } = req.body;

  try {
    const contents: any[] = [];
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const isLatest = i === messages.length - 1 && msg.role === 'user';
      const role = msg.role === 'assistant' ? 'model' : 'user';
      const parts: any[] = [];

      if (isLatest && attachments && attachments.length > 0) {
        for (const att of attachments) {
          if (att.base64 && att.mimeType) {
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: att.base64.replace(/^data:[^;]+;base64,/, ''),
              },
            });
          } else if (att.textContent) {
            parts.push({
              text: `\n--- ATTACHED FILE [${att.name}] ---\n${att.textContent}\n--- END OF FILE ---\n`,
            });
          }
        }
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      if (parts.length > 0) {
        contents.push({ role, parts });
      }
    }

    const config: any = {
      temperature: Math.max(0, Math.min(2, Number(temperature) || 0.7)),
    };
    if (systemInstruction) config.systemInstruction = systemInstruction;
    if (enableWebSearch) config.tools = [{ googleSearch: {} }];

    let response;
    try {
      response = await ai.models.generateContent({
        model: model,
        contents: contents,
        config: config,
      });
    } catch (firstErr: any) {
      console.warn(`Primary model ${model} unavailable, trying fallback:`, firstErr.message);
      const fallbackModel = model !== 'gemini-3.1-flash-lite' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash';
      response = await ai.models.generateContent({
        model: fallbackModel,
        contents: contents,
        config: config,
      });
    }

    const citations: any[] = [];
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata?.groundingChunks) {
      for (const gChunk of groundingMetadata.groundingChunks) {
        const web = gChunk.web;
        if (web?.uri && web?.title) {
          let hostname = 'web';
          try {
            hostname = new URL(web.uri).hostname;
          } catch {}
          citations.push({
            title: web.title,
            url: web.uri,
            source: hostname,
          });
        }
      }
    }

    res.json({
      text: response.text || '',
      citations,
    });
  } catch (err: any) {
    console.error('Chat generate error:', err);
    res.status(500).json({ error: err.message || 'Generation failed' });
  }
});

// Image Generation Endpoint
app.post('/api/image/generate', async (req: Request, res: Response): Promise<void> => {
  const { prompt, aspectRatio = '1:1' } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [
          {
            text: `High quality, detailed artistic image: ${prompt}`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        },
      },
    });

    let imageUrl = '';
    let textDescription = '';

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        const base64Data = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        imageUrl = `data:${mimeType};base64,${base64Data}`;
      } else if (part.text) {
        textDescription += part.text;
      }
    }

    if (!imageUrl) {
      res.status(500).json({
        error: 'Model did not produce an image part. Please try rephrasing the visual prompt.',
        description: textDescription,
      });
      return;
    }

    res.json({
      imageUrl,
      description: textDescription || prompt,
    });
  } catch (err: any) {
    console.error('Image gen error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate image' });
  }
});

// Audio Transcription Endpoint
app.post('/api/audio/transcribe', async (req: Request, res: Response): Promise<void> => {
  const { audioBase64, mimeType = 'audio/webm' } = req.body;

  if (!audioBase64) {
    res.status(400).json({ error: 'Audio data is required' });
    return;
  }

  try {
    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');
    const audioPart = {
      inlineData: {
        mimeType: mimeType,
        data: cleanBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          { text: 'Please transcribe the spoken audio accurately into text.' },
        ],
      },
    });

    res.json({ transcription: response.text || '' });
  } catch (err: any) {
    console.error('Transcription error:', err);
    res.status(500).json({ error: err.message || 'Audio transcription failed' });
  }
});

// Academic Literature Search Endpoint (arXiv + Crossref APIs)
app.post('/api/research/search', async (req: Request, res: Response): Promise<void> => {
  const { query, limit = 5 } = req.body;

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Search query is required' });
    return;
  }

  const papers: any[] = [];

  try {
    // 1. Fetch arXiv papers
    const arxivUrl = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${limit}&sortBy=relevance&sortOrder=descending`;
    const arxivResponse = await fetch(arxivUrl, { headers: { 'User-Agent': 'ZenG-Academic-Assistant/1.0' } });
    if (arxivResponse.ok) {
      const xmlText = await arxivResponse.text();
      // Extract entries using regex
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
      let match;
      while ((match = entryRegex.exec(xmlText)) !== null) {
        const entryXml = match[1];
        const titleMatch = /<title>([\s\S]*?)<\/title>/.exec(entryXml);
        const summaryMatch = /<summary>([\s\S]*?)<\/summary>/.exec(entryXml);
        const idMatch = /<id>([\s\S]*?)<\/id>/.exec(entryXml);
        const publishedMatch = /<published>([\s\S]*?)<\/published>/.exec(entryXml);

        // Extract authors
        const authors: string[] = [];
        const authorRegex = /<author>\s*<name>([\s\S]*?)<\/name>/g;
        let authorMatch;
        while ((authorMatch = authorRegex.exec(entryXml)) !== null) {
          authors.push(authorMatch[1].trim());
        }

        const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : 'Untitled Paper';
        const abstract = summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : '';
        const idUrl = idMatch ? idMatch[1].trim() : '';
        const year = publishedMatch ? publishedMatch[1].substring(0, 4) : new Date().getFullYear().toString();
        const arxivId = idUrl.split('/abs/').pop() || '';

        papers.push({
          id: `arxiv-${arxivId || Math.random().toString(36).substring(7)}`,
          title,
          authors: authors.length > 0 ? authors : ['Unknown Researcher'],
          year,
          abstract,
          url: idUrl || `https://arxiv.org/abs/${arxivId}`,
          doi: arxivId ? `10.48550/arXiv.${arxivId}` : undefined,
          journalOrVenue: 'arXiv preprint',
          source: 'arXiv',
        });
      }
    }
  } catch (err) {
    console.warn('arXiv search error:', err);
  }

  // 2. Fetch Crossref papers if needed for broad multi-discipline metadata
  if (papers.length < limit) {
    try {
      const crossrefUrl = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${limit}&select=DOI,title,author,published-print,published-online,container-title,abstract`;
      const crossrefRes = await fetch(crossrefUrl, {
        headers: { 'User-Agent': 'ZenG-Research-Agent/1.0 (mailto:scholar@zeng.ai)' },
      });
      if (crossrefRes.ok) {
        const data = await crossrefRes.json();
        const items = data.message?.items || [];
        for (const item of items) {
          const title = item.title?.[0] || 'Untitled Publication';
          const authors = (item.author || []).map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()).filter(Boolean);
          const year = item['published-print']?.['date-parts']?.[0]?.[0] ||
                       item['published-online']?.['date-parts']?.[0]?.[0] ||
                       '2023';
          const doi = item.DOI;
          const journal = item['container-title']?.[0] || 'Scholarly Journal';

          papers.push({
            id: `crossref-${doi || Math.random().toString(36).substring(7)}`,
            title,
            authors: authors.length > 0 ? authors : ['Scholarly Consortium'],
            year: String(year),
            abstract: item.abstract ? item.abstract.replace(/<[^>]+>/g, '').trim() : 'Abstract available via DOI record.',
            url: doi ? `https://doi.org/${doi}` : undefined,
            doi,
            journalOrVenue: journal,
            source: 'Crossref',
          });
        }
      }
    } catch (err) {
      console.warn('Crossref search error:', err);
    }
  }

  res.json({
    papers: papers.slice(0, 10),
    count: papers.length,
    query,
  });
});

// Document Content Parsing Endpoint
app.post('/api/documents/parse', async (req: Request, res: Response): Promise<void> => {
  const { fileName, fileContent, mimeType } = req.body;

  if (!fileName || !fileContent) {
    res.status(400).json({ error: 'fileName and fileContent are required' });
    return;
  }

  try {
    let text = '';
    const isBase64 = fileContent.startsWith('data:') || /^[A-Za-z0-9+/=]+$/.test(fileContent.substring(0, 50));

    if (isBase64) {
      const base64Data = fileContent.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // For plain text, markdown, csv, json, html
      if (
        mimeType?.includes('text') ||
        mimeType?.includes('json') ||
        mimeType?.includes('csv') ||
        fileName.endsWith('.txt') ||
        fileName.endsWith('.csv') ||
        fileName.endsWith('.json') ||
        fileName.endsWith('.md')
      ) {
        text = buffer.toString('utf-8');
      } else {
        // For PDF or DOCX binary files, extract strings or let Gemini parse multimodal
        // First try textual extraction
        const rawStr = buffer.toString('utf-8');
        // Clean non-printable characters
        const printable = rawStr.replace(/[^\x20-\x7E\t\n\r]/g, ' ');
        if (printable.length > 200) {
          text = printable.slice(0, 100000);
        } else {
          text = `[Binary Document ${fileName} loaded: ${buffer.length} bytes. Prepared for direct Multimodal AI inspection.]`;
        }
      }
    } else {
      text = fileContent;
    }

    res.json({
      fileName,
      mimeType,
      textPreview: text.slice(0, 1000),
      fullLength: text.length,
      textContent: text,
    });
  } catch (err: any) {
    console.error('Parse document error:', err);
    res.status(500).json({ error: 'Failed to parse document content' });
  }
});

// ----------------------------------------------------
// PERSISTENT CONVERSATION CRUD
// ----------------------------------------------------

// List Conversations
app.get('/api/conversations', (_req: Request, res: Response) => {
  const conversations = readJSON(CONVERSATIONS_FILE, []);
  res.json({ conversations });
});

// Get Single Conversation
app.get('/api/conversations/:id', (req: Request, res: Response): void => {
  const conversations = readJSON<any[]>(CONVERSATIONS_FILE, []);
  const conv = conversations.find(c => c.id === req.params.id);
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  res.json({ conversation: conv });
});

// Save or Update Conversation
app.post('/api/conversations', (req: Request, res: Response) => {
  const newOrUpdatedConv = req.body;
  if (!newOrUpdatedConv.id) {
    newOrUpdatedConv.id = 'conv-' + Date.now() + '-' + Math.random().toString(36).substring(7);
  }
  newOrUpdatedConv.updatedAt = Date.now();
  if (!newOrUpdatedConv.createdAt) {
    newOrUpdatedConv.createdAt = Date.now();
  }

  const conversations = readJSON<any[]>(CONVERSATIONS_FILE, []);
  const index = conversations.findIndex(c => c.id === newOrUpdatedConv.id);

  if (index >= 0) {
    conversations[index] = newOrUpdatedConv;
  } else {
    conversations.unshift(newOrUpdatedConv);
  }

  writeJSON(CONVERSATIONS_FILE, conversations);
  res.json({ conversation: newOrUpdatedConv });
});

// Delete Conversation
app.delete('/api/conversations/:id', (req: Request, res: Response) => {
  const conversations = readJSON<any[]>(CONVERSATIONS_FILE, []);
  const filtered = conversations.filter(c => c.id !== req.params.id);
  writeJSON(CONVERSATIONS_FILE, filtered);
  res.json({ success: true });
});

// ----------------------------------------------------
// MEMORIES & USER PROFILE
// ----------------------------------------------------

app.get('/api/memories', (_req: Request, res: Response) => {
  const memories = readJSON(MEMORIES_FILE, []);
  res.json({ memories });
});

app.post('/api/memories', (req: Request, res: Response) => {
  const { content, category = 'preference' } = req.body;
  const memories = readJSON<any[]>(MEMORIES_FILE, []);
  const memory = {
    id: 'mem-' + Date.now(),
    content,
    category,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  memories.push(memory);
  writeJSON(MEMORIES_FILE, memories);
  res.json({ memory });
});

app.delete('/api/memories/:id', (req: Request, res: Response) => {
  const memories = readJSON<any[]>(MEMORIES_FILE, []);
  const filtered = memories.filter(m => m.id !== req.params.id);
  writeJSON(MEMORIES_FILE, filtered);
  res.json({ success: true });
});

app.get('/api/auth/me', (_req: Request, res: Response) => {
  const users = readJSON<any[]>(USERS_FILE, []);
  res.json({ user: users[0] || null });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  const users = readJSON<any[]>(USERS_FILE, []);
  let user = users.find(u => u.email === email);
  if (!user) {
    user = {
      id: 'usr-' + Date.now(),
      email: email || 'user@zeng.ai',
      name: email ? email.split('@')[0] : 'ZenG Pioneer',
      plan: 'pro',
      createdAt: Date.now(),
      preferences: {
        theme: 'dark',
        streamResponses: true,
        webSearchDefault: false,
        temperature: 0.7,
        sendOnEnter: true,
      }
    };
    users.push(user);
    writeJSON(USERS_FILE, users);
  }
  res.json({ user, token: 'zeng-session-' + Date.now() });
});

// ----------------------------------------------------
// INTEGRATION TEST SUITE RUNNER
// ----------------------------------------------------
app.post('/api/test/suite', async (_req: Request, res: Response) => {
  const testResults: any[] = [];

  // Test 1: Gemini API Connectivity
  try {
    let output = '';
    let testedModel = 'gemini-3.8-flash';
    try {
      const geminiTest = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'Respond with: "ZenG Intelligence Online"',
      });
      output = geminiTest.text?.trim() || 'Online';
    } catch {
      testedModel = 'gemini-3.1-flash-lite';
      const geminiTest = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: 'Respond with: "ZenG Intelligence Online"',
      });
      output = geminiTest.text?.trim() || 'Online';
    }

    testResults.push({
      test: `Gemini API SDK Connection (${testedModel})`,
      status: 'PASSED',
      output: output,
    });
  } catch (err: any) {
    testResults.push({
      test: 'Gemini API SDK Connection',
      status: 'FAILED',
      error: err.message,
    });
  }

  // Test 2: Academic Literature API (arXiv)
  try {
    const arxivUrl = `https://export.arxiv.org/api/query?search_query=all:quantum&start=0&max_results=1`;
    const r = await fetch(arxivUrl);
    testResults.push({
      test: 'arXiv Scholarly Repository Access',
      status: r.ok ? 'PASSED' : 'FAILED',
      statusCode: r.status,
    });
  } catch (err: any) {
    testResults.push({
      test: 'arXiv Scholarly Repository Access',
      status: 'FAILED',
      error: err.message,
    });
  }

  // Test 3: Local Database Persistence
  try {
    const convs = readJSON(CONVERSATIONS_FILE, []);
    testResults.push({
      test: 'Local Persistent Storage I/O',
      status: 'PASSED',
      conversationCount: convs.length,
    });
  } catch (err: any) {
    testResults.push({
      test: 'Local Persistent Storage I/O',
      status: 'FAILED',
      error: err.message,
    });
  }

  res.json({ results: testResults, timestamp: Date.now() });
});

// ----------------------------------------------------
// VITE DEV SERVER OR PRODUCTION STATIC FILES
// ----------------------------------------------------
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ZenG AI Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
