import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { saveSession, loadSession, deleteSession } from '../utils/db';
import { 
  UploadCloud, FileText, X, Loader2, Send, Bot, User, Trash2, Copy, 
  Share2, Zap, Activity, Layers, BarChart3, Database, Globe, Brain, Sparkles, Move, Download, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

// --- SUB-COMPONENT: NEURAL KNOWLEDGE MESH ---
const KnowledgeMesh = ({ nodes = [], edges = [], theme }) => {
  const meshAccent = theme?.accent || 'var(--accent)';
  return (
    <div className="mesh-container">
      <div className="mesh-grid"></div>
      <svg className="mesh-svg" viewBox="-100 -100 1000 800" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Render Edges if provided, else auto-connect */}
        {(edges.length > 0 ? edges : []).map((edge, i) => {
          const sourceNode = nodes.find(n => n.label === edge.source);
          const targetNode = nodes.find(n => n.label === edge.target);
          if (!sourceNode || !targetNode) return null;
          return (
            <motion.line 
              key={`edge-${i}`}
              x1={sourceNode.x} y1={sourceNode.y} x2={targetNode.x} y2={targetNode.y}
              stroke={meshAccent}
              strokeWidth={edge.weight ? edge.weight * 3 : 1}
              opacity="0.2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
            />
          );
        })}

        {/* Auto-connections fallback if no edges */}
        {edges.length === 0 && nodes.map((node, i) => (
          nodes.slice(i + 1).map((target, j) => (
            <motion.line 
              key={`auto-${i}-${j}`}
              x1={node.x} y1={node.y} x2={target.x} y2={target.y}
              stroke="rgba(124, 92, 252, 0.15)"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
            />
          ))
        ))}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <motion.g 
            key={`node-${i}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.3 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: i * 0.05 }}
          >
            <circle cx={node.x} cy={node.y} r="12" fill={meshAccent} filter="url(#glow)" />
            <circle cx={node.x} cy={node.y} r="25" fill="none" stroke={meshAccent} strokeWidth="1" opacity="0.4">
               <animate attributeName="r" from="12" to="40" dur="3s" repeatCount="indefinite" />
               <animate attributeName="opacity" from="0.4" to="0" dur="3s" repeatCount="indefinite" />
            </circle>
            <text x={node.x + 25} y={node.y + 6} fill="#ffffff" fontSize="16" fontWeight="bold" className="mesh-text">{node.label}</text>
          </motion.g>
        ))}
      </svg>
      <div className="mesh-overlay">
         <div className="mesh-badge">NEURAL CORE LINKED</div>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
const ChatWithData = () => {
  const { activeModel, apiKey, providerKeys, customModels, showToast, saveToVault } = useContext(AppContext);
  
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfScriptLoaded, setPdfScriptLoaded] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('mesh');
  const [meshData, setMeshData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [activeExportMenu, setActiveExportMenu] = useState(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const SESSION_ID = 'current_chat_with_data_session';
  
  const cancelRef = useRef(false);

  // --- INDEXEDDB: INITIAL LOAD ---
  useEffect(() => {
    const initSession = async () => {
      const savedData = await loadSession(SESSION_ID);
      if (savedData) {
        if (savedData.files) setFiles(savedData.files);
        if (savedData.messages) setMessages(savedData.messages);
        if (savedData.meshData) setMeshData(savedData.meshData);
        if (savedData.chartData) setChartData(savedData.chartData);
      }
      setSessionLoaded(true);
    };
    initSession();
  }, []);

  // --- INDEXEDDB: AUTO-SAVE DEBOUNCED ---
  useEffect(() => {
    if (!sessionLoaded) return; // Prevent overwriting DB with initial empty state
    const timer = setTimeout(() => {
      saveSession(SESSION_ID, { files, messages, meshData, chartData });
    }, 1000);
    return () => clearTimeout(timer);
  }, [files, messages, meshData, chartData, sessionLoaded]);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.spiderPayload) {
      const payload = location.state.spiderPayload;
      const query = location.state.spiderQuery || 'Live_Extraction';
      
      // Auto-ingest the spider payload as a virtual file
      const newFile = {
        name: `Spider_Extraction_${query.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15)}.txt`,
        content: payload,
        type: 'text/plain'
      };
      
      setFiles(prev => {
        // Prevent duplicate injection if they navigate back and forth
        if (prev.some(f => f.content === payload)) return prev;
        return [...prev, newFile];
      });
      
      showToast('Live Spider Intelligence Ingested Successfully');
      
      // Clear state so it doesn't re-trigger on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById('pdfjs-script')) {
      const script = document.createElement('script');
      script.id = 'pdfjs-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        setPdfScriptLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      setPdfScriptLoaded(true);
    }
    
    // Load Export Engines
    if (!document.getElementById('html2canvas-script')) {
      const script = document.createElement('script');
      script.id = 'html2canvas-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      document.body.appendChild(script);
    }
    if (!document.getElementById('jspdf-script')) {
      const script = document.createElement('script');
      script.id = 'jspdf-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      document.body.appendChild(script);
    }
  }, []);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const extractTextFromPDF = async (fileBuffer) => {
    const pdf = await window.pdfjsLib.getDocument({ data: fileBuffer }).promise;
    let fullText = '';
    const maxPages = Math.min(pdf.numPages, 50); 
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map(item => item.str).join(' ') + '\n\n';
    }
    return fullText;
  };

  const handleCopy = (text) => {
    // Scrub markdown syntax for clean copy
    const cleanText = text.replace(/[*#`_]/g, '').trim();
    navigator.clipboard.writeText(cleanText);
    showToast("Data Insight Copied Cleanly!");
  };

  const handleExport = async (format, text, msgIndex) => {
    setActiveExportMenu(null);
    const msg = messages[msgIndex];
    const baseFilename = msg.sourceFile || msg.theme?.title || 'Neural_Insight';
    const filename = baseFilename.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    if (format === 'TXT') {
      const blob = new Blob([text.replace(/[*#`_]/g, '')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${filename}.txt`; a.click();
      showToast("TXT Exported");
    } 
    else if (format === 'CSV') {
      // Find markdown tables
      const tableMatch = text.match(/\|.*\|[\r\n]+\|[-:| ]+\|([\r\n]+\|.*\|)+/g);
      if (tableMatch) {
        let csvContent = tableMatch.join('\n\n').replace(/\|/g, ',').replace(/,,/g, ',').replace(/(^,|,$)/gm, '');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${filename}.csv`; a.click();
        showToast("Table successfully extracted to CSV.");
      } else {
        showToast("No tabular data found to extract.", "error");
      }
    }
    else if (format === 'PNG' || format === 'PDF') {
      const element = document.getElementById(`msg-content-${msgIndex}`);
      if (element && window.html2canvas) {
        showToast(`Generating High-Fidelity ${format}...`, 'info');
        
        const canvas = await window.html2canvas(element, { 
          backgroundColor: msg.theme?.bg || '#0a0a14', 
          scale: 2, // High resolution
          onclone: (clonedDoc) => {
            const clonedEl = clonedDoc.getElementById(`msg-content-${msgIndex}`);
            if (clonedEl) {
              // Force ultra-wide document width for better aspect ratio in photo viewers
              clonedEl.style.width = '1800px';
              clonedEl.style.maxWidth = '1800px';
              clonedEl.style.whiteSpace = 'normal';
              clonedEl.style.fontSize = '24px'; // Increase base font size
              
              // Scale inner table font sizes
              const tables = clonedEl.querySelectorAll('table');
              tables.forEach(t => t.style.fontSize = '22px');
              
              // Remove parent constraints that cause text squeezing
              let parent = clonedEl.parentElement;
              while (parent && parent.tagName !== 'BODY') {
                parent.style.width = '2000px';
                parent.style.maxWidth = '2000px';
                parent = parent.parentElement;
              }
            }
          }
        });
        
        if (format === 'PNG') {
          const link = document.createElement('a');
          link.download = `${filename}.png`;
          link.href = canvas.toDataURL('image/png', 1.0);
          link.click();
        } else {
          if (window.jspdf && window.jspdf.jsPDF) {
            // Dynamic PDF dimensions matching exact canvas size to prevent bottom cutoff
            const pdf = new window.jspdf.jsPDF({
              orientation: canvas.width > canvas.height ? 'l' : 'p',
              unit: 'px',
              format: [canvas.width, canvas.height]
            });
            // Use JPEG compression (0.7 quality) to reduce PDF size from 80MB to <1MB
            const imgData = canvas.toDataURL('image/jpeg', 0.75);
            pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
            // Force PDF viewer to open at full width so user doesn't have to zoom
            pdf.setDisplayMode('fullwidth');
            pdf.save(`${filename}.pdf`);
          }
        }
      } else {
         showToast("Export Engine still loading, please wait.", "error");
      }
    }
  };

  const handleClear = async () => {
    setMessages([]);
    setMeshData(null);
    setChartData(null);
    setFiles([]);
    setInput('');
    await deleteSession(SESSION_ID);
    showToast("Neural Cache & Memory Vault Cleared.", "info");
  };

  const handleCancel = () => {
    cancelRef.current = true;
    setIsLoading(false);
    showToast("Neural Link Severed.");
  };



  const handleFileUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    setIsProcessing(true);

    const newFiles = [];
    for (const file of selectedFiles) {
      try {
        let extractedText = '';
        if (file.type === 'application/pdf') {
          const buffer = await file.arrayBuffer();
          extractedText = await extractTextFromPDF(buffer);
        } else if (file.type.startsWith('image/')) {
          const result = await Tesseract.recognize(file, 'eng');
          extractedText = result.data.text;
        } else {
          extractedText = await file.text();
        }
        newFiles.push({ name: file.name, content: extractedText, type: file.type });
        showToast(`${file.name} Ingested`);
      } catch (err) {
        showToast(`Error reading ${file.name}: ${err.message}`, 'error');
      }
    }

    setFiles(prev => [...prev, ...newFiles]);


    setIsProcessing(false);
    e.target.value = '';
  };

  const handleSend = async () => {
    if (!input.trim() && files.length === 0) return;
    setIsLoading(true);
    cancelRef.current = false;
    const userMsg = input.trim() || 'Analyze uploaded data matrix.';
    setInput('');
    const newMessages = [...messages, { role: 'user', text: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    let fullContext = files.map(f => `FILE: ${f.name}\nCONTENT: ${f.content}`).join('\n\n---\n\n');

    const systemPrompt = `You are the NEURAL DATA SOVEREIGN, an elite industrial AI data architect.
Your job is to analyze data and provide insights with 10x industrial depth.

[PHASE 1: COMPREHENSIVE TEXT ANALYSIS]
You MUST provide a highly detailed, professional analysis using structured Markdown.
- Use headers (##, ###) to divide sections.
- ALWAYS use Markdown Tables to present data points. IMPORTANT: Markdown tables MUST have empty lines before and after them, and MUST NOT be placed inside bullet points or lists. Use proper newline characters (\n) to separate table rows.
- Use bold text to highlight key insights.
- Provide a clear, actionable summary at the end.
DO NOT give short or brief answers. Write like an elite data analyst providing a full report.

[PHASE 2: DATA ARTIFACTS & DYNAMIC THEMING (CRITICAL)]
You MUST generate a JSON block at the very end of your response to power the visual dashboard. 
CRITICAL RULES FOR VISUAL DASHBOARD:
1. If the context contains a numerical dataset, spreadsheet, CSV, Excel file, or the user asks for data reporting/analytics, YOU MUST provide Option A ('dashboard'). DO NOT use Option B.
2. ONLY if the context is strictly a non-analytical personal document (e.g. Resume, CV, Essay, Letter), you MUST output Option B ("none") to hide the dashboard.
Additionally, you MUST provide a \`theme\` object to customize the colors of the report based on the user's request or context.

IMPORTANT RULES FOR THEME:
1. \`bg\` MUST be a very dark hex color (e.g. #0a0a14, #1a1a2e, #0f172a, #000000) for high contrast. DO NOT USE LIGHT BACKGROUNDS.
2. \`text\` MUST be a light/white hex color for perfect readability against the dark bg (e.g. #f8fafc, #ffffff).
3. \`accent\` should be a vibrant neon color (e.g. #00ffcc, #ff007f, #3b82f6).
4. \`heading\` should match the accent or be a complementary bright color.
5. \`title\` MUST be a short, descriptive file name based on the user's request (e.g. "Q3_Sales_Report").

Provide EXACTLY ONE of the following JSON formats in a \`\`\`json block:

Option A - For Data & Analytics (Unified Dashboard):
\`\`\`json
{
  "type": "dashboard",
  "theme": { "bg": "#101018", "text": "#ffffff", "accent": "#7c5cfc", "heading": "#a78bfa", "title": "Dashboard_Analysis" },
  "mesh": {
    "nodes": [{"x": 100, "y": 200, "label": "Concept A"}, {"x": 300, "y": 400, "label": "Concept B"}],
    "edges": [{"source": "Concept A", "target": "Concept B", "weight": 2}]
  },
  "chart": {
    "chartType": "area",
    "data": [{"name": "Jan", "value": 400}, {"name": "Feb", "value": 600}]
  }
}
\`\`\`

Option B - For Text-Only Tasks (No Visuals Needed):
\`\`\`json
{
  "type": "none",
  "theme": { "bg": "#101018", "text": "#ffffff", "accent": "#7c5cfc", "heading": "#a78bfa", "title": "Document_Format" }
}
\`\`\`

Ensure all JSON is syntactically valid. Always provide mesh nodes with clear 0-800 X and 0-600 Y coordinates so they map perfectly inside our canvas.

CONTEXT:
${fullContext.substring(0, 500000)}`;

    try {
      const response = await callAI(systemPrompt, newMessages.map(m => `${m.role}: ${m.text}`).join('\n\n'), null, activeModel, apiKey, providerKeys, customModels);
      
      if (cancelRef.current) return;
      
      // Dynamic robust JSON extraction for multiple artifacts
      let extractedArtifacts = [];
      
      // Extract all markdown JSON blocks robustly
      const jsonBlocks = [...response.matchAll(/```(?:json)?\s*([\s\S]*?)\s*```/g)];
      if (jsonBlocks.length > 0) {
        jsonBlocks.forEach(block => {
          try { extractedArtifacts.push(JSON.parse(block[1])); } catch (e) { }
        });
      }
      
      // Fallback: look for raw JSON block in the text if array is empty
      if (extractedArtifacts.length === 0) {
        const rawMatches = [...response.matchAll(/\{[\s\S]*?"type"\s*:\s*"(dashboard|none)"[\s\S]*?\}/g)];
        rawMatches.forEach(match => {
          try { extractedArtifacts.push(JSON.parse(match[0])); } catch (e) { }
        });
      }

      let activeTabSet = false;
      let extractedTheme = null;
      extractedArtifacts.forEach(artifact => {
        if (artifact.theme) extractedTheme = artifact.theme;
        
        if (artifact.type === 'dashboard') {
          if (artifact.chart) {
             setChartData({...artifact.chart, theme: artifact.theme});
             if (!activeTabSet) { setActiveTab('analytics'); activeTabSet = true; }
          }
          if (artifact.mesh) {
             setMeshData({...artifact.mesh, theme: artifact.theme});
             if (!activeTabSet) { setActiveTab('mesh'); activeTabSet = true; }
          }
        } else if (artifact.type === 'none') {
          setMeshData(null);
          setChartData(null);
        }
      });

      // Clean the text response by removing the JSON blocks
      let cleanText = response.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '').replace(/\{[\s\S]*?"type"\s*:\s*"(dashboard|none)"[\s\S]*?\}/g, '').trim();
      if (!cleanText) cleanText = "Visual Artifacts Generated Successfully.";
      const sourceFile = files.length > 0 ? files[0].name.split('.')[0] : null;
      setMessages([...newMessages, { role: 'assistant', text: cleanText, theme: extractedTheme, sourceFile }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', text: `❌ Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page active neural-data-studio">
      <div className="neural-header">
        <div className="header-left">
          <div className="neural-badge"><Activity size={12} /> NEURAL MATRIX ACTIVE</div>
          <h2 className="neural-title">Neural Data Studio <span className="version">v2.0</span></h2>
        </div>
        <div className="header-actions">
           <button className="neural-btn" onClick={() => setActiveTab('rawdata')}>
             <Database size={16} /> View Raw Feed
           </button>
           <button className="neural-btn btn-danger" onClick={handleClear}><Trash2 size={16} /></button>
        </div>
      </div>

      <div className="studio-container">
        {/* LEFT: COMMAND CENTER */}
        <div className="command-center glass-card">
           <div className="ingestion-area">
             <input type="file" id="data-input" hidden multiple onChange={handleFileUpload} />
             <label htmlFor="data-input" className="ingest-btn">
               {isProcessing ? <Loader2 className="animate-spin" /> : <UploadCloud />}
               <span>Ingest Knowledge ({files.length})</span>
             </label>
             <div className="file-pills">
                {files.map((f, i) => (
                  <div key={i} className="mini-pill">{f.name}</div>
                ))}
             </div>
           </div>

           <div className="chat-viewport">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div 
                    key={i} 
                    className={`neural-msg ${msg.role}`}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="msg-icon">{msg.role === 'assistant' ? <Brain size={16} /> : <User size={16} />}</div>
                    <div className="msg-content-wrapper">
                      <div 
                        className="msg-content" 
                        id={`msg-content-${i}`}
                        style={msg.theme ? {
                          backgroundColor: msg.theme.bg,
                          color: msg.theme.text,
                          borderColor: msg.theme.accent,
                          '--msg-accent': msg.theme.accent,
                          '--msg-heading': msg.theme.heading
                        } : {}}
                      >
                         <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                      </div>
                      {msg.role === 'assistant' && (
                        <div className="msg-actions">
                           <button className="action-btn" onClick={() => handleCopy(msg.text)}><Copy size={12}/> Copy Clean</button>
                           <div className="export-dropdown-container">
                             <button className="action-btn" onClick={() => setActiveExportMenu(activeExportMenu === i ? null : i)}><Download size={12}/> Omni-Export</button>
                             {activeExportMenu === i && (
                               <div className="export-menu">
                                 <div onClick={() => handleExport('PNG', msg.text, i)}>Download High-Res PNG</div>
                                 <div onClick={() => handleExport('PDF', msg.text, i)}>Generate PDF Report</div>
                                 <div onClick={() => handleExport('CSV', msg.text, i)}>Extract Table to CSV</div>
                                 <div onClick={() => handleExport('TXT', msg.text, i)}>Download Raw Text</div>
                               </div>
                             )}
                           </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
               {isLoading && (
                 <div className="loading-indicator">
                   <Sparkles className="animate-pulse" /> Channeling Intelligence...
                   <button className="cancel-btn" onClick={handleCancel}><XCircle size={14}/> Stop</button>
                 </div>
               )}
               <div ref={chatEndRef} />
            </div>

            <div className="command-input">
               <button className="clear-btn" onClick={handleClear} title="Clear Context"><Trash2 size={18} /></button>
               <textarea 
                 placeholder="Query the Matrix..." 
                 value={input}
                 onChange={e => setInput(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
               />
               <button className="send-btn" onClick={handleSend} disabled={isLoading}><Send size={18} /></button>
            </div>
        </div>

        {/* RIGHT: VISUAL INTELLIGENCE MATRIX (Only if visuals exist) */}
        {(meshData || chartData) && (
        <div className="visual-intelligence glass-card">
           <div className="matrix-tabs">
              <div className={`tab ${activeTab === 'mesh' ? 'active' : ''}`} onClick={() => setActiveTab('mesh')}><Layers size={14} /> Knowledge Mesh</div>
              <div className={`tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}><BarChart3 size={14} /> Live Analytics</div>
              <div className={`tab ${activeTab === 'rawdata' ? 'active' : ''}`} onClick={() => setActiveTab('rawdata')}><Database size={14} /> Raw Data Feed</div>
           </div>            <div className="matrix-viewport">
              {activeTab === 'mesh' ? (
                meshData ? <KnowledgeMesh nodes={meshData.nodes} edges={meshData.edges} theme={meshData.theme} /> : (
                  <div className="empty-matrix">
                     <div className="matrix-glow"></div>
                     <Brain size={64} className="icon-pulse" />
                     <p>Awaiting concept extraction. The Mesh is listening.</p>
                  </div>
                )
              ) : activeTab === 'analytics' ? (
                chartData ? (
                  <div className="chart-wrap">
                     <h4 className="chart-title" style={{ color: chartData.theme?.accent || 'var(--accent)' }}>Data Synthesis Result</h4>
                     <ResponsiveContainer width="100%" height={300}>
                        {chartData.chartType === 'area' ? (
                          <AreaChart data={chartData.data}>
                             <defs>
                               <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor={chartData.theme?.accent || 'var(--accent)'} stopOpacity={0.8}/>
                                 <stop offset="95%" stopColor={chartData.theme?.accent || 'var(--accent)'} stopOpacity={0}/>
                               </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                             <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                             <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                             <Tooltip contentStyle={{ background: '#0a0a14', border: `1px solid ${chartData.theme?.accent || 'var(--accent)'}` }} />
                             <Area type="monotone" dataKey="value" stroke={chartData.theme?.accent || 'var(--accent)'} fillOpacity={1} fill="url(#colorVal)" />
                          </AreaChart>
                        ) : (
                          <BarChart data={chartData.data}>
                             <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                             <Tooltip contentStyle={{ background: '#0a0a14', border: `1px solid ${chartData.theme?.accent || 'var(--accent)'}` }} />
                             <Bar dataKey="value" fill={chartData.theme?.accent || 'var(--accent)'} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        )}
                     </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="empty-matrix">
                     <BarChart3 size={64} className="icon-pulse" />
                     <p>No analytics patterns detected in the current stream.</p>
                  </div>
                )
              ) : activeTab === 'rawdata' ? (
                <div className="raw-data-feed">
                   {files.length === 0 ? (
                      <div className="empty-matrix">
                         <Database size={64} className="icon-pulse" />
                         <p>No active data streams detected. Upload or inject data to view the raw feed.</p>
                      </div>
                   ) : (
                      <div className="raw-files-container">
                         {files.map((file, i) => (
                            <div key={i} className="raw-file-block">
                               <div className="raw-file-header">
                                  <FileText size={14} /> {file.name}
                               </div>
                               <pre className="raw-file-content">
                                  {file.content.replace(/\*/g, '')}
                               </pre>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
              ) : null}
           </div>
        </div>
        )}
      </div>

      <style jsx>{`
        .neural-data-studio {
          display: flex; flex-direction: column; min-height: 100vh;
          background: #030308; padding: 40px; color: #ffffff;
          -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
        }
        .neural-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 30px; }
        .neural-badge { font-size: 12px; font-weight: 800; letter-spacing: 3px; color: var(--accent); display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .neural-title { font-size: 36px; font-weight: 900; letter-spacing: -2px; color: #ffffff; }
        .version { font-size: 14px; opacity: 0.5; vertical-align: middle; margin-left: 12px; }
        
        .header-actions { display: flex; gap: 20px; }
        .neural-btn { 
          background: rgba(124,92,252,0.1); border: 1px solid rgba(124,92,252,0.2);
          color: #ffffff; padding: 12px 25px; border-radius: 16px; display: flex; align-items: center; gap: 12px;
          font-size: 15px; font-weight: 600; cursor: pointer; transition: 0.3s;
        }
        .neural-btn:hover { background: rgba(124,92,252,0.2); border-color: var(--accent); transform: translateY(-2px); }

        .studio-container { display: flex; flex-direction: column; gap: 40px; width: 100%; max-width: 1400px; margin: 0 auto; }
        
        .command-center { display: flex; flex-direction: column; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); border-radius: 30px; overflow: hidden; transition: all 0.5s ease; }
        .visual-intelligence { display: flex; flex-direction: column; border: 2px solid var(--accent); background: rgba(124,92,252,0.02); border-radius: 30px; overflow: hidden; min-height: 600px; transition: all 0.5s ease; }

        .ingestion-area { padding: 8px 15px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; gap: 10px; align-items: center; background: rgba(0,0,0,0.2); }
        .ingest-btn { 
          background: var(--accent); color: #ffffff; padding: 5px 12px; border-radius: 30px;
          display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px; font-weight: 700;
        }
        .file-pills { display: flex; gap: 6px; overflow-x: auto; }
        .mini-pill { font-size: 9px; background: rgba(255,255,255,0.1); padding: 3px 10px; border-radius: 12px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.05); }

        .chat-viewport { padding: 40px; display: flex; flex-direction: column; gap: 30px; min-height: 500px; max-height: 800px; overflow-y: auto; background: rgba(0,0,0,0.1); }
        .neural-msg { display: flex; gap: 20px; max-width: 100%; width: 100%; }
        .neural-msg.user { align-self: flex-end; flex-direction: row-reverse; }
        .msg-icon { width: 40px; height: 40px; background: #000000; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid var(--accent); flex-shrink: 0; }
        
        .msg-content-wrapper { display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: calc(100% - 60px); position: relative; }
        .msg-content { background: rgba(255,255,255,0.03); padding: 20px 25px; border-radius: 20px; font-size: 16px; line-height: 1.7; border: 1px solid rgba(255,255,255,0.08); color: #ffffff; width: 100%; overflow-x: auto; }
        .neural-msg.user .msg-content { background: var(--accent); border-color: transparent; }
        
        .msg-actions { display: flex; gap: 10px; opacity: 0; transition: 0.3s; padding-left: 5px; }
        .neural-msg:hover .msg-actions { opacity: 1; }
        .action-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #888; padding: 4px 10px; border-radius: 12px; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: 0.2s; }
        .action-btn:hover { background: var(--accent); color: #fff; border-color: var(--accent); }
        .export-dropdown-container { position: relative; }
        .export-menu { position: absolute; top: 100%; left: 0; margin-top: 5px; background: rgba(10,10,20,0.95); border: 1px solid rgba(124,92,252,0.3); border-radius: 12px; padding: 5px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 50; display: flex; flex-direction: column; gap: 2px; min-width: 170px; backdrop-filter: blur(10px); }
        .export-menu div { padding: 8px 12px; font-size: 11px; color: #ccc; cursor: pointer; border-radius: 8px; transition: 0.2s; font-weight: 600; }
        .export-menu div:hover { background: rgba(124,92,252,0.2); color: #fff; }        .msg-content h1, .msg-content h2, .msg-content h3 { margin-top: 1.5em; margin-bottom: 0.8em; font-weight: 800; color: var(--msg-heading, #fff); letter-spacing: -0.5px; }
        .msg-content h1 { font-size: 1.6em; }
        .msg-content h2 { font-size: 1.4em; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px; }
        .msg-content h3 { font-size: 1.2em; color: var(--msg-accent, var(--accent)); }
        .msg-content p { margin-bottom: 1.2em; line-height: 1.8; letter-spacing: 0.2px; }
        .msg-content ul, .msg-content ol { margin-bottom: 1.2em; padding-left: 1.5em; line-height: 1.8; }
        .msg-content li { margin-bottom: 0.5em; }
        .msg-content strong { color: var(--msg-heading, #fff); font-weight: 700; }
        .msg-content table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 1.5em; margin-bottom: 2em; font-size: 15px; background: rgba(0,0,0,0.4); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); }
        .msg-content th, .msg-content td { border-bottom: 1px solid rgba(255,255,255,0.05); padding: 14px 18px; text-align: left; }
        .msg-content th { background: rgba(255,255,255,0.03); font-weight: 800; color: var(--msg-accent, var(--accent)); text-transform: uppercase; font-size: 12px; letter-spacing: 1.5px; }
        .msg-content tr:last-child td { border-bottom: none; }
        .msg-content tr:hover td { background: rgba(255,255,255,0.02); }
        
        .command-input { padding: 30px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 20px; background: rgba(0,0,0,0.3); }
        .command-input textarea { 
          flex: 1; background: #000000; border: 1px solid rgba(255,255,255,0.2); 
          padding: 15px 20px; border-radius: 20px; color: #fff; font-size: 16px; 
          resize: none; height: 60px; outline: none; transition: 0.3s;
        }
        .command-input textarea:focus { border-color: var(--accent); box-shadow: 0 0 15px rgba(124,92,252,0.2); }
        .send-btn { width: 60px; height: 60px; border-radius: 20px; background: var(--accent); border: none; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; }
        .send-btn:hover { background: #967aff; transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .clear-btn { width: 60px; height: 60px; border-radius: 20px; background: rgba(255,0,0,0.1); border: 1px solid rgba(255,0,0,0.3); color: #ff4d4d; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; }
        .clear-btn:hover { background: rgba(255,0,0,0.2); transform: scale(1.05); }
        .cancel-btn { background: rgba(255,0,0,0.2); border: 1px solid rgba(255,0,0,0.5); color: #ff6b6b; padding: 4px 10px; border-radius: 12px; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 5px; margin-left: 15px; }
        .cancel-btn:hover { background: rgba(255,0,0,0.4); }
        .send-btn:hover { filter: brightness(1.2); transform: scale(1.05); }

        .matrix-tabs { display: flex; background: rgba(0,0,0,0.4); padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .tab { flex: 1; padding: 15px; font-size: 13px; font-weight: 800; text-align: center; color: #888888; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: 0.3s; }
        .tab.active { color: #ffffff; background: var(--accent); border-radius: 12px; box-shadow: 0 5px 20px rgba(124,92,252,0.4); }

        .matrix-viewport { flex: 1; position: relative; display: flex; align-items: center; justify-content: center; padding: 40px; background: #000000; min-height: 500px; overflow: hidden; }
        
        .mesh-container { width: 100%; height: 100%; position: relative; display: flex; align-items: center; justify-content: center; }
        .mesh-svg { width: 100%; height: 100%; min-height: 400px; }
        .mesh-overlay { position: absolute; bottom: 20px; left: 0; right: 0; text-align: center; pointer-events: none; }
        .mesh-badge { display: inline-block; padding: 8px 20px; background: rgba(10,10,15,0.8); border: 1px solid var(--accent); border-radius: 30px; font-size: 12px; font-weight: 900; letter-spacing: 3px; color: var(--accent); box-shadow: 0 0 20px rgba(124,92,252,0.2); }

        .chart-wrap { width: 100%; height: 100%; background: #000000; border-radius: 25px; padding: 40px; }
        .chart-title { font-size: 16px; font-weight: 900; margin-bottom: 30px; color: var(--accent); text-transform: uppercase; letter-spacing: 3px; }

        .raw-data-feed { width: 100%; height: 100%; max-height: 500px; overflow-y: auto; padding: 20px; }
        .raw-files-container { display: flex; flex-direction: column; gap: 30px; }
        .raw-file-block { background: rgba(0,0,0,0.6); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .raw-file-header { background: rgba(52, 211, 153, 0.1); color: #34d399; padding: 12px 20px; font-size: 13px; font-weight: 800; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid rgba(52, 211, 153, 0.2); letter-spacing: 1px; }
        .raw-file-content { padding: 20px; color: #a7f3d0; font-family: 'Fira Code', monospace; font-size: 12px; line-height: 1.6; white-space: pre-wrap; overflow-x: hidden; text-shadow: 0 0 5px rgba(52, 211, 153, 0.2); }
      `}</style>
    </div>
  );
};

export default ChatWithData;
