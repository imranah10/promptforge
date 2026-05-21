import React, { useState, useContext, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Search, Globe, Zap, Shield, Send, Loader2, Copy, Download,
  RefreshCw, FileText, Code2, Clock, Network, Brain, BarChart3,
  CheckCircle2, ChevronDown, ChevronUp, Eye, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MODES = [
  { id:'dossier',  icon:<Shield size={13}/>,    label:'Intelligence Dossier', desc:'Deep report with all sources' },
  { id:'summary',  icon:<FileText size={13}/>,  label:'Quick Summary',        desc:'Key facts, fast' },
  { id:'compare',  icon:<BarChart3 size={13}/>, label:'Compare & Contrast',   desc:'Structured comparison table' },
  { id:'code',     icon:<Code2 size={13}/>,     label:'Technical Extract',    desc:'Code, APIs, docs' },
  { id:'timeline', icon:<Clock size={13}/>,     label:'Timeline Analysis',    desc:'Chronological breakdown' },
  { id:'entity',   icon:<Network size={13}/>,   label:'Entity Map',           desc:'People, orgs, connections' },
];

const MODE_PROMPTS = {
  dossier:  'Create an EXHAUSTIVE INTELLIGENCE DOSSIER with bold ## headers, tables for key data, statistics in bold. Include: Executive Summary → Core Analysis → Key Data Points → Entities → Sources. Minimum 800 words.',
  summary:  'Create a CONCISE SMART SUMMARY in 5 sections: TL;DR (2-3 sentences) → Key Facts (5 bullets) → Critical Numbers → Who\'s Involved → Bottom Line.',
  compare:  'Extract all comparable entities/options and create a STRUCTURED COMPARISON TABLE using markdown, then a recommendation section.',
  code:     'Extract all CODE SAMPLES, API endpoints, technical specs, version numbers, and config snippets. Format each in code blocks with language labels.',
  timeline: 'Reconstruct a CHRONOLOGICAL TIMELINE of all events/updates mentioned. Use markdown with dates on the left. Highlight key milestones.',
  entity:   'Build an ENTITY MAP extracting: People (name, role, relevance), Organizations (name, type, relation), Technologies (name, purpose). Use markdown tables.',
};

export default function TheSpider() {
  const { providerKeys, showToast, activeModel, apiKey, customModels, saveToVault } = useContext(AppContext);
  const navigate = useNavigate();

  const [query,        setQuery]        = useState('');
  const [mode,         setMode]         = useState('dossier');
  const [depth,        setDepth]        = useState('deep');
  const [loading,      setLoading]      = useState(false);
  const [steps,        setSteps]        = useState([]);
  const [result,       setResult]       = useState('');
  const [rawContent,   setRawContent]   = useState('');
  const [meta,         setMeta]         = useState(null);
  const [followUps,    setFollowUps]    = useState([]);
  const [followInput,  setFollowInput]  = useState('');
  const [activeTab,    setActiveTab]    = useState('report');
  const [history,      setHistory]      = useState([]);
  const [showHist,     setShowHist]     = useState(false);
  const cancelRef = useRef(false);

  const addStep     = (text)  => setSteps(prev => [...prev, { text, done:false }]);
  const doneStep    = (i)     => setSteps(prev => prev.map((s,idx) => idx===i ? {...s,done:true} : s));
  const doneAll     = ()      => setSteps(prev => prev.map(s => ({...s,done:true})));

  const handleSearch = async () => {
    if (!query.trim()) { showToast('Enter a query first', 'error'); return; }
    cancelRef.current = false;
    setLoading(true); setResult(''); setMeta(null); setFollowUps([]); setSteps([]); setRawContent(''); setActiveTab('report');

    try {
      const isUrl = /^https?:\/\//i.test(query.trim());
      addStep(isUrl ? 'Extracting target URL content...' : 'Querying global web index...');

      const endpoint = isUrl
        ? `https://r.jina.ai/${query.trim()}`
        : `https://s.jina.ai/${encodeURIComponent(query.trim())}`;

      let raw = '';
      try {
        const r = await fetch(endpoint, { headers:{ Accept:'text/plain' } });
        raw = await r.text();
      } catch(e) { throw new Error('Web extraction failed: ' + e.message); }

      if (!raw || raw.length < 50) throw new Error('No data retrieved. Try a different query or URL.');
      setRawContent(raw);
      doneStep(0);

      let enriched = raw;
      if (depth === 'deep' && !isUrl) {
        addStep('Running secondary extraction pass...');
        try {
          const r2 = await fetch(`https://s.jina.ai/${encodeURIComponent(query.trim() + ' detailed analysis')}`, { headers:{ Accept:'text/plain' } });
          const t2 = await r2.text();
          if (t2?.length > 100) enriched = raw + '\n\n--- SECONDARY SOURCE ---\n\n' + t2;
        } catch(_) {}
        doneStep(1);
      }

      addStep('Synthesizing intelligence with AI...');

      const system = `You are SPIDER PRIME — the world's most advanced real-time web intelligence AI.
You have just received live-scraped web data. Your task: ${MODE_PROMPTS[mode]}

RULES:
1. Every claim must reference the source data. No hallucinations.
2. Clickable links: [Source Name](URL)
3. Remove navigation, ads, footer junk from raw input.
4. Depth: ${depth.toUpperCase()}.

At the very end, append this metadata in a JSON block:
\`\`\`json
{
  "sourceCount": 3,
  "wordCount": 900,
  "credibility": "High",
  "freshness": "Live data",
  "suggestedFollowUps": ["follow-up question 1", "follow-up question 2", "follow-up question 3"]
}
\`\`\``;

      const user = `LIVE WEB DATA:\n${enriched.substring(0,50000)}\n\nORIGINAL QUERY: "${query}"`;

      const res = await callAI(system, user, null, activeModel, apiKey, providerKeys, customModels);
      if (cancelRef.current) return;
      doneAll();

      const metaMatch = res.match(/```json\s*([\s\S]*?)```/);
      let metaData = null;
      if (metaMatch) { try { metaData = JSON.parse(metaMatch[1]); } catch(_) {} }

      const cleanRes = res.replace(/```json[\s\S]*?```/g, '').trim();
      setResult(cleanRes);
      if (metaData) { setMeta(metaData); if (metaData.suggestedFollowUps) setFollowUps(metaData.suggestedFollowUps); }

      setHistory(prev => [{ id:Date.now(), query:query.slice(0,80), mode, result:cleanRes }, ...prev].slice(0,15));
      saveToVault?.('TheSpider', query, cleanRes);
      showToast('Intelligence acquired!');
    } catch(e) {
      showToast('Spider Error: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUp = async (fq) => {
    if (!fq.trim() || !rawContent) return;
    setFollowInput('');
    setLoading(true);
    try {
      const system = `You are SPIDER PRIME answering a follow-up question. Base your answer ONLY on the already-scraped web data. Be specific and detailed. Use markdown.`;
      const user   = `ORIGINAL QUERY: "${query}"\nSCRAPED DATA: ${rawContent.substring(0,30000)}\nFOLLOW-UP: "${fq}"`;
      const res    = await callAI(system, user, null, activeModel, apiKey, providerKeys, customModels);
      setResult(prev => prev + `\n\n---\n\n## 🔍 Follow-up: ${fq}\n\n${res}`);
      showToast('Follow-up answered!');
    } catch(e) { showToast('Follow-up failed: ' + e.message, 'error'); }
    finally    { setLoading(false); }
  };

  const copyResult  = (clean) => {
    const text = clean ? result.replace(/\*\*/g,'').replace(/#{1,3} /g,'').replace(/\[(.*?)\]\((.*?)\)/g,'$1 ($2)') : result;
    navigator.clipboard.writeText(text); showToast(clean ? 'Clean text copied!' : 'Markdown copied!');
  };
  const downloadResult = () => {
    const a = Object.assign(document.createElement('a'), { href:URL.createObjectURL(new Blob([result],{type:'text/markdown'})), download:`spider_${Date.now()}.md` });
    a.click(); URL.revokeObjectURL(a.href); showToast('Downloaded!');
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'#030308', padding:'40px', gap:'28px', boxSizing:'border-box' }}>

      {/* ── HEADER ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'16px' }}>
        <div style={{ borderLeft:'4px solid var(--accent)', paddingLeft:'20px' }}>
          <div style={{ fontSize:'10px', fontWeight:900, color:'var(--accent)', letterSpacing:'4px', display:'flex', alignItems:'center', gap:'7px', marginBottom:'8px' }}><Network size={11}/> NEURAL WEB INTELLIGENCE v3.0</div>
          <h2 style={{ fontSize:'38px', fontWeight:900, color:'#fff', letterSpacing:'-2px', margin:0 }}>The <span style={{ color:'var(--accent)' }}>Spider</span></h2>
          <p style={{ color:'#555', fontSize:'13px', marginTop:'5px', maxWidth:'480px' }}>Real-time web extraction → AI synthesis → Multi-format intelligence reports.</p>
        </div>

        {/* Mini history */}
        {history.length > 0 && (
          <div style={{ background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'14px', minWidth:'220px', maxWidth:'280px' }}>
            <div style={{ fontSize:'9px', fontWeight:900, color:'#333', letterSpacing:'2px', marginBottom:'8px' }}>RECENT</div>
            {history.slice(0,4).map(h => (
              <div key={h.id} onClick={() => { setResult(h.result); setQuery(h.query); setActiveTab('report'); }}
                style={{ fontSize:'12px', color:'#666', padding:'5px 7px', borderRadius:'7px', cursor:'pointer', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', transition:'.2s' }}
                onMouseEnter={e=>e.target.style.color='var(--accent)'} onMouseLeave={e=>e.target.style.color='#666'}>
                {h.query}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SEARCH AREA ── */}
      <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

        {/* Mode selector */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'8px' }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{ background: mode===m.id ? 'rgba(124,92,252,0.12)' : 'rgba(255,255,255,0.02)', border:`1px solid ${mode===m.id?'var(--accent)':'rgba(255,255,255,0.06)'}`, borderRadius:'13px', padding:'12px 10px', cursor:'pointer', color:'#fff', display:'flex', flexDirection:'column', gap:'5px', textAlign:'left', transition:'all .2s' }}>
              {m.icon}
              <span style={{ fontSize:'11px', fontWeight:700 }}>{m.label}</span>
              <span style={{ fontSize:'9px', color:'#555' }}>{m.desc}</span>
            </button>
          ))}
        </div>

        {/* Depth + Search bar */}
        <div style={{ display:'flex', gap:'10px', alignItems:'stretch' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
            {[['quick','⚡ Quick'],['deep','🔬 Deep']].map(([id,label]) => (
              <button key={id} onClick={() => setDepth(id)} style={{ background: depth===id?'rgba(124,92,252,0.15)':'rgba(255,255,255,0.02)', border:`1px solid ${depth===id?'var(--accent)':'rgba(255,255,255,0.06)'}`, color: depth===id?'var(--accent)':'#555', padding:'9px 14px', borderRadius:'10px', fontSize:'11px', fontWeight:800, cursor:'pointer', whiteSpace:'nowrap', transition:'.2s' }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ flex:1, display:'flex', alignItems:'center', background:'rgba(0,0,0,0.6)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'15px', padding:'0 18px', gap:'10px' }}>
            <Search size={17} style={{ color:'#444', flexShrink:0 }}/>
            <input
              style={{ flex:1, background:'none', border:'none', color:'#fff', fontSize:'15px', padding:'17px 0', outline:'none' }}
              placeholder="Enter URL, topic, company, person, question..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key==='Enter' && !loading && handleSearch()}
            />
            {query && <button onClick={() => setQuery('')} style={{ background:'none', border:'none', color:'#444', cursor:'pointer', fontSize:'15px' }}>✕</button>}
          </div>

          <button onClick={handleSearch} disabled={loading} style={{ background:'var(--accent)', border:'none', color:'#fff', padding:'0 26px', borderRadius:'15px', fontSize:'14px', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', boxShadow:'0 8px 25px rgba(124,92,252,0.3)', opacity:loading?0.6:1, whiteSpace:'nowrap', transition:'.3s' }}>
            {loading ? <Loader2 size={16} style={{ animation:'spin 1s linear infinite' }}/> : <><Eye size={15}/> Deploy Spider</>}
          </button>
        </div>
      </div>

      {/* ── LOADING STATE ── */}
      <AnimatePresence>
        {loading && steps.length > 0 && (
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{ background:'rgba(124,92,252,0.04)', border:'1px solid rgba(124,92,252,0.15)', borderRadius:'18px', padding:'30px', display:'flex', alignItems:'center', gap:'32px' }}>
            <div style={{ position:'relative', width:'80px', height:'80px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {[0,1].map(i => <div key={i} style={{ position:'absolute', inset:0, border:'2px solid var(--accent)', borderRadius:'50%', animation:`radarPing 2s ease-out ${i*0.7}s infinite`, opacity:0 }}/>)}
              <Globe size={26} style={{ color:'var(--accent)', animation:'slowSpin 8s linear infinite', zIndex:2 }}/>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'9px' }}>
              {steps.map((s,i) => (
                <motion.div key={i} initial={{ opacity:0, x:-15 }} animate={{ opacity:1, x:0 }} style={{ display:'flex', alignItems:'center', gap:'9px', fontSize:'13px', color: s.done?'#34d399':'#666' }}>
                  {s.done
                    ? <CheckCircle2 size={13} color="#34d399"/>
                    : <div style={{ width:'13px', height:'13px', border:'2px solid rgba(124,92,252,0.4)', borderTopColor:'var(--accent)', borderRadius:'50%', flexShrink:0, animation:'spin 0.8s linear infinite' }}/>}
                  {s.text}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RESULTS ── */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ background:'#000', border:'1px solid rgba(124,92,252,0.25)', borderRadius:'22px', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>

            {/* Results header */}
            <div style={{ background:'rgba(124,92,252,0.06)', padding:'16px 22px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', flexWrap:'wrap', gap:'10px', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'11px', fontWeight:900, color:'var(--accent)', letterSpacing:'2px' }}>
                <Shield size={13}/> INTELLIGENCE REPORT
                <span style={{ background:'rgba(124,92,252,0.15)', color:'#a78bfa', padding:'2px 9px', borderRadius:'20px', fontSize:'9px', fontWeight:700 }}>
                  {MODES.find(m=>m.id===mode)?.label}
                </span>
              </div>

              {/* Meta chips */}
              {meta && (
                <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                  {[
                    [meta.sourceCount && `${meta.sourceCount} sources`],
                    [meta.credibility && `${meta.credibility} credibility`, meta.credibility==='High'?'#34d399':'#fbbf24'],
                    [meta.freshness && meta.freshness],
                  ].filter(([v])=>v).map(([v,c],i) => (
                    <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', color:c||'#555', padding:'3px 9px', borderRadius:'20px', fontSize:'10px', fontWeight:700 }}>{v}</div>
                  ))}
                </div>
              )}

              <div style={{ display:'flex', gap:'6px', marginLeft:'auto', flexWrap:'wrap' }}>
                <button onClick={() => navigate('/dashboard/chatdata', { state:{ spiderPayload:result, spiderQuery:query } })} style={spBtn}><Brain size={12}/> Send to Chat</button>
                <button onClick={() => copyResult(false)} style={spBtn}><Copy size={12}/> Markdown</button>
                <button onClick={() => copyResult(true)}  style={spBtn}><FileText size={12}/> Clean Text</button>
                <button onClick={downloadResult}          style={spBtn}><Download size={12}/> Download</button>
                <button onClick={handleSearch}            style={spBtn}><RefreshCw size={12}/> Re-run</button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', gap:'2px', padding:'7px 10px', background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              {[
                ['report',  <FileText size={12}/>,  'Report'],
                followUps.length > 0 && ['followup', <Brain size={12}/>,    `Follow-up (${followUps.length})`],
                rawContent && ['raw', <Code2 size={12}/>, 'Raw Feed'],
              ].filter(Boolean).map(([id,icon,label]) => (
                <button key={id} onClick={() => setActiveTab(id)} style={{ background:activeTab===id?'var(--accent)':'transparent', border:'none', color:activeTab===id?'#fff':'#555', padding:'7px 14px', borderRadius:'7px', fontSize:'11px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', transition:'.2s' }}>
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'report' && (
              <div style={{ padding:'32px', fontSize:'15px', lineHeight:'1.85', color:'rgba(255,255,255,0.87)', maxHeight:'800px', overflowY:'auto' }} className="sp-md-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
              </div>
            )}

            {activeTab === 'followup' && (
              <div style={{ padding:'22px', display:'flex', flexDirection:'column', gap:'16px' }}>
                <div>
                  <div style={{ fontSize:'9px', fontWeight:900, color:'#333', letterSpacing:'2px', marginBottom:'10px' }}>SUGGESTED FOLLOW-UPS</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                    {followUps.map((fq,i) => (
                      <button key={i} onClick={() => handleFollowUp(fq)} style={{ background:'rgba(124,92,252,0.06)', border:'1px solid rgba(124,92,252,0.14)', color:'#aaa', padding:'11px 15px', borderRadius:'11px', fontSize:'13px', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:'8px', transition:'.2s' }}>
                        <Zap size={11}/> {fq}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display:'flex', gap:'8px' }}>
                  <input
                    style={{ flex:1, background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'13px 16px', borderRadius:'13px', fontSize:'14px', outline:'none' }}
                    placeholder="Ask anything about the extracted data..."
                    value={followInput}
                    onChange={e => setFollowInput(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && handleFollowUp(followInput)}
                  />
                  <button onClick={() => handleFollowUp(followInput)} style={{ background:'var(--accent)', border:'none', color:'#fff', padding:'0 16px', borderRadius:'13px', cursor:'pointer' }}>
                    <Send size={15}/>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'raw' && (
              <div style={{ padding:'18px', maxHeight:'500px', overflow:'auto' }}>
                <pre style={{ color:'#34d399', fontFamily:"'DM Mono',monospace", fontSize:'11px', lineHeight:'1.6', whiteSpace:'pre-wrap', margin:0 }}>
                  {rawContent.slice(0,10000)}{rawContent.length>10000?'\n\n[... truncated ...]':''}
                </pre>
              </div>
            )}

            <div style={{ padding:'11px 22px', background:'rgba(0,0,0,0.3)', borderTop:'1px solid rgba(255,255,255,0.04)', fontSize:'10px', color:'#333', textAlign:'center', fontStyle:'italic' }}>
              Live data extracted via Jina AI · Synthesized by {activeModel || 'AI'} · {new Date().toLocaleString()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EMPTY STATE ── */}
      {!result && !loading && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'18px', padding:'70px 30px', textAlign:'center' }}>
          <div style={{ position:'relative', width:'100px', height:'100px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ position:'absolute', inset:0, border:'2px solid rgba(124,92,252,0.1)', borderRadius:'50%', animation:'radarPing 3s ease-out infinite' }}/>
            <Globe size={38} style={{ color:'#1a1a2e' }}/>
          </div>
          <p style={{ color:'#444', fontSize:'14px', maxWidth:'460px', lineHeight:'1.7' }}>
            Spider awaits. Enter any URL, topic, company, technology, or question to extract live web intelligence.
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'center' }}>
            {['https://openai.com','Latest AI research 2025','Tesla earnings Q4','React vs Vue 2025','Elon Musk companies'].map(ex => (
              <button key={ex} onClick={() => setQuery(ex)}
                style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', color:'#555', padding:'7px 15px', borderRadius:'20px', fontSize:'12px', cursor:'pointer', transition:'.2s' }}
                onMouseEnter={e=>{ e.target.style.borderColor='var(--accent)'; e.target.style.color='var(--accent)'; }}
                onMouseLeave={e=>{ e.target.style.borderColor='rgba(255,255,255,0.06)'; e.target.style.color='#555'; }}>
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin      { to { transform:rotate(360deg); } }
        @keyframes radarPing { 0%{transform:scale(.3);opacity:.7} 100%{transform:scale(1.5);opacity:0} }
        @keyframes slowSpin  { to { transform:rotate(360deg); } }
        .sp-md-body h1,.sp-md-body h2,.sp-md-body h3{color:#fff;font-weight:800;margin:24px 0 10px;letter-spacing:-.5px}
        .sp-md-body h2{border-bottom:1px solid rgba(124,92,252,.15);padding-bottom:9px}
        .sp-md-body h3{color:var(--accent);font-size:1em}
        .sp-md-body p{margin-bottom:12px;color:rgba(255,255,255,.75)}
        .sp-md-body strong{color:#fff;font-weight:800}
        .sp-md-body a{color:var(--accent);text-decoration:none;border-bottom:1px dashed rgba(124,92,252,.4)}
        .sp-md-body ul{padding-left:0;list-style:none;margin-bottom:14px}
        .sp-md-body li{padding:7px 12px 7px 13px;border-left:2px solid rgba(124,92,252,.3);margin-bottom:5px;color:rgba(255,255,255,.7);background:rgba(124,92,252,.02);border-radius:0 7px 7px 0}
        .sp-md-body table{width:100%;border-collapse:collapse;margin:16px 0;font-size:13px}
        .sp-md-body th{background:rgba(124,92,252,.1);color:var(--accent);padding:9px 13px;text-align:left;font-size:10px;letter-spacing:1px;border:1px solid rgba(255,255,255,.05)}
        .sp-md-body td{padding:9px 13px;border:1px solid rgba(255,255,255,.04);color:rgba(255,255,255,.7)}
        .sp-md-body code{background:rgba(124,92,252,.1);color:#a78bfa;padding:2px 5px;border-radius:4px;font-size:12px;font-family:'DM Mono',monospace}
        .sp-md-body pre{background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.08);border-radius:11px;padding:14px;overflow-x:auto;margin:14px 0}
        .sp-md-body pre code{background:none;color:#e2e8f0;font-size:12px}
      `}</style>
    </div>
  );
}

const spBtn = { background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', color:'#aaa', padding:'6px 12px', borderRadius:'9px', fontSize:'11px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', whiteSpace:'nowrap' };
