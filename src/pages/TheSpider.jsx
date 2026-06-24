import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Search, Globe, Zap, Shield, Send, Loader2, Copy, Download,
  RefreshCw, FileText, Code2, Clock, Network, Brain, BarChart3,
  CheckCircle2, Eye, X, Link2, Trash2, ExternalLink, Languages, BookMarked,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ── MODES ──
const MODES = [
  { id: 'dossier',  icon: <Shield size={13} />,    label: 'Intelligence Dossier', desc: 'Deep report with all sources' },
  { id: 'summary',  icon: <FileText size={13} />,  label: 'Quick Summary',        desc: 'Key facts, fast' },
  { id: 'compare',  icon: <BarChart3 size={13} />, label: 'Compare & Contrast',   desc: 'Structured comparison table' },
  { id: 'code',     icon: <Code2 size={13} />,     label: 'Technical Extract',    desc: 'Code, APIs, docs' },
  { id: 'timeline', icon: <Clock size={13} />,     label: 'Timeline Analysis',    desc: 'Chronological breakdown' },
  { id: 'entity',   icon: <Network size={13} />,   label: 'Entity Map',           desc: 'People, orgs, connections' },
];

const MODE_PROMPTS = {
  dossier:  'Create an EXHAUSTIVE INTELLIGENCE DOSSIER with bold ## headers, tables for key data, statistics in bold. Include: Executive Summary → Core Analysis → Key Data Points → Entities → Sources. Minimum 800 words.',
  summary:  'Create a CONCISE SMART SUMMARY in 5 sections: TL;DR (2-3 sentences) → Key Facts (5 bullets) → Critical Numbers → Who\'s Involved → Bottom Line.',
  compare:  'Extract all comparable entities/options and create a STRUCTURED COMPARISON TABLE using markdown, then a recommendation section.',
  code:     'Extract all CODE SAMPLES, API endpoints, technical specs, version numbers, and config snippets. Format each in code blocks with language labels.',
  timeline: 'Reconstruct a CHRONOLOGICAL TIMELINE of all events/updates mentioned. Use markdown with dates on the left. Highlight key milestones.',
  entity:   'Build an ENTITY MAP extracting: People (name, role, relevance), Organizations (name, type, relation), Technologies (name, purpose). Use markdown tables.',
};

const LANGUAGES = ['English', 'Hindi', 'Hinglish', 'Spanish', 'French', 'German', 'Portuguese', 'Arabic', 'Japanese', 'Chinese', 'Russian'];

// ── LocalStorage history helpers ──
const HIST_KEY = 'pf_spider_history';
const loadHistory = () => {
  try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch { return []; }
};
const saveHistory = (h) => {
  try { localStorage.setItem(HIST_KEY, JSON.stringify(h.slice(0, 25))); } catch (_) {}
};

// ── Robust JSON extractor for meta block ──
const extractMetaJSON = (text) => {
  if (!text) return null;
  const m = text.match(/```json\s*([\s\S]*?)```/i);
  if (!m) return null;
  try { return JSON.parse(m[1]); }
  catch (_) {
    try {
      const repaired = m[1].replace(/,(\s*[}\]])/g, '$1').replace(/'/g, '"');
      return JSON.parse(repaired);
    } catch (_) { return null; }
  }
};

// ── Extract markdown links [text](url) from text — ONLY real ones from scraped data ──
// To avoid AI hallucinated URLs (e.g. AI guesses /products/foo when it doesn't exist),
// we cross-check every link against the raw scraped data. If the URL doesn't appear in
// the source feed, we mark it as `unverified` (still shown, but flagged).
const extractSources = (text, rawData = '') => {
  if (!text) return [];
  const sources = [];
  const seen = new Set();
  const re = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const url = m[2].trim().replace(/[.,;:)]+$/, ''); // strip trailing punctuation
    if (seen.has(url)) continue;
    seen.add(url);
    // Verify URL appears in raw scraped data (handles trailing slash, www variants)
    const u = url.replace(/\/$/, '').toLowerCase();
    const rawLower = rawData.toLowerCase();
    const verified = rawData
      ? (rawLower.includes(u) || rawLower.includes(u.replace(/^https?:\/\/(www\.)?/, '')))
      : true; // if no raw data given, assume verified
    sources.push({
      label: m[1].trim().slice(0, 80),
      url,
      verified,
    });
    if (sources.length >= 30) break;
  }
  return sources;
};

// ── Fetch with timeout helper ──
const fetchWithTimeout = (url, options = {}, timeoutMs = 45000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
    fetch(url, options)
      .then(r => { clearTimeout(timer); resolve(r); })
      .catch(e => { clearTimeout(timer); reject(e); });
  });
};

export default function TheSpider() {
  const { providerKeys, showToast, activeModel, apiKey, customModels, saveToVault } = useContext(AppContext);
  const navigate = useNavigate();

  const [query,        setQuery]        = useState('');
  const [mode,         setMode]         = useState('dossier');
  const [depth,        setDepth]        = useState('deep');
  const [lang,         setLang]         = useState('English');
  const [loading,      setLoading]      = useState(false);
  const [steps,        setSteps]        = useState([]);
  const [result,       setResult]       = useState('');
  const [rawContent,   setRawContent]   = useState('');
  const [meta,         setMeta]         = useState(null);
  const [followUps,    setFollowUps]    = useState([]);
  const [followInput,  setFollowInput]  = useState('');
  const [followCount,  setFollowCount]  = useState(0);
  const [activeTab,    setActiveTab]    = useState('report');
  const [history,      setHistory]      = useState(loadHistory());

  const cancelRef     = useRef(false);
  const abortRef      = useRef(null);
  const timerRef      = useRef(null);
  const [elapsed,     setElapsed]      = useState(0);

  const isUrlInput = useMemo(() => {
    const q = query.trim();
    if (/^https?:\/\//i.test(q)) return true;
    // Match common domain patterns e.g. domain.com or domain.com/path
    if (/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,6}(:[0-9]{1,5})?(\/.*)?$/i.test(q)) {
      return true;
    }
    return false;
  }, [query]);

  // Persist history
  useEffect(() => { saveHistory(history); }, [history]);

  // Auto-extracted sources from result markdown — verified against raw scraped data
  const sources = useMemo(() => extractSources(result, rawContent), [result, rawContent]);

  // ── Step helpers ──
  const addStep  = (text) => setSteps(prev => [...prev, { text, done: false }]);
  const doneStep = (i)    => setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, done: true } : s));
  const doneAll  = ()     => setSteps(prev => prev.map(s => ({ ...s, done: true })));

  // ── CANCEL handler ──
  const handleCancel = () => {
    cancelRef.current = true;
    clearInterval(timerRef.current);
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch (_) {}
    }
    setLoading(false);
    setSteps([]);
    showToast('Spider cancelled', 'warn');
  };

  // ── Jina fetch with retry ──
  const fetchJina = async (jinaUrl) => {
    abortRef.current = new AbortController();
    const tryOnce = () => fetchWithTimeout(jinaUrl, {
      headers: { Accept: 'text/plain' },
      signal: abortRef.current.signal,
    }, 45000);

    try {
      const r = await tryOnce();
      if (r.status === 429 || r.status === 503) {
        // Wait 1.5s and retry once
        await new Promise(res => setTimeout(res, 1500));
        const r2 = await tryOnce();
        return r2.text();
      }
      return r.text();
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('Cancelled');
      // One retry on network errors
      await new Promise(res => setTimeout(res, 1000));
      const r3 = await tryOnce();
      return r3.text();
    }
  };

  // ── MAIN SEARCH ──
  const handleSearch = async () => {
    if (!query.trim()) { showToast('Enter a query first', 'error'); return; }
    cancelRef.current = false;
    setLoading(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    setResult(''); setMeta(null); setFollowUps([]); setSteps([]); setRawContent('');
    setActiveTab('report'); setFollowCount(0);

    try {
      const isUrl = isUrlInput;
      let targetQuery = query.trim();
      if (isUrl && !/^https?:\/\//i.test(targetQuery)) {
        targetQuery = 'https://' + targetQuery;
      }
      addStep(isUrl ? 'Extracting target URL content...' : 'Querying global web index...');

      const endpoint = isUrl
        ? `https://r.jina.ai/${targetQuery}`
        : `https://s.jina.ai/${encodeURIComponent(targetQuery)}`;

      let raw;
      try {
        raw = await fetchJina(endpoint);
      } catch (e) {
        if (cancelRef.current) return;
        if (e.message === 'Cancelled') return;
        throw new Error('Web extraction failed: ' + (e.message || 'Network error'));
      }

      if (cancelRef.current) return;
      if (!raw || raw.length < 50) throw new Error('No data retrieved. Try a different query or URL.');
      setRawContent(raw);
      doneStep(0);

      let enriched = raw;
      if (depth === 'deep' && !isUrl) {
        addStep('Running secondary extraction pass...');
        try {
          const t2 = await fetchJina(`https://s.jina.ai/${encodeURIComponent(query.trim() + ' detailed analysis')}`);
          if (t2?.length > 100) enriched = raw + '\n\n--- SECONDARY SOURCE ---\n\n' + t2;
        } catch (_) {/* secondary failure is non-fatal */}
        if (cancelRef.current) return;
        doneStep(1);
      }

      addStep('Synthesizing intelligence with AI...');

      const system = `You are SPIDER PRIME — the world's most advanced real-time web intelligence AI.
You have just received live-scraped web data. Your task: ${MODE_PROMPTS[mode]}

OUTPUT LANGUAGE: ${lang}.

CRITICAL RULES:
1. Every claim must reference the source data. NO HALLUCINATIONS.
2. Links: ONLY use URLs that ACTUALLY APPEAR in the scraped data below. Never guess, fabricate, or assume URL patterns (e.g. don't generate /products/x just because product X is mentioned).
3. If you reference a fact but the source URL isn't in the data, write the fact WITHOUT a link — do not make up the URL.
4. Use [Source Name](URL) format only for verified URLs from the source data.
5. Remove navigation, ads, footer junk from raw input.
6. Depth: ${depth.toUpperCase()}.
7. Write the entire response in ${lang}. Keep proper nouns, brand names, and code in English.

At the very end, append this metadata in a JSON block (NO trailing commas, double-quoted strings only).
IMPORTANT: suggestedFollowUps must be SPECIFIC questions based on the actual content found, not generic placeholders:
\`\`\`json
{
  "sourceCount": 3,
  "wordCount": 900,
  "credibility": "High",
  "freshness": "Live data",
  "suggestedFollowUps": ["Specific question directly related to the query topic 1", "Specific question directly related to the query topic 2", "Specific question directly related to the query topic 3"]
}
\`\`\``;

      const user = `LIVE WEB DATA:\n${enriched.substring(0, 50000)}\n\nORIGINAL QUERY: "${query}"`;

      const res = await callAI(system, user, null, activeModel, apiKey, providerKeys, customModels);
      if (cancelRef.current) return;
      doneAll();

      let cleanRes = res;
      const metaData = extractMetaJSON(res);
      if (metaData && (metaData.suggestedFollowUps || metaData.sourceCount)) {
        // Find the specific json block and remove it
        const m = res.match(/```json\s*([\s\S]*?)```/i);
        if (m) {
          cleanRes = res.replace(m[0], '').trim();
        }
      } else {
        cleanRes = res.replace(/```json[\s\S]*?```/g, '').trim();
      }
      // Strip stray markdown symbols
      cleanRes = cleanRes.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s/g, '').replace(/`{1,3}/g, '').trim();
      setResult(cleanRes);
      if (metaData) {
        setMeta(metaData);
        if (Array.isArray(metaData.suggestedFollowUps)) {
          setFollowUps(metaData.suggestedFollowUps.filter(Boolean).slice(0, 6));
        }
      }

      // Save to history with full snapshot for restore
      const histItem = {
        id: Date.now(),
        query: query.slice(0, 80),
        fullQuery: query,
        mode,
        depth,
        lang,
        result: cleanRes,
        rawContent: raw.slice(0, 30000),
        meta: metaData,
        followUps: metaData?.suggestedFollowUps || [],
        followCount: 0,
        timestamp: new Date().toISOString(),
      };
      setHistory(prev => [histItem, ...prev].slice(0, 25));

      showToast('Intelligence acquired!');
    } catch (e) {
      if (e.message === 'Cancelled' || cancelRef.current) return;
      showToast('Spider Error: ' + e.message, 'error');
      setSteps(prev => prev.map(s => s.done ? s : { ...s, error: true }));
    } finally {
      setLoading(false);
      clearInterval(timerRef.current);
      abortRef.current = null;
    }
  };

  // ── FOLLOW-UP ──
  const handleFollowUp = async (fq) => {
    if (!fq.trim() || loading) return;
    setFollowInput('');
    setActiveTab('report');
    setLoading(true);
    setElapsed(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    cancelRef.current = false;

    try {
      const system = `You are SPIDER PRIME answering a follow-up question. Base your answer on the already-scraped web data if available, otherwise use your knowledge. Be specific and detailed. Use rich Markdown formatting (bold, lists, headers, tables) to answer. Output language: ${lang}.`;
      const user   = `ORIGINAL QUERY: "${query}"\n${rawContent ? `SCRAPED DATA: ${rawContent.substring(0, 30000)}\n` : ''}FOLLOW-UP: "${fq}"`;
      let res = await callAI(system, user, null, activeModel, apiKey, providerKeys, customModels);
      if (cancelRef.current) return;

      // Strip stray markdown symbols
      res = res.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s/g, '').replace(/`{1,3}/g, '').trim();

      const updated = result + '\n\n---\n\n### Follow-up: ' + fq + '\n\n' + res;
      setResult(updated);
      setFollowCount(c => c + 1);

      // Update last history item with follow-up appended
      setHistory(prev => {
        if (!prev.length) return prev;
        const [first, ...rest] = prev;
        return [{ ...first, result: updated, followCount: (first.followCount || 0) + 1 }, ...rest];
      });

      showToast('Follow-up answered!');
    } catch (e) {
      if (cancelRef.current) return;
      showToast('Follow-up failed: ' + e.message, 'error');
    } finally {
      setLoading(false);
      clearInterval(timerRef.current);
    }
  };

  const copyResult = (clean) => {
    const text = clean
      ? result.replace(/\*\*/g, '').replace(/#{1,3} /g, '').replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)')
      : result;
    navigator.clipboard.writeText(text);
    showToast(clean ? 'Clean text copied!' : 'Markdown copied!');
  };
  const downloadResult = () => {
    const safeQ = (query || 'spider').replace(/[^a-z0-9]+/gi, '_').slice(0, 40);
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([result], { type: 'text/markdown' })),
      download: `spider_${safeQ}_${Date.now()}.md`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Downloaded!');
  };

  // ── HISTORY actions ──
  const restoreFromHistory = (h) => {
    setQuery(h.fullQuery || h.query || '');
    setMode(h.mode || 'dossier');
    setDepth(h.depth || 'deep');
    setLang(h.lang || 'English');
    setResult(h.result || '');
    setRawContent(h.rawContent || '');
    setMeta(h.meta || null);
    setFollowUps(h.followUps || []);
    setFollowCount(h.followCount || 0);
    setActiveTab('report');
    showToast('Restored from history');
  };
  const deleteHistoryItem = (id) => {
    setHistory(prev => prev.filter(h => h.id !== id));
  };
  const clearAllHistory = () => {
    if (window.confirm('Clear all Spider history?')) {
      setHistory([]);
      showToast('History cleared');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', padding: '40px', gap: '28px', boxSizing: 'border-box' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ borderLeft: '4px solid var(--accent)', paddingLeft: '20px' }}>
          <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '4px', display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
            <Network size={11}/> NEURAL WEB INTELLIGENCE v3.0
          </div>
          <h2 style={{ fontSize: '38px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-2px', margin: 0 }}>
            The <span style={{ color: 'var(--accent)' }}>Spider</span>
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: '13px', marginTop: '5px', maxWidth: '480px' }}>
            Real-time web extraction → AI synthesis → Multi-format intelligence reports.
          </p>
        </div>

        {/* Mini history with restore + delete */}
        {history.length > 0 && (
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '14px', padding: '14px', minWidth: '240px', maxWidth: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text3)', letterSpacing: '2px' }}>
                RECENT ({history.length})
              </span>
              <button onClick={clearAllHistory}
                style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}
                title="Clear all history">
                <Trash2 size={10}/> Clear
              </button>
            </div>
            {history.slice(0, 6).map(h => {
              const modeMeta = MODES.find(m => m.id === h.mode);
              return (
                <div key={h.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 7px', borderRadius: '7px', cursor: 'pointer', transition: '.15s',
                    fontSize: '12px',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,92,252,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div onClick={() => restoreFromHistory(h)}
                    style={{ flex: 1, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                    <span style={{ fontSize: '10px', color: 'var(--accent)', marginRight: '4px' }}>
                      {modeMeta?.label?.split(' ')[0] || h.mode}
                    </span>
                    {h.query}
                    {h.followCount > 0 && (
                      <span style={{ marginLeft: '4px', fontSize: '9px', color: 'var(--text3)' }}>+{h.followCount}</span>
                    )}
                  </div>
                  <button onClick={() => deleteHistoryItem(h.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
                    title="Delete">
                    <X size={10}/>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SEARCH AREA ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Mode selector */}
        <div className="sp-mode-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '8px' }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); setResult(''); setMeta(null); setFollowUps([]); setActiveTab('report'); }}
              style={{
                background: mode === m.id ? 'rgba(124,92,252,0.12)' : 'var(--bg3)',
                border: `1px solid ${mode === m.id ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '13px', padding: '12px 10px', cursor: 'pointer',
                color: mode === m.id ? 'var(--accent)' : 'var(--text)',
                display: 'flex', flexDirection: 'column', gap: '5px', textAlign: 'left',
                transition: 'all .2s',
              }}>
              {m.icon}
              <span style={{ fontSize: '11px', fontWeight: 700 }}>{m.label}</span>
              <span style={{ fontSize: '9px', color: 'var(--text3)' }}>{m.desc}</span>
            </button>
          ))}
        </div>

        {/* Depth + Language + Search bar */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {[['quick', '⚡ Quick'], ['deep', '🔬 Deep']].map(([id, label]) => (
              <button key={id} onClick={() => setDepth(id)}
                style={{
                  background: depth === id ? 'rgba(124,92,252,0.15)' : 'var(--bg3)',
                  border: `1px solid ${depth === id ? 'var(--accent)' : 'var(--border)'}`,
                  color: depth === id ? 'var(--accent)' : 'var(--text2)',
                  padding: '9px 14px', borderRadius: '10px',
                  fontSize: '11px', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', transition: '.2s',
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Language selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <select value={lang} onChange={e => setLang(e.target.value)}
              style={{
                background: 'var(--bg3)', border: '1px solid var(--border)',
                color: 'var(--text)', padding: '9px 14px 9px 32px',
                borderRadius: '10px', fontSize: '11px', fontWeight: 700,
                cursor: 'pointer', height: '100%',
                appearance: 'none', WebkitAppearance: 'none',
                backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23999\' stroke-width=\'2\'><polyline points=\'6 9 12 15 18 9\'/></svg>")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                paddingRight: '24px',
              }}>
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>

          <div style={{
            flex: 1, minWidth: '300px', display: 'flex', alignItems: 'center',
            background: 'var(--bg3)', border: `1px solid ${isUrlInput ? '#34d399' : 'var(--border)'}`,
            borderRadius: '15px', padding: '0 18px', gap: '10px',
            transition: 'border-color .2s',
          }}>
            {isUrlInput
              ? <Link2 size={17} style={{ color: '#34d399', flexShrink: 0 }}/>
              : <Search size={17} style={{ color: 'var(--text3)', flexShrink: 0 }}/>}
            <input
              style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text)', fontSize: '15px', padding: '17px 0', outline: 'none' }}
              placeholder="Enter URL, topic, company, person, question..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && handleSearch()}
            />
            {isUrlInput && (
              <span style={{
                fontSize: '9px', fontWeight: 800, letterSpacing: '0.5px',
                padding: '2px 7px', borderRadius: '5px',
                background: 'rgba(52,211,153,0.15)', color: '#34d399',
                border: '1px solid rgba(52,211,153,0.3)',
              }}>URL MODE</span>
            )}
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '15px' }}>✕</button>
            )}
          </div>

          {loading ? (
            <button onClick={handleCancel}
              style={{
                background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.4)',
                color: '#f87171', padding: '0 22px', borderRadius: '15px',
                fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
              }}>
              <X size={14}/> Cancel
            </button>
          ) : (
            <button onClick={handleSearch}
              style={{
                background: 'var(--accent)', border: 'none', color: '#fff',
                padding: '0 26px', borderRadius: '15px', fontSize: '14px', fontWeight: 800,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 8px 25px rgba(124,92,252,0.3)', whiteSpace: 'nowrap', transition: '.3s',
              }}>
              <Eye size={15}/> Deploy Spider
            </button>
          )}
        </div>
      </div>

      {/* ── LOADING STATE ── */}
      <AnimatePresence>
        {loading && steps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: 'rgba(124,92,252,0.04)', border: '1px solid var(--border)', borderRadius: '18px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Progress bar + timer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, background: 'var(--bg3)', borderRadius: '99px', height: '5px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '99px', background: 'var(--accent)',
                  width: `${Math.min(95, (elapsed / 30) * 100)}%`,
                  transition: 'width 1s linear',
                }} />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 800, fontFamily: "'DM Mono',monospace", flexShrink: 0 }}>
                {elapsed < 30 ? `${elapsed}s` : 'Processing...'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {[0, 1].map(i => (
                <div key={i} style={{ position: 'absolute', inset: 0, border: '2px solid var(--accent)', borderRadius: '50%', animation: `radarPing 2s ease-out ${i * 0.7}s infinite`, opacity: 0 }}/>
              ))}
              <Globe size={26} style={{ color: 'var(--accent)', animation: 'slowSpin 8s linear infinite', zIndex: 2 }}/>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', flex: 1, minWidth: '200px' }}>
              {steps.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '13px', color: s.done ? '#34d399' : s.error ? '#f87171' : 'var(--text3)' }}>
                  {s.done
                    ? <CheckCircle2 size={13} color="#34d399"/>
                    : s.error
                      ? <X size={13} color="#f87171"/>
                      : <div style={{ width: '13px', height: '13px', border: '2px solid rgba(124,92,252,0.4)', borderTopColor: 'var(--accent)', borderRadius: '50%', flexShrink: 0, animation: 'spin 0.8s linear infinite' }}/>}
                  {s.text}
                  {!s.done && !s.error && elapsed > 8 && (
                    <span style={{ fontSize: '10px', color: 'var(--text3)', fontStyle: 'italic' }}>working...</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* ── RESULTS ── */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '22px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>

            {/* Results header */}
            <div style={{ background: 'rgba(124,92,252,0.06)', padding: '16px 22px', borderBottom: '1px solid var(--border2)', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '2px' }}>
                <Shield size={13}/> INTELLIGENCE REPORT
                <span style={{ background: 'rgba(124,92,252,0.15)', color: '#a78bfa', padding: '2px 9px', borderRadius: '20px', fontSize: '9px', fontWeight: 700 }}>
                  {MODES.find(m => m.id === mode)?.label}
                </span>
                {lang !== 'English' && (
                  <span style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa', padding: '2px 9px', borderRadius: '20px', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Languages size={9}/> {lang}
                  </span>
                )}
              </div>

              {/* Meta chips */}
              {meta && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    [meta.sourceCount && `${meta.sourceCount} sources`],
                    [meta.credibility && `${meta.credibility} credibility`, meta.credibility === 'High' ? '#34d399' : '#fbbf24'],
                    [meta.freshness && meta.freshness],
                    [followCount > 0 && `${followCount} follow-up${followCount > 1 ? 's' : ''}`, '#a78bfa'],
                  ].filter(([v]) => v).map(([v, c], i) => (
                    <div key={i} style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', color: c || 'var(--text2)', padding: '3px 9px', borderRadius: '20px', fontSize: '10px', fontWeight: 700 }}>{v}</div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto', flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/dashboard/chatdata', { state: { spiderPayload: result, spiderQuery: query } })} style={spBtn}><Brain size={12}/> Send to Chat</button>
                <button onClick={() => { saveToVault?.('TheSpider', query, result); showToast('Saved to Vault!'); }} style={spBtn}><BookMarked size={12}/> Save</button>
                <button onClick={() => copyResult(false)} style={spBtn}><Copy size={12}/> Markdown</button>
                <button onClick={() => copyResult(true)}  style={spBtn}><FileText size={12}/> Clean Text</button>
                <button onClick={downloadResult}          style={spBtn}><Download size={12}/> Download</button>
                <button onClick={handleSearch}            style={spBtn}><RefreshCw size={12}/> Re-run</button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '2px', padding: '7px 10px', background: 'var(--bg3)', borderBottom: '1px solid var(--border2)', flexWrap: 'wrap' }}>
              {[
                ['report',   <FileText size={12}/>, 'Report'],
                ['sources', <Link2 size={12}/>, sources.length > 0 ? `Sources (${sources.length})` : 'Sources'],
                ['followup', <Brain size={12}/>, followUps.length > 0 ? `Follow-up (${followUps.length})` : 'Follow-up'],
                rawContent && ['raw', <Code2 size={12}/>, 'Raw Feed'],
              ].filter(Boolean).map(([id, icon, label]) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  style={{
                    background: activeTab === id ? 'var(--accent)' : 'transparent',
                    border: 'none', color: activeTab === id ? '#fff' : 'var(--text3)',
                    padding: '7px 14px', borderRadius: '7px', fontSize: '11px', fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: '.2s',
                  }}>
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'report' && (
              <div style={{ padding: '32px', fontSize: '15px', lineHeight: '1.85', color: 'var(--text)', maxHeight: '800px', overflowY: 'auto' }} className="sp-md-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
              </div>
            )}

            {activeTab === 'sources' && (
              <div style={{ padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text3)', letterSpacing: '2px' }}>
                    EXTRACTED SOURCES — {sources.length} link{sources.length > 1 ? 's' : ''} cited in report
                  </div>
                  {sources.some(s => !s.verified) && (
                    <div style={{
                      fontSize: '10px', color: '#fbbf24', fontWeight: 700,
                      padding: '4px 10px', borderRadius: '20px',
                      background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
                      display: 'flex', alignItems: 'center', gap: '5px',
                    }}>
                      ⚠ {sources.filter(s => !s.verified).length} unverified — AI may have guessed these URLs
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {sources.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                      No clickable sources found in this report. Try a URL-based search for better source extraction.
                    </div>
                  ) : null}
                  {sources.map((s, i) => {
                    let host = '';
                    try { host = new URL(s.url).hostname.replace(/^www\./, ''); } catch (_) { host = s.url; }
                    return (
                      <a key={i} href={s.url} target="_blank" rel="noreferrer"
                        title={s.verified ? 'Verified — this URL was found in the scraped source data' : 'Unverified — this URL was generated by AI and may not exist. Click cautiously.'}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 14px', borderRadius: '10px',
                          background: s.verified ? 'rgba(124,92,252,0.05)' : 'rgba(251,191,36,0.05)',
                          border: `1px solid ${s.verified ? 'var(--border)' : 'rgba(251,191,36,0.25)'}`,
                          textDecoration: 'none', transition: '.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = s.verified ? 'rgba(124,92,252,0.1)' : 'rgba(251,191,36,0.1)';
                          e.currentTarget.style.borderColor = s.verified ? 'var(--accent)' : 'rgba(251,191,36,0.5)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = s.verified ? 'rgba(124,92,252,0.05)' : 'rgba(251,191,36,0.05)';
                          e.currentTarget.style.borderColor = s.verified ? 'var(--border)' : 'rgba(251,191,36,0.25)';
                        }}
                      >
                        <span style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: "'DM Mono',monospace", minWidth: '24px' }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {s.verified
                              ? <CheckCircle2 size={11} color="#34d399" style={{ flexShrink: 0 }}/>
                              : <span style={{ fontSize: '10px', color: '#fbbf24', flexShrink: 0 }}>⚠</span>}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
                          </div>
                          <div style={{ fontSize: '10px', color: s.verified ? 'var(--accent)' : '#fbbf24', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {host} {!s.verified && '· may be hallucinated'}
                          </div>
                        </div>
                        <ExternalLink size={12} color="var(--text3)" style={{ flexShrink: 0 }}/>
                      </a>
                    );
                  })}
                </div>
                <div style={{
                  marginTop: '14px', padding: '10px 14px',
                  background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)',
                  borderRadius: '10px', fontSize: '11px', color: 'var(--text3)', lineHeight: '1.6',
                }}>
                  <strong style={{ color: '#60a5fa' }}>ℹ How this works:</strong> Spider scrapes the live web via Jina, but AI sometimes generates URLs that don't actually exist on the source site (especially for product pages or sub-paths). Verified ✓ links were found in the raw scraped data. Unverified ⚠ links are AI-generated and may 404.
                </div>
              </div>
            )}

            {activeTab === 'followup' && (
              <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text3)', letterSpacing: '2px', marginBottom: '10px' }}>
                    SUGGESTED FOLLOW-UPS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {followUps.map((fq, i) => (
                      <button key={i} onClick={() => !loading && handleFollowUp(fq)}
                        disabled={loading}
                        style={{
                          background: 'rgba(124,92,252,0.06)', border: '1px solid var(--border)',
                          color: 'var(--text2)', padding: '11px 15px', borderRadius: '11px',
                          fontSize: '13px', cursor: 'pointer', textAlign: 'left',
                          display: 'flex', alignItems: 'center', gap: '8px', transition: '.2s',
                        }}>
                        <Zap size={11}/> {fq}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '13px 16px', borderRadius: '13px', fontSize: '14px', outline: 'none' }}
                    placeholder="Ask anything about the extracted data..."
                    value={followInput}
                    onChange={e => setFollowInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleFollowUp(followInput)}
                  />
                  <button onClick={() => handleFollowUp(followInput)}
                    disabled={!followInput.trim()}
                    style={{
                      background: 'var(--accent)', border: 'none', color: '#fff',
                      padding: '0 16px', borderRadius: '13px',
                      cursor: followInput.trim() ? 'pointer' : 'not-allowed',
                      opacity: followInput.trim() ? 1 : 0.5,
                    }}>
                    <Send size={15}/>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'raw' && (
              <div style={{ padding: '18px', maxHeight: '500px', overflow: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text3)', letterSpacing: '2px' }}>
                    RAW SCRAPED FEED — {rawContent.length.toLocaleString()} chars
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => { navigator.clipboard.writeText(rawContent); showToast('Raw feed copied!'); }} style={spBtn}>
                      <Copy size={11}/> Copy Raw
                    </button>
                    <button onClick={() => {
                      const safeQ = (query || 'spider').replace(/[^a-z0-9]+/gi, '_').slice(0, 40);
                      const a = Object.assign(document.createElement('a'), {
                        href: URL.createObjectURL(new Blob([rawContent], { type: 'text/plain' })),
                        download: `spider_raw_${safeQ}_${Date.now()}.txt`,
                      });
                      a.click(); URL.revokeObjectURL(a.href);
                      showToast('Raw feed downloaded!');
                    }} style={spBtn}>
                      <Download size={11}/> Download
                    </button>
                  </div>
                </div>
                <pre style={{ color: '#34d399', fontFamily: "'DM Mono',monospace", fontSize: '11px', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0 }}>
                  {rawContent.slice(0, 20000)}{rawContent.length > 20000 ? '\n\n[... truncated — download full feed above ...]' : ''}
                </pre>
              </div>
            )}

            <div style={{ padding: '11px 22px', background: 'var(--bg2)', borderTop: '1px solid var(--border2)', fontSize: '10px', color: 'var(--text3)', textAlign: 'center', fontStyle: 'italic' }}>
              Live data extracted via Jina AI · Synthesized by {activeModel || 'AI'} · {new Date().toLocaleString()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EMPTY STATE ── */}
      {!result && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', padding: '70px 30px', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, border: '2px solid var(--border)', borderRadius: '50%', animation: 'radarPing 3s ease-out infinite' }}/>
            <Globe size={38} style={{ color: 'var(--border)' }}/>
          </div>
          <p style={{ color: 'var(--text3)', fontSize: '14px', maxWidth: '460px', lineHeight: '1.7' }}>
            Spider awaits. Enter any URL, topic, company, technology, or question to extract live web intelligence.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {['https://openai.com', 'Latest AI research 2025', 'Tesla earnings Q4', 'React vs Vue 2025', 'Elon Musk companies'].map(ex => (
              <button key={ex} onClick={() => setQuery(ex)}
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '7px 15px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', transition: '.2s' }}
                onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text2)'; }}>
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes radarPing { 0%{transform:scale(.3);opacity:.7} 100%{transform:scale(1.5);opacity:0} }
        @keyframes slowSpin  { to { transform: rotate(360deg); } }
        .sp-md-body h1, .sp-md-body h2, .sp-md-body h3 { color: var(--text); font-weight: 800; margin: 24px 0 10px; letter-spacing: -.5px; }
        .sp-md-body h2 { border-bottom: 1px solid var(--border); padding-bottom: 9px; }
        .sp-md-body h3 { color: var(--accent); font-size: 1em; }
        .sp-md-body p { margin-bottom: 12px; color: var(--text2); }
        .sp-md-body strong { color: var(--text); font-weight: 800; }
        .sp-md-body a { color: var(--accent); text-decoration: none; border-bottom: 1px dashed var(--accent); }
        .sp-md-body ul { padding-left: 0; list-style: none; margin-bottom: 14px; }
        .sp-md-body li { padding: 7px 12px 7px 13px; border-left: 2px solid var(--accent); margin-bottom: 5px; color: var(--text2); background: var(--bg3); border-radius: 0 7px 7px 0; }
        .sp-md-body table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
        .sp-md-body th { background: var(--bg3); color: var(--accent); padding: 9px 13px; text-align: left; font-size: 10px; letter-spacing: 1px; border: 1px solid var(--border); }
        .sp-md-body td { padding: 9px 13px; border: 1px solid var(--border2); color: var(--text2); }
        .sp-md-body code { background: var(--bg3); color: var(--accent2); padding: 2px 5px; border-radius: 4px; font-size: 12px; font-family: 'DM Mono',monospace; }
        .sp-md-body pre { background: var(--bg2); border: 1px solid var(--border); border-radius: 11px; padding: 14px; overflow-x: auto; margin: 14px 0; }
        .sp-md-body pre code { background: none; color: var(--text); font-size: 12px; }
        @media (max-width: 900px) {
          .sp-mode-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

const spBtn = { background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '6px 12px', borderRadius: '9px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' };