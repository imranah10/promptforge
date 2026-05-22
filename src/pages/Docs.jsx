import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, ChevronDown, Copy, Check, ExternalLink, Zap, Globe } from 'lucide-react';

// ── TRANSLATIONS ──────────────────────────────────────────────────────────────
const T = {
  en: {
    heroTitle: 'PromptForge Documentation',
    heroSub: 'Everything you need — from first API key to production workflows. So simple a 5-year-old can follow.',
    searchPlaceholder: 'Search docs...',
    tocLabel: 'ON THIS PAGE',
    langLabel: 'Language',
  },
  hi: {
    heroTitle: 'PromptForge डॉक्यूमेंटेशन',
    heroSub: 'सब कुछ जो आपको चाहिए — पहली API key से लेकर production workflows तक। इतना आसान कि कोई भी समझ जाए।',
    searchPlaceholder: 'खोजें...',
    tocLabel: 'इस पेज पर',
    langLabel: 'भाषा',
  },
  es: { heroTitle: 'Documentación PromptForge', heroSub: 'Todo lo que necesitas desde la primera clave API hasta flujos de trabajo de producción.', searchPlaceholder: 'Buscar docs...', tocLabel: 'EN ESTA PÁGINA', langLabel: 'Idioma' },
  fr: { heroTitle: 'Documentation PromptForge', heroSub: 'Tout ce dont vous avez besoin, de la première clé API aux flux de production.', searchPlaceholder: 'Rechercher...', tocLabel: 'SUR CETTE PAGE', langLabel: 'Langue' },
  de: { heroTitle: 'PromptForge Dokumentation', heroSub: 'Alles was Sie brauchen — vom ersten API-Schlüssel bis zu Produktions-Workflows.', searchPlaceholder: 'Suchen...', tocLabel: 'AUF DIESER SEITE', langLabel: 'Sprache' },
  ja: { heroTitle: 'PromptForge ドキュメント', heroSub: '最初のAPIキーから本番ワークフローまで、必要なすべてが揃っています。', searchPlaceholder: '検索...', tocLabel: 'このページ', langLabel: '言語' },
  zh: { heroTitle: 'PromptForge 文档', heroSub: '从第一个API密钥到生产工作流程，您需要的一切。', searchPlaceholder: '搜索...', tocLabel: '本页内容', langLabel: '语言' },
  pt: { heroTitle: 'Documentação PromptForge', heroSub: 'Tudo que você precisa, da primeira chave API aos fluxos de trabalho de produção.', searchPlaceholder: 'Pesquisar...', tocLabel: 'NESTA PÁGINA', langLabel: 'Idioma' },
};

const LANGS = [
  { code:'en', label:'🇺🇸 English' }, { code:'hi', label:'🇮🇳 हिंदी' },
  { code:'es', label:'🇪🇸 Español' }, { code:'fr', label:'🇫🇷 Français' },
  { code:'de', label:'🇩🇪 Deutsch' }, { code:'ja', label:'🇯🇵 日本語' },
  { code:'zh', label:'🇨🇳 中文'   }, { code:'pt', label:'🇧🇷 Português' },
];

// ── CODE BLOCK ────────────────────────────────────────────────────────────────
function CodeBlock({ code, lang = '' }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ background:'#000', border:'1px solid rgba(124,92,252,0.25)', borderRadius:'12px', overflow:'hidden', margin:'14px 0' }}>
      <div style={{ background:'rgba(124,92,252,0.08)', padding:'8px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(124,92,252,0.1)' }}>
        <span style={{ fontSize:'10px', fontWeight:800, color:'#a78bfa', letterSpacing:'2px' }}>{lang.toUpperCase() || 'CODE'}</span>
        <button onClick={copy} style={{ background:'none', border:'none', color: copied?'#34d399':'#555', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', fontWeight:700 }}>
          {copied ? <><Check size={11}/> Copied</> : <><Copy size={11}/> Copy</>}
        </button>
      </div>
      <pre style={{ padding:'16px', margin:0, overflowX:'auto', fontFamily:"'DM Mono',monospace", fontSize:'13px', lineHeight:1.7, color:'#e2e8f0' }}>{code}</pre>
    </div>
  );
}

// ── TIP BOX ───────────────────────────────────────────────────────────────────
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

// ── STEP ──────────────────────────────────────────────────────────────────────
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

// ── TABLE ─────────────────────────────────────────────────────────────────────
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

// ── SECTION HEADING ───────────────────────────────────────────────────────────
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

// ── MAIN DOCS ─────────────────────────────────────────────────────────────────
const Docs = () => {
  const [lang,       setLang]       = useState('en');
  const [search,     setSearch]     = useState('');
  const [activeId,   setActiveId]   = useState('intro');
  const [showLang,   setShowLang]   = useState(false);
  const contentRef = useRef(null);
  const t = T[lang] || T.en;

  // Progress bar + active section tracking
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onScroll = () => {
      const sections = el.querySelectorAll('[data-section]');
      sections.forEach(sec => {
        const rect = sec.getBoundingClientRect();
        if (rect.top < 150 && rect.bottom > 0) setActiveId(sec.id);
      });
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior:'smooth' }); setActiveId(id); }
  };

  const NAV = [
    { label:'GETTING STARTED', items:[
      { id:'intro',  label:'Introduction' },
      { id:'setup',  label:'Quick Setup (2 min)' },
      { id:'models', label:'AI Models & Keys' },
    ]},
    { label:'STUDIO TOOLS', items:[
      { id:'optimizer',  label:'Prompt Optimizer' },
      { id:'aiwriter',   label:'AI Writer' },
      { id:'codehelper', label:'Code Helper' },
      { id:'datawizard', label:'Data Wizard' },
      { id:'spider',     label:'The Spider' },
      { id:'chatdata',   label:'Chat With Data' },
      { id:'inventor',   label:'The Inventor' },
    ]},
    { label:'CREATOR TOOLS', items:[
      { id:'creator',  label:'Creator Studio' },
      { id:'seo',      label:'SEO Optimizer' },
      { id:'compare',  label:'Model Compare' },
      { id:'imgprompt',label:'Image Prompt' },
      { id:'vidprompt',label:'Video Prompt' },
    ]},
    { label:'MORE', items:[
      { id:'library', label:'Prompt Library' },
      { id:'vault',   label:'History Vault' },
      { id:'tips',    label:'Pro Tips & Combos' },
      { id:'errors',  label:'Troubleshooting' },
    ]},
  ];

  const filtered = search
    ? NAV.flatMap(g => g.items).filter(i => i.label.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <div style={{ display:'flex', height:'100vh', background:'#030308', color:'#e2e8f0', fontFamily:"'DM Sans',sans-serif", overflow:'hidden' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width:'260px', flexShrink:0, background:'rgba(6,6,15,0.98)', borderRight:'1px solid rgba(255,255,255,0.06)', overflowY:'auto', display:'flex', flexDirection:'column' }}>

        {/* Logo */}
        <div style={{ padding:'22px 20px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'32px', height:'32px', background:'var(--accent)', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>⚡</div>
            <div>
              <div style={{ fontSize:'16px', fontWeight:900, color:'#fff', letterSpacing:'-0.5px' }}>PromptForge</div>
              <div style={{ fontSize:'10px', color:'var(--accent)', fontWeight:700, letterSpacing:'2px' }}>DOCS v3.0</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding:'12px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', padding:'8px 12px' }}>
            <Search size={13} style={{ color:'#475569', flexShrink:0 }}/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              style={{ background:'none', border:'none', color:'#fff', fontSize:'12px', outline:'none', width:'100%' }}/>
          </div>
        </div>

        {/* Language switcher */}
        <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setShowLang(!showLang)}
            style={{ width:'100%', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'9px', padding:'8px 12px', color:'#94a3b8', fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:'inherit' }}>
            <span style={{ display:'flex', alignItems:'center', gap:'6px' }}><Globe size={12}/> {LANGS.find(l=>l.code===lang)?.label}</span>
            <ChevronDown size={12} style={{ transform: showLang ? 'rotate(180deg)' : 'none', transition:'.2s' }}/>
          </button>
          <AnimatePresence>
            {showLang && (
              <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} style={{ overflow:'hidden' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px', paddingTop:'8px' }}>
                  {LANGS.map(l => (
                    <button key={l.code} onClick={() => { setLang(l.code); setShowLang(false); }}
                      style={{ background: lang===l.code ? 'rgba(124,92,252,0.2)' : 'transparent', border:`1px solid ${lang===l.code?'rgba(124,92,252,0.4)':'rgba(255,255,255,0.06)'}`, borderRadius:'7px', padding:'6px 8px', color: lang===l.code?'#a78bfa':'#666', fontSize:'11px', cursor:'pointer', fontFamily:'inherit', transition:'.15s', fontWeight: lang===l.code?700:500 }}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'8px 8px 20px' }}>
          {(filtered ? [{ label:'RESULTS', items: filtered }] : NAV).map(group => (
            <div key={group.label}>
              <div style={{ fontSize:'10px', fontWeight:800, color:'#334155', letterSpacing:'3px', padding:'14px 10px 6px' }}>{group.label}</div>
              {group.items.map(item => (
                <button key={item.id} onClick={() => scrollTo(item.id)}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:'8px', padding:'8px 12px', borderRadius:'9px', border:'none', background: activeId===item.id ? 'rgba(124,92,252,0.15)' : 'transparent', color: activeId===item.id ? '#a78bfa' : '#64748b', fontSize:'13px', fontWeight: activeId===item.id ? 700 : 500, cursor:'pointer', textAlign:'left', fontFamily:'inherit', transition:'.15s',
                    borderLeft: activeId===item.id ? '3px solid var(--accent)' : '3px solid transparent' }}>
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

          {/* HERO */}
          <div style={{ marginBottom:'60px' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(124,92,252,0.1)', border:'1px solid rgba(124,92,252,0.3)', padding:'5px 14px', borderRadius:'20px', fontSize:'11px', fontWeight:700, color:'#a78bfa', letterSpacing:'1px', marginBottom:'20px' }}>
              📖 COMPLETE DOCUMENTATION
            </div>
            <h1 style={{ fontSize:'44px', fontWeight:900, color:'#fff', letterSpacing:'-2.5px', lineHeight:1.05, marginBottom:'16px' }}>
              {t.heroTitle.split('PromptForge').map((part, i, arr) =>
                i < arr.length - 1
                  ? <span key={i}>{part}<span style={{ color:'var(--accent)' }}>PromptForge</span></span>
                  : <span key={i}>{part}</span>
              )}
            </h1>
            <p style={{ fontSize:'17px', color:'#64748b', lineHeight:1.75, maxWidth:'580px', marginBottom:'32px' }}>{t.heroSub}</p>
            <div style={{ display:'flex', gap:'28px', flexWrap:'wrap' }}>
              {[['15', 'Tools'],['8','Languages'],['60+','Examples'],['∞','Possibilities']].map(([n,l]) => (
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
              PromptForge is an all-in-one AI workspace with 15 specialized tools — each built for a specific job.
              You bring your own API key, PromptForge brings the intelligence. No middleman, no markup, full privacy.
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'24px' }}>
              {[
                ['🔑','Bring Your Own Key','OpenAI, Anthropic, Groq, Gemini, OpenRouter — any provider'],
                ['🛠️','15 Specialized Tools','Each tool has its own expert AI system prompt, not generic chat'],
                ['💾','History Vault','Every output auto-saved locally. Yours forever, never sent anywhere'],
                ['🌐','Multi-Model Support','Switch models anytime from top bar. Use free Llama 3.3 to get started'],
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
            <SH id="setup-h" level={2}>Quick Setup — 2 Minutes</SH>
            <Step num={1} title="Open API Keys"><strong style={{color:'#fff'}}>Click "API Keys"</strong> in the left sidebar. You need at least one key to use any tool.</Step>
            <Step num={2} title="Add Your API Key">Paste your key from OpenAI, Anthropic, Groq, Gemini, or any provider. <strong style={{color:'#34d399'}}>Free option:</strong> Sign up at OpenRouter.ai (free) → use Llama 3.3 70B at zero cost.</Step>
            <Step num={3} title="Select Active Model">Click <strong style={{color:'#fff'}}>"Change Model / API Key"</strong> at the top of any page. Choose your model. Active model shows in the top bar.</Step>
            <Step num={4} title="Pick Any Tool & Start">Click any tool in the sidebar. Fill the fields, click Generate. Done — your first AI output is ready.</Step>
            <TipBox type="tip">Best free combo: <strong style={{color:'#fff'}}>OpenRouter key + Llama 3.3 70B (free tier)</strong> — fast, smart, zero cost. Perfect for testing all 15 tools.</TipBox>
          </section>

          {/* ── MODELS ── */}
          <section id="models" data-section style={{ marginBottom:'70px' }}>
            <SH id="models-h" level={2}>AI Models & API Keys</SH>
            <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'16px' }}>PromptForge supports all major AI providers. Each has its own key field in Settings:</p>
            <DocTable
              headers={['Provider','Key Format','Free Tier','Best For']}
              rows={[
                ['<strong>OpenAI</strong>','sk-...','No','GPT-4o: best all-around'],
                ['<strong>Anthropic</strong>','sk-ant-...','No','Claude: reasoning & writing'],
                ['<strong>Groq</strong>','gsk_...','Yes (rate limited)','Llama 3.3: fastest free option'],
                ['<strong>Google Gemini</strong>','AIza...','Yes (limited)','Gemini Flash: long context'],
                ['<strong>OpenRouter</strong>','sk-or-...','Yes (many free models)','Access 100+ models with one key'],
                ['<strong>Mistral</strong>','...','No','Efficient European models'],
                ['<strong>DeepSeek</strong>','...','No','Cheap & powerful coding'],
              ]}
            />
            <TipBox type="info">Provider keys are stored in your <strong style={{color:'#fff'}}>browser localStorage only</strong>. They never leave your device. Not sent to any server.</TipBox>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* PROMPT OPTIMIZER */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="optimizer" data-section style={{ marginBottom:'70px' }}>
            <div style={{ fontSize:'10px', fontWeight:800, color:'var(--accent)', letterSpacing:'4px', marginBottom:'10px' }}>TOOL 01</div>
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', overflow:'hidden', marginBottom:'20px' }}>
              <div style={{ background:'rgba(124,92,252,0.08)', padding:'22px 28px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:'16px' }}>
                  <div style={{ fontSize:'28px' }}>🎯</div>
                  <div>
                    <h2 style={{ fontSize:'22px', fontWeight:800, color:'#fff', margin:'0 0 4px', letterSpacing:'-0.5px' }}>Prompt Optimizer</h2>
                    <p style={{ color:'#64748b', fontSize:'13px', margin:0 }}>Turn weak, vague prompts into expert-level prompts that get 10x better AI responses.</p>
                    <div style={{ display:'flex', gap:'6px', marginTop:'10px', flexWrap:'wrap' }}>
                      {['CREATE Framework','Strength Gauge 0-100%','Live Test','Auto-Refine Loop','6 Quick Templates'].map(tag => (
                        <span key={tag} style={{ fontSize:'10px', fontWeight:700, padding:'2px 9px', borderRadius:'20px', background:'rgba(124,92,252,0.1)', color:'#a78bfa', border:'1px solid rgba(124,92,252,0.2)' }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ padding:'28px' }}>
                <SH id="optimizer-what" level={3}>What It Does</SH>
                <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'16px' }}>
                  You type a weak prompt. The Optimizer finds exactly what's wrong, then rewrites it using the <strong style={{color:'#fff'}}>CREATE framework</strong>: Character (who the AI should be), Request (what you want), Examples, Adjustments, Type (output format), Extras. You see a 0-100% Strength Score and 3 specific improvements made.
                </p>

                <SH id="optimizer-features" level={3}>All Features Explained</SH>
                <DocTable
                  headers={['Feature','What It Does','How To Use']}
                  rows={[
                    ['<strong>Intensity Slider (0-100)</strong>','Controls how aggressive the optimization is. Low=gentle fixes, High=full expert rewrite','Drag to 80-100 for complex tasks, 40-60 for simple ones'],
                    ['<strong>6 Quick Templates</strong>','Pre-loaded prompts: Blog Post, Cold Email, Fix Code, Instagram, Summarize, Ad Copy','Click any template to instantly load it into the input box'],
                    ['<strong>Strength Gauge</strong>','Scores your forged prompt 0-100%. Shows label: Weak / Moderate / Strong / Elite','Read the score after forging. Aim for 80+%'],
                    ['<strong>Weaknesses Panel</strong>','AI-generated list of exactly what was wrong with your original prompt (never hardcoded)','Read before testing — understand what changed'],
                    ['<strong>Enhancements Panel</strong>','Shows exactly what was added: persona, format spec, examples, constraints','Compare with original to learn better prompting'],
                    ['<strong>▶ Test It Button</strong>','Runs the forged prompt live on your active AI model. See actual output immediately','Click after forging. Read the result — is it what you wanted?'],
                    ['<strong>Refine Again</strong>','AI uses its own test output to improve the prompt further. Repeat up to 3 times','Click if first result is close but not perfect'],
                  ]}
                />

                <SH id="optimizer-how" level={3}>Step-by-Step How To Use</SH>
                <Step num={1} title="Choose a template or type your own">Click any of the 6 template buttons at the top, or type your own prompt in the input box.</Step>
                <Step num={2} title="Set the Intensity slider">For most tasks: 70-80. For maximum optimization: 90-100. The label updates as you drag.</Step>
                <Step num={3} title="Click Forge Prompt">AI analyzes weaknesses, rewrites using CREATE framework, shows Strength Score + what changed.</Step>
                <Step num={4} title="Click ▶ Test It">The forged prompt runs on your AI model. Read the actual output.</Step>
                <Step num={5} title="Refine if needed">Not satisfied? Click "Refine Again". AI improves based on what it generated. Repeat up to 3 times.</Step>

                <TipBox type="try">
                  <strong>Paste this weak prompt:</strong> "write a blog post about AI"<br/>
                  <strong>Set intensity: 85 → Click Forge Prompt</strong><br/>
                  You should get: Score 80-95%, weaknesses like "No target audience", "No length spec", "No persona"<br/>
                  Forged prompt will specify: journalist persona, 600-word target, CTO audience, specific examples required<br/>
                  <strong>Then click ▶ Test It</strong> — compare the quality of both outputs side by side.
                </TipBox>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* AI WRITER */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="aiwriter" data-section style={{ marginBottom:'70px' }}>
            <div style={{ fontSize:'10px', fontWeight:800, color:'var(--accent)', letterSpacing:'4px', marginBottom:'10px' }}>TOOL 02</div>
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', overflow:'hidden' }}>
              <div style={{ background:'rgba(244,114,182,0.06)', padding:'22px 28px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display:'flex', gap:'16px', alignItems:'flex-start' }}>
                  <div style={{ fontSize:'28px' }}>✍️</div>
                  <div>
                    <h2 style={{ fontSize:'22px', fontWeight:800, color:'#fff', margin:'0 0 4px' }}>AI Writer</h2>
                    <p style={{ color:'#64748b', fontSize:'13px', margin:0 }}>Generate, humanize, and A/B test any written content in 16 languages with tone analysis.</p>
                    <div style={{ display:'flex', gap:'6px', marginTop:'10px', flexWrap:'wrap' }}>
                      {['20 Content Types','16 Languages','Humanizer','A/B Variants','Tone Analyzer','AI Probability Score'].map(t => (
                        <span key={t} style={{ fontSize:'10px', fontWeight:700, padding:'2px 9px', borderRadius:'20px', background:'rgba(244,114,182,0.1)', color:'#f472b6', border:'1px solid rgba(244,114,182,0.2)' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ padding:'28px' }}>
                <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'20px' }}>AI Writer has <strong style={{color:'#fff'}}>4 modes in one tool</strong> — accessible via tabs in the output panel. Each mode does something completely different.</p>

                <SH id="aiwriter-modes" level={3}>4 Modes — All Different</SH>
                <DocTable
                  headers={['Mode / Tab','What It Does','When To Use']}
                  rows={[
                    ['<strong>Generate</strong>','Creates content from scratch using your type, tone, topic, language, and audience settings','Starting fresh — blog post, email, ad copy, LinkedIn post'],
                    ['<strong>Humanizer</strong>','Rewrites AI text to remove AI patterns (no "delve", "moreover", em-dashes). Passes detection.','Always run after generating — before publishing anywhere'],
                    ['<strong>A/B Variants</strong>','Creates 3 different versions with different angles, tones, and approaches','Email subject lines, ad headlines, landing page hooks'],
                    ['<strong>Tone Analyzer</strong>','Scores any text on 6 dimensions + gives AI Probability % + best platform suggestion','Check if your content matches your brand voice'],
                  ]}
                />

                <SH id="aiwriter-types" level={3}>20 Content Types</SH>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'20px' }}>
                  {['Blog post / Article','Cold email','LinkedIn post','Twitter/X thread','Product description','Cover letter','Professional bio','Ad copy','Sales page','YouTube script','Newsletter','SEO meta tags','Tagline / Slogan','Customer support reply','Code documentation','WhatsApp message','Instagram caption','TikTok script','Press release','Job description'].map(t => (
                    <code key={t} style={{ background:'rgba(124,92,252,0.08)', color:'#a78bfa', padding:'3px 9px', borderRadius:'6px', fontSize:'11px', border:'1px solid rgba(124,92,252,0.15)' }}>{t}</code>
                  ))}
                </div>

                <TipBox type="try">
                  <strong>Content Type:</strong> Cold email | <strong>Topic:</strong> My web design agency builds fast websites for restaurants | <strong>Tone:</strong> Friendly professional | <strong>Language:</strong> English<br/>
                  1. Click Generate → read the email<br/>
                  2. Click Humanizer tab → compare — all AI phrases removed<br/>
                  3. Click A/B Variants tab → get 3 different subject lines + openings<br/>
                  4. Paste your best version into Tone Analyzer → check AI Probability score
                </TipBox>

                <TipBox type="tip">Always run <strong style={{color:'#fff'}}>Humanizer</strong> before publishing. It removes all AI fingerprints. Content will not be flagged by AI detection tools.</TipBox>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* CODE HELPER */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="codehelper" data-section style={{ marginBottom:'70px' }}>
            <div style={{ fontSize:'10px', fontWeight:800, color:'var(--accent)', letterSpacing:'4px', marginBottom:'10px' }}>TOOL 03</div>
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', overflow:'hidden' }}>
              <div style={{ background:'rgba(52,211,153,0.06)', padding:'22px 28px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display:'flex', gap:'16px', alignItems:'flex-start' }}>
                  <div style={{ fontSize:'28px' }}>💻</div>
                  <div>
                    <h2 style={{ fontSize:'22px', fontWeight:800, color:'#fff', margin:'0 0 4px' }}>Code Helper</h2>
                    <p style={{ color:'#64748b', fontSize:'13px', margin:0 }}>Fix, explain, optimize, test, and review code in 18 languages. Includes Git Commit Generator and Security Auditor.</p>
                    <div style={{ display:'flex', gap:'6px', marginTop:'10px', flexWrap:'wrap' }}>
                      {['18 Languages','8 Tasks','Git Commits (3 styles)','Security Audit 0-100','Line-specific Vulnerabilities','100k Character Limit'].map(t => (
                        <span key={t} style={{ fontSize:'10px', fontWeight:700, padding:'2px 9px', borderRadius:'20px', background:'rgba(52,211,153,0.1)', color:'#34d399', border:'1px solid rgba(52,211,153,0.2)' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ padding:'28px' }}>
                <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'20px' }}>Code Helper has <strong style={{color:'#fff'}}>3 tabs</strong>: Code Helper, Git Commit Generator, Security Auditor. Each is a separate tool.</p>

                <SH id="codehelper-tab1" level={3}>Tab 1 — Code Helper (8 Tasks)</SH>
                <DocTable
                  headers={['Task','What AI Delivers']}
                  rows={[
                    ['<strong>Fix / Debug</strong>','ALL bugs found with exact line references + explanation + complete fixed code'],
                    ['<strong>Explain this code</strong>','Overview, key functions, logic flow, edge cases — 4 clear sections'],
                    ['<strong>Write from scratch</strong>','Clean, production-ready code with error handling, comments, and type hints'],
                    ['<strong>Convert to another language</strong>','Exact logic preserved, follows target language conventions and idioms'],
                    ['<strong>Optimize performance</strong>','Big-O analysis before/after + optimized version + specific improvements'],
                    ['<strong>Write unit tests</strong>','Happy path + edge cases + error cases — comprehensive coverage'],
                    ['<strong>Review code quality</strong>','Scores 1-10 on: Readability, Maintainability, Performance, Security, Best Practices'],
                    ['<strong>Refactor / Clean up</strong>','Applies DRY, SOLID principles + better naming + explains every single change'],
                  ]}
                />

                <SH id="codehelper-tab2" level={3}>Tab 2 — Git Commit Generator</SH>
                <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'12px' }}>Paste your code changes (or describe what you did). AI generates Conventional Commits in 3 styles:</p>
                <CodeBlock lang="git-commit" code={`# Concise:
feat: add email validation

# Standard (⭐ Recommended):
feat(auth): add email validation with regex pattern

# Detailed:
feat(auth): add email validation function with regex

- Validates format using RFC 5322 compliant pattern
- Returns boolean with specific error message
- Handles edge cases: TLDs, subdomains, quoted strings

BREAKING CHANGE: validateEmail() now returns object, not boolean`}/>

                <SH id="codehelper-tab3" level={3}>Tab 3 — Security Auditor</SH>
                <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'12px' }}>Paste any code. AI scans for vulnerabilities and returns:</p>
                <ul style={{ color:'#94a3b8', fontSize:'13px', lineHeight:2, paddingLeft:'20px', marginBottom:'16px' }}>
                  <li>Overall Security Score (0-100) with severity badge</li>
                  <li>Each vulnerability with: exact line number + severity (Critical/High/Medium/Low) + fix</li>
                  <li>Scans for: SQL injection, XSS, hardcoded secrets, missing auth checks, insecure dependencies</li>
                  <li>"Quick Wins" section — fixes you can apply in under 5 minutes</li>
                </ul>

                <TipBox type="try">
                  <strong>Paste this into Code Helper → Task: Fix / Debug → Language: JavaScript:</strong>
                  <CodeBlock lang="javascript" code={`function calculateTotal(items) {
  let total = 0
  for (let i = 0; i <= items.length; i++) {
    total += items[i].price
  }
  return total
}`}/>
                  AI will find: off-by-one error (i &lt;= vs i &lt;), missing null check on items[i], no input validation — and give you the complete fixed version with explanation.
                </TipBox>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* DATA WIZARD */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="datawizard" data-section style={{ marginBottom:'70px' }}>
            <div style={{ fontSize:'10px', fontWeight:800, color:'var(--accent)', letterSpacing:'4px', marginBottom:'10px' }}>TOOL 04</div>
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', overflow:'hidden' }}>
              <div style={{ background:'rgba(56,189,248,0.06)', padding:'22px 28px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display:'flex', gap:'16px', alignItems:'flex-start' }}>
                  <div style={{ fontSize:'28px' }}>🧙</div>
                  <div>
                    <h2 style={{ fontSize:'22px', fontWeight:800, color:'#fff', margin:'0 0 4px' }}>Data Wizard</h2>
                    <p style={{ color:'#64748b', fontSize:'13px', margin:0 }}>Generate production-grade SQL, Python, Excel, RegEx, MongoDB, DAX and more with audit trails.</p>
                    <div style={{ display:'flex', gap:'6px', marginTop:'10px', flexWrap:'wrap' }}>
                      {['10 Artifact Types','4 Optimization Modes','Multi-Variant Output','5-Step Pipeline','Security Audit','Efficiency Score'].map(t => (
                        <span key={t} style={{ fontSize:'10px', fontWeight:700, padding:'2px 9px', borderRadius:'20px', background:'rgba(56,189,248,0.1)', color:'#38bdf8', border:'1px solid rgba(56,189,248,0.2)' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ padding:'28px' }}>
                <SH id="datawizard-types" level={3}>10 Artifact Types — Each Has Different AI</SH>
                <p style={{ color:'#94a3b8', fontSize:'13px', lineHeight:1.8, marginBottom:'14px' }}>Every type uses a completely different AI system prompt. SQL AI knows about indexes; Python AI knows about vectorization; Regex AI analyzes backtracking:</p>
                <DocTable
                  headers={['Type','AI Expert Focus','Best Use Case']}
                  rows={[
                    ['<strong>SQL Query</strong>','JOINs, CTEs, index hints, query planner, BigQuery/Snowflake dialects','Database queries, reports, analytics'],
                    ['<strong>Excel / Sheets Formula</strong>','XLOOKUP, LET(), array formulas, volatility, spill behavior, named ranges','Spreadsheet automation, dashboards'],
                    ['<strong>Python (Pandas/NumPy)</strong>','Vectorization, dtype optimization, chunking for large files, ETL pipelines','Data cleaning, ML prep, automation'],
                    ['<strong>Regular Expression</strong>','Pattern analysis, ReDoS safety, named groups, all language engines','Validation, extraction, search/replace'],
                    ['<strong>Data Visualization</strong>','Chart type rationale, Plotly/Matplotlib/Seaborn, accessibility, WebGL','Charts, dashboards, reports'],
                    ['<strong>DAX / Power BI</strong>','Filter context vs row context, VertiPaq engine, VAR/RETURN pattern','Power BI measures, KPIs, time intelligence'],
                    ['<strong>R Script (dplyr/ggplot2)</strong>','Statistical assumptions, tidyverse pipes, ggplot2 themes','Statistical analysis, academic charts'],
                    ['<strong>Shell / AWK / Sed</strong>','POSIX compatibility, streaming for large files, pipeline chaining','Log processing, ETL, automation'],
                    ['<strong>JSON / GraphQL</strong>','N+1 prevention, fragments, DataLoader, persisted queries','API queries, schema transformations'],
                    ['<strong>MongoDB / NoSQL</strong>','ESR indexing rule, aggregation pipeline stage ordering, Atlas Search','MongoDB queries, aggregations'],
                  ]}
                />

                <SH id="datawizard-modes" level={3}>4 Optimization Modes</SH>
                <DocTable
                  headers={['Mode','What AI Does Differently']}
                  rows={[
                    ['⚡ Speed','Vectorize everything, avoid loops, use indexes first, minimal overhead — raw performance focus'],
                    ['⚖️ Balanced','Mix of performance and clean code, key comments on non-obvious parts, modern idioms'],
                    ['📖 Readable','Line breaks, descriptive variable names, comments on every block — for learning or teaching'],
                    ['🏢 Enterprise','Type hints, error handling with specific exceptions, logging, docstrings, production patterns'],
                  ]}
                />

                <SH id="datawizard-advanced" level={3}>Advanced Configuration</SH>
                <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'12px' }}>Click "Advanced Configuration" to reveal two power fields:</p>
                <ul style={{ color:'#94a3b8', fontSize:'13px', lineHeight:2.1, paddingLeft:'20px', marginBottom:'16px' }}>
                  <li><strong style={{color:'#fff'}}>Schema / Structure</strong> — Paste your table schema, column names, or data structure. AI generates code that matches your real columns — no guessing.</li>
                  <li><strong style={{color:'#fff'}}>Sample Data</strong> — Paste 2-3 sample rows. AI understands your exact data types, formats, and edge cases.</li>
                  <li><strong style={{color:'#fff'}}>Line-by-line explanation</strong> — Check this and every line of code gets a plain-English explanation underneath.</li>
                </ul>

                <SH id="datawizard-audit" level={3}>The Audit Panel</SH>
                <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'12px' }}>After every generation, an audit card appears with 4 real metrics:</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'16px' }}>
                  {[['Complexity','O(n log n)','#34d399'],['Security','Sanitized','#a78bfa'],['Scalability','10M+ rows','#38bdf8'],['Efficiency','96%','#fbbf24']].map(([l,v,c]) => (
                    <div key={l} style={{ background:`${c}0d`, border:`1px solid ${c}30`, borderRadius:'12px', padding:'14px', textAlign:'center' }}>
                      <div style={{ fontSize:'9px', fontWeight:900, color:'#475569', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:'5px' }}>{l}</div>
                      <div style={{ fontSize:'13px', fontWeight:700, color:c }}>{v}</div>
                    </div>
                  ))}
                </div>
                <p style={{ color:'#64748b', fontSize:'12px', lineHeight:1.7 }}>Plus: Warnings (specific things to fix), Optimization suggestions, Efficiency score bar.</p>

                <TipBox type="try">
                  <strong>Type:</strong> SQL Query | <strong>Mode:</strong> Enterprise | <strong>Open Advanced Config:</strong><br/>
                  <strong>Schema:</strong> orders(id INT, customer_id INT, amount DECIMAL, created_at TIMESTAMP, status VARCHAR)<br/>
                  <strong>Requirement:</strong> Monthly revenue for last 6 months with month-over-month growth %<br/>
                  You get: Primary SQL with CTEs + Variant 2 with window functions + full audit panel with warnings.
                </TipBox>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* THE SPIDER */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="spider" data-section style={{ marginBottom:'70px' }}>
            <div style={{ fontSize:'10px', fontWeight:800, color:'var(--accent)', letterSpacing:'4px', marginBottom:'10px' }}>TOOL 05</div>
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', overflow:'hidden' }}>
              <div style={{ background:'rgba(251,191,36,0.06)', padding:'22px 28px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display:'flex', gap:'16px', alignItems:'flex-start' }}>
                  <div style={{ fontSize:'28px' }}>🕷️</div>
                  <div>
                    <h2 style={{ fontSize:'22px', fontWeight:800, color:'#fff', margin:'0 0 4px' }}>The Spider</h2>
                    <p style={{ color:'#64748b', fontSize:'13px', margin:0 }}>Real-time web extraction + AI synthesis. Scrape any URL or topic — get structured intelligence reports.</p>
                    <div style={{ display:'flex', gap:'6px', marginTop:'10px', flexWrap:'wrap' }}>
                      {['Live Web Data (Jina AI)','6 Search Modes','Quick/Deep Depth','Follow-Up AI','Raw Feed View','Send to Chat'].map(t => (
                        <span key={t} style={{ fontSize:'10px', fontWeight:700, padding:'2px 9px', borderRadius:'20px', background:'rgba(251,191,36,0.1)', color:'#fbbf24', border:'1px solid rgba(251,191,36,0.2)' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ padding:'28px' }}>
                <TipBox type="info">Spider uses <strong style={{color:'#fff'}}>Jina AI</strong> to extract real, live content from the web. This is NOT AI hallucination — it's real web data that your AI model then synthesizes.</TipBox>

                <SH id="spider-modes" level={3}>6 Search Modes — Different Output Each Time</SH>
                <DocTable
                  headers={['Mode','Output Format','Best For']}
                  rows={[
                    ['🛡️ Intelligence Dossier','Deep report: headers, tables, stats, sources, executive summary (800+ words)','Company research, topic deep-dives'],
                    ['📄 Quick Summary','5 sections: TL;DR + Key Facts + Critical Numbers + Who\'s Involved + Bottom Line','Fast overview of anything'],
                    ['📊 Compare & Contrast','Structured comparison table + recommendation section','Product/tech comparisons'],
                    ['💻 Technical Extract','Code samples, API endpoints, docs, version numbers, config examples in code blocks','API docs, library documentation'],
                    ['🕐 Timeline Analysis','Chronological events/updates with dates on left, key milestones highlighted','Company history, event sequences'],
                    ['🕸️ Entity Map','Tables of: People (name+role), Organizations (name+relation), Technologies (name+purpose)','Investigating organizations, people'],
                  ]}
                />

                <SH id="spider-depth" level={3}>Quick vs Deep</SH>
                <DocTable
                  headers={['Setting','Extraction Passes','Speed','Best For']}
                  rows={[
                    ['⚡ Quick','1 pass (primary source only)','Fast','Simple lookups, single URLs, quick facts'],
                    ['🔬 Deep','2 passes (primary + secondary query)','Slower but richer','Research, complex topics, comprehensive reports'],
                  ]}
                />

                <SH id="spider-tabs" level={3}>3 Result Tabs</SH>
                <ul style={{ color:'#94a3b8', fontSize:'14px', lineHeight:2.1, paddingLeft:'20px', marginBottom:'16px' }}>
                  <li><strong style={{color:'#fff'}}>Report tab</strong> — Full AI-synthesized intelligence in your chosen mode</li>
                  <li><strong style={{color:'#fff'}}>Follow-up tab</strong> — 3 AI-suggested questions + type your own. AI answers using the SAME scraped data (no new web request = instant answers)</li>
                  <li><strong style={{color:'#fff'}}>Raw Feed tab</strong> — Actual raw text extracted from the web before AI processed it</li>
                </ul>

                <TipBox type="try">
                  <strong>Test 1 (URL):</strong> Paste <code>https://openai.com</code> → Mode: Intelligence Dossier → Deep → Deploy Spider<br/>
                  <strong>Test 2 (Topic):</strong> Type "React vs Vue 2025" → Mode: Compare & Contrast → Deploy Spider<br/>
                  <strong>Test 3 (Follow-up):</strong> After any result → Click Follow-up tab → Click a suggested question → instant answer from same data<br/>
                  <strong>Test 4 (Chain):</strong> Get Spider result → Click "Send to Chat" → ask questions in Chat With Data
                </TipBox>

                <TipBox type="warn">If "No data retrieved" error: try a more specific search term, or try with https:// prefix. Some sites block scraping.</TipBox>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* CHAT WITH DATA */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="chatdata" data-section style={{ marginBottom:'70px' }}>
            <div style={{ fontSize:'10px', fontWeight:800, color:'var(--accent)', letterSpacing:'4px', marginBottom:'10px' }}>TOOL 06</div>
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', overflow:'hidden' }}>
              <div style={{ background:'rgba(251,146,60,0.06)', padding:'22px 28px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display:'flex', gap:'16px', alignItems:'flex-start' }}>
                  <div style={{ fontSize:'28px' }}>💬</div>
                  <div>
                    <h2 style={{ fontSize:'22px', fontWeight:800, color:'#fff', margin:'0 0 4px' }}>Chat With Data</h2>
                    <p style={{ color:'#64748b', fontSize:'13px', margin:0 }}>Upload CSV, PDF, JSON, images — have a full conversation. Charts, stat cards, and knowledge graphs appear automatically.</p>
                    <div style={{ display:'flex', gap:'6px', marginTop:'10px', flexWrap:'wrap' }}>
                      {['CSV·PDF·JSON·Images','OCR (Tesseract)','Live Charts (Recharts)','Stat Cards','Knowledge Mesh','Session Save/Load','Export per Message'].map(t => (
                        <span key={t} style={{ fontSize:'10px', fontWeight:700, padding:'2px 9px', borderRadius:'20px', background:'rgba(251,146,60,0.1)', color:'#fb923c', border:'1px solid rgba(251,146,60,0.2)' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ padding:'28px' }}>
                <SH id="chatdata-files" level={3}>Supported File Types</SH>
                <DocTable
                  headers={['File Type','How Processed','Limit']}
                  rows={[
                    ['CSV, TXT, JSON, XML, MD, JS, SQL','Read as text — full content available for analysis','800,000 characters'],
                    ['PDF','Text extracted from all pages via PDF.js CDN (auto-loads)','Up to 50 pages'],
                    ['Images (PNG, JPG, JPEG)','OCR via Tesseract.js — text extracted automatically','Any size'],
                    ['Multiple files together','All files loaded together — AI cross-references them','No limit on file count'],
                  ]}
                />

                <SH id="chatdata-quickactions" level={3}>8 Quick Action Chips</SH>
                <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'12px' }}>When a file is loaded, 8 one-click action buttons appear above the chat input. Click any to run instantly — no typing needed:</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'7px', marginBottom:'20px' }}>
                  {[['Summarize','Full summary of all data'],['Key Stats','All numerical insights extracted'],['Find Anomalies','Outliers and unusual patterns'],['Trends','Patterns over time or categories'],['Compare','Compare segments or categories'],['SQL Queries','Write queries for your data'],['Visualize','Best chart type + generate it'],['Export Plan','Data export and reporting plan']].map(([name, desc]) => (
                    <div key={name} title={desc} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', color:'#94a3b8', padding:'6px 12px', borderRadius:'16px', fontSize:'11px', fontWeight:600, cursor:'default' }}>{name}</div>
                  ))}
                </div>

                <SH id="chatdata-viz" level={3}>Visualization Panel (Auto-Appears Right Side)</SH>
                <DocTable
                  headers={['Tab','What Appears','Triggered By']}
                  rows={[
                    ['📊 Charts','Area, Bar, Line, or Pie chart — AI picks best type','Any numerical data in response'],
                    ['Σ Stats','Key metric cards with values + change % indicators','Quantitative analysis responses'],
                    ['🕸️ Knowledge','SVG knowledge graph showing concept relationships','Topic/entity analysis responses'],
                    ['💻 Raw Data','Actual extracted file contents as text','Always available after file upload'],
                  ]}
                />

                <SH id="chatdata-sessions" level={3}>Session Save & Load</SH>
                <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'12px' }}>
                  Click <strong style={{color:'#fff'}}>Save</strong> (top right) to save entire conversation + charts. Up to 10 sessions stored in browser.
                  Click <strong style={{color:'#fff'}}>Sessions</strong> to reload any previous one — charts restore too.
                </p>

                <SH id="chatdata-export" level={3}>Export Per Message</SH>
                <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'16px' }}>Hover over any AI response → Export button appears → choose MD (Markdown), TXT (plain text), or CSV (extracts tables automatically).</p>

                <TipBox type="try">
                  <strong>Create a file called sales.csv:</strong>
                  <CodeBlock lang="csv" code={`Month,Revenue,Customers,Region
Jan,45000,120,North
Feb,52000,145,North
Mar,38000,98,South
Apr,61000,180,North
May,55000,155,South
Jun,70000,210,North`}/>
                  1. Upload it → Click "Key Stats" chip → Stats panel appears on right<br/>
                  2. Ask: "Which month had the biggest drop and why?"<br/>
                  3. Click "Visualize" chip → Area chart appears automatically<br/>
                  4. Hover your response → Export → CSV to download the analysis table
                </TipBox>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* THE INVENTOR */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="inventor" data-section style={{ marginBottom:'70px' }}>
            <div style={{ fontSize:'10px', fontWeight:800, color:'var(--accent)', letterSpacing:'4px', marginBottom:'10px' }}>TOOL 07</div>
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', overflow:'hidden' }}>
              <div style={{ background:'rgba(232,121,249,0.06)', padding:'22px 28px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display:'flex', gap:'16px', alignItems:'flex-start' }}>
                  <div style={{ fontSize:'28px' }}>💡</div>
                  <div>
                    <h2 style={{ fontSize:'22px', fontWeight:800, color:'#fff', margin:'0 0 4px' }}>The Inventor</h2>
                    <p style={{ color:'#64748b', fontSize:'13px', margin:0 }}>A 5-agent AI boardroom debates your idea. Unique — no competitor offers this multi-agent workflow.</p>
                    <div style={{ display:'flex', gap:'6px', marginTop:'10px', flexWrap:'wrap' }}>
                      {['5 Sequential AI Agents','Each Sees Previous Responses','Master Blueprint','30-60-90 Day Plan','Critic Agent (Devil\'s Advocate)','Save to Vault'].map(t => (
                        <span key={t} style={{ fontSize:'10px', fontWeight:700, padding:'2px 9px', borderRadius:'20px', background:'rgba(232,121,249,0.1)', color:'#e879f9', border:'1px solid rgba(232,121,249,0.2)' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ padding:'28px' }}>
                <SH id="inventor-agents" level={3}>5 Agents — What Each One Does</SH>
                <DocTable
                  headers={['Agent','Role','What They Deliver']}
                  rows={[
                    ['💡 The Visionary','CEO / Strategy','Big picture, market opportunity, inspiring pitch, why this matters now'],
                    ['⚡ The Hacker','CTO / Growth Hacker','Technical shortcuts, viral loops, unfair advantages, 2-3 real technical flaws'],
                    ['📊 The Analyst','CFO / Data','TAM, CAC, LTV, MRR targets, market size, 3-year revenue projections'],
                    ['⚠️ The Critic','Risk / Devil\'s Advocate','Exactly 5 reasons this will fail + one-line fix for each reason'],
                    ['👑 Master Blueprint','Final Synthesis','Mission + growth hacks + metrics dashboard + risk mitigation + 30-60-90 day plan'],
                  ]}
                />
                <TipBox type="info">Each agent sees all previous agents' responses before giving their input. The Critic can challenge the Visionary. The Blueprint synthesizes everything into an actionable plan.</TipBox>
                <TipBox type="try">
                  Type: "AI-powered resume builder SaaS for Indian job seekers targeting Tier 2 cities"<br/>
                  → Click Start Board Session → watch all 5 agents run sequentially<br/>
                  → Read the Master Blueprint — it includes concrete 30-60-90 day milestones
                </TipBox>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* CREATOR STUDIO */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="creator" data-section style={{ marginBottom:'70px' }}>
            <div style={{ fontSize:'10px', fontWeight:800, color:'var(--accent)', letterSpacing:'4px', marginBottom:'10px' }}>TOOL 08</div>
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', overflow:'hidden' }}>
              <div style={{ background:'rgba(248,113,113,0.06)', padding:'22px 28px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display:'flex', gap:'16px', alignItems:'flex-start' }}>
                  <div style={{ fontSize:'28px' }}>🎬</div>
                  <div>
                    <h2 style={{ fontSize:'22px', fontWeight:800, color:'#fff', margin:'0 0 4px' }}>Creator Studio</h2>
                    <p style={{ color:'#64748b', fontSize:'13px', margin:0 }}>Platform-specific content for 8 social platforms with viral hooks, 7-day calendars, and competitor analysis.</p>
                    <div style={{ display:'flex', gap:'6px', marginTop:'10px', flexWrap:'wrap' }}>
                      {['8 Platforms','4 Tools Per Platform','Viral Hooks (5 styles)','7-Day Calendar','Beat Competitor','Best Posting Times'].map(t => (
                        <span key={t} style={{ fontSize:'10px', fontWeight:700, padding:'2px 9px', borderRadius:'20px', background:'rgba(248,113,113,0.1)', color:'#f87171', border:'1px solid rgba(248,113,113,0.2)' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ padding:'28px' }}>
                <SH id="creator-tools" level={3}>4 Tools Per Platform</SH>
                <DocTable
                  headers={['Tool / Tab','What It Does']}
                  rows={[
                    ['<strong>Content Generator</strong>','Creates platform-specific content. Options change per platform — WhatsApp gets broadcast format, TikTok gets reel script with hook'],
                    ['<strong>Viral Hooks</strong>','5 hooks in 5 styles: Question, Shocking Stat, Story, Controversy, Challenge. Each has Copy + Use buttons'],
                    ['<strong>7-Day Calendar</strong>','Full week schedule: posting time, content type, caption, hashtags, pro tip — all in structured table'],
                    ['<strong>Beat Competitor</strong>','Paste competitor URL → Spider extracts their content → AI finds the angle they\'re NOT covering = your opportunity'],
                  ]}
                />

                <SH id="creator-platforms" level={3}>8 Platforms — Different AI For Each</SH>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'16px' }}>
                  {[['📸 Instagram','Captions, reels, carousels, stories'],['▶️ YouTube','Scripts, thumbnails text, descriptions'],['🎵 TikTok','Viral hooks, scripts, trending sounds advice'],['🐦 Twitter/X','Threads, tweets, engagement replies'],['💼 LinkedIn','Thought leadership, company posts'],['👥 Facebook','Community posts, ads, events'],['💬 WhatsApp','Broadcast messages, status updates'],['📌 Pinterest','Pin descriptions, board strategies']].map(([p,d]) => (
                    <div key={p} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px', padding:'12px 16px', minWidth:'180px' }}>
                      <div style={{ fontWeight:700, color:'#fff', fontSize:'13px', marginBottom:'4px' }}>{p}</div>
                      <div style={{ fontSize:'11px', color:'#64748b' }}>{d}</div>
                    </div>
                  ))}
                </div>

                <TipBox type="try">
                  Platform: Instagram | Topic: Fitness coaching for busy moms | Tool: Viral Hooks<br/>
                  → Get 5 hooks with individual Copy buttons<br/>
                  Then: Tool: 7-Day Calendar → full week schedule with best posting times<br/>
                  Then: Tool: Beat Competitor → paste a competitor's Instagram URL → find their gap
                </TipBox>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SEO OPTIMIZER */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="seo" data-section style={{ marginBottom:'70px' }}>
            <div style={{ fontSize:'10px', fontWeight:800, color:'var(--accent)', letterSpacing:'4px', marginBottom:'10px' }}>TOOL 09</div>
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', overflow:'hidden' }}>
              <div style={{ background:'rgba(74,222,128,0.06)', padding:'22px 28px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display:'flex', gap:'16px', alignItems:'flex-start' }}>
                  <div style={{ fontSize:'28px' }}>🔍</div>
                  <div>
                    <h2 style={{ fontSize:'22px', fontWeight:800, color:'#fff', margin:'0 0 4px' }}>SEO Optimizer</h2>
                    <p style={{ color:'#64748b', fontSize:'13px', margin:0 }}>7-in-1 SEO toolkit: keyword research, SERP preview, content scoring, topic clusters, gap analysis, meta generation, schema.</p>
                  </div>
                </div>
              </div>
              <div style={{ padding:'28px' }}>
                <DocTable
                  headers={['Tool','Input','Output']}
                  rows={[
                    ['🔍 Keyword Lab','Topic or seed keyword','10+ keywords with intent, difficulty (Low/Med/High), opportunity score, long-tail variations'],
                    ['🌐 SERP Simulator','Title, URL, meta description','Google preview + CTR score + improvement suggestions'],
                    ['📊 Content Scorer','Paste existing article','Score 1-100 + specific fixes for SEO gaps'],
                    ['🗂️ Topic Clusters','Main topic/niche','Pillar page + cluster pages architecture + internal linking strategy'],
                    ['🎯 Content Gap AI','Topic + competitor URLs','Keywords they rank for that you don\'t, sorted by opportunity'],
                    ['📝 Meta Forge','Page topic + keywords','5 title variations + 3 meta descriptions, each scored'],
                    ['🏗️ Schema Generator','Content type + details','Ready-to-paste JSON-LD structured data (Article, Product, FAQ, etc.)'],
                  ]}
                />
                <TipBox type="try">
                  Full workflow: Keyword Lab "AI tools for students" → Topic Clusters (same topic) → Meta Forge → Schema Generator<br/>
                  You now have: keyword strategy + content architecture + optimized titles + JSON-LD to paste into your webpage
                </TipBox>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* MODEL COMPARE */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="compare" data-section style={{ marginBottom:'70px' }}>
            <div style={{ fontSize:'10px', fontWeight:800, color:'var(--accent)', letterSpacing:'4px', marginBottom:'10px' }}>TOOL 10</div>
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', overflow:'hidden' }}>
              <div style={{ background:'rgba(96,165,250,0.06)', padding:'22px 28px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display:'flex', gap:'16px', alignItems:'flex-start' }}>
                  <div style={{ fontSize:'28px' }}>⚖️</div>
                  <div>
                    <h2 style={{ fontSize:'22px', fontWeight:800, color:'#fff', margin:'0 0 4px' }}>Model Compare</h2>
                    <p style={{ color:'#64748b', fontSize:'13px', margin:0 }}>Run the same prompt on 2 models simultaneously. Get timing, token count, cost estimate, and AI judge verdict.</p>
                    <div style={{ display:'flex', gap:'6px', marginTop:'10px', flexWrap:'wrap' }}>
                      {['Side-by-Side','Response Time (ms)','~Token Count','~Cost Estimate','AI Judge Verdict','Winner Badge','All Providers'].map(t => (
                        <span key={t} style={{ fontSize:'10px', fontWeight:700, padding:'2px 9px', borderRadius:'20px', background:'rgba(96,165,250,0.1)', color:'#60a5fa', border:'1px solid rgba(96,165,250,0.2)' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ padding:'28px' }}>
                <Step num={1} title="Select Model A and Model B">Choose from all connected providers. You can compare: free vs paid, fast vs smart, different companies. All available models appear in the dropdowns.</Step>
                <Step num={2} title="Use a quick prompt or type your own">5 preset prompts at the top for quick testing. Or type anything in the large text area. Ctrl+Enter to submit.</Step>
                <Step num={3} title="Both models run in parallel">Responses load simultaneously side-by-side. See which was faster via response time badge.</Step>
                <Step num={4} title="Read the AI Judge Verdict">A third AI reads both responses and gives: which won + reasoning + strengths of each + recommendation for which model to use for this task type.</Step>

                <TipBox type="try">
                  <strong>Model A:</strong> Llama 3.3 70B (free via Groq) | <strong>Model B:</strong> GPT-4o or Claude Sonnet<br/>
                  <strong>Prompt:</strong> "Explain quantum entanglement to a 10-year-old in 3 sentences"<br/>
                  Compare which model explains it better. Use the winner as your default model for similar tasks.
                </TipBox>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* IMAGE PROMPT */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="imgprompt" data-section style={{ marginBottom:'70px' }}>
            <div style={{ fontSize:'10px', fontWeight:800, color:'var(--accent)', letterSpacing:'4px', marginBottom:'10px' }}>TOOL 11</div>
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', overflow:'hidden' }}>
              <div style={{ background:'rgba(167,139,250,0.06)', padding:'22px 28px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display:'flex', gap:'16px', alignItems:'flex-start' }}>
                  <div style={{ fontSize:'28px' }}>🖼️</div>
                  <div>
                    <h2 style={{ fontSize:'22px', fontWeight:800, color:'#fff', margin:'0 0 4px' }}>Image Prompt</h2>
                    <p style={{ color:'#64748b', fontSize:'13px', margin:0 }}>Engineer expert image prompts for Midjourney, DALL-E 3, Stable Diffusion, Flux & more. Generate images directly when API available.</p>
                    <div style={{ display:'flex', gap:'6px', marginTop:'10px', flexWrap:'wrap' }}>
                      {['7 Tools Supported','12 Art Styles','9 Mood/Lighting Options','6 Aspect Ratios','Variation Generator','Direct Image Generation','Download Image'].map(t => (
                        <span key={t} style={{ fontSize:'10px', fontWeight:700, padding:'2px 9px', borderRadius:'20px', background:'rgba(167,139,250,0.1)', color:'#a78bfa', border:'1px solid rgba(167,139,250,0.2)' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ padding:'28px' }}>
                <SH id="imgprompt-tools" level={3}>7 Supported Image Tools</SH>
                <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'12px' }}>Each tool gets its own syntax tip and a different AI prompt strategy — Midjourney uses parameter syntax, DALL-E uses natural language, Stable Diffusion uses weighted tokens:</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'7px', marginBottom:'20px' }}>
                  {['Midjourney','DALL-E 3','Stable Diffusion','Adobe Firefly','Ideogram','Leonardo AI','Flux'].map(t => (
                    <code key={t} style={{ background:'rgba(167,139,250,0.08)', color:'#a78bfa', padding:'4px 10px', borderRadius:'7px', fontSize:'12px', border:'1px solid rgba(167,139,250,0.15)' }}>{t}</code>
                  ))}
                </div>
                <SH id="imgprompt-output" level={3}>What The Prompt Includes</SH>
                <ul style={{ color:'#94a3b8', fontSize:'14px', lineHeight:2.1, paddingLeft:'20px', marginBottom:'16px' }}>
                  <li><strong style={{color:'#fff'}}>Main Prompt</strong> in a code block — copy directly into your tool</li>
                  <li><strong style={{color:'#fff'}}>Negative Prompt</strong> — what to exclude</li>
                  <li><strong style={{color:'#fff'}}>Recommended Settings</strong> — specific parameters for your tool</li>
                  <li><strong style={{color:'#fff'}}>Why This Works</strong> — key design decisions explained</li>
                  <li><strong style={{color:'#fff'}}>Variation button</strong> — same subject, different angle/lighting/palette</li>
                </ul>
                <SH id="imgprompt-generate" level={3}>Direct Image Generation</SH>
                <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'12px' }}>
                  Click <strong style={{color:'#fff'}}>"Visualize Now"</strong> button after generating a prompt. Uses DALL-E 3 (if OpenAI key present) or Pollinations.ai (free, no key needed). Images can be downloaded.
                </p>
                <TipBox type="try">
                  Tool: Midjourney | Style: Cinematic / Film | Mood: Dramatic / moody | Ratio: Landscape 16:9<br/>
                  Describe: "A lone samurai standing on a cliff at sunset, cherry blossoms falling"<br/>
                  → Get complete MJ prompt with --ar 16:9 --v 6.1 parameters<br/>
                  → Click Visualize Now → image generates instantly
                </TipBox>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* VIDEO PROMPT */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="vidprompt" data-section style={{ marginBottom:'70px' }}>
            <div style={{ fontSize:'10px', fontWeight:800, color:'var(--accent)', letterSpacing:'4px', marginBottom:'10px' }}>TOOL 12</div>
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', overflow:'hidden' }}>
              <div style={{ background:'rgba(251,146,60,0.06)', padding:'22px 28px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display:'flex', gap:'16px', alignItems:'flex-start' }}>
                  <div style={{ fontSize:'28px' }}>🎬</div>
                  <div>
                    <h2 style={{ fontSize:'22px', fontWeight:800, color:'#fff', margin:'0 0 4px' }}>Video Prompt</h2>
                    <p style={{ color:'#64748b', fontSize:'13px', margin:0 }}>Engineer cinematic video prompts for Sora, Runway, Kling, Pika, Luma & more with scene breakdowns and camera direction.</p>
                    <div style={{ display:'flex', gap:'6px', marginTop:'10px', flexWrap:'wrap' }}>
                      {['8 Video Tools','8 Camera Movements','8 Visual Styles','Scene Breakdown','Variation Generator','Shot-by-Shot Timeline'].map(t => (
                        <span key={t} style={{ fontSize:'10px', fontWeight:700, padding:'2px 9px', borderRadius:'20px', background:'rgba(251,146,60,0.1)', color:'#fb923c', border:'1px solid rgba(251,146,60,0.2)' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ padding:'28px' }}>
                <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'16px' }}>
                  Unlike image prompts, video prompts must describe <strong style={{color:'#fff'}}>motion</strong>, not just appearance. AI Video Prompt specializes in camera movement language, pacing, and shot-by-shot breakdowns.
                </p>
                <SH id="vidprompt-output" level={3}>What You Get</SH>
                <ul style={{ color:'#94a3b8', fontSize:'14px', lineHeight:2.1, paddingLeft:'20px', marginBottom:'16px' }}>
                  <li><strong style={{color:'#fff'}}>Main Video Prompt</strong> in code block — ready to paste</li>
                  <li><strong style={{color:'#fff'}}>Scene Breakdown</strong> — shot by shot with timestamps (0-5s: ..., 5-10s: ...)</li>
                  <li><strong style={{color:'#fff'}}>Camera & Motion Notes</strong> — specific technical direction</li>
                  <li><strong style={{color:'#fff'}}>Negative Prompt</strong> — what to avoid</li>
                  <li><strong style={{color:'#fff'}}>Tool-specific Settings</strong> — recommended parameters for your chosen tool</li>
                </ul>
                <TipBox type="try">
                  Tool: Runway Gen-3 | Type: Short-form | Camera: Slow dolly in | Style: Cinematic / Film grain<br/>
                  Describe: "A chef carefully plating a michelin-star dish, steam rising, golden kitchen light"<br/>
                  → Get complete prompt with scene breakdown + camera direction + negative prompt
                </TipBox>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* PROMPT LIBRARY */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="library" data-section style={{ marginBottom:'70px' }}>
            <div style={{ fontSize:'10px', fontWeight:800, color:'var(--accent)', letterSpacing:'4px', marginBottom:'10px' }}>TOOL 13</div>
            <SH id="library-h" level={2}>Prompt Library</SH>
            <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'16px' }}>60+ expert-crafted prompts organized by category. Filter, search, favorite, and copy with one click.</p>
            <DocTable
              headers={['Category','Count','Examples']}
              rows={[
                ['Writing','10','Blog intro hook, Email subjects, YouTube script, Twitter thread'],
                ['Marketing','10','Google Ads copy, Facebook brief, Retargeting sequence, Landing page CTA'],
                ['Coding','10','React component, API endpoint, SQL optimizer, CI/CD pipeline'],
                ['Business','10','Pitch deck script, SWOT analysis, SOP document, Investor update'],
                ['Education','10','Lesson plan, Quiz questions, Flashcard deck, Certification prep'],
                ['Creative','10+','Short story, Character profile, Worldbuilding, D&D campaign'],
                ['Community','Varies','Top-rated prompts shared by users'],
              ]}
            />
            <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8 }}>
              Use the category pills to filter. Use the search box to find specific prompts. Star ⭐ to add favorites. "Copy & Use" copies the prompt to clipboard.
            </p>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* VAULT */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="vault" data-section style={{ marginBottom:'70px' }}>
            <div style={{ fontSize:'10px', fontWeight:800, color:'var(--accent)', letterSpacing:'4px', marginBottom:'10px' }}>FEATURE</div>
            <SH id="vault-h" level={2}>History Vault</SH>
            <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'16px' }}>Every output from every tool is automatically saved. Nothing gets lost.</p>
            <DocTable
              headers={['Feature','How It Works']}
              rows={[
                ['Auto-save','Every generation saves automatically — no action needed'],
                ['Search','Search across all saved items by keyword'],
                ['Filter by tool','View only DataWizard outputs, or only AI Writer outputs'],
                ['Copy & Export','Copy any saved result instantly to clipboard'],
                ['Storage','Browser localStorage only — private, never sent anywhere'],
                ['Capacity','Stores last 500 entries per tool'],
              ]}
            />
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* PRO TIPS */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="tips" data-section style={{ marginBottom:'70px' }}>
            <div style={{ fontSize:'10px', fontWeight:800, color:'var(--accent)', letterSpacing:'4px', marginBottom:'10px' }}>ADVANCED</div>
            <SH id="tips-h" level={2}>Pro Tips & Power Combos</SH>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'24px' }}>
              {[
                ['🕷️→💬','Spider → Chat With Data','Research any topic with Spider, click "Send to Chat", ask deep questions about the live report'],
                ['🧙→💬','DataWizard → Chat','Generate SQL in DataWizard, run in your DB, export CSV, upload to Chat for analysis'],
                ['🎯→✍️','Optimizer → Writer','Optimize your content brief first in Prompt Optimizer, use that forged prompt in AI Writer'],
                ['⚖️→🔑','Compare → Choose Model','Use Model Compare to find best model for your task type, then set it as default'],
                ['🏢 Enterprise Mode','For Production Code','Always use Enterprise mode in DataWizard for code going to production — adds error handling automatically'],
                ['💾 Save Sessions','Never Lose Work','In Chat With Data, save sessions after important analyses. Charts and stats restore on reload'],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'18px' }}>
                  <div style={{ fontSize:'18px', marginBottom:'8px' }}>{icon}</div>
                  <div style={{ fontSize:'14px', fontWeight:700, color:'#fff', marginBottom:'6px' }}>{title}</div>
                  <div style={{ fontSize:'12px', color:'#64748b', lineHeight:1.65 }}>{desc}</div>
                </div>
              ))}
            </div>
            <TipBox type="tip">
              <strong>Best free setup:</strong> OpenRouter.ai (free account) → add key to Settings → select "meta-llama/llama-3.3-70b-instruct:free" as model → all 15 tools work at zero cost.
            </TipBox>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TROUBLESHOOTING */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section id="errors" data-section style={{ marginBottom:'70px' }}>
            <div style={{ fontSize:'10px', fontWeight:800, color:'var(--accent)', letterSpacing:'4px', marginBottom:'10px' }}>HELP</div>
            <SH id="errors-h" level={2}>Troubleshooting</SH>
            <DocTable
              headers={['Error / Problem','Cause','Fix']}
              rows={[
                ['<strong>API Key for [model] is missing</strong>','No key added for that provider','Go to Settings → API Keys → add key for the provider you selected'],
                ['<strong>401 Unauthorized</strong>','Wrong or expired API key','Check key is correct, not expired, has credits remaining'],
                ['<strong>429 Rate Limited</strong>','Too many requests too fast','Wait 30-60 seconds, or switch to a different model'],
                ['<strong>Connection Blocked / Failed to fetch</strong>','Ad-blocker, VPN, or firewall blocking the request','Disable ad-blocker for this site, or disable VPN temporarily'],
                ['<strong>Spider: No data retrieved</strong>','Site blocks scraping OR too vague a query','Use a specific URL with https://, or use a more specific search term'],
                ['<strong>PDF not extracting</strong>','PDF.js CDN loading slowly','Wait 3-5 seconds after page load, then re-upload the PDF'],
                ['<strong>Image generation fails</strong>','No OpenAI key for DALL-E 3','Pollinations.ai (free, no key) is used as fallback automatically'],
                ['<strong>Charts not appearing in Chat</strong>','AI didn\'t generate numerical data','Ask explicitly: "give me statistics" or click "Key Stats" quick action chip'],
                ['<strong>Output has ** symbols</strong>','AI sent markdown but not rendering','This is a display bug in that component — copy to another tool or refresh'],
                ['<strong>Very slow response</strong>','Model overloaded or large input','Switch to Groq/Llama 3.3 for speed, or reduce input size'],
              ]}
            />
            <TipBox type="info">
              If any tool is completely broken, try: 1) Refresh the page 2) Clear browser cache 3) Try a different model 4) Check your API key still has credits
            </TipBox>
          </section>

          {/* Footer */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:'32px', textAlign:'center', color:'#334155', fontSize:'12px' }}>
            PromptForge Docs v3.0 · Built with ❤️ · All outputs are generated by your connected AI model in real-time
          </div>

        </div>
      </main>
    </div>
  );
};

export default Docs;