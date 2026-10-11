import React, { useState } from 'react';
import {
  X,
  Upload,
  BarChart3,
  PieChart,
  Table as TableIcon,
  Code,
  Send,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';

interface DataAnalysisPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (prompt: string) => void;
}

interface ColumnStat {
  name: string;
  type: 'numeric' | 'categorical' | 'date';
  missingCount: number;
  uniqueValues: number;
  min?: number;
  max?: number;
  mean?: number;
}

export const DataAnalysisPanel: React.FC<DataAnalysisPanelProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [dataInput, setDataInput] = useState(
    `Month,Revenue,Expenses,Users,ChurnRate\nJan,125000,98000,4200,2.1\nFeb,138000,102000,4650,1.9\nMar,154000,108000,5120,2.0\nApr,162000,115000,5800,1.8\nMay,185000,122000,6420,1.5\nJun,210000,131000,7200,1.4`
  );
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [columnStats, setColumnStats] = useState<ColumnStat[]>([]);
  const [activeTab, setActiveTab] = useState<'table' | 'visual' | 'code'>('table');
  const [selectedNumCol, setSelectedNumCol] = useState<string>('');

  if (!isOpen) return null;

  const handleAnalyze = () => {
    try {
      const lines = dataInput.trim().split('\n').filter(l => l.trim().length > 0);
      if (lines.length < 2) return;

      const parsedHeaders = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      const parsedRows = lines.slice(1).map(line =>
        line.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''))
      );

      setHeaders(parsedHeaders);
      setRows(parsedRows);

      // Compute stats for each column
      const stats: ColumnStat[] = parsedHeaders.map((header, colIdx) => {
        const values = parsedRows.map(r => r[colIdx]);
        const nonNullValues = values.filter(v => v !== undefined && v !== '' && v !== 'null');
        const missingCount = values.length - nonNullValues.length;
        const uniqueValues = new Set(nonNullValues).size;

        const numValues = nonNullValues
          .map(v => parseFloat(v))
          .filter(v => !isNaN(v));

        const isNumeric = numValues.length > nonNullValues.length * 0.8 && numValues.length > 0;

        if (isNumeric) {
          const min = Math.min(...numValues);
          const max = Math.max(...numValues);
          const sum = numValues.reduce((a, b) => a + b, 0);
          const mean = sum / numValues.length;
          return {
            name: header,
            type: 'numeric',
            missingCount,
            uniqueValues,
            min,
            max,
            mean,
          };
        }

        return {
          name: header,
          type: 'categorical',
          missingCount,
          uniqueValues,
        };
      });

      setColumnStats(stats);
      const firstNum = stats.find(s => s.type === 'numeric');
      if (firstNum) setSelectedNumCol(firstNum.name);
    } catch (err) {
      console.error('Data analysis parsing error:', err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      if (content) {
        setDataInput(content);
      }
    };
    reader.readAsText(file);
  };

  const handleSendInsightsToChat = () => {
    const summary = `Perform in-depth statistical data analysis and exploratory modeling for this dataset (${rows.length} rows, ${headers.length} attributes):\n\nHeaders: ${headers.join(', ')}\n\nColumn Summaries:\n${columnStats.map(s => `- ${s.name} (${s.type}): missing=${s.missingCount}, unique=${s.uniqueValues}${s.min !== undefined ? `, min=${s.min}, max=${s.max}, mean=${s.mean?.toFixed(2)}` : ''}`).join('\n')}\n\nSample Data:\n${dataInput.slice(0, 1500)}\n\nPlease provide: 1) Executive statistical observations, 2) Data distribution & anomalies, 3) Recommended predictive models, 4) Production Python Pandas / Scikit-Learn code.`;
    onSendToChat(summary);
    onClose();
  };

  // SVG Chart rendering for numerical column
  const numColStat = columnStats.find(s => s.name === selectedNumCol);
  const numColIndex = headers.indexOf(selectedNumCol);
  const chartData = rows.map((r, i) => ({
    label: headers[0] ? r[0] : `#${i + 1}`,
    value: parseFloat(r[numColIndex]) || 0,
  })).filter(d => !isNaN(d.value));

  const maxVal = Math.max(...chartData.map(d => d.value), 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                ZenG Data Intelligence Studio
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  CSV / Tabular
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Statistical summaries, missing-value heuristics, dynamic charting & Pandas workflows
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

        {/* Input / Upload section */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 font-mono">
              Raw CSV / Tabular Data Input
            </span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer border border-slate-700 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload CSV</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleAnalyze}
                className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Compute Statistics
              </button>
            </div>
          </div>
          <textarea
            value={dataInput}
            onChange={e => setDataInput(e.target.value)}
            rows={3}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 resize-none"
            placeholder="Paste comma-separated data with headers here..."
          />
        </div>

        {/* Navigation Tabs */}
        {headers.length > 0 && (
          <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setActiveTab('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'table' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                Table View ({rows.length} rows)
              </button>
              <button
                onClick={() => setActiveTab('visual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'visual' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Interactive Charts
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'code' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                Python Script
              </button>
            </div>

            <button
              onClick={handleSendInsightsToChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-semibold shadow hover:opacity-95 transition-opacity"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask ZenG AI to Analyze</span>
            </button>
          </div>
        )}

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4">
          {headers.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-sm">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-30 text-cyan-400" />
              <p className="font-medium text-slate-400">Click "Compute Statistics" above to analyze the dataset.</p>
            </div>
          ) : activeTab === 'table' ? (
            <div className="space-y-4">
              {/* Column Stats Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {columnStats.map(stat => (
                  <div key={stat.name} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-200 truncate">{stat.name}</span>
                      <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-800 text-cyan-300">
                        {stat.type}
                      </span>
                    </div>
                    {stat.mean !== undefined ? (
                      <div className="space-y-0.5 text-slate-400 text-[11px] font-mono mt-1">
                        <div>Mean: <span className="text-slate-200">{stat.mean.toFixed(2)}</span></div>
                        <div>Range: [{stat.min}, {stat.max}]</div>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-[11px] font-mono mt-1">
                        Uniques: <span className="text-slate-200">{stat.uniqueValues}</span>
                      </div>
                    )}
                    {stat.missingCount > 0 && (
                      <div className="text-amber-400 text-[10px] flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3" />
                        {stat.missingCount} missing
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-md">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-[11px] font-semibold uppercase text-slate-300 border-b border-slate-700">
                    <tr>
                      {headers.map((h, i) => (
                        <th key={i} className="px-3 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-800/30">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-2">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'visual' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Plot Metric:</span>
                <select
                  value={selectedNumCol}
                  onChange={e => setSelectedNumCol(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  {columnStats.filter(s => s.type === 'numeric').map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Interactive SVG Bar Chart */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <h4 className="text-xs font-semibold text-slate-300 mb-4 font-mono">
                  Distribution of {selectedNumCol} across {headers[0] || 'Records'}
                </h4>
                <div className="h-64 flex items-end gap-2 sm:gap-4 pt-4 border-b border-l border-slate-800 px-2 pb-1">
                  {chartData.map((d, i) => {
                    const heightPercent = Math.max(5, (d.value / maxVal) * 100);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                        {/* Tooltip */}
                        <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-cyan-300 text-[10px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                          {d.label}: {d.value}
                        </div>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-cyan-600 to-indigo-500 group-hover:from-cyan-400 group-hover:to-indigo-400 transition-all shadow-md"
                        />
                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[50px]">
                          {d.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Python / Pandas Code */
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Load data into DataFrame
data = """${dataInput.slice(0, 500)}..."""
from io import StringIO
df = pd.read_csv(StringIO(data))

# Descriptive Statistics
print("=== SHAPE ===")
print(df.shape)

print("\\n=== SUMMARY STATISTICS ===")
print(df.describe())

print("\\n=== MISSING VALUES ===")
print(df.isnull().sum())

# Correlation Matrix (Numerical attributes)
numerical_cols = df.select_dtypes(include=[np.number]).columns
if len(numerical_cols) > 1:
    plt.figure(figsize=(8, 6))
    sns.heatmap(df[numerical_cols].corr(), annot=True, cmap="coolwarm")
    plt.title("Correlation Matrix")
    plt.show()
`}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
