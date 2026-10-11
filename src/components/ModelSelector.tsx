import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Sparkles, Cpu, Zap, Image as ImageIcon } from 'lucide-react';
import { ModelId, ModelInfo } from '../types';
import { ZILogo } from './BrandLogo';

interface ModelSelectorProps {
  currentModelId: ModelId;
  onSelectModel: (id: ModelId) => void;
  models: ModelInfo[];
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  currentModelId,
  onSelectModel,
  models,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentModel = models.find(m => m.id === currentModelId) || models[0];

  const getModelIcon = (id: ModelId) => {
    if (id.includes('image')) return <ImageIcon className="w-4 h-4 text-pink-400" />;
    if (id.includes('pro')) return <Cpu className="w-4 h-4 text-purple-400" />;
    if (id.includes('lite')) return <Zap className="w-4 h-4 text-amber-400" />;
    return <ZILogo size="xs" showText={false} />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs md:text-sm font-medium transition-all shadow-sm"
      >
        {getModelIcon(currentModelId)}
        <span className="font-semibold">{currentModel?.name.split(' (')[0] || currentModelId}</span>
        <span className="hidden sm:inline text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
          {currentModel?.badge}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 md:w-96 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-slate-800/80">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Select Neural Architecture
            </p>
          </div>

          <div className="space-y-1 max-h-[380px] overflow-y-auto p-1">
            {models.map(model => {
              const isSelected = model.id === currentModelId;
              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 border ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                      : 'hover:bg-slate-800/50 border-transparent'
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
                    {getModelIcon(model.id)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-200 text-sm truncate">
                        {model.name}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                    </div>

                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {model.description}
                    </p>

                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {model.contextWindow}
                      </span>
                      {model.supportsVision && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                          Vision
                        </span>
                      )}
                      {model.supportsWebSearch && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 text-emerald-400 border border-slate-800">
                          Web Grounded
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
