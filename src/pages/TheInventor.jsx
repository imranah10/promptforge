import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import {
  Lightbulb, Zap, BarChart2, AlertTriangle, Crown,
  Rocket, Sparkles, Copy, Save, ChevronDown, Play,
  Users, Brain, Target, Shield, Download, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ─── AGENT CONFIG ───────────────────────────────────────────────────────────
const AGENTS = [
  {
    id: 'visionary',
    name: 'The Visionary',
    role: 'CEO / Strategy',
    icon: Lightbulb,
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.25)',
    border: 'rgba(167,139,250,0.4)',
    bg: 'rgba(167,139,250,0.08)',
    system: `You are THE VISIONARY — a bold, inspiring CEO-level strategist.
Your job: Given the user's massive goal, pitch a high-level, exciting strategy.
Be visionary, ambitious, and inspiring. Paint the big picture.
Focus on the "Why" and the opportunity. 
Format: Use short paragraphs. Max 200 words. End with a bold one-liner vision statement.`,
  },
  {
    id: 'hacker',
    name: 'The Hacker',
    role: 'CTO / Growth',
    icon: Zap,
    color: '#4ade80',
    glow: 'rgba(74,222,128,0.25)',
    border: 'rgba(74,222,128,0.4)',
    bg: 'rgba(74,222,128,0.08)',
    system: `You are THE HACKER — an aggressive, unconventional CTO and growth hacker.
You've read The Visionary's pitch. 
Your job: Find the technical shortcuts, viral loops, unfair advantages, and 2-3 real flaws in the plan.
Be direct, sharp, and technical. No fluff.
Format: Use bullet points for flaws, then bullet points for hacks/shortcuts. Max 200 words.`,
  },
  {
    id: 'analyst',
    name: 'The Analyst',
    role: 'CFO / Data',
    icon: BarChart2,
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.25)',
    border: 'rgba(96,165,250,0.4)',
    bg: 'rgba(96,165,250,0.08)',
    system: `You are THE ANALYST — a data-driven CFO and market researcher.
You've read the full debate so far.
Your job: Add hard numbers, metrics, revenue projections, market size, unit economics.
Be specific with real figures (TAM, CAC, LTV, MRR targets, timeline).
Format: Use a mini table or bullet points with numbers. Max 200 words.`,
  },
  {
    id: 'critic',
    name: 'The Critic',
    role: 'Risk / Devil\'s Advocate',
    icon: AlertTriangle,
    color: '#f87171',
    glow: 'rgba(248,113,113,0.25)',
    border: 'rgba(248,113,113,0.4)',
    bg: 'rgba(248,113,113,0.08)',
    system: `You are THE CRITIC — a brutal, honest risk analyst and devil's advocate.
You've read the entire debate above.
Your job: List EXACTLY 5 specific reasons this plan will FAIL if these issues aren't addressed.
Be harsh, specific, and constructive. No soft language.
Format: Numbered list 1-5 with a one-line fix for each risk. Max 200 words.`,
  },
  {
    id: 'synthesis',
    name: 'Master Blueprint',
    role: 'Final Synthesis',
    icon: Crown,
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.25)',
    border: 'rgba(251,191,36,0.4)',
    bg: 'rgba(251,191,36,0.06)',
    system: `You are THE MASTER ARCHITECT — the world's greatest strategic synthesizer.
You've read the entire board debate above (Visionary, Hacker, Analyst, Critic).
Your job: Create the ULTIMATE BLUEPRINT that:
1. Takes the best ideas from all 4 agents
2. Directly addresses every risk the Critic raised
3. Incorporates the Hacker's growth tactics
4. Uses the Analyst's numbers

FORMAT (mandatory markdown structure):
# [Compelling Name for This Strategy]
## 🎯 Mission Statement
## 💡 Core Strategy (best of all perspectives)
## ⚡ Unfair Advantages & Growth Hacks
## 📊 Key Metrics & Financial Targets
## 🛡️ Risk Mitigation (address all 5 critic points)
## 🗓️ 30-60-90 Day Action Plan
| Day Range | Milestone | Owner | KPI |
## 🚀 First 3 Actions to Take Tomorrow

Be extremely detailed. Minimum 600 words. This is the final deliverable.`,
  },
];

// ─── TYPING DOTS ─────────────────────────────────────────────────────────────
const TypingDots = ({ color }) => (
  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', padding: '4px 0' }}>
    {[0, 1, 2].map(i => (
      <motion.div
        key={i}
        style={{ width: 7, height: 7, borderRadius: '50%', background: color }}
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
      />
    ))}
    <span style={{ fontSize: 12, color: color, marginLeft: 6, opacity: 0.8 }}>thinking...</span>
  </div>
);

// ─── AGENT MESSAGE CARD ───────────────────────────────────────────────────────
const AgentCard = ({ agent, content, isTyping, index }) => {
  const Icon = agent.icon;
  const isSynthesis = agent.id === 'synthesis';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: 0.05 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        marginBottom: isSynthesis ? 0 : 20,
      }}
    >
      {/* Agent Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
        paddingLeft: isSynthesis ? 0 : 4
      }}>
        <div style={{
          width: isSynthesis ? 42 : 36,
          height: isSynthesis ? 42 : 36,
          borderRadius: isSynthesis ? 12 : '50%',
          background: agent.bg,
          border: `1.5px solid ${agent.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 16px ${agent.glow}`,
          flexShrink: 0,
        }}>
          <Icon size={isSynthesis ? 20 : 16} color={agent.color} />
        </div>
        <div>
          <div style={{
            fontSize: isSynthesis ? 15 : 13,
            fontWeight: 800,
            color: agent.color,
            letterSpacing: '0.3px',
          }}>
            {agent.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
            {agent.role}
          </div>
        </div>
        {isSynthesis && (
          <div style={{
            marginLeft: 'auto',
            padding: '3px 10px',
            borderRadius: 20,
            background: 'rgba(251,191,36,0.1)',
            border: '1px solid rgba(251,191,36,0.3)',
            fontSize: 10,
            fontWeight: 700,
            color: '#fbbf24',
            letterSpacing: '0.5px',
          }}>
            ✦ FINAL OUTPUT
          </div>
        )}
      </div>

      {/* Message Bubble */}
      <div style={{
        background: isSynthesis ? 'rgba(251,191,36,0.04)' : agent.bg,
        border: `1px solid ${agent.border}`,
        borderLeft: `3px solid ${agent.color}`,
        borderRadius: isSynthesis ? 16 : 12,
        padding: isSynthesis ? '28px 32px' : '16px 20px',
        boxShadow: `0 2px 24px ${agent.glow}`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {isSynthesis && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)`,
          }} />
        )}

        {isTyping ? (
          <TypingDots color={agent.color} />
        ) : (
          <div style={{
            fontSize: isSynthesis ? 15 : 14,
            lineHeight: 1.85,
            color: 'var(--text)',
          }} className="markdown-council">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const TheInventor = () => {
  const { providerKeys, showToast, activeModel, apiKey, customModels, saveToVault } = useContext(AppContext);

  const [goal, setGoal] = useState('');
  const [running, setRunning] = useState(false);
  const [messages, setMessages] = useState([]); // { agentId, content, typing }
  const [currentAgentIdx, setCurrentAgentIdx] = useState(-1);
  const [blueprint, setBlueprint] = useState('');
  const [done, setDone] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pf_inventor_history') || '[]'); } catch { return []; }
  });
  const bottomRef = useRef(null);
  const debateRef = useRef(null);
  const cancelRef = useRef(false);

  const EXAMPLES = [
    'Launch a YouTube channel to 1 million subscribers in 12 months',
    'Build a $1M/year SaaS product as a solo founder',
    'Create a global online education platform for emerging markets',
    'Start a profitable e-commerce brand with $500 starting budget',
    'Build an AI consulting agency from zero to $10K/month',
  ];

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentAgentIdx]);

  const hasKey = () => {
    const pk = providerKeys || {};
    return apiKey || pk.anthropic || pk.openai || pk.groq || pk.openrouter || pk.google || pk.deepseek;
  };

  const runDebate = async () => {
    if (!goal.trim()) { showToast('Enter your goal first.', 'error'); return; }
    if (!hasKey()) { showToast('Add an API key in Settings first.', 'error'); return; }

    cancelRef.current = false;
    setRunning(true);
    setMessages([]);
    setBlueprint('');
    setDone(false);
    setCurrentAgentIdx(-1);

    let fullTranscript = `USER GOAL: ${goal}\n\n`;

    try {
      // Run agents 0-3 (debate agents)
      for (let i = 0; i < 4; i++) {
        if (cancelRef.current) return;
        const agent = AGENTS[i];
        setCurrentAgentIdx(i);

        // Add typing indicator
        setMessages(prev => [...prev, { agentId: agent.id, content: '', typing: true }]);

        // Build context messages
        const contextMsg = i === 0
          ? `The user wants to achieve this goal: "${goal}"\n\nGive your perspective as ${agent.name}.`
          : `The user's goal is: "${goal}"\n\nHere is the debate so far:\n${fullTranscript}\nNow give your perspective as ${agent.name}.`;

        const msgs = [
          { role: 'system', content: agent.system },
          { role: 'user', content: contextMsg },
        ];

        const result = await callAI(msgs, activeModel, activeModel, apiKey, providerKeys, customModels);
        if (cancelRef.current) return;

        fullTranscript += `--- ${agent.name.toUpperCase()} (${agent.role}) ---\n${result}\n\n`;

        // Replace typing with real content
        setMessages(prev => prev.map((m, idx) =>
          idx === prev.length - 1 ? { agentId: agent.id, content: result, typing: false } : m
        ));

        // Small pause between agents for dramatic effect
        await new Promise(r => setTimeout(r, 600));
      }

      if (cancelRef.current) return;

      // Run synthesis agent
      const synthAgent = AGENTS[4];
      setCurrentAgentIdx(4);
      setMessages(prev => [...prev, { agentId: synthAgent.id, content: '', typing: true }]);

      const synthMsgs = [
        { role: 'system', content: synthAgent.system },
        {
          role: 'user',
          content: `User's original goal: "${goal}"\n\nFull board debate:\n${fullTranscript}\n\nNow synthesize the ultimate blueprint.`,
        },
      ];

      const synthResult = await callAI(synthMsgs, activeModel, activeModel, apiKey, providerKeys, customModels);
      if (cancelRef.current) return;

      setMessages(prev => prev.map((m, idx) =>
        idx === prev.length - 1 ? { agentId: synthAgent.id, content: synthResult, typing: false } : m
      ));

      setBlueprint(synthResult);
      setDone(true);

      // Save to localStorage history
      const histItem = { id: Date.now(), goal: goal.slice(0, 100), blueprint: synthResult, time: new Date().toLocaleString() };
      setHistory(prev => {
        const updated = [histItem, ...prev].slice(0, 8);
        try { localStorage.setItem('pf_inventor_history', JSON.stringify(updated)); } catch (_) {}
        return updated;
      });

    } catch (e) {
      if (cancelRef.current) return;
      showToast('Error: ' + e.message, 'error');
    } finally {
      setRunning(false);
      setCurrentAgentIdx(-1);
    }
  };

  const copyBlueprint = () => {
    const clean = blueprint.replace(/#{1,6}\s/g, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '');
    navigator.clipboard.writeText(clean);
    showToast('Blueprint copied!');
  };

  const downloadBlueprint = () => {
    const safeGoal = goal.replace(/[^a-z0-9]+/gi, '_').slice(0, 40);
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([blueprint], { type: 'text/markdown' })),
      download: `blueprint_${safeGoal}_${Date.now()}.md`,
    });
    a.click(); URL.revokeObjectURL(a.href);
    showToast('Blueprint downloaded!');
  };

  const handleCancel = () => {
    cancelRef.current = true;
    setRunning(false);
    setCurrentAgentIdx(-1);
    // Remove last typing indicator if present
    setMessages(prev => prev.filter(m => !m.typing));
    showToast('Council stopped', 'warn');
  };

  const saveBlueprint = () => {
    if (saveToVault) {
      saveToVault('AI Council', goal, blueprint);
      showToast('Saved to Vault!');
    }
  };

  const reset = () => {
    setMessages([]);
    setBlueprint('');
    setDone(false);
    setCurrentAgentIdx(-1);
    // keep goal so user can re-run without retyping
  };

  return (
    <div className="page active">
      {/* ── Header ── */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'rgba(167,139,250,0.1)',
            border: '1px solid rgba(167,139,250,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(167,139,250,0.2)',
          }}>
            <Users size={22} color="#a78bfa" />
          </div>
          <div>
            <h2 className="section-title">
              The <span style={{ color: '#a78bfa' }}>Inventor</span>
              <span style={{
                marginLeft: 12, fontSize: 11, fontWeight: 700,
                padding: '3px 10px', borderRadius: 20,
                background: 'rgba(167,139,250,0.1)',
                border: '1px solid rgba(167,139,250,0.3)',
                color: '#a78bfa', letterSpacing: '0.5px', verticalAlign: 'middle',
              }}>AI COUNCIL</span>
            </h2>
            <div className="section-sub">
              4 AI agents debate your goal in real-time → Master Blueprint synthesized
            </div>
          </div>
        </div>
        {/* History button */}
        {history.length > 0 && (
          <button onClick={() => setShowHistory(h => !h)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
            color: 'var(--text2)', fontSize: 12, fontWeight: 700, position: 'relative',
          }}>
            History
            <span style={{
              position: 'absolute', top: -6, right: -6,
              background: '#a78bfa', color: '#fff', borderRadius: '50%',
              width: 16, height: 16, fontSize: 9, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{history.length}</span>
          </button>
        )}
      </div>

      {/* ── History Panel ── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{
              background: 'var(--bg3)', border: '1px solid rgba(167,139,250,0.3)',
              borderRadius: 14, padding: 16, marginBottom: 20, maxWidth: 860, margin: '0 auto 20px',
            }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#a78bfa', letterSpacing: '1px', marginBottom: 12 }}>RECENT BLUEPRINTS</div>
            {history.map((h) => (
              <div key={h.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: 10, marginBottom: 6,
                background: 'var(--bg)', border: '1px solid var(--border)',
              }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{h.goal}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{h.time}</div>
                </div>
                <button onClick={() => {
                  setGoal(h.goal); setBlueprint(h.blueprint); setDone(true);
                  setMessages([]); setShowHistory(false); showToast('Blueprint restored!');
                }} style={{
                  fontSize: 11, color: '#a78bfa', background: 'rgba(167,139,250,0.1)',
                  border: '1px solid rgba(167,139,250,0.3)', borderRadius: 6,
                  padding: '4px 10px', cursor: 'pointer', fontWeight: 700,
                }}>Restore</button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* ── Agent Legend ── */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12, marginBottom: 28,
            }}
          >
            {AGENTS.map(agent => {
              const Icon = agent.icon;
              return (
                <div key={agent.id} style={{
                  background: agent.bg,
                  border: `1px solid ${agent.border}`,
                  borderRadius: 12, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: `${agent.color}15`,
                    border: `1px solid ${agent.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={15} color={agent.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: agent.color }}>{agent.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{agent.role}</div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* ── Input Card ── */}
        {!running && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{ padding: '32px 36px', marginBottom: 28 }}
          >
            <div style={{ marginBottom: 16 }}>
              <label style={{
                fontSize: 11, fontWeight: 800, letterSpacing: '0.8px',
                color: 'var(--text3)', textTransform: 'uppercase',
              }}>
                YOUR MASSIVE GOAL
              </label>
            </div>

            <textarea
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="e.g. Build a $1M/year SaaS as a solo founder..."
              rows={3}
              style={{
                width: '100%', background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: 12, padding: '16px 18px',
                color: 'var(--text)', fontSize: 16, fontFamily: 'inherit',
                resize: 'none', outline: 'none',
                transition: 'border-color 0.2s',
                lineHeight: 1.6,
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />

            {/* Example chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14, marginBottom: 24 }}>
              <span style={{ fontSize: 11, color: 'var(--text3)', alignSelf: 'center' }}>Examples:</span>
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setGoal(ex)}
                  style={{
                    padding: '5px 12px', borderRadius: 20,
                    background: 'var(--bg3)',
                    border: '1px solid var(--border)',
                    color: 'var(--text2)', fontSize: 12,
                    cursor: 'pointer', transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => {
                    e.target.style.background = 'rgba(167,139,250,0.1)';
                    e.target.style.borderColor = 'rgba(167,139,250,0.4)';
                    e.target.style.color = '#a78bfa';
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = 'var(--bg3)';
                    e.target.style.borderColor = 'var(--border)';
                    e.target.style.color = 'var(--text2)';
                  }}
                >
                  {ex.length > 42 ? ex.slice(0, 42) + '…' : ex}
                </button>
              ))}
            </div>

            <button
              onClick={runDebate}
              disabled={!goal.trim()}
              style={{
                width: '100%', padding: '14px 24px',
                background: goal.trim()
                  ? 'linear-gradient(135deg, #a78bfa, #7c3aed)'
                  : 'var(--bg3)',
                border: 'none', borderRadius: 12,
                color: goal.trim() ? '#fff' : 'var(--text3)',
                fontSize: 15, fontWeight: 800, cursor: goal.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontFamily: 'inherit',
                boxShadow: goal.trim() ? '0 4px 24px rgba(124,58,237,0.4)' : 'none',
                transition: 'all 0.3s',
              }}
            >
              <Play size={17} />
              Convene the AI Council
            </button>
          </motion.div>
        )}

        {/* ── Progress Bar ── */}
        {running && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              marginBottom: 24,
              background: 'rgba(167,139,250,0.06)',
              border: '1px solid rgba(167,139,250,0.2)',
              borderRadius: 12, padding: '16px 20px',
            }}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 10, fontSize: 12,
              color: 'var(--text2)',
            }}>
              <span style={{ fontWeight: 700, color: '#a78bfa' }}>
                {currentAgentIdx >= 0 && currentAgentIdx < 5
                  ? `${AGENTS[currentAgentIdx].name} is speaking...`
                  : 'Initializing Council...'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>{Math.round(((currentAgentIdx + 1) / 5) * 100)}%</span>
                <button onClick={handleCancel} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.35)',
                  color: '#f87171', borderRadius: 7, padding: '4px 10px',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}><X size={11}/> Stop</button>
              </div>
            </div>
            <div style={{
              height: 4, background: 'var(--bg3)',
              borderRadius: 2, overflow: 'hidden',
            }}>
              <motion.div
                animate={{ width: `${((currentAgentIdx + 1) / 5) * 100}%` }}
                transition={{ duration: 0.5 }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                  borderRadius: 2,
                }}
              />
            </div>
            <div style={{
              display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap',
            }}>
              {AGENTS.map((agent, i) => {
                const Icon = agent.icon;
                const status = i < currentAgentIdx ? 'done' : i === currentAgentIdx ? 'active' : 'pending';
                return (
                  <div key={agent.id} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 20,
                    background: status === 'done'
                      ? `${agent.color}18`
                      : status === 'active'
                        ? `${agent.color}22`
                        : 'var(--bg3)',
                    border: `1px solid ${status !== 'pending' ? agent.border : 'var(--border)'}`,
                    opacity: status === 'pending' ? 0.4 : 1,
                    transition: 'all 0.3s',
                  }}>
                    <Icon size={11} color={status !== 'pending' ? agent.color : 'var(--text3)'} />
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: status !== 'pending' ? agent.color : 'var(--text3)',
                    }}>
                      {agent.name.split(' ')[1]}
                      {status === 'done' && ' ✓'}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Goal display when debate is running ── */}
        {(running || messages.length > 0) && goal && (
          <div style={{
            marginBottom: 20, padding: '12px 18px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            fontSize: 14, color: 'var(--text)',
          }}>
            <span style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 700, marginRight: 8 }}>GOAL:</span>
            {goal}
          </div>
        )}

        {/* ── Debate Messages ── */}
        <div ref={debateRef}>
          <AnimatePresence>
            {messages.map((msg, i) => {
              const agent = AGENTS.find(a => a.id === msg.agentId);
              if (!agent) return null;
              return (
                <AgentCard
                  key={`${msg.agentId}-${i}`}
                  agent={agent}
                  content={msg.content}
                  isTyping={msg.typing}
                  index={i}
                />
              );
            })}
          </AnimatePresence>
        </div>

        {/* ── Blueprint Actions ── */}
        {done && blueprint && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: 28 }}
          >
            {/* Action buttons */}
            <div style={{
              display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16,
            }}>
              <button
                onClick={copyBlueprint}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 18px', borderRadius: 9,
                  background: 'rgba(251,191,36,0.1)',
                  border: '1px solid rgba(251,191,36,0.35)',
                  color: '#fbbf24', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
              >
                <Copy size={14} /> Copy Blueprint
              </button>

              {saveToVault && (
                <button
                  onClick={saveBlueprint}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '9px 18px', borderRadius: 9,
                    background: 'rgba(96,165,250,0.1)',
                    border: '1px solid rgba(96,165,250,0.35)',
                    color: '#60a5fa', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.2s',
                  }}
                >
                  <Save size={14} /> Save to Vault
                </button>
              )}

              <button
                onClick={downloadBlueprint}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 18px', borderRadius: 9,
                  background: 'rgba(74,222,128,0.1)',
                  border: '1px solid rgba(74,222,128,0.35)',
                  color: '#4ade80', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
              >
                <Download size={14} /> Download .md
              </button>

              <button
                onClick={reset}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 18px', borderRadius: 9,
                  background: 'var(--bg3)',
                  border: '1px solid var(--border)',
                  color: 'var(--text2)', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  marginLeft: 'auto',
                }}
              >
                New Session
              </button>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Styles ── */}
      <style>{`
        .markdown-council p { margin: 0 0 10px; }
        .markdown-council p:last-child { margin-bottom: 0; }
        .markdown-council h1, .markdown-council h2, .markdown-council h3 {
          color: var(--text); font-weight: 800; margin: 20px 0 10px;
          letter-spacing: -0.3px;
        }
        .markdown-council h1 { font-size: 20px; }
        .markdown-council h2 { font-size: 17px; color: var(--accent2); }
        .markdown-council h3 { font-size: 15px; color: var(--accent3); }
        .markdown-council ul, .markdown-council ol {
          padding-left: 0; list-style: none; margin: 8px 0;
        }
        .markdown-council li {
          padding: 8px 14px; margin-bottom: 6px;
          background: var(--bg3);
          border-left: 2px solid var(--accent);
          border-radius: 0 8px 8px 0;
          font-size: 14px; line-height: 1.7;
          color: var(--text);
        }
        .markdown-council strong { color: #fbbf24; font-weight: 700; }
        .markdown-council em { color: var(--text2); font-style: italic; }
        .markdown-council code {
          background: var(--bg3); padding: 2px 7px;
          border-radius: 5px; font-size: 13px; font-family: monospace;
          color: var(--pink);
        }
        .markdown-council table {
          width: 100%; border-collapse: collapse; margin: 14px 0;
          font-size: 13px;
        }
        .markdown-council th {
          background: rgba(251,191,36,0.1); color: #fbbf24;
          padding: 8px 12px; text-align: left; font-weight: 700;
          border: 1px solid var(--border);
        }
        .markdown-council td {
          padding: 8px 12px; border: 1px solid var(--border);
          color: var(--text);
        }
        .markdown-council tr:nth-child(even) td {
          background: var(--bg2);
        }
        .markdown-council blockquote {
          border-left: 3px solid #a78bfa;
          padding: 10px 16px;
          background: rgba(167,139,250,0.06);
          border-radius: 0 8px 8px 0;
          margin: 12px 0;
          color: var(--text2);
          font-style: italic;
        }
        .markdown-council hr {
          border: none; border-top: 1px solid var(--border);
          margin: 16px 0;
        }
        @media (max-width: 600px) {
          .markdown-council { font-size: 13px; }
        }
      `}</style>
    </div>
  );
};

export default TheInventor;