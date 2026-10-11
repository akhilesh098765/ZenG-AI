import React, { useState } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Pin,
  Shield,
  BookOpen,
  BarChart3,
  Brain,
  Settings,
  Sparkles,
  ChevronRight,
  ImageIcon,
} from 'lucide-react';
import { Conversation, UserProfile } from '../types';
import { BrandLogo } from './BrandLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePinConversation: (id: string) => void;
  isIncognito: boolean;
  onToggleIncognito: () => void;
  userProfile: UserProfile | null;
  onOpenSettings: () => void;
  onOpenMemories: () => void;
  onOpenResearch: () => void;
  onOpenDataStudio: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  isIncognito,
  onToggleIncognito,
  userProfile,
  onOpenSettings,
  onOpenMemories,
  onOpenResearch,
  onOpenDataStudio,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter(c =>
    (c.title || 'Untitled Chat').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter(c => c.pinned);
  const unpinnedConversations = filteredConversations.filter(c => !c.pinned);

  // Group unpinned by recency
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const sevenDays = 7 * oneDay;

  const todayConversations = unpinnedConversations.filter(c => now - (c.updatedAt || c.createdAt) < oneDay);
  const weekConversations = unpinnedConversations.filter(c => {
    const diff = now - (c.updatedAt || c.createdAt);
    return diff >= oneDay && diff < sevenDays;
  });
  const olderConversations = unpinnedConversations.filter(c => now - (c.updatedAt || c.createdAt) >= sevenDays);

  const startRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title || 'Untitled');
  };

  const saveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 md:w-80 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-all duration-300 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:-ml-80'
        }`}
      >
        {/* Header / Brand */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <BrandLogo size="md" />
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div className="p-3 space-y-2">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Conversation</span>
          </button>

          {/* Incognito / Temporary Chat Mode */}
          <button
            onClick={onToggleIncognito}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
              isIncognito
                ? 'bg-amber-950/40 text-amber-300 border-amber-800/70 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className={`w-3.5 h-3.5 ${isIncognito ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>Temporary Incognito</span>
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isIncognito ? 'bg-amber-900/60 text-amber-200' : 'bg-slate-800 text-slate-500'}`}>
              {isIncognito ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Search Conversations */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search history..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        {/* Specialized Tools Quick Access */}
        <div className="px-3 py-2 border-y border-slate-800/60 bg-slate-900/20">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1.5">
            Specialized Suites
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                onOpenResearch();
                if (window.innerWidth < 768) onClose();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs transition-colors border border-slate-800"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="truncate">Research Lab</span>
            </button>
            <button
              onClick={() => {
                onOpenDataStudio();
                if (window.innerWidth < 768) onClose();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs transition-colors border border-slate-800"
            >
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="truncate">Data Studio</span>
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
          {/* Pinned List */}
          {pinnedConversations.length > 0 && (
            <div>
              <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-amber-400/80 font-mono mb-1">
                ⭐ Pinned
              </p>
              <div className="space-y-0.5">
                {pinnedConversations.map(conv => renderConvItem(conv))}
              </div>
            </div>
          )}

          {/* Today */}
          {todayConversations.length > 0 && (
            <div>
              <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1">
                Today
              </p>
              <div className="space-y-0.5">
                {todayConversations.map(conv => renderConvItem(conv))}
              </div>
            </div>
          )}

          {/* Previous 7 Days */}
          {weekConversations.length > 0 && (
            <div>
              <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1">
                Previous 7 Days
              </p>
              <div className="space-y-0.5">
                {weekConversations.map(conv => renderConvItem(conv))}
              </div>
            </div>
          )}

          {/* Older */}
          {olderConversations.length > 0 && (
            <div>
              <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1">
                Older
              </p>
              <div className="space-y-0.5">
                {olderConversations.map(conv => renderConvItem(conv))}
              </div>
            </div>
          )}

          {filteredConversations.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400">
              No conversations found.
            </div>
          )}
        </div>

        {/* User Account / Preferences Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {userProfile?.name?.charAt(0) || 'Z'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {userProfile?.name || 'ZenG User'}
                </p>
                <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                  {userProfile?.plan || 'Pro'} Workspace
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onOpenMemories}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="ZenG Assistant Memory"
              >
                <Brain className="w-4 h-4 text-purple-400" />
              </button>
              <button
                onClick={onOpenSettings}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );

  function renderConvItem(conv: Conversation) {
    const isSelected = conv.id === currentConversationId;
    const isEditingThis = editingId === conv.id;

    return (
      <div
        key={conv.id}
        onClick={() => {
          onSelectConversation(conv.id);
          if (window.innerWidth < 768) onClose();
        }}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
          isSelected
            ? 'bg-slate-800/90 text-white font-medium border border-cyan-500/40 shadow-sm'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
          {isEditingThis ? (
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onClick={e => e.stopPropagation()}
              className="w-full bg-slate-950 border border-cyan-500/60 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
              autoFocus
            />
          ) : (
            <span className="truncate">{conv.title || 'Untitled Conversation'}</span>
          )}
        </div>

        {/* Hover / Active Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
          {isEditingThis ? (
            <>
              <button
                onClick={e => saveRename(conv.id, e)}
                className="p-1 rounded hover:bg-slate-700 text-emerald-400"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  setEditingId(null);
                }}
                className="p-1 rounded hover:bg-slate-700 text-slate-400"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onTogglePinConversation(conv.id);
                }}
                className={`p-1 rounded hover:bg-slate-700 ${conv.pinned ? 'text-amber-400' : 'text-slate-400'}`}
                title={conv.pinned ? 'Unpin' : 'Pin to top'}
              >
                <Pin className="w-3 h-3" />
              </button>
              <button
                onClick={e => startRename(conv, e)}
                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                title="Rename"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDeleteConversation(conv.id);
                }}
                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-rose-400"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
};
