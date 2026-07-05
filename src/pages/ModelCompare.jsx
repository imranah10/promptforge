import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import {
  Zap, Loader2, GitCompare, Copy, Check, Trophy,
  Clock, Hash, DollarSign, RefreshCw, Sparkles, AlertTriangle,
  ChevronDown, ChevronUp, Plus, X, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_MODELS, PROVIDER_META as CENTRAL_META } from '../utils/models';
import { fetchProviderModels } from '../utils/modelFetcher';

// ── COST MAP per 1K tokens (approximate, updated regularly) ──────────────────
const COST_MAP = {
  'gpt-4o':              0.005,
  'gpt-4o-mini':         0.00015,
  'gpt-4-turbo':         0.010,
  'gpt-4':               0.030,
  'gpt-3.5':             0.0005,
  'o1-mini':             0.001,
  'o1-preview':          0.015,
  'o1':                  0.015,
  'o3-mini':             0.0011,
  'o3':                  0.010,
  'claude-3-5-sonnet':   0.003,
  'claude-3-5-haiku':    0.0008,
  'claude-3-opus':       0.015,
  'claude-3-haiku':      0.00025,
  'claude-3-sonnet':     0.003,
  'claude-sonnet-4':     0.003,
  'claude-opus-4':       0.015,
  'gemini-2.0-flash':    0.0001,
  'gemini-2.5-pro':      0.00125,
  'gemini-1.5-pro':      0.00125,
  'gemini-1.5-flash':    0.000075,
  'llama':               0,
  'mixtral':             0.0006,
  'mistral-large':       0.003,
  'mistral-small':       0.001,
  'deepseek-v3':         0.00014,
  'deepseek-r1':         0.00055,
  'grok-2':              0.002,
  'grok-3':              0.003,
  ':free':               0,
  'free':                0,
};

const getCost = (modelId, tokens) => {
  if (!modelId) return '0.00000';
  const id = modelId.toLowerCase();
  const key = Object.keys(COST_MAP).find(k => id.includes(k));
  const rate = key !== undefined ? COST_MAP[key] : 0;
  return ((tokens / 1000) * rate).toFixed(5);
};

const estimateTokens = (text) => Math.ceil((text || '').length / 4);

// ── ANTHROPIC STATIC MODELS (no public list API) ─────────────────────────────
// Pulled from central ALL_MODELS so updates in one place apply everywhere.
const ANTHROPIC_STATIC = ALL_MODELS
  .filter(m => m.provider === 'anthropic')
  .map(m => ({ id: m.id, name: m.name }));

// ── LIVE MODEL FETCHER (uses shared chat-only filter from modelFetcher.js) ───
async function fetchModelsForProvider(providerId, key) {
  if (providerId === 'anthropic') {
    // Anthropic has no public list endpoint — use static
    return ANTHROPIC_STATIC;
  }
  return fetchProviderModels(providerId, key);
}

// ── PROVIDER CONFIG — uses centralized PROVIDER_META from models.js ──────────
// Builds display label "🟠 Groq" using emoji + name from the central source of truth.
const PROVIDER_META = Object.fromEntries(
  Object.entries(CENTRAL_META).map(([id, m]) => [id, {
    name:  `${m.emoji} ${m.name}`,
    emoji: m.emoji,
    short: m.name,
    color: m.color,
  }])
);

// ── QUICK PROMPTS ─────────────────────────────────────────────────────────────
const QUICK = [
  'Explain quantum computing in 3 simple sentences',
  'Write a haiku about artificial intelligence',
  'What is the best programming language in 2025 and why?',
  'Give me 5 creative startup ideas in the health tech space',
  'Explain machine learning vs deep learning — key differences',
  'Write a short motivational paragraph for someone starting a new business',
];

// ── WINNER BADGE ──────────────────────────────────────────────────────────────
const WinnerBadge = ({ winner }) => {
  if (!winner) return null;
  const cfg = {
    A:   { bg: 'rgba(124,92,252,0.15)', border: 'var(--accent)',  color: 'var(--accent)',  label: 'MODEL A WINS' },
    B:   { bg: 'rgba(52,211,153,0.15)', border: '#34d399',        color: '#34d399',        label: 'MODEL B WINS' },
    TIE: { bg: 'rgba(251,191,36,0.15)', border: '#fbbf24',        color: '#fbbf24',        label: 'TIE'          },
  };
  const c = cfg[winner] || cfg.TIE;
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:c.bg, border:`1px solid ${c.border}`, color:c.color, padding:'4px 14px', borderRadius:'20px', fontSize:'12px', fontWeight:800 }}>
      <Trophy size={12}/> {c.label}
    </div>
  );
};

// ── METRIC CHIP ───────────────────────────────────────────────────────────────
const MetricChip = ({ icon, label, value, color }) => (
  <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', background:'var(--bg3)', border:'1px solid var(--border)', padding:'4px 10px', borderRadius:'20px' }}>
    {icon}
    <span style={{ color:'var(--text3)' }}>{label}:</span>
    <strong style={{ color: color || 'var(--text)' }}>{value}</strong>
  </div>
);

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ModelCompare() {
  const { apiKey, providerKeys, customModels, showToast, activeModel } = useContext(AppContext);

  // Live fetched models grouped by provider
  const [liveModels,    setLiveModels]    = useState({});   // { openai: [...], groq: [...], ... }
  const [fetchStatus,   setFetchStatus]   = useState({});   // { openai: 'loading'|'done'|'error', ... }
  const [fetchedOnce,   setFetchedOnce]   = useState(false);

  // Compare state
  const [prompt,   setPrompt]   = useState('');
  const [modelA,   setModelA]   = useState('');
  const [modelB,   setModelB]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [resultA,  setResultA]  = useState('');
  const [resultB,  setResultB]  = useState('');
  const [verdict,  setVerdict]  = useState('');
  const [winner,   setWinner]   = useState(null);
  const [timeA,    setTimeA]    = useState(null);
  const [timeB,    setTimeB]    = useState(null);
  const [copiedA,  setCopiedA]  = useState(false);
  const [copiedB,  setCopiedB]  = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const cancelRef = useRef(false);

  // ── FETCH LIVE MODELS from all providers with saved keys ──────────────────
  const fetchAllModels = useCallback(async () => {
    const keys = providerKeys || {};
    const providers = Object.keys(keys).filter(k => keys[k]);
    if (!providers.length && !apiKey) return;

    setFetchedOnce(true);

    // Add global key as openai if no specific openai key
    const effectiveKeys = { ...keys };
    if (apiKey && !effectiveKeys.openai) effectiveKeys.openai = apiKey;

    const allProviders = Object.keys(effectiveKeys).filter(p => effectiveKeys[p]);

    for (const providerId of allProviders) {
      setFetchStatus(prev => ({ ...prev, [providerId]: 'loading' }));
      const models = await fetchModelsForProvider(providerId, effectiveKeys[providerId]);
      setFetchStatus(prev => ({ ...prev, [providerId]: models.length ? 'done' : 'error' }));
      if (models.length) {
        setLiveModels(prev => ({ ...prev, [providerId]: models }));
      }
    }
  }, [providerKeys, apiKey]);

  useEffect(() => {
    fetchAllModels();
  }, [fetchAllModels]);

  // ── BUILD DROPDOWN OPTIONS ────────────────────────────────────────────────
  // Groups: Live fetched → Custom → Fallback static (if nothing fetched)
  const allGroups = React.useMemo(() => {
    const groups = [];

    // Live fetched providers
    Object.entries(liveModels).forEach(([providerId, models]) => {
      if (!models.length) return;
      const meta = PROVIDER_META[providerId] || { name: providerId, color: '#94a3b8' };
      groups.push({
        key:    providerId,
        label:  meta.name + ` (${models.length} models • live)`,
        color:  meta.color,
        live:   true,
        models,
      });
    });

    // Custom models
    if (customModels?.length) {
      groups.push({
        key:    'custom',
        label:  '🛠️ Custom Models',
        color:  '#94a3b8',
        live:   false,
        models: customModels.map(m => ({ id: m.id, name: m.name || m.id })),
      });
    }

    // If nothing fetched yet — show static fallback from ALL_MODELS (centralized,
    // always reflects current verified IDs — no decommissioned models leak in).
    if (!groups.length) {
      // Group all static models by provider
      const staticByProvider = {};
      ALL_MODELS.forEach(m => {
        if (!staticByProvider[m.provider]) staticByProvider[m.provider] = [];
        staticByProvider[m.provider].push({ id: m.id, name: m.name, free: m.tier === 'free' });
      });
      Object.entries(staticByProvider).forEach(([pid, models]) => {
        if (!models.length) return;
        const meta = PROVIDER_META[pid] || { name: pid, color: '#94a3b8' };
        groups.push({
          key:    pid,
          label:  meta.name + ` (${models.length} • add key to fetch latest)`,
          color:  meta.color,
          live:   false,
          models,
        });
      });
    }

    return groups;
  }, [liveModels, customModels]);

  // Set defaults once models load
  useEffect(() => {
    const all = allGroups.flatMap(g => g.models);
    if (all.length >= 2 && !modelA && !modelB) {
      setModelA(all[0]?.id || '');
      setModelB(all[1]?.id || '');
    }
  }, [allGroups]);

  // ── GET DISPLAY NAME (with provider emoji prefix for clarity) ─────────────
  const getDisplayName = (id) => {
    if (!id) return 'Select model';
    for (const g of allGroups) {
      const m = g.models.find(m => m.id === id);
      if (m) {
        const meta = PROVIDER_META[g.key] || { emoji: '•', short: g.key };
        return `${meta.emoji} ${meta.short || g.key} · ${m.name || m.id}`;
      }
    }
    return id.split('/').pop() || id;
  };

  // Plain name (used in the result cards where group context is already shown)
  const getPlainName = (id) => {
    if (!id) return 'Not selected';
    for (const g of allGroups) {
      const m = g.models.find(m => m.id === id);
      if (m) return m.name || m.id;
    }
    return id.split('/').pop() || id;
  };

  // Get the provider for a model id (for badge in result cards)
  const getProviderForModel = (id) => {
    if (!id) return null;
    for (const g of allGroups) {
      if (g.models.find(m => m.id === id)) return g.key;
    }
    return null;
  };

  // ── MODEL SELECTOR DROPDOWN ───────────────────────────────────────────────
  const ModelSelector = ({ value, onChange, label, accentColor }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef(null);

    useEffect(() => {
      const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filteredGroups = allGroups.map(g => ({
      ...g,
      models: search
        ? g.models.filter(m => (m.name || m.id).toLowerCase().includes(search.toLowerCase()))
        : g.models,
    })).filter(g => g.models.length);

    return (
      <div ref={ref} style={{ position:'relative', flex:1 }}>
        <div style={{ fontSize:'10px', fontWeight:900, color: accentColor, letterSpacing:'2px', marginBottom:'7px' }}>{label}</div>
        <button onClick={() => setOpen(!open)} style={{ width:'100%', background:'var(--bg3)', border:`1px solid ${open ? accentColor : 'var(--border)'}`, borderRadius:'12px', padding:'11px 14px', color:'var(--text)', fontSize:'13px', fontWeight:600, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', transition:'.2s', textAlign:'left' }}>
          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{getDisplayName(value) || 'Select a model...'}</span>
          <ChevronDown size={14} style={{ flexShrink:0, marginLeft:'8px', transform: open ? 'rotate(180deg)' : 'none', transition:'.2s' }}/>
        </button>

        {open && (
          <div style={{ position:'absolute', top:'100%', left:0, right:0, marginTop:'6px', background:'var(--bg2)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:'1px solid var(--border)', borderRadius:'14px', zIndex:200, boxShadow:'0 20px 60px rgba(0,0,0,0.3)', maxHeight:'380px', overflow:'hidden', display:'flex', flexDirection:'column' }}>
            {/* Search */}
            <div style={{ padding:'10px 12px', borderBottom:'1px solid var(--border)' }}>
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search models..." style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', padding:'8px 12px', borderRadius:'9px', fontSize:'13px', outline:'none', boxSizing:'border-box' }}/>
            </div>

            {/* Refresh button */}
            <div style={{ padding:'6px 12px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'flex-end' }}>
              <button onClick={(e) => { e.stopPropagation(); fetchAllModels(); }} style={{ background:'none', border:'none', color:'var(--accent)', fontSize:'11px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                <RefreshCw size={11}/> Refresh live models
              </button>
            </div>

            {/* Groups */}
            <div style={{ overflowY:'auto', flex:1 }}>
              {filteredGroups.map(g => (
                <div key={g.key}>
                  <div style={{ padding:'8px 14px 4px', fontSize:'10px', fontWeight:900, color: g.live ? g.color : 'var(--text3)', letterSpacing:'2px', display:'flex', alignItems:'center', gap:'6px', borderTop:'1px solid var(--border2)', marginTop:'4px' }}>
                    {g.label}
                    {g.live && (
                      <span style={{ fontSize:'9px', background:'rgba(52,211,153,0.1)', color:'#34d399', border:'1px solid rgba(52,211,153,0.3)', padding:'1px 7px', borderRadius:'10px', fontWeight:700 }}>LIVE</span>
                    )}
                    {fetchStatus[g.key] === 'loading' && <Loader2 size={9} style={{ animation:'spin 1s linear infinite', color:'var(--text3)' }}/>}
                  </div>
                  {g.models.map(m => (
                    <button key={m.id} onClick={() => { onChange(m.id); setOpen(false); setSearch(''); }}
                      style={{ width:'100%', background: value === m.id ? `${accentColor}15` : 'transparent', border:'none', color: value === m.id ? accentColor : 'var(--text2)', padding:'9px 18px', fontSize:'13px', cursor:'pointer', textAlign:'left', transition:'.15s', display:'flex', alignItems:'center', gap:'8px' }}>
                      {value === m.id && <Check size={12} style={{ color: accentColor, flexShrink:0 }}/>}
                      <span style={{ fontSize: 11, opacity: 0.55, flexShrink: 0 }}>{(PROVIDER_META[g.key]?.emoji) || '•'}</span>
                      <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {m.name || m.id}
                        {m.free && <span style={{ marginLeft:'6px', fontSize:'9px', background:'rgba(52,211,153,0.1)', color:'#34d399', padding:'1px 6px', borderRadius:'8px', border:'1px solid rgba(52,211,153,0.2)' }}>FREE</span>}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
              {filteredGroups.length === 0 && (
                <div style={{ padding:'20px', textAlign:'center', color:'var(--text3)', fontSize:'13px' }}>No models found for "{search}"</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── RUN COMPARISON ────────────────────────────────────────────────────────
  const handleCompare = async () => {
    if (!prompt.trim())  { showToast('Enter a prompt first', 'error'); return; }
    if (!modelA || !modelB) { showToast('Select both models', 'error'); return; }
    if (modelA === modelB) { showToast('Select two different models', 'error'); return; }

    cancelRef.current = false;
    setLoading(true);
    setResultA(''); setResultB(''); setVerdict(''); setWinner(null);
    setTimeA(null); setTimeB(null);

    const sys = 'You are a helpful, accurate, and thoughtful AI assistant. Provide high-quality, well-structured responses.';

    try {
      const t0 = Date.now();
      const [resA, resB] = await Promise.allSettled([
        callAI(sys, prompt, modelA, null, apiKey, providerKeys, customModels)
          .then(r => { setTimeA(Date.now() - t0); return r; }),
        callAI(sys, prompt, modelB, null, apiKey, providerKeys, customModels)
          .then(r => { setTimeB(Date.now() - t0); return r; }),
      ]);

      if (cancelRef.current) return;

      const tA = resA.status === 'fulfilled' ? resA.value : `❌ Error: ${resA.reason?.message}`;
      const tB = resB.status === 'fulfilled' ? resB.value : `❌ Error: ${resB.reason?.message}`;
      setResultA(tA);
      setResultB(tB);

      // AI Judge — uses the better available model
      if (resA.status === 'fulfilled' && resB.status === 'fulfilled') {
        try {
          const judgeSystem = `You are an expert AI response evaluator. Compare two AI responses fairly and concisely.

OUTPUT FORMAT (follow exactly):
WINNER: [A or B or TIE]
REASONING: [2-3 sentences — why this winner, what was decisive]
STRENGTH_A: [1 specific strength of Response A]
STRENGTH_B: [1 specific strength of Response B]
RECOMMENDATION: [1 sentence on which model to use for this type of task]`;

          const judgePrompt = `PROMPT GIVEN: "${prompt}"

RESPONSE A (${getDisplayName(modelA)}):
${tA.slice(0, 1000)}

RESPONSE B (${getDisplayName(modelB)}):
${tB.slice(0, 1000)}

Evaluate fairly on: accuracy, completeness, clarity, usefulness.`;

          const v = await callAI(judgeSystem, judgePrompt, modelA, null, apiKey, providerKeys, customModels);
          if (!cancelRef.current) {
            setVerdict(v);
            const wm = v.match(/WINNER:\s*(A|B|TIE)/i);
            if (wm) setWinner(wm[1].toUpperCase());
          }
        } catch (_) { /* verdict is optional — don't fail */ }
      }
    } catch (e) {
      showToast('Comparison failed: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text, setDone) => {
    navigator.clipboard.writeText(text);
    setDone(true);
    showToast('Copied!');
    setTimeout(() => setDone(false), 2000);
  };

  const tokensA = estimateTokens(resultA);
  const tokensB = estimateTokens(resultB);

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="mc-root" style={{ padding:'40px', minHeight:'100vh', background:'var(--bg)', boxSizing:'border-box' }}>

      {/* HEADER */}
      <div style={{ borderLeft:'4px solid var(--accent)', paddingLeft:'20px', marginBottom:'32px' }}>
        <div style={{ fontSize:'10px', fontWeight:900, color:'var(--accent)', letterSpacing:'4px', marginBottom:'8px' }}>⚖️ AI MODEL ARENA v2.0</div>
        <h2 style={{ fontSize:'32px', fontWeight:900, color:'var(--text)', letterSpacing:'-1.5px', margin:'0 0 6px' }}>
          Model <span style={{ color:'var(--accent)' }}>Compare</span>
        </h2>
        <p style={{ color:'var(--text3)', fontSize:'14px', margin:0 }}>
          Run any prompt on 2 models at once. Live models auto-fetched from your API keys — always up to date.
        </p>
      </div>

      {/* FETCH STATUS BAR */}
      {Object.keys(fetchStatus).length > 0 && (
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'20px', padding:'12px 16px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'12px' }}>
          <div style={{ fontSize:'10px', fontWeight:900, color:'var(--text3)', letterSpacing:'2px', alignSelf:'center', marginRight:'4px' }}>LIVE FETCH:</div>
          {Object.entries(fetchStatus).map(([pid, status]) => {
            const meta = PROVIDER_META[pid] || { name: pid, color: '#94a3b8' };
            const count = liveModels[pid]?.length || 0;
            return (
              <div key={pid} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'20px', border:'1px solid var(--border)', background: status==='done' ? 'rgba(52,211,153,0.08)' : status==='loading' ? 'rgba(124,92,252,0.08)' : 'rgba(248,113,113,0.08)', color: status==='done' ? '#34d399' : status==='loading' ? 'var(--accent)' : '#f87171' }}>
                {status === 'loading' && <Loader2 size={10} style={{ animation:'spin 1s linear infinite' }}/>}
                {status === 'done'    && <Check size={10}/>}
                {status === 'error'   && <AlertTriangle size={10}/>}
                {meta.name.split(' ')[0]} {status === 'done' ? `${count} models` : status}
              </div>
            );
          })}
          <button onClick={fetchAllModels} style={{ marginLeft:'auto', background:'none', border:'1px solid var(--border)', color:'var(--text3)', fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'20px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px' }}>
            <RefreshCw size={10}/> Refresh All
          </button>
        </div>
      )}

      {/* MAIN CARD */}
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'20px', padding:'28px', marginBottom:'24px' }}>

        {/* Model selectors */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:'20px', alignItems:'flex-end', marginBottom:'24px' }}>
          <ModelSelector value={modelA} onChange={setModelA} label="MODEL A" accentColor="var(--accent)"/>
          <div style={{ fontSize:'16px', fontWeight:900, color:'var(--text3)', paddingBottom:'10px', textAlign:'center' }}>VS</div>
          <ModelSelector value={modelB} onChange={setModelB} label="MODEL B" accentColor="#34d399"/>
        </div>

        {/* Info box */}
        <div style={{ background:'rgba(124,92,252,0.05)', border:'1px solid rgba(124,92,252,0.15)', borderRadius:'10px', padding:'10px 14px', marginBottom:'20px', fontSize:'12px', color:'var(--text3)', display:'flex', alignItems:'flex-start', gap:'8px' }}>
          <Info size={13} style={{ color:'var(--accent)', flexShrink:0, marginTop:'1px' }}/>
          Models are fetched live from your saved API keys — you always see the latest available models. Anthropic models use a static list (no public API). Add keys in Settings → API Keys to see more providers.
        </div>

        {/* Quick prompts */}
        <div style={{ marginBottom:'14px' }}>
          <div style={{ fontSize:'10px', fontWeight:900, color:'var(--text3)', letterSpacing:'2px', marginBottom:'8px' }}>QUICK PROMPTS</div>
          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
            {QUICK.map((q, i) => (
              <button key={i} onClick={() => setPrompt(q)}
                style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text2)', padding:'5px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:600, cursor:'pointer', transition:'.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)';  e.currentTarget.style.color='var(--text2)'; }}>
                {q.length > 45 ? q.slice(0, 45) + '…' : q}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt textarea */}
        <textarea rows={4} value={prompt} onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleCompare(); }}
          placeholder="Type your prompt here — Ctrl+Enter to compare..."
          style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', padding:'14px 16px', borderRadius:'13px', fontSize:'14px', resize:'none', outline:'none', fontFamily:'inherit', lineHeight:1.6, boxSizing:'border-box', marginBottom:'16px' }}/>

        <button onClick={handleCompare} disabled={loading || !modelA || !modelB}
          style={{ width:'100%', padding:'16px', background:'var(--accent)', border:'none', borderRadius:'13px', color:'#fff', fontSize:'15px', fontWeight:800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading || !modelA || !modelB ? 0.6 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', boxShadow:'0 8px 25px rgba(124,92,252,0.3)' }}>
          {loading ? <><Loader2 size={18} style={{ animation:'spin 1s linear infinite' }}/> Comparing...</> : <><GitCompare size={18}/> Compare Both Models</>}
        </button>
      </div>

      {/* RESULTS */}
      <AnimatePresence>
        {(resultA || resultB || loading) && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>

            {/* Winner banner */}
            {winner && (
              <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
                style={{ textAlign:'center', marginBottom:'16px', padding:'16px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'14px' }}>
                <WinnerBadge winner={winner}/>
              </motion.div>
            )}

            {/* Side by side */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px' }}>
              {[
                { label:'A', model:modelA, result:resultA, time:timeA, tokens:tokensA, copied:copiedA, setCopied:setCopiedA, accent:'var(--accent)', isWinner:winner==='A' },
                { label:'B', model:modelB, result:resultB, time:timeB, tokens:tokensB, copied:copiedB, setCopied:setCopiedB, accent:'#34d399', isWinner:winner==='B' },
              ].map(({ label, model, result, time, tokens, copied, setCopied, accent, isWinner }) => (
                <div key={label} style={{ background:'var(--card)', border:`2px solid ${isWinner ? accent : 'var(--border)'}`, borderRadius:'18px', overflow:'hidden', transition:'border-color .3s', boxShadow: isWinner ? `0 0 25px ${accent}20` : 'none' }}>

                  {/* Card header */}
                  <div style={{ background: isWinner ? `${accent}10` : 'var(--bg3)', padding:'13px 18px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'8px' }}>
                    <div>
                      <div style={{ fontSize:'10px', fontWeight:800, color:'var(--text3)', letterSpacing:'2px' }}>MODEL {label}</div>
                      <div style={{ fontSize:'13px', fontWeight:700, color:'var(--text)', marginTop:'2px', maxWidth:'240px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {getPlainName(model)}
                      </div>
                      {(() => {
                        const pid = getProviderForModel(model);
                        if (!pid) return null;
                        const meta = PROVIDER_META[pid];
                        if (!meta) return null;
                        return (
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 9, fontWeight: 800, letterSpacing: '0.5px',
                            padding: '2px 8px', borderRadius: 10, marginTop: 4,
                            background: `${meta.color}15`,
                            color: meta.color,
                            border: `1px solid ${meta.color}40`,
                          }}>
                            {meta.emoji} {meta.short}
                          </div>
                        );
                      })()}
                    </div>
                    <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                      {time    && <MetricChip icon={<Clock size={10}/>}       label="Time"    value={`${(time/1000).toFixed(1)}s`}  color="#38bdf8"/>}
                      {tokens>0 && <MetricChip icon={<Hash size={10}/>}       label="~Tokens" value={tokens}                        color="#a78bfa"/>}
                      {tokens>0 && <MetricChip icon={<DollarSign size={10}/>} label="~Cost"   value={`$${getCost(model, tokens)}`}  color="#34d399"/>}
                      {isWinner && <div style={{ fontSize:'11px', fontWeight:800, color:accent, background:`${accent}15`, border:`1px solid ${accent}40`, padding:'3px 10px', borderRadius:'20px', display:'flex', alignItems:'center', gap:'4px' }}><Trophy size={10}/> WINNER</div>}
                    </div>
                  </div>

                  {/* Response body */}
                  <div style={{ padding:'20px', maxHeight:'500px', overflowY:'auto', fontSize:'14px', lineHeight:1.75, color:'var(--text)' }} className="mc-md-body">
                    {loading && !result
                      ? <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                          {[85,65,90,55,75].map((w,i) => <div key={i} style={{ height:'12px', background:'var(--border2)', borderRadius:'5px', width:`${w}%`, animation:`shimmer 1.5s ${i*0.1}s infinite` }}/>)}
                        </div>
                      : <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                    }
                  </div>

                  {/* Copy footer */}
                  {result && (
                    <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border2)', display:'flex', justifyContent:'flex-end' }}>
                      <button onClick={() => copy(result, setCopied)}
                        style={{ background:'var(--bg3)', border:'1px solid var(--border)', color: copied ? '#34d399' : 'var(--text2)', padding:'6px 14px', borderRadius:'9px', fontSize:'11px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'5px' }}>
                        {copied ? <><Check size={12}/> Copied!</> : <><Copy size={12}/> Copy Response</>}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* AI Judge Verdict */}
            {verdict && (
              <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                style={{ background:'var(--card)', border:'1px solid rgba(124,92,252,0.25)', borderRadius:'18px', overflow:'hidden' }}>
                <div style={{ background:'rgba(124,92,252,0.07)', padding:'14px 22px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:'11px', fontWeight:900, color:'var(--accent)', letterSpacing:'2px', display:'flex', alignItems:'center', gap:'8px' }}>
                    <Trophy size={13}/> AI JUDGE VERDICT
                  </div>
                  <WinnerBadge winner={winner}/>
                </div>
                <div style={{ padding:'22px', fontSize:'14px', lineHeight:1.75, color:'var(--text)' }} className="mc-md-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {verdict
                      .replace(/WINNER:.*?\n?/, '')
                      .replace(/STRENGTH_A:/g, '**Model A strength:**')
                      .replace(/STRENGTH_B:/g, '**Model B strength:**')
                      .replace(/REASONING:/,   '**Analysis:**\n')
                      .replace(/RECOMMENDATION:/, '\n**Recommendation:**\n')
                    }
                  </ReactMarkdown>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* EMPTY STATE */}
      {!resultA && !resultB && !loading && (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text3)', border:'1px dashed var(--border)', borderRadius:'18px' }}>
          <GitCompare size={44} style={{ marginBottom:'14px', opacity:0.3 }}/>
          <p style={{ fontSize:'14px', maxWidth:'440px', margin:'0 auto', lineHeight:1.7 }}>
            Select two models, enter any prompt, and click Compare. See responses side-by-side with response time, token count, estimated cost, and an AI judge verdict. Models are fetched live from your API keys.
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes shimmer { 0%{opacity:.05} 50%{opacity:.12} 100%{opacity:.05} }
        .mc-md-body h1,.mc-md-body h2,.mc-md-body h3{color:var(--text);font-weight:800;margin:14px 0 7px}
        .mc-md-body p{margin-bottom:9px;color:var(--text2)}
        .mc-md-body strong{color:var(--text);font-weight:800}
        .mc-md-body a{color:var(--accent)}
        .mc-md-body code{background:var(--bg3);color:var(--accent);padding:2px 6px;border-radius:4px;font-family:'DM Mono',monospace;font-size:12px}
        .mc-md-body pre{background:var(--bg2);border:1px solid var(--border);border-radius:9px;padding:12px;overflow-x:auto;margin:10px 0}
        .mc-md-body pre code{background:none;color:var(--text);font-size:13px}
        .mc-md-body ul,.mc-md-body ol{padding-left:18px;margin-bottom:9px}
        .mc-md-body li{margin-bottom:4px;color:var(--text2)}
        .mc-md-body table{width:100%;border-collapse:collapse;margin:12px 0;font-size:13px}
        .mc-md-body th{background:var(--bg3);color:var(--accent);padding:7px 12px;text-align:left;font-size:10px;letter-spacing:1px;border:1px solid var(--border)}
        .mc-md-body td{padding:7px 12px;border:1px solid var(--border2);color:var(--text2)}
        .mc-md-body blockquote{border-left:3px solid var(--accent);padding:6px 12px;margin:8px 0;background:var(--bg3);border-radius:0 6px 6px 0}

        /* ── RESPONSIVE: Model Compare ── */
        @media (max-width: 900px) {
          .mc-root { padding: 24px 16px !important; }
          .mc-root h2 { font-size: 26px !important; letter-spacing: -1px !important; }
          .mc-root > div[style*="border-left"] { padding-left: 14px !important; }
          /* main card padding */
          .mc-root > div[style*="borderRadius: 20px"][style*="padding: 28px"],
          .mc-root > div[style*="border-radius:20px"] { padding: 18px 14px !important; border-radius: 16px !important; }
          /* model selectors: VS row collapses to stacked */
          .mc-root [style*="grid-template-columns:1fr auto 1fr"],
          .mc-root [style*="grid-template-columns: 1fr auto 1fr"] { grid-template-columns: 1fr !important; gap: 14px !important; }
          /* results grid stacks */
          .mc-root [style*="grid-template-columns:1fr 1fr"],
          .mc-root [style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; gap: 16px !important; }
        }
        @media (max-width: 600px) {
          .mc-root { padding: 18px 12px !important; }
          .mc-root h2 { font-size: 22px !important; }
          .mc-root [style*="borderRadius: 20px"][style*="padding: 28px"] { padding: 14px 11px !important; }
          /* response body cards less padding */
          .mc-md-body { font-size: 13px !important; }
          .mc-root [style*="max-height: 500px"] { max-height: 400px !important; }
          /* metric chips wrap */
          .mc-root [style*="justify-content: space-between"] { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>
    </div>
  );
}