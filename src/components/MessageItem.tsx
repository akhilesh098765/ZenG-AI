import React, { useState } from 'react';
import {
  Copy,
  Check,
  RefreshCw,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Globe,
  BookOpen,
  FileText,
  Download,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Edit3,
} from 'lucide-react';
import { Message, Attachment, Citation, AcademicPaper } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ZILogo } from './BrandLogo';
import { exportPapersToBibTeX, exportMessageToWord, downloadBlob } from '../services/exportService';

interface MessageItemProps {
  message: Message;
  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;
  isLatestAssistant?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onRegenerate,
  onEdit,
  isLatestAssistant,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(message.content);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    } else {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message.content);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSaveEdit = () => {
    if (onEdit && editDraft.trim()) {
      onEdit(editDraft.trim());
      setIsEditing(false);
    }
  };

  const handleExportBibTeX = () => {
    if (message.academicReferences && message.academicReferences.length > 0) {
      const bib = exportPapersToBibTeX(message.academicReferences);
      downloadBlob(bib, 'zeng-citations.bib', 'text/plain');
    }
  };

  const handleDownloadWord = () => {
    const docHtml = exportMessageToWord(message, 'ZenG AI Response');
    downloadBlob(docHtml, `zeng-response-${Date.now()}.doc`, 'application/msword');
  };

  return (
    <div
      className={`group w-full py-5 px-4 md:px-6 transition-colors ${
        isUser
          ? 'bg-slate-900/30'
          : 'bg-slate-900/70 border-y border-slate-800/40 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-600 border border-slate-600 flex items-center justify-center text-xs font-semibold text-white shadow">
              You
            </div>
          ) : (
            <div className="relative shrink-0">
              <ZILogo size="sm" showText={false} />
              {message.isStreaming && (
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              )}
            </div>
          )}
        </div>

        {/* Content Column */}
        <div className="flex-1 min-w-0">
          {/* Header info */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-medium text-xs text-slate-300">
                {isUser ? 'You' : 'ZenG AI'}
              </span>
              {!isUser && message.modelUsed && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700/60">
                  {message.modelUsed}
                </span>
              )}
              <span className="text-[11px] text-slate-400">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Quick action bar */}
            {!message.isStreaming && !isEditing && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isUser && onEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    title="Edit prompt"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title="Copy text"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                {!isUser && (
                  <>
                    <button
                      onClick={handleDownloadWord}
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-200 hover:bg-slate-800 transition-colors flex items-center gap-1"
                      title="Download response as Microsoft Word document (.doc/.docx)"
                    >
                      <span className="font-extrabold text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-600/40 hover:bg-blue-800/80">
                        Word
                      </span>
                    </button>

                    <button
                      onClick={toggleSpeak}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                      title={isSpeaking ? 'Stop reading' : 'Read aloud'}
                    >
                      {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-cyan-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        feedback === 'up' ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                      title="Good response"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        feedback === 'down' ? 'text-rose-400 bg-rose-950/40' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                      title="Bad response"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>

                    {isLatestAssistant && onRegenerate && (
                      <button
                        onClick={onRegenerate}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                        title="Regenerate"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Attachments (for user messages) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {message.attachments.map(att => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-200 shadow-sm"
                >
                  {att.type === 'image' && att.base64 ? (
                    <img
                      src={att.base64}
                      alt={att.name}
                      className="w-10 h-10 object-cover rounded-lg border border-slate-700"
                    />
                  ) : (
                    <FileText className="w-5 h-5 text-cyan-400 shrink-0" />
                  )}
                  <div className="max-w-[200px] truncate">
                    <p className="font-medium truncate">{att.name}</p>
                    <p className="text-[10px] text-slate-400">{(att.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Body message content or Edit mode */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editDraft}
                onChange={e => setEditDraft(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-cyan-500/50 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 min-h-[90px]"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1.5 rounded-lg text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
                >
                  Save & Resubmit
                </button>
              </div>
            </div>
          ) : (
            <div className="text-slate-200 text-sm leading-relaxed">
              <MarkdownRenderer content={message.content} />
            </div>
          )}

          {/* Generated Image Presentation */}
          {message.generatedImageUrl && (
            <div className="mt-4 rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-950 p-2 max-w-lg shadow-xl shadow-cyan-950/20">
              <img
                src={message.generatedImageUrl}
                alt="ZenG Generated Artwork"
                className="w-full h-auto rounded-xl object-cover hover:scale-[1.01] transition-transform"
              />
              <div className="flex items-center justify-between mt-2 px-2 py-1">
                <span className="text-xs text-slate-400 font-mono">Synthesized with ZenG Image Engine</span>
                <a
                  href={message.generatedImageUrl}
                  download="zeng-ai-artwork.png"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
              </div>
            </div>
          )}

          {/* Citations & Web Grounding Panel */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 mb-2">
                <Globe className="w-3.5 h-3.5" />
                <span>Live Grounded Sources ({message.citations.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {message.citations.map((c, idx) => (
                  <a
                    key={idx}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition-all text-xs group/card"
                  >
                    <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                      <span className="truncate max-w-[140px] font-mono">{c.source || 'Web'}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover/card:text-cyan-400" />
                    </div>
                    <span className="text-slate-200 font-medium line-clamp-2 leading-snug group-hover/card:text-cyan-300">
                      {c.title || c.url}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Academic Literature Panel (Real DOI/arXiv references) */}
          {message.academicReferences && message.academicReferences.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Peer-Reviewed & Pre-print Academic References ({message.academicReferences.length})</span>
                </div>
                <button
                  onClick={handleExportBibTeX}
                  className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline"
                >
                  <Download className="w-3 h-3" />
                  Export .bib
                </button>
              </div>

              <div className="space-y-2">
                {message.academicReferences.map((paper, idx) => (
                  <div
                    key={paper.id || idx}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 text-xs transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-slate-200 leading-snug">
                        {paper.title}
                      </h4>
                      <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                        {paper.source}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ' et al.' : ''} • ({paper.year})
                      {paper.journalOrVenue && ` • ${paper.journalOrVenue}`}
                    </p>
                    {paper.abstract && (
                      <p className="text-slate-300 text-[11px] mt-1.5 line-clamp-2 italic leading-relaxed">
                        "{paper.abstract}"
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[11px]">
                      {paper.doi && (
                        <span className="font-mono text-slate-400">DOI: {paper.doi}</span>
                      )}
                      {paper.url && (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:underline flex items-center gap-0.5 ml-auto font-medium"
                        >
                          View Source <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {message.isError && (
            <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{message.errorMessage || 'An error occurred during generation.'}</span>
              </div>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="px-2.5 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-white font-medium text-xs transition-colors shrink-0"
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
