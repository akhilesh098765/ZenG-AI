import { Conversation, Message, AcademicPaper } from '../types';

export function exportConversationToMarkdown(conv: Conversation): string {
  let md = `# ${conv.title || 'ZenG AI Conversation'}\n\n`;
  md += `*Exported from ZenG AI on ${new Date().toLocaleString()}*\n`;
  md += `*Model: ${conv.modelId}*\n\n---\n\n`;

  for (const msg of conv.messages) {
    const roleName = msg.role === 'user' ? '👤 User' : '✨ ZenG AI';
    const time = new Date(msg.timestamp).toLocaleTimeString();
    md += `### ${roleName} (${time})\n\n`;

    if (msg.attachments && msg.attachments.length > 0) {
      md += `*Attachments: ${msg.attachments.map(a => a.name).join(', ')}*\n\n`;
    }

    md += `${msg.content}\n\n`;

    if (msg.citations && msg.citations.length > 0) {
      md += `#### Sources & Citations\n`;
      msg.citations.forEach((c, idx) => {
        md += `${idx + 1}. [${c.title}](${c.url}) (${c.source || 'web'})\n`;
      });
      md += '\n';
    }

    if (msg.academicReferences && msg.academicReferences.length > 0) {
      md += `#### Academic References\n`;
      msg.academicReferences.forEach((p, idx) => {
        md += `${idx + 1}. ${p.authors.join(', ')} (${p.year}). *${p.title}*. ${p.journalOrVenue || p.source}. ${p.url ? `Available at: ${p.url}` : ''}\n`;
      });
      md += '\n';
    }

    md += `---\n\n`;
  }

  return md;
}

export function exportConversationToText(conv: Conversation): string {
  let txt = `=================================================\n`;
  txt += `ZenG AI Conversation: ${conv.title || 'Untitled'}\n`;
  txt += `Date: ${new Date(conv.createdAt).toLocaleString()}\n`;
  txt += `Model: ${conv.modelId}\n`;
  txt += `=================================================\n\n`;

  for (const msg of conv.messages) {
    const role = msg.role === 'user' ? 'USER' : 'ZENG AI';
    txt += `[${new Date(msg.timestamp).toLocaleTimeString()}] ${role}:\n`;
    txt += `${msg.content}\n\n`;
    if (msg.citations && msg.citations.length > 0) {
      txt += `Sources:\n`;
      msg.citations.forEach((c, i) => {
        txt += `  [${i + 1}] ${c.title} - ${c.url}\n`;
      });
      txt += '\n';
    }
    txt += `-------------------------------------------------\n\n`;
  }

  return txt;
}

export function exportConversationToJSON(conv: Conversation): string {
  return JSON.stringify(conv, null, 2);
}

export function exportConversationToHTML(conv: Conversation): string {
  const content = exportConversationToMarkdown(conv);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(conv.title || 'ZenG AI Conversation')}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #1e293b; }
    h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    h3 { margin-top: 24px; color: #2563eb; }
    pre { background: #f1f5f9; padding: 16px; border-radius: 8px; overflow-x: auto; }
    code { font-family: "JetBrains Mono", monospace; font-size: 0.9em; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 30px 0; }
    .source-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin-top: 12px; border-radius: 0 8px 8px 0; }
    @media print { body { max-width: 100%; margin: 0; padding: 0; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(conv.title || 'ZenG AI Transcript')}</h1>
  <p><em>Exported on ${new Date().toLocaleString()} | Model: ${conv.modelId}</em></p>
  <hr/>
  <div style="white-space: pre-wrap;">${escapeHtml(content)}</div>
</body>
</html>`;
}

/**
 * Microsoft Word (.doc / .docx compatible) Document Export
 * Uses WordProcessingML / Office HTML namespace to render natively in MS Word
 */
export function exportConversationToWord(conv: Conversation): string {
  let docContent = '';

  for (const msg of conv.messages) {
    const isUser = msg.role === 'user';
    const roleTitle = isUser ? 'User Prompt' : 'ZenG AI Response';
    const time = new Date(msg.timestamp).toLocaleString();
    const roleColor = isUser ? '#2563eb' : '#059669';

    docContent += `
      <div style="margin-top: 18pt; margin-bottom: 8pt; padding-bottom: 4pt; border-bottom: 1pt solid #cbd5e1;">
        <span style="font-size: 13pt; font-weight: bold; color: ${roleColor};">${roleTitle}</span>
        <span style="font-size: 9pt; color: #64748b; margin-left: 12pt;">(${time})</span>
      </div>
    `;

    if (msg.attachments && msg.attachments.length > 0) {
      docContent += `
        <p style="font-size: 9pt; color: #475569; font-style: italic;">
          Attachments: ${msg.attachments.map(a => escapeHtml(a.name)).join(', ')}
        </p>
      `;
    }

    // Format content with paragraphs, code blocks, lists
    const paragraphs = msg.content.split('\n\n');
    for (const p of paragraphs) {
      if (p.startsWith('```')) {
        const cleanCode = p.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
        docContent += `
          <div style="background-color: #f1f5f9; border: 1pt solid #e2e8f0; border-radius: 4pt; padding: 10pt; margin: 8pt 0; font-family: 'Consolas', 'Courier New', monospace; font-size: 9.5pt; color: #0f172a; white-space: pre-wrap;">
            ${escapeHtml(cleanCode)}
          </div>
        `;
      } else if (p.startsWith('#')) {
        docContent += `<h3 style="color: #1e293b; margin-top: 12pt; margin-bottom: 4pt;">${escapeHtml(p.replace(/^#+\s*/, ''))}</h3>`;
      } else {
        docContent += `<p style="margin: 6pt 0; line-height: 1.5; color: #1e293b;">${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`;
      }
    }

    if (msg.citations && msg.citations.length > 0) {
      docContent += `
        <div style="background-color: #f8fafc; border-left: 3pt solid #3b82f6; padding: 8pt 12pt; margin-top: 10pt; font-size: 9.5pt;">
          <p style="font-weight: bold; color: #1e40af; margin: 0 0 4pt 0;">Verified Sources & Web Citations:</p>
          <ol style="margin: 0; padding-left: 16pt;">
            ${msg.citations.map(c => `<li><a href="${c.url}" style="color: #2563eb; text-decoration: underline;">${escapeHtml(c.title || c.url)}</a> (${escapeHtml(c.source || 'Web')})</li>`).join('')}
          </ol>
        </div>
      `;
    }

    if (msg.academicReferences && msg.academicReferences.length > 0) {
      docContent += `
        <div style="background-color: #f5f3ff; border-left: 3pt solid #7c3aed; padding: 8pt 12pt; margin-top: 10pt; font-size: 9.5pt;">
          <p style="font-weight: bold; color: #5b21b6; margin: 0 0 4pt 0;">Scholarly Academic References:</p>
          <ol style="margin: 0; padding-left: 16pt;">
            ${msg.academicReferences.map(r => `<li><strong>${escapeHtml(r.authors.join(', '))}</strong> (${r.year}). <em>${escapeHtml(r.title)}</em>. ${escapeHtml(r.journalOrVenue || r.source)}.${r.doi ? ` DOI: ${r.doi}` : ''}</li>`).join('')}
          </ol>
        </div>
      `;
    }
  }

  return `
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${escapeHtml(conv.title || 'ZenG AI Transcript')}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: 8.5in 11.0in;
      margin: 1.0in 1.0in 1.0in 1.0in;
      mso-header-margin: 0.5in;
      mso-footer-margin: 0.5in;
      mso-paper-source: 0;
    }
    div.Section1 { page: Section1; }
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1e293b;
    }
    h1 {
      font-size: 20pt;
      color: #0f172a;
      border-bottom: 2pt solid #2563eb;
      padding-bottom: 6pt;
      margin-top: 0;
      margin-bottom: 8pt;
    }
    .header-meta {
      font-size: 9.5pt;
      color: #64748b;
      margin-bottom: 20pt;
    }
  </style>
</head>
<body>
  <div class="Section1">
    <h1>${escapeHtml(conv.title || 'ZenG AI Transcript')}</h1>
    <p class="header-meta">
      <strong>Generated by ZenG AI</strong> | Date: ${new Date(conv.createdAt).toLocaleString()} | Model: ${conv.modelId}
    </p>
    ${docContent}
  </div>
</body>
</html>
  `.trim();
}

/**
 * Export single message to Microsoft Word document
 */
export function exportMessageToWord(message: Message, conversationTitle: string): string {
  const isUser = message.role === 'user';
  const roleTitle = isUser ? 'User Prompt' : 'ZenG AI Generated Response';
  const time = new Date(message.timestamp).toLocaleString();

  return `
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${escapeHtml(conversationTitle)} - ${roleTitle}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: 8.5in 11.0in;
      margin: 1.0in 1.0in 1.0in 1.0in;
    }
    div.Section1 { page: Section1; }
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1e293b;
    }
    h1 {
      font-size: 18pt;
      color: #0f172a;
      border-bottom: 2pt solid #0284c7;
      padding-bottom: 4pt;
      margin-top: 0;
    }
    .meta { font-size: 9.5pt; color: #64748b; margin-bottom: 16pt; }
  </style>
</head>
<body>
  <div class="Section1">
    <h1>${escapeHtml(conversationTitle)}</h1>
    <p class="meta"><strong>${roleTitle}</strong> • Exported from ZenG AI on ${time}</p>
    <div style="font-size: 11pt; line-height: 1.6; white-space: pre-wrap;">
      ${escapeHtml(message.content)}
    </div>
  </div>
</body>
</html>
  `.trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function exportPapersToBibTeX(papers: AcademicPaper[]): string {
  let bib = '';
  for (const p of papers) {
    const key = (p.authors[0]?.split(' ')[0] || 'Paper') + (p.year || '2024');
    bib += `@article{${key},\n`;
    bib += `  title = {${p.title}},\n`;
    bib += `  author = {${p.authors.join(' and ')}},\n`;
    bib += `  year = {${p.year}},\n`;
    if (p.journalOrVenue) bib += `  journal = {${p.journalOrVenue}},\n`;
    if (p.doi) bib += `  doi = {${p.doi}},\n`;
    if (p.url) bib += `  url = {${p.url}},\n`;
    bib += `}\n\n`;
  }
  return bib;
}

export function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
