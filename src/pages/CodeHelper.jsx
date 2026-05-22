import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import {
  Copy, Zap, Loader2, Code2, Download,
  GitCommit, Shield, Search, RefreshCw,
  Check, Terminal, FileCode, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadText } from '../utils/helpers';

// ─── LANGUAGE → FILE EXTENSION ───────────────────────────────────────────────
const getExt = (lang) => {
  const l = lang.toLowerCase();
  if (l.includes('python'))     return 'py';
  if (l.includes('typescript')) return 'ts';
  if (l.includes('react'))      return 'jsx';
  if (l.includes('javascript') || l.includes('node')) return 'js';
  if (l.includes('html'))       return 'html';
  if (l.includes('css'))        return 'css';
  if (l.includes('java') && !l.includes('script')) return 'java';
  if (l.includes('c++'))        return 'cpp';
  if (l.includes('c#'))         return 'cs';
  if (l.includes('go'))         return 'go';
  if (l.includes('rust'))       return 'rs';
  if (l.includes('php'))        return 'php';
  if (l.includes('ruby'))       return 'rb';
  if (l.includes('swift'))      return 'swift';
  if (l.includes('sql'))        return 'sql';
  if (l.includes('shell') || l.includes('bash')) return 'sh';
  if (l.includes('dart'))       return 'dart';
  return 'txt';
};

const TASKS = [
  'Fix / debug this code',
  'Explain this code',
  'Write code from scratch',
  'Convert to another language',
  'Optimize / improve performance',
  'Add comments / documentation',
  'Write unit tests',
  'Review code quality',
  'Add error handling',
  'Refactor / clean up',
];

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'React / JSX', 'Python', 'Node.js',
  'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift',
  'Kotlin', 'SQL', 'HTML/CSS', 'Shell/Bash', 'Dart/Flutter',
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const CodeHelper = () => {
  const { activeModel, apiKey, providerKeys, customModels, showToast, saveToVault } = useContext(AppContext);

  const [activeTool, setActiveTool] = useState('code'); // code | git | security

  // Code tool
  const [task,    setTask]    = useState('Fix / debug this code');
  const [lang,    setLang]    = useState('JavaScript');
  const [code,    setCode]    = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState('');

  // Git commit
  const [gitCode,    setGitCode]    = useState('');
  const [gitType,    setGitType]    = useState('auto');
  const [gitLoading, setGitLoading] = useState(false);
  const [gitResult,  setGitResult]  = useState(null); // {commits: [{type, scope, msg, body}]}
  const [copiedGit,  setCopiedGit]  = useState(null);

  // Security audit
  const [secCode,    setSecCode]    = useState('');
  const [secLang,    setSecLang]    = useState('JavaScript');
  const [secLoading, setSecLoading] = useState(false);
  const [secResult,  setSecResult]  = useState(null);

  // ── 1. CODE HELPER ───────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!code.trim()) { showToast('Paste your code or describe what to build', 'warn'); return; }
    setLoading(true); setResult('');

    const system = `You are a senior software engineer and expert in ${lang} with 15+ years of experience. You write clean, efficient, well-commented code and explain things clearly. Always provide working, production-ready code.`;

    let prompt = `Task: ${task}\nLanguage: ${lang}\n`;
    if (context) prompt += `Context: ${context}\n`;
    prompt += `\nCode:\n${code}\n\n`;

    const taskInstructions = {
      'Fix / debug this code':            'Identify ALL bugs, explain what was wrong (with line references), then provide the complete fixed code.',
      'Explain this code':                'Give a clear, thorough explanation. Use sections: Overview, Key Functions, Logic Flow, Potential Issues.',
      'Optimize / improve performance':   'Identify bottlenecks with Big-O analysis, then provide optimized version with before/after comparison.',
      'Write unit tests':                 'Write comprehensive tests covering happy path, edge cases, and error cases.',
      'Review code quality':              'Review for: readability, maintainability, performance, security, best practices. Score 1-10 each.',
      'Add error handling':               'Add robust error handling, input validation, and graceful failure modes.',
      'Add comments / documentation':     'Add JSDoc/docstrings, inline comments, and a module-level description.',
      'Refactor / clean up':              'Refactor for clean code: DRY, SOLID principles, better naming. Explain each change.',
      'Convert to another language':      `Convert to ${lang}. Maintain exact logic. Follow ${lang} conventions and idioms.`,
      'Write code from scratch':          'Write clean, well-structured, production-ready code. Include error handling and comments.',
    };

    prompt += taskInstructions[task] || 'Provide a clear, structured response.';
    prompt += '\n\nFormat with markdown. Use code blocks for all code.';

    try {
      const res = await callAI(system, prompt, null, activeModel, apiKey, providerKeys, customModels);
      setResult(res);
      saveToVault?.('Code Helper', `${task} | ${lang}`, res);
    } catch (e) { setResult('❌ Error: ' + e.message); }
    finally { setLoading(false); }
  };

  // ── 2. GIT COMMIT GENERATOR ──────────────────────────────────────────────
  const handleGitCommit = async () => {
    if (!gitCode.trim()) { showToast('Paste your code changes or git diff', 'warn'); return; }
    setGitLoading(true); setGitResult(null);

    const system = `You are an expert at writing perfect git commit messages following the Conventional Commits specification.

Respond ONLY in this exact JSON format (no markdown, no extra text):
{
  "commits": [
    {
      "type": "feat",
      "scope": "auth",
      "message": "add OTP-based email login",
      "body": "- Implement 6-digit OTP generation\\n- Add email delivery via SendGrid\\n- Set 10-minute expiry on tokens",
      "full": "feat(auth): add OTP-based email login\\n\\n- Implement 6-digit OTP generation\\n- Add email delivery via SendGrid\\n- Set 10-minute expiry on tokens"
    }
  ],
  "recommended": 0,
  "summary": "Brief explanation of what changed"
}

Generate 3 commit message options (concise, standard, detailed) for the same change.
Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build`;

    const prompt = `Analyze these code changes and generate 3 git commit message options:

${gitCode}

${gitType !== 'auto' ? `Preferred commit type: ${gitType}` : 'Auto-detect the best commit type.'}

Create 3 versions: (0) concise one-liner, (1) standard with scope, (2) detailed with body.
Mark recommended as 1 (standard) unless obvious reason to change.`;

    try {
      const raw = await callAI(system, prompt, null, activeModel, apiKey, providerKeys, customModels);
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setGitResult(parsed);
    } catch (e) {
      // Fallback
      setGitResult({
        commits: [
          { type: 'feat', scope: '', message: 'update code', body: '', full: 'feat: update code' },
        ],
        recommended: 0,
        summary: 'Could not parse. Try again.',
      });
    }
    finally { setGitLoading(false); }
  };

  const copyCommit = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedGit(idx);
    setTimeout(() => setCopiedGit(null), 2000);
    showToast('Commit message copied!');
  };

  const COMMIT_TYPE_COLORS = {
    feat:     { bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.3)',  color: '#4ade80'  },
    fix:      { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', color: '#f87171'  },
    docs:     { bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.3)',  color: '#60a5fa'  },
    refactor: { bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)', color: '#a78bfa'  },
    perf:     { bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)',  color: '#fbbf24'  },
    test:     { bg: 'rgba(34,211,238,0.1)',  border: 'rgba(34,211,238,0.3)',  color: '#22d3ee'  },
    chore:    { bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)', color: '#94a3b8'  },
    style:    { bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.3)', color: '#f472b6'  },
    ci:       { bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)',  color: '#fbbf24'  },
    build:    { bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.3)',  color: '#f97316'  },
  };

  // ── 3. SECURITY AUDIT ────────────────────────────────────────────────────
  const handleSecurityAudit = async () => {
    if (!secCode.trim()) { showToast('Paste your code to audit', 'warn'); return; }
    setSecLoading(true); setSecResult(null);

    const system = `You are a senior security engineer and penetration tester with expertise in ${secLang} application security.

Respond ONLY in this exact JSON format (no markdown, no extra text):
{
  "overall_score": 72,
  "risk_level": "Medium",
  "vulnerabilities": [
    {
      "severity": "Critical",
      "type": "SQL Injection",
      "line": "Line 23",
      "description": "User input directly concatenated into SQL query",
      "fix": "Use parameterized queries or prepared statements"
    }
  ],
  "good_practices": ["Input validation present", "HTTPS enforced"],
  "quick_wins": ["Add rate limiting", "Sanitize all user inputs", "Use environment variables for secrets"],
  "summary": "2-3 sentence overall assessment"
}`;

    const prompt = `Perform a comprehensive security audit of this ${secLang} code:

${secCode}

Check for: SQL injection, XSS, CSRF, authentication flaws, authorization issues, sensitive data exposure, insecure dependencies, hardcoded secrets, input validation, error handling leaks, and any ${secLang}-specific vulnerabilities.`;

    try {
      const raw = await callAI(system, prompt, null, activeModel, apiKey, providerKeys, customModels);
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setSecResult(parsed);
      saveToVault?.('Security Audit', `${secLang} code audit`, JSON.stringify(parsed, null, 2));
    } catch (e) {
      setSecResult({ error: '❌ Parse error. Try again: ' + e.message });
    }
    finally { setSecLoading(false); }
  };

  const SEVERITY_CONFIG = {
    Critical: { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
    High:     { color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.3)'  },
    Medium:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)'  },
    Low:      { color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.3)'  },
    Info:     { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.3)'  },
  };

  const getRiskColor = (level) => {
    if (!level) return '#94a3b8';
    const l = level.toLowerCase();
    if (l === 'critical') return '#f87171';
    if (l === 'high')     return '#f97316';
    if (l === 'medium')   return '#fbbf24';
    return '#4ade80';
  };

  const TOOLS = [
    { id: 'code',     icon: Code2,      label: 'Code Helper',     color: '#a78bfa' },
    { id: 'git',      icon: GitCommit,  label: 'Git Commit',      color: '#4ade80' },
    { id: 'security', icon: Shield,     label: 'Security Audit',  color: '#f87171' },
  ];

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="page active">
      <div className="section-header">
        <h2 className="section-title">💻 Code Helper</h2>
        <div className="section-sub">Fix · Explain · Git Commits · Security Audit — your AI pair programmer.</div>
      </div>

      {/* Tool tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TOOLS.map(t => {
          const Icon = t.icon;
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 18px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                background: isActive ? `${t.color}20` : 'var(--bg3)',
                border: `1px solid ${isActive ? t.color : 'var(--border)'}`,
                color: isActive ? t.color : 'var(--text2)',
              }}
            >
              <Icon size={13} />{t.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">

        {/* ════ CODE HELPER ════ */}
        {activeTool === 'code' && (
          <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="tool-card">
              <div className="form-row cols2">
                <div className="form-group">
                  <label className="form-label">Task</label>
                  <select className="form-select" value={task} onChange={e => setTask(e.target.value)}>
                    {TASKS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Programming Language</label>
                  <select className="form-select" value={lang} onChange={e => setLang(e.target.value)}>
                    {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Your Code or Description</label>
                <textarea
                  className="form-textarea"
                  rows="8"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 13, borderColor: code.length > 50000 ? 'var(--pink)' : '' }}
                  placeholder="Paste your code here, or describe what you want to build..."
                  value={code}
                  onChange={e => setCode(e.target.value.slice(0, 100000))}
                />
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 10, marginTop: 4,
                  color: code.length > 50000 ? 'var(--pink)' : 'var(--text3)',
                  fontWeight: code.length > 50000 ? 700 : 400,
                }}>
                  <span>{code.length > 50000 ? '⚠️ High token count — some models may truncate.' : 'Optimal: under 50k chars'}</span>
                  <span>{code.length.toLocaleString()} / 100,000</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Additional Context (optional)</label>
                <input className="form-input"
                  placeholder="e.g. Using React 18, Node 20, error on line 34, converting to Python 3.11..."
                  value={context} onChange={e => setContext(e.target.value)} />
              </div>

              <button className="btn-generate" onClick={handleGenerate} disabled={loading || code.length > 100000}>
                {loading ? <><Loader2 className="animate-spin" /> Analyzing...</> : <><Code2 /> Run Code Helper</>}
              </button>

              {loading && (
                <div className="output-box">
                  <div className="loading-shimmer" style={{ width: '90%' }} />
                  <div className="loading-shimmer" style={{ width: '70%' }} />
                  <div className="loading-shimmer" style={{ width: '80%' }} />
                </div>
              )}

              {result && !loading && (
                <motion.div className="output-box" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="output-header">
                    <span className="output-label">✓ Code Result</span>
                    <div className="output-actions">
                      <button className="btn-copy" onClick={() => { downloadText(result, `code.${getExt(lang)}`); showToast('Downloaded!'); }}>
                        <Download size={14} /> Download
                      </button>
                      <button className="btn-copy" onClick={() => { navigator.clipboard.writeText(result); showToast('Copied!'); }}>
                        <Copy size={14} /> Copy
                      </button>
                    </div>
                  </div>
                  <div className="output-content" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ════ GIT COMMIT GENERATOR ════ */}
        {activeTool === 'git' && (
          <motion.div key="git" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="tool-card">
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                padding: '10px 14px', background: 'rgba(74,222,128,0.08)',
                border: '1px solid rgba(74,222,128,0.2)', borderRadius: 10,
              }}>
                <GitCommit size={16} color="#4ade80" />
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>Git Commit Generator</span>
                  <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8 }}>
                    Paste code changes → get perfect Conventional Commits
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Paste your code changes / git diff / describe what you changed</label>
                <textarea
                  className="form-textarea"
                  rows="7"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  placeholder={`Paste your git diff, changed code, or describe what you changed:\n\ne.g.\n+ function validateEmail(email) {\n+   const regex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\n+   return regex.test(email);\n+ }\n\nOr simply describe: "Added email validation to signup form, returns boolean"`}
                  value={gitCode}
                  onChange={e => setGitCode(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Commit type (optional)</label>
                <select className="form-select" value={gitType} onChange={e => setGitType(e.target.value)}>
                  <option value="auto">Auto-detect</option>
                  <option value="feat">feat — new feature</option>
                  <option value="fix">fix — bug fix</option>
                  <option value="refactor">refactor — code change (no fix/feature)</option>
                  <option value="perf">perf — performance improvement</option>
                  <option value="docs">docs — documentation</option>
                  <option value="test">test — adding tests</option>
                  <option value="chore">chore — maintenance</option>
                  <option value="style">style — formatting</option>
                  <option value="ci">ci — CI/CD changes</option>
                </select>
              </div>

              <button className="btn-generate" onClick={handleGitCommit} disabled={gitLoading}
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                {gitLoading
                  ? <><Loader2 className="animate-spin" /> Generating commits...</>
                  : <><GitCommit size={16} /> Generate Commit Messages</>}
              </button>

              {gitLoading && (
                <div style={{ marginTop: 16 }}>
                  <div className="loading-shimmer" style={{ width: '70%' }} />
                  <div className="loading-shimmer" style={{ width: '50%', marginTop: 8 }} />
                </div>
              )}

              {gitResult && !gitLoading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 16 }}>
                  {gitResult.summary && (
                    <div style={{
                      padding: '8px 14px', marginBottom: 14, fontSize: 12,
                      background: 'var(--bg3)', border: '1px solid var(--border)',
                      borderRadius: 8, color: 'var(--text2)',
                    }}>
                      💡 {gitResult.summary}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(gitResult.commits || []).map((c, i) => {
                      const typeStyle = COMMIT_TYPE_COLORS[c.type] || COMMIT_TYPE_COLORS.chore;
                      const isRecommended = i === gitResult.recommended;
                      const commitText = c.full || `${c.type}${c.scope ? `(${c.scope})` : ''}: ${c.message}`;

                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          style={{
                            border: `1px solid ${isRecommended ? 'rgba(74,222,128,0.4)' : 'var(--border)'}`,
                            borderRadius: 12, overflow: 'hidden',
                            background: isRecommended ? 'rgba(74,222,128,0.04)' : 'var(--bg2)',
                          }}
                        >
                          {/* Header */}
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderBottom: '1px solid var(--border2)',
                            background: 'var(--bg3)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{
                                padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                                background: typeStyle.bg, border: `1px solid ${typeStyle.border}`, color: typeStyle.color,
                              }}>{c.type}</span>
                              {c.scope && (
                                <span style={{ fontSize: 12, color: 'var(--text3)' }}>({c.scope})</span>
                              )}
                              {isRecommended && (
                                <span style={{
                                  padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800,
                                  background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
                                  color: '#4ade80',
                                }}>★ RECOMMENDED</span>
                              )}
                              <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                                {i === 0 ? 'Concise' : i === 1 ? 'Standard' : 'Detailed'}
                              </span>
                            </div>
                            <button
                              onClick={() => copyCommit(commitText, i)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                                background: copiedGit === i ? 'rgba(74,222,128,0.15)' : 'var(--bg3)',
                                border: `1px solid ${copiedGit === i ? 'rgba(74,222,128,0.3)' : 'var(--border)'}`,
                                color: copiedGit === i ? '#4ade80' : 'var(--text2)',
                                cursor: 'pointer', fontFamily: 'inherit',
                              }}
                            >
                              {copiedGit === i ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                            </button>
                          </div>

                          {/* Commit text */}
                          <div style={{ padding: '12px 14px' }}>
                            <div style={{
                              fontFamily: 'var(--font-mono)', fontSize: 13,
                              color: 'var(--text)', fontWeight: 600, marginBottom: c.body ? 8 : 0,
                            }}>
                              {c.type}{c.scope ? `(${c.scope})` : ''}: {c.message}
                            </div>
                            {c.body && (
                              <div style={{
                                fontFamily: 'var(--font-mono)', fontSize: 12,
                                color: 'var(--text2)', lineHeight: 1.7,
                                whiteSpace: 'pre-wrap',
                              }}>
                                {c.body}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <button onClick={handleGitCommit} style={{
                    marginTop: 10, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: 'transparent', border: '1px solid var(--border)',
                    color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <RefreshCw size={12} /> Regenerate
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ════ SECURITY AUDIT ════ */}
        {activeTool === 'security' && (
          <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="tool-card">
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                padding: '10px 14px', background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10,
              }}>
                <Shield size={16} color="#f87171" />
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f87171' }}>Security Audit</span>
                  <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8 }}>
                    Find vulnerabilities — SQL injection, XSS, auth flaws, exposed secrets & more
                  </span>
                </div>
              </div>

              <div className="form-row cols2">
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Code to audit</label>
                  <textarea
                    className="form-textarea"
                    rows="8"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
                    placeholder="Paste the code you want to security audit..."
                    value={secCode}
                    onChange={e => setSecCode(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Language / Framework</label>
                  <select className="form-select" value={secLang} onChange={e => setSecLang(e.target.value)}>
                    {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <button className="btn-generate" onClick={handleSecurityAudit} disabled={secLoading}
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                {secLoading
                  ? <><Loader2 className="animate-spin" /> Auditing for vulnerabilities...</>
                  : <><Shield size={16} /> Run Security Audit</>}
              </button>

              {secLoading && (
                <div style={{ marginTop: 16 }}>
                  <div className="loading-shimmer" style={{ width: '80%' }} />
                  <div className="loading-shimmer" style={{ width: '60%', marginTop: 8 }} />
                  <div className="loading-shimmer" style={{ width: '70%', marginTop: 8 }} />
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 10 }}>Scanning for security vulnerabilities...</p>
                </div>
              )}

              {secResult && !secLoading && !secResult.error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 16 }}>
                  {/* Score header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                    padding: '16px 20px', marginBottom: 16,
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    borderRadius: 14,
                  }}>
                    {/* Score circle */}
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        border: `3px solid ${getRiskColor(secResult.risk_level)}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: `${getRiskColor(secResult.risk_level)}15`,
                        boxShadow: `0 0 20px ${getRiskColor(secResult.risk_level)}30`,
                      }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: getRiskColor(secResult.risk_level) }}>
                          {secResult.overall_score}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>Security Score</div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{
                          padding: '3px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800,
                          background: `${getRiskColor(secResult.risk_level)}15`,
                          border: `1px solid ${getRiskColor(secResult.risk_level)}40`,
                          color: getRiskColor(secResult.risk_level),
                        }}>{secResult.risk_level} Risk</span>
                        <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                          {(secResult.vulnerabilities || []).length} vulnerabilities found
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                        {secResult.summary}
                      </p>
                    </div>
                  </div>

                  {/* Vulnerabilities */}
                  {(secResult.vulnerabilities || []).length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                        VULNERABILITIES FOUND
                      </div>
                      {secResult.vulnerabilities.map((v, i) => {
                        const sev = SEVERITY_CONFIG[v.severity] || SEVERITY_CONFIG.Info;
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            style={{
                              marginBottom: 10, borderRadius: 10, overflow: 'hidden',
                              border: `1px solid ${sev.border}`,
                            }}
                          >
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '8px 14px', background: sev.bg,
                            }}>
                              <span style={{
                                padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800,
                                background: sev.bg, border: `1px solid ${sev.border}`, color: sev.color,
                              }}>{v.severity}</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: sev.color }}>{v.type}</span>
                              {v.line && (
                                <span style={{ fontSize: 11, color: 'var(--text2)', marginLeft: 'auto' }}>
                                  📍 {v.line}
                                </span>
                              )}
                            </div>
                            <div style={{ padding: '10px 14px' }}>
                              <p style={{ fontSize: 13, color: 'var(--text)', marginBottom: 8, lineHeight: 1.6 }}>
                                {v.description}
                              </p>
                              <div style={{
                                padding: '7px 12px', borderRadius: 7,
                                background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)',
                                fontSize: 12, color: '#4ade80',
                              }}>
                                ✅ Fix: {v.fix}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* Good practices + Quick wins */}
                  <div className="ch-audit-grid">
                    {(secResult.good_practices || []).length > 0 && (
                      <div style={{
                        padding: 14, background: 'rgba(74,222,128,0.04)',
                        border: '1px solid rgba(74,222,128,0.15)', borderRadius: 10,
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                          ✅ GOOD PRACTICES
                        </div>
                        {secResult.good_practices.map((g, i) => (
                          <div key={i} style={{ fontSize: 12, color: 'var(--text2)', padding: '3px 0', borderBottom: '1px solid var(--border2)' }}>
                            • {g}
                          </div>
                        ))}
                      </div>
                    )}
                    {(secResult.quick_wins || []).length > 0 && (
                      <div style={{
                        padding: 14, background: 'rgba(251,191,36,0.04)',
                        border: '1px solid rgba(251,191,36,0.15)', borderRadius: 10,
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                          ⚡ QUICK WINS
                        </div>
                        {secResult.quick_wins.map((q, i) => (
                          <div key={i} style={{ fontSize: 12, color: 'var(--text2)', padding: '3px 0', borderBottom: '1px solid var(--border2)' }}>
                            → {q}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(secResult, null, 2));
                      showToast('Audit report copied!');
                    }}
                    style={{
                      marginTop: 12, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                      color: '#f87171', cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    <Copy size={12} /> Copy Full Report
                  </button>
                </motion.div>
              )}

              {secResult?.error && (
                <div style={{ color: '#f87171', marginTop: 12, fontSize: 13 }}>{secResult.error}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CodeHelper;
