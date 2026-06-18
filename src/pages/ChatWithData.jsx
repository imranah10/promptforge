import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocation } from 'react-router-dom';
import {
  UploadCloud, FileText, X, Loader2, Send, Brain, User, Trash2,
  Copy, Download, XCircle, Database, Sparkles, BarChart3, Layers,
  CheckCircle2, Code2, TrendingUp, Sigma, GitBranch, AlertTriangle,
  Plus, ChevronDown, RefreshCw, Search, Zap, Globe, Image,
  FileSpreadsheet, FileCode, Archive, Eye, EyeOff, Languages
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, RadarChart,
  Radar, PolarGrid, PolarAngleAxis
} from 'recharts';

// ── CHART COLORS ──────────────────────────────────────────────────────────────
const CC = ['#7c5cfc','#34d399','#f472b6','#fbbf24','#38bdf8','#a78bfa','#fb923c','#4ade80'];

// ── SMART CHART ───────────────────────────────────────────────────────────────
function SmartChart({ chartData }) {
  if (!chartData?.data?.length) return null;
  const a = '#7c5cfc';
  const tip = { contentStyle: { background: 'var(--bg2)', border: `1px solid ${a}`, borderRadius: '10px', fontSize: '12px', color: 'var(--text)' } };
  return (
    <div style={{ width: '100%' }}>
      {chartData.title && <div style={{ fontSize: '11px', fontWeight: 900, color: a, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '14px' }}>{chartData.title}</div>}
      <ResponsiveContainer width="100%" height={240}>
        {chartData.chartType === 'bar' ? (
          <BarChart data={chartData.data}><CartesianGrid strokeDasharray="3 3" stroke="var(--border2)"/><XAxis dataKey="name" stroke="var(--text3)" fontSize={10}/><YAxis stroke="var(--text3)" fontSize={10}/><Tooltip {...tip}/><Bar dataKey="value" radius={[4,4,0,0]}>{chartData.data.map((_,i)=><Cell key={i} fill={CC[i%CC.length]}/>)}</Bar></BarChart>
        ) : chartData.chartType === 'pie' ? (
          <PieChart><Pie data={chartData.data} dataKey="value" cx="50%" cy="50%" outerRadius={90} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>{chartData.data.map((_,i)=><Cell key={i} fill={CC[i%CC.length]}/>)}</Pie><Tooltip {...tip}/></PieChart>
        ) : chartData.chartType === 'line' ? (
          <LineChart data={chartData.data}><CartesianGrid strokeDasharray="3 3" stroke="var(--border2)"/><XAxis dataKey="name" stroke="var(--text3)" fontSize={10}/><YAxis stroke="var(--text3)" fontSize={10}/><Tooltip {...tip}/><Line type="monotone" dataKey="value" stroke={a} strokeWidth={2} dot={{fill:a,r:3}}/></LineChart>
        ) : chartData.chartType === 'scatter' ? (
          <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke="var(--border2)"/><XAxis dataKey="x" stroke="var(--text3)" fontSize={10}/><YAxis dataKey="y" stroke="var(--text3)" fontSize={10}/><Tooltip {...tip}/><Scatter data={chartData.data} fill={a}/></ScatterChart>
        ) : (
          <AreaChart data={chartData.data}><defs><linearGradient id="af" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={a} stopOpacity={0.3}/><stop offset="95%" stopColor={a} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="var(--border2)"/><XAxis dataKey="name" stroke="var(--text3)" fontSize={10}/><YAxis stroke="var(--text3)" fontSize={10}/><Tooltip {...tip}/><Area type="monotone" dataKey="value" stroke={a} fill="url(#af)" strokeWidth={2}/></AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// ── STAT CARDS ────────────────────────────────────────────────────────────────
function StatCards({ stats }) {
  if (!stats?.length) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      {stats.map((s, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
          style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '13px', padding: '15px' }}>
          <div style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '7px' }}>{s.label}</div>
          <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-1px', color: s.color || 'var(--accent)' }}>{s.value}</div>
          {s.change && <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '4px', color: s.change.startsWith('+') ? '#34d399' : '#f87171' }}>{s.change}</div>}
          {s.note && <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>{s.note}</div>}
        </motion.div>
      ))}
    </div>
  );
}

// ── FILE TYPE ICON ────────────────────────────────────────────────────────────
function FileTypeIcon({ name, type }) {
  if (/\.pdf$/i.test(name)) return <span style={{ color: '#f87171' }}>📄</span>;
  if (/\.(csv|xlsx|xls)$/i.test(name)) return <span style={{ color: '#34d399' }}>📊</span>;
  if (/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(name)) return <span style={{ color: '#f472b6' }}>🖼️</span>;
  if (/\.(js|ts|py|java|cpp|c|cs|go|rs|rb|php)$/i.test(name)) return <span style={{ color: '#38bdf8' }}>💻</span>;
  if (/\.(json|xml|yaml|yml)$/i.test(name)) return <span style={{ color: '#fbbf24' }}>⚙️</span>;
  if (/\.(zip|rar|tar|gz)$/i.test(name)) return <span style={{ color: '#a78bfa' }}>🗜️</span>;
  return <span style={{ color: 'var(--text3)' }}>📝</span>;
}

// ── LANGUAGE DETECT helper ────────────────────────────────────────────────────
function detectFileLanguage(content) {
  // Detect if content has non-latin scripts
  const hasDevanagari = /[\u0900-\u097F]/.test(content);
  const hasChinese    = /[\u4E00-\u9FFF]/.test(content);
  const hasArabic     = /[\u0600-\u06FF]/.test(content);
  const hasJapanese   = /[\u3040-\u30FF]/.test(content);
  const hasKorean     = /[\uAC00-\uD7AF]/.test(content);
  if (hasDevanagari) return 'Hindi/Devanagari script detected';
  if (hasChinese)    return 'Chinese script detected';
  if (hasArabic)     return 'Arabic script detected';
  if (hasJapanese)   return 'Japanese script detected';
  if (hasKorean)     return 'Korean script detected';
  return null;
}

// ── QUICK ACTIONS ─────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: '📋 Summarize',       prompt: 'Give a comprehensive, detailed summary of ALL uploaded files. Extract every important detail — names, dates, numbers, skills, experience, qualifications. Reference exact content from the files.' },
  { label: '📊 Key Stats',       prompt: 'Extract and list ALL key statistics, numbers, dates, and quantifiable data from the uploaded files. Present each with context.' },
  { label: '🔍 Deep Analysis',   prompt: 'Perform a comprehensive deep analysis of all uploaded content. Identify patterns, highlight key information, and provide actionable insights.' },
  { label: '❓ Q&A Mode',         prompt: 'Based on the uploaded files, create a list of the most important questions and answers about this content. Cover all major topics.' },
  { label: '📝 Extract All',     prompt: 'Extract and list ALL specific details from the uploaded files: every name, date, number, skill, qualification, company, achievement, and fact mentioned.' },
  { label: '⚠️ Find Issues',     prompt: 'Identify any issues, gaps, inconsistencies, or areas needing improvement in the uploaded content.' },
  { label: '📈 Visualize',       prompt: 'Identify all numerical data in the files and create appropriate charts. Generate chart data in the JSON format specified.' },
  { label: '🔄 Compare',         prompt: 'If multiple files are uploaded, compare and contrast them. Find similarities and differences.' },
];

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ChatWithData() {
  const { activeModel, apiKey, providerKeys, customModels, showToast, saveToVault } = useContext(AppContext);
  const location = useLocation();

  const [files,       setFiles]       = useState([]);
  const [processing,  setProcessing]  = useState(false);
  const [processingFile, setProcessingFile] = useState('');
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [chartData,   setChartData]   = useState(null);
  const [statsData,   setStatsData]   = useState(null);
  const [activeViz,   setActiveViz]   = useState('chart');
  const [sessions,    setSessions]    = useState([]);
  const [exportMenu,  setExportMenu]  = useState(null);
  const [showRaw,     setShowRaw]     = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pdfLoaded,   setPdfLoaded]   = useState(false);
  const chatEndRef = useRef(null);
  const cancelRef  = useRef(false);
  const fileInputRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    try { setSessions(JSON.parse(localStorage.getItem('cwd_sessions') || '[]')); } catch (_) {}
  }, []);

  // Accept Spider payload
  useEffect(() => {
    if (location.state?.spiderPayload) {
      const content = location.state.spiderPayload;
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      setFiles([{
        name: 'spider_report.md',
        content,
        type: 'text/markdown',
        size: content.length,
        language: null,
        wordCount,
        method: 'spider'
      }]);
      showToast('Spider report loaded!');
    }
  }, []);

  // ── PDF.JS LOADER — wait for it properly ──────────────────────────────────
  useEffect(() => {
    const loadPdfJs = () => {
      if (window.pdfjsLib) { setPdfLoaded(true); return; }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.async = true;
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        // Give worker time to initialize
        setTimeout(() => setPdfLoaded(true), 500);
      };
      script.onerror = () => console.warn('pdf.js CDN failed to load');
      document.head.appendChild(script);
    };
    loadPdfJs();
  }, []);

  // ── XLSX LOADER ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // ── MAMMOTH LOADER (DOCX) ──────────────────────────────────────────────────
  useEffect(() => {
    if (!window.mammoth) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // ── FILE EXTRACTION ENGINE ─────────────────────────────────────────────────
  const extractFileContent = async (file) => {
    const name = file.name.toLowerCase();

    // ── Plain text formats ──
    if (/\.(txt|md|csv|json|xml|yaml|yml|html|htm|css|js|ts|jsx|tsx|py|java|cpp|c|cs|go|rs|rb|php|sql|sh|bash|r|swift|kt|dart|log|env|toml|ini|cfg|conf)$/i.test(name) || file.type.startsWith('text/')) {
      const text = await file.text();
      return { content: text, method: 'text', preview: text.slice(0, 200) };
    }

    // ── PDF — with retry logic ──
    if (name.endsWith('.pdf')) {
      // Wait for pdf.js if not loaded yet
      if (!window.pdfjsLib) {
        await new Promise((resolve, reject) => {
          let attempts = 0;
          const check = setInterval(() => {
            attempts++;
            if (window.pdfjsLib) { clearInterval(check); setTimeout(resolve, 300); }
            else if (attempts > 30) { clearInterval(check); reject(new Error('PDF library could not load. Please refresh the page and try again.')); }
          }, 300);
        });
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = window.pdfjsLib.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
        disableFontFace: true,
      });

      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;
      let fullText = '';
      let hasText = false;

      // Extract text from ALL pages
      for (let pageNum = 1; pageNum <= Math.min(totalPages, 100); pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        // Preserve structure: use newline between items that end a line
        let pageText = '';
        let lastY = null;
        for (const item of textContent.items) {
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
            pageText += '\n'; // New line when Y position changes significantly
          }
          pageText += item.str + ' ';
          lastY = item.transform[5];
        }
        pageText = pageText.replace(/ {3,}/g, '  ').trim();
        if (pageText.length > 10) hasText = true;
        fullText += `\n--- Page ${pageNum} ---\n${pageText}`;
      }

      // If PDF has no extractable text (scanned PDF), use Tesseract OCR
      if (!hasText || fullText.replace(/--- Page \d+ ---/g, '').trim().length < 50) {
        // Render first page as image and OCR it
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        await page.render({ canvasContext: context, viewport }).promise;

        const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker(['eng', 'hin', 'chi_sim', 'ara', 'jpn', 'kor', 'rus', 'fra', 'deu', 'spa', 'por']);
        const { data: { text } } = await worker.recognize(imageBlob);
        await worker.terminate();
        return { content: `[Scanned PDF — OCR extracted]\n${text}`, method: 'ocr', preview: text.slice(0, 200) };
      }

      return { content: `[PDF: ${totalPages} pages]\n${fullText}`, method: 'pdf', preview: fullText.slice(0, 200) };
    }

    // ── Excel/Spreadsheet ──
    if (/\.(xlsx|xls|ods)$/i.test(name)) {
      if (!window.XLSX) {
        await new Promise((resolve, reject) => {
          let attempts = 0;
          const check = setInterval(() => {
            attempts++;
            if (window.XLSX) { clearInterval(check); resolve(); }
            else if (attempts > 20) { clearInterval(check); reject(new Error('Excel library not loaded yet. Try again.')); }
          }, 300);
        });
      }
      const arrayBuffer = await file.arrayBuffer();
      const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });
      let allSheets = '';
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const csv = window.XLSX.utils.sheet_to_csv(worksheet);
        allSheets += `\n=== Sheet: ${sheetName} ===\n${csv}\n`;
      });
      return { content: allSheets, method: 'excel', preview: allSheets.slice(0, 200) };
    }

    // ── Word Document (DOCX) ──
    if (/\.docx$/i.test(name)) {
      if (!window.mammoth) {
        await new Promise((resolve) => {
          let attempts = 0;
          const check = setInterval(() => {
            attempts++;
            if (window.mammoth) { clearInterval(check); resolve(); }
            else if (attempts > 20) { clearInterval(check); resolve(); } // fallback
          }, 300);
        });
      }
      if (window.mammoth) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        return { content: result.value, method: 'docx', preview: result.value.slice(0, 200) };
      }
      const text = await file.text();
      return { content: text, method: 'fallback', preview: text.slice(0, 200) };
    }

    // ── Images — Multi-language OCR ──
    if (/\.(jpg|jpeg|png|gif|webp|bmp|tiff|tif)$/i.test(name) || file.type.startsWith('image/')) {
      const { createWorker } = await import('tesseract.js');
      // Support 15 languages for global users
      const worker = await createWorker(['eng', 'hin', 'chi_sim', 'chi_tra', 'ara', 'jpn', 'kor', 'rus', 'fra', 'deu', 'spa', 'por', 'ita', 'tur', 'vie']);
      const { data: { text, confidence } } = await worker.recognize(file);
      await worker.terminate();
      if (confidence < 30) {
        return { content: `[Image: Low text confidence (${confidence}%). Image may not contain readable text.]\n${text}`, method: 'ocr-low', preview: text.slice(0, 200) };
      }
      return { content: `[Image OCR — ${confidence.toFixed(0)}% confidence]\n${text}`, method: 'ocr', preview: text.slice(0, 200) };
    }

    // ── Try reading as text fallback ──
    try {
      const text = await file.text();
      if (text && text.length > 10) return { content: text, method: 'text-fallback', preview: text.slice(0, 200) };
    } catch (_) {}

    return { content: `[File type not supported for text extraction: ${file.type || 'unknown'}]`, method: 'unsupported', preview: '' };
  };

  // ── HANDLE FILE UPLOAD ─────────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const newFiles = Array.from(e.target.files);
    if (!newFiles.length) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    setProcessing(true);
    const results = [];

    for (const file of newFiles) {
      setProcessingFile(file.name);
      try {
        const { content, method, preview } = await extractFileContent(file);
        const language = detectFileLanguage(content);
        const wordCount = content.split(/\s+/).filter(Boolean).length;
        results.push({
          name: file.name,
          content,
          type: file.type,
          size: file.size,
          method,
          preview,
          language,
          wordCount,
        });
        showToast(`✓ ${file.name} extracted (${wordCount} words)`, 'success');
      } catch (err) {
        results.push({
          name: file.name,
          content: `[Extraction failed: ${err.message}]`,
          type: file.type,
          size: file.size,
          method: 'error',
          preview: '',
          language: null,
          wordCount: 0,
          error: err.message,
        });
        showToast(`⚠️ ${file.name}: ${err.message}`, 'error');
      }
    }

    setFiles(prev => [...prev, ...results]);
    setProcessing(false);
    setProcessingFile('');
  };

  // ── SESSIONS ──────────────────────────────────────────────────────────────
  const saveSession = () => {
    if (!messages.length) return;
    const s = { id: Date.now(), date: new Date().toLocaleDateString(), files: files.map(f => f.name), msgCount: messages.length, messages, chartData, statsData };
    const updated = [s, ...sessions].slice(0, 10);
    setSessions(updated);
    localStorage.setItem('cwd_sessions', JSON.stringify(updated));
    showToast('Session saved!');
  };

  const loadSession = (s) => {
    setMessages(s.messages);
    if (s.chartData) setChartData(s.chartData);
    if (s.statsData) setStatsData(s.statsData);
    setExportMenu(null);
    showToast('Session loaded!');
  };

  // ── EXPORT ────────────────────────────────────────────────────────────────
  const handleExport = (fmt, text, i) => {
    setExportMenu(null);
    let blob, ext;
    if (fmt === 'MD')  { blob = new Blob([text], { type: 'text/markdown' }); ext = 'md'; }
    if (fmt === 'TXT') { blob = new Blob([text.replace(/\*\*/g, '').replace(/#{1,6} /g, '')], { type: 'text/plain' }); ext = 'txt'; }
    if (fmt === 'CSV') {
      const rows = text.match(/\|(.+)\|/g);
      if (!rows) { showToast('No table found in this response', 'error'); return; }
      const csv = rows.map(r => r.split('|').filter(c => c.trim() && !/^[-:\s]+$/.test(c)).map(c => `"${c.trim()}"`).join(',')).join('\n');
      blob = new Blob([csv], { type: 'text/csv' }); ext = 'csv';
    }
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `analysis_${i}.${ext}` });
    a.click(); URL.revokeObjectURL(a.href);
    showToast(`Exported as ${fmt}!`);
  };

  // ── SEND MESSAGE ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() && !files.length) return;
    cancelRef.current = false;
    setLoading(true);
    const userMsg = input.trim() || 'Analyze all uploaded files comprehensively.';
    setInput('');
    const newMessages = [...messages, { role: 'user', text: userMsg }];
    setMessages(newMessages);

    // Build rich file context — FULL content, clearly labeled
    const fileContext = files.map((f, idx) => {
      const header = `\n${'='.repeat(60)}\nFILE ${idx + 1}: "${f.name}"\nSize: ${(f.size / 1024).toFixed(1)}KB | Words: ${f.wordCount || 0} | Method: ${f.method || 'text'}${f.language ? ` | Language: ${f.language}` : ''}\n${'='.repeat(60)}\n`;
      return header + (f.content || '[Empty file]');
    }).join('\n\n');

    const historyText = newMessages.slice(-10).map(m => `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${m.text.slice(0, 500)}`).join('\n\n');

    const systemPrompt = `You are a precise document analyst. You have been given the EXACT TEXT extracted from the user's uploaded files.

ABSOLUTE RULES:
1. READ the file content carefully before answering
2. Answer ONLY from what is written in the files — never guess or hallucinate
3. If a resume: extract the REAL name, REAL contact info, REAL experience from the actual text
4. Quote exact words/sentences from the file to support your answers
5. If you cannot find specific info in the file text, say "Not found in document"
6. NEVER make up names, dates, companies, or details not present in the file

YOUR CORE MISSION:
You have been given the COMPLETE, FULL TEXT content of the user's uploaded files. 
Every answer you give MUST be based EXCLUSIVELY on what is actually written in those files.
NEVER say "I don't have access to the file" — you DO have the full content below.
NEVER hallucinate or make up information not present in the files.
ALWAYS reference specific details, quotes, names, numbers from the actual file content.

ANALYSIS STANDARDS (Superior to ChatGPT/Claude/Gemini):
1. CITE EXACT CONTENT: Quote specific sentences, numbers, names from files
2. EXHAUSTIVE DEPTH: Cover every relevant detail — nothing skipped
3. STRUCTURED OUTPUT: Use ## headers, **bold** key points, tables for comparisons
4. MULTI-LANGUAGE AWARE: If file contains Hindi, Arabic, Chinese etc — understand and analyze it
5. DOCUMENT TYPE INTELLIGENCE: Auto-detect if it's a resume → extract skills/experience; contract → extract terms; financial → extract numbers; code → analyze logic
6. ACTIONABLE INSIGHTS: Always end with specific recommendations based on actual file content

DOCUMENT TYPE AUTO-BEHAVIORS:
- Resume/CV → Extract: name, contact, skills, experience, education, achievements, gaps
- Financial document → Extract: all numbers, trends, totals, anomalies
- Legal/Contract → Extract: parties, terms, dates, obligations, risks
- Code file → Analyze: logic, bugs, improvements, complexity
- Research/Article → Extract: key findings, methodology, conclusions
- Data/CSV → Statistical analysis with visualization JSON

VISUALIZATION JSON (append at end if numerical data found):
\`\`\`json
{
  "type": "dashboard",
  "stats": [{"label": "Key Metric", "value": "123", "color": "#34d399", "note": "from file"}],
  "chart": {"chartType": "bar", "title": "DATA CHART", "data": [{"name": "Item", "value": 100}]}
}
\`\`\`
If no numerical data: \`\`\`json {"type": "none"} \`\`\`

chartType: "area" | "bar" | "line" | "pie" | "scatter"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXACT FILE CONTENTS — READ THIS CAREFULLY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${fileContext.slice(0, 700000)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
END OF FILE CONTENTS — Answer based ONLY on what you read above`;

    const userContent = `CONVERSATION HISTORY:
${historyText}

QUESTION: ${userMsg}

CRITICAL: Your answer must be based ONLY on the file content shown above in the system prompt.
- If this is a resume/CV: read the person's actual name, contact, work history from the file text
- Quote exact sentences from the file to support your answer
- Do NOT use any knowledge outside the uploaded file`;

    try {
      const res = await callAI(systemPrompt, userContent, null, activeModel, apiKey, providerKeys, customModels);
      if (cancelRef.current) return;

      // Parse visualization JSON and remove ONLY the dashboard config block
      let clean = res;
      const jsonMatches = [...res.matchAll(/```(?:json)?\s*([\s\S]*?)\s*```/g)];
      for (const match of jsonMatches) {
        try {
          const art = JSON.parse(match[1]);
          if (art && (art.type === 'dashboard' || art.type === 'none')) {
            if (art.type === 'dashboard') {
              if (art.chart) { setChartData(art.chart); setActiveViz('chart'); }
              if (art.stats) setStatsData(art.stats);
            } else if (art.type === 'none') {
              setChartData(null); setStatsData(null);
            }
            // Strip only this matching json block
            clean = clean.replace(match[0], '');
          }
        } catch (_) {
          // Normal code block or non-dashboard json, keep it!
        }
      }

      clean = clean.trim() || 'Analysis complete. See visualization panel.';
      const updatedMessages = [...newMessages, { role: 'assistant', text: clean }];
      setMessages(updatedMessages);
      saveToVault?.('ChatWithData', userMsg, clean);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', text: `❌ **Error:** ${err.message}\n\nPlease check your API key and try again.` }]);
      showToast('Error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── SEARCH MESSAGES ───────────────────────────────────────────────────────
  const filteredMessages = searchQuery
    ? messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const hasViz = chartData || statsData;
  const totalWords = files.reduce((sum, f) => sum + (f.wordCount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', padding: '20px 28px', gap: '14px', boxSizing: 'border-box' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ borderLeft: '4px solid var(--accent)', paddingLeft: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '3px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Brain size={10} /> NEURAL DATA SOVEREIGN v4.0
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-1.5px', margin: 0 }}>
            Chat <span style={{ color: 'var(--accent)' }}>With Data</span>
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {files.length > 0 && (
            <div style={{ fontSize: '11px', color: 'var(--text3)', background: 'var(--bg3)', border: '1px solid var(--border)', padding: '5px 12px', borderRadius: '20px' }}>
              📁 {files.length} file{files.length > 1 ? 's' : ''} · {totalWords.toLocaleString()} words
            </div>
          )}
          <button onClick={saveSession} disabled={!messages.length} style={{ ...hdrBtn, opacity: !messages.length ? 0.4 : 1 }}><Plus size={12} /> Save</button>
          {sessions.length > 0 && (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setExportMenu(exportMenu === 'sessions' ? null : 'sessions')} style={hdrBtn}><Database size={12} /> Sessions</button>
              {exportMenu === 'sessions' && (
                <div style={dropdown}>
                  {sessions.map(s => (
                    <div key={s.id} onClick={() => loadSession(s)} style={{ padding: '9px 12px', cursor: 'pointer', borderRadius: '7px', transition: '.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--border2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: 700 }}>{s.date}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{s.files.join(', ')} · {s.msgCount} msgs</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {messages.length > 0 && (
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 10px 6px 28px', borderRadius: '10px', fontSize: '12px', outline: 'none', width: '140px' }} />
            </div>
          )}
          <button onClick={() => { setMessages([]); setFiles([]); setChartData(null); setStatsData(null); showToast('Cleared'); }} style={{ ...hdrBtn, color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }}><Trash2 size={12} /></button>
        </div>
      </div>

      {/* ── LAYOUT ── */}
      <div style={{ display: 'flex', gap: '18px', flex: 1, minHeight: 0 }}>

        {/* ── CHAT PANEL ── */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden', minHeight: 0 }}>

          {/* File bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', flexShrink: 0, flexWrap: 'wrap' }}>
            <input ref={fileInputRef} type="file" id="cwd-upload" hidden multiple
              accept=".csv,.txt,.pdf,.json,.md,.xml,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.cs,.go,.rs,.rb,.php,.sql,.html,.htm,.css,.xlsx,.xls,.ods,.docx,.png,.jpg,.jpeg,.gif,.webp,.bmp,.log,.yaml,.yml,.toml,.ini,.env,.sh,.bash,.r,.swift,.kt,.dart"
              onChange={handleFileUpload} />
            <label htmlFor="cwd-upload" style={{ background: 'rgba(124,92,252,0.15)', border: '1px solid rgba(124,92,252,0.3)', color: 'var(--accent)', padding: '5px 13px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, cursor: processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: processing ? 0.7 : 1 }}>
              {processing ? <><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> {processingFile ? `Reading ${processingFile.slice(0, 20)}...` : 'Processing...'}</> : <><UploadCloud size={11} /> Upload Files</>}
            </label>

            {/* Supported formats hint */}
            <span style={{ fontSize: '10px', color: 'var(--text3)', fontStyle: 'italic' }}>
              PDF · DOCX · XLSX · CSV · Images · Code · JSON · Any text
            </span>

            {/* File chips */}
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginLeft: 'auto' }}>
              {files.map((f, i) => (
                <div key={i} title={`${f.method} · ${f.wordCount} words${f.language ? ` · ${f.language}` : ''}${f.error ? ` · ERROR: ${f.error}` : ''}`}
                  style={{ background: f.error ? 'rgba(248,113,113,0.1)' : 'var(--bg2)', border: `1px solid ${f.error ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`, color: f.error ? '#f87171' : 'var(--text2)', padding: '3px 9px', borderRadius: '20px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FileTypeIcon name={f.name} type={f.type} />
                  {f.name.length > 20 ? f.name.slice(0, 20) + '…' : f.name}
                  {f.language && <Languages size={8} style={{ color: 'var(--accent)' }} />}
                  <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 0, display: 'flex', lineHeight: 1 }}><X size={8} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          {files.length > 0 && messages.length === 0 && (
            <div style={{ padding: '10px 14px', background: 'var(--border2)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text3)', letterSpacing: '2px', marginBottom: '7px' }}>QUICK ACTIONS — CLICK TO ANALYZE</div>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {QUICK_ACTIONS.map(qa => (
                  <button key={qa.label} onClick={() => setInput(qa.prompt)}
                    style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '5px 12px', borderRadius: '15px', fontSize: '11px', cursor: 'pointer', fontWeight: 600, transition: '.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; }}>
                    {qa.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', minHeight: 0 }}>
            {messages.length === 0 && !loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '30px 20px', gap: '12px' }}>
                <div style={{ fontSize: '40px' }}>🧠</div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', margin: 0 }}>Neural Data Sovereign v4.0</h3>
                <p style={{ color: 'var(--text2)', fontSize: '13px', maxWidth: '420px', lineHeight: '1.7', margin: 0 }}>
                  Upload ANY file — resume, contract, spreadsheet, image, code, PDF. I read the FULL content and answer questions with 100% accuracy based on what's actually in your files. Not like ChatGPT's generic answers.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px', width: '100%', maxWidth: '460px' }}>
                  {[
                    ['📄 PDF', 'Resumes, contracts, reports — full text extraction'],
                    ['📊 Excel/CSV', 'Spreadsheets, data files — all rows & columns'],
                    ['🖼️ Images', '15-language OCR — Hindi, Arabic, Chinese etc'],
                    ['📝 DOCX', 'Word documents — complete content'],
                    ['💻 Code', 'Any programming language — analysis & review'],
                    ['🌐 Multi-lang', 'Files in any language — understood & analyzed'],
                  ].map(([icon, desc]) => (
                    <div key={icon} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px', textAlign: 'left' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '3px' }}>{icon}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text3)', lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {filteredMessages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', gap: '10px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: msg.role === 'user' ? '#fff' : 'var(--accent)', flexShrink: 0 }}>
                    {msg.role === 'assistant' ? <Brain size={13} /> : <User size={13} />}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxWidth: 'calc(100% - 42px)', width: '100%' }}>
                    <div className="cwd-bubble" style={{ padding: '13px 17px', borderRadius: '15px', fontSize: '14px', lineHeight: '1.75',
                      ...(msg.role === 'user'
                        ? { background: 'var(--accent)', color: '#fff', marginLeft: 'auto', maxWidth: '80%', borderBottomRightRadius: '4px' }
                        : { background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', borderBottomLeftRadius: '4px' }) }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                    </div>
                    {msg.role === 'assistant' && (
                      <div className="msg-actions" style={{ display: 'flex', gap: '5px', opacity: 0, transition: '.2s' }}>
                        <button onClick={() => { navigator.clipboard.writeText(msg.text); showToast('Copied!'); }} style={msgBtn}><Copy size={9} /> Copy</button>
                        <div style={{ position: 'relative' }}>
                          <button onClick={() => setExportMenu(exportMenu === i ? null : i)} style={msgBtn}><Download size={9} /> Export <ChevronDown size={8} /></button>
                          {exportMenu === i && (
                            <div style={{ ...dropdown, bottom: '100%', top: 'auto', marginBottom: '4px', marginTop: 0 }}>
                              {['MD', 'TXT', 'CSV'].map(f => (
                                <div key={f} onClick={() => handleExport(f, msg.text, i)} style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--text2)', cursor: 'pointer', borderRadius: '6px', fontWeight: 700, transition: '.2s' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--border2)'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                                  {f}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {searchQuery && filteredMessages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '13px', padding: '20px' }}>No messages matching "{searchQuery}"</div>
            )}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text2)', fontSize: '13px', padding: '12px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: '6px', height: '6px', background: 'var(--accent)', borderRadius: '50%', animation: `dotBounce 1.2s ${i * 0.2}s infinite` }} />)}
                </div>
                Reading files & analyzing...
                <button onClick={() => { cancelRef.current = true; setLoading(false); }} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', padding: '3px 10px', borderRadius: '8px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                  <XCircle size={11} /> Stop
                </button>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: '10px', padding: '12px 14px', borderTop: '1px solid var(--border)', background: 'var(--bg2)', flexShrink: 0, alignItems: 'flex-end' }}>
            <textarea rows={2} placeholder={files.length > 0 ? `Ask anything about ${files.map(f => f.name).join(', ')}...` : 'Upload a file first, then ask questions about it...'}
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '11px 15px', borderRadius: '13px', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: '1.5' }} />
            <button onClick={handleSend} disabled={loading || (!input.trim() && !files.length)}
              style={{ width: '44px', height: '44px', background: 'var(--accent)', border: 'none', borderRadius: '13px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: loading || (!input.trim() && !files.length) ? 0.4 : 1, transition: '.2s' }}>
              {loading ? <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={17} />}
            </button>
          </div>
        </div>

        {/* ── VIZ PANEL ── */}
        {hasViz && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            style={{ width: '360px', flexShrink: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '2px', padding: '7px', background: 'var(--border2)', borderBottom: '1px solid var(--border)' }}>
              {[
                chartData && ['chart', <BarChart3 size={11} />, 'Charts'],
                statsData && ['stats', <Sigma size={11} />, 'Stats'],
                files.length > 0 && ['raw', <Code2 size={11} />, 'Raw'],
              ].filter(Boolean).map(([id, icon, label]) => (
                <button key={id} onClick={() => setActiveViz(id)}
                  style={{ flex: 1, padding: '7px', background: activeViz === id ? 'var(--accent)' : 'transparent', border: 'none', borderRadius: '7px', color: activeViz === id ? '#fff' : 'var(--text2)', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: '.2s' }}>
                  {icon} {label}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {activeViz === 'chart' && chartData && <SmartChart chartData={chartData} />}
              {activeViz === 'stats' && statsData && <StatCards stats={statsData} />}
              {activeViz === 'raw' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '11px', overflow: 'hidden' }}>
                      <div style={{ background: 'var(--bg3)', padding: '7px 12px', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border)', color: 'var(--text2)' }}>
                        <FileTypeIcon name={f.name} type={f.type} /> {f.name}
                        <span style={{ marginLeft: 'auto', color: 'var(--text3)', fontWeight: 400 }}>{(f.size / 1024).toFixed(1)}KB</span>
                      </div>
                      {f.language && (
                        <div style={{ padding: '4px 12px', background: 'rgba(124,92,252,0.05)', fontSize: '10px', color: 'var(--accent)', borderBottom: '1px solid var(--border)' }}>
                          🌐 {f.language}
                        </div>
                      )}
                      <pre style={{ padding: '10px', color: 'var(--text2)', fontFamily: "'DM Mono',monospace", fontSize: '9px', lineHeight: '1.5', whiteSpace: 'pre-wrap', maxHeight: '180px', overflowY: 'auto', margin: 0, background: 'var(--bg3)', border: 'none' }}>
                        {f.content.slice(0, 3000)}{f.content.length > 3000 ? '\n... (truncated for preview)' : ''}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <style>{`
        @keyframes spin      { to { transform:rotate(360deg); } }
        @keyframes dotBounce { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-4px);opacity:1} }
        .msg-actions { opacity:0 !important; }
        div:hover > div > .msg-actions { opacity:1 !important; }
        .cwd-bubble h1,.cwd-bubble h2,.cwd-bubble h3{color:var(--accent);font-weight:800;margin:14px 0 7px}
        .cwd-bubble h2{font-size:1.05em;border-bottom:1px solid var(--border);padding-bottom:6px}
        .cwd-bubble h3{font-size:.95em}
        .cwd-bubble p{margin-bottom:8px}
        .cwd-bubble strong{color:var(--text);font-weight:800}
        .cwd-bubble a{color:var(--accent);text-decoration:underline}
        .cwd-bubble blockquote{border-left:3px solid var(--accent);padding:6px 12px;margin:8px 0;background:var(--border2);border-radius:0 6px 6px 0;font-style:italic}
        .cwd-bubble table{width:100%;border-collapse:collapse;margin:12px 0;font-size:12px}
        .cwd-bubble th{background:rgba(124,92,252,.1);color:var(--accent);padding:7px 11px;font-size:10px;letter-spacing:1px;text-align:left;border:1px solid var(--border)}
        .cwd-bubble td{padding:7px 11px;border:1px solid var(--border);color:inherit}
        .cwd-bubble tr:hover td{background:var(--border2)}
        .cwd-bubble pre{background:var(--bg3);border:1px solid var(--border);border-radius:9px;padding:12px;overflow-x:auto;margin:9px 0}
        .cwd-bubble code{font-family:'DM Mono',monospace;color:var(--accent);font-size:12px;background:var(--border2);padding:1px 5px;border-radius:4px}
        .cwd-bubble pre code{background:none;color:var(--text)}
        .cwd-bubble ul,.cwd-bubble ol{padding-left:18px;margin-bottom:9px}
        .cwd-bubble li{margin-bottom:4px}
        .cwd-bubble hr{border:none;border-top:1px solid var(--border);margin:14px 0}
      `}</style>
    </div>
  );
}

const hdrBtn  = { background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '7px 13px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: '.2s' };
const msgBtn  = { background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '3px 9px', borderRadius: '7px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: '.2s' };
const dropdown = { position: 'absolute', top: '100%', right: 0, marginTop: '5px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '5px', zIndex: 100, minWidth: '120px', boxShadow: '0 15px 40px rgba(0,0,0,0.2)' };