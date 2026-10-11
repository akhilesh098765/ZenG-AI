import React, { useState } from 'react';
import {
  X,
  Brain,
  Plus,
  Trash2,
  Tag,
  Check,
} from 'lucide-react';
import { UserMemory } from '../types';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: UserMemory[];
  onAddMemory: (content: string, category: string) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onDeleteMemory,
}) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'preference' | 'bio' | 'project' | 'custom'>('preference');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await onAddMemory(content.trim(), category);
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">ZenG Memory Manager</h2>
              <p className="text-xs text-slate-400">User-controlled memories stored across sessions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add new memory form */}
        <form onSubmit={handleAdd} className="p-4 border-b border-slate-800 bg-slate-900/40 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="e.g. Always format SQL queries in uppercase keywords, prefer PostgreSQL."
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
            />
            <select
              value={category}
              onChange={e => setCategory(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 px-2.5 py-2 focus:outline-none"
            >
              <option value="preference">Preference</option>
              <option value="project">Project</option>
              <option value="bio">Bio</option>
              <option value="custom">Custom</option>
            </select>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </form>

        {/* List of memories */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[360px]">
          {memories.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <Brain className="w-10 h-10 mx-auto mb-2 opacity-30 text-purple-400" />
              <p>No custom memories saved yet.</p>
              <p className="text-slate-400 mt-1">Add items above that you want ZenG AI to consistently recall.</p>
            </div>
          ) : (
            memories.map(mem => (
              <div
                key={mem.id}
                className="group p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-purple-500/40 flex items-start justify-between gap-3 transition-colors text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                      {mem.category}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(mem.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-200 leading-relaxed">{mem.content}</p>
                </div>

                <button
                  onClick={() => onDeleteMemory(mem.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-950 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Memories are stored securely and never shared across accounts.</span>
          <button onClick={onClose} className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
