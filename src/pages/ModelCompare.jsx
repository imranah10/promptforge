import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useContext, useMemo, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { Zap, Loader2, GitCompare, Copy, Check, Trophy, Clock, Hash, DollarSign, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_MODELS, PROVIDERS } from '../utils/models';

// ── COST ESTIMATES per 1K tokens (approx) ────────────────────────────────────
const COST_MAP = {
  'gpt-4o': 0.005, 'gpt-4o-mini': 0.00015, 'gpt-4-turbo': 0.01,
  'claude-3-5-sonnet': 0.003, 'claude-3-haiku': 0.00025, 'claude-3-opus': 0.015,
  'gemini-1.5-pro': 0.00125, 'gemini-1.5-flash': 0.000075,
  'llama': 0, 'mistral': 0.001, 'deepseek': 0.00014,
  'free': 0,
};

const getCost = (modelId, tokens) => {
  const k = Object.keys(COST_MAP).find(k => modelId.toLowerCase().includes(k));
  const rate = k !== undefined ? COST_MAP[k] : 0;
  return ((tokens / 1000) * rate).toFixed(5);
};

const estimateTokens = (text) => Math.ceil((text || '').length / 4);

// ── WINNER BADGE ──────────────────────────────────────────────────────────────
const WinnerBadge = ({ winner }) => {
  if (!winner) return null;
  const isA = winner === 'A';
  const isTie = winner === 'TIE';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      background: isTie ? 'rgba(251,191,36,0.15)' : isA ? 'rgba(124,92,252,0.15)' : 'rgba(52,211,153,0.15)',
      border: `1px solid ${isTie ? '#fbbf24' : isA ? 'var(--accent)' : '#34d399'}`,
      color: isTie ? '#fbbf24' : isA ? 'var(--accent)' : '#34d399',
      padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 800,
    }}>
      <Trophy size={12} />
      {isTie ? 'TIE' : `MODEL ${winner} WINS`}
    </div>
  );
};

// ── METRIC BADGE ──────────────────────────────────────────────────────────────
const MetricBadge = ({ icon, label, value, color = 'var(--text2)' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color, background: 'var(--bg3)', padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--border)' }}>
    {icon} <span style={{ color: 'var(--text2)' }}>{label}:</span> <strong style={{ color }}>{value}</strong>
  </div>
);

// ── QUICK PROMPTS ─────────────────────────────────────────────────────────────
const QUICK = [
  'Explain quantum computing in 3 sentences',
  'Write a haiku about artificial intelligence',
  'What is the best programming language in 2025 and why?',
  'Give me 5 startup ideas in the health tech space',
  'Explain the difference between machine learning and deep learning',
];

// ── MAIN ──────────────────────────────────────────────────────────────────────
const ModelCompare = () => {
  const { apiKey, providerKeys, customModels, showToast, activeModel } = useContext(AppContext);
  const allModels = useMemo(() => [...ALL_MODELS, ...customModels], [customModels]);

  const groupedModels = useMemo(() => {
    const groups = {};
    groups['openrouter-free'] = { name: '🌌 OpenRouter (Free)', models: [] };
    PROVIDERS.forEach(p => { groups[p.id] = { name: p.name, models: [] }; });
    groups['custom'] = { name: '🛠️ Custom Models', models: [] };
    allModels.forEach(m => {
      if (customModels.find(c => c.id === m.id)) groups.custom.models.push(m);
      else if (m.provider === 'openrouter' && m.tier === 'free') groups['openrouter-free'].models.push(m);
      else if (groups[m.provider]) groups[m.provider].models.push(m);
    });
    return Object.entries(groups).filter(([_, d]) => d.models.length > 0).map(([key, data]) => ({ key, ...data }));
  }, [allModels, customModels]);

  const [prompt,  setPrompt]  = useState('');
  const [modelA,  setModelA]  = useState(activeModel || 'openrouter:meta-llama/llama-3.3-70b-instruct:free');
  const [modelB,  setModelB]  = useState('llama-3.3-70b-versatile');
  const [loading, setLoading] = useState(false);
  const [resultA, setResultA] = useState('');
  const [resultB, setResultB] = useState('');
  const [verdict, setVerdict] = useState('');
  const [winner,  setWinner]  = useState(null);    // 'A' | 'B' | 'TIE'
  const [timeA,   setTimeA]   = useState(null);
  const [timeB,   setTimeB]   = useState(null);
  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);
  const cancelRef = useRef(false);

  const getModelName = (id) => allModels.find(m => m.id === id)?.name || id.split(':').pop();

  const handleGenerate = async () => {
    if (!prompt.trim()) { showToast('Enter a prompt to compare', 'error'); return; }
    cancelRef.current = false;
    setLoading(true);
    setResultA(''); setResultB(''); setVerdict(''); setWinner(null);
    setTimeA(null); setTimeB(null);

    const system = 'You are a helpful, accurate, and thoughtful AI assistant. Provide high-quality, well-structured responses.';

    try {
      const startA = Date.now();
      const startB = Date.now();

      const [resA, resB] = await Promise.allSettled([
        callAI(system, prompt, modelA, null, apiKey, providerKeys, customModels).then(r => { setTimeA(Date.now() - startA); return r; }),
        callAI(system, prompt, modelB, null, apiKey, providerKeys, customModels).then(r => { setTimeB(Date.now() - startB); return r; }),
      ]);

      if (cancelRef.current) return;

      const textA = resA.status === 'fulfilled' ? resA.value : `❌ Error: ${resA.reason?.message || 'Failed'}`;
      const textB = resB.status === 'fulfilled' ? resB.value : `❌ Error: ${resB.reason?.message || 'Failed'}`;
      setResultA(textA);
      setResultB(textB);

      // AI Judge verdict
      if (resA.status === 'fulfilled' && resB.status === 'fulfilled') {
        try {
          const judgeSystem = `You are an expert AI evaluator. Analyze two AI responses and provide a fair verdict. Be specific and concise.

RESPONSE FORMAT (follow exactly):
WINNER: [A or B or TIE]
REASONING: [2-3 sentences explaining which response is better and why]
MODEL_A_STRENGTHS: [1-2 specific strengths of Response A]
MODEL_B_STRENGTHS: [1-2 specific strengths of Response B]
RECOMMENDATION: [One sentence on which model to use for this type of task]`;

          const judgePrompt = `PROMPT: "${prompt}"

RESPONSE A (${getModelName(modelA)}):
${textA.substring(0, 800)}

RESPONSE B (${getModelName(modelB)}):
${textB.substring(0, 800)}

Evaluate both responses fairly on: accuracy, completeness, clarity, and usefulness.`;

          const v = await callAI(judgeSystem, judgePrompt, modelA, null, apiKey, providerKeys, customModels);
          setVerdict(v);

          // Parse winner
          const winnerMatch = v.match(/WINNER:\s*(A|B|TIE)/i);
          if (winnerMatch) setWinner(winnerMatch[1].toUpperCase());
        } catch (ve) {
          console.warn('Verdict error (non-critical):', ve.message);
        }
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

  const renderDropdown = (val, setVal) => (
    <select
      value={val}
      onChange={e => setVal(e.target.value)}
      style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 14px', borderRadius: '12px', fontSize: '13px', outline: 'none', width: '100%', cursor: 'pointer' }}
    >
      {groupedModels.map(group => (
        <optgroup key={group.key} label={group.name}>
          {group.models.map(m => (
            <option key={`${group.key}-${m.id}`} value={m.id}>{m.name}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );

  const tokensA = estimateTokens(resultA);
  const tokensB = estimateTokens(resultB);

  return (
    <div style={{ padding: '40px', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', boxSizing: 'border-box' }}>

      {/* HEADER */}
      <div style={{ borderLeft: '4px solid var(--accent)', paddingLeft: '20px', marginBottom: '36px' }}>
        <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '4px', marginBottom: '8px' }}>
          ⚖️ AI MODEL ARENA
        </div>
        <h2 style={{ fontSize: '34px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-1.5px', margin: 0 }}>
          Model <span style={{ color: 'var(--accent)' }}>Compare</span>
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '6px' }}>
          Run any prompt on 2 models simultaneously. Get response time, token count, cost estimate, and an AI judge verdict.
        </p>
      </div>

      {/* MODEL SELECTOR + PROMPT */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px', marginBottom: '24px', backdropFilter: 'blur(12px)' }}>

        {/* Model pickers */}
        <div className="mc-picker-grid">
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text3)', letterSpacing: '2px', marginBottom: '8px' }}>MODEL A</div>
            {renderDropdown(modelA, setModelA)}
          </div>
          <div style={{ fontSize: '18px', color: 'var(--accent)', fontWeight: 900, textAlign: 'center' }}>VS</div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text3)', letterSpacing: '2px', marginBottom: '8px' }}>MODEL B</div>
            {renderDropdown(modelB, setModelB)}
          </div>
        </div>

        {/* Quick prompts */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {QUICK.map((q, i) => (
            <button key={i} onClick={() => setPrompt(q)}
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', transition: '.2s', fontWeight: 600 }}
              onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text2)'; }}>
              {q.length > 40 ? q.slice(0, 40) + '…' : q}
            </button>
          ))}
        </div>

        {/* Prompt input */}
        <textarea
          rows={4}
          placeholder="Enter your prompt here — both models will answer simultaneously..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleGenerate(); }}
          style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '14px 16px', borderRadius: '14px', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box', marginBottom: '16px' }}
        />

        <button onClick={handleGenerate} disabled={loading}
          style={{ width: '100%', padding: '16px', background: 'var(--accent)', border: 'none', borderRadius: '14px', color: '#fff', fontSize: '15px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 25px rgba(124,92,252,0.3)' }}>
          {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }}/> Comparing Models...</> : <><GitCompare size={18}/> Compare Both Models</>}
        </button>
      </div>

      {/* RESULTS GRID */}
      <AnimatePresence>
        {(resultA || resultB || loading) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

            {/* Winner banner */}
            {winner && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', marginBottom: '20px', padding: '16px', background: 'rgba(124,92,252,0.05)', border: '1px solid rgba(124,92,252,0.15)', borderRadius: '16px' }}>
                <WinnerBadge winner={winner} />
              </motion.div>
            )}

            <div className="mc-results-grid">
              {[
                { label: 'A', model: modelA, result: resultA, time: timeA, tokens: tokensA, copied: copiedA, setCopied: setCopiedA, color: 'var(--accent)', isWinner: winner === 'A' },
                { label: 'B', model: modelB, result: resultB, time: timeB, tokens: tokensB, copied: copiedB, setCopied: setCopiedB, color: '#34d399', isWinner: winner === 'B' },
              ].map(({ label, model, result, time, tokens, copied, setCopied, color, isWinner }) => (
                <div key={label} style={{ background: 'var(--card)', border: `2px solid ${isWinner ? color : 'var(--border)'}`, borderRadius: '18px', overflow: 'hidden', transition: 'border-color .3s', boxShadow: isWinner ? `0 0 30px ${color}20` : 'none', backdropFilter: 'blur(16px)' }}>

                  {/* Card header */}
                  <div style={{ background: `${color}10`, padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text3)', letterSpacing: '2px' }}>MODEL {label}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginTop: '2px' }}>{getModelName(model)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {time && <MetricBadge icon={<Clock size={10}/>} label="Time" value={`${(time/1000).toFixed(1)}s`} color="#38bdf8"/>}
                      {tokens > 0 && <MetricBadge icon={<Hash size={10}/>} label="~Tokens" value={tokens} color="#a78bfa"/>}
                      {tokens > 0 && <MetricBadge icon={<DollarSign size={10}/>} label="~Cost" value={`$${getCost(model, tokens)}`} color="#34d399"/>}
                      {isWinner && <div style={{ fontSize: '11px', fontWeight: 800, color, background: `${color}15`, border: `1px solid ${color}40`, padding: '3px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}><Trophy size={10}/> WINNER</div>}
                    </div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '20px', maxHeight: '500px', overflowY: 'auto', fontSize: '14px', lineHeight: 1.75, color: 'var(--text)' }} className="mc-md-body">
                    {loading && !result ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[85, 65, 90, 55, 75].map((w, i) => (
                          <div key={i} style={{ height: '12px', background: 'var(--border2)', borderRadius: '5px', width: `${w}%`, animation: `shimmer 1.5s ${i * 0.1}s infinite` }}/>
                        ))}
                      </div>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                    )}
                  </div>

                  {/* Copy button */}
                  {result && (
                    <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => copy(result, setCopied)}
                        style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: copied ? '#34d399' : 'var(--text2)', padding: '6px 14px', borderRadius: '9px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}>
                        {copied ? <><Check size={12}/> Copied!</> : <><Copy size={12}/> Copy Response</>}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* AI Judge Verdict */}
            {verdict && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
                <div style={{ background: 'rgba(124,92,252,0.06)', padding: '14px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Trophy size={13}/> AI JUDGE VERDICT
                  </div>
                  <WinnerBadge winner={winner}/>
                </div>
                <div style={{ padding: '22px', fontSize: '14px', lineHeight: 1.75, color: 'var(--text)' }} className="mc-md-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {verdict.replace(/WINNER:.*\n?/, '').replace(/^MODEL_[AB]_STRENGTHS:/gm, '**Strengths:**').replace(/^REASONING:/m, '**Analysis:**\n').replace(/^RECOMMENDATION:/m, '\n**Recommendation:**\n')}
                  </ReactMarkdown>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!resultA && !resultB && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
          <GitCompare size={48} style={{ marginBottom: '16px', opacity: 0.3 }}/>
          <p style={{ fontSize: '14px', color: 'var(--text2)', maxWidth: '420px', margin: '0 auto', lineHeight: 1.7 }}>
            Select two models, type any prompt, and click Compare. You'll see both responses side-by-side with timing, token count, estimated cost, and an AI judge verdict.
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{opacity:.06} 50%{opacity:.14} 100%{opacity:.06} }
        .mc-md-body h1,.mc-md-body h2,.mc-md-body h3{color:var(--accent);font-weight:800;margin:14px 0 7px;letter-spacing:-.5px}
        .mc-md-body p{margin-bottom:9px;color:var(--text)}
        .mc-md-body strong{color:var(--accent);font-weight:800}
        .mc-md-body code{background:var(--border2);color:var(--accent);padding:2px 6px;border-radius:4px;font-family:'DM Mono',monospace;font-size:12px}
        .mc-md-body pre{background:var(--bg3);border:1px solid var(--border);border-radius:9px;padding:12px;overflow-x:auto;margin:10px 0}
        .mc-md-body pre code{background:none;color:var(--text)}
        .mc-md-body ul,.mc-md-body ol{padding-left:18px;margin-bottom:9px}
        .mc-md-body li{margin-bottom:4px;color:var(--text)}
        .mc-md-body table{width:100%;border-collapse:collapse;margin:12px 0;font-size:13px}
        .mc-md-body th{background:rgba(124,92,252,.1);color:var(--accent);padding:7px 12px;text-align:left;font-size:10px;letter-spacing:1px;border:1px solid var(--border)}
        .mc-md-body td{padding:7px 12px;border:1px solid var(--border);color:var(--text)}
      `}</style>
    </div>
  );
};

export default ModelCompare;