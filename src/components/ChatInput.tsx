import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Globe,
  BookOpen,
  Mic,
  MicOff,
  X,
  FileText,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { Attachment } from '../types';
import { parseDocument } from '../services/api';

interface ChatInputProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  onStop?: () => void;
  isGenerating?: boolean;
  enableWebSearch: boolean;
  setEnableWebSearch: (val: boolean) => void;
  enableResearchMode: boolean;
  setEnableResearchMode: (val: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onStop,
  isGenerating = false,
  enableWebSearch,
  setEnableWebSearch,
  enableResearchMode,
  setEnableResearchMode,
  placeholder = 'Ask ZenG AI anything, analyze code, research papers, or upload files...',
  disabled = false,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea as text grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 48), 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((input.trim() || attachments.length > 0) && !isGenerating && !disabled) {
      onSend(input.trim(), attachments);
      setInput('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = '48px';
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newAttachments: Attachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const att = await parseDocument(file);
        newAttachments.push(att);
      }
      setAttachments(prev => [...prev, ...newAttachments]);
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Speech to text toggle using Web Speech API
  const toggleRecording = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech Recognition is not supported by your current browser.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
    } else {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsRecording(true);
        recognition.onend = () => setIsRecording(false);
        recognition.onerror = () => setIsRecording(false);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
          }
        };

        recognition.start();
      } catch (err) {
        console.error('Speech recognition error:', err);
        setIsRecording(false);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      {/* Attachment previews bar */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
          {attachments.map(att => (
            <div
              key={att.id}
              className="relative flex items-center gap-2 pl-2 pr-7 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-slate-200"
            >
              {att.type === 'image' && att.base64 ? (
                <img src={att.base64} alt={att.name} className="w-6 h-6 object-cover rounded" />
              ) : (
                <FileText className="w-4 h-4 text-cyan-400" />
              )}
              <span className="max-w-[140px] truncate">{att.name}</span>
              <button
                onClick={() => removeAttachment(att.id)}
                className="absolute right-1.5 p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main input wrapper */}
      <div className="relative rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 focus-within:border-cyan-500/60 focus-within:ring-2 focus-within:ring-cyan-500/20 shadow-2xl backdrop-blur-xl transition-all">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.csv,.json,.md,.docx,.xlsx"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isGenerating}
          rows={1}
          className="w-full px-4 pt-3.5 pb-2 bg-transparent text-slate-100 placeholder-slate-500 text-sm md:text-base resize-none focus:outline-none max-h-[220px]"
        />

        {/* Action and toggles bar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-t border-slate-800/40">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isGenerating}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors border border-slate-700/50"
              title="Attach files (PDF, images, CSV, docs)"
            >
              <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Attach</span>
            </button>

            {/* Web Search Grounding Toggle */}
            <button
              type="button"
              onClick={() => setEnableWebSearch(!enableWebSearch)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs transition-colors border ${
                enableWebSearch
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border-slate-700/50'
              }`}
              title="Ground answers with live Google Web Search"
            >
              <Globe className={`w-3.5 h-3.5 ${enableWebSearch ? 'text-cyan-400 animate-pulse' : ''}`} />
              <span>Web Search</span>
            </button>

            {/* Research Mode Toggle */}
            <button
              type="button"
              onClick={() => setEnableResearchMode(!enableResearchMode)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs transition-colors border ${
                enableResearchMode
                  ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/50 shadow-sm shadow-indigo-500/20'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border-slate-700/50'
              }`}
              title="Scholarly literature mode with arXiv & Crossref citations"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Research</span>
            </button>

            {/* Microphone dictation */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-1.5 rounded-xl text-xs transition-colors border ${
                isRecording
                  ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 animate-pulse'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border-slate-700/50'
              }`}
              title={isRecording ? 'Listening...' : 'Voice dictation'}
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline font-mono">
              {input.length} chars
            </span>

            {isGenerating ? (
              <button
                type="button"
                onClick={onStop}
                className="flex items-center justify-center w-8 h-8 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all"
                title="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={(!input.trim() && attachments.length === 0) || disabled}
                className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all shadow-md ${
                  input.trim() || attachments.length > 0
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-cyan-500/25 hover:opacity-95 cursor-pointer scale-100'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed scale-95'
                }`}
                title="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>ZenG AI may produce inaccurate info. Verify important facts & scholarly DOIs.</span>
        </div>
        <span className="hidden md:inline font-mono text-[10px]">Shift + Enter for new line</span>
      </div>
    </div>
  );
};
