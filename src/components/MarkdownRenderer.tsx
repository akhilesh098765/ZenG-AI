import React from 'react';
import katex from 'katex';
import { CodeBlock } from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Split into code blocks and normal markdown segments
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]+)?(?:\s+([^\n]+))?\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push(renderTextAndMath(textBefore, `text-${lastIndex}`));
    }

    const language = match[1] || 'plaintext';
    const filename = match[2];
    const code = match[3] || '';

    parts.push(
      <CodeBlock
        key={`code-${match.index}`}
        language={language}
        filename={filename}
        code={code.trimEnd()}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  const remaining = content.substring(lastIndex);
  if (remaining) {
    parts.push(renderTextAndMath(remaining, `text-${lastIndex}`));
  }

  return <div className="space-y-3 leading-relaxed text-slate-200">{parts}</div>;
};

// Render text, math blocks ($$ and $), headings, lists, tables, links
function renderTextAndMath(text: string, keyPrefix: string): React.ReactNode {
  // First, handle block math: $$ formula $$
  const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
  const segments: React.ReactNode[] = [];
  let lastIdx = 0;
  let mathMatch: RegExpExecArray | null;

  while ((mathMatch = blockMathRegex.exec(text)) !== null) {
    const prev = text.substring(lastIdx, mathMatch.index);
    if (prev) {
      segments.push(parseMarkdownParagraphs(prev, `${keyPrefix}-seg-${lastIdx}`));
    }

    const formula = mathMatch[1].trim();
    let renderedMath = formula;
    try {
      renderedMath = katex.renderToString(formula, { displayMode: true, throwOnError: false });
    } catch (e) {
      console.warn('KaTeX block error:', e);
    }

    segments.push(
      <div
        key={`${keyPrefix}-math-${mathMatch.index}`}
        className="my-3 p-3 overflow-x-auto rounded-lg bg-slate-900/60 border border-slate-800 text-center text-cyan-200"
        dangerouslySetInnerHTML={{ __html: renderedMath }}
      />
    );

    lastIdx = mathMatch.index + mathMatch[0].length;
  }

  const remainingText = text.substring(lastIdx);
  if (remainingText) {
    segments.push(parseMarkdownParagraphs(remainingText, `${keyPrefix}-seg-${lastIdx}`));
  }

  return <React.Fragment key={keyPrefix}>{segments}</React.Fragment>;
}

function parseMarkdownParagraphs(raw: string, keyPrefix: string): React.ReactNode {
  const lines = raw.split('\n');
  const elements: React.ReactNode[] = [];
  let tableLines: string[] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table detection: line contains |
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      inTable = true;
      tableLines.push(line);
      continue;
    } else if (inTable) {
      elements.push(renderMarkdownTable(tableLines, `${keyPrefix}-tbl-${i}`));
      tableLines = [];
      inTable = false;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`${keyPrefix}-h3-${i}`} className="text-lg font-semibold text-slate-100 mt-4 mb-2">
          {renderInline(line.replace('### ', ''))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`${keyPrefix}-h2-${i}`} className="text-xl font-bold text-white mt-5 mb-2.5 pb-1 border-b border-slate-800">
          {renderInline(line.replace('## ', ''))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`${keyPrefix}-h1-${i}`} className="text-2xl font-extrabold text-white mt-6 mb-3">
          {renderInline(line.replace('# ', ''))}
        </h1>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={`${keyPrefix}-bq-${i}`} className="border-l-4 border-cyan-500/80 bg-slate-900/40 pl-3.5 py-1.5 rounded-r my-2 text-slate-300 italic">
          {renderInline(line.replace('> ', ''))}
        </blockquote>
      );
      continue;
    }

    // Horizontal Rule
    if (/^(\*\*\*|---|___)$/.test(line.trim())) {
      elements.push(<hr key={`${keyPrefix}-hr-${i}`} className="border-slate-800 my-4" />);
      continue;
    }

    // List items
    if (/^\s*[-*]\s+/.test(line)) {
      const content = line.replace(/^\s*[-*]\s+/, '');
      elements.push(
        <div key={`${keyPrefix}-li-${i}`} className="flex items-start gap-2.5 my-1 ml-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
          <div>{renderInline(content)}</div>
        </div>
      );
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^\s*(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`${keyPrefix}-oli-${i}`} className="flex items-start gap-2.5 my-1 ml-2">
          <span className="font-mono text-xs text-cyan-400/90 font-bold mt-1 shrink-0">
            {numMatch[1]}.
          </span>
          <div>{renderInline(numMatch[2])}</div>
        </div>
      );
      continue;
    }

    // Regular paragraph
    if (line.trim().length > 0) {
      elements.push(
        <p key={`${keyPrefix}-p-${i}`} className="my-1.5">
          {renderInline(line)}
        </p>
      );
    }
  }

  if (inTable && tableLines.length > 0) {
    elements.push(renderMarkdownTable(tableLines, `${keyPrefix}-tbl-end`));
  }

  return <React.Fragment key={keyPrefix}>{elements}</React.Fragment>;
}

// Table renderer
function renderMarkdownTable(lines: string[], key: string): React.ReactNode {
  if (lines.length < 2) return null;

  const headerCells = lines[0].split('|').map(s => s.trim()).filter(Boolean);
  // Row 1 is usually divider |---|---|
  const dataRows = lines.slice(2).map(row => row.split('|').map(s => s.trim()).filter(Boolean));

  return (
    <div key={key} className="my-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-md">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-800/80 text-xs font-semibold uppercase text-slate-200 border-b border-slate-700">
          <tr>
            {headerCells.map((th, idx) => (
              <th key={idx} className="px-4 py-2.5">{renderInline(th)}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {dataRows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-4 py-2.5">{renderInline(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Inline formatting: inline math ($formula$), bold (**), italic (*), code (`code`), links ([text](url))
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  
  // Regex to catch inline math $...$ first, then code `...`
  const tokenRegex = /(\$[^$\n]+\$|`[^`\n]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    const key = `token-${match.index}`;

    // Inline Math: $...$
    if (token.startsWith('$') && token.endsWith('$')) {
      const formula = token.slice(1, -1);
      let rendered = formula;
      try {
        rendered = katex.renderToString(formula, { displayMode: false, throwOnError: false });
      } catch (e) {
        // fallback
      }
      parts.push(
        <span
          key={key}
          className="inline-math text-cyan-300 font-mono px-1 rounded bg-slate-900/70"
          dangerouslySetInnerHTML={{ __html: rendered }}
        />
      );
    }
    // Inline Code: `...`
    else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={key} className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[13px] border border-slate-700/60">
          {token.slice(1, -1)}
        </code>
      );
    }
    // Bold: **...**
    else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={key} className="font-bold text-slate-100">
          {token.slice(2, -2)}
        </strong>
      );
    }
    // Italic: *...*
    else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={key} className="italic text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    }
    // Link: [text](url)
    else if (token.startsWith('[') && token.includes('](')) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={key}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 decoration-cyan-500/50 hover:decoration-cyan-400 transition-colors"
          >
            {linkMatch[1]}
          </a>
        );
      }
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
