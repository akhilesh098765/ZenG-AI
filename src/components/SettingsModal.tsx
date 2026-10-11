import React, { useState } from 'react';
import {
  X,
  Sliders,
  Sparkles,
  User,
  Shield,
  Save,
  Check,
  Cpu,
} from 'lucide-react';
import { UserProfile, ModelInfo } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onSaveProfile: (profile: Partial<UserProfile>) => void;
  temperature: number;
  setTemperature: (t: number) => void;
  systemInstruction: string;
  setSystemInstruction: (s: string) => void;
  models: ModelInfo[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSaveProfile,
  temperature,
  setTemperature,
  systemInstruction,
  setSystemInstruction,
  models,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'user' | 'models'>('ai');
  const [userName, setUserName] = useState(userProfile?.name || 'ZenG Explorer');
  const [userBio, setUserBio] = useState(
    userProfile?.preferences?.customInstructions ||
      'Software engineer and researcher working on high-performance architectures and scientific machine learning.'
  );
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveProfile({
      name: userName,
      preferences: {
        ...(userProfile?.preferences as any),
        customInstructions: userBio,
        temperature: temperature,
      },
    });
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">ZenG AI Workspace Settings</h2>
              <p className="text-xs text-slate-400">Configure neural hyper-parameters, system behavior & user context</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('ai')}
            className={`pb-2 px-3 border-b-2 font-medium transition-colors ${
              activeTab === 'ai' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            AI Engine & Tone
          </button>
          <button
            onClick={() => setActiveTab('user')}
            className={`pb-2 px-3 border-b-2 font-medium transition-colors ${
              activeTab === 'user' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            User Persona & Context
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`pb-2 px-3 border-b-2 font-medium transition-colors ${
              activeTab === 'models' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Verified Models ({models.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-sm">
          {activeTab === 'ai' && (
            <>
              {/* Temperature */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-200 text-xs">
                    Creativity / Temperature: <span className="text-cyan-400 font-mono">{temperature}</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {temperature < 0.4 ? 'Deterministic & Precise' : temperature < 0.9 ? 'Balanced Intelligence' : 'High Creativity & Exploration'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={temperature}
                  onChange={e => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>0.0 (Code/Exact)</span>
                  <span>0.7 (Standard)</span>
                  <span>1.5 (Creative)</span>
                </div>
              </div>

              {/* System Instruction */}
              <div>
                <label className="block font-semibold text-slate-200 text-xs mb-1.5">
                  Custom System Instructions
                </label>
                <textarea
                  value={systemInstruction}
                  onChange={e => setSystemInstruction(e.target.value)}
                  rows={4}
                  placeholder="e.g. Always structure coding solutions with architectural principles first, then implementation, unit tests, and performance considerations."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Applied to every conversation turn to shape how ZenG AI reasons and presents information.
                </p>
              </div>
            </>
          )}

          {activeTab === 'user' && (
            <>
              <div>
                <label className="block font-semibold text-slate-200 text-xs mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-200 text-xs mb-1.5">
                  About You (Persistent Context)
                </label>
                <textarea
                  value={userBio}
                  onChange={e => setUserBio(e.target.value)}
                  rows={4}
                  placeholder="Share your domain expertise, preferred programming languages, frameworks, or writing style..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  ZenG AI will calibrate its answers to match your background without needing you to repeat yourself.
                </p>
              </div>
            </>
          )}

          {activeTab === 'models' && (
            <div className="space-y-2.5">
              {models.map(m => (
                <div key={m.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 shrink-0 mt-0.5">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 text-xs">{m.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Operational
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{m.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-slate-400">
                      <span>Window: {m.contextWindow}</span>
                      <span>•</span>
                      <span>Output Limit: {m.maxOutputTokens} tokens</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Changes saved to persistent workspace profile.
          </span>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
          >
            {savedNotice ? <Check className="w-4 h-4 text-emerald-200" /> : <Save className="w-4 h-4" />}
            <span>{savedNotice ? 'Saved!' : 'Save Preferences'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
