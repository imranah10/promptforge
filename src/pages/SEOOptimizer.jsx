import React, { useState, useContext, useCallback, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { downloadText } from '../utils/helpers';
import {
  Search, Loader2, Copy, Download, RefreshCw,
  Target, TrendingUp, FileText, Layers, Globe,
  BarChart2, Zap, Check, ChevronDown, History,
  Trash2, BookMarked, AlertCircle, X, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Tools config ──────────────────────────────────────────────────────────────
const TOOLS = [
  { id: 'keyword',  icon: Search,     label: 'Keyword Lab',       color: '#60a5fa', desc: 'Deep keyword research + intent + difficulty' },
  { id: 'serp',     icon: Globe,      label: 'SERP Simulator',    color: '#a78bfa', desc: 'Simulate how your page appears on Google' },
  { id: 'audit',    icon: BarChart2,  label: 'Content Scorer',    color: '#4ade80', desc: 'Score & fix your existing content for SEO' },
  { id: 'cluster',  icon: Layers,     label: 'Topic Clusters',    color: '#fbbf24', desc: 'Build full topic authority architecture' },
  { id: 'gap',      icon: Target,     label: 'Content Gap AI',    color: '#f97316', desc: 'Find what competitors rank for but you don\'t' },
  { id: 'meta',     icon: FileText,   label: 'Meta Forge',        color: '#f472b6', desc: 'Generate click-worthy titles & descriptions' },
  { id: 'schema',   icon: TrendingUp, label: 'Schema Generator',  color: '#22d3ee', desc: 'Generate JSON-LD structured data for rich snippets' },
];

// ── Strip markdown symbols from AI output ────────────────────────────────────
const stripMarkdown = (text = '') =>
  text
    .replace(/\*\*(.+?)\*\*/g, '$1')   // **bold**
    .replace(/\*(.+?)\*/g, '$1')        // *italic*
    .replace(/_{1,2}(.+?)_{1,2}/g, '$1') // __under__
    .replace(/`{1,3}/g, '')              // backticks
    .replace(/^#{1,6}\s+/gm, '')         // # headings
    .replace(/^\s*[-•]\s+/gm, '• ')      // normalize bullets
    .trim();

// ── Plain text output renderer ────────────────────────────────────────────────
const PlainOutput = ({ text }) => {
  const lines = stripMarkdown(text).split('\n');
  return (
    <div style={{ lineHeight: 1.75, fontSize: 13 }}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} style={{ height: 10 }} />;

        // Section headers — ALL CAPS lines
        if (/^[A-Z][A-Z\s&()\-\/]{4,}$/.test(trimmed)) {
          return (
            <div key={i} style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '1.2px',
              color: 'var(--text3)', textTransform: 'uppercase',
              marginTop: 18, marginBottom: 6, borderBottom: '1px solid var(--border)',
              paddingBottom: 4,
            }}>{trimmed}</div>
          );
        }

        // Numbered list items
        if (/^\d+\.\s/.test(trimmed)) {
          return (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, color: 'var(--text)' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0, minWidth: 18 }}>
                {trimmed.match(/^\d+/)[0]}.
              </span>
              <span>{trimmed.replace(/^\d+\.\s*/, '')}</span>
            </div>
          );
        }

        // Bullet items
        if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
          return (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, color: 'var(--text)' }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0 }}>•</span>
              <span>{trimmed.replace(/^[•\-]\s*/, '')}</span>
            </div>
          );
        }

        // Pipe-separated data rows (keyword | intent | difficulty)
        if (trimmed.includes(' | ')) {
          const parts = trimmed.split(' | ');
          return (
            <div key={i} style={{
              display: 'flex', flexWrap: 'wrap', gap: 6,
              marginBottom: 6, alignItems: 'center',
            }}>
              <span style={{ color: 'var(--text)', fontWeight: 600, marginRight: 4 }}>{parts[0]}</span>
              {parts.slice(1).map((p, j) => (
                <span key={j} style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 20,
                  background: 'var(--bg3)', color: 'var(--text2)',
                  border: '1px solid var(--border)',
                }}>{p}</span>
              ))}
            </div>
          );
        }

        // Regular paragraph
        return <div key={i} style={{ marginBottom: 4, color: 'var(--text)' }}>{trimmed}</div>;
      })}
    </div>
  );
};

// ── Score ring ────────────────────────────────────────────────────────────────
const ScoreRing = ({ score, label, color }) => (
  <div style={{ textAlign: 'center' }}>
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r="30" fill="none" stroke="var(--bg2)" strokeWidth="6" />
      <circle
        cx="36" cy="36" r="30" fill="none"
        stroke={color} strokeWidth="6"
        strokeDasharray={`${(score / 100) * 188.5} 188.5`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text x="36" y="41" textAnchor="middle" fontSize="16" fontWeight="800" fill={color}>{score}</text>
    </svg>
    <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginTop: 2 }}>{label}</div>
  </div>
);

// ── SERP Preview Card ──────────────────────────────────────────────────────────
const SERPPreview = ({ title, url, description, richSnippet }) => (
  <div style={{
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '16px 20px',
    marginBottom: 16,
    fontFamily: 'Arial, sans-serif',
  }}>
    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Google Search Preview</div>
    <div style={{ fontSize: 12, color: '#202124', color: 'var(--text3)', marginBottom: 2 }}>
      {url || 'https://yourwebsite.com › page'}
    </div>
    <div style={{ fontSize: 18, color: '#1a0dab', fontWeight: 400, marginBottom: 4, cursor: 'pointer' }}
      onMouseEnter={e => e.target.style.textDecoration = 'underline'}
      onMouseLeave={e => e.target.style.textDecoration = 'none'}
    >
      {title || 'Your Page Title Will Appear Here'}
    </div>
    <div style={{ fontSize: 13, color: '#4d5156', lineHeight: 1.5 }}>
      {description || 'Your meta description will appear here. Make sure it is compelling and under 160 characters.'}
    </div>
    {richSnippet && (
      <div style={{ marginTop: 8, fontSize: 12, color: '#188038', display: 'flex', alignItems: 'center', gap: 4 }}>
        ★★★★★ <span style={{ color: 'var(--text3)' }}>{richSnippet}</span>
      </div>
    )}
  </div>
);

// ── Schema Copy Button ─────────────────────────────────────────────────────────
const SchemaBlock = ({ code, showToast }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast('Schema JSON copied!');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ position: 'relative', marginTop: 12 }}>
      <button onClick={handleCopy} style={{
        position: 'absolute', top: 10, right: 10,
        background: copied ? '#22c55e20' : 'rgba(34,211,238,0.15)',
        border: `1px solid ${copied ? '#22c55e40' : '#22d3ee40'}`,
        borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
        fontSize: 11, color: copied ? '#22c55e' : '#22d3ee',
        fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
        zIndex: 1,
      }}>
        {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy JSON</>}
      </button>
      <pre style={{
        background: 'var(--bg2)', borderRadius: 8, padding: '14px 16px',
        fontSize: 12, overflowX: 'auto', color: 'var(--text)',
        border: '1px solid var(--border)', lineHeight: 1.6,
        maxHeight: 320, overflowY: 'auto',
      }}>{code}</pre>
    </div>
  );
};

// ── History Panel ──────────────────────────────────────────────────────────────
const HistoryPanel = ({ history, onRestore, onDelete, onClose }) => (
  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
    style={{
      position: 'fixed', top: 0, right: 0, width: 360, height: '100vh',
      background: 'var(--bg)', borderLeft: '1px solid var(--border)',
      zIndex: 1000, overflowY: 'auto', padding: 20,
      boxShadow: '-8px 0 32px rgba(0,0,0,0.3)',
    }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700 }}>Session History</div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}>
        <X size={18} />
      </button>
    </div>
    {history.length === 0 ? (
      <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
        No history yet. Run a tool to see results here.
      </div>
    ) : history.map((item, i) => (
      <div key={i} style={{
        background: 'var(--bg3)', border: '1px solid var(--border)',
        borderRadius: 10, padding: 12, marginBottom: 10,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: item.color, textTransform: 'uppercase', letterSpacing: 1 }}>{item.tool}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{item.topic || '—'}</div>
          </div>
          <button onClick={() => onDelete(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2 }}>
            <Trash2 size={13} />
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>{item.time}</div>
        <button onClick={() => onRestore(item)} style={{
          fontSize: 11, color: '#60a5fa', background: 'rgba(96,165,250,0.1)',
          border: '1px solid rgba(96,165,250,0.3)', borderRadius: 6,
          padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <ArrowRight size={11} /> Restore
        </button>
      </div>
    ))}
  </motion.div>
);

// ── Disclaimer banner ─────────────────────────────────────────────────────────
const AIDisclaimer = () => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
    background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
    borderRadius: 8, marginBottom: 16, fontSize: 11, color: 'var(--text3)',
  }}>
    <AlertCircle size={13} color="#fbbf24" style={{ flexShrink: 0 }} />
    AI-estimated data — search volumes & difficulty are indicative, not from live APIs like Ahrefs/Semrush.
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const SEOOptimizer = () => {
  const { activeModel, apiKey, providerKeys, customModels, showToast, saveToVault, savedContext } = useContext(AppContext);

  const [activeTool, setActiveTool] = useState('keyword');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [scores, setScores] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [copied, setCopied] = useState(false);

  // ── Per-tool isolated state ────────────────────────────────────────────────
  const [toolState, setToolState] = useState({
    keyword:  { topic: '', competitors: '', lang: 'English', country: 'Global' },
    serp:     { topic: '', url: '', lang: 'English', country: 'Global' },
    audit:    { topic: '', content: '', lang: 'English', country: 'Global' },
    cluster:  { topic: '', competitors: '', lang: 'English', country: 'Global' },
    gap:      { topic: '', competitors: '', lang: 'English', country: 'Global' },
    meta:     { topic: '', metaTitle: '', lang: 'English', country: 'Global' },
    schema:   { topic: '', url: '', schemaType: 'Article', lang: 'English', country: 'Global' },
  });

  // ── SERP live preview state ────────────────────────────────────────────────
  const [serpPreview, setSerpPreview] = useState({ title: '', url: '', description: '', richSnippet: '' });

  // ── Schema parsed JSON blocks ──────────────────────────────────────────────
  const [schemaBlocks, setSchemaBlocks] = useState([]);

  const ts = toolState[activeTool];
  const setTs = (updates) => setToolState(prev => ({
    ...prev,
    [activeTool]: { ...prev[activeTool], ...updates }
  }));

  const activeTool_ = TOOLS.find(t => t.id === activeTool);
  const seed = () => Math.random().toString(36).slice(2, 8);
  const sc = (v) => v >= 70 ? '#4ade80' : v >= 40 ? '#fbbf24' : '#f87171';

  // ── Tool switch — clear output only ──────────────────────────────────────
  const handleToolSwitch = (toolId) => {
    setActiveTool(toolId);
    setResult('');
    setScores(null);
    setSerpPreview({ title: '', url: '', description: '', richSnippet: '' });
    setSchemaBlocks([]);
  };

  // ── AI runner ────────────────────────────────────────────────────────────
  const run = async (system, userMsg) => {
    setLoading(true); setResult(''); setScores(null); setSchemaBlocks([]);
    try {
      const res = await callAI(system, userMsg, null, activeModel, apiKey, providerKeys, customModels);
      setResult(res);

      // Save to session history (not vault on every run — only on explicit save)
      const histItem = {
        tool: activeTool_?.label,
        color: activeTool_?.color,
        topic: ts.topic || ts.url || '',
        result: res,
        toolId: activeTool,
        time: new Date().toLocaleTimeString(),
        toolState: { ...ts },
      };
      setSessionHistory(prev => [histItem, ...prev].slice(0, 20));

      return res;
    } catch (e) {
      setResult('⚠️ Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Manual vault save ─────────────────────────────────────────────────────
  const handleSaveToVault = () => {
    if (!result) return;
    saveToVault?.('SEO Optimizer', `${activeTool_?.label} | ${ts.topic || ts.url}`, result);
    showToast('Saved to Vault!');
  };

  // ── Copy all ──────────────────────────────────────────────────────────────
  const handleCopyAll = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    showToast('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Restore from history ──────────────────────────────────────────────────
  const handleRestore = (item) => {
    setActiveTool(item.toolId);
    setToolState(prev => ({ ...prev, [item.toolId]: item.toolState }));
    setResult(item.result);
    setShowHistory(false);
    showToast('Result restored!');
  };

  // ── Parse SERP preview from result ────────────────────────────────────────
  const parseSerpPreview = (res) => {
    const titleMatch = res.match(/Title:\s*(.+)/);
    const urlMatch = res.match(/URL:\s*(.+)/);
    const descMatch = res.match(/Description:\s*(.+)/);
    if (titleMatch) {
      setSerpPreview({
        title: titleMatch[1]?.trim() || '',
        url: urlMatch?.[1]?.trim() || ts.url || '',
        description: descMatch?.[1]?.trim() || '',
        richSnippet: '',
      });
    }
  };

  // ── Parse JSON-LD blocks from schema result ───────────────────────────────
  const parseSchemaBlocks = (res) => {
    const blocks = [];
    const regex = /```(?:json)?\s*([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(res)) !== null) {
      try {
        JSON.parse(match[1]);
        blocks.push(match[1].trim());
      } catch (_) {}
    }
    setSchemaBlocks(blocks);
  };

  // ── Parse scores robustly ─────────────────────────────────────────────────
  const parseScores = (res) => {
    const extract = (key) => {
      const m = res.match(new RegExp(key + '[:\\s]+([0-9]{1,3})'));
      return m ? Math.min(100, parseInt(m[1])) : null;
    };
    const overall = extract('OVERALL');
    if (!overall) return;
    setScores({
      overall,
      keyword:   extract('KEYWORD_DENSITY') || extract('KEYWORD') || 70,
      readabil:  extract('READABILITY') || 70,
      structure: extract('STRUCTURE') || 70,
      semantic:  extract('SEMANTIC_COVERAGE') || extract('SEMANTIC') || 70,
      intent:    extract('USER_INTENT') || extract('INTENT') || 70,
    });
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 1. KEYWORD LAB
  // ══════════════════════════════════════════════════════════════════════════
  const runKeyword = async () => {
    if (!ts.topic.trim()) { showToast('Enter your topic or keyword', 'warn'); return; }
    const s = seed();
    const system = `You are a senior SEO strategist with 15 years of experience. Session: ${s}.
STRICT RULE: Use PLAIN TEXT ONLY. ZERO asterisks (*), ZERO pound signs (#), ZERO backticks, ZERO markdown of any kind. No bold, no italic, no headers with #. Just plain text exactly as shown below.
Provide deep, actionable keyword research. Language: ${ts.lang}. Target market: ${ts.country}.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

PRIMARY KEYWORD ANALYSIS
[Analyze the main keyword — search intent, competition level, opportunity score]

TOP 10 TARGET KEYWORDS
1. [keyword] | [intent: informational/commercial/transactional] | [difficulty: easy/medium/hard] | [opportunity: high/medium/low]
2-10. [repeat]

LONG-TAIL GOLDMINES (Low competition, high intent)
[List 8 long-tail keywords that are easier to rank for]

LSI & SEMANTIC KEYWORDS
[List 10 semantically related terms Google expects to see in this content]

PEOPLE ALSO ASK — Questions to answer
[List 8 questions your content must answer]

CONTENT STRATEGY RECOMMENDATION
[2-3 sentences on the best approach to rank for this topic]

QUICK WIN OPPORTUNITIES
[3 specific tactics to start ranking faster]`;

    await run(system, `Target keyword/topic: "${ts.topic}"\nCompetitors to beat: ${ts.competitors || 'Not specified'}\nLanguage: ${ts.lang}\nTarget country: ${ts.country}\nSession: ${s}`);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 2. SERP SIMULATOR
  // ══════════════════════════════════════════════════════════════════════════
  const runSERP = async () => {
    if (!ts.topic.trim()) { showToast('Enter your page title or topic', 'warn'); return; }
    const s = seed();
    const system = `You are a Google search result expert and CTR specialist. Session: ${s}.
STRICT RULE: PLAIN TEXT ONLY. No asterisks (*), no # headers, no backticks, no markdown whatsoever.
Simulate exactly how this page would appear in Google search results.

OUTPUT FORMAT (plain text only):

CURRENT SERP PREVIEW
Title: [title as it appears — max 60 chars]
URL: [clean URL slug]
Description: [meta description — max 160 chars]
Rich snippet: [any rich snippet opportunity]

CTR ANALYSIS
Current estimated CTR: [X%]
Industry average CTR for position 1: [X%]
Gap: [what you're missing]

WHAT GOOGLE USERS SEE
[Emotional/rational trigger this result hits for the searcher]

OPTIMIZED VERSION
Title: [new optimized title — power word + number + keyword]
Description: [new meta description — benefit + CTA + keyword]
Expected CTR improvement: [X%]
Reason: [why this version performs better]

TITLE ALTERNATIVES
Option A: [title]
Option B: [title]
Option C: [title]

FEATURED SNIPPET OPPORTUNITY
[Can this page win a featured snippet? What format?]`;

    const res = await run(system, `Page topic/title: "${ts.topic}"\nCurrent URL: ${ts.url || 'Not provided'}\nSession: ${s}`);
    if (res) parseSerpPreview(res);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 3. CONTENT SCORER
  // ══════════════════════════════════════════════════════════════════════════
  const runAudit = async () => {
    if (!ts.content.trim() && !ts.topic.trim()) { showToast('Paste your content or enter a topic', 'warn'); return; }
    const s = seed();
    const system = `You are an expert SEO content auditor. Session: ${s}.
STRICT RULE: PLAIN TEXT ONLY. No asterisks (*), no ** bold **, no # headers, no backticks, no markdown of any kind. Write everything as pure plain text.
Analyze the provided content and score it.

YOU MUST START your response with EXACTLY this block (no text before it):

SCORES
OVERALL: [0-100]
KEYWORD_DENSITY: [0-100]
READABILITY: [0-100]
STRUCTURE: [0-100]
SEMANTIC_COVERAGE: [0-100]
USER_INTENT: [0-100]

Then continue with:

CRITICAL ISSUES
[List 3-5 most important problems — be specific]

QUICK WINS (fix today)
[5 specific, actionable improvements with expected impact]

MISSING KEYWORDS
[8 keywords/phrases this content should include but doesn't]

CONTENT GAPS
[What questions the user is asking that this content doesn't answer]

STRUCTURE RECOMMENDATIONS
[H1, H2, H3 structure — what it should look like]

COMPETITOR ADVANTAGE
[What would make this content better than any competitor]`;

    const res = await run(system, `Content to audit:\n"${ts.content || ts.topic}"\n\nTarget keyword: ${ts.topic || 'extract from content'}\nLanguage: ${ts.lang}\nSession: ${s}`);
    if (res) parseScores(res);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 4. TOPIC CLUSTERS
  // ══════════════════════════════════════════════════════════════════════════
  const runCluster = async () => {
    if (!ts.topic.trim()) { showToast('Enter your main topic', 'warn'); return; }
    const s = seed();
    const system = `You are a content strategist and SEO architect. Session: ${s}.
STRICT RULE: PLAIN TEXT ONLY. No asterisks, no # symbols, no backticks, no markdown at all.
Build a complete topic cluster strategy that establishes full topical authority.

OUTPUT FORMAT (plain text, no asterisks, no # symbols):

PILLAR PAGE (The Hub)
Topic: [main pillar page topic]
Target keyword: [primary keyword]
Goal: [what this page achieves]

CLUSTER PAGES (Spokes — these link back to pillar)
Cluster 1: [topic] | Keyword: [keyword] | Intent: [type]
Cluster 2: [topic] | Keyword: [keyword] | Intent: [type]
Cluster 3: [topic] | Keyword: [keyword] | Intent: [type]
Cluster 4: [topic] | Keyword: [keyword] | Intent: [type]
Cluster 5: [topic] | Keyword: [keyword] | Intent: [type]
Cluster 6: [topic] | Keyword: [keyword] | Intent: [type]
Cluster 7: [topic] | Keyword: [keyword] | Intent: [type]
Cluster 8: [topic] | Keyword: [keyword] | Intent: [type]

INTERNAL LINKING STRATEGY
[How pillar and cluster pages should link to each other]

CONTENT CALENDAR (production order)
Week 1: [which piece to create first and why]
Week 2: [next piece]
Week 3: [next piece]
Week 4: [next piece]

TOPICAL AUTHORITY SCORE
[Estimated months to achieve topical authority if this cluster is built]

QUICK WIN CLUSTER PAGE
[Which one cluster page would rank fastest and why]`;

    await run(system, `Main topic: "${ts.topic}"\nCompetitors: ${ts.competitors || 'Not specified'}\nLanguage: ${ts.lang}\nMarket: ${ts.country}\nSession: ${s}`);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 5. CONTENT GAP AI
  // ══════════════════════════════════════════════════════════════════════════
  const runGap = async () => {
    if (!ts.topic.trim()) { showToast('Enter your website topic or niche', 'warn'); return; }
    const s = seed();
    const system = `You are a competitive SEO analyst specializing in content gap analysis. Session: ${s}.
STRICT RULE: PLAIN TEXT ONLY. No asterisks (*), no ** bold **, no # symbols, no backticks, no markdown at all.
Find what competitors likely rank for that the user is missing.

OUTPUT FORMAT (plain text only):

CONTENT GAP SUMMARY
[2 sentences describing the overall opportunity]

HIGH-VALUE GAPS (your competitors rank, you don't)
Gap 1: [keyword/topic] | Est. monthly searches: [number] | Difficulty: [easy/medium/hard]
Gap 2: [keyword/topic] | Est. monthly searches: [number] | Difficulty: [easy/medium/hard]
Gap 3: [keyword/topic] | Est. monthly searches: [number] | Difficulty: [easy/medium/hard]
Gap 4: [keyword/topic] | Est. monthly searches: [number] | Difficulty: [easy/medium/hard]
Gap 5: [keyword/topic] | Est. monthly searches: [number] | Difficulty: [easy/medium/hard]

QUICK WIN GAPS (easy to rank, high value)
[5 lower-competition topics you could rank for in 30-60 days]

CONTENT TYPES YOU'RE MISSING
[What formats are performing well for competitors that you haven't tried?]

FEATURED SNIPPET OPPORTUNITIES
[3 questions where competitors have snippets you could steal]

30-DAY ACTION PLAN
[Prioritized list of content to create this month to close the biggest gaps]

ESTIMATED TRAFFIC OPPORTUNITY
[If you closed these gaps, estimated additional monthly organic traffic]`;

    await run(system, `My website/niche: "${ts.topic}"\nMain competitors: ${ts.competitors || 'Top industry competitors'}\nLanguage: ${ts.lang}\nMarket: ${ts.country}\nSession: ${s}`);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 6. META FORGE
  // ══════════════════════════════════════════════════════════════════════════
  const runMeta = async () => {
    if (!ts.topic.trim()) { showToast('Enter your page topic or keyword', 'warn'); return; }
    const s = seed();
    const system = `You are a conversion copywriter specialized in Google search CTR optimization. Session: ${s}.
STRICT RULE: PLAIN TEXT ONLY. No asterisks (*), no ** bold **, no # symbols, no markdown at all. Pure plain text only.
Generate multiple high-performing meta title and description options. All titles MUST be under 60 characters. All descriptions MUST be under 160 characters — count carefully.

OUTPUT FORMAT (plain text):

OPTION 1 — Power + Number
Title: [title with power word and number — MAX 60 CHARS]
Char count: [N chars]
Description: [benefit-driven description with CTA — MAX 160 CHARS]
Char count: [N chars]
CTR prediction: [high/medium] | Emotion: [curiosity/urgency/benefit]

OPTION 2 — Question Format
Title: [question-based title — MAX 60 CHARS]
Char count: [N chars]
Description: [answer-teasing description — MAX 160 CHARS]
Char count: [N chars]
CTR prediction: [high/medium] | Emotion: [curiosity/problem-solving]

OPTION 3 — Benefit Forward
Title: [leading with the main benefit — MAX 60 CHARS]
Char count: [N chars]
Description: [specific outcome + social proof — MAX 160 CHARS]
Char count: [N chars]
CTR prediction: [high/medium] | Emotion: [desire/aspiration]

OPTION 4 — Urgency/FOMO
Title: [urgency angle — MAX 60 CHARS]
Char count: [N chars]
Description: [scarcity or time-sensitive description — MAX 160 CHARS]
Char count: [N chars]
CTR prediction: [high/medium] | Emotion: [urgency/fomo]

OPTION 5 — Local/Specific
Title: [highly specific title — MAX 60 CHARS]
Char count: [N chars]
Description: [detailed, specific description — MAX 160 CHARS]
Char count: [N chars]
CTR prediction: [high/medium] | Emotion: [trust/specificity]

BEST PICK
[Which option and why]

OG TITLE (social sharing)
[Optimized Open Graph title]

TWITTER CARD DESCRIPTION
[140-char Twitter-optimized description]`;

    await run(system, `Page topic: "${ts.topic}"\nCurrent title: ${ts.metaTitle || 'Not provided'}\nTarget keyword: ${ts.topic}\nLanguage: ${ts.lang}\nMarket: ${ts.country}\nSession: ${s}`);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 7. SCHEMA GENERATOR
  // ══════════════════════════════════════════════════════════════════════════
  const runSchema = async () => {
    if (!ts.topic.trim()) { showToast('Enter your page topic', 'warn'); return; }
    const s = seed();
    const system = `You are a technical SEO expert specializing in structured data and rich snippets. Session: ${s}.
STRICT RULE: Use PLAIN TEXT for all explanations. No asterisks (*), no ** bold **, no # headers. Only use triple backticks for JSON-LD code blocks.
Generate production-ready JSON-LD schema markup.

OUTPUT:
1. Explain WHY this schema type is best (2 sentences, plain text, no markdown)
2. Provide the complete JSON-LD wrapped in triple backticks with json tag
3. List rich snippet features this unlocks in Google (plain text, numbered)
4. Suggest one ADDITIONAL complementary schema type with its JSON-LD (also in triple backticks)

Make all values realistic — not placeholder text. Use the actual topic provided.`;

    const res = await run(system, `Page topic: "${ts.topic}"\nSchema type: ${ts.schemaType}\nURL: ${ts.url || 'https://example.com/page'}\nLanguage: ${ts.lang}\nSession: ${s}`);
    if (res) parseSchemaBlocks(res);
  };

  // ── Dispatch ─────────────────────────────────────────────────────────────
  const handleGenerate = () => {
    const handlers = {
      keyword: runKeyword, serp: runSERP, audit: runAudit,
      cluster: runCluster, gap: runGap, meta: runMeta, schema: runSchema,
    };
    handlers[activeTool]?.();
  };

  // ── Char counter for meta ─────────────────────────────────────────────────
  const charCountStyle = (val, max) => ({
    fontSize: 11,
    color: val.length > max ? '#f87171' : val.length > max * 0.9 ? '#fbbf24' : 'var(--text3)',
    marginTop: 4,
  });

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="page active">
      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <HistoryPanel
            history={sessionHistory}
            onRestore={handleRestore}
            onDelete={(i) => setSessionHistory(prev => prev.filter((_, idx) => idx !== i))}
            onClose={() => setShowHistory(false)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="section-title">🔍 SEO Optimizer</h2>
          <div className="section-sub">7 AI-powered tools — Keyword Lab · SERP Simulator · Content Scorer · Topic Clusters · Gap AI · Meta Forge · Schema</div>
        </div>
        <button onClick={() => setShowHistory(!showHistory)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
          color: 'var(--text2)', fontSize: 12, fontWeight: 600,
          position: 'relative',
        }}>
          <History size={14} />
          History
          {sessionHistory.length > 0 && (
            <span style={{
              position: 'absolute', top: -6, right: -6,
              background: '#60a5fa', color: '#fff',
              borderRadius: '50%', width: 16, height: 16,
              fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{sessionHistory.length}</span>
          )}
        </button>
      </div>

      {/* Tool Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
        {TOOLS.map(t => {
          const Icon = t.icon;
          const isActive = activeTool === t.id;
          return (
            <motion.div key={t.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={() => handleToolSwitch(t.id)}
              title={t.desc}
              style={{
                padding: '12px 10px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                border: `1.5px solid ${isActive ? t.color : 'var(--border)'}`,
                background: isActive ? `${t.color}14` : 'var(--bg3)',
                boxShadow: isActive ? `0 4px 16px ${t.color}25` : 'none',
                transition: 'all 0.2s',
              }}>
              <Icon size={20} color={isActive ? t.color : 'var(--text3)'} style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? t.color : 'var(--text2)', lineHeight: 1.3 }}>{t.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Tool description */}
      <div style={{ padding: '10px 14px', marginBottom: 16, background: `${activeTool_?.color}10`, border: `1px solid ${activeTool_?.color}30`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        {activeTool_ && React.createElement(activeTool_.icon, { size: 15, color: activeTool_?.color })}
        <span style={{ fontSize: 13, fontWeight: 600, color: activeTool_?.color }}>{activeTool_?.label}</span>
        <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 4 }}>{activeTool_?.desc}</span>
      </div>

      {/* AI disclaimer */}
      <AIDisclaimer />

      {/* Inputs */}
      <div className="tool-card">
        <AnimatePresence mode="wait">
          <motion.div key={activeTool} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

            {/* Context Memory: reuse a saved business/project if available */}
            {savedContext && !ts.topic && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                padding: '10px 14px', marginBottom: 10, borderRadius: 10,
                background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.25)',
              }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', flex: 1 }}>
                  🧠 You saved context from <strong style={{ color: '#a78bfa' }}>{savedContext.sourceTool}</strong> — reuse it here?
                </div>
                <button
                  onClick={() => setTs({ topic: savedContext.summary.slice(0, 200) })}
                  style={{
                    flexShrink: 0, padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                    background: '#a78bfa', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Use it
                </button>
              </div>
            )}

            {/* Main topic input */}
            <div className="form-group">
              <label className="form-label">
                {activeTool === 'audit'   ? 'Target Keyword (for this content)' :
                 activeTool === 'serp'    ? 'Page Title or Topic' :
                 activeTool === 'meta'    ? 'Page Topic or Target Keyword' :
                 activeTool === 'schema'  ? 'Page Topic or Content Title' :
                 activeTool === 'gap'     ? 'Your Website Topic / Niche' :
                 'Target Keyword or Topic'}
              </label>
              <input className="form-input"
                placeholder={
                  activeTool === 'audit'   ? 'e.g. best project management tools for startups' :
                  activeTool === 'serp'    ? 'e.g. Best CRM Software for Small Business 2025' :
                  activeTool === 'meta'    ? 'e.g. project management tools for remote teams' :
                  activeTool === 'schema'  ? 'e.g. How to make sourdough bread at home' :
                  activeTool === 'gap'     ? 'e.g. email marketing software, SaaS productivity tools' :
                  activeTool === 'cluster' ? 'e.g. content marketing, digital marketing, SEO' :
                  'e.g. best CRM software for small business'
                }
                value={ts.topic}
                onChange={e => setTs({ topic: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && !loading && handleGenerate()}
              />
            </div>

            {/* Content textarea — audit only */}
            {activeTool === 'audit' && (
              <div className="form-group">
                <label className="form-label">Paste Your Content to Score</label>
                <textarea className="form-textarea" rows="6"
                  placeholder="Paste your blog post, page content, or article here... AI will score it across 6 dimensions."
                  value={ts.content}
                  onChange={e => setTs({ content: e.target.value })} />
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                  {ts.content.length > 0 ? `${ts.content.split(/\s+/).filter(Boolean).length} words` : 'Word count will appear here'}
                </div>
              </div>
            )}

            {/* URL input — serp, schema */}
            {(activeTool === 'serp' || activeTool === 'schema') && (
              <div className="form-group">
                <label className="form-label">Your Page URL (optional)</label>
                <input className="form-input" placeholder="https://yourwebsite.com/page"
                  value={ts.url} onChange={e => setTs({ url: e.target.value })} />
              </div>
            )}

            {/* Current title — meta */}
            {activeTool === 'meta' && (
              <div className="form-group">
                <label className="form-label">Current Title (optional — for comparison)</label>
                <input className="form-input"
                  placeholder="e.g. Project Management Tools | MyBrand"
                  value={ts.metaTitle}
                  onChange={e => setTs({ metaTitle: e.target.value })} />
                {ts.metaTitle && (
                  <div style={charCountStyle(ts.metaTitle, 60)}>
                    {ts.metaTitle.length}/60 chars {ts.metaTitle.length > 60 ? '⚠️ Too long!' : ''}
                  </div>
                )}
              </div>
            )}

            {/* Schema type */}
            {activeTool === 'schema' && (
              <div className="form-group">
                <label className="form-label">Schema Type</label>
                <select className="form-select" value={ts.schemaType} onChange={e => setTs({ schemaType: e.target.value })}>
                  {['Article','BlogPosting','Product','FAQPage','HowTo','LocalBusiness',
                    'Review','Recipe','Event','Person','Organization','VideoObject',
                    'Course','JobPosting','SoftwareApplication','MedicalCondition',
                    'BreadcrumbList','WebPage','NewsArticle'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            )}

            {/* Competitors — keyword, cluster, gap */}
            {(activeTool === 'keyword' || activeTool === 'cluster' || activeTool === 'gap') && (
              <div className="form-group">
                <label className="form-label">
                  Main Competitors
                  {activeTool === 'gap' && <span style={{ color: '#f97316', marginLeft: 6 }}>★ Recommended for best results</span>}
                </label>
                <input className="form-input"
                  placeholder="e.g. hubspot.com, salesforce.com, monday.com"
                  value={ts.competitors}
                  onChange={e => setTs({ competitors: e.target.value })} />
              </div>
            )}

            {/* Language + Country */}
            <div className="form-row cols2">
              <div className="form-group">
                <label className="form-label">Language</label>
                <select className="form-select" value={ts.lang} onChange={e => setTs({ lang: e.target.value })}>
                  <option>English</option><option>Hindi</option><option>Spanish</option>
                  <option>French</option><option>German</option><option>Portuguese</option>
                  <option>Arabic</option><option>Japanese</option><option>Chinese</option>
                  <option>Italian</option><option>Dutch</option><option>Russian</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Target Market</label>
                <select className="form-select" value={ts.country} onChange={e => setTs({ country: e.target.value })}>
                  <option>Global</option><option>United States</option><option>India</option>
                  <option>United Kingdom</option><option>Canada</option><option>Australia</option>
                  <option>Germany</option><option>France</option><option>Brazil</option>
                  <option>Japan</option><option>UAE</option><option>Singapore</option>
                </select>
              </div>
            </div>

          </motion.div>
        </AnimatePresence>

        {/* Generate Button */}
        <button className="btn-generate" onClick={handleGenerate} disabled={loading}
          style={{ background: `linear-gradient(135deg, ${activeTool_?.color || '#60a5fa'}, ${activeTool_?.color || '#60a5fa'}99)` }}>
          {loading
            ? <><Loader2 className="animate-spin" size={16} /> Analyzing with AI...</>
            : <><Zap size={16} /> Run {activeTool_?.label}</>}
        </button>

        {/* Loading shimmer */}
        {loading && (
          <div style={{ marginTop: 16 }}>
            <div className="loading-shimmer" style={{ width: '90%', marginBottom: 8 }} />
            <div className="loading-shimmer" style={{ width: '75%', marginBottom: 8 }} />
            <div className="loading-shimmer" style={{ width: '85%', marginBottom: 8 }} />
            <div className="loading-shimmer" style={{ width: '60%' }} />
          </div>
        )}

        {/* ── SERP Live Preview ── */}
        {activeTool === 'serp' && result && !loading && serpPreview.title && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
              Live SERP Preview
            </div>
            <SERPPreview {...serpPreview} />
          </motion.div>
        )}

        {/* ── Content Scorer — Score Rings ── */}
        {activeTool === 'audit' && scores && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: 20, padding: '20px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 20, textAlign: 'center' }}>
              CONTENT SEO SCORES
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
              <ScoreRing score={scores.overall}   label="Overall"     color={sc(scores.overall)} />
              <ScoreRing score={scores.keyword}   label="Keywords"    color={sc(scores.keyword)} />
              <ScoreRing score={scores.readabil}  label="Readability" color={sc(scores.readabil)} />
              <ScoreRing score={scores.structure} label="Structure"   color={sc(scores.structure)} />
              <ScoreRing score={scores.semantic}  label="Semantic"    color={sc(scores.semantic)} />
              <ScoreRing score={scores.intent}    label="Intent"      color={sc(scores.intent)} />
            </div>
          </motion.div>
        )}

        {/* ── Schema — individual JSON copy blocks ── */}
        {activeTool === 'schema' && schemaBlocks.length > 0 && !loading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
              JSON-LD Blocks — Copy individually
            </div>
            {schemaBlocks.map((block, i) => (
              <SchemaBlock key={i} code={block} showToast={showToast} />
            ))}
          </motion.div>
        )}

        {/* ── Result Output ── */}
        {result && !loading && (
          <motion.div className="output-box" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: 16, borderLeft: `3px solid ${activeTool_?.color || '#60a5fa'}` }}>
            <div className="output-header">
              <span className="output-label" style={{ color: activeTool_?.color }}>
                ✓ {activeTool_?.label} Complete
              </span>
              <div className="output-actions">
                <button className="btn-copy" onClick={handleSaveToVault} title="Save to Vault">
                  <BookMarked size={13} /> Save
                </button>
                <button className="btn-copy" onClick={() => { downloadText(result, `seo_${activeTool}.txt`); showToast('Downloaded!'); }}>
                  <Download size={14} /> Download
                </button>
                <button className="btn-copy" onClick={handleCopyAll}>
                  {copied ? <><Check size={13} /> Copied!</> : <><Copy size={14} /> Copy</>}
                </button>
                <button className="btn-copy" onClick={handleGenerate}>
                  <RefreshCw size={13} /> Regenerate
                </button>
              </div>
            </div>
            <div className="output-content">
              <PlainOutput text={result} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SEOOptimizer;