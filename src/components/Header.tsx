import React from 'react';
import {
  Menu,
  Plus,
  Download,
  Settings,
  Sparkles,
  BookOpen,
  BarChart3,
  Activity,
  Shield,
  Trash2,
} from 'lucide-react';
import { ModelId, ModelInfo, Conversation } from '../types';
import { ModelSelector } from './ModelSelector';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  currentModelId: ModelId;
  onSelectModel: (id: ModelId) => void;
  models: ModelInfo[];
  currentConversation: Conversation | null;
  onNewChat: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  onOpenResearch: () => void;
  onOpenDataStudio: () => void;
  onOpenDiagnostics: () => void;
  isIncognito: boolean;
  onClearMessages: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  currentModelId,
  onSelectModel,
  models,
  currentConversation,
  onNewChat,
  onOpenExport,
  onOpenSettings,
  onOpenResearch,
  onOpenDataStudio,
  onOpenDiagnostics,
  isIncognito,
  onClearMessages,
}) => {
  return (
    <header className="h-14 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-3 md:px-5 flex items-center justify-between shrink-0 z-30">
      {/* Left section: Sidebar toggle & Model selection */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
          title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="md:hidden">
          <BrandLogo size="sm" showText={false} />
        </div>

        {/* Model selector */}
        <ModelSelector
          currentModelId={currentModelId}
          onSelectModel={onSelectModel}
          models={models}
        />

        {/* Incognito indicator */}
        {isIncognito && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/50 border border-amber-800/60 text-amber-300 text-xs font-mono">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Incognito Session</span>
          </div>
        )}
      </div>

      {/* Right section: Specialized Workspaces & Action Tools */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenResearch}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          title="Scholarly Research Explorer (arXiv & Crossref)"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>Research Lab</span>
        </button>

        <button
          onClick={onOpenDataStudio}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          title="Data Analysis & CSV Studio"
        >
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Data Studio</span>
        </button>

        <button
          onClick={onOpenDiagnostics}
          className="hidden sm:flex p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title="System Health & API Verification"
        >
          <Activity className="w-4 h-4 text-emerald-400" />
        </button>

        {currentConversation && currentConversation.messages.length > 0 && (
          <>
            <button
              onClick={onOpenExport}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              title="Export Conversation (MS Word, Markdown, PDF, JSON)"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClearMessages}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Clear current chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title="ZenG Settings & Custom Instructions"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
          title="Start new conversation"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>
    </header>
  );
};
