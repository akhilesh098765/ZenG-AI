import React, { useRef, useEffect, useState } from 'react';
import {
  Sparkles,
  Code2,
  BookOpen,
  BarChart3,
  Lightbulb,
  ArrowDown,
  Layers,
  FileCode,
  Compass,
} from 'lucide-react';
import { Message, ModelId } from '../types';
import { MessageItem } from './MessageItem';
import { ZILogo } from './BrandLogo';

interface ChatAreaProps {
  messages: Message[];
  isGenerating: boolean;
  onRegenerate: () => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onSelectPrompt: (promptText: string) => void;
  modelId: ModelId;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isGenerating,
  onRegenerate,
  onEditMessage,
  onSelectPrompt,
  modelId,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Auto-scroll on new messages or streaming chunks
  useEffect(() => {
    if (!showScrollBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating, showScrollBottom]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShowScrollBottom(!isAtBottom);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  const PROMPT_STARTERS = [
    {
      icon: <Code2 className="w-4 h-4 text-cyan-400" />,
      category: 'Software Engineering',
      title: 'Scaffold Full-Stack Architecture',
      prompt: 'Design a high-concurrency microservices architecture in Node.js and TypeScript, detailing event-driven patterns and Redis caching.',
    },
    {
      icon: <BookOpen className="w-4 h-4 text-indigo-400" />,
      category: 'Academic Research',
      title: 'Literature Review & Synthesis',
      prompt: 'Formulate a comprehensive literature review outline on Quantum Machine Learning advances in molecular dynamics, citing key methodological paradigms.',
    },
    {
      icon: <BarChart3 className="w-4 h-4 text-emerald-400" />,
      category: 'Data Intelligence',
      title: 'Statistical Data Analysis',
      prompt: 'Explain how to identify and impute non-random missing data in longitudinal clinical trials using Bayesian estimation with sample code.',
    },
    {
      icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
      category: 'Strategic Brainstorming',
      title: 'Executive Product Strategy',
      prompt: 'Draft an executive pitch for an AI-native developer operating system, outlining the target TAM, moat differentiation, and go-to-market milestones.',
    },
  ];

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto relative flex flex-col"
    >
      {messages.length === 0 ? (
        /* Welcome Hero Screen */
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-3xl mx-auto my-auto text-center">
          {/* Colorful ZI Emblem */}
          <div className="mb-6 flex justify-center">
            <ZILogo size="xl" showText={false} />
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
            Where Intelligence Meets Clarity
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Welcome to <span className="text-cyan-400 font-semibold">ZenG AI</span> — your multimodal cognitive workstation.
            Synthesize code, research academic repositories, analyze complex data, and ground insights with real-world accuracy.
          </p>

          {/* Quick Starter Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
            {PROMPT_STARTERS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPrompt(item.prompt)}
                className="group p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 shadow-lg hover:shadow-cyan-500/10 transition-all text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 group-hover:border-slate-700">
                      {item.icon}
                    </div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.prompt}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Explore Prompt</span>
                  <span>→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Conversation Turns */
        <div className="flex-1 pb-4">
          {messages.map((msg, index) => (
            <MessageItem
              key={msg.id || index}
              message={msg}
              onRegenerate={onRegenerate}
              onEdit={newContent => onEditMessage(msg.id, newContent)}
              isLatestAssistant={index === messages.length - 1 && msg.role === 'assistant'}
            />
          ))}

          {/* Invisible anchor for auto-scrolling */}
          <div ref={bottomRef} className="h-4" />
        </div>
      )}

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-8 p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 shadow-2xl border border-slate-700 transition-all hover:scale-110 z-20"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
