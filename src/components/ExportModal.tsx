import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  Printer,
  Code,
  Check,
  FileDown,
} from 'lucide-react';
import { Conversation } from '../types';
import {
  exportConversationToMarkdown,
  exportConversationToText,
  exportConversationToJSON,
  exportConversationToHTML,
  exportConversationToWord,
  downloadBlob,
} from '../services/exportService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  conversation,
}) => {
  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);

  if (!isOpen || !conversation) return null;

  const baseFilename = (conversation.title || 'zeng-ai-conversation')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30);

  const handleDownload = (format: 'doc' | 'md' | 'txt' | 'json' | 'html') => {
    let content = '';
    let mimeType = 'text/plain';
    let ext = format;

    if (format === 'doc') {
      content = exportConversationToWord(conversation);
      mimeType = 'application/msword';
      ext = 'doc';
    } else if (format === 'md') {
      content = exportConversationToMarkdown(conversation);
      mimeType = 'text/markdown';
    } else if (format === 'txt') {
      content = exportConversationToText(conversation);
    } else if (format === 'json') {
      content = exportConversationToJSON(conversation);
      mimeType = 'application/json';
    } else if (format === 'html') {
      content = exportConversationToHTML(conversation);
      mimeType = 'text/html';
    }

    downloadBlob(content, `${baseFilename}.${ext}`, mimeType);
    setDownloadedFormat(format);
    setTimeout(() => setDownloadedFormat(null), 2500);
  };

  const handlePrint = () => {
    const html = exportConversationToHTML(conversation);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export Conversation</h2>
              <p className="text-xs text-slate-400">Download formatted MS Word document, Markdown, or PDF</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Options */}
        <div className="p-5 space-y-2.5">
          {/* Microsoft Word (Primary Featured Option) */}
          <button
            onClick={() => handleDownload('doc')}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-blue-950/70 to-slate-950/80 hover:from-blue-900/60 hover:to-slate-900 border border-blue-600/40 hover:border-blue-500 transition-all text-left shadow-lg shadow-blue-950/20 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/30 shrink-0">
                W
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white text-xs">Microsoft Word (.docx / .doc)</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 uppercase tracking-wider">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Native Word document with styled typography, tables, and citations
                </p>
              </div>
            </div>
            {downloadedFormat === 'doc' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Download className="w-4 h-4 text-blue-400 group-hover:translate-y-0.5 transition-transform" />
            )}
          </button>

          {/* Markdown */}
          <button
            onClick={() => handleDownload('md')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-950/50 border border-cyan-800/60 text-cyan-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-200 text-xs">Markdown (.md)</p>
                <p className="text-[11px] text-slate-400">Includes headers, code blocks, and bibliography</p>
              </div>
            </div>
            {downloadedFormat === 'md' ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Formatted HTML */}
          <button
            onClick={() => handleDownload('html')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-950/50 border border-indigo-800/60 text-indigo-400">
                <FileDown className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-200 text-xs">Formatted Web Document (.html)</p>
                <p className="text-[11px] text-slate-400">Self-contained styled document ready for browser viewing</p>
              </div>
            </div>
            {downloadedFormat === 'html' ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Print / Save to PDF */}
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-emerald-400">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-200 text-xs">Print / Save to PDF</p>
                <p className="text-[11px] text-slate-400">Opens print dialog formatted for Letter / A4 PDF saving</p>
              </div>
            </div>
            <Printer className="w-4 h-4 text-slate-500" />
          </button>

          {/* JSON */}
          <button
            onClick={() => handleDownload('json')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-950/50 border border-purple-800/60 text-purple-400">
                <Code className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-200 text-xs">JSON Schema (.json)</p>
                <p className="text-[11px] text-slate-400">Turn-by-turn messages, timestamps & tool metadata</p>
              </div>
            </div>
            {downloadedFormat === 'json' ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4 text-slate-500" />}
          </button>
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
