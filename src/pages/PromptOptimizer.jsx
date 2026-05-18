import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import {
  Copy, Loader2, ShieldCheck,
  Flame, AlertCircle, Play, RefreshCw,
  Check, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadText } from '../utils/helpers';

// ─── STRENGTH GAUGE ───────────────────────────────────────────────────────────
const StrengthGauge = ({ score = 0 }) => {
  const color = score < 40 ? '#f87171' : score < 70 ? '#fbbf24' : '#4ade80';
  const label = score < 40 ? 'Weak' : score < 60 ? 'Moderate' : score < 80 ? 'Strong' : 'Elite';
  return (
    <div style={{
      padding: '16px 20px', background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, marginBottom: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Prompt Strength
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            padding: '2px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800,
            background: `${color}18`, border: `1px solid ${color}40`, color,
          }}>{label}</span>
          <span style={{ fontSize: 22, fontWeight: 800, color }}>{score}%</span>
        </div>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%`, backgroundColor: color }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 4 }}
        />
      </div>
    </div>
  );
};

// ─── QUICK TEMPLATES ──────────────────────────────────────────────────────────
const TEMPLATES = [
  { label: '✍️ Blog post',      prompt: 'Write a blog post about AI tools for small businesses' },
  { label: '📧 Cold email',     prompt: 'Write an email to a potential client for my web design service' },
  { label: '💻 Fix code',       prompt: 'Fix this Python code that is not working' },
  { label: '📱 Instagram post', prompt: 'Write an Instagram caption for my fitness coaching page' },
  { label: '📊 Summarize',      prompt: 'Summarize this long article for me' },
  { label: '🎯 Ad copy',        prompt: 'Write a Facebook ad for my online course about digital marketing' },
];

// ─── STRIP MARKDOWN ───────────────────────────────────────────────────────────
const stripMarkdown = (text) =>
  text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/`{1,3}/g, '')
    .replace(/_{1,2}/g, '')
    .trim();

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const PromptOptimizer = () => {
  const { activeModel, apiKey, providerKeys, customModels, showToast, saveToVault } = useContext(AppContext);

  const [basicPrompt,  setBasicPrompt]  = useState('');
  const [intensity,    setIntensity]    = useState(70);
  const [loading,      setLoading]      = useState(false);
  const [forgedPrompt, setForgedPrompt] = useState('');
  const [audit,        setAudit]        = useState(null);
  const [testing,      setTesting]      = useState(false);
  const [testResult,   setTestResult]   = useState('');
  const [testDone,     setTestDone]     = useState(false);
  const [satisfied,    setSatisfied]    = useState(null);
  const [refining,     setRefining]     = useState(false);
  const [refineCount,  setRefineCount]  = useState(0);

  const randomSeed = () => Math.random().toString(36).slice(2, 8).toUpperCase();

  // ── FORGE ─────────────────────────────────────────────────────────────────
  const handleForge = async () => {
    if (!basicPrompt.trim()) { showToast('Enter a prompt to optimize', 'warn'); return; }
    setLoading(true);
    setForgedPrompt(''); setAudit(null);
    setTestResult(''); setTestDone(false); setSatisfied(null); setRefineCount(0);

    const seed = randomSeed();
    const focusOptions = [
      'Focus on adding a strong AI persona and clear role definition.',
      'Focus on adding concrete output format and length constraints.',
      'Focus on adding examples and step-by-step reasoning chains.',
      'Focus on anti-hallucination techniques and factual grounding.',
      'Focus on audience targeting and tone specification.',
    ];
    const focus = focusOptions[Math.floor(Math.random() * focusOptions.length)];

    const intensityDesc = intensity > 85
      ? 'Maximum: add full framework, multiple constraints, examples, format requirements, persona'
      : intensity > 65
      ? 'Heavy: add persona, format, key constraints, and output specification'
      : intensity > 40
      ? 'Standard: add role, clear objective, and basic format guidance'
      : 'Light: add clarity and one key constraint only';

    const system = `You are a world-class prompt engineer. Session ID: ${seed}.
Your task: Transform the given weak prompt into a precise, powerful prompt.

Framework to use (CREATE):
- Character: Give the AI a specific expert persona
- Request: Make the objective crystal clear
- Examples: Add 1-2 concrete examples if helpful
- Adjustments: Add format, length, style constraints
- Type: Specify exact output format expected
- Extras: Add tone, audience, language if relevant

Intensity guidance: ${intensityDesc}
Special focus this session: ${focus}

OUTPUT FORMAT - YOU MUST FOLLOW THIS EXACTLY:

===FORGED_PROMPT===
[Write the complete optimized prompt here. 
Use plain text only. 
No asterisks. No markdown symbols. No bold. No hashtags.
Use line breaks and spacing to organize.
Write naturally as a human would write instructions.]
===END_PROMPT===

===AUDIT===
SCORE: [number between 0 and 100]
WEAKNESS_1: [specific weakness found in original]
WEAKNESS_2: [specific weakness found in original]
WEAKNESS_3: [specific weakness found in original]
IMPROVEMENT_1: [specific enhancement you added]
IMPROVEMENT_2: [specific enhancement you added]
IMPROVEMENT_3: [specific enhancement you added]
===END_AUDIT===`;

    const userMsg = `Weak prompt: "${basicPrompt}"
Intensity level: ${intensity}/100
Session: ${seed}

Forge this prompt now. Follow the output format exactly.`;

    try {
      const res = await callAI(system, userMsg, null, activeModel, apiKey, providerKeys, customModels);

      // Parse forged prompt
      let forged = '';
      const promptMatch = res.match(/===FORGED_PROMPT===([\s\S]*?)===END_PROMPT===/);
      if (promptMatch) {
        forged = stripMarkdown(promptMatch[1].trim());
      } else {
        // Fallback
        const lines = res.split('\n');
        const startIdx = lines.findIndex(l => l.includes('FORGED') || l.includes('Forged') || l.includes('Enhanced'));
        if (startIdx !== -1) {
          forged = stripMarkdown(lines.slice(startIdx + 1, startIdx + 15).join('\n').trim());
        } else {
          forged = stripMarkdown(res.split('===AUDIT===')[0].trim());
        }
      }
      setForgedPrompt(forged || stripMarkdown(res));

      // Parse audit
      const auditMatch = res.match(/===AUDIT===([\s\S]*?)===END_AUDIT===/);
      if (auditMatch) {
        const auditText = auditMatch[1];
        const scoreMatch = auditText.match(/SCORE:\s*(\d+)/);
        const weaknesses = [
          auditText.match(/WEAKNESS_1:\s*(.+)/)?.[1]?.trim(),
          auditText.match(/WEAKNESS_2:\s*(.+)/)?.[1]?.trim(),
          auditText.match(/WEAKNESS_3:\s*(.+)/)?.[1]?.trim(),
        ].filter(Boolean);
        const improvements = [
          auditText.match(/IMPROVEMENT_1:\s*(.+)/)?.[1]?.trim(),
          auditText.match(/IMPROVEMENT_2:\s*(.+)/)?.[1]?.trim(),
          auditText.match(/IMPROVEMENT_3:\s*(.+)/)?.[1]?.trim(),
        ].filter(Boolean);
        setAudit({
          score: parseInt(scoreMatch?.[1] || '75'),
          risks: weaknesses,
          improvements,
        });
      }

      saveToVault?.('Prompt Optimizer', `Forged: ${basicPrompt.substring(0, 40)}`, forged);
    } catch (e) {
      setForgedPrompt('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── TEST PROMPT ───────────────────────────────────────────────────────────
  const handleTest = async () => {
    if (!forgedPrompt.trim()) return;
    setTesting(true); setTestResult(''); setTestDone(false); setSatisfied(null);
    try {
      const res = await callAI(
        'You are a helpful AI assistant. Follow the user prompt precisely and completely.',
        forgedPrompt,
        null, activeModel, apiKey, providerKeys, customModels
      );
      setTestResult(stripMarkdown(res));
      setTestDone(true);
    } catch (e) {
      setTestResult('Error: ' + e.message);
      setTestDone(true);
    } finally {
      setTesting(false);
    }
  };

  // ── REFINE ────────────────────────────────────────────────────────────────
  const handleRefine = async () => {
    if (!forgedPrompt) return;
    setRefining(true); setSatisfied(null); setTestResult(''); setTestDone(false);

    const seed = randomSeed();
    const refineAngles = [
      'Make it more specific with concrete constraints and exact output format.',
      'Add a stronger AI persona and more detailed role definition.',
      'Add 1-2 concrete examples to illustrate what good output looks like.',
      'Add anti-hallucination guardrails and fact-checking instructions.',
      'Make the success criteria crystal clear — what does perfect output look like?',
    ];
    const angle = refineAngles[Math.floor(Math.random() * refineAngles.length)];

    const system = `You are a prompt optimization expert. Session: ${seed}.
The user tested a prompt and was NOT satisfied. Make it significantly better.
Refine angle: ${angle}
Output ONLY the improved prompt as plain text. No asterisks. No markdown. No bold symbols. No hashtags. Just clean, well-structured text using line breaks.`;

    try {
      const res = await callAI(system,
        `Original weak prompt: "${basicPrompt}"\nCurrent prompt (not satisfying): "${forgedPrompt}"\nIteration: ${refineCount + 1}\nMake it better. Plain text only.`,
        null, activeModel, apiKey, providerKeys, customModels
      );
      setForgedPrompt(stripMarkdown(res));
      setRefineCount(c => c + 1);
      showToast(`Refined! Version ${refineCount + 1} ready — run test again.`);
    } catch (e) {
      showToast('Refine error. Try again.', 'error');
    } finally {
      setRefining(false);
    }
  };

  const handleSatisfied = (yes) => {
    setSatisfied(yes);
    if (yes) {
      saveToVault?.('Prompt Optimizer', `Approved: ${basicPrompt.substring(0, 40)}`, forgedPrompt);
      showToast('Saved to Vault!');
    } else {
      handleRefine();
    }
  };

  const resetAll = () => {
    setForgedPrompt(''); setAudit(null); setBasicPrompt('');
    setTestResult(''); setTestDone(false); setSatisfied(null); setRefineCount(0);
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="page active">
      <div className="section-header">
        <h2 className="section-title">
          <Flame size={20} style={{ color: '#a78bfa', marginRight: 8, verticalAlign: 'middle' }} />
          The Forge
          <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 500, color: '#a78bfa', verticalAlign: 'middle' }}>
            Prompt Optimizer
          </span>
        </h2>
        <div className="section-sub">Turn weak prompts into elite AI instructions. Test live. Refine until perfect.</div>
      </div>

      {/* Quick templates */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
          Quick examples — click to load
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TEMPLATES.map((t, i) => (
            <button key={i} onClick={() => setBasicPrompt(t.prompt)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#a78bfa'; e.currentTarget.style.color = '#a78bfa'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="tool-card" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label className="form-label">Your weak / basic prompt</label>
          <textarea
            className="form-textarea" rows="4"
            placeholder="Type your basic prompt here... e.g. 'write a blog post about AI'"
            value={basicPrompt}
            onChange={e => setBasicPrompt(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Forge Intensity:&nbsp;
            <span style={{ color: '#a78bfa', fontWeight: 700 }}>{intensity}%</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400, marginLeft: 8 }}>
              {intensity < 35 ? '— Light polish' : intensity < 65 ? '— Standard forge' : intensity < 85 ? '— Heavy engineering' : '— Maximum power'}
            </span>
          </label>
          <input type="range" min="1" max="100" value={intensity} onChange={e => setIntensity(+e.target.value)} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
            <span>Light</span><span>Standard</span><span>Heavy</span><span>Maximum</span>
          </div>
        </div>

        <button className="btn-generate" onClick={handleForge} disabled={loading}
          style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}>
          {loading ? <><Loader2 className="animate-spin" /> Forging...</> : <><Flame size={16} /> Forge This Prompt</>}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="tool-card" style={{ textAlign: 'center', padding: '28px 20px' }}>
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.4, repeat: Infinity }} style={{ display: 'inline-block', marginBottom: 12 }}>
            <Flame size={36} color="#a78bfa" />
          </motion.div>
          <div className="loading-shimmer" style={{ width: '80%', margin: '0 auto 8px' }} />
          <div className="loading-shimmer" style={{ width: '60%', margin: '0 auto 8px' }} />
          <div className="loading-shimmer" style={{ width: '70%', margin: '0 auto' }} />
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 12 }}>Engineering your prompt...</p>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {forgedPrompt && !loading && (
          <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

            {audit && <StrengthGauge score={audit.score || 0} />}

            {audit && (audit.risks?.length > 0 || audit.improvements?.length > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{ padding: '14px 16px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={12} /> Weaknesses Found
                  </div>
                  {(audit.risks || []).map((r, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 7, lineHeight: 1.5 }}>
                      <span style={{ color: '#f87171', flexShrink: 0 }}>◈</span>{r}
                    </div>
                  ))}
                </div>
                <div style={{ padding: '14px 16px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={12} /> Enhancements Applied
                  </div>
                  {(audit.improvements || []).map((im, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 7, lineHeight: 1.5 }}>
                      <span style={{ color: '#4ade80', flexShrink: 0 }}>✓</span>{im}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {refineCount > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, marginBottom: 12, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', fontSize: 11, fontWeight: 700, color: '#a78bfa' }}>
                <RefreshCw size={11} /> Refined {refineCount} time{refineCount > 1 ? 's' : ''}
              </div>
            )}

            {/* Forged prompt — PLAIN TEXT, no markdown */}
            <div style={{
              background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(167,139,250,0.3)',
              borderLeft: '3px solid #a78bfa', borderRadius: 12, padding: '20px', marginBottom: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1px' }}>
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
              {/* PLAIN TEXT — no ReactMarkdown — zero asterisks */}
              <div style={{
                fontSize: 14, lineHeight: 1.9, color: 'rgba(255,255,255,0.88)',
                whiteSpace: 'pre-wrap', fontFamily: 'inherit',
              }}>
                {forgedPrompt}
              </div>
            </div>

            {/* Test This Prompt */}
            <div style={{
              background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.2)',
              borderRadius: 14, padding: '18px 20px', marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Play size={15} /> Test This Prompt Live
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
                    Run the forged prompt through AI — see the actual output instantly
                  </div>
                </div>
                <button onClick={handleTest} disabled={testing} style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 10,
                  background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.35)',
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
                    background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(96,165,250,0.12)',
                    borderRadius: 10, padding: '14px 16px', marginBottom: 14,
                    fontSize: 13, lineHeight: 1.8, color: 'rgba(255,255,255,0.82)',
                    whiteSpace: 'pre-wrap', maxHeight: 280, overflowY: 'auto',
                    fontFamily: 'inherit',
                  }}>
                    {testResult}
                  </div>

                  {testDone && satisfied === null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                        Satisfied with this result?
                      </span>
                      <button onClick={() => handleSatisfied(true)} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8,
                        background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
                        color: '#4ade80', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        <Check size={14} /> Yes — Save to Vault
                      </button>
                      <button onClick={() => handleSatisfied(false)} disabled={refining} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8,
                        background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)',
                        color: '#f97316', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        {refining ? <><Loader2 size={13} className="animate-spin" /> Refining...</> : <><RefreshCw size={13} /> No — Refine More</>}
                      </button>
                    </div>
                  )}

                  {satisfied === true && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 16px', borderRadius: 8,
                      background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
                      fontSize: 13, fontWeight: 700, color: '#4ade80',
                    }}>
                      <Check size={14} /> Perfect prompt saved to Vault!
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>

            <button onClick={resetAll} style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <RefreshCw size={12} /> Start over
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PromptOptimizer;