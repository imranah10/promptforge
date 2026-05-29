import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import {
  Copy, Loader2, ShieldCheck, Flame,
  AlertCircle, Play, RefreshCw, Check, Download, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadText } from '../utils/helpers';

// ── Strip all markdown symbols ────────────────────────────────────────────────
const strip = (t = '') =>
  t.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s?/g, '')
   .replace(/`{1,3}/g, '').replace(/_{1,2}/g, '').replace(/~~.+~~/g, '').trim();

// ── Robust forge response parser ──────────────────────────────────────────────
// Handles: tagged blocks, markdown-wrapped tags, JSON fallback, free-form fallback.
// Always returns { forged, audit, parseSource } — never throws, never silently
// substitutes a fake score.
const parseForgeResponse = (raw, basicPrompt, intensity) => {
  const text = (raw || '').trim();
  if (!text) {
    return {
      forged: '',
      audit: null,
      parseSource: 'empty',
    };
  }

  // ── Step 1: try tagged blocks (===FORGED=== / ===ANALYSIS===) ──
  // Tolerant to surrounding markdown like **===FORGED===** or `===FORGED===`
  const cleanForRegex = text.replace(/\*\*|`{1,3}/g, '');

  const forgedTag = cleanForRegex.match(/={3,}\s*FORGED\s*={3,}([\s\S]*?)={3,}\s*END_?FORGED\s*={3,}/i);
  const analysisTag = cleanForRegex.match(/={3,}\s*ANALYSIS\s*={3,}([\s\S]*?)={3,}\s*END_?ANALYSIS\s*={3,}/i);

  let forged = '';
  let parseSource = 'tagged';

  if (forgedTag) {
    forged = strip(forgedTag[1]);
  } else {
    // Forged block is more critical — try splitting by ===ANALYSIS===
    const splitByAnalysis = cleanForRegex.split(/={3,}\s*ANALYSIS\s*={3,}/i);
    if (splitByAnalysis.length > 1) {
      forged = strip(splitByAnalysis[0].replace(/={3,}\s*FORGED\s*={3,}/i, '').replace(/={3,}\s*END_?FORGED\s*={3,}/i, ''));
      parseSource = 'split';
    }
  }

  // ── Step 2: try JSON fallback if tagged failed ──
  let audit = null;
  if (!forged || !analysisTag) {
    const jsonMatch = text.match(/\{[\s\S]*"score"[\s\S]*?\}/i);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.forged && typeof parsed.forged === 'string') forged = strip(parsed.forged);
        if (typeof parsed.score === 'number' || typeof parsed.score === 'string') {
          audit = {
            score:        clampScore(parsed.score),
            reasoning:    String(parsed.reasoning || '').trim(),
            risks:        Array.isArray(parsed.weaknesses) ? parsed.weaknesses.map(String).filter(Boolean).slice(0, 5) : [],
            improvements: Array.isArray(parsed.fixes) ? parsed.fixes.map(String).filter(Boolean).slice(0, 5) : [],
          };
          parseSource = 'json';
        }
      } catch (_) { /* JSON parse failed, keep going */ }
    }
  }

  // ── Step 3: parse analysis fields if we have an analysis block ──
  if (!audit && analysisTag) {
    audit = parseAnalysisFields(analysisTag[1]);
    parseSource = audit ? 'tagged' : parseSource;
  }

  // ── Step 4: full-text scan as last structured attempt ──
  if (!audit) {
    const wholeAudit = parseAnalysisFields(cleanForRegex);
    if (wholeAudit && wholeAudit.score !== null) {
      audit = wholeAudit;
      parseSource = 'scattered';
    }
  }

  // ── Step 5: if forged still empty, take everything before any analysis-like marker ──
  if (!forged) {
    const cutMarkers = [/={3,}\s*ANALYSIS/i, /\bSCORE\s*:/i, /\bWEAK1\s*:/i];
    let cut = cleanForRegex.length;
    cutMarkers.forEach(m => {
      const idx = cleanForRegex.search(m);
      if (idx > 0 && idx < cut) cut = idx;
    });
    forged = strip(cleanForRegex.slice(0, cut));
    if (forged) parseSource = parseSource === 'tagged' ? 'tagged' : 'free-form';
  }

  // ── Step 6: heuristic audit fallback if still nothing ──
  // We do NOT invent a fake score silently — we mark it as estimated.
  if (!audit && forged) {
    audit = heuristicAudit(basicPrompt, forged, intensity);
    parseSource = 'heuristic';
  }

  return { forged, audit, parseSource };
};

// ── Analysis field parser — multiline tolerant ────────────────────────────────
const parseAnalysisFields = (block) => {
  if (!block) return null;
  const text = block.replace(/\*\*|`{1,3}/g, '');

  const score = extractScore(text);
  if (score === null) return null;

  const reasoning = extractField(text, 'REASONING');
  const weak1 = extractField(text, 'WEAK1');
  const weak2 = extractField(text, 'WEAK2');
  const weak3 = extractField(text, 'WEAK3');
  const fix1  = extractField(text, 'FIX1');
  const fix2  = extractField(text, 'FIX2');
  const fix3  = extractField(text, 'FIX3');

  const risks = [weak1, weak2, weak3].filter(Boolean);
  const improvements = [fix1, fix2, fix3].filter(Boolean);

  return {
    score,
    reasoning: reasoning || '',
    risks,
    improvements,
  };
};

// ── Score extractor with validation + clamping ────────────────────────────────
const extractScore = (text) => {
  if (!text) return null;
  // Try several patterns: "SCORE: 78", "Score = 78", "Score 78/100", "78%"
  const patterns = [
    /SCORE\s*[:=]\s*(\d{1,3})/i,
    /\bSCORE\b[^\d]{0,8}(\d{1,3})\s*(?:\/\s*100)?/i,
    /(\d{1,3})\s*%/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n)) return clampScore(n);
    }
  }
  return null;
};

const clampScore = (val) => {
  const n = typeof val === 'number' ? val : parseInt(String(val).replace(/[^\d-]/g, ''), 10);
  if (isNaN(n)) return null;
  return Math.max(0, Math.min(100, n));
};

// ── Single-field extractor (multiline until next FIELD: or end) ───────────────
const extractField = (text, fieldName) => {
  if (!text) return '';
  // Match FIELD: <content> until next FIELD-like marker or end of block
  const stopWords = ['SCORE', 'REASONING', 'WEAK1', 'WEAK2', 'WEAK3', 'FIX1', 'FIX2', 'FIX3', 'WEAKNESS', 'FIX'];
  const stopPattern = stopWords.filter(w => w !== fieldName).join('|');
  const re = new RegExp(`${fieldName}\\s*[:=]\\s*([\\s\\S]*?)(?=\\n\\s*(?:${stopPattern})\\s*[:=]|={3,}|$)`, 'i');
  const m = text.match(re);
  if (!m) return '';
  return m[1]
    .replace(/^[\s\-•◈✓]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 280); // cap length so UI stays clean
};

// ── Heuristic audit when AI didn't follow format ──────────────────────────────
// This is honest: it reports an estimated score based on length/specificity gap,
// and uses generic-but-truthful weaknesses tied to the actual basic prompt.
const heuristicAudit = (basic, forged, intensity) => {
  const basicLen = (basic || '').trim().length;
  const forgedLen = (forged || '').trim().length;
  const lengthRatio = basicLen > 0 ? forgedLen / basicLen : 0;

  // Score: based on intensity setting + length expansion (rough proxy for engineering effort)
  // We never fabricate beyond what we can defend.
  const expansionScore = Math.min(100, Math.round(lengthRatio * 18));
  const intensityBonus = Math.round(intensity * 0.35);
  const score = clampScore(Math.min(95, 40 + Math.round((expansionScore + intensityBonus) / 2)));

  // Generic-but-real weaknesses based on what's actually missing in the basic prompt
  const risks = [];
  const lower = (basic || '').toLowerCase();
  if (basicLen < 60) risks.push('Original prompt is very short — lacks detail and context');
  if (!/(act as|you are|expert|specialist)/i.test(lower)) risks.push('No AI persona or role defined in original prompt');
  if (!/(format|structure|sections|bullet|table|json)/i.test(lower)) risks.push('No output format or structure specified');
  if (!/(audience|reader|user|customer|target)/i.test(lower)) risks.push('Target audience not specified');
  if (!/(length|words|paragraph|short|long|detailed)/i.test(lower) && risks.length < 3) risks.push('No length or depth requirement specified');

  // Mirror improvements
  const improvements = [];
  if (/(act as|you are|expert)/i.test(forged.toLowerCase())) improvements.push('Added a specific expert persona for the AI to adopt');
  if (/(format|structure|sections|##|step \d|^\d+\.)/im.test(forged)) improvements.push('Defined a clear output format and structure');
  if (forgedLen > basicLen * 2) improvements.push('Expanded with concrete constraints and context');
  if (/(audience|target|reader)/i.test(forged.toLowerCase())) improvements.push('Specified the target audience explicitly');
  if (improvements.length === 0) improvements.push('Rewrote with clearer instructions and tighter scope');

  return {
    score,
    reasoning: 'Score estimated from prompt expansion and intensity (AI did not return structured analysis).',
    risks: risks.slice(0, 3),
    improvements: improvements.slice(0, 3),
  };
};

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

// ── Main ──────────────────────────────────────────────────────────────────────
const PromptOptimizer = () => {
  const { activeModel, apiKey, providerKeys, customModels, showToast, saveToVault } = useContext(AppContext);

  const [basicPrompt,  setBasicPrompt]  = useState('');
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
- Use ONLY the exact tags below. Do NOT wrap them in markdown. Do NOT add any text before ===FORGED=== or after ===END_ANALYSIS===.
- Each WEAK and FIX must be ONE single line. No line breaks within a field.
- SCORE must be a single integer between 0 and 100. No fractions, no /100 suffix.

OUTPUT FORMAT (follow exactly, no deviations):

===FORGED===
[Your optimized prompt here — plain text, line breaks allowed, no markdown symbols whatsoever]
===END_FORGED===

===ANALYSIS===
SCORE: [single integer 0-100]
REASONING: [One sentence explaining the score]
WEAK1: [Specific weakness #1 found in the original prompt — single line]
WEAK2: [Specific weakness #2 found in the original prompt — single line]
WEAK3: [Specific weakness #3 found in the original prompt — single line]
FIX1: [Specific enhancement #1 you applied and why — single line]
FIX2: [Specific enhancement #2 you applied and why — single line]
FIX3: [Specific enhancement #3 you applied and why — single line]
===END_ANALYSIS===`;

    const msg = `Weak prompt to forge: "${basicPrompt}"
Intensity: ${intensity}/100
Session ID: ${s}

Analyze this specific prompt carefully. What exactly is weak about it? What specific improvements will you make at intensity ${intensity}?
Now forge it and provide the full analysis.`;

    try {
      const res = await callAI(system, msg, null, activeModel, apiKey, providerKeys, customModels);

      // Robust parsing — handles tagged blocks, JSON, scattered fields, and full fallback
      const { forged, audit: parsedAudit, parseSource } = parseForgeResponse(res, basicPrompt, intensity);

      if (!forged) {
        // Genuine failure — show error instead of garbage
        setForgedPrompt('');
        setAudit(null);
        showToast('AI response was unreadable. Try again.', 'error');
        return;
      }

      setForgedPrompt(forged);
      if (parsedAudit) {
        setAudit({ ...parsedAudit, parseSource });
      } else {
        setAudit(null);
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
    setBasicPrompt(''); setForgedPrompt(''); setAudit(null);
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

      {/* ── Input card ── */}
      <div className="tool-card" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label className="form-label">Your weak / basic prompt</label>
          <textarea
            className="form-textarea" rows="5"
            placeholder="Type or paste anything here — a blog idea, email draft, code question, legal clause, research query, business plan, recipe, lesson plan, contract, social post, technical spec... Forge optimizes any prompt for any AI model."
            value={basicPrompt}
            onChange={e => setBasicPrompt(e.target.value)}
          />
          {basicPrompt.length > 0 && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, textAlign: 'right' }}>
              {basicPrompt.length.toLocaleString()} characters
            </div>
          )}
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

            {/* Parse-source transparency hint (only for non-tagged) */}
            {audit && audit.parseSource && audit.parseSource !== 'tagged' && audit.parseSource !== 'json' && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '8px 14px', marginBottom: 12, borderRadius: 10,
                background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)',
                fontSize: 11.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5,
              }}>
                <Info size={12} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  {audit.parseSource === 'heuristic'
                    ? 'AI returned a non-standard response. Score is estimated from prompt expansion and intensity.'
                    : 'AI response was reformatted for consistency.'}
                </span>
              </div>
            )}

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