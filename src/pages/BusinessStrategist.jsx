import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import {
  TrendingUp, DollarSign, Swords, Shield,
  Rocket, BarChart2, Loader2, Copy, Download,
  ChevronDown, ChevronUp, RefreshCw, Play, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadText } from '../utils/helpers';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Legend
} from 'recharts';

// ── strip markdown ────────────────────────────────────────────────────────────
const strip = (t = '') =>
  t.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s?/g, '')
   .replace(/`{1,3}/g, '').replace(/_{1,2}/g, '').trim();

const seed = () => Math.random().toString(36).slice(2, 8).toUpperCase();

// ── 6 Expert Agents ───────────────────────────────────────────────────────────
const AGENTS = [
  {
    id: 'market',
    name: 'Market Validator',
    role: 'Demand & Market Research Expert',
    icon: TrendingUp,
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.2)',
    border: 'rgba(96,165,250,0.35)',
    bg: 'rgba(96,165,250,0.07)',
    system: (business, seed) => `You are a senior market research analyst (session: ${seed}) helping someone think through a business idea.
Analyze this business: "${business}"

Provide a market validation framework covering:
1. Market Size — give a reasoned TAM/SAM/SOM estimate based on known patterns in similar markets, and clearly state these are educated estimates, not verified figures
2. Target Customer — specific demographics, psychographics, and the exact pain point this solves for them
3. Demand Signals — what existing behavior or trends suggest people want this (without claiming to have surveyed anyone)
4. Market Timing — why now is or isn't a good time, based on visible trends
5. Growth Trajectory — is this category growing, stable, or shrinking, and why
6. Verdict — GO / NO-GO / PIVOT, with the single biggest reason driving that verdict

Be specific and avoid generic startup-advice fluff. Where you give a number, briefly say what it's based on (e.g. "based on comparable subscription apps in this space").
Write in plain text, no asterisks, no markdown symbols.
Format: Use clear section labels and line breaks. Be direct and honest — including about uncertainty.`,
  },
  {
    id: 'revenue',
    name: 'Revenue Architect',
    role: 'Pricing & Monetization Strategist',
    icon: DollarSign,
    color: '#4ade80',
    glow: 'rgba(74,222,128,0.2)',
    border: 'rgba(74,222,128,0.35)',
    bg: 'rgba(74,222,128,0.07)',
    system: (business, seed) => `You are a revenue strategy expert (session: ${seed}).
Analyze this business: "${business}"

Build a monetization blueprint:
1. Recommended Pricing Model — which model fits best (subscription, one-time, freemium, usage-based, etc.) and the specific reason it fits THIS business, not a generic answer
2. Price Points — suggested starting prices for each tier/product, anchored to what similar products charge
3. Revenue Streams — realistic ways this specific business can make money, not a generic list
4. Unit Economics — rough CAC, LTV, and payback period reasoning (label these as planning estimates, not guarantees)
5. First Revenue Milestone — the most realistic first concrete step to get paying customers
6. Scale Path — what changes operationally and financially as this grows from early traction to a larger scale

Use specific numbers where possible, but be honest when something is a rough planning assumption rather than a guaranteed outcome.
No asterisks, no markdown symbols. Plain text with clear labels.`,
  },
  {
    id: 'competitor',
    name: 'Competitor Assassin',
    role: 'Competitive Intelligence Analyst',
    icon: Swords,
    color: '#f87171',
    glow: 'rgba(248,113,113,0.2)',
    border: 'rgba(248,113,113,0.35)',
    bg: 'rgba(248,113,113,0.07)',
    system: (business, seed) => `You are a competitive intelligence expert (session: ${seed}).
Analyze this business: "${business}"

Deliver a direct, honest competitor analysis:
1. Likely Competitors — name real, known companies/products in this space if you're confident they exist; if you're not certain a specific name is accurate, describe the type of competitor instead of guessing a name
2. Their Weaknesses — specific, plausible gaps in what they offer or how they serve customers
3. Your Possible Edge — what gap or underserved angle this business could own
4. Differentiation Strategy — concrete ways to stand out, not generic "be better" advice
5. Moat Building — realistic ways to make this harder to copy over time
6. First Mover Considerations — is speed an advantage here, or is being second/better more realistic?

Prioritize being useful and honest over sounding impressively certain. If you reference a competitor by name, only do so if it's a well-known company you're confident about.
No asterisks, no markdown symbols. Plain text with clear labels.`,
  },
  {
    id: 'risk',
    name: 'Risk Auditor',
    role: 'Business Risk & Failure Analysis',
    icon: Shield,
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.2)',
    border: 'rgba(251,191,36,0.35)',
    bg: 'rgba(251,191,36,0.07)',
    system: (business, seed) => `You are a business risk analyst (session: ${seed}).
Analyze this business: "${business}"

Produce an honest risk audit covering:
1. Top Failure Modes — the 3-5 most likely, specific ways THIS business fails (not generic startup risks)
2. Market Risks — external threats specific to this market or category
3. Execution Risks — the internal mistakes most likely for someone building this particular thing
4. Financial Risks — cash flow, runway, and funding considerations specific to this business model
5. Legal/Regulatory Risks — any compliance angles worth being aware of for this type of business
6. Mitigation Strategies — one concrete action per risk listed above, not generic advice

Be direct and specific to this business, not generic "startups fail because..." content. Don't sugarcoat, but stay constructive.
No asterisks, no markdown symbols. Plain text with clear labels.`,
  },
  {
    id: 'gtm',
    name: 'GTM Strategist',
    role: 'Go-To-Market & Growth Expert',
    icon: Rocket,
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.2)',
    border: 'rgba(167,139,250,0.35)',
    bg: 'rgba(167,139,250,0.07)',
    system: (business, seed) => `You are a go-to-market strategy expert (session: ${seed}).
Analyze this business: "${business}"

Build a launch strategy:
1. Launch Channels — the 2-3 channels most likely to reach this specific audience first, and why those over others
2. First Customers Playbook — a concrete, step-by-step way to get the first real customers, not "build awareness"
3. Marketing Message — the one sentence that would make the target customer say "I need this"
4. Content Strategy — what kind of content to create and where to put it, specific to this audience
5. Partnership Opportunities — realistic types of partners or channels that could accelerate growth
6. 90-Day Launch Plan — concrete actions for month 1, month 2, month 3
7. Early Budget Allocation — how to prioritize a small initial marketing budget (describe as a percentage split, e.g. "60% on X, 40% on Y" so it works in any currency)

Be specific. Real tactics for this exact business, not generic startup advice.
No asterisks, no markdown symbols. Plain text with clear labels.`,
  },
  {
    id: 'financial',
    name: 'Financial Modeler',
    role: 'Financial Projections & Planning',
    icon: BarChart2,
    color: '#f97316',
    glow: 'rgba(249,115,22,0.2)',
    border: 'rgba(249,115,22,0.35)',
    bg: 'rgba(249,115,22,0.07)',
    system: (business, seed) => `You are a startup financial modeling expert (session: ${seed}).
Analyze this business: "${business}"

Build realistic financial planning guidance:
1. Startup Costs — an itemized list of what's typically needed to launch something like this (state clearly these are planning estimates, not quotes)
2. Monthly Operating Costs — the realistic ongoing cost categories once running
3. Revenue Build-Up — a reasoned month 1-12 growth curve (slow start, then acceleration), explained in relative terms (e.g. "modest in months 1-3 while finding product-market fit")
4. Break-Even Considerations — what needs to be true for this to become profitable, and roughly how long that usually takes for similar businesses
5. Funding Path — does this need outside investment, or can it bootstrap? What's the honest answer for this specific idea?
6. Key Metrics to Track — the 4-5 numbers that actually matter weekly for this kind of business
7. Bootstrapping vs Funding — a clear recommendation with reasoning, not both options listed neutrally

Be specific to this business idea. Use round, sensible figures and explicitly note they're planning estimates, not guarantees.
No asterisks, no markdown symbols. Plain text with clear labels.`,
  },
];

// ── Typing dots ───────────────────────────────────────────────────────────────
const TypingDots = ({ color }) => (
  <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '4px 0' }}>
    {[0, 1, 2].map(i => (
      <motion.div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: color }}
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
    ))}
    <span style={{ fontSize: 12, color, marginLeft: 6, opacity: 0.8 }}>analyzing...</span>
  </div>
);

// ── Agent Card ────────────────────────────────────────────────────────────────
const AgentCard = ({ agent, content, isTyping, expanded, onToggle }) => {
  const Icon = agent.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ marginBottom: 12 }}
    >
      <div style={{
        border: `1px solid ${agent.border}`,
        borderLeft: `3px solid ${agent.color}`,
        borderRadius: 14, overflow: 'hidden',
        background: agent.bg,
        boxShadow: `0 4px 20px ${agent.glow}`,
      }}>
        {/* Header */}
        <div
          onClick={onToggle}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 18px', cursor: 'pointer',
            borderBottom: expanded && content ? `1px solid ${agent.border}` : 'none',
          }}
        >
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: `${agent.color}18`,
            border: `1px solid ${agent.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={17} color={agent.color} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: agent.color }}>{agent.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{agent.role}</div>
          </div>
          {isTyping && <TypingDots color={agent.color} />}
          {!isTyping && content && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                background: `${agent.color}18`, color: agent.color, border: `1px solid ${agent.border}`,
              }}>DONE</span>
              {expanded ? <ChevronUp size={16} color="rgba(255,255,255,0.4)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.4)" />}
            </div>
          )}
        </div>

        {/* Content */}
        <AnimatePresence>
          {expanded && content && !isTyping && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: 13, lineHeight: 1.85, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {content}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(content); }}
                  style={{
                    marginTop: 12, display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                    background: `${agent.color}12`, border: `1px solid ${agent.border}`,
                    color: agent.color, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <Copy size={11} /> Copy this section
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const BusinessStrategist = () => {
  const { activeModel, apiKey, providerKeys, customModels, showToast, saveToVault, setActiveContext } = useContext(AppContext);

  const [business,    setBusiness]    = useState('');
  const [stage,       setStage]       = useState('idea'); // idea | validation | growth
  const [running,     setRunning]     = useState(false);
  const [messages,    setMessages]    = useState([]); // [{agentId, content, typing}]
  const [expanded,    setExpanded]    = useState({}); // {agentId: bool}
  const [currentIdx,  setCurrentIdx]  = useState(-1);
  const [done,        setDone]        = useState(false);
  const [summary,     setSummary]     = useState('');
  const [visualData,  setVisualData]  = useState(null);
  const [calcUsers,   setCalcUsers]   = useState(100);
  const bottomRef = useRef(null);

  const EXAMPLES = [
    'AI-powered resume builder for job seekers in India — ₹499/month SaaS',
    'Homemade healthy meal delivery for working professionals in Bangalore',
    'Online tutoring platform for coding — targeting college students in Tier 2 cities',
    'WhatsApp chatbot builder for small businesses — no-code solution',
    'Sustainable fashion brand selling upcycled clothing on Instagram',
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentIdx]);

  const hasKey = () => {
    const pk = providerKeys || {};
    return apiKey || pk.anthropic || pk.openai || pk.groq || pk.openrouter || pk.google || pk.deepseek;
  };

  const runAnalysis = async () => {
    if (!business.trim()) { showToast('Describe your business idea first', 'warn'); return; }
    if (!hasKey()) { showToast('Add an API key in Settings', 'error'); return; }

    setRunning(true); setMessages([]); setExpanded({}); setDone(false); setSummary(''); setCurrentIdx(-1); setVisualData(null);

    const s = seed();
    const context = `Business Stage: ${stage === 'idea' ? 'Early idea / pre-launch' : stage === 'validation' ? 'Testing / early customers' : 'Growing / scaling'}`;
    const fullBusiness = `${business}\n${context}`;
    const allOutputs = {};

    try {
      for (let i = 0; i < AGENTS.length; i++) {
        const agent = AGENTS[i];
        setCurrentIdx(i);
        setMessages(prev => [...prev, { agentId: agent.id, content: '', typing: true }]);
        setExpanded(prev => ({ ...prev, [agent.id]: false }));

        const systemPrompt = agent.system(fullBusiness, s);
        const result = await callAI(systemPrompt, `Analyze this business comprehensively: "${fullBusiness}"`, null, activeModel, apiKey, providerKeys, customModels);
        const cleaned = strip(result);
        allOutputs[agent.id] = cleaned;

        setMessages(prev => prev.map((m, idx) =>
          idx === prev.length - 1 ? { agentId: agent.id, content: cleaned, typing: false } : m
        ));
        setExpanded(prev => ({ ...prev, [agent.id]: true }));

        await new Promise(r => setTimeout(r, 400));
      }

      // Generate executive summary — wrapped separately so a failure here
      // doesn't wipe out the 6 completed agent analyses above.
      // Uses a local variable (not React state) to avoid stale-closure bugs
      // in the visual-data step right after this.
      setCurrentIdx(6);
      let summaryText = '';
      try {
        const transcript = AGENTS.map(a => `${a.name}:\n${allOutputs[a.id] || ''}`).join('\n\n---\n\n');
        const summaryRes = await callAI(
          `You are a world-class business advisor. Read the full analysis and write a crisp EXECUTIVE SUMMARY. Include: Overall Verdict (Go/No-Go/Pivot), Top 3 Opportunities, Top 3 Risks, First Action This Week. Plain text, no markdown symbols, no asterisks. Be direct and actionable.`,
          `Business: "${business}"\n\nFull Analysis:\n${transcript.slice(0, 8000)}\n\nWrite the executive summary now.`,
          null, activeModel, apiKey, providerKeys, customModels
        );
        summaryText = strip(summaryRes);
        setSummary(summaryText);
      } catch (summaryErr) {
        console.error('Executive summary failed', summaryErr);
        summaryText = 'Executive summary could not be generated (the model may have timed out on the full transcript). The 6 expert analyses above are still complete and valid — scroll up to read them.';
        setSummary(summaryText);
        showToast('Summary failed, but all 6 analyses are saved above', 'warn');
      }

      // ── Extract structured visual data (radar scores, financial inputs, competitor positions) ──
      try {
        const visualPrompt = `Based on this business analysis, output ONLY a JSON object (no markdown, no explanation) with this exact structure:
{
  "scores": {"market":7,"revenue":6,"competition":5,"risk":4,"execution":7,"financial":6},
  "financial": {"startupCost":5000,"monthlyBurn":1500,"avgPrice":29,"estCAC":40,"estLTV":350},
  "competitors": [{"name":"Competitor A","price":3,"features":7},{"name":"Competitor B","price":7,"features":5},{"name":"This Business","price":4,"features":8}]
}
Rules: scores are 1-10 (10=best/strongest). financial numbers are realistic planning estimates in whole numbers (currency-agnostic, just numbers). competitors: 2-4 real or plausible competitor types plus "This Business" as the last entry, price and features both 1-10 scale (price: 1=cheap,10=expensive; features: 1=basic,10=feature-rich).
Business: "${business}"
Analysis summary: ${summaryText.slice(0, 1500)}`;

        const visualRes = await callAI(
          'You output ONLY valid JSON, nothing else. No markdown fences, no explanation text.',
          visualPrompt,
          null, activeModel, apiKey, providerKeys, customModels
        );
        // Robust JSON extraction — strip markdown fences first, then grab the
        // full outermost { ... } object (greedy, multiline). The old regex
        // matched only up to the first }, which broke nested objects.
        const cleaned = (visualRes || '')
          .replace(/```(?:json)?/gi, '')
          .replace(/```/g, '')
          .trim();
        const startIdx = cleaned.indexOf('{');
        const endIdx = cleaned.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          let parsed;
          try {
            parsed = JSON.parse(cleaned.slice(startIdx, endIdx + 1));
          } catch (parseErr) {
            // Last resort: repair common JSON issues (trailing commas, smart quotes)
            const repaired = cleaned
              .slice(startIdx, endIdx + 1)
              .replace(/[\u201c\u201d]/g, '"')
              .replace(/[\u2018\u2019]/g, "'")
              .replace(/,\s*([}\]])/g, '$1');
            parsed = JSON.parse(repaired);
          }
          // Validate it has the expected shape; fill defaults so charts always render
          if (parsed && typeof parsed === 'object') {
            const safe = {
              scores: parsed.scores && typeof parsed.scores === 'object' ? {
                market: Number(parsed.scores.market) || 5,
                revenue: Number(parsed.scores.revenue) || 5,
                competition: Number(parsed.scores.competition) || 5,
                risk: Number(parsed.scores.risk) || 5,
                execution: Number(parsed.scores.execution) || 5,
                financial: Number(parsed.scores.financial) || 5,
              } : null,
              financial: parsed.financial && typeof parsed.financial === 'object' ? parsed.financial : null,
              competitors: Array.isArray(parsed.competitors)
                ? parsed.competitors
                    .filter(c => c && typeof c === 'object')
                    .map(c => ({
                      name: c.name || 'Competitor',
                      price: Number(c.price) || 5,
                      features: Number(c.features) || 5,
                    }))
                : [],
            };
            setVisualData(safe);
          }
        }
      } catch (e) {
        console.error('Visual data extraction failed', e);
        // FALLBACK: don't leave the user with no charts. Derive a best-effort
        // scorecard from the text we already have, so the radar/competitor
        // visuals always render something meaningful.
        try {
          const allText = (summaryText + ' ' + AGENTS.map(a => allOutputs[a.id] || '').join(' ')).toLowerCase();
          // Heuristic scoring from sentiment/keywords in the analysis text
          const positiveSignals = (allText.match(/\b(strong|high|excellent|solid|growing|profitab|advantage|opportunity|scalab|clear demand|willing to pay|recurring)\b/g) || []).length;
          const negativeSignals = (allText.match(/\b(weak|risk|saturated|declining|low|poor|churn|competition is? high|barrier|unproven|uncertain|thin margin)\b/g) || []).length;
          const base = 6;
          const score = (val) => Math.max(2, Math.min(9, base + val));
          const adj = positiveSignals - negativeSignals;
          const fallback = {
            scores: {
              market: score(Math.round(adj * 0.4)),
              revenue: score(Math.round(adj * 0.3)),
              competition: score(Math.round(-adj * 0.2)),
              risk: score(Math.round(-adj * 0.3)),
              execution: score(Math.round(adj * 0.25)),
              financial: score(Math.round(adj * 0.3)),
            },
            financial: { startupCost: 5000, monthlyBurn: 1500, avgPrice: 29, estCAC: 40, estLTV: 350 },
            competitors: [
              { name: 'Budget Option', price: 2, features: 4 },
              { name: 'Premium Rival', price: 8, features: 8 },
              { name: 'This Business', price: 4, features: 7 },
            ],
          };
          setVisualData(fallback);
          showToast('Charts generated from analysis (estimated scores)', 'warn');
        } catch (_) {
          showToast('Visual charts could not be generated', 'warn');
        }
        // Non-critical — charts just won't show if this fails, text report is unaffected
      }

      // Save to vault (use current `summary` state, which is set above either way)
      try {
        const fullReport = AGENTS.map(a => `${a.name.toUpperCase()}\n${'─'.repeat(40)}\n${allOutputs[a.id]}`).join('\n\n') + `\n\nEXECUTIVE SUMMARY\n${'─'.repeat(40)}\n${summaryText}`;
        saveToVault?.('Business Strategist', business, fullReport);
      } catch (vaultErr) {
        console.error('Vault save failed', vaultErr);
        // Non-critical — don't block the user from seeing their results
      }

      setDone(true);
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
      setDone(true); // still show whatever agent results we got, even if something failed
    } finally {
      setRunning(false); setCurrentIdx(-1);
    }
  };

  const copyFullReport = () => {
    const report = messages.map(m => {
      const agent = AGENTS.find(a => a.id === m.agentId);
      return `${agent?.name?.toUpperCase()}\n${'─'.repeat(40)}\n${m.content}`;
    }).join('\n\n') + (summary ? `\n\nEXECUTIVE SUMMARY\n${'─'.repeat(40)}\n${summary}` : '');
    navigator.clipboard.writeText(report);
    showToast('Full report copied!');
  };

  const downloadReport = () => {
    const report = messages.map(m => {
      const agent = AGENTS.find(a => a.id === m.agentId);
      return `${agent?.name?.toUpperCase()}\n${'─'.repeat(40)}\n${m.content}`;
    }).join('\n\n') + (summary ? `\n\nEXECUTIVE SUMMARY\n${'─'.repeat(40)}\n${summary}` : '');
    downloadText(report, 'business_strategy_report.txt');
    showToast('Report downloaded!');
  };

  const toggleExpand = (agentId) => {
    setExpanded(prev => ({ ...prev, [agentId]: !prev[agentId] }));
  };

  const reset = () => {
    setMessages([]); setExpanded({}); setDone(false);
    setSummary(''); setCurrentIdx(-1); setBusiness(''); setVisualData(null); setCalcUsers(100);
  };

  return (
    <div className="page active">
      <div className="section-header">
        <h2 className="section-title">
          <TrendingUp size={20} style={{ color: '#60a5fa', marginRight: 8, verticalAlign: 'middle' }} />
          AI Business Strategist
        </h2>
        <div className="section-sub">
          6 AI experts analyze your business — Market · Revenue · Competition · Risk · Launch · Financials
        </div>
      </div>

      {/* Agent overview */}
      {messages.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10, marginBottom: 20 }}>
            {AGENTS.map(agent => {
              const Icon = agent.icon;
              return (
                <div key={agent.id} style={{
                  padding: '12px 14px', borderRadius: 12,
                  background: agent.bg, border: `1px solid ${agent.border}`,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${agent.color}18`, border: `1px solid ${agent.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} color={agent.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: agent.color }}>{agent.name}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{agent.role.split(' ').slice(0, 2).join(' ')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Input */}
      {!running && messages.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="tool-card" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Describe your business idea</label>
              <textarea
                className="form-textarea" rows="4"
                placeholder="e.g. I want to build an AI-powered resume builder for job seekers in India. Monthly subscription of ₹499. Target: freshers and job switchers..."
                value={business}
                onChange={e => setBusiness(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Business Stage</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { id: 'idea',       label: '💡 Just an idea',        desc: 'Pre-launch' },
                  { id: 'validation', label: '🧪 Testing it',          desc: 'Early customers' },
                  { id: 'growth',     label: '🚀 Already launched',     desc: 'Scaling up' },
                ].map(s => (
                  <button key={s.id} onClick={() => setStage(s.id)} style={{
                    padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                    background: stage === s.id ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${stage === s.id ? '#60a5fa' : 'rgba(255,255,255,0.12)'}`,
                    color: stage === s.id ? '#60a5fa' : 'rgba(255,255,255,0.6)',
                  }}>
                    {s.label} <span style={{ fontSize: 11, opacity: 0.6 }}>— {s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Examples */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Quick examples</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {EXAMPLES.map((ex, i) => (
                  <button key={i} onClick={() => setBusiness(ex)} style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.55)', textAlign: 'left',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#60a5fa'; e.currentTarget.style.color = '#93c5fd'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
                  >
                    → {ex}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-generate" onClick={runAnalysis} disabled={!business.trim()}
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #60a5fa)' }}>
              <Play size={16} /> Run Full Business Analysis — 6 Experts
            </button>
          </div>
        </motion.div>
      )}

      {/* Progress bar */}
      {running && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
          marginBottom: 20, padding: '14px 18px',
          background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
            <span style={{ color: '#60a5fa', fontWeight: 700 }}>
              {currentIdx >= 0 && currentIdx < AGENTS.length
                ? `${AGENTS[currentIdx].name} is analyzing...`
                : currentIdx === 6 ? 'Writing Executive Summary...' : 'Starting analysis...'}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>
              {currentIdx >= 0 ? `${Math.min(currentIdx + 1, AGENTS.length)} / ${AGENTS.length}` : '0 / 6'}
            </span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${currentIdx === 6 ? 100 : ((currentIdx + 1) / AGENTS.length) * 100}%` }}
              transition={{ duration: 0.5 }}
              style={{ height: '100%', background: 'linear-gradient(90deg, #1d4ed8, #60a5fa)', borderRadius: 2 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {AGENTS.map((agent, i) => {
              const Icon = agent.icon;
              const status = i < currentIdx ? 'done' : i === currentIdx ? 'active' : 'pending';
              return (
                <div key={agent.id} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 20,
                  background: status !== 'pending' ? `${agent.color}15` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${status !== 'pending' ? agent.border : 'rgba(255,255,255,0.08)'}`,
                  opacity: status === 'pending' ? 0.4 : 1, transition: 'all 0.3s',
                }}>
                  <Icon size={10} color={status !== 'pending' ? agent.color : 'rgba(255,255,255,0.3)'} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: status !== 'pending' ? agent.color : 'rgba(255,255,255,0.3)' }}>
                    {agent.name.split(' ')[0]}{status === 'done' ? ' ✓' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Business display */}
      {(running || messages.length > 0) && business && (
        <div style={{ marginBottom: 16, padding: '10px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, marginRight: 8 }}>ANALYZING:</span>{business}
        </div>
      )}

      {/* Agent cards */}
      {messages.map((msg, i) => {
        const agent = AGENTS.find(a => a.id === msg.agentId);
        if (!agent) return null;
        return (
          <AgentCard
            key={`${msg.agentId}-${i}`}
            agent={agent}
            content={msg.content}
            isTyping={msg.typing}
            expanded={expanded[msg.agentId] || false}
            onToggle={() => !msg.typing && toggleExpand(msg.agentId)}
          />
        );
      })}

      {/* Executive Summary */}
      {summary && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{
          marginTop: 8, marginBottom: 16,
          background: 'linear-gradient(135deg, rgba(96,165,250,0.07), rgba(167,139,250,0.07))',
          border: '1.5px solid rgba(167,139,250,0.4)',
          borderRadius: 16, padding: '24px 24px',
          boxShadow: '0 4px 30px rgba(167,139,250,0.12)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            ✦ Executive Summary
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.9, color: 'rgba(255,255,255,0.88)', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
            {summary}
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          VISUAL INTELLIGENCE PANELS — radar scorecard, competitor map,
          and a live financial calculator. Built from AI-extracted numbers.
         ═══════════════════════════════════════════════════════════════ */}
      {visualData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

          {/* ROW 1: Radar Scorecard + Competitor Positioning Map */}
          <div className="bs-chart-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 16 }}>

            {/* Radar Scorecard */}
            {visualData.scores && (
              <div className="bs-chart-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
                  📊 Idea Scorecard
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Higher = stronger, based on the analysis above</div>
                <div style={{ width: '100%', height: 260, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={[
                      { axis: 'Market', value: Number(visualData.scores.market) || 5 },
                      { axis: 'Revenue', value: Number(visualData.scores.revenue) || 5 },
                      { axis: 'Vs Competition', value: Number(visualData.scores.competition) || 5 },
                      { axis: 'Low Risk', value: Number(visualData.scores.risk) || 5 },
                      { axis: 'Execution', value: Number(visualData.scores.execution) || 5 },
                      { axis: 'Financial', value: Number(visualData.scores.financial) || 5 },
                    ]}>
                      <PolarGrid stroke="rgba(255,255,255,0.15)" />
                      <PolarAngleAxis dataKey="axis" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }} />
                      <PolarRadiusAxis domain={[0, 10]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} />
                      <Radar dataKey="value" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.35} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                {/* Score values as text fallback — always visible even if chart glitches */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {[['Market',visualData.scores.market],['Revenue',visualData.scores.revenue],['Vs Comp',visualData.scores.competition],['Low Risk',visualData.scores.risk],['Execution',visualData.scores.execution],['Financial',visualData.scores.financial]].map(([k,v]) => (
                    <span key={k} style={{ fontSize: 10, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', color: '#a78bfa', padding: '2px 8px', borderRadius: 8, fontWeight: 700 }}>{k}: {Number(v)||5}/10</span>
                  ))}
                </div>
              </div>
            )}

            {/* Competitor Positioning Map */}
            {visualData.competitors?.length > 0 && (
              <div className="bs-chart-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
                  ⚔️ Competitive Position Map
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Price (x) vs Features (y) — find the open gap</div>
                <div style={{ width: '100%', height: 260, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                      <XAxis type="number" dataKey="price" name="Price" domain={[0, 10]} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} label={{ value: 'Price →', position: 'insideBottom', offset: -10, fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                      <YAxis type="number" dataKey="features" name="Features" domain={[0, 10]} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} label={{ value: 'Features →', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                      <ZAxis range={[120, 120]} />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, fontSize: 12 }}
                        formatter={(value, name) => [value, name]}
                        labelFormatter={() => ''}
                      />
                      <Scatter data={visualData.competitors} fill="#60a5fa">
                        {visualData.competitors.map((entry, i) => (
                          <Cell key={i} fill={entry.name === 'This Business' ? '#fbbf24' : '#60a5fa'} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
                  {visualData.competitors.map((comp, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: comp.name === 'This Business' ? '#fbbf24' : '#60a5fa', display: 'inline-block' }} />
                      {comp.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ROW 2: Live Financial Calculator */}
          {visualData.financial && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
                🧮 Live Revenue Calculator
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Drag the slider — projections recalculate instantly. All figures are planning estimates, not guarantees.</div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Monthly active users</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#4ade80' }}>{calcUsers.toLocaleString()}</span>
                </div>
                <input
                  type="range" min="10" max="10000" step="10" value={calcUsers}
                  onChange={e => setCalcUsers(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#4ade80' }}
                />
              </div>

              {(() => {
                const price = visualData.financial.avgPrice || 20;
                const cac = visualData.financial.estCAC || 30;
                const burn = visualData.financial.monthlyBurn || 1000;
                const startupCost = visualData.financial.startupCost || 3000;
                const revenue = calcUsers * price;
                const marketingCost = calcUsers * 0.1 * cac; // assume 10% are new each month
                const profit = revenue - burn - marketingCost;
                const monthsToBreakEven = profit > 0 ? Math.ceil(startupCost / profit) : null;

                const cards = [
                  { label: 'Monthly Revenue', value: `${revenue.toLocaleString()}`, color: '#4ade80' },
                  { label: 'Est. Monthly Costs', value: `${(burn + marketingCost).toLocaleString()}`, color: '#f87171' },
                  { label: 'Est. Monthly Profit', value: `${profit.toLocaleString()}`, color: profit >= 0 ? '#4ade80' : '#f87171' },
                  { label: 'Break-even In', value: monthsToBreakEven ? `~${monthsToBreakEven} mo` : 'Not yet', color: '#60a5fa' },
                ];

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                    {cards.map((c, i) => (
                      <div key={i} style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{c.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: c.color }}>{c.value}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </motion.div>
      )}

      {/* Done actions */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <button onClick={copyFullReport} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9,
            background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)',
            color: '#60a5fa', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Copy size={14} /> Copy Full Report
          </button>
          <button onClick={downloadReport} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9,
            background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
            color: '#4ade80', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Download size={14} /> Download Report
          </button>
          <button onClick={() => {
            setActiveContext(`Business: ${business}. Key summary: ${summary.slice(0, 600)}`, 'Business Strategist');
            showToast('Saved! Other tools can now use this business context.', 'success');
          }} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9,
            background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)',
            color: '#a78bfa', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            🧠 Remember This Business
          </button>
          <button onClick={reset} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            marginLeft: 'auto',
          }}>
            <RefreshCw size={13} /> New Analysis
          </button>
        </motion.div>
      )}

      <div ref={bottomRef} />

      <style>{`
        /* ── CHART FIX: Recharts needs explicit width on grid children ──
           Without minWidth:0 + overflow:hidden wrapper, ResponsiveContainer
           collapses to 0 width inside CSS grid. */
        .bs-chart-card {
          min-width: 0;
          overflow: hidden;
        }
        .bs-chart-row {
          min-width: 0;
        }
        .bs-chart-card .recharts-wrapper,
        .bs-chart-card .recharts-surface {
          width: 100% !important;
          max-width: 100% !important;
        }
        @media (max-width: 900px) {
          .bs-chart-row { grid-template-columns: 1fr !important; }
          .bs-chart-card { padding: 16px !important; }
        }
        @media (max-width: 600px) {
          .bs-chart-card { padding: 14px 12px !important; }
        }
      `}</style>
    </div>
  );
};

export default BusinessStrategist;