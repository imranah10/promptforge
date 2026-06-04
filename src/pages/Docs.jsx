import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Copy, Check, Globe, Loader2, RefreshCw } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';

// ── TOP 20 LANGUAGES + "OTHER" INPUT ─────────────────────────────────────────
const LANGS = [
  { code:'en', label:'🇺🇸 English' },
  { code:'hi', label:'🇮🇳 हिंदी' },
  { code:'es', label:'🇪🇸 Español' },
  { code:'zh', label:'🇨🇳 中文' },
  { code:'ar', label:'🇸🇦 العربية' },
  { code:'pt', label:'🇧🇷 Português' },
  { code:'fr', label:'🇫🇷 Français' },
  { code:'de', label:'🇩🇪 Deutsch' },
  { code:'ja', label:'🇯🇵 日本語' },
  { code:'ru', label:'🇷🇺 Русский' },
  { code:'ko', label:'🇰🇷 한국어' },
  { code:'it', label:'🇮🇹 Italiano' },
  { code:'tr', label:'🇹🇷 Türkçe' },
  { code:'nl', label:'🇳🇱 Nederlands' },
  { code:'pl', label:'🇵🇱 Polski' },
  { code:'vi', label:'🇻🇳 Tiếng Việt' },
  { code:'th', label:'🇹🇭 ภาษาไทย' },
  { code:'id', label:'🇮🇩 Bahasa Indonesia' },
  { code:'bn', label:'🇧🇩 বাংলা' },
  { code:'ur', label:'🇵🇰 اردو' },
  { code:'other', label:'🌍 Other language...' },
];

function CodeBlock({ code, lang = '' }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ background:'#000', border:'1px solid rgba(124,92,252,0.25)', borderRadius:'12px', overflow:'hidden', margin:'14px 0' }}>
      <div style={{ background:'rgba(124,92,252,0.08)', padding:'8px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(124,92,252,0.1)' }}>
        <span style={{ fontSize:'10px', fontWeight:800, color:'#a78bfa', letterSpacing:'2px' }}>{lang.toUpperCase() || 'CODE'}</span>
        <button onClick={copy} style={{ background:'none', border:'none', color:copied?'#34d399':'#555', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', fontWeight:700 }}>
          {copied ? <><Check size={11}/> Copied</> : <><Copy size={11}/> Copy</>}
        </button>
      </div>
      <pre style={{ padding:'16px', margin:0, overflowX:'auto', fontFamily:"'DM Mono',monospace", fontSize:'13px', lineHeight:1.7, color:'#e2e8f0' }}>{code}</pre>
    </div>
  );
}

function TipBox({ type = 'tip', children }) {
  const cfg = {
    tip:  { bg:'rgba(124,92,252,0.06)', border:'rgba(124,92,252,0.25)', label:'💡 TIP',     color:'#a78bfa' },
    try:  { bg:'rgba(52,211,153,0.06)', border:'rgba(52,211,153,0.25)', label:'🧪 TRY THIS', color:'#34d399' },
    warn: { bg:'rgba(251,191,36,0.06)', border:'rgba(251,191,36,0.25)', label:'⚠️ NOTE',    color:'#fbbf24' },
    info: { bg:'rgba(56,189,248,0.06)', border:'rgba(56,189,248,0.25)', label:'ℹ️ INFO',    color:'#38bdf8' },
  };
  const c = cfg[type];
  return (
    <div style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:'12px', padding:'16px 20px', margin:'16px 0' }}>
      <div style={{ fontSize:'10px', fontWeight:800, color:c.color, letterSpacing:'2px', marginBottom:'8px' }}>{c.label}</div>
      <div style={{ fontSize:'13px', color:'#94a3b8', lineHeight:1.7 }}>{children}</div>
    </div>
  );
}

function Step({ num, title, children }) {
  return (
    <div style={{ display:'flex', gap:'18px', marginBottom:'24px' }}>
      <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'rgba(124,92,252,0.15)', border:'2px solid rgba(124,92,252,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:900, color:'var(--accent)', flexShrink:0 }}>{num}</div>
      <div style={{ paddingTop:'6px', flex:1 }}>
        <div style={{ fontSize:'15px', fontWeight:700, color:'#fff', marginBottom:'6px' }}>{title}</div>
        <div style={{ fontSize:'13px', color:'#94a3b8', lineHeight:1.7 }}>{children}</div>
      </div>
    </div>
  );
}

function DocTable({ headers, rows }) {
  return (
    <div style={{ overflowX:'auto', margin:'16px 0' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
        <thead>
          <tr>{headers.map(h => <th key={h} style={{ background:'rgba(124,92,252,0.08)', color:'#a78bfa', padding:'10px 14px', textAlign:'left', fontSize:'10px', fontWeight:800, letterSpacing:'1.5px', textTransform:'uppercase', border:'1px solid rgba(255,255,255,0.06)' }}>{h}</th>)}</tr>
        </thead>
        <tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} style={{ padding:'10px 14px', border:'1px solid rgba(255,255,255,0.05)', color:'#94a3b8', verticalAlign:'top' }} dangerouslySetInnerHTML={{ __html: cell }}/>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function SH({ id, level = 2, children }) {
  const Tag = `h${level}`;
  const sizes = { 2:'22px', 3:'17px', 4:'15px' };
  const margins = { 2:'36px 0 14px', 3:'28px 0 10px', 4:'20px 0 8px' };
  return (
    <Tag id={id} style={{ fontSize:sizes[level], fontWeight:level===2?800:700, color:'#fff', margin:margins[level], letterSpacing:'-0.5px', scrollMarginTop:'30px' }}>
      {level === 2 && <span style={{ color:'var(--accent)', marginRight:'8px' }}>▸</span>}
      {children}
    </Tag>
  );
}

function ToolHeader({ emoji, title, subtitle, tags, color, num }) {
  return (
    <div style={{ background:`${color}0d`, border:`1px solid ${color}30`, borderRadius:'20px', overflow:'hidden', marginBottom:'20px' }}>
      <div style={{ padding:'22px 28px', borderBottom:`1px solid ${color}20` }}>
        <div style={{ fontSize:'10px', fontWeight:800, color:color, letterSpacing:'4px', marginBottom:'10px' }}>TOOL {num}</div>
        <div style={{ display:'flex', alignItems:'flex-start', gap:'16px' }}>
          <div style={{ fontSize:'32px', lineHeight:1 }}>{emoji}</div>
          <div>
            <h2 style={{ fontSize:'22px', fontWeight:800, color:'#fff', margin:'0 0 4px', letterSpacing:'-0.5px' }}>{title}</h2>
            <p style={{ color:'#64748b', fontSize:'13px', margin:'0 0 12px' }}>{subtitle}</p>
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
              {tags.map(t => (
                <span key={t} style={{ fontSize:'10px', fontWeight:700, padding:'2px 9px', borderRadius:'20px', background:`${color}15`, color:color, border:`1px solid ${color}30` }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Docs = () => {
  const { activeModel, apiKey, providerKeys, customModels } = useContext(AppContext);
  const [lang,        setLang]        = useState('en');
  const [otherLang,   setOtherLang]   = useState('');
  const [showLang,    setShowLang]    = useState(false);
  const [search,      setSearch]      = useState('');
  const [activeId,    setActiveId]    = useState('intro');
  const [translating, setTranslating] = useState(false);
  const [translated,  setTranslated]  = useState(null);
  const [transCache,  setTransCache]  = useState({});
  const [transError,  setTransError]  = useState('');
  const contentRef  = useRef(null);
  const englishRef  = useRef(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onScroll = () => {
      el.querySelectorAll('[data-section]').forEach(sec => {
        const rect = sec.getBoundingClientRect();
        if (rect.top < 150 && rect.bottom > 0) setActiveId(sec.id);
      });
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: 'smooth' }); setActiveId(id); }
  };

  // ── AI TRANSLATE ───────────────────────────────────────────────────────────
  const handleTranslate = useCallback(async (targetLangName) => {
    if (!targetLangName || targetLangName === 'English') {
      setTranslated(null); setTransError(''); return;
    }
    const cacheKey = targetLangName;
    if (transCache[cacheKey]) { setTranslated(transCache[cacheKey]); return; }

    const sourceEl = englishRef.current;
    if (!sourceEl) return;
    const plainText = (sourceEl.innerText || sourceEl.textContent || '').trim();
    if (plainText.length < 100) return;

    setTranslating(true); setTransError(''); setTranslated(null);

    try {
      const system = `You are a professional technical translator. Translate EVERYTHING into ${targetLangName}.
RULES:
- Translate every word naturally — sound native, not translated
- Keep EXACT structure: headings, lists, paragraphs same order
- Do NOT translate: PromptForge, API, URL, JSON-LD, CSV, PDF, localStorage, IndexedDB, OpenAI, Anthropic, Groq, Claude, GPT, Llama, code inside backticks, key formats like sk-...
- No explanations, no notes — ONLY translated text
- Technical terms that have no equivalent: keep English in parentheses after translation`;

      const third = Math.floor(plainText.length / 3);
      const chunks = [
        plainText.slice(0, third),
        plainText.slice(third, third * 2),
        plainText.slice(third * 2),
      ];

      const results = await Promise.all(
        chunks.map(chunk => callAI(system, chunk, null, activeModel, apiKey, providerKeys, customModels))
      );
      const full = results.join('\n\n');
      setTransCache(prev => ({ ...prev, [cacheKey]: full }));
      setTranslated(full);
    } catch (e) {
      setTransError('Translation failed: ' + e.message);
      setTranslated(null);
    } finally {
      setTranslating(false);
    }
  }, [activeModel, apiKey, providerKeys, customModels, transCache]);

  const handleLangSelect = async (code) => {
    if (code === 'other') { setShowLang(false); return; }
    setLang(code);
    setShowLang(false);
    if (code === 'en') { setTranslated(null); setTransError(''); return; }
    const langName = LANGS.find(l => l.code === code)?.label.replace(/^[^\s]+ /, '') || code;
    await handleTranslate(langName);
  };

  const handleOtherSubmit = async (e) => {
    e.preventDefault();
    if (!otherLang.trim()) return;
    setLang('other');
    setShowLang(false);
    await handleTranslate(otherLang.trim());
  };

  const NAV = [
    { label:'GETTING STARTED', items:[
      { id:'intro',   label:'What is PromptForge?' },
      { id:'setup',   label:'Quick Setup (2 min)' },
      { id:'models',  label:'API Keys & Models' },
    ]},
    { label:'STUDIO TOOLS', items:[
      { id:'optimizer',  label:'🎯 Prompt Optimizer' },
      { id:'aiwriter',   label:'✍️ AI Writer' },
      { id:'codehelper', label:'💻 Code Helper' },
      { id:'datawizard', label:'🧙 Data Wizard' },
      { id:'spider',     label:'🕷️ The Spider' },
      { id:'chatdata',   label:'💬 Chat With Data' },
      { id:'inventor',   label:'💡 The Inventor' },
    ]},
    { label:'CREATOR & SEO', items:[
      { id:'creator', label:'🎨 Creator Studio' },
      { id:'seo',     label:'🔍 SEO Optimizer' },
      { id:'compare', label:'⚖️ Model Compare' },
    ]},
    { label:'UTILITIES', items:[
      { id:'library', label:'📚 Prompt Library' },
      { id:'vault',   label:'💾 History Vault' },
      { id:'apikeys', label:'🔑 API Keys (Settings)' },
    ]},
    { label:'HELP', items:[
      { id:'tips',   label:'⚡ Pro Tips & Combos' },
      { id:'errors', label:'🛠️ Troubleshooting' },
    ]},
  ];

  const filtered = search
    ? NAV.flatMap(g => g.items).filter(i => i.label.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <div style={{ display:'flex', height:'100vh', background:'#030308', color:'#e2e8f0', fontFamily:"'DM Sans',sans-serif", overflow:'hidden' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width:'260px', flexShrink:0, background:'rgba(6,6,15,0.98)', borderRight:'1px solid rgba(255,255,255,0.06)', overflowY:'auto', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'22px 20px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'32px', height:'32px', background:'var(--accent)', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>⚡</div>
            <div>
              <div style={{ fontSize:'16px', fontWeight:900, color:'#fff', letterSpacing:'-0.5px' }}>PromptForge</div>
              <div style={{ fontSize:'10px', color:'var(--accent)', fontWeight:700, letterSpacing:'2px' }}>DOCS v3.0</div>
            </div>
          </div>
        </div>
        <div style={{ padding:'12px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', padding:'8px 12px' }}>
            <Search size={13} style={{ color:'#475569', flexShrink:0 }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search docs..."
              style={{ background:'none', border:'none', color:'#fff', fontSize:'12px', outline:'none', width:'100%' }}/>
          </div>
        </div>
        <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setShowLang(!showLang)}
            style={{ width:'100%', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'9px', padding:'8px 12px', color:'#94a3b8', fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:'inherit' }}>
            <span style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              <Globe size={12}/>
              {lang === 'other' ? `🌍 ${otherLang}` : (LANGS.find(l=>l.code===lang)?.label || '🇺🇸 English')}
            </span>
            <ChevronDown size={12} style={{ transform:showLang?'rotate(180deg)':'none', transition:'.2s' }}/>
          </button>
          <AnimatePresence>
            {showLang && (
              <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} style={{ overflow:'hidden' }}>
                <div style={{ paddingTop:'8px', display:'flex', flexDirection:'column', gap:3 }}>
                  {LANGS.map(l => (
                    l.code === 'other' ? (
                      <form key="other" onSubmit={handleOtherSubmit} style={{ marginTop:4 }}>
                        <input
                          value={otherLang}
                          onChange={e => setOtherLang(e.target.value)}
                          placeholder="Type any language..."
                          style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:7, padding:'7px 10px', color:'#fff', fontSize:12, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
                        />
                        <button type="submit" style={{ marginTop:4, width:'100%', background:'rgba(124,92,252,0.2)', border:'1px solid rgba(124,92,252,0.4)', borderRadius:7, padding:'6px', color:'#a78bfa', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                          Translate →
                        </button>
                      </form>
                    ) : (
                      <button key={l.code} onClick={() => handleLangSelect(l.code)}
                        style={{ background:lang===l.code?'rgba(124,92,252,0.2)':'transparent', border:`1px solid ${lang===l.code?'rgba(124,92,252,0.4)':'transparent'}`, borderRadius:'7px', padding:'6px 8px', color:lang===l.code?'#a78bfa':'#666', fontSize:'12px', cursor:'pointer', fontFamily:'inherit', transition:'.15s', fontWeight:lang===l.code?700:500, textAlign:'left' }}>
                        {l.label}
                      </button>
                    )
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <nav style={{ flex:1, padding:'8px 8px 20px' }}>
          {(filtered ? [{ label:'RESULTS', items:filtered }] : NAV).map(group => (
            <div key={group.label}>
              <div style={{ fontSize:'10px', fontWeight:800, color:'#334155', letterSpacing:'3px', padding:'14px 10px 6px' }}>{group.label}</div>
              {group.items.map(item => (
                <button key={item.id} onClick={() => scrollTo(item.id)}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:'8px', padding:'8px 12px', borderRadius:'9px', border:'none', background:activeId===item.id?'rgba(124,92,252,0.15)':'transparent', color:activeId===item.id?'#a78bfa':'#64748b', fontSize:'13px', fontWeight:activeId===item.id?700:500, cursor:'pointer', textAlign:'left', fontFamily:'inherit', transition:'.15s', borderLeft:activeId===item.id?'3px solid var(--accent)':'3px solid transparent' }}>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* ── CONTENT ── */}
      <main ref={contentRef} style={{ flex:1, overflowY:'auto', padding:'0 0 80px' }}>
        <div style={{ maxWidth:'820px', margin:'0 auto', padding:'60px 48px 0' }}>

          {/* Translating indicator */}
          {translating && (
            <div style={{ position:'sticky', top:0, zIndex:10, background:'rgba(124,92,252,0.12)', border:'1px solid rgba(124,92,252,0.3)', borderRadius:12, padding:'12px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:10, backdropFilter:'blur(8px)' }}>
              <Loader2 size={16} color="#a78bfa" style={{ animation:'spin 1s linear infinite' }} />
              <span style={{ fontSize:13, color:'#a78bfa', fontWeight:600 }}>
                AI is translating the full documentation... This may take 30-60 seconds. Cached after first time.
              </span>
            </div>
          )}

          {/* Error */}
          {transError && (
            <div style={{ background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.3)', borderRadius:12, padding:'10px 16px', marginBottom:16, fontSize:12, color:'#f87171', display:'flex', alignItems:'center', gap:8 }}>
              ⚠️ {transError}
              <button onClick={() => setTransError('')} style={{ marginLeft:'auto', background:'none', border:'none', color:'#f87171', cursor:'pointer', fontSize:18, lineHeight:1 }}>×</button>
            </div>
          )}

          {/* Translated output — shown when AI has translated */}
          {translated && !translating && (
            <div style={{ marginBottom:32 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <span style={{ fontSize:11, fontWeight:800, color:'#34d399', letterSpacing:2 }}>✓ AI TRANSLATED</span>
                <button onClick={() => { setTranslated(null); setLang('en'); }} style={{ fontSize:11, color:'#64748b', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'3px 10px', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                  <RefreshCw size={11}/> Back to English
                </button>
              </div>
              <div style={{ background:'rgba(52,211,153,0.03)', border:'1px solid rgba(52,211,153,0.15)', borderRadius:16, padding:'28px 32px', whiteSpace:'pre-wrap', fontSize:14, lineHeight:1.9, color:'#94a3b8', fontFamily:"'DM Sans',sans-serif" }}>
                {translated}
              </div>
            </div>
          )}

          {/* English original — always rendered (hidden via CSS when translated shown) */}
          <div ref={englishRef} style={{ display: translated && !translating ? 'none' : 'block' }}>

          {/* HERO */}
          <div style={{ marginBottom:'60px' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(124,92,252,0.1)', border:'1px solid rgba(124,92,252,0.3)', padding:'5px 14px', borderRadius:'20px', fontSize:'11px', fontWeight:700, color:'#a78bfa', letterSpacing:'1px', marginBottom:'20px' }}>
              📖 COMPLETE DOCUMENTATION — ALL 11 TOOLS
            </div>
            <h1 style={{ fontSize:'44px', fontWeight:900, color:'#fff', letterSpacing:'-2.5px', lineHeight:1.05, marginBottom:'16px' }}>
              <span style={{ color:'var(--accent)' }}>PromptForge</span> Documentation
            </h1>
            <p style={{ fontSize:'17px', color:'#64748b', lineHeight:1.75, maxWidth:'580px', marginBottom:'32px' }}>Everything you need — from first API key to every tool. So simple a 5-year-old can follow.</p>
            <div style={{ display:'flex', gap:'28px', flexWrap:'wrap' }}>
              {[['11','Tools'],['8','Platforms'],['60+','Examples'],['Free','To Use']].map(([n,l]) => (
                <div key={l}>
                  <div style={{ fontSize:'28px', fontWeight:900, color:'#fff', letterSpacing:'-1px' }}>{n}</div>
                  <div style={{ fontSize:'11px', color:'#475569', fontWeight:600, marginTop:'2px' }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ height:'1px', background:'linear-gradient(90deg,transparent,var(--accent),transparent)', margin:'40px 0 0' }}/>
          </div>

          {/* ── INTRO ── */}
          <section id="intro" data-section style={{ marginBottom:'70px' }}>
            <div style={{ fontSize:'10px', fontWeight:800, color:'var(--accent)', letterSpacing:'4px', marginBottom:'10px' }}>INTRODUCTION</div>
            <SH id="intro-h" level={2}>What is PromptForge?</SH>
            <p style={{ color:'#94a3b8', fontSize:'15px', lineHeight:1.8, marginBottom:'20px' }}>
              PromptForge ek free AI workspace hai jisme <strong style={{color:'#fff'}}>11 specialized tools</strong> hain. Har tool ek alag kaam ke liye bana hai. Tum apni khud ki API key laate ho (OpenAI, Anthropic, Groq, etc.) — PromptForge seedha us provider se connect karta hai. <strong style={{color:'#fff'}}>Koi subscription nahi. Koi data server pe nahi jaata.</strong>
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'24px' }}>
              {[
                ['🔑','Apni Key Lao (BYOK)','OpenAI, Anthropic, Groq, Gemini, OpenRouter — koi bhi provider. Tum directly unhe pay karte ho.'],
                ['🛠️','11 Expert Tools','Har tool ka apna expert AI prompt hai — generic chat nahi'],
                ['💾','History Vault','Sab output automatically save hota hai locally. Kabhi nahi jaata.'],
                ['🆓','Free to Start','OpenRouter pe free account banao → Llama 3.3 use karo → zero cost'],
              ].map(([icon,title,desc]) => (
                <div key={title} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'18px' }}>
                  <div style={{ fontSize:'20px', marginBottom:'8px' }}>{icon}</div>
                  <div style={{ fontSize:'14px', fontWeight:700, color:'#fff', marginBottom:'5px' }}>{title}</div>
                  <div style={{ fontSize:'12px', color:'#64748b', lineHeight:1.6 }}>{desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── SETUP ── */}
          <section id="setup" data-section style={{ marginBottom:'70px' }}>
            <div style={{ fontSize:'10px', fontWeight:800, color:'var(--accent)', letterSpacing:'4px', marginBottom:'10px' }}>GETTING STARTED</div>
            <SH id="setup-h" level={2}>Quick Setup — Sirf 2 Minute</SH>
            <Step num={1} title="API Keys pe click karo">Left sidebar mein <strong style={{color:'#fff'}}>"API Keys"</strong> par click karo. Yahan pe tum apni key add karoge.</Step>
            <Step num={2} title="Free option — OpenRouter">
              Pehli baar use kar rahe ho? <strong style={{color:'#34d399'}}>Bilkul free shuru karo:</strong><br/>
              1. openrouter.ai pe jaao → free account banao<br/>
              2. Wahan se API key copy karo<br/>
              3. PromptForge mein OpenRouter field mein paste karo → Save
            </Step>
            <Step num={3} title="Model select karo">Kisi bhi page ke upar <strong style={{color:'#fff'}}>"Change Model / API Key"</strong> button par click karo → Model chuno. Free ke liye: <code style={{color:'#a78bfa'}}>meta-llama/llama-3.3-70b-instruct:free</code> select karo.</Step>
            <Step num={4} title="Koi bhi tool open karo aur shuru karo!">Sidebar mein koi bhi tool click karo. Fields bharo. Generate button dabao. Ho gaya! 🎉</Step>
            <TipBox type="tip">
              <strong>Sabse best free combo:</strong> OpenRouter key + Llama 3.3 70B (free) = sabhi 11 tools bilkul free mein use kar sakte ho. OpenAI ya Anthropic key ho to woh aur bhi zyada powerful hoga.
            </TipBox>
          </section>

          {/* ── MODELS ── */}
          <section id="models" data-section style={{ marginBottom:'70px' }}>
            <SH id="models-h" level={2}>API Keys & Models — Kya Daalen?</SH>
            <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'16px' }}>PromptForge 6 providers support karta hai. Ek se zyada bhi add kar sakte ho aur switch kar sakte ho:</p>
            <DocTable
              headers={['Provider','Key Format','Free Tier?','Kab Use Karen?']}
              rows={[
                ['<strong>OpenAI</strong>','sk-...','Nahi (pay per use)','GPT-4o: best all-around quality'],
                ['<strong>Anthropic</strong>','sk-ant-...','Nahi (pay per use)','Claude: reasoning aur writing ke liye best'],
                ['<strong>Groq</strong>','gsk_...','Haan (rate limited)','Llama 3.3: sabse fast free option'],
                ['<strong>Google Gemini</strong>','AIza...','Haan (limited)','Gemini Flash: long documents ke liye'],
                ['<strong>OpenRouter</strong>','sk-or-...','Haan (bahut models free)','100+ models ek key se — beginners ke liye best'],
                ['<strong>Mistral</strong>','...','Nahi','European models, fast aur cheap'],
              ]}
            />
            <TipBox type="info">Tumhari keys <strong style={{color:'#fff'}}>browser ke localStorage mein store hoti hain — AES-GCM encryption ke saath</strong>. Kisi server pe nahi jaatein. Sirf tumhare device pe.</TipBox>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* PROMPT OPTIMIZER */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="optimizer" data-section style={{ marginBottom:'70px' }}>
            <ToolHeader num="01" emoji="🎯" title="Prompt Optimizer" color="#7c5cfc"
              subtitle="Weak ya vague prompts ko expert-level prompts mein badlo. 10x better AI responses milte hain."
              tags={['CREATE Framework','Strength Score 0-100%','Live Test','Auto-Refine','6 Templates','Weakness Analysis']}
            />
            <div style={{ padding:'0' }}>
              <SH id="opt-what" level={3}>Yeh Tool Kya Karta Hai?</SH>
              <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'16px' }}>
                Tum ek simple prompt likhte ho (jaise "write a blog"). Optimizer uski <strong style={{color:'#fff'}}>kamzoriyan dhundta hai</strong> aur use <strong style={{color:'#fff'}}>CREATE framework</strong> se rewrite karta hai: Character (AI koun bane), Request (kya chahiye), Examples, Adjustments, Type (format), Extras. Result: ek 0-100% Strength Score + exactly kya change hua.
              </p>

              <SH id="opt-features" level={3}>Sab Features — Ek Ek Karke</SH>
              <DocTable
                headers={['Feature','Kya Karta Hai','Kaise Use Karein']}
                rows={[
                  ['<strong>6 Quick Templates</strong>','Blog Post, Cold Email, Fix Code, Instagram, Summarize, Ad Copy — ready prompts','Click karo → input box mein load ho jaata hai'],
                  ['<strong>Intensity Slider (0-100)</strong>','Low = gentle fix, High = complete expert rewrite','Simple task: 50-60. Complex task: 80-100'],
                  ['<strong>Strength Score (0-100%)</strong>','Forged prompt ka score — Weak/Moderate/Strong/Elite label','80% se upar aana chahiye. Kam ho to Refine karo'],
                  ['<strong>Weaknesses Panel</strong>','Exactly kya galat tha original mein — AI ne kya fix kiya','Generate ke baad padho — seekhne ke liye bahut useful'],
                  ['<strong>Enhancements Panel</strong>','Kya add kiya — persona, format, examples, constraints','Original se compare karo'],
                  ['<strong>▶ Test It Button</strong>','Forged prompt ko live run karta hai active model pe','Forge ke baad click karo — actual output dekho'],
                  ['<strong>Refine Again</strong>','AI apne output ko dekhke aur improve karta hai','Test ke baad satisfied nahi? Yeh dabao. Max 3 baar'],
                ]}
              />

              <SH id="opt-steps" level={3}>Step-by-Step Use Karna</SH>
              <Step num={1} title="Template chuno ya khud likhو">6 template buttons mein se koi click karo, ya apna prompt box mein type karo.</Step>
              <Step num={2} title="Intensity set karo">Zyaadatar kaam ke liye: 70-80. Maximum power ke liye: 90-100.</Step>
              <Step num={3} title="Forge Prompt click karo">AI analyze karta hai, rewrite karta hai, score dikhata hai + kya badla woh batata hai.</Step>
              <Step num={4} title="▶ Test It click karo">Forged prompt active model pe run hota hai. Output padho.</Step>
              <Step num={5} title="Zaroorat ho to Refine karo">Close hai lekin perfect nahi? "Refine Again" click karo. 3 baar tak kar sakte ho.</Step>

              <TipBox type="try">
                <strong>Paste karo yeh weak prompt:</strong><br/>
                <code style={{color:'#34d399'}}>write a blog post about AI</code><br/><br/>
                <strong>Intensity: 85 → Forge Prompt click karo</strong><br/>
                Result mein dekhoge: Score 80-95%, weaknesses mein "No target audience", "No length spec", "No persona"<br/>
                Forged prompt specify karega: journalist persona, 800-word target, CTO audience, H2 structure required<br/><br/>
                <strong>Phir ▶ Test It click karo</strong> — dono outputs ka quality difference clearly dikhega.
              </TipBox>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* AI WRITER */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="aiwriter" data-section style={{ marginBottom:'70px' }}>
            <ToolHeader num="02" emoji="✍️" title="AI Writer" color="#f472b6"
              subtitle="20 content types, 16 languages, humanizer, A/B variants, aur tone analyzer — sab ek jagah."
              tags={['20 Content Types','16 Languages','Humanizer','A/B Variants','Tone Analyzer','AI Probability Score']}
            />
            <div style={{ padding:'0' }}>
              <SH id="writer-modes" level={3}>4 Alag Modes — Ek Tool, 4 Kaam</SH>
              <DocTable
                headers={['Mode/Tab','Kya Karta Hai','Kab Use Karein']}
                rows={[
                  ['<strong>Generate</strong>','Scratch se content banata hai — type, tone, topic, language, audience ke hisaab se','Blog, email, ad copy, LinkedIn post — fresh content chahiye'],
                  ['<strong>Humanizer</strong>','AI text se AI patterns hataata hai (no "delve", "moreover", em-dashes). Detection pass karta hai','Publish karne se PEHLE hamesha chalao'],
                  ['<strong>A/B Variants</strong>','3 different versions banata hai — alag angle, tone, approach ke saath','Email subjects, ad headlines, landing page hooks'],
                  ['<strong>Tone Analyzer</strong>','Kisi bhi text ko 6 dimensions pe score karta hai + AI Probability % + best platform suggestion','Brand voice check karo, ya competitor content analyze karo'],
                ]}
              />

              <SH id="writer-types" level={3}>20 Content Types</SH>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'20px' }}>
                {['Blog post / Article','Cold email','LinkedIn post','Twitter/X thread','Product description','Cover letter','Professional bio','Ad copy','Sales page','YouTube script','Newsletter','SEO meta tags','Tagline / Slogan','Customer support reply','Code documentation','WhatsApp message','Instagram caption','TikTok script','Press release','Job description'].map(tp => (
                  <code key={tp} style={{ background:'rgba(244,114,182,0.08)', color:'#f472b6', padding:'3px 9px', borderRadius:'6px', fontSize:'11px', border:'1px solid rgba(244,114,182,0.15)' }}>{tp}</code>
                ))}
              </div>

              <SH id="writer-tones" level={3}>10 Tones</SH>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'20px' }}>
                {['Professional','Friendly','Persuasive','Humorous','Authoritative','Empathetic','Inspirational','Casual','Educational','Urgent'].map(tn => (
                  <code key={tn} style={{ background:'rgba(124,92,252,0.08)', color:'#a78bfa', padding:'3px 9px', borderRadius:'6px', fontSize:'11px', border:'1px solid rgba(124,92,252,0.15)' }}>{tn}</code>
                ))}
              </div>

              <SH id="writer-steps" level={3}>Kaise Use Karein — Step by Step</SH>
              <Step num={1} title="Content Type chuno">Dropdown mein se apna content type select karo (e.g. Cold Email).</Step>
              <Step num={2} title="Topic likhو">Topic/Niche/Product field mein apna subject likho.</Step>
              <Step num={3} title="Tone aur Language set karo">Tone dropdown: Professional, Friendly, etc. Language: 16 options mein se.</Step>
              <Step num={4} title="Generate click karo">Output aayega Generate tab mein.</Step>
              <Step num={5} title="Humanizer tab pe jaao">Output copy karo → Humanizer tab pe paste karo → Humanize karo. Publish karne se pehle yeh zaroor karo.</Step>
              <Step num={6} title="A/B Variants try karo">Agar 3 different angles chahiye (jaise 3 different email subjects) → A/B Variants tab pe jaao → Generate.</Step>

              <TipBox type="try">
                <strong>Content Type:</strong> Cold email<br/>
                <strong>Topic:</strong> My web design agency builds fast websites for restaurants<br/>
                <strong>Tone:</strong> Friendly Professional | <strong>Language:</strong> English<br/><br/>
                1. Generate click karo → email padho<br/>
                2. Humanizer tab → AI phrases automatically hatt jaate hain<br/>
                3. A/B Variants → 3 alag openings milenge<br/>
                4. Best version Tone Analyzer mein paste karo → AI Probability % dekho (40% se kam ho toh safe hai publish karne ke liye)
              </TipBox>

              <TipBox type="warn">
                Humanizer hamesha chalao publish karne se pehle. Bina Humanizer ke AI-generated content detection tools flag kar sakte hain.
              </TipBox>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* CODE HELPER */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="codehelper" data-section style={{ marginBottom:'70px' }}>
            <ToolHeader num="03" emoji="💻" title="Code Helper" color="#34d399"
              subtitle="18 languages mein code fix, explain, optimize, test karo. Git commits aur security audit bhi isi mein hain."
              tags={['18 Languages','8 Tasks','Git Commits (3 styles)','Security Audit 0-100','Line-by-Line Vulnerabilities','Unit Tests']}
            />
            <div style={{ padding:'0' }}>
              <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'20px' }}>
                Code Helper mein <strong style={{color:'#fff'}}>3 tabs hain</strong> — Code Helper, Git Commit Generator, Security Auditor. Teeno alag tools hain ek jagah.
              </p>

              <SH id="code-tab1" level={3}>Tab 1 — Code Helper (8 Tasks)</SH>
              <DocTable
                headers={['Task','AI Kya Deta Hai']}
                rows={[
                  ['<strong>Fix / Debug</strong>','Sab bugs exact line reference ke saath + explanation + complete fixed code'],
                  ['<strong>Explain this code</strong>','Overview, key functions, logic flow, edge cases — 4 clear sections mein'],
                  ['<strong>Write from scratch</strong>','Production-ready code with error handling, comments, aur type hints'],
                  ['<strong>Convert to another language</strong>','Exact logic preserve, target language ke conventions follow karta hai'],
                  ['<strong>Optimize performance</strong>','Big-O analysis before/after + optimized version + specific improvements'],
                  ['<strong>Write unit tests</strong>','Happy path + edge cases + error cases — comprehensive coverage'],
                  ['<strong>Review code quality</strong>','1-10 score: Readability, Maintainability, Performance, Security, Best Practices'],
                  ['<strong>Refactor / Clean up</strong>','DRY, SOLID principles + better naming + har change explain karta hai'],
                ]}
              />

              <SH id="code-tab2" level={3}>Tab 2 — Git Commit Generator</SH>
              <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'12px' }}>Apna code paste karo ya describe karo kya change kiya. AI 3 styles mein Conventional Commits banata hai:</p>
              <CodeBlock lang="git-commit" code={`# Concise (short):
feat: add email validation

# Standard (⭐ Recommended):
feat(auth): add email validation with regex pattern

# Detailed (full description):
feat(auth): add email validation function with regex

- Validates format using RFC 5322 compliant pattern
- Returns boolean with specific error message
- Handles edge cases: TLDs, subdomains, quoted strings

BREAKING CHANGE: validateEmail() now returns object, not boolean`}/>

              <SH id="code-tab3" level={3}>Tab 3 — Security Auditor</SH>
              <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'12px' }}>Koi bhi code paste karo. AI scan karta hai aur return karta hai:</p>
              <ul style={{ color:'#94a3b8', fontSize:'13px', lineHeight:2.1, paddingLeft:'20px', marginBottom:'16px' }}>
                <li>Overall Security Score (0-100) with severity badge (Safe/Low Risk/Moderate/High Risk/Critical)</li>
                <li>Har vulnerability ke saath: exact line number + severity (Critical/High/Medium/Low) + fix</li>
                <li>Kya scan karta hai: SQL injection, XSS, hardcoded secrets, missing auth checks, insecure dependencies</li>
                <li>"Quick Wins" section — 5 minute mein fix ho jaane wali cheezein</li>
                <li>Secure version of the code — drop-in replacement</li>
              </ul>

              <SH id="code-langs" level={3}>18 Supported Languages</SH>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'20px' }}>
                {['JavaScript','TypeScript','Python','Java','C++','C#','Go','Rust','PHP','Ruby','Swift','Kotlin','R','SQL','HTML/CSS','Bash/Shell','Solidity','YAML/Config'].map(l => (
                  <code key={l} style={{ background:'rgba(52,211,153,0.08)', color:'#34d399', padding:'3px 9px', borderRadius:'6px', fontSize:'11px', border:'1px solid rgba(52,211,153,0.15)' }}>{l}</code>
                ))}
              </div>

              <TipBox type="try">
                <strong>Yeh code paste karo → Task: Fix / Debug → Language: JavaScript:</strong>
                <CodeBlock lang="javascript" code={`function calculateTotal(items) {
  let total = 0
  for (let i = 0; i <= items.length; i++) {
    total += items[i].price
  }
  return total
}`}/>
                AI dhundega: off-by-one error (i &lt;= vs i &lt;), items[i] pe null check missing, koi input validation nahi — aur complete fixed version dega explanation ke saath.
              </TipBox>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* DATA WIZARD */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="datawizard" data-section style={{ marginBottom:'70px' }}>
            <ToolHeader num="04" emoji="🧙" title="Data Wizard" color="#38bdf8"
              subtitle="SQL, Python, Excel, RegEx, R, DAX, MongoDB — production-grade code with audit trails."
              tags={['10 Artifact Types','4 Optimization Modes','Multi-Variant Output','Security Audit','Efficiency Score','Advanced Config']}
            />
            <div style={{ padding:'0' }}>
              <SH id="dw-types" level={3}>10 Artifact Types — Har Ek Ka Alag AI</SH>
              <DocTable
                headers={['Type','AI Expert Focus','Best Use Case']}
                rows={[
                  ['<strong>SQL Query</strong>','JOINs, CTEs, index hints, BigQuery/Postgres/Snowflake dialects','Database queries, reports, analytics'],
                  ['<strong>Excel / Sheets Formula</strong>','XLOOKUP, LET(), array formulas, spill behavior, named ranges','Spreadsheet automation, dashboards'],
                  ['<strong>Python (Pandas/NumPy)</strong>','Vectorization, dtype optimization, chunking, ETL pipelines','Data cleaning, ML prep, automation'],
                  ['<strong>Regular Expression</strong>','Pattern analysis, ReDoS safety, named groups, all engines','Validation, extraction, search/replace'],
                  ['<strong>Data Visualization</strong>','Chart type rationale, Plotly/Matplotlib/Seaborn, accessibility','Charts, dashboards, reports'],
                  ['<strong>DAX / Power BI</strong>','Filter context vs row context, VAR/RETURN pattern, VertiPaq','Power BI measures, KPIs, time intelligence'],
                  ['<strong>R Script</strong>','Statistical assumptions, tidyverse pipes, ggplot2 themes','Statistical analysis, academic charts'],
                  ['<strong>Shell / AWK / Sed</strong>','POSIX compatibility, streaming for large files, pipeline chaining','Log processing, ETL, automation'],
                  ['<strong>JSON / GraphQL</strong>','N+1 prevention, fragments, DataLoader, persisted queries','API queries, schema transformations'],
                  ['<strong>MongoDB / NoSQL</strong>','ESR indexing rule, aggregation pipeline, Atlas Search','MongoDB queries, aggregations'],
                ]}
              />

              <SH id="dw-modes" level={3}>4 Optimization Modes</SH>
              <DocTable
                headers={['Mode','AI Kya Alag Karta Hai']}
                rows={[
                  ['⚡ <strong>Speed</strong>','Vectorize everything, indexes first, minimal overhead — pure performance'],
                  ['⚖️ <strong>Balanced</strong>','Performance + clean code mix, key comments on non-obvious parts'],
                  ['📖 <strong>Readable</strong>','Line breaks, descriptive names, comments on every block — learning ke liye'],
                  ['🏢 <strong>Enterprise</strong>','Type hints, error handling, logging, docstrings, production patterns'],
                ]}
              />

              <SH id="dw-advanced" level={3}>Advanced Configuration — Power Feature</SH>
              <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'12px' }}>"Advanced Configuration" click karo — 2 important fields khulenge:</p>
              <ul style={{ color:'#94a3b8', fontSize:'13px', lineHeight:2.1, paddingLeft:'20px', marginBottom:'16px' }}>
                <li><strong style={{color:'#fff'}}>Schema / Structure</strong> — Apni table schema, column names paste karo. AI tumhare real columns ke hisaab se code banata hai — guess nahi karta.</li>
                <li><strong style={{color:'#fff'}}>Sample Data</strong> — 2-3 sample rows paste karo. AI exact data types, formats, edge cases samajh jaata hai.</li>
                <li><strong style={{color:'#fff'}}>Line-by-line explanation</strong> — Check karo aur har line ke neeche plain-English explanation aata hai.</li>
              </ul>

              <SH id="dw-audit" level={3}>Audit Panel — Har Generation Ke Baad Aata Hai</SH>
              <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'12px' }}>4 real metrics ke saath audit card automatically appear hota hai:</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'16px' }}>
                {[['Complexity','O(n log n)','#34d399'],['Security','Sanitized','#a78bfa'],['Scalability','10M+ rows','#38bdf8'],['Efficiency','96%','#fbbf24']].map(([l,v,c]) => (
                  <div key={l} style={{ background:`${c}0d`, border:`1px solid ${c}30`, borderRadius:'12px', padding:'14px', textAlign:'center' }}>
                    <div style={{ fontSize:'9px', fontWeight:900, color:'#475569', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:'5px' }}>{l}</div>
                    <div style={{ fontSize:'13px', fontWeight:700, color:c }}>{v}</div>
                  </div>
                ))}
              </div>

              <TipBox type="try">
                <strong>Type:</strong> SQL Query | <strong>Mode:</strong> Enterprise | <strong>Advanced Config kholo:</strong><br/>
                <strong>Schema:</strong><br/>
                <code style={{color:'#38bdf8'}}>orders(id INT, customer_id INT, amount DECIMAL, created_at TIMESTAMP, status VARCHAR)</code><br/><br/>
                <strong>Requirement:</strong> Monthly revenue for last 6 months with month-over-month growth %<br/><br/>
                Milega: Primary SQL with CTEs + Variant 2 with window functions + full audit panel with warnings.
              </TipBox>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* THE SPIDER */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="spider" data-section style={{ marginBottom:'70px' }}>
            <ToolHeader num="05" emoji="🕷️" title="The Spider" color="#fbbf24"
              subtitle="Real web data Jina AI se scrape karo — kisi bhi URL ya topic pe. 6 output formats, history, follow-up Q&A."
              tags={['Jina AI Scraping','6 Output Modes','Quick/Deep','Cancel Support','History (25 items)','Follow-up Q&A','Raw Feed','Verified Sources']}
            />
            <div style={{ padding:'0' }}>
              <TipBox type="info">Spider <strong style={{color:'#fff'}}>Jina AI</strong> se real, live web content extract karta hai. Yeh AI hallucination nahi hai — actual web data hai jo tumhara AI model phir synthesize karta hai.</TipBox>

              <SH id="spider-input" level={3}>2 Input Types</SH>
              <DocTable
                headers={['Type','Example','Kab Use Karein']}
                rows={[
                  ['<strong>URL Mode</strong>','https://openai.com (URL field mein paste karo)','Specific website ya article scrape karna ho'],
                  ['<strong>Search Mode</strong>','"React vs Vue 2025" ya "best AI tools for students" (text field mein likhو)','Kisi topic pe research karna ho'],
                ]}
              />

              <SH id="spider-modes" level={3}>6 Output Modes — Har Ek Ka Alag Format</SH>
              <DocTable
                headers={['Mode','Output','Best For']}
                rows={[
                  ['🛡️ <strong>Intelligence Dossier</strong>','Deep report: headers, tables, stats, sources, executive summary (800+ words)','Company research, topic deep-dives'],
                  ['📄 <strong>Quick Summary</strong>','5 sections: TL;DR + Key Facts + Critical Numbers + Who\'s Involved + Bottom Line','Kuch bhi ka fast overview'],
                  ['📊 <strong>Compare & Contrast</strong>','Structured comparison table + recommendation section','Product/tech comparisons'],
                  ['💻 <strong>Technical Extract</strong>','Code samples, API endpoints, docs, version numbers, config examples','API docs, library documentation'],
                  ['🕐 <strong>Timeline Analysis</strong>','Chronological events with dates on left, key milestones highlighted','Company history, event sequences'],
                  ['🕸️ <strong>Entity Map</strong>','Tables: People (naam+role), Organizations, Technologies','Organizations aur people investigate karna'],
                ]}
              />

              <SH id="spider-depth" level={3}>Quick vs Deep</SH>
              <DocTable
                headers={['Setting','Passes','Speed','Best For']}
                rows={[
                  ['⚡ <strong>Quick</strong>','1 pass (primary source)','Fast','Simple lookups, single URLs'],
                  ['🔬 <strong>Deep</strong>','2 passes (primary + secondary)','Slower but richer','Research, complex topics, comprehensive reports'],
                ]}
              />

              <SH id="spider-tabs" level={3}>Result Ke 3 Tabs</SH>
              <ul style={{ color:'#94a3b8', fontSize:'14px', lineHeight:2.1, paddingLeft:'20px', marginBottom:'16px' }}>
                <li><strong style={{color:'#fff'}}>Report tab</strong> — AI-synthesized intelligence tumhare chosen mode mein</li>
                <li><strong style={{color:'#fff'}}>Follow-up tab</strong> — 3 AI-suggested questions + apna khud likho. AI usi scraped data se instant answer deta hai (no new web request)</li>
                <li><strong style={{color:'#fff'}}>Raw Feed tab</strong> — AI process karne se pehle ka actual raw text. Copy + Download buttons bhi hain.</li>
              </ul>

              <SH id="spider-history" level={3}>History — Last 25 Searches Save Hoti Hain</SH>
              <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'16px' }}>Top-right mein "Recent" dropdown mein last 25 searches dikhti hain. Click karo → full result restore ho jaata hai (query, mode, depth, result, raw content, follow-ups sab ke saath). Individual delete ya "Clear All" bhi kar sakte ho.</p>

              <SH id="spider-cancel" level={3}>Cancel — Scraping Rok Sakte Ho</SH>
              <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'16px' }}>Deploy Spider click karne ke baad red <strong style={{color:'#fff'}}>"Cancel"</strong> button appear hota hai. Kisi bhi waqt click karo — scraping aur AI analysis turant ruk jaata hai.</p>

              <TipBox type="try">
                <strong>Test 1 (URL mode):</strong> https://openai.com paste karo → Mode: Intelligence Dossier → Deep → Deploy Spider<br/><br/>
                <strong>Test 2 (Search mode):</strong> "React vs Vue 2025" likhو → Mode: Compare & Contrast → Deploy Spider<br/><br/>
                <strong>Test 3 (Follow-up):</strong> Result aane ke baad → Follow-up tab → suggested question click karo → instant answer<br/><br/>
                <strong>Test 4 (Chain):</strong> Spider result mila → "Send to Chat" click karo → Chat With Data mein deep questions puchho
              </TipBox>

              <TipBox type="warn">Agar "No data retrieved" error aaye: specific URL https:// ke saath try karo, ya aur specific search term use karo. Kuch sites scraping block karti hain.</TipBox>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* CHAT WITH DATA */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="chatdata" data-section style={{ marginBottom:'70px' }}>
            <ToolHeader num="06" emoji="💬" title="Chat With Data" color="#fb923c"
              subtitle="CSV, PDF, JSON, images upload karo — full conversation karo. Charts, stat cards, knowledge graphs auto-appear karte hain."
              tags={['CSV·PDF·JSON·Images','OCR (Tesseract)','Live Charts (Recharts)','Stat Cards','Knowledge Mesh','Session Save/Load','8 Quick Actions']}
            />
            <div style={{ padding:'0' }}>
              <SH id="chat-files" level={3}>Supported File Types</SH>
              <DocTable
                headers={['File Type','Kaise Process Hota Hai','Limit']}
                rows={[
                  ['CSV, TXT, JSON, XML, MD, JS, SQL','Text as-is read hota hai — full content available','800,000 characters'],
                  ['PDF','PDF.js se text extract hota hai — sab pages se','Up to 50 pages'],
                  ['Images (PNG, JPG, JPEG)','Tesseract.js se OCR — text automatically extract','Any size'],
                  ['Multiple files together','Sab files ek saath load — AI cross-reference karta hai','No limit on file count'],
                ]}
              />

              <SH id="chat-quickactions" level={3}>8 Quick Action Chips — File Load Hone Pe Appear Hote Hain</SH>
              <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'12px' }}>File upload karo → chat input ke upar 8 buttons appear hote hain. Click karo — type karne ki zaroorat nahi:</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'20px' }}>
                {[
                  ['Summarize','Poore data ka full summary'],
                  ['Key Stats','Sab numerical insights extract karta hai'],
                  ['Find Anomalies','Outliers aur unusual patterns dhundta hai'],
                  ['Trends','Patterns over time ya categories'],
                  ['Compare','Segments ya categories compare karta hai'],
                  ['SQL Queries','Tumhare data ke liye SQL likhta hai'],
                  ['Visualize','Best chart type + generate karta hai'],
                  ['Export Plan','Data export aur reporting plan banata hai'],
                ].map(([name, desc]) => (
                  <div key={name} style={{ background:'rgba(251,146,60,0.05)', border:'1px solid rgba(251,146,60,0.2)', borderRadius:'10px', padding:'12px 14px' }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'#fb923c', marginBottom:'4px' }}>{name}</div>
                    <div style={{ fontSize:'11px', color:'#64748b' }}>{desc}</div>
                  </div>
                ))}
              </div>

              <SH id="chat-viz" level={3}>Right Side Visualization Panel — Auto-Appear Karta Hai</SH>
              <DocTable
                headers={['Tab','Kya Dikhta Hai','Kab Aata Hai']}
                rows={[
                  ['📊 Charts','Area, Bar, Line, ya Pie chart — AI best type choose karta hai','Koi bhi numerical data response mein ho'],
                  ['Σ Stats','Key metric cards with values + change % indicators','Quantitative analysis responses'],
                  ['🕸️ Mesh','Knowledge graph — entities aur unke relationships','Complex multi-document analysis'],
                ]}
              />

              <SH id="chat-session" level={3}>Session Save/Load — Kaam Kabhi Nahi Jaata</SH>
              <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'16px' }}>Chat history aur uploaded files ek session mein hote hain. <strong style={{color:'#fff'}}>"Save Session"</strong> click karo — localStorage mein save ho jaata hai. Baad mein "Load Session" se wapas lao — charts aur stats bhi restore hote hain.</p>

              <TipBox type="try">
                <strong>Test 1 (CSV):</strong> Koi bhi CSV upload karo → "Key Stats" chip click karo → stat cards auto-appear honge<br/><br/>
                <strong>Test 2 (PDF):</strong> Koi bhi PDF upload karo → "Summarize" → phir specific questions puchho<br/><br/>
                <strong>Test 3 (Spider se):</strong> Spider mein koi result lao → "Send to Chat" click karo → Chat mein "Kya main yeh topic explore kar sakta hoon?" type karo<br/><br/>
                <strong>Test 4 (Multiple files):</strong> 3 alag CSVs upload karo → "Compare" chip → AI teeno files cross-reference karega
              </TipBox>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* THE INVENTOR */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="inventor" data-section style={{ marginBottom:'70px' }}>
            <ToolHeader num="07" emoji="💡" title="The Inventor" color="#a78bfa"
              subtitle="4 AI agents tumhari idea pe debate karte hain real-time mein — phir ek Master Blueprint banata hai."
              tags={['4 AI Agents Sequential','Master Blueprint','30-60-90 Day Plan','Cancel Support','History (8 saved)','Download .md','Save to Vault']}
            />
            <div style={{ padding:'0' }}>
              <SH id="inv-agents" level={3}>4 Agents + 1 Synthesizer — Kya Karte Hain?</SH>
              <DocTable
                headers={['Agent','Role','Kya Deliver Karta Hai']}
                rows={[
                  ['💡 <strong>The Visionary</strong>','CEO / Strategy','Big picture, market opportunity, inspiring pitch, "why this matters now"'],
                  ['⚡ <strong>The Hacker</strong>','CTO / Growth Hacker','Technical shortcuts, viral loops, unfair advantages, 2-3 real technical flaws'],
                  ['📊 <strong>The Analyst</strong>','CFO / Data','TAM, CAC, LTV, MRR targets, market size, 3-year revenue projections'],
                  ['⚠️ <strong>The Critic</strong>','Risk / Devil\'s Advocate','Exactly 5 reasons this FAIL karega + ek-ek line fix for each reason'],
                  ['👑 <strong>Master Blueprint</strong>','Final Synthesis','Mission + growth hacks + metrics dashboard + risk mitigation + 30-60-90 day plan'],
                ]}
              />
              <TipBox type="info">Har agent pehle wale sab agents ke responses padh ke phir apna deta hai. Critic, Visionary ko challenge kar sakta hai. Blueprint sab kuch synthesize karke concrete action plan banata hai.</TipBox>

              <SH id="inv-steps" level={3}>Kaise Use Karein</SH>
              <Step num={1} title="Apna goal likhو">Text box mein apna business idea, project ya proposal likhو. Jitna detail doge utna better.</Step>
              <Step num={2} title="Start Board Session click karo">Purple button dabao. 5 AI calls sequentially run honge. Har agent ki progress top bar mein dikhegi.</Step>
              <Step num={3} title="Debate padho — real-time mein">Har agent ke responses ek-ek karke appear hote hain. Sab padho — especially Critic ke 5 failure points.</Step>
              <Step num={4} title="Master Blueprint use karo">Last section hai Master Blueprint — yahi sabse important hai. 30-60-90 day milestones, metrics, risk mitigation sab kuch.</Step>
              <Step num={5} title="Download ya Save karo">Blueprint ko .md file mein download karo, ya Vault mein save karo.</Step>

              <SH id="inv-cancel" level={3}>Cancel — Debate Rok Sakte Ho</SH>
              <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'16px' }}>Progress bar ke right side mein red <strong style={{color:'#fff'}}>"Stop"</strong> button hai. Kisi bhi waqt click karo — current agent stop ho jaata hai, jo ab tak aya hai woh dikhta rehta hai.</p>

              <SH id="inv-history" level={3}>History — Last 8 Blueprints Save Hote Hain</SH>
              <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'16px' }}>Header mein "History" button (badge ke saath) dikhta hai jab koi blueprint bana ho. Click karo → panel open hota hai → "Restore" click karo — goal aur blueprint wapas aa jaata hai instantly.</p>

              <TipBox type="try">
                <strong>Yeh goal type karo:</strong><br/>
                <code style={{color:'#a78bfa'}}>AI-powered resume builder SaaS for Indian job seekers targeting Tier 2 cities</code><br/><br/>
                → Start Board Session click karo<br/>
                → Sab 5 agents ke responses padho (5-10 minutes lagenge)<br/>
                → Master Blueprint mein 30-60-90 day milestones dekho<br/>
                → Download .md click karo — markdown file mil jaati hai
              </TipBox>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* CREATOR STUDIO */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="creator" data-section style={{ marginBottom:'70px' }}>
            <ToolHeader num="08" emoji="🎨" title="Creator Studio" color="#f87171"
              subtitle="8 social platforms ke liye viral content banao — captions, hooks, 7-day calendar, competitor analysis."
              tags={['8 Platforms','Generate','Viral Hooks (5 styles)','7-Day Calendar','Beat Competitor','Best Posting Times']}
            />
            <div style={{ padding:'0' }}>
              <SH id="creator-platforms" level={3}>Step 1 — Platform Select Karo</SH>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'20px' }}>
                {[
                  ['📸 Instagram','Captions, reels, carousels, stories'],
                  ['▶️ YouTube','Scripts, thumbnail text, descriptions'],
                  ['🎵 TikTok','Viral hooks, scripts, trending sounds'],
                  ['🐦 Twitter/X','Threads, tweets, engagement replies'],
                  ['💼 LinkedIn','Thought leadership, company posts'],
                  ['👥 Facebook','Community posts, ads, events'],
                  ['💬 WhatsApp','Broadcast messages, status updates'],
                  ['📌 Pinterest','Pin descriptions, board strategies'],
                ].map(([p,d]) => (
                  <div key={p} style={{ background:'rgba(248,113,113,0.05)', border:'1px solid rgba(248,113,113,0.15)', borderRadius:'10px', padding:'12px 14px' }}>
                    <div style={{ fontWeight:700, color:'#f87171', fontSize:'13px', marginBottom:'3px' }}>{p}</div>
                    <div style={{ fontSize:'11px', color:'#64748b' }}>{d}</div>
                  </div>
                ))}
              </div>

              <SH id="creator-tools" level={3}>Step 2 — Tab Select Karo (4 Tools)</SH>
              <DocTable
                headers={['Tab','Kya Karta Hai','Key Options']}
                rows={[
                  ['⚡ <strong>Generate</strong>','Platform-specific content banata hai — har platform ke options alag hote hain','Content Goal (Viral/Educational/Promotional), Format (Caption/Script/Thread), Tone, Topic'],
                  ['🔥 <strong>Viral Hooks</strong>','5 hooks, 5 different styles mein — har ek copy/use button ke saath','Question, Shocking Stat, Story, Controversy, Challenge — topic ya Generate tab ka topic use karta hai'],
                  ['📅 <strong>7-Day Calendar</strong>','Full week schedule: day, best time, content type, caption, hashtags, pro tip','Niche field fill karo (ya Generate tab se auto-fill), Generate Calendar click karo — CSV bhi download ho sakta hai'],
                  ['⚔️ <strong>Beat Competitor</strong>','Competitor ka URL Spider se scrape karta hai → AI gap dhundta hai — kya woh cover nahi kar rahe','Competitor URL paste karo → AI batata hai which angles they\'re missing = your content opportunity'],
                ]}
              />

              <SH id="creator-steps" level={3}>Step-by-Step Pehli Baar</SH>
              <Step num={1} title="Platform select karo">Top grid mein apna platform click karo (Instagram, TikTok, etc.).</Step>
              <Step num={2} title="Topic / Niche field bharو">Apna topic, brand, ya product likhو (e.g. "Fitness coaching for busy moms").</Step>
              <Step num={3} title="Generate tab — content banao">Content Goal aur Format choose karo → Generate click karo → caption/script milega.</Step>
              <Step num={4} title="Viral Hooks tab try karo">Wahi topic automatically use hoga → 5 alag style hooks milenge → best copy karo.</Step>
              <Step num={5} title="7-Day Calendar banao">Calendar tab → niche confirm karo → Generate Calendar → poori week ka plan milega → CSV download karo.</Step>

              <TipBox type="try">
                <strong>Platform:</strong> Instagram | <strong>Topic:</strong> Healthy meal prep for college students<br/><br/>
                1. Generate tab → Goal: Viral/high engagement → Format: Caption + hashtags → Generate<br/>
                2. Viral Hooks tab → 5 hooks milenge (Question, Stat, Story, etc.) → best wala copy karo<br/>
                3. Content Calendar → Generate → poori week ka plan with best posting times<br/>
                4. Beat Competitor → competitor Instagram URL paste karo → unka gap dhundo
              </TipBox>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SEO OPTIMIZER */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="seo" data-section style={{ marginBottom:'70px' }}>
            <ToolHeader num="09" emoji="🔍" title="SEO Optimizer" color="#60a5fa"
              subtitle="7 tools ek mein: keyword research, SERP preview, content scoring, topic clusters, gap analysis, meta generation, schema."
              tags={['Keyword Lab','SERP Simulator','Content Scorer','Topic Clusters','Content Gap AI','Meta Forge','Schema Generator','Per-Tool State','Session History']}
            />
            <div style={{ padding:'0' }}>
              <TipBox type="info">Yeh AI-estimated data hai — actual search volumes Ahrefs/Semrush jaise live APIs se nahi aate. Estimates mostly accurate hote hain direction ke liye.</TipBox>

              <SH id="seo-tools" level={3}>7 Tools — Ek Ek Karke Samjho</SH>

              <SH id="seo-t1" level={4}>1. 🔍 Keyword Lab</SH>
              <p style={{ color:'#94a3b8', fontSize:'13px', lineHeight:1.8, marginBottom:'12px' }}>Apna topic ya seed keyword daalo → milega:</p>
              <ul style={{ color:'#94a3b8', fontSize:'13px', lineHeight:2.1, paddingLeft:'20px', marginBottom:'14px' }}>
                <li>10+ target keywords with intent (informational/commercial/transactional), difficulty, opportunity</li>
                <li>Long-tail goldmines — low competition high intent keywords</li>
                <li>LSI aur semantic keywords jo content mein hone chahiye</li>
                <li>People Also Ask — 8 questions jo content mein answer karne chahiye</li>
                <li>Content strategy recommendation + quick win opportunities</li>
              </ul>

              <SH id="seo-t2" level={4}>2. 🌐 SERP Simulator</SH>
              <p style={{ color:'#94a3b8', fontSize:'13px', lineHeight:1.8, marginBottom:'12px' }}>Page title aur URL daalo → Google jaise live preview milta hai + CTR analysis + 5 optimized title alternatives + featured snippet opportunity.</p>

              <SH id="seo-t3" level={4}>3. 📊 Content Scorer</SH>
              <p style={{ color:'#94a3b8', fontSize:'13px', lineHeight:1.8, marginBottom:'12px' }}>Apna existing article paste karo → 6 dimensions pe score milta hai (0-100):</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'14px' }}>
                {['Overall','Keyword Density','Readability','Structure','Semantic Coverage','User Intent'].map(s => (
                  <span key={s} style={{ fontSize:'11px', fontWeight:700, padding:'2px 9px', borderRadius:'20px', background:'rgba(96,165,250,0.1)', color:'#60a5fa', border:'1px solid rgba(96,165,250,0.2)' }}>{s}</span>
                ))}
              </div>
              <p style={{ color:'#94a3b8', fontSize:'13px', lineHeight:1.8, marginBottom:'14px' }}>Plus: Critical issues list, quick wins, missing keywords, content gaps, structure recommendations, competitor advantage suggestions.</p>

              <SH id="seo-t4" level={4}>4. 🗂️ Topic Clusters</SH>
              <p style={{ color:'#94a3b8', fontSize:'13px', lineHeight:1.8, marginBottom:'14px' }}>Main topic daalo → milega: 1 pillar page + 8 cluster pages architecture + internal linking strategy + 4-week content calendar + which cluster page sabse jaldi rank karega.</p>

              <SH id="seo-t5" level={4}>5. 🎯 Content Gap AI</SH>
              <p style={{ color:'#94a3b8', fontSize:'13px', lineHeight:1.8, marginBottom:'14px' }}>Apna niche/website topic + competitor URLs daalo → milega: keywords jo woh rank karte hain tum nahi, quick wins (30-60 din mein rank ho sakta), content types tumhare paas missing, featured snippet opportunities, 30-day action plan.</p>

              <SH id="seo-t6" level={4}>6. 📝 Meta Forge</SH>
              <p style={{ color:'#94a3b8', fontSize:'13px', lineHeight:1.8, marginBottom:'14px' }}>Page topic daalo → 5 title options milte hain (Power+Number, Question, Benefit, Urgency, Specific style mein) — har ek ke saath: char count (60 limit enforce hoti hai), CTR prediction, emotion type. Plus OG title + Twitter card description.</p>

              <SH id="seo-t7" level={4}>7. 🏗️ Schema Generator</SH>
              <p style={{ color:'#94a3b8', fontSize:'13px', lineHeight:1.8, marginBottom:'14px' }}>19 schema types mein se chuno → milega: kyun yeh schema best hai, complete JSON-LD with individual "Copy JSON" button, rich snippet features jo unlock honge, + ek complementary schema ka suggestion (woh bhi JSON ke saath).</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'20px' }}>
                {['Article','BlogPosting','Product','FAQPage','HowTo','LocalBusiness','Review','Recipe','Event','Person','Organization','VideoObject','Course','JobPosting','SoftwareApplication','MedicalCondition','BreadcrumbList','WebPage','NewsArticle'].map(s => (
                  <code key={s} style={{ background:'rgba(96,165,250,0.08)', color:'#60a5fa', padding:'3px 9px', borderRadius:'6px', fontSize:'11px', border:'1px solid rgba(96,165,250,0.15)' }}>{s}</code>
                ))}
              </div>

              <SH id="seo-history" level={3}>Session History</SH>
              <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'16px' }}>Top-right mein "History" button (badge ke saath). Last 20 runs save hote hain. Click → "Restore" → previous result wapas aata hai. Har tool ka state alag save hota hai — ek tool switch karne se dusre ka data clear nahi hota.</p>

              <TipBox type="try">
                <strong>Full SEO Workflow — ek topic pe:</strong><br/>
                Topic: "AI tools for students"<br/><br/>
                1. <strong>Keyword Lab</strong> → target keywords + long-tail list milti hai<br/>
                2. <strong>Topic Clusters</strong> → pillar + 8 cluster pages architecture<br/>
                3. <strong>Content Scorer</strong> → apna existing draft paste karo → score aur gaps dekho<br/>
                4. <strong>Meta Forge</strong> → 5 optimized title options milte hain<br/>
                5. <strong>Schema Generator</strong> → Article schema → JSON-LD copy karo → webpage mein paste karo<br/><br/>
                Ab tumhare paas: keywords + architecture + content gaps + optimized title + structured data sab hai!
              </TipBox>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* MODEL COMPARE */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="compare" data-section style={{ marginBottom:'70px' }}>
            <ToolHeader num="10" emoji="⚖️" title="Model Compare" color="#a78bfa"
              subtitle="Same prompt 2 models pe simultaneously chalao. Response time, token count, cost estimate, aur AI judge verdict milta hai."
              tags={['Side-by-Side','Response Time (ms)','Token Count','Cost Estimate','AI Judge Verdict','Winner Badge','All Providers']}
            />
            <div style={{ padding:'0' }}>
              <SH id="compare-steps" level={3}>Kaise Use Karein</SH>
              <Step num={1} title="Model A aur Model B select karo">Dono dropdowns mein alag-alag models chuno. Free vs paid, fast vs smart, alag companies — kuch bhi compare kar sakte ho.</Step>
              <Step num={2} title="Quick prompt use karo ya apna likhو">5 preset prompts hain quick testing ke liye. Ya apna koi bhi prompt type karo large text area mein. Ctrl+Enter se bhi submit hota hai.</Step>
              <Step num={3} title="Dono models parallel mein run hote hain">Responses simultaneously load hote hain side-by-side. Response time badge dikhta hai — kaunsa faster tha.</Step>
              <Step num={4} title="AI Judge verdict padho">Ek third AI dono responses padh ke deta hai: kaunsa jeeta + reasoning + har model ki strengths + recommendation ki is task type ke liye kaunsa model use karo.</Step>

              <SH id="compare-metrics" level={3}>Har Response Ke Saath Milta Hai</SH>
              <DocTable
                headers={['Metric','Kya Batata Hai']}
                rows={[
                  ['⏱️ <strong>Response Time</strong>','Milliseconds mein — kaunsa model faster tha'],
                  ['📊 <strong>~Token Count</strong>','Approximate tokens used — cost estimate ke liye'],
                  ['💰 <strong>~Cost Estimate</strong>','Is prompt ka approximate cost in USD (estimate hai)'],
                  ['🏆 <strong>Winner Badge</strong>','AI Judge ne kise select kiya'],
                ]}
              />

              <TipBox type="try">
                <strong>Model A:</strong> Llama 3.3 70B (free via Groq) | <strong>Model B:</strong> GPT-4o ya Claude Sonnet<br/>
                <strong>Prompt:</strong> "Explain quantum entanglement to a 10-year-old in 3 sentences"<br/><br/>
                Dekho kaunsa model better explain karta hai. Winner model apna default model set karo similar tasks ke liye.<br/><br/>
                <strong>Pro tip:</strong> Free Llama vs paid GPT-4o compare karo → agar quality similar hai → Llama use karo aur paise bachao!
              </TipBox>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* PROMPT LIBRARY */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="library" data-section style={{ marginBottom:'70px' }}>
            <ToolHeader num="11a" emoji="📚" title="Prompt Library" color="#fbbf24"
              subtitle="60+ expert prompts 6 categories mein. Filter, search, favorite, copy — ek click mein."
              tags={['60+ Prompts','6 Categories','Favorites','Search','Copy & Use','Custom Parameters']}
            />
            <div style={{ padding:'0' }}>
              <SH id="lib-cats" level={3}>6 Categories</SH>
              <DocTable
                headers={['Category','Count','Examples']}
                rows={[
                  ['<strong>Writing</strong>','10+','Blog intro hook, Email subjects, YouTube script, Twitter thread starter'],
                  ['<strong>Marketing</strong>','10+','Google Ads copy, Facebook brief, Retargeting sequence, Landing page CTA'],
                  ['<strong>Coding</strong>','10+','React component, API endpoint, SQL optimizer, CI/CD pipeline script'],
                  ['<strong>Business</strong>','10+','Pitch deck script, SWOT analysis, SOP document, Investor update email'],
                  ['<strong>Education</strong>','10+','Lesson plan, Quiz questions, Flashcard deck, Certification prep guide'],
                  ['<strong>Creative</strong>','10+','Short story, Character profile, Worldbuilding doc, D&D campaign'],
                ]}
              />

              <SH id="lib-use" level={3}>Kaise Use Karein</SH>
              <Step num={1} title="Category pill click karo">Top mein 6 colored pills hain. Click karo → sirf usi category ke prompts dikhenge.</Step>
              <Step num={2} title="Search box use karo">Specific prompt dhundo — "Refactor", "Email", "LinkedIn" type karo → instant filter.</Step>
              <Step num={3} title="Star ⭐ click karo favorites mein add karo">Pasand aaya? Star click karo → "Favorites" category mein save ho jaata hai locally.</Step>
              <Step num={4} title="Copy & Use click karo">Prompt clipboard mein copy ho jaata hai. Directly Prompt Optimizer ya AI Writer mein paste karo.</Step>

              <TipBox type="tip">
                Prompt Library ko Prompt Optimizer ke saath use karo: Library se prompt copy karo → Optimizer mein paste karo → Forge → aur powerful prompt milta hai → phir use karo. Best combo hai!
              </TipBox>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* API KEYS */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="apikeys" data-section style={{ marginBottom:'70px' }}>
            <ToolHeader num="11b" emoji="🔑" title="API Keys (Settings)" color="#34d399"
              subtitle="Apni API keys securely store karo — AES-GCM encryption ke saath browser mein. Koi server nahi."
              tags={['6 Providers','AES-GCM Encryption','Local Only','Show/Hide Toggle','Key Validation','Multiple Keys']}
            />
            <div style={{ padding:'0' }}>
              <SH id="keys-how" level={3}>Key Add Karna — Step by Step</SH>
              <Step num={1} title="Sidebar mein 'API Keys' click karo">Bottom mein milega — settings icon ke paas.</Step>
              <Step num={2} title="Provider select karo">6 provider tabs hain: OpenAI, Anthropic, Groq, Google Gemini, OpenRouter, Mistral. Apna tab click karo.</Step>
              <Step num={3} title="Key paste karo">Text field mein apni API key paste karo. Show/Hide toggle se dekh sakte ho.</Step>
              <Step num={4} title="Save click karo">Key AES-GCM encryption ke saath browser localStorage mein save hoti hai. Server pe nahi jaati kabhi.</Step>
              <Step num={5} title="Model select karo">Kisi bhi tool ke upar "Change Model / API Key" button → us provider ke models select karo.</Step>

              <SH id="keys-security" level={3}>Security — Tumhari Keys Kahan Hain?</SH>
              <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'16px' }}>
                Keys <strong style={{color:'#fff'}}>sirf tumhare browser ke localStorage mein hain</strong> — AES-GCM encryption ke saath. PromptForge ka koi server key receive nahi karta. Jab tum AI tool use karte ho, request directly tumhare browser se AI provider tak jaati hai — PromptForge ke server se nahi.
              </p>

              <TipBox type="warn">
                Key save karne ke baad page refresh karo toh key safe rehti hai — localStorage mein encrypted store hoti hai. Browser "Clear Site Data" karne se keys delete ho sakti hain — backup rakhho apni keys ka.
              </TipBox>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* HISTORY VAULT */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="vault" data-section style={{ marginBottom:'70px' }}>
            <SH id="vault-h" level={2}>💾 History Vault — Koi Output Kabhi Nahi Jaata</SH>
            <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'16px' }}>Har tool se jo bhi output aata hai woh Vault mein manually save kar sakte ho — "Save" button press karo. Vault sirf tumhare browser mein hai (IndexedDB) — kisi server pe nahi.</p>
            <DocTable
              headers={['Feature','Kaise Kaam Karta Hai']}
              rows={[
                ['<strong>Save</strong>','Har tool mein "Save" button click karo → tool name + topic ke saath automatically tag hota hai'],
                ['<strong>Search</strong>','Keyword se search karo sab saved items mein'],
                ['<strong>Filter by Tool</strong>','Sirf DataWizard outputs dekho, ya sirf AI Writer outputs — tool ke hisaab se filter'],
                ['<strong>Restore</strong>','Koi bhi saved item click karo → us tool mein wapas load ho jaata hai'],
                ['<strong>Copy</strong>','Kisi bhi saved result ko instantly clipboard mein copy karo'],
                ['<strong>Delete</strong>','Individual items delete karo, ya sab clear karo'],
                ['<strong>Storage</strong>','Browser IndexedDB — private, never sent anywhere'],
              ]}
            />
            <TipBox type="tip">
              Vault ko regularly use karo — khaas kar Data Wizard aur The Inventor ke outputs ke liye. Ek baar AI ne 5 agent debate ki aur blueprint banaya → Vault mein save karo → kabhi bhi wapas lao bina dobara run kiye.
            </TipBox>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* PRO TIPS */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="tips" data-section style={{ marginBottom:'70px' }}>
            <SH id="tips-h" level={2}>⚡ Pro Tips & Power Combos</SH>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'24px' }}>
              {[
                ['🕷️→💬','Spider + Chat With Data','Spider se koi topic research karo → "Send to Chat" click karo → Chat mein deep questions puchho same data pe'],
                ['🧙→💬','Data Wizard + Chat','SQL banao Data Wizard mein → DB mein run karo → CSV export karo → Chat mein upload karo analysis ke liye'],
                ['🎯→✍️','Optimizer + Writer','Pehle Prompt Optimizer se content brief optimize karo → forged prompt AI Writer mein use karo'],
                ['⚖️→🔑','Compare + Choose Model','Model Compare se apne task ke liye best model dhundo → woh default set karo → paise bachao'],
                ['📚→🎯','Library + Optimizer','Library se prompt copy karo → Optimizer mein paste karo → Forge → 10x better prompt milta hai'],
                ['🔍→📝','SEO Full Workflow','Keyword Lab → Topic Clusters → Content Scorer → Meta Forge → Schema Generator — complete SEO package'],
                ['💡→💾','Inventor + Vault','5-agent debate run karo → Master Blueprint Vault mein save karo → kabhi bhi restore karo'],
                ['📊→📧','Chat + Writer','Chat mein data analyze karo → findings copy karo → AI Writer mein email/report banao'],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'18px' }}>
                  <div style={{ fontSize:'18px', marginBottom:'8px' }}>{icon}</div>
                  <div style={{ fontSize:'14px', fontWeight:700, color:'#fff', marginBottom:'6px' }}>{title}</div>
                  <div style={{ fontSize:'12px', color:'#64748b', lineHeight:1.65 }}>{desc}</div>
                </div>
              ))}
            </div>
            <TipBox type="tip">
              <strong>Best free setup:</strong> OpenRouter.ai pe free account banao → key copy karo → PromptForge ke API Keys mein paste karo → model select karo: <code style={{color:'#a78bfa'}}>meta-llama/llama-3.3-70b-instruct:free</code> → sabhi 11 tools bilkul free mein kaam karenge!
            </TipBox>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TROUBLESHOOTING */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="errors" data-section style={{ marginBottom:'70px' }}>
            <SH id="errors-h" level={2}>🛠️ Troubleshooting — Problems & Fixes</SH>
            <DocTable
              headers={['Error / Problem','Cause','Fix']}
              rows={[
                ['<strong>API Key for [model] is missing</strong>','Us provider ki key add nahi ki','Settings → API Keys → us provider ki key add karo'],
                ['<strong>401 Unauthorized</strong>','Galat ya expired API key','Key dobara check karo — correct hai? Credits hain?'],
                ['<strong>429 Rate Limited</strong>','Zyaada fast requests','30-60 seconds wait karo ya different model switch karo'],
                ['<strong>Connection Blocked / Failed to fetch</strong>','Ad-blocker, VPN, ya firewall block kar raha hai','Is site ke liye ad-blocker disable karo, ya VPN temporarily off karo'],
                ['<strong>Spider: No data retrieved</strong>','Site scraping block karti hai YA query bahut vague hai','https:// ke saath specific URL try karo, ya aur specific search term'],
                ['<strong>PDF not extracting</strong>','PDF.js CDN load nahi hua abhi tak','Page load ke 3-5 second baad PDF re-upload karo'],
                ['<strong>Charts not appearing in Chat</strong>','AI ne numerical data nahi diya response mein','Explicitly puchho: "give me statistics" ya "Key Stats" chip click karo'],
                ['<strong>Output mein ** symbols aa rahe hain</strong>','AI ne markdown diya lekin render nahi hua','Yeh display quirk hai — copy karo aur dusre tool mein paste karo'],
                ['<strong>Bahut slow response</strong>','Model overloaded ya input bahut bada hai','Groq/Llama 3.3 switch karo speed ke liye, ya input size kam karo'],
                ['<strong>Tool kuch nahi kar raha (no response)</strong>','Silently failed — usually API key issue','Browser console check karo (F12) — error message dekho'],
                ['<strong>History Vault empty hai</strong>','Output save nahi hua automatically','Har tool mein manually "Save" button click karna hoga — auto-save nahi hota'],
                ['<strong>Inventor: debate mein stop ho gaya</strong>','AI call fail hua ya cancel dabaya','Dobara "Start Board Session" click karo — ya Cancel ke baad phir start karo'],
              ]}
            />
            <TipBox type="info">
              Koi bhi tool completely broken ho toh try karo: 1) Page refresh karo 2) Browser cache clear karo 3) Alag model try karo 4) Check karo API key mein credits hain
            </TipBox>
          </section>

          {/* Footer */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:'32px', textAlign:'center', color:'#334155', fontSize:'12px' }}>
            PromptForge Docs v3.0 · 11 Tools · Sab outputs tumhare connected AI model se real-time generate hote hain · Data sirf tumhare device pe
          </div>

        </div>{/* close englishRef div */}
        </div>{/* close maxWidth div */}
      </main>
    </div>
  );
};

export default Docs;