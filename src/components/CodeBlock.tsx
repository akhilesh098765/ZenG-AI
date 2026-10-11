import React, { useState } from 'react';
import { Check, Copy, Play, Code2, Eye } from 'lucide-react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

interface CodeBlockProps {
  language: string;
  code: string;
  filename?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code, filename }) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');

  const normalizedLang = (language || 'plaintext').toLowerCase().trim();
  const canPreview = ['html', 'svg', 'javascript', 'js'].includes(normalizedLang);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getHighlightedCode = () => {
    try {
      if (hljs.getLanguage(normalizedLang)) {
        return hljs.highlight(code, { language: normalizedLang }).value;
      }
      return hljs.highlightAuto(code).value;
    } catch {
      return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  };

  // Safe iframe srcdoc for interactive sandbox preview
  const previewHtml = normalizedLang === 'svg'
    ? `<div style="display:flex;justify-content:center;align-items:center;min-height:100vh;background:#090d16;padding:20px;">${code}</div>`
    : normalizedLang === 'html'
    ? code
    : `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif;color:#f8fafc;background:#0f172a;padding:16px;margin:0;}</style></head><body><div id="output"></div><script>try{const log=(...a)=>{document.getElementById('output').innerHTML+='<div>'+a.join(' ')+'</div>'};console.log=log;${code}}catch(e){document.getElementById('output').innerHTML='<span style="color:#ef4444">'+e+'</span>'}</script></body></html>`;

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950/90 shadow-xl group">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 mr-1">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/50">
            {language || 'code'}
          </span>
          {filename && <span className="text-slate-400 font-sans">{filename}</span>}
        </div>

        <div className="flex items-center gap-2">
          {canPreview && (
            <div className="flex bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60">
              <button
                onClick={() => setViewMode('code')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-sans transition-colors ${
                  viewMode === 'code' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                Code
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-sans transition-colors ${
                  viewMode === 'preview' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Live Preview
              </button>
            </div>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
            title="Copy Code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-sans text-xs">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="font-sans text-xs">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code or Live Preview View */}
      {viewMode === 'code' ? (
        <div className="relative overflow-x-auto p-4 text-[13px] leading-relaxed font-mono">
          <pre className="!bg-transparent !p-0 !m-0">
            <code
              className={`hljs language-${normalizedLang}`}
              dangerouslySetInnerHTML={{ __html: getHighlightedCode() }}
            />
          </pre>
        </div>
      ) : (
        <div className="bg-slate-900 p-2 min-h-[180px]">
          <iframe
            srcDoc={previewHtml}
            sandbox="allow-scripts"
            className="w-full h-64 rounded border border-slate-800 bg-white"
            title="Code Sandbox Preview"
          />
        </div>
      )}
    </div>
  );
};
