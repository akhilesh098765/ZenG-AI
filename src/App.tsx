import React, { useState, useEffect, useRef } from 'react';
import {
  fetchModels,
  fetchConversations,
  saveConversation,
  deleteConversation,
  streamChat,
  generateImage,
  searchResearchPapers,
  fetchMemories,
  addMemory,
  deleteMemory,
  fetchUserProfile,
} from './services/api';
import {
  Conversation,
  Message,
  ModelId,
  ModelInfo,
  Attachment,
  UserProfile,
  UserMemory,
  AcademicPaper,
} from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ChatInput } from './components/ChatInput';
import { SettingsModal } from './components/SettingsModal';
import { MemoryModal } from './components/MemoryModal';
import { ExportModal } from './components/ExportModal';
import { ResearchPanel } from './components/ResearchPanel';
import { DataAnalysisPanel } from './components/DataAnalysisPanel';
import { DiagnosticsModal } from './components/DiagnosticsModal';

export default function App() {
  // App Core State
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [currentModelId, setCurrentModelId] = useState<ModelId>('gemini-3.8-flash');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isIncognito, setIsIncognito] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Tools & Toggles State
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [enableResearchMode, setEnableResearchMode] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [systemInstruction, setSystemInstruction] = useState(
    'You are ZenG AI, an advanced, modern AI workspace assistant. You excel at reasoning, programming, academic research, data analysis, and technical problem-solving. Maintain a concise, articulate, and accurate tone. Provide mathematical formulations with LaTeX when relevant, and write production-grade code with error handling.'
  );

  // User & Memories State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [memories, setMemories] = useState<UserMemory[]>([]);

  // Modals Visibility
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isResearchOpen, setIsResearchOpen] = useState(false);
  const [isDataStudioOpen, setIsDataStudioOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  // Stream Abort Controller ref
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load initial data on startup
  useEffect(() => {
    async function init() {
      try {
        const [modelsData, convsData, profileData, memoriesData] = await Promise.all([
          fetchModels().catch(() => ({ models: [], hasApiKey: false })),
          fetchConversations().catch(() => []),
          fetchUserProfile().catch(() => null),
          fetchMemories().catch(() => []),
        ]);

        if (modelsData.models.length > 0) {
          setModels(modelsData.models);
          setCurrentModelId(modelsData.models[0].id);
        }

        setConversations(convsData);
        if (convsData.length > 0) {
          setCurrentConversationId(convsData[0].id);
        }

        if (profileData) {
          setUserProfile(profileData);
          if (profileData.preferences?.temperature !== undefined) {
            setTemperature(profileData.preferences.temperature);
          }
        }

        setMemories(memoriesData);
      } catch (err) {
        console.error('Initial data load error:', err);
      }
    }
    init();
  }, []);

  // Keyboard shortcut listener (Cmd/Ctrl + K for new chat)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [conversations]);

  // Current active conversation
  const currentConversation = conversations.find(c => c.id === currentConversationId) || null;
  const currentMessages = currentConversation ? currentConversation.messages : [];

  // Create New Chat
  const handleNewChat = () => {
    const newConv: Conversation = {
      id: 'conv-' + Date.now() + '-' + Math.random().toString(36).substring(7),
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      modelId: currentModelId,
      temperature,
      systemInstruction,
    };

    if (!isIncognito) {
      setConversations(prev => [newConv, ...prev]);
      saveConversation(newConv).catch(console.error);
    } else {
      setConversations(prev => [newConv, ...prev]);
    }

    setCurrentConversationId(newConv.id);
  };

  // Delete Conversation
  const handleDeleteConversation = async (id: string) => {
    if (!isIncognito) {
      await deleteConversation(id).catch(console.error);
    }
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      setCurrentConversationId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Rename Conversation
  const handleRenameConversation = async (id: string, newTitle: string) => {
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
    const conv = conversations.find(c => c.id === id);
    if (conv && !isIncognito) {
      saveConversation({ ...conv, title: newTitle, updatedAt: Date.now() }).catch(console.error);
    }
  };

  // Toggle Pin Conversation
  const handleTogglePin = (id: string) => {
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
    const conv = conversations.find(c => c.id === id);
    if (conv && !isIncognito) {
      saveConversation({ ...conv, pinned: !conv.pinned }).catch(console.error);
    }
  };

  // Clear current messages
  const handleClearMessages = () => {
    if (!currentConversationId) return;
    setConversations(prev =>
      prev.map(c => (c.id === currentConversationId ? { ...c, messages: [], updatedAt: Date.now() } : c))
    );
    const conv = conversations.find(c => c.id === currentConversationId);
    if (conv && !isIncognito) {
      saveConversation({ ...conv, messages: [], updatedAt: Date.now() }).catch(console.error);
    }
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Send Message Workflow
  const handleSendMessage = async (
    text: string,
    attachments: Attachment[] = [],
    preloadedPapers?: AcademicPaper[]
  ) => {
    if ((!text.trim() && attachments.length === 0) || isGenerating) return;

    let targetConv = currentConversation;

    // Create a conversation if none exists
    if (!targetConv) {
      const newConv: Conversation = {
        id: 'conv-' + Date.now() + '-' + Math.random().toString(36).substring(7),
        title: text.slice(0, 32) || 'New Conversation',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        modelId: currentModelId,
      };
      targetConv = newConv;
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
    }

    const userMsg: Message = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const assistantMsgId = 'msg-' + (Date.now() + 1);
    const assistantMsgPlaceholder: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelUsed: currentModelId,
      isStreaming: true,
    };

    const updatedMessages = [...targetConv.messages, userMsg, assistantMsgPlaceholder];

    // Update title from first message if untitled
    const newTitle =
      targetConv.messages.length === 0
        ? text.slice(0, 36) || 'New Conversation'
        : targetConv.title;

    const updatedConv: Conversation = {
      ...targetConv,
      title: newTitle,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };

    setConversations(prev =>
      prev.map(c => (c.id === updatedConv.id ? updatedConv : c))
    );

    setIsGenerating(true);

    // Check if image model selected
    if (currentModelId === 'gemini-3.1-flash-lite-image') {
      try {
        const imageRes = await generateImage(text);
        const finishedConv: Conversation = {
          ...updatedConv,
          messages: updatedConv.messages.map(m =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: imageRes.description || `Generated artwork for: "${text}"`,
                  generatedImageUrl: imageRes.imageUrl,
                  isStreaming: false,
                }
              : m
          ),
          updatedAt: Date.now(),
        };
        setConversations(prev =>
          prev.map(c => (c.id === finishedConv.id ? finishedConv : c))
        );
        if (!isIncognito) saveConversation(finishedConv).catch(console.error);
      } catch (err: any) {
        setConversations(prev =>
          prev.map(c =>
            c.id === updatedConv.id
              ? {
                  ...c,
                  messages: c.messages.map(m =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content: '',
                          isStreaming: false,
                          isError: true,
                          errorMessage: err.message || 'Image generation failed',
                        }
                      : m
                  ),
                }
              : c
          )
        );
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // Academic Research search pre-step if enabled
    let retrievedPapers: AcademicPaper[] = preloadedPapers || [];
    if (enableResearchMode && (!preloadedPapers || preloadedPapers.length === 0)) {
      try {
        const searchResult = await searchResearchPapers(text, 4);
        retrievedPapers = searchResult.papers;
      } catch (err) {
        console.warn('Auto-research grounding failed:', err);
      }
    }

    // Build effective system prompt with memories & user context
    let effectiveSystemPrompt = systemInstruction;
    if (userProfile?.preferences?.customInstructions) {
      effectiveSystemPrompt += `\n\nUser Background Context:\n${userProfile.preferences.customInstructions}`;
    }
    if (memories.length > 0) {
      effectiveSystemPrompt += `\n\nUser Stored Preferences:\n${memories.map(m => `- [${m.category}] ${m.content}`).join('\n')}`;
    }
    if (retrievedPapers.length > 0) {
      effectiveSystemPrompt += `\n\nGrounded Academic Literature retrieved from arXiv & Crossref:\n${retrievedPapers.map(p => `[${p.id}] "${p.title}" by ${p.authors.join(', ')} (${p.year}). Abstract: ${p.abstract}`).join('\n\n')}\nCite these genuine sources with their author-year names when answering.`;
    }

    // Prepare message history
    const historyPayload = updatedMessages
      .filter(m => m.id !== assistantMsgId)
      .map(m => ({ role: m.role, content: m.content }));

    abortControllerRef.current = new AbortController();

    let fullAccumulatedText = '';

    await streamChat({
      messages: historyPayload,
      model: currentModelId,
      temperature,
      systemInstruction: effectiveSystemPrompt,
      enableWebSearch,
      attachments,
      signal: abortControllerRef.current.signal,
      onChunk: (chunk: string) => {
        fullAccumulatedText += chunk;
        setConversations(prev =>
          prev.map(c =>
            c.id === updatedConv.id
              ? {
                  ...c,
                  messages: c.messages.map(m =>
                    m.id === assistantMsgId
                      ? { ...m, content: fullAccumulatedText, academicReferences: retrievedPapers }
                      : m
                  ),
                }
              : c
          )
        );
      },
      onDone: (metadata: { citations?: any[] }) => {
        setIsGenerating(false);
        abortControllerRef.current = null;

        const finalizedConv: Conversation = {
          ...updatedConv,
          messages: updatedConv.messages.map(m =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: fullAccumulatedText,
                  citations: metadata.citations,
                  academicReferences: retrievedPapers.length > 0 ? retrievedPapers : undefined,
                  isStreaming: false,
                }
              : m
          ),
          updatedAt: Date.now(),
        };

        setConversations(prev =>
          prev.map(c => (c.id === finalizedConv.id ? finalizedConv : c))
        );

        if (!isIncognito) {
          saveConversation(finalizedConv).catch(console.error);
        }
      },
      onError: (errorMsg: string) => {
        setIsGenerating(false);
        abortControllerRef.current = null;

        setConversations(prev =>
          prev.map(c =>
            c.id === updatedConv.id
              ? {
                  ...c,
                  messages: c.messages.map(m =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content: fullAccumulatedText,
                          isStreaming: false,
                          isError: true,
                          errorMessage: errorMsg,
                        }
                      : m
                  ),
                }
              : c
          )
        );
      },
    });
  };

  // Regenerate last assistant turn
  const handleRegenerate = () => {
    if (!currentConversation || currentConversation.messages.length === 0 || isGenerating) return;
    const msgs = [...currentConversation.messages];
    // Find last user message
    let lastUserIndex = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }
    if (lastUserIndex === -1) return;

    const userMsg = msgs[lastUserIndex];
    // Trim conversation up to before that user message
    const prunedMessages = msgs.slice(0, lastUserIndex);
    const prunedConv: Conversation = {
      ...currentConversation,
      messages: prunedMessages,
    };

    setConversations(prev =>
      prev.map(c => (c.id === prunedConv.id ? prunedConv : c))
    );

    // Resend
    handleSendMessage(userMsg.content, userMsg.attachments || []);
  };

  // Edit user message and branch
  const handleEditMessage = (messageId: string, newContent: string) => {
    if (!currentConversation || isGenerating) return;
    const msgs = currentConversation.messages;
    const targetIndex = msgs.findIndex(m => m.id === messageId);
    if (targetIndex === -1) return;

    const prunedMessages = msgs.slice(0, targetIndex);
    const oldMsg = msgs[targetIndex];

    const prunedConv: Conversation = {
      ...currentConversation,
      messages: prunedMessages,
    };

    setConversations(prev =>
      prev.map(c => (c.id === prunedConv.id ? prunedConv : c))
    );

    handleSendMessage(newContent, oldMsg.attachments || []);
  };

  // Memory Handlers
  const handleAddMemory = async (content: string, category: string) => {
    const mem = await addMemory(content, category);
    setMemories(prev => [...prev, mem]);
  };

  const handleDeleteMemory = async (id: string) => {
    await deleteMemory(id);
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden select-text">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={id => setCurrentConversationId(id)}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePinConversation={handleTogglePin}
        isIncognito={isIncognito}
        onToggleIncognito={() => setIsIncognito(!isIncognito)}
        userProfile={userProfile}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMemories={() => setIsMemoryOpen(true)}
        onOpenResearch={() => setIsResearchOpen(true)}
        onOpenDataStudio={() => setIsDataStudioOpen(true)}
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-radial from-slate-900/60 via-slate-950 to-slate-950 relative">
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          currentModelId={currentModelId}
          onSelectModel={id => setCurrentModelId(id)}
          models={models}
          currentConversation={currentConversation}
          onNewChat={handleNewChat}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenResearch={() => setIsResearchOpen(true)}
          onOpenDataStudio={() => setIsDataStudioOpen(true)}
          onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
          isIncognito={isIncognito}
          onClearMessages={handleClearMessages}
        />

        {/* Scrollable Conversation Content */}
        <ChatArea
          messages={currentMessages}
          isGenerating={isGenerating}
          onRegenerate={handleRegenerate}
          onEditMessage={handleEditMessage}
          onSelectPrompt={p => handleSendMessage(p)}
          modelId={currentModelId}
        />

        {/* Multimodal Chat Input */}
        <ChatInput
          onSend={(text, atts) => handleSendMessage(text, atts)}
          onStop={handleStopGeneration}
          isGenerating={isGenerating}
          enableWebSearch={enableWebSearch}
          setEnableWebSearch={setEnableWebSearch}
          enableResearchMode={enableResearchMode}
          setEnableResearchMode={setEnableResearchMode}
        />
      </div>

      {/* Specialized Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userProfile={userProfile}
        onSaveProfile={prof => setUserProfile(prev => (prev ? { ...prev, ...prof } as any : null))}
        temperature={temperature}
        setTemperature={setTemperature}
        systemInstruction={systemInstruction}
        setSystemInstruction={setSystemInstruction}
        models={models}
      />

      <MemoryModal
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
        memories={memories}
        onAddMemory={handleAddMemory}
        onDeleteMemory={handleDeleteMemory}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        conversation={currentConversation}
      />

      <ResearchPanel
        isOpen={isResearchOpen}
        onClose={() => setIsResearchOpen(false)}
        onSendToChat={(prompt, papers) => handleSendMessage(prompt, [], papers)}
      />

      <DataAnalysisPanel
        isOpen={isDataStudioOpen}
        onClose={() => setIsDataStudioOpen(false)}
        onSendToChat={prompt => handleSendMessage(prompt)}
      />

      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />
    </div>
  );
}
