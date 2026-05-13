import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { Copy, Zap, Loader2, Code2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { downloadText } from '../utils/helpers';

const CodeHelper = () => {
  const { activeModel, apiKey, providerKeys, customModels, showToast, saveToVault } = useContext(AppContext);
  
  const [task, setTask] = useState('Fix / debug this code');
  const [lang, setLang] = useState('JavaScript');
  const [code, setCode] = useState('');
  const [context, setContext] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleGenerate = async () => {
    if (!code.trim()) { showToast('Paste your code or describe what to build', 'warn'); return; }
    setLoading(true);
    setResult('');

    const system = `You are a senior software engineer and expert in ${lang} with 15+ years of experience. You write clean, efficient, well-commented code and explain things clearly. Always provide working, production-ready code.`;
    
    let userPrompt = `Task: ${task}\nLanguage: ${lang}\n`;
    if (context) userPrompt += `Context: ${context}\n`;
    userPrompt += `\nCode:\n${code}\n\n`;

    if (task === 'Fix / debug this code') userPrompt += 'Identify all bugs, explain what was wrong, and provide the fixed code.';
    if (task === 'Explain this code') userPrompt += 'Give a clear, thorough explanation of what this code does, line by line if needed.';
    if (task === 'Optimize / improve performance') userPrompt += 'Identify bottlenecks and provide an optimized version with explanation.';
    if (task === 'Write unit tests') userPrompt += 'Write comprehensive unit tests covering edge cases.';

    userPrompt += '\nProvide the response in a clear, structured format.';

    try {
      const res = await callAI(system, userPrompt, null, activeModel, apiKey, providerKeys, customModels);
      setResult(res);
      saveToVault('Code Helper', `Task: ${task}\nLanguage: ${lang}\nCode Preview: ${code.substring(0, 50)}...`, res);
    } catch (e) {
      setResult('❌ Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    showToast('✓ Copied to clipboard');
  };

  const handleDownload = () => {
    // Generate file extension based on language
    let ext = 'txt';
    const l = lang.toLowerCase();
    if (l.includes('python')) ext = 'py';
    else if (l.includes('javascript') || l.includes('node')) ext = 'js';
    else if (l.includes('typescript')) ext = 'ts';
    else if (l.includes('react')) ext = 'jsx';
    else if (l.includes('html')) ext = 'html';
    else if (l.includes('css')) ext = 'css';
    else if (l.includes('java') && !l.includes('script')) ext = 'java';
    else if (l.includes('c++')) ext = 'cpp';
    else if (l.includes('c#')) ext = 'cs';
    else if (l.includes('go')) ext = 'go';
    else if (l.includes('rust')) ext = 'rs';
    else if (l.includes('php')) ext = 'php';
    else if (l.includes('ruby')) ext = 'rb';
    else if (l.includes('swift')) ext = 'swift';
    else if (l.includes('sql')) ext = 'sql';
    else if (l.includes('shell') || l.includes('bash')) ext = 'sh';
    
    downloadText(result, `PromptForge_Code.${ext}`);
    showToast('✓ Download started');
  };

  return (
    <div className="page active">
      <div className="section-header">
        <h2 className="section-title">💻 Code Helper</h2>
        <div className="section-sub">Fix bugs, explain code, write from scratch, convert between languages, optimize performance.</div>
      </div>
      
      <div className="tool-card">
        <div className="form-row cols2">
          <div className="form-group">
            <label className="form-label">Task</label>
            <select className="form-select" value={task} onChange={e => setTask(e.target.value)}>
              <option>Fix / debug this code</option>
              <option>Explain this code</option>
              <option>Write code from scratch</option>
              <option>Convert to another language</option>
              <option>Optimize / improve performance</option>
              <option>Add comments / documentation</option>
              <option>Write unit tests</option>
              <option>Review code quality</option>
              <option>Add error handling</option>
              <option>Refactor / clean up</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Programming Language</label>
            <select className="form-select" value={lang} onChange={e => setLang(e.target.value)}>
              <option>Python</option><option>JavaScript</option><option>TypeScript</option><option>React / JSX</option><option>Node.js</option><option>Java</option><option>C++</option><option>C#</option><option>Go</option><option>Rust</option><option>PHP</option><option>Ruby</option><option>Swift</option><option>Kotlin</option><option>SQL</option><option>HTML/CSS</option><option>Shell/Bash</option><option>Dart/Flutter</option>
            </select>
          </div>
        </div>
        
        <div className="form-group" style={{ position: 'relative' }}>
          <label className="form-label">Your Code or Description</label>
          <textarea 
            className="form-textarea" 
            rows="7" 
            style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '13px',
              borderColor: code.length > 50000 ? 'var(--pink)' : 'var(--border)'
            }}
            placeholder="Paste your code here, or describe what you want to build..."
            value={code}
            onChange={e => setCode(e.target.value.slice(0, 100000))} // Hard limit to 100k chars
          ></textarea>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '10px', 
            color: code.length > 50000 ? 'var(--pink)' : 'var(--text3)', 
            marginTop: '4px',
            fontWeight: code.length > 50000 ? '700' : 'normal'
          }}>
            <span>{code.length > 50000 ? '⚠️ High token count. Some models may fail or truncate the output.' : 'Optimal context window: under 50k chars.'}</span>
            <span>{code.length.toLocaleString()} / 100,000 max</span>
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Additional Context (optional)</label>
          <input 
            className="form-input" 
            placeholder="e.g. Using React 18, Node 20, the error appears on line 34..."
            value={context}
            onChange={e => setContext(e.target.value)}
          />
        </div>

        <button className="btn-generate" onClick={handleGenerate} disabled={loading || code.length > 100000}>
          {loading ? <><Loader2 className="animate-spin" /> Analyzing...</> : <><Code2 /> Run Code Helper</>}
        </button>

        {loading && (
          <div className="output-box">
             <div className="loading-shimmer"></div>
             <div className="loading-shimmer" style={{ width: '80%' }}></div>
          </div>
        )}

        {result && !loading && (
          <motion.div 
            className="output-box"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="output-header">
              <span className="output-label">✓ Code Result</span>
              <div className="output-actions">
                <button className="btn-copy" onClick={handleDownload}><Download size={14} /> Download</button>
                <button className="btn-copy" onClick={handleCopy}><Copy size={14} /> Copy Code</button>
              </div>
            </div>
            <div className="output-content" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}><ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown></div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CodeHelper;
