# ZenG AI — Advanced All-in-One AI Assistant Platform

ZenG AI is a production-grade, multimodal AI cognitive workstation inspired by the capabilities of ChatGPT, Google Gemini, Grok, and DeepSeek, built with an original brand identity, full-stack architecture, and verified real-world integrations.

---

## 🌟 Key Features

### 1. Multi-Model Architecture
- **ZenG Fast (`gemini-3.8-flash`)**: 1M token context, real-time reasoning, Google Search grounding, multi-turn dialogue.
- **ZenG Pro Reasoner (`gemini-3.1-pro-preview`)**: 2M token context, high-order STEM problem solving, architecture design, and complex math.
- **ZenG Lite (`gemini-3.1-flash-lite`)**: Ultra-low latency for instant summarization and rapid conversational tasks.
- **ZenG Image Studio (`gemini-3.1-flash-lite-image`)**: Creative visual generation from natural language prompts.
- Built-in provider adapter architecture with server-side API key protection and automatic fallback handling.

### 2. Scholarly Academic Research Lab
- **Live Literature Retrieval**: Queries peer-reviewed and pre-print repositories via official **arXiv** and **Crossref** APIs.
- **Real Metadata & DOIs**: Displays authentic authors, publication years, abstracts, and direct DOI resolvers (no fabricated papers or fake citations).
- **Format Generators**: One-click citation formatting in **APA**, **IEEE**, **MLA**, and **BibTeX**.
- **Bibliography Export**: Download collections directly as `.bib` files.
- **Deep Synthesis**: One-click action to pipe verified literature into the chat engine for systematic reviews.

### 3. Data Intelligence Studio
- **CSV & Tabular Ingestion**: Upload `.csv` or paste comma-separated data.
- **Automated Statistical Breakdown**: Computes record counts, column data types, missing value frequencies, and numerical metrics (min, max, mean, range).
- **Interactive SVG Data Visualizations**: Render bar charts with interactive hover states directly in the browser.
- **Python / Pandas Code Generation**: Exports reproducible Python scripts for exploratory data analysis.

### 4. Code Assistant with Live Sandbox
- Supports Python, TypeScript, JavaScript, SQL, Java, C++, HTML, and CSS.
- Real syntax highlighting via `highlight.js` with one-click copying.
- **Live Sandbox Preview**: Run HTML, SVG, and JavaScript directly in an isolated browser preview tab without external dependencies.

### 5. Multimodal & Document Intelligence
- Process attached images (JPEG, PNG, WebP) with multimodal visual analysis.
- Ingest and parse PDFs, DOCX, TXT, CSV, and JSON files with server-side extraction.
- Native voice dictation via the browser Speech Recognition API.
- Text-to-Speech (TTS) voice playback of AI responses.

### 6. Memory & Personalization
- **User-Controlled Memories**: View, add, categorize (`preference`, `project`, `bio`, `custom`), and delete memory entries.
- **Custom System Instructions**: Calibrate model behavior, reasoning depth, and output formatting.
- **Incognito Session Mode**: Toggle temporary incognito mode to conduct sessions without saving chat history.

### 7. Multi-Format Exports
- **Markdown (`.md`)**: Full transcript with headers, code fences, and bibliographies.
- **Formatted HTML (`.html`)**: Self-contained styled document ready for web distribution.
- **Plain Text (`.txt`)**: Clean text logs with timestamps.
- **JSON (`.json`)**: Structured turn-by-turn schema with metadata.
- **Print to PDF**: Built-in printer stylesheet for clean PDF export.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, KaTeX (math), Highlight.js.
- **Backend**: Node.js, Express, TypeScript, `@google/genai` official SDK.
- **Persistent Storage**: File-backed JSON database (`data/conversations.json`, `data/memories.json`, `data/users.json`).
- **Development Tooling**: Vite 8, `tsx` runtime.

---

## 🚀 Local Development Setup (VS Code)

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or pnpm

### 1. Clone & Install
```bash
git clone <repository-url>
cd zeng-ai
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `GEMINI_API_KEY` is populated:
```env
GEMINI_API_KEY="your-gemini-api-key-here"
PORT=3000
```

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🔍 System Verification & Diagnostics

ZenG AI includes an in-app **System Diagnostics & Health** suite (accessible from the header or sidebar).
It verifies:
1. **Gemini SDK Connection** with active token generation.
2. **arXiv Scholarly Repository** API accessibility.
3. **Local Persistent Storage I/O** integrity.
