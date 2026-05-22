import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import {
  Copy, Loader2, ShieldCheck, Flame,
  AlertCircle, Play, RefreshCw, Check, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadText } from '../utils/helpers';

// ── Strip all markdown symbols ────────────────────────────────────────────────
const strip = (t = '') =>
  t.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s?/g, '')
   .replace(/`{1,3}/g, '').replace(/_{1,2}/g, '').replace(/~~.+~~/g, '').trim();

// ── Strength gauge ────────────────────────────────────────────────────────────
const StrengthGauge = ({ score = 0 }) => {
  const color = score < 40 ? '#f87171' : score < 70 ? '#fbbf24' : '#4ade80';
  const label = score < 40 ? 'Weak' : score < 60 ? 'Moderate' : score < 80 ? 'Strong' : 'Elite';
  return (
    <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prompt Strength</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ padding: '3px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800, background: `${color}22`, border: `1px solid ${color}55`, color }}>{label}</span>
          <span style={{ fontSize: 26, fontWeight: 800, color }}>{score}%</span>
        </div>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%`, backgroundColor: color }} transition={{ duration: 1.2, ease: 'easeOut' }} style={{ height: '100%', borderRadius: 4 }} />
      </div>
    </div>
  );
};

// ── Templates ─────────────────────────────────────────────────────────────────
const TEMPLATES = [
  { emoji: '✍️', label: 'Blog post',      prompt: 'Write a blog post about AI tools for small businesses' },
  { emoji: '📧', label: 'Cold email',     prompt: 'Write an email to a potential client for my web design service' },
  { emoji: '💻', label: 'Fix code',       prompt: 'Fix this Python code that is not working' },
  { emoji: '📱', label: 'Instagram post', prompt: 'Write an Instagram caption for my fitness coaching page' },
  { emoji: '📊', label: 'Summarize',      prompt: 'Summarize this long article for me' },
  { emoji: '🎯', label: 'Ad copy',        prompt: 'Write a Facebook ad for my online course about digital marketing' },
];

// ── Main ──────────────────────────────────────────────────────────────────────
const PromptOptimizer = () => {
  const { activeModel, apiKey, providerKeys, customModels, showToast, saveToVault } = useContext(AppContext);

  const [basicPrompt,  setBasicPrompt]  = useState('');
  const [selectedTpl,  setSelectedTpl]  = useState(null); // index of selected template
  const [intensity,    setIntensity]    = useState(70);
  const [loading,      setLoading]      = useState(false);
  const [forgedPrompt, setForgedPrompt] = useState('');
  const [audit,        setAudit]        = useState(null);   // {score, risks[], improvements[], reasoning}
  const [testing,      setTesting]      = useState(false);
  const [testResult,   setTestResult]   = useState('');
  const [testDone,     setTestDone]     = useState(false);
  const [satisfied,    setSatisfied]    = useState(null);
  const [refining,     setRefining]     = useState(false);
  const [refineCount,  setRefineCount]  = useState(0);

  const seed = () => Math.random().toString(36).slice(2, 9).toUpperCase();

  // ── Load template ──────────────────────────────────────────────────────────
  const loadTemplate = (idx) => {
    setSelectedTpl(idx);
    setBasicPrompt(TEMPLATES[idx].prompt);
    setForgedPrompt(''); setAudit(null);
    setTestResult(''); setTestDone(false); setSatisfied(null); setRefineCount(0);
  };

  // ── Forge ──────────────────────────────────────────────────────────────────
  const handleForge = async () => {
    if (!basicPrompt.trim()) { showToast('Enter a prompt first', 'warn'); return; }
    setLoading(true);
    setForgedPrompt(''); setAudit(null);
    setTestResult(''); setTestDone(false); setSatisfied(null); setRefineCount(0);

    const s = seed();
    const intensityLabel = intensity > 85 ? 'MAXIMUM — full framework, multiple constraints, examples, format, persona'
      : intensity > 65 ? 'HEAVY — persona, format spec, constraints, audience'
      : intensity > 40 ? 'STANDARD — role, objective, basic constraints'
      : 'LIGHT — clarity improvement only';

    // Single AI call that returns BOTH the forged prompt AND the audit analysis
    const system = `You are a world-class prompt engineer. Session: ${s}.

TASK: Analyze the given weak prompt and produce two things:
1. An optimized forged prompt
2. A real analysis of what was wrong and what you fixed

INTENSITY: ${intensity}/100 — ${intensityLabel}

Use the CREATE framework:
- Character: specific expert persona for the AI
- Request: crystal clear objective  
- Examples: concrete examples if helpful
- Adjustments: format/length/style constraints
- Type: exact output format specification
- Extras: tone, audience, language

CRITICAL RULES:
- The forged prompt must be PLAIN TEXT — absolutely no asterisks, no ** bold **, no # headers, no markdown
- The weakness and improvement analysis must be SPECIFIC to THIS prompt — not generic
- The score must reflect the actual quality gap between original and forged

OUTPUT FORMAT (follow exactly, no deviations):

===FORGED===
[Your optimized prompt here — plain text, line breaks allowed, no markdown symbols whatsoever]
===END_FORGED===

===ANALYSIS===
SCORE: [0-100 number representing how strong the forged prompt is]
REASONING: [One sentence explaining the score]
WEAK1: [Specific weakness #1 found in the original prompt]
WEAK2: [Specific weakness #2 found in the original prompt]  
WEAK3: [Specific weakness #3 found in the original prompt]
FIX1: [Specific enhancement #1 you applied and why]
FIX2: [Specific enhancement #2 you applied and why]
FIX3: [Specific enhancement #3 you applied and why]
===END_ANALYSIS===`;

    const msg = `Weak prompt to forge: "${basicPrompt}"
Intensity: ${intensity}/100
Session ID: ${s}

Analyze this specific prompt carefully. What exactly is weak about it? What specific improvements will you make at intensity ${intensity}?
Now forge it and provide the full analysis.`;

    try {
      const res = await callAI(system, msg, null, activeModel, apiKey, providerKeys, customModels);

      // Parse forged prompt
      const forgedMatch = res.match(/===FORGED===([\s\S]*?)===END_FORGED===/);
      let forged = forgedMatch ? strip(forgedMatch[1]) : strip(res.split('===ANALYSIS===')[0]);
      if (!forged) forged = strip(res);
      setForgedPrompt(forged);

      // Parse analysis — everything is AI-generated and prompt-specific
      const analysisMatch = res.match(/===ANALYSIS===([\s\S]*?)===END_ANALYSIS===/);
      if (analysisMatch) {
        const a = analysisMatch[1];
        const scoreMatch = a.match(/SCORE:\s*(\d+)/);
        const reasoning  = a.match(/REASONING:\s*(.+)/)?.[1]?.trim() || '';
        const weak1  = a.match(/WEAK1:\s*(.+)/)?.[1]?.trim() || '';
        const weak2  = a.match(/WEAK2:\s*(.+)/)?.[1]?.trim() || '';
        const weak3  = a.match(/WEAK3:\s*(.+)/)?.[1]?.trim() || '';
        const fix1   = a.match(/FIX1:\s*(.+)/)?.[1]?.trim() || '';
        const fix2   = a.match(/FIX2:\s*(.+)/)?.[1]?.trim() || '';
        const fix3   = a.match(/FIX3:\s*(.+)/)?.[1]?.trim() || '';
        setAudit({
          score:        parseInt(scoreMatch?.[1] || '78'),
          reasoning,
          risks:        [weak1, weak2, weak3].filter(Boolean),
          improvements: [fix1,  fix2,  fix3 ].filter(Boolean),
        });
      }

      saveToVault?.('Prompt Optimizer', `Forged: ${basicPrompt.slice(0, 40)}`, forged);
    } catch (e) {
      setForgedPrompt('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Test ───────────────────────────────────────────────────────────────────
  const handleTest = async () => {
    if (!forgedPrompt.trim()) return;
    setTesting(true); setTestResult(''); setTestDone(false); setSatisfied(null);
    try {
      const res = await callAI('You are a helpful AI assistant. Follow the user prompt precisely.', forgedPrompt, null, activeModel, apiKey, providerKeys, customModels);
      setTestResult(strip(res));
      setTestDone(true);
    } catch (e) {
      setTestResult('Error: ' + e.message);
      setTestDone(true);
    } finally {
      setTesting(false); }
  };

  // ── Refine ─────────────────────────────────────────────────────────────────
  const handleRefine = async () => {
    setRefining(true); setSatisfied(null); setTestResult(''); setTestDone(false);
    const angles = ['Make output format crystal clear with a concrete example.', 'Strengthen the AI persona with specific domain expertise.', 'Add explicit success criteria — what does perfect output look like?', 'Add anti-hallucination guardrails and specific constraints.', 'Make instructions more actionable with step-by-step structure.'];
    const angle = angles[Math.floor(Math.random() * angles.length)];
    const s = seed();
    try {
      const res = await callAI(
        `You are a prompt refinement expert. Session: ${s}. The user is NOT satisfied. Refine angle: ${angle}. Output ONLY the improved prompt as plain text. No asterisks. No markdown. No bold. No symbols. Just clean text with line breaks.`,
        `Original weak prompt: "${basicPrompt}"\nCurrent forged prompt: "${forgedPrompt}"\nRefinement #${refineCount + 1}. Make it significantly better.`,
        null, activeModel, apiKey, providerKeys, customModels
      );
      setForgedPrompt(strip(res));
      setRefineCount(c => c + 1);
      showToast(`Refined! Version ${refineCount + 1} ready — run test again.`);
    } catch (e) { showToast('Refine error', 'error'); }
    finally { setRefining(false); }
  };

  const handleSatisfied = (yes) => {
    setSatisfied(yes);
    if (yes) { saveToVault?.('Prompt Optimizer', `Approved: ${basicPrompt.slice(0, 40)}`, forgedPrompt); showToast('Saved to Vault!'); }
    else handleRefine();
  };

  const resetAll = () => {
    setBasicPrompt(''); setSelectedTpl(null); setForgedPrompt(''); setAudit(null);
    setTestResult(''); setTestDone(false); setSatisfied(null); setRefineCount(0);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page active">
      <div className="section-header">
        <h2 className="section-title">
          <Flame size={20} style={{ color: '#a78bfa', marginRight: 8, verticalAlign: 'middle' }} />
          The Forge
          <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 500, color: '#a78bfa', verticalAlign: 'middle' }}>Prompt Optimizer</span>
        </h2>
        <div className="section-sub">Turn weak prompts into elite AI instructions. Test live. Refine until perfect.</div>
      </div>

      {/* ── Template buttons ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
          Quick examples — click to load
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TEMPLATES.map((t, i) => {
            const isSelected = selectedTpl === i;
            return (
              <button key={i} onClick={() => loadTemplate(i)} style={{
                padding: '8px 16px', borderRadius: 22, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                background: isSelected ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.08)',
                border: `1.5px solid ${isSelected ? '#a78bfa' : 'rgba(255,255,255,0.2)'}`,
                color: isSelected ? '#c4b5fd' : 'rgba(255,255,255,0.8)',
                boxShadow: isSelected ? '0 0 12px rgba(167,139,250,0.3)' : 'none',
              }}>
                {t.emoji} {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Input card ── */}
      <div className="tool-card" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label className="form-label">Your weak / basic prompt</label>
          <textarea
            className="form-textarea" rows="4"
            placeholder="Type your basic prompt here... e.g. 'write a blog post about AI'"
            value={basicPrompt}
            onChange={e => { setBasicPrompt(e.target.value); setSelectedTpl(null); }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Forge Intensity:&nbsp;
            <span style={{ color: '#a78bfa', fontWeight: 700 }}>{intensity}%</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400, marginLeft: 8 }}>
              {intensity < 35 ? '— Light polish' : intensity < 65 ? '— Standard forge' : intensity < 85 ? '— Heavy engineering' : '— Maximum power'}
            </span>
          </label>
          <input type="range" min="1" max="100" value={intensity} onChange={e => setIntensity(+e.target.value)} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
            <span>Light</span><span>Standard</span><span>Heavy</span><span>Maximum</span>
          </div>
        </div>

        <button className="btn-generate" onClick={handleForge} disabled={loading}
          style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}>
          {loading ? <><Loader2 className="animate-spin" /> Forging...</> : <><Flame size={16} /> Forge This Prompt</>}
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="tool-card" style={{ textAlign: 'center', padding: '28px 20px' }}>
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.4, repeat: Infinity }} style={{ display: 'inline-block', marginBottom: 12 }}>
            <Flame size={36} color="#a78bfa" />
          </motion.div>
          <div className="loading-shimmer" style={{ width: '80%', margin: '0 auto 8px' }} />
          <div className="loading-shimmer" style={{ width: '60%', margin: '0 auto 8px' }} />
          <div className="loading-shimmer" style={{ width: '70%', margin: '0 auto' }} />
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 12 }}>
            Analyzing your prompt and forging a better version...
          </p>
        </div>
      )}

      {/* ── Results ── */}
      <AnimatePresence>
        {forgedPrompt && !loading && (
          <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

            {/* Strength gauge */}
            {audit && <StrengthGauge score={audit.score} />}

            {/* AI reasoning */}
            {audit?.reasoning && (
              <div style={{
                padding: '10px 16px', marginBottom: 14, borderRadius: 10,
                background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)',
                fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6,
              }}>
                💡 {audit.reasoning}
              </div>
            )}

            {/* Audit grid — 100% AI generated */}
            {audit && (audit.risks?.length > 0 || audit.improvements?.length > 0) && (
              <div className="po-audit-grid">
                <div style={{ padding: '14px 16px', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={12} /> Weaknesses Found
                  </div>
                  {audit.risks.map((r, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 8, lineHeight: 1.55 }}>
                      <span style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }}>◈</span>{r}
                    </div>
                  ))}
                </div>
                <div style={{ padding: '14px 16px', background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={12} /> Enhancements Applied
                  </div>
                  {audit.improvements.map((im, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 8, lineHeight: 1.55 }}>
                      <span style={{ color: '#4ade80', flexShrink: 0, marginTop: 1 }}>✓</span>{im}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Refined badge */}
            {refineCount > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 20, marginBottom: 12, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', fontSize: 11, fontWeight: 700, color: '#a78bfa' }}>
                <RefreshCw size={11} /> Refined {refineCount} time{refineCount > 1 ? 's' : ''}
              </div>
            )}

            {/* Forged prompt — PLAIN TEXT */}
            <div style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(167,139,250,0.35)', borderLeft: '3px solid #a78bfa', borderRadius: 12, padding: '20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  ⚡ Forged Prompt — Ready to use
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-copy" onClick={() => { downloadText(forgedPrompt, 'forged_prompt.txt'); showToast('Downloaded!'); }}>
                    <Download size={13} /> Download
                  </button>
                  <button className="btn-copy" onClick={() => { navigator.clipboard.writeText(forgedPrompt); showToast('Copied!'); }}>
                    <Copy size={13} /> Copy
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--text)', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {forgedPrompt}
              </div>
            </div>

            {/* Test This Prompt */}
            <div style={{ background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.22)', borderRadius: 14, padding: '18px 20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Play size={15} /> Test This Prompt Live
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
                    Run the forged prompt through AI — see actual output instantly
                  </div>
                </div>
                <button onClick={handleTest} disabled={testing} style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '9px 22px', borderRadius: 10,
                  background: 'rgba(96,165,250,0.15)', border: '1.5px solid rgba(96,165,250,0.45)',
                  color: '#60a5fa', fontSize: 13, fontWeight: 700, cursor: testing ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                }}>
                  {testing ? <><Loader2 size={14} className="animate-spin" /> Running...</> : <><Play size={14} /> Run Test</>}
                </button>
              </div>

              {testing && (
                <div>
                  <div className="loading-shimmer" style={{ width: '85%', marginBottom: 8 }} />
                  <div className="loading-shimmer" style={{ width: '65%', marginBottom: 8 }} />
                  <div className="loading-shimmer" style={{ width: '75%' }} />
                </div>
              )}

              {testResult && !testing && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div style={{
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '14px 16px', marginBottom: 14,
                    fontSize: 13, lineHeight: 1.8, color: 'var(--text)',
                    whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto', fontFamily: 'inherit',
                  }}>
                    {testResult}
                  </div>

                  {testDone && satisfied === null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>Satisfied with this result?</span>
                      <button onClick={() => handleSatisfied(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, background: 'rgba(74,222,128,0.12)', border: '1.5px solid rgba(74,222,128,0.4)', color: '#4ade80', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        <Check size={14} /> Yes — Save to Vault
                      </button>
                      <button onClick={() => handleSatisfied(false)} disabled={refining} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, background: 'rgba(249,115,22,0.12)', border: '1.5px solid rgba(249,115,22,0.4)', color: '#fb923c', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {refining ? <><Loader2 size={13} className="animate-spin" /> Refining...</> : <><RefreshCw size={13} /> No — Refine More</>}
                      </button>
                    </div>
                  )}

                  {satisfied === true && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 8, background: 'rgba(74,222,128,0.1)', border: '1.5px solid rgba(74,222,128,0.35)', fontSize: 13, fontWeight: 700, color: '#4ade80' }}>
                      <Check size={14} /> Perfect prompt saved to Vault!
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>

            <button onClick={resetAll} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
              <RefreshCw size={12} /> Start over
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PromptOptimizer;