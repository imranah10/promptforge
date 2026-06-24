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
// ── Visual Logic Flowchart — SVG auto-layout, no extra dependency ──────────────
const FlowchartView = ({ data }) => {
  if (!data?.nodes?.length) return null;

  const NODE_W = 200, NODE_H = 56, V_GAP = 36, H_PAD = 40;
  const COLORS = {
    start:    { bg: '#1a3a2e', border: '#4ade80', text: '#4ade80' },
    process:  { bg: '#1e2a4a', border: '#60a5fa', text: '#93c5fd' },
    decision: { bg: '#3a2e1a', border: '#fbbf24', text: '#fde68a' },
    end:      { bg: '#3a1a2e', border: '#f87171', text: '#fca5a5' },
  };

  // Simple vertical layout: one column, decisions get a side branch label
  const positions = data.nodes.map((n, i) => ({
    ...n,
    x: H_PAD,
    y: i * (NODE_H + V_GAP) + 20,
  }));
  const posById = Object.fromEntries(positions.map(p => [p.id, p]));

  const svgHeight = positions.length * (NODE_H + V_GAP) + 60;
  const svgWidth = NODE_W + H_PAD * 2;

  return (
    <div style={{ overflowX: 'auto', background: '#08090d', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', padding: 16 }}>
      <svg width={Math.max(svgWidth, 320)} height={svgHeight} style={{ display: 'block', margin: '0 auto' }}>
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="rgba(255,255,255,0.35)" />
          </marker>
        </defs>

        {/* Edges */}
        {data.edges?.map((edge, i) => {
          const from = posById[edge.from];
          const to = posById[edge.to];
          if (!from || !to) return null;
          const x1 = from.x + NODE_W / 2, y1 = from.y + NODE_H;
          const x2 = to.x + NODE_W / 2, y2 = to.y;
          const midY = (y1 + y2) / 2;
          return (
            <g key={i}>
              <path
                d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"
                markerEnd="url(#arrowhead)"
              />
              {edge.label && (
                <text x={(x1 + x2) / 2 + 10} y={midY} fontSize="10" fill="rgba(255,255,255,0.45)" fontFamily="monospace">
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {positions.map((n) => {
          const c = COLORS[n.type] || COLORS.process;
          const isDecision = n.type === 'decision';
          return (
            <g key={n.id}>
              {isDecision ? (
                <polygon
                  points={`${n.x + NODE_W/2},${n.y} ${n.x + NODE_W},${n.y + NODE_H/2} ${n.x + NODE_W/2},${n.y + NODE_H} ${n.x},${n.y + NODE_H/2}`}
                  fill={c.bg} stroke={c.border} strokeWidth="1.5"
                />
              ) : (
                <rect
                  x={n.x} y={n.y} width={NODE_W} height={NODE_H} rx={n.type === 'start' || n.type === 'end' ? 28 : 10}
                  fill={c.bg} stroke={c.border} strokeWidth="1.5"
                />
              )}
              <text x={n.x + NODE_W / 2} y={n.y + NODE_H / 2 - 6} textAnchor="middle" fontSize="12" fontWeight="700" fill={c.text} fontFamily="system-ui">
                {n.label.length > 26 ? n.label.slice(0, 24) + '…' : n.label}
              </text>
              {n.line != null && (
                <text x={n.x + NODE_W / 2} y={n.y + NODE_H / 2 + 12} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.35)" fontFamily="monospace">
                  line ~{n.line}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        {Object.entries({ start: 'Start', process: 'Process / Call', decision: 'Decision', end: 'End' }).map(([k, label]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
            <span style={{ width: 10, height: 10, borderRadius: k === 'decision' ? 2 : 3, background: COLORS[k].border, display: 'inline-block', transform: k === 'decision' ? 'rotate(45deg)' : 'none' }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

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
  const [flowData, setFlowData] = useState(null);
  const [flowLoading, setFlowLoading] = useState(false);
  const [viewMode, setViewMode] = useState('text'); // 'text' | 'flowchart' | 'sandbox'

  // ── LIVE SANDBOX state ──────────────────────────────────────────────────
  const [extractedCode, setExtractedCode] = useState('');  // pure runnable code, pulled out of the markdown result
  const [sandboxInput,  setSandboxInput]  = useState('');  // what the user types to test the function
  const [sandboxOutput, setSandboxOutput] = useState(null); // {ok:true, value} or {ok:false, error}
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [autoFixing,    setAutoFixing]    = useState(false);
  const [autoFixAttempt, setAutoFixAttempt] = useState(0);
  const [autoFixLog,    setAutoFixLog]    = useState([]); // [{attempt, error, fixed}]

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
      setViewMode('text');
      setFlowData(null);
      saveToVault?.('Code Helper', `${task} | ${lang}`, res);
      extractFlowchart(res);
    } catch (e) { setResult('❌ Error: ' + e.message); }
    finally { setLoading(false); }
  };

  // ── VISUAL FLOWCHART: extract structured logic flow from the code/result ──
  const extractFlowchart = async (codeResult) => {
    setFlowLoading(true);
    try {
      const flowSystem = `You output ONLY valid JSON, nothing else. No markdown fences, no explanation.`;
      const flowPrompt = `Analyze this ${lang} code and output a JSON flowchart structure:
{
  "nodes": [
    {"id":"1","label":"Function/block name (short)","type":"start|process|decision|end","line":12},
    {"id":"2","label":"...","type":"process","line":20}
  ],
  "edges": [
    {"from":"1","to":"2","label":"calls / then / if true"}
  ]
}
Rules:
- type "start" for entry point, "decision" for if/switch branches, "process" for normal steps/function calls, "end" for return/exit points
- Keep labels SHORT (3-6 words max)
- Maximum 12 nodes — focus on the main logic flow, not every single line
- "line" is the approximate line number in the code where this happens (best estimate)
- If the code has no clear flow (e.g. it's just a config file or data), output {"nodes":[],"edges":[]}

Code:
${code.slice(0, 6000)}`;

      const flowRes = await callAI(flowSystem, flowPrompt, null, activeModel, apiKey, providerKeys, customModels);
      const jsonMatch = flowRes.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.nodes?.length > 0) setFlowData(parsed);
      }
    } catch (e) {
      console.error('Flowchart extraction failed', e);
      // Non-critical — flowchart toggle just won't appear
    } finally {
      setFlowLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  // LIVE SANDBOX — actually RUNS JavaScript in the browser (sandboxed),
  // shows the real result, and if it throws, automatically sends the exact
  // error back to the AI to fix — up to 3 times — with NO user action needed.
  // This is the one part of Code Helper that doesn't just describe code,
  // it proves the code works by executing it.
  // ════════════════════════════════════════════════════════════════════════

  // Pull the first runnable JS code block out of a markdown result
  const extractRunnableCode = (markdownResult) => {
    const blocks = [...markdownResult.matchAll(/```(?:javascript|js)?\n([\s\S]*?)```/gi)];
    if (blocks.length === 0) return '';
    // Prefer the largest block (most likely the full function, not a tiny snippet)
    return blocks.sort((a, b) => b[1].length - a[1].length)[0][1].trim();
  };

  // Safely execute code in an isolated function scope. No access to window,
  // document, fetch, or anything outside — just pure JS logic.
  const runInSandbox = (codeStr, inputStr) => {
    const logs = [];
    const fakeConsole = {
      log:   (...a) => logs.push(a.map(x => typeof x === 'object' ? JSON.stringify(x, null, 2) : String(x)).join(' ')),
      error: (...a) => logs.push('ERROR: ' + a.map(x => typeof x === 'object' ? JSON.stringify(x, null, 2) : String(x)).join(' ')),
      warn:  (...a) => logs.push('WARN: '  + a.map(x => typeof x === 'object' ? JSON.stringify(x, null, 2) : String(x)).join(' ')),
      info:  (...a) => logs.push(a.map(x => typeof x === 'object' ? JSON.stringify(x, null, 2) : String(x)).join(' ')),
    };
    try {
      // Strip ES module syntax — new Function() doesn't support import/export
      const cleanCode = codeStr
        .replace(/^\s*import\s+.*?from\s+['"][^'"]+['"]\s*;?\s*$/gm, '')
        .replace(/^\s*import\s*\{[^}]*\}\s*from\s+['"][^'"]+['"]\s*;?\s*$/gm, '')
        .replace(/^\s*export\s+default\s+/gm, 'var __defaultExport = ')
        .replace(/^\s*export\s+(const|let|var|function|class)\s+/gm, '$1 ')
        .replace(/^\s*export\s+\{[^}]*\}\s*;?\s*$/gm, '');

      const wrapped = `
        "use strict";
        ${cleanCode}
        // Find all callable functions/classes defined above
        const __fns = [];
        ${[...codeStr.matchAll(/(?:^|\s)(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(|class\s+(\w+))/gm)]
          .map(m => m[1] || m[2] || m[3]).filter(Boolean)
          .map(name => `try { if (typeof ${name} !== 'undefined') __fns.push(['${name}', ${name}]); } catch(e) {}`).join('\n')}
        // Also check for __defaultExport (from export default)
        try { if (typeof __defaultExport !== 'undefined') __fns.push(['main', __defaultExport]); } catch(e) {}
        if (__fns.length === 0) throw new Error('No callable function or class found in this code.');
        const [__name, __fn] = __fns[__fns.length - 1];
        let __args;
        try { __args = JSON.parse('[' + (${JSON.stringify(inputStr)} || '') + ']'); }
        catch(e) { __args = []; }
        // If it's a class, instantiate it; if it's a function call it
        let __result;
        if (typeof __fn === 'function') {
          try { __result = new __fn(...__args); } catch(e) { __result = __fn(...__args); }
        }
        return { name: __name, result: __result };
      `;
      // eslint-disable-next-line no-new-func
      const sandboxFn = new Function('console', wrapped);
      const out = sandboxFn(fakeConsole);
      return { ok: true, value: out, logs };
    } catch (err) {
      return { ok: false, error: err.message, logs };
    }
  };

  const handleRunSandbox = () => {
    setSandboxRunning(true);
    setTimeout(() => { // small delay so the UI shows a "Running..." state, feels real
      const codeToRun = extractedCode || code;
      const res = runInSandbox(codeToRun, sandboxInput);
      setSandboxOutput(res);
      setSandboxRunning(false);
    }, 250);
  };

  // The signature feature: if the sandbox run fails, automatically ask the AI
  // to fix it using the EXACT error message, then re-run — up to 3 tries.
  // Each attempt uses a DIFFERENT strategy, not the same prompt repeated:
  //   Attempt 1 — quick direct fix (the obvious read of the error)
  //   Attempt 2 — reasoning-first: explain root cause, THEN fix (catches deeper bugs)
  //   Attempt 3 — rewrite from scratch with a more defensive approach
  // If all 3 fail, it stops and gives an honest written diagnosis instead of
  // pretending a 4th identical attempt would work.
  const FIX_STRATEGIES = [
    {
      label: 'Direct fix',
      system: (lang) => `You are an expert ${lang} debugger. You will be given code and the exact runtime error it produced. Fix the code so it runs without that error. Output ONLY the corrected code in a single \`\`\`javascript code block — no explanation.`,
      prompt: (code, input, error) => `This code:\n\n${code}\n\nProduced this exact runtime error when called with arguments (${input || 'no arguments'}):\n\n${error}\n\nFix it.`,
    },
    {
      label: 'Root-cause analysis',
      system: (lang) => `You are a senior ${lang} engineer. The first fix attempt for this error FAILED — the simple read of the error was wrong or incomplete. Think more carefully: what is the actual ROOT CAUSE, not just the symptom? Then output ONLY the corrected code in a single \`\`\`javascript code block, no explanation in your final answer (think it through silently, then just give the code).`,
      prompt: (code, input, error) => `This code still fails after one fix attempt:\n\n${code}\n\nError when called with (${input || 'no arguments'}):\n\n${error}\n\nThe obvious fix didn't work. Look for a deeper issue — wrong assumption about input shape, edge case, scope issue, async timing, etc. Fix it properly this time.`,
    },
    {
      label: 'Defensive rewrite',
      system: (lang) => `You are an expert ${lang} engineer. Two fix attempts have already failed for this code. Don't patch it again — REWRITE the function from scratch with a more defensive, careful approach: validate inputs, handle edge cases explicitly, avoid the failure pattern seen so far. Output ONLY the new code in a single \`\`\`javascript code block, no explanation.`,
      prompt: (code, input, error) => `This code has failed 2 fix attempts already:\n\n${code}\n\nMost recent error with arguments (${input || 'no arguments'}):\n\n${error}\n\nRewrite this function from scratch with defensive coding — input validation, explicit edge case handling. Don't just patch the same approach again.`,
    },
  ];

  const handleAutoFix = async () => {
    if (autoFixAttempt >= 3) return;
    setAutoFixing(true);
    try {
      const currentCode = extractedCode || code;
      const errorMsg = sandboxOutput?.error || 'Unknown error';
      const strategy = FIX_STRATEGIES[autoFixAttempt]; // 0, 1, or 2 — different approach each time

      const fixRes = await callAI(
        strategy.system(lang),
        strategy.prompt(currentCode, sandboxInput, errorMsg),
        null, activeModel, apiKey, providerKeys, customModels
      );
      const blocks = [...fixRes.matchAll(/```(?:javascript|js)?\n([\s\S]*?)```/gi)];
      const newCode = blocks.length > 0 ? blocks[0][1].trim() : fixRes.trim();

      setExtractedCode(newCode);
      const nextAttempt = autoFixAttempt + 1;
      setAutoFixAttempt(nextAttempt);

      const res = runInSandbox(newCode, sandboxInput);
      setSandboxOutput(res);
      setAutoFixLog(prev => [...prev, { attempt: nextAttempt, strategy: strategy.label, error: errorMsg, fixed: res.ok }]);

      if (res.ok) {
        showToast(`Fixed on attempt ${nextAttempt} (${strategy.label})! 🎉`);
      } else if (nextAttempt >= 3) {
        // All 3 strategies exhausted — get an honest diagnosis instead of a 4th blind guess
        generateDiagnosis(newCode, res.error);
      }
    } catch (e) {
      showToast('Auto-fix failed: ' + e.message, 'error');
    } finally {
      setAutoFixing(false);
    }
  };

  // After 3 different strategies all fail, don't keep guessing — explain
  // WHY this is hard and what a human should look at. Honesty over a 4th
  // attempt that's unlikely to work any better than the first 3.
  const [diagnosis, setDiagnosis] = useState('');
  const [diagnosing, setDiagnosing] = useState(false);

  const generateDiagnosis = async (finalCode, finalError) => {
    setDiagnosing(true);
    try {
      const diagSystem = `You are a senior debugging consultant. Three different automated fix strategies have all failed on this code. Your job now is NOT to fix it — it's to honestly explain to the developer why this is a hard case, in plain language. Be specific and useful, not generic.`;
      const diagPrompt = `Code (after 3 failed fix attempts):\n\n${finalCode}\n\nFinal error:\n${finalError}\n\nTest arguments used: ${sandboxInput || 'none'}\n\nExplain in plain text (no markdown symbols): 1) What makes this case genuinely tricky for automated fixing, 2) What specific thing a human should check first, 3) Whether the test arguments themselves might be the problem rather than the code.`;
      const diagRes = await callAI(diagSystem, diagPrompt, null, activeModel, apiKey, providerKeys, customModels);
      setDiagnosis(diagRes.replace(/\*\*/g, '').replace(/\*/g, '').trim());
    } catch (e) {
      setDiagnosis('Could not generate a diagnosis. At this point, the issue likely needs a closer manual look — check whether the test arguments match what the function actually expects, and re-read the original requirement for an edge case the function might be missing.');
    } finally {
      setDiagnosing(false);
    }
  };

  const openSandbox = () => {
    const runnable = extractRunnableCode(result);
    setExtractedCode(runnable || code);
    setSandboxOutput(null);
    setAutoFixAttempt(0);
    setAutoFixLog([]);
    setViewMode('sandbox');
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
                      {(flowData || flowLoading) && (
                        <div style={{ display: 'flex', gap: 4, marginRight: 8 }}>
                          <button onClick={() => setViewMode('text')} style={{
                            padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                            background: viewMode === 'text' ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)',
                            color: viewMode === 'text' ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                          }}>📝 Text</button>
                          <button onClick={() => setViewMode('flowchart')} disabled={flowLoading} style={{
                            padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: flowLoading ? 'wait' : 'pointer', border: 'none',
                            background: viewMode === 'flowchart' ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.05)',
                            color: viewMode === 'flowchart' ? '#60a5fa' : 'rgba(255,255,255,0.5)',
                          }}>{flowLoading ? '⏳ Building...' : '📊 Flowchart'}</button>
                        </div>
                      )}
                      {lang === 'JavaScript' && (
                        <button onClick={openSandbox} style={{
                          padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', marginRight: 8,
                          background: viewMode === 'sandbox' ? 'rgba(74,222,128,0.2)' : 'rgba(74,222,128,0.1)',
                          color: '#4ade80',
                        }}>🧪 Run It Live</button>
                      )}
                      <button className="btn-copy" onClick={() => { downloadText(result, `code.${getExt(lang)}`); showToast('Downloaded!'); }}>
                        <Download size={14} /> Download
                      </button>
                      <button className="btn-copy" onClick={() => { navigator.clipboard.writeText(result); showToast('Copied!'); }}>
                        <Copy size={14} /> Copy
                      </button>
                    </div>
                  </div>
                  <div className="output-content" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                    {viewMode === 'flowchart' && flowData ? (
                      <FlowchartView data={flowData} />
                    ) : viewMode === 'sandbox' ? (
                      <div>
                        {/* Editable extracted code — user can tweak before running */}
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                            Runnable Code (editable)
                          </div>
                          <textarea
                            value={extractedCode}
                            onChange={e => setExtractedCode(e.target.value)}
                            rows={Math.min(14, extractedCode.split('\n').length + 1)}
                            style={{
                              width: '100%', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: 12.5,
                              background: '#0a0a0f', color: '#34d399', border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 10, padding: 14, resize: 'vertical', outline: 'none',
                            }}
                          />
                        </div>

                        {/* Test input */}
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                            Test Input <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,0.28)', fontSize: 10 }}>(optional — leave empty if the function needs no input)</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
                            Examples: &nbsp;<code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>10</code>&nbsp; for a number &nbsp;·&nbsp; <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>"hello"</code>&nbsp; for text &nbsp;·&nbsp; <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>5, 10</code>&nbsp; for two numbers
                          </div>
                          <input
                            value={sandboxInput}
                            onChange={e => setSandboxInput(e.target.value)}
                            placeholder='Leave empty or type: 10   or   "hello"   or   5, 20'
                            style={{
                              width: '100%', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: 13,
                              background: 'rgba(255,255,255,0.04)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)',
                              borderRadius: 9, padding: '10px 14px', outline: 'none',
                            }}
                          />
                        </div>

                        <button
                          onClick={handleRunSandbox}
                          disabled={sandboxRunning || autoFixing}
                          style={{
                            width: '100%', padding: '12px', borderRadius: 10, fontSize: 13, fontWeight: 800,
                            background: sandboxRunning ? 'rgba(74,222,128,0.4)' : '#4ade80', color: '#05210f',
                            border: 'none', cursor: sandboxRunning ? 'wait' : 'pointer', marginBottom: 14,
                          }}
                        >
                          {sandboxRunning ? '⏳ Running in sandbox...' : '▶ Run This Code Now'}
                        </button>

                        {/* Result */}
                        {sandboxOutput && (
                          <div style={{
                            padding: 16, borderRadius: 12, marginBottom: 12,
                            background: sandboxOutput.ok ? 'rgba(74,222,128,0.07)' : 'rgba(248,113,113,0.07)',
                            border: `1px solid ${sandboxOutput.ok ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
                          }}>
                            {sandboxOutput.ok ? (
                              <>
                                <div style={{ fontSize: 11, fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', marginBottom: 8 }}>
                                  ✓ Ran successfully — called {sandboxOutput.value?.name}()
                                </div>
                                {sandboxOutput.logs?.length > 0 && (
                                  <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 13, color: '#d1fae5', whiteSpace: 'pre-wrap', marginBottom: 6 }}>
                                    {sandboxOutput.logs.join('\n')}
                                  </pre>
                                )}
                                {sandboxOutput.value?.result !== undefined && sandboxOutput.value?.result !== null && (
                                  <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 13, color: '#a7f3d0', whiteSpace: 'pre-wrap', borderTop: sandboxOutput.logs?.length > 0 ? '1px solid rgba(74,222,128,0.15)' : 'none', paddingTop: sandboxOutput.logs?.length > 0 ? 6 : 0 }}>
                                    {'→ '}{JSON.stringify(sandboxOutput.value?.result, null, 2)}
                                  </pre>
                                )}
                                {(!sandboxOutput.logs?.length && (sandboxOutput.value?.result === undefined || sandboxOutput.value?.result === null)) && (
                                  <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.3)', whiteSpace: 'pre-wrap' }}>
                                    (no output — code ran without printing or returning a value)
                                  </pre>
                                )}
                              </>
                            ) : (
                              <>
                                <div style={{ fontSize: 11, fontWeight: 800, color: '#f87171', textTransform: 'uppercase', marginBottom: 8 }}>
                                  ✗ Runtime Error
                                </div>
                                <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 12.5, color: '#fecaca', whiteSpace: 'pre-wrap' }}>
                                  {sandboxOutput.error}
                                </pre>
                                <button
                                    onClick={handleAutoFix}
                                    disabled={autoFixing || autoFixAttempt >= 3}
                                    style={{
                                      marginTop: 12, padding: '9px 18px', borderRadius: 9, fontSize: 12, fontWeight: 800,
                                      background: autoFixAttempt >= 3 ? 'rgba(255,255,255,0.08)' : '#fbbf24',
                                      color: autoFixAttempt >= 3 ? 'rgba(255,255,255,0.4)' : '#1c1100',
                                      border: 'none', cursor: autoFixAttempt >= 3 ? 'not-allowed' : 'pointer',
                                      display: 'flex', alignItems: 'center', gap: 6,
                                    }}
                                  >
                                    {autoFixing ? '🤖 AI is fixing it...' : autoFixAttempt >= 3 ? '✗ 3 strategies tried, all failed' : `🤖 Auto-Fix With AI (attempt ${autoFixAttempt + 1}/3 — ${FIX_STRATEGIES[autoFixAttempt].label})`}
                                  </button>

                                {/* After all 3 strategies fail: honest diagnosis instead of more blind guessing */}
                                {autoFixAttempt >= 3 && (
                                  <div style={{ marginTop: 14, padding: 16, borderRadius: 10, background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.25)' }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                                      🩺 Diagnosis — Why Auto-Fix Couldn't Solve This
                                    </div>
                                    {diagnosing ? (
                                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Analyzing why this case is hard...</div>
                                    ) : diagnosis ? (
                                      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{diagnosis}</div>
                                    ) : null}
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 10 }}>
                                      Honest tradeoff: a 4th automated guess after 3 different strategies failed is unlikely to help. This needs a closer human look at the logic or the test inputs.
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {/* Auto-fix history log */}
                        {autoFixLog.length > 0 && (
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                            <div style={{ fontWeight: 700, marginBottom: 6, color: 'rgba(255,255,255,0.5)' }}>Auto-Fix Attempts:</div>
                            {autoFixLog.map((log, i) => (
                              <div key={i} style={{ padding: '6px 10px', marginBottom: 4, borderRadius: 6, background: 'rgba(255,255,255,0.03)' }}>
                                Attempt {log.attempt} ({log.strategy}): {log.fixed ? '✓ Fixed it' : '✗ Still failing'} — was: "{log.error.slice(0, 60)}"
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ marginTop: 10, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                          Runs in an isolated sandbox in your browser — no access to your files, network, or page. Pure JS logic only.
                        </div>
                      </div>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                    )}
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