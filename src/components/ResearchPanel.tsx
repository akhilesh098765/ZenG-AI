import React, { useState } from 'react';
import {
  X,
  Search,
  BookOpen,
  ExternalLink,
  Download,
  Copy,
  Check,
  Send,
  Loader2,
  FileText,
} from 'lucide-react';
import { AcademicPaper } from '../types';
import { searchResearchPapers } from '../services/api';
import { exportPapersToBibTeX, downloadBlob } from '../services/exportService';

interface ResearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (prompt: string, papers: AcademicPaper[]) => void;
}

export const ResearchPanel: React.FC<ResearchPanelProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [query, setQuery] = useState('');
  const [papers, setPapers] = useState<AcademicPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [citationFormat, setCitationFormat] = useState<'APA' | 'IEEE' | 'MLA' | 'BibTeX'>('APA');

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await searchResearchPapers(query.trim(), 8);
      setPapers(res.papers);
      if (res.papers.length === 0) {
        setError('No peer-reviewed papers or pre-prints found for this query.');
      }
    } catch (err: any) {
      setError(err.message || 'Scholarly query failed.');
    } finally {
      setLoading(false);
    }
  };

  const formatCitation = (p: AcademicPaper, format: 'APA' | 'IEEE' | 'MLA' | 'BibTeX'): string => {
    const authors = p.authors.join(', ');
    const firstAuthor = p.authors[0] || 'Author';
    switch (format) {
      case 'APA':
        return `${authors} (${p.year}). ${p.title}. ${p.journalOrVenue || p.source}.${p.doi ? ` https://doi.org/${p.doi}` : ''}`;
      case 'IEEE':
        return `[1] ${authors}, "${p.title}," ${p.journalOrVenue || p.source}, ${p.year}.${p.doi ? ` doi: ${p.doi}` : ''}`;
      case 'MLA':
        return `${firstAuthor}, et al. "${p.title}." ${p.journalOrVenue || p.source}, ${p.year}.`;
      case 'BibTeX':
        return `@article{${firstAuthor.split(' ')[0]}${p.year},\n  title={${p.title}},\n  author={${authors}},\n  year={${p.year}},\n  journal={${p.journalOrVenue || p.source}}\n}`;
    }
  };

  const copyCitation = (p: AcademicPaper) => {
    const text = formatCitation(p, citationFormat);
    navigator.clipboard.writeText(text);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadAllBibTeX = () => {
    if (papers.length === 0) return;
    const bib = exportPapersToBibTeX(papers);
    downloadBlob(bib, `zeng-research-${query.slice(0, 15).replace(/\s+/g, '-')}.bib`, 'text/plain');
  };

  const handleSynthesizeAll = () => {
    const prompt = `Synthesize a comprehensive academic review of these ${papers.length} scholarly papers regarding "${query}". Formulate research gaps, methodological comparisons, and formal citations:\n\n${papers.map((p, idx) => `[${idx + 1}] "${p.title}" by ${p.authors.join(', ')} (${p.year})\nAbstract: ${p.abstract}\nDOI: ${p.doi || 'N/A'}`).join('\n\n')}`;
    onSendToChat(prompt, papers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                ZenG Academic Research Lab
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  arXiv + Crossref
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Search verified pre-prints & publications with DOI resolution and citation exports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar & Citation format selector */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearch} className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by topic, paper title, author, or keyword (e.g. quantum neural networks)..."
              className="w-full pl-10 pr-24 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-1.5 top-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
            </button>
          </form>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-xs text-slate-400 font-mono">Format:</span>
            <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
              {(['APA', 'IEEE', 'MLA', 'BibTeX'] as const).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setCitationFormat(fmt)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    citationFormat === fmt ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            {papers.length > 0 && (
              <button
                onClick={handleDownloadAllBibTeX}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors shrink-0"
                title="Download all as .bib"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .bib</span>
              </button>
            )}
          </div>
        </div>

        {/* Papers list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
              <p className="text-sm font-medium">Querying scholarly databases (arXiv & Crossref)...</p>
            </div>
          )}

          {!loading && error && (
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-300 text-sm text-center">
              {error}
            </div>
          )}

          {!loading && !error && papers.length === 0 && (
            <div className="text-center py-20 text-slate-500 text-sm">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-400" />
              <p className="font-medium text-slate-400">Enter a scholarly research topic above.</p>
              <p className="text-xs text-slate-400 mt-1">Real academic papers with DOIs will be retrieved and formatted.</p>
            </div>
          )}

          {!loading && papers.map(paper => (
            <div
              key={paper.id}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-slate-100 text-sm leading-snug">
                  {paper.title}
                </h3>
                <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {paper.source}
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-1">
                {paper.authors.join(', ')} • ({paper.year}) • {paper.journalOrVenue}
              </p>

              {paper.abstract && (
                <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                  {paper.abstract}
                </p>
              )}

              {/* Formatted Citation Preview */}
              <div className="mt-2.5 p-2 rounded bg-slate-900/40 border border-slate-800 text-[11px] font-mono text-indigo-200/90 truncate">
                {formatCitation(paper, citationFormat)}
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-3 text-xs">
                  {paper.doi && <span className="font-mono text-slate-400 text-[11px]">DOI: {paper.doi}</span>}
                  {paper.url && (
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-medium text-[11px]"
                    >
                      Original Source <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyCitation(paper)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                  >
                    {copiedId === paper.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy {citationFormat}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      const prompt = `Synthesize this academic paper:\n\nTitle: ${paper.title}\nAuthors: ${paper.authors.join(', ')} (${paper.year})\nAbstract: ${paper.abstract}\nDOI: ${paper.doi || 'N/A'}\n\nPlease provide: 1) Core methodology & findings, 2) Research implications, 3) Critical evaluation, 4) Citation in APA & BibTeX.`;
                      onSendToChat(prompt, [paper]);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Deep Synthesize</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer synthesis action */}
        {papers.length > 0 && (
          <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {papers.length} scholarly papers retrieved from arXiv and Crossref
            </span>
            <button
              onClick={handleSynthesizeAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-opacity"
            >
              <FileText className="w-4 h-4" />
              <span>Synthesize All in ZenG AI Chat</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
