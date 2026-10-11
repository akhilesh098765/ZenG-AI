import React, { useState } from 'react';
import {
  X,
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Server,
  Database,
  Cpu,
} from 'lucide-react';
import { runDiagnostics } from '../services/api';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [results, setResults] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  if (!isOpen) return null;

  const handleRunTests = async () => {
    setRunning(true);
    try {
      const data = await runDiagnostics();
      setResults(data);
      setHasRun(true);
    } catch (err: any) {
      setResults([
        {
          test: 'Diagnostics Runner',
          status: 'FAILED',
          error: err.message || 'Server error',
        },
      ]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">System Diagnostics & Health</h2>
              <p className="text-xs text-slate-400">Automated verification of AI endpoints, repositories & storage</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
          <span className="text-xs text-slate-300">
            {hasRun ? `Tests Completed (${results.length})` : 'Ready to execute system self-tests'}
          </span>
          <button
            onClick={handleRunTests}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow disabled:opacity-50 transition-colors cursor-pointer"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>{running ? 'Testing...' : 'Run Test Suite'}</span>
          </button>
        </div>

        {/* Results */}
        <div className="p-4 space-y-3 max-h-[360px] overflow-y-auto">
          {!hasRun && !running && (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Activity className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-400" />
              <p>Click "Run Test Suite" to verify live integrations.</p>
              <p className="text-slate-400 mt-1">Tests Gemini SDK, arXiv repository, and local persistence.</p>
            </div>
          )}

          {running && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
              <p>Executing live tests...</p>
            </div>
          )}

          {!running && results.map((r, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
                r.status === 'PASSED'
                  ? 'bg-emerald-950/20 border-emerald-800/40'
                  : 'bg-rose-950/20 border-rose-800/40'
              }`}
            >
              {r.status === 'PASSED' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{r.test}</span>
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      r.status === 'PASSED' ? 'bg-emerald-900/60 text-emerald-300' : 'bg-rose-900/60 text-rose-300'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                {r.output && <p className="text-slate-400 mt-1 font-mono text-[11px] truncate">Output: {r.output}</p>}
                {r.error && <p className="text-rose-400 mt-1 font-mono text-[11px]">{r.error}</p>}
                {r.conversationCount !== undefined && (
                  <p className="text-slate-400 mt-1 text-[11px]">Stored records: {r.conversationCount}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button onClick={onClose} className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
