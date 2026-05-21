import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocation } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import {
  UploadCloud, FileText, X, Loader2, Send, Brain, User, Trash2,
  Copy, Download, XCircle, Database, Sparkles, BarChart3, Layers,
  CheckCircle2, RefreshCw, Code2, TrendingUp, Sigma, GitBranch,
  AlertTriangle, Plus, ChevronDown
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// ── CHART COLORS ──────────────────────────────────────────────────────────────
const CHART_COLORS = ['#7c5cfc','#34d399','#f472b6','#fbbf24','#38bdf8','#a78bfa','#fb923c'];

// ── SMART CHART ───────────────────────────────────────────────────────────────
function SmartChart({ chartData }) {
  if (!chartData?.data?.length) return null;
  const accent = '#7c5cfc';
  const tip = { contentStyle:{ background:'#0a0a14', border:`1px solid ${accent}`, borderRadius:'10px', fontSize:'12px' } };
  return (
    <div style={{ width:'100%' }}>
      {chartData.title && <div style={{ fontSize:'11px', fontWeight:900, color:accent, letterSpacing:'2px', textTransform:'uppercase', marginBottom:'14px' }}>{chartData.title}</div>}
      <ResponsiveContainer width="100%" height={260}>
        {chartData.chartType === 'bar' ? (
          <BarChart data={chartData.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10}/>
            <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10}/>
            <Tooltip {...tip}/>
            <Bar dataKey="value" radius={[4,4,0,0]}>
              {chartData.data.map((_,i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]}/>)}
            </Bar>
          </BarChart>
        ) : chartData.chartType === 'pie' ? (
          <PieChart>
            <Pie data={chartData.data} dataKey="value" cx="50%" cy="50%" outerRadius={100}
              label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
              {chartData.data.map((_,i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]}/>)}
            </Pie>
            <Tooltip {...tip}/>
          </PieChart>
        ) : chartData.chartType === 'line' ? (
          <LineChart data={chartData.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10}/>
            <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10}/>
            <Tooltip {...tip}/>
            <Line type="monotone" dataKey="value" stroke={accent} strokeWidth={2} dot={{ fill:accent, r:4 }}/>
          </LineChart>
        ) : (
          <AreaChart data={chartData.data}>
            <defs>
              <linearGradient id="af" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={accent} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={accent} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10}/>
            <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10}/>
            <Tooltip {...tip}/>
            <Area type="monotone" dataKey="value" stroke={accent} fill="url(#af)" strokeWidth={2}/>
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// ── STAT CARDS ────────────────────────────────────────────────────────────────
function StatCards({ stats }) {
  if (!stats?.length) return null;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
      {stats.map((s,i) => (
        <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
          style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'13px', padding:'15px' }}>
          <div style={{ fontSize:'9px', fontWeight:900, color:'#444', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:'7px' }}>{s.label}</div>
          <div style={{ fontSize:'22px', fontWeight:900, letterSpacing:'-1px', color:s.color||'var(--accent)' }}>{s.value}</div>
          {s.change && <div style={{ fontSize:'11px', fontWeight:700, marginTop:'4px', color: s.change.startsWith('+')?'#34d399':'#f87171' }}>{s.change}</div>}
        </motion.div>
      ))}
    </div>
  );
}

// ── KNOWLEDGE MESH (SVG) ──────────────────────────────────────────────────────
function KnowledgeMesh({ nodes=[], edges=[] }) {
  if (!nodes.length) return null;
  return (
    <div style={{ position:'relative', width:'100%', minHeight:'320px', background:'#000', borderRadius:'14px', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(124,92,252,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,92,252,0.03) 1px,transparent 1px)', backgroundSize:'28px 28px' }}/>
      <svg viewBox="-80 -80 960 720" style={{ width:'100%', height:'100%', position:'absolute' }}>
        {edges.map((e,i) => {
          const s = nodes.find(n=>n.label===e.source), t = nodes.find(n=>n.label===e.target);
          if (!s||!t) return null;
          return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="var(--accent)" strokeWidth={e.weight?e.weight*1.5:1} opacity="0.2"/>;
        })}
        {!edges.length && nodes.map((n,i) => nodes.slice(i+1,i+3).map((t,j) => (
          <line key={`${i}-${j}`} x1={n.x} y1={n.y} x2={t.x} y2={t.y} stroke="var(--accent)" strokeWidth="1" opacity="0.1"/>
        )))}
        {nodes.map((n,i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r="12" fill="var(--accent)" opacity="0.9"/>
            <text x={n.x+18} y={n.y+5} fill="#fff" fontSize="13" fontWeight="700">{n.label}</text>
          </g>
        ))}
      </svg>
      <div style={{ position:'absolute', bottom:'10px', left:0, right:0, textAlign:'center' }}>
        <span style={{ fontSize:'9px', fontWeight:900, color:'#333', letterSpacing:'2px', background:'rgba(0,0,0,0.8)', padding:'4px 12px', borderRadius:'20px', border:'1px solid rgba(124,92,252,0.15)' }}>KNOWLEDGE MESH</span>
      </div>
    </div>
  );
}

// ── QUICK ACTIONS ─────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label:'Summarize',     icon:<FileText size={10}/>,    prompt:'Give a comprehensive summary of all uploaded data' },
  { label:'Key Stats',     icon:<Sigma size={10}/>,       prompt:'Extract all key statistics and numerical insights' },
  { label:'Find Anomalies',icon:<AlertTriangle size={10}/>,prompt:'Identify anomalies, outliers, and unusual patterns' },
  { label:'Trends',        icon:<TrendingUp size={10}/>,  prompt:'Analyze trends and patterns over time or categories' },
  { label:'Compare',       icon:<GitBranch size={10}/>,   prompt:'Compare and contrast different segments or categories' },
  { label:'SQL Queries',   icon:<Database size={10}/>,    prompt:'Write SQL queries to extract insights from this data' },
  { label:'Visualize',     icon:<BarChart3 size={10}/>,   prompt:'Suggest the best visualizations for this data and generate chart data' },
  { label:'Export Plan',   icon:<Download size={10}/>,    prompt:'Create a data export and reporting plan for this dataset' },
];

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ChatWithData() {
  const { activeModel, apiKey, providerKeys, customModels, showToast, saveToVault } = useContext(AppContext);
  const location = useLocation();

  const [files,       setFiles]       = useState([]);
  const [processing,  setProcessing]  = useState(false);
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [chartData,   setChartData]   = useState(null);
  const [statsData,   setStatsData]   = useState(null);
  const [meshData,    setMeshData]    = useState(null);
  const [activeViz,   setActiveViz]   = useState('chart');
  const [sessions,    setSessions]    = useState([]);
  const [exportMenu,  setExportMenu]  = useState(null);
  const [pdfReady,    setPdfReady]    = useState(false);
  const chatEndRef = useRef(null);
  const cancelRef  = useRef(false);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  useEffect(() => {
    try { setSessions(JSON.parse(localStorage.getItem('cwd_sessions')||'[]')); } catch(_) {}
  }, []);

  // Accept Spider payload
  useEffect(() => {
    if (location.state?.spiderPayload) {
      setFiles([{ name:'spider_report.md', content:location.state.spiderPayload, type:'text/markdown', size:location.state.spiderPayload.length }]);
      showToast('Spider report loaded!');
    }
  }, []);

  // Load pdf.js
  useEffect(() => {
    if (!window.pdfjsLib) {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; setPdfReady(true); };
      document.head.appendChild(s);
    } else setPdfReady(true);
  }, []);

  // ── FILE HANDLING ──
  const handleFileUpload = async (e) => {
    const newFiles = Array.from(e.target.files);
    if (!newFiles.length) return;
    setProcessing(true);
    const result = [];
    for (const f of newFiles) {
      try {
        let content = '';
        if (/\.(csv|txt|md|json|xml|js|ts|py|sql|html|css)$/i.test(f.name) || f.type.startsWith('text/')) {
          content = await f.text();
        } else if (/\.pdf$/i.test(f.name) && pdfReady && window.pdfjsLib) {
          const pdf = await window.pdfjsLib.getDocument({ data: await f.arrayBuffer() }).promise;
          let t = '';
          for (let i=1; i<=Math.min(pdf.numPages,50); i++) {
            const page = await pdf.getPage(i);
            const tc   = await page.getTextContent();
            t += tc.items.map(x=>x.str).join(' ') + '\n';
          }
          content = t;
        } else if (f.type.startsWith('image/')) {
          showToast(`OCR scanning ${f.name}...`);
          const r = await Tesseract.recognize(f,'eng');
          content = r.data.text;
        } else {
          try { content = await f.text(); } catch(_) { content = `[Binary file: ${f.name}]`; }
        }
        result.push({ name:f.name, content:content.slice(0,800000), type:f.type, size:f.size });
      } catch(err) {
        result.push({ name:f.name, content:`[Error: ${err.message}]`, type:f.type, size:f.size });
      }
    }
    setFiles(prev => [...prev, ...result]);
    setProcessing(false);
    showToast(`${result.length} file(s) ingested!`);
  };

  const saveSession = () => {
    if (!messages.length) return;
    const s = { id:Date.now(), date:new Date().toLocaleDateString(), files:files.map(f=>f.name), msgCount:messages.length, messages, chartData, statsData, meshData };
    const updated = [s, ...sessions].slice(0,10);
    setSessions(updated);
    localStorage.setItem('cwd_sessions', JSON.stringify(updated));
    showToast('Session saved!');
  };

  const loadSession = (s) => { setMessages(s.messages); if(s.chartData)setChartData(s.chartData); if(s.statsData)setStatsData(s.statsData); if(s.meshData)setMeshData(s.meshData); showToast('Session loaded!'); };

  const handleExport = (fmt, text, i) => {
    setExportMenu(null);
    let blob, ext;
    if (fmt==='MD')  { blob=new Blob([text],{type:'text/markdown'}); ext='md'; }
    if (fmt==='TXT') { blob=new Blob([text.replace(/\*\*/g,'').replace(/#{1,6} /g,'')],{type:'text/plain'}); ext='txt'; }
    if (fmt==='CSV') {
      const rows = text.match(/\|(.+)\|/g);
      if (!rows) { showToast('No table in response','error'); return; }
      const csv = rows.map(r=>r.split('|').filter(c=>c.trim()&&!/^[-:\s]+$/.test(c)).map(c=>`"${c.trim()}"`).join(',')).join('\n');
      blob=new Blob([csv],{type:'text/csv'}); ext='csv';
    }
    const a = Object.assign(document.createElement('a'),{ href:URL.createObjectURL(blob), download:`analysis_${i}.${ext}` });
    a.click(); URL.revokeObjectURL(a.href);
    showToast(`Exported as ${fmt}!`);
  };

  // ── SEND ──
  const handleSend = async () => {
    if (!input.trim() && !files.length) return;
    cancelRef.current = false;
    setLoading(true);
    const userMsg = input.trim() || 'Analyze the uploaded data comprehensively.';
    setInput('');
    const newMessages = [...messages, { role:'user', text:userMsg }];
    setMessages(newMessages);

    const dataContext = files.map(f=>`=== FILE: ${f.name} ===\n${f.content}`).join('\n\n');
    const history     = newMessages.slice(-8).map(m=>`${m.role==='user'?'USER':'ANALYST'}: ${m.text}`).join('\n\n');

    const system = `You are NEURAL DATA SOVEREIGN — the world's most elite AI data analyst.
You have access to the user's uploaded documents and data files.

RULES:
1. Provide EXHAUSTIVE analysis. Use markdown ## headers, **bold** for key numbers, tables for structured data.
2. Tables MUST have a blank line before and after them.
3. Reference specific data points from files.
4. Provide actionable recommendations.

DATA VISUALIZATION ENGINE — Append at response end in a \`\`\`json block:

For numerical/analytical data:
\`\`\`json
{
  "type": "dashboard",
  "stats": [
    { "label": "Total Records", "value": "1,234", "change": "+12%", "color": "#34d399" },
    { "label": "Avg Value", "value": "456.7", "color": "#7c5cfc" }
  ],
  "chart": {
    "chartType": "area",
    "title": "KEY METRIC",
    "data": [{ "name": "Jan", "value": 400 }, { "name": "Feb", "value": 600 }]
  },
  "mesh": {
    "nodes": [{ "x": 100, "y": 150, "label": "Topic A" }, { "x": 400, "y": 200, "label": "Topic B" }],
    "edges": [{ "source": "Topic A", "target": "Topic B", "weight": 2 }]
  }
}
\`\`\`

For text-only/no numerical data:
\`\`\`json
{ "type": "none" }
\`\`\`

chartType options: "area" | "bar" | "line" | "pie"
Node coordinates: x: 50-800, y: 50-550

UPLOADED FILES:
${dataContext.slice(0,600000)}`;

    try {
      const res = await callAI(system, history + `\n\nUSER: ${userMsg}`, null, activeModel, apiKey, providerKeys, customModels);
      if (cancelRef.current) return;

      // Parse visualization JSON
      const jsonBlocks = [...res.matchAll(/```(?:json)?\s*([\s\S]*?)\s*```/g)];
      for (const block of jsonBlocks) {
        try {
          const art = JSON.parse(block[1]);
          if (art.type === 'dashboard') {
            if (art.chart)  { setChartData(art.chart);  setActiveViz('chart'); }
            if (art.stats)  setStatsData(art.stats);
            if (art.mesh)   setMeshData(art.mesh);
          } else if (art.type === 'none') {
            setChartData(null); setStatsData(null); setMeshData(null);
          }
        } catch(_) {}
      }

      const clean = res.replace(/```(?:json)?\s*[\s\S]*?\s*```/g,'').trim() || 'Visualization generated.';
      setMessages([...newMessages, { role:'assistant', text:clean }]);
      saveToVault?.('ChatWithData', userMsg, clean);
    } catch(err) {
      setMessages([...newMessages, { role:'assistant', text:`❌ Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const hasViz = chartData || statsData || meshData;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#030308', padding:'28px 36px', gap:'16px', boxSizing:'border-box' }}>

      {/* ── HEADER ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div style={{ borderLeft:'4px solid var(--accent)', paddingLeft:'18px' }}>
          <div style={{ fontSize:'10px', fontWeight:900, color:'var(--accent)', letterSpacing:'3px', display:'flex', alignItems:'center', gap:'6px', marginBottom:'5px' }}>
            <Sparkles size={10}/> NEURAL DATA SOVEREIGN v3.0
          </div>
          <h2 style={{ fontSize:'30px', fontWeight:900, color:'#fff', letterSpacing:'-1.5px', margin:0 }}>Chat <span style={{ color:'var(--accent)' }}>With Data</span></h2>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <button onClick={saveSession} disabled={!messages.length} style={{ ...hdrBtn, opacity:!messages.length?0.4:1 }}><Plus size={12}/> Save</button>
          {sessions.length > 0 && (
            <div style={{ position:'relative' }}>
              <button onClick={() => setExportMenu(exportMenu==='sessions'?null:'sessions')} style={hdrBtn}><Database size={12}/> Sessions</button>
              {exportMenu === 'sessions' && (
                <div style={dropdown}>
                  {sessions.map(s => (
                    <div key={s.id} onClick={() => { loadSession(s); setExportMenu(null); }} style={{ padding:'9px 12px', cursor:'pointer', borderRadius:'7px', transition:'.2s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(124,92,252,0.1)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <div style={{ fontSize:'10px', color:'#555', fontWeight:700 }}>{s.date}</div>
                      <div style={{ fontSize:'12px', color:'#888', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'200px' }}>{s.files.join(', ')} · {s.msgCount} msgs</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <button onClick={() => { setMessages([]); setFiles([]); setChartData(null); setStatsData(null); setMeshData(null); showToast('Cleared'); }} style={{ ...hdrBtn, color:'#f87171', borderColor:'rgba(248,113,113,0.2)' }}><Trash2 size={12}/></button>
        </div>
      </div>

      {/* ── LAYOUT ── */}
      <div style={{ display:'flex', gap:'20px', flex:1, minHeight:0 }}>

        {/* CHAT PANEL */}
        <div style={{ display:'flex', flexDirection:'column', flex:1, background:'rgba(255,255,255,0.01)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'20px', overflow:'hidden', minHeight:0 }}>

          {/* File bar */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 14px', background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0, flexWrap:'wrap' }}>
            <input type="file" id="cwd-upload" hidden multiple accept=".csv,.txt,.pdf,.json,.md,.xml,.js,.ts,.py,.sql,.png,.jpg,.jpeg" onChange={handleFileUpload}/>
            <label htmlFor="cwd-upload" style={{ background:'rgba(124,92,252,0.15)', border:'1px solid rgba(124,92,252,0.3)', color:'var(--accent)', padding:'5px 13px', borderRadius:'20px', fontSize:'11px', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
              {processing ? <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/> : <UploadCloud size={11}/>}
              {processing ? 'Processing...' : `Ingest Data (${files.length})`}
            </label>
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
              {files.map((f,i) => (
                <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', color:'#888', padding:'3px 9px', borderRadius:'20px', fontSize:'10px', display:'flex', alignItems:'center', gap:'5px' }}>
                  <FileText size={8}/> {f.name}
                  <button onClick={() => setFiles(prev=>prev.filter((_,j)=>j!==i))} style={{ background:'none', border:'none', color:'#555', cursor:'pointer', padding:0, display:'flex', lineHeight:1 }}><X size={8}/></button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          {files.length > 0 && messages.length === 0 && (
            <div style={{ padding:'10px 14px', background:'rgba(124,92,252,0.03)', borderBottom:'1px solid rgba(255,255,255,0.04)', flexShrink:0 }}>
              <div style={{ fontSize:'9px', fontWeight:900, color:'#333', letterSpacing:'2px', marginBottom:'7px' }}>QUICK ACTIONS</div>
              <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                {QUICK_ACTIONS.map(qa => (
                  <button key={qa.label} onClick={() => setInput(qa.prompt)}
                    style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', color:'#666', padding:'4px 11px', borderRadius:'15px', fontSize:'11px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontWeight:600, transition:'.2s' }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)'; }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'; e.currentTarget.style.color='#666'; }}>
                    {qa.icon} {qa.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'18px', display:'flex', flexDirection:'column', gap:'14px', minHeight:0 }}>
            {messages.length === 0 && !loading && (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'40px 20px', gap:'12px' }}>
                <Brain size={44} style={{ color:'#1a1a2e' }}/>
                <h3 style={{ fontSize:'20px', fontWeight:800, color:'#fff', margin:0 }}>Neural Data Sovereign</h3>
                <p style={{ color:'#555', fontSize:'13px', maxWidth:'380px', lineHeight:'1.65', margin:0 }}>Upload CSV, PDF, JSON, images, or any data file. Ask anything — get deep analysis with live charts, tables, and knowledge graphs.</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', justifyContent:'center', marginTop:'6px' }}>
                  {['CSV · PDF · JSON · Images','Live charts & visualizations','Multi-file analysis','Export to CSV / Markdown'].map(f=>(
                    <div key={f} style={{ background:'rgba(124,92,252,0.06)', border:'1px solid rgba(124,92,252,0.12)', color:'#555', padding:'4px 11px', borderRadius:'15px', fontSize:'10px', fontWeight:600, display:'flex', alignItems:'center', gap:'5px' }}>
                      <CheckCircle2 size={9}/> {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity:0, x:msg.role==='user'?20:-20, y:8 }} animate={{ opacity:1, x:0, y:0 }}
                  style={{ display:'flex', gap:'10px', flexDirection:msg.role==='user'?'row-reverse':'row' }}>
                  <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'#000', border:'1px solid rgba(124,92,252,0.3)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent)', flexShrink:0 }}>
                    {msg.role==='assistant' ? <Brain size={13}/> : <User size={13}/>}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'5px', maxWidth:'calc(100% - 42px)', width:'100%' }}>
                    <div className="cwd-bubble" style={{ padding:'13px 17px', borderRadius:'15px', fontSize:'14px', lineHeight:'1.75',
                      ...(msg.role==='user'
                        ? { background:'var(--accent)', color:'#fff', marginLeft:'auto', maxWidth:'75%', borderBottomRightRadius:'4px' }
                        : { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', color:'#ddd', borderBottomLeftRadius:'4px' }) }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                    </div>
                    {msg.role==='assistant' && (
                      <div className="msg-actions" style={{ display:'flex', gap:'5px', opacity:0, transition:'.2s' }}>
                        <button onClick={() => { navigator.clipboard.writeText(msg.text); showToast('Copied!'); }} style={msgBtn}><Copy size={9}/> Copy</button>
                        <div style={{ position:'relative' }}>
                          <button onClick={() => setExportMenu(exportMenu===i?null:i)} style={msgBtn}><Download size={9}/> Export <ChevronDown size={8}/></button>
                          {exportMenu===i && (
                            <div style={{ ...dropdown, bottom:'100%', top:'auto', marginBottom:'4px', marginTop:0 }}>
                              {['MD','TXT','CSV'].map(f=>(
                                <div key={f} onClick={()=>handleExport(f,msg.text,i)} style={{ padding:'6px 12px', fontSize:'11px', color:'#aaa', cursor:'pointer', borderRadius:'6px', fontWeight:700, transition:'.2s' }}
                                  onMouseEnter={e=>{ e.currentTarget.style.background='rgba(124,92,252,0.15)'; e.currentTarget.style.color='#fff'; }}
                                  onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#aaa'; }}>
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

            {loading && (
              <div style={{ display:'flex', alignItems:'center', gap:'12px', color:'#555', fontSize:'13px', padding:'12px' }}>
                <div style={{ display:'flex', gap:'4px' }}>
                  {[0,1,2].map(i=><div key={i} style={{ width:'6px', height:'6px', background:'var(--accent)', borderRadius:'50%', animation:`dotBounce 1.2s ${i*0.2}s infinite` }}/>)}
                </div>
                Analyzing...
                <button onClick={()=>{ cancelRef.current=true; setLoading(false); }} style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.2)', color:'#f87171', padding:'3px 10px', borderRadius:'8px', fontSize:'10px', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', marginLeft:'auto' }}>
                  <XCircle size={11}/> Stop
                </button>
              </div>
            )}
            <div ref={chatEndRef}/>
          </div>

          {/* Input */}
          <div style={{ display:'flex', gap:'10px', padding:'14px', borderTop:'1px solid rgba(255,255,255,0.05)', background:'rgba(0,0,0,0.2)', flexShrink:0, alignItems:'flex-end' }}>
            <textarea
              rows={2}
              placeholder="Ask anything about your data — analysis, trends, SQL, summaries, visualizations... (Enter to send)"
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); handleSend(); } }}
              style={{ flex:1, background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'11px 15px', borderRadius:'13px', fontSize:'14px', resize:'none', outline:'none', fontFamily:'inherit', lineHeight:'1.5' }}
            />
            <button onClick={handleSend} disabled={loading||(!input.trim()&&!files.length)}
              style={{ width:'44px', height:'44px', background:'var(--accent)', border:'none', borderRadius:'13px', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, opacity:loading||(!input.trim()&&!files.length)?0.4:1, transition:'.2s' }}>
              {loading ? <Loader2 size={17} style={{ animation:'spin 1s linear infinite' }}/> : <Send size={17}/>}
            </button>
          </div>
        </div>

        {/* VIZ PANEL */}
        {hasViz && (
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
            style={{ width:'400px', flexShrink:0, background:'#000', border:'1px solid rgba(124,92,252,0.2)', borderRadius:'20px', overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', gap:'2px', padding:'7px', background:'rgba(124,92,252,0.04)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              {[
                chartData  && ['chart',  <BarChart3 size={11}/>, 'Charts'],
                statsData  && ['stats',  <Sigma size={11}/>,     'Stats'],
                meshData   && ['mesh',   <Layers size={11}/>,    'Knowledge'],
                files.length && ['raw',  <Code2 size={11}/>,     'Raw Data'],
              ].filter(Boolean).map(([id,icon,label]) => (
                <button key={id} onClick={()=>setActiveViz(id)}
                  style={{ flex:1, padding:'7px', background:activeViz===id?'var(--accent)':'transparent', border:'none', borderRadius:'7px', color:activeViz===id?'#fff':'#555', fontSize:'10px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', transition:'.2s' }}>
                  {icon} {label}
                </button>
              ))}
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'18px' }}>
              {activeViz==='chart' && chartData && <SmartChart chartData={chartData}/>}
              {activeViz==='stats' && statsData && <StatCards stats={statsData}/>}
              {activeViz==='mesh'  && meshData  && <KnowledgeMesh nodes={meshData.nodes} edges={meshData.edges}/>}
              {activeViz==='raw'   && (
                <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                  {files.map((f,i) => (
                    <div key={i} style={{ border:'1px solid rgba(52,211,153,0.15)', borderRadius:'11px', overflow:'hidden' }}>
                      <div style={{ background:'rgba(52,211,153,0.06)', color:'#34d399', padding:'7px 13px', fontSize:'10px', fontWeight:800, display:'flex', alignItems:'center', gap:'6px', borderBottom:'1px solid rgba(52,211,153,0.1)' }}>
                        <FileText size={10}/> {f.name} <span style={{ marginLeft:'auto', color:'#555' }}>{(f.size/1024).toFixed(1)}KB</span>
                      </div>
                      <pre style={{ padding:'10px', color:'#34d399', fontFamily:"'DM Mono',monospace", fontSize:'9px', lineHeight:'1.5', whiteSpace:'pre-wrap', maxHeight:'200px', overflowY:'auto', margin:0, background:'rgba(0,0,0,0.4)' }}>
                        {f.content.slice(0,2500)}{f.content.length>2500?'\n... (truncated)':''}
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
        .cwd-bubble h1,.cwd-bubble h2,.cwd-bubble h3{color:#fff;font-weight:800;margin:16px 0 8px;letter-spacing:-.5px}
        .cwd-bubble h2{font-size:1.05em;border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:7px}
        .cwd-bubble h3{font-size:.95em;color:var(--accent)}
        .cwd-bubble p{margin-bottom:9px}
        .cwd-bubble strong{color:#fff;font-weight:800}
        .cwd-bubble a{color:var(--accent)}
        .cwd-bubble table{width:100%;border-collapse:collapse;margin:12px 0;font-size:12px}
        .cwd-bubble th{background:rgba(124,92,252,.1);color:var(--accent);padding:7px 11px;font-size:10px;letter-spacing:1px;text-align:left;border:1px solid rgba(255,255,255,.05)}
        .cwd-bubble td{padding:7px 11px;border:1px solid rgba(255,255,255,.04);color:#ccc}
        .cwd-bubble pre{background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.07);border-radius:9px;padding:12px;overflow-x:auto;margin:9px 0}
        .cwd-bubble code{font-family:'DM Mono',monospace;color:var(--accent);font-size:12px}
        .cwd-bubble pre code{color:#e2e8f0}
        .cwd-bubble ul,.cwd-bubble ol{padding-left:18px;margin-bottom:9px}
        .cwd-bubble li{margin-bottom:4px;color:#ccc}
      `}</style>
    </div>
  );
}

const hdrBtn  = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#aaa', padding:'8px 14px', borderRadius:'11px', fontSize:'11px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', transition:'.2s' };
const msgBtn  = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', color:'#555', padding:'3px 9px', borderRadius:'7px', fontSize:'10px', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', transition:'.2s' };
const dropdown= { position:'absolute', top:'100%', right:0, marginTop:'5px', background:'rgba(10,10,20,0.98)', border:'1px solid rgba(124,92,252,0.2)', borderRadius:'12px', padding:'5px', zIndex:100, minWidth:'120px', backdropFilter:'blur(20px)', boxShadow:'0 15px 40px rgba(0,0,0,0.6)' };
