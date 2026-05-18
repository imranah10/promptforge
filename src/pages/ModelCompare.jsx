import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { Zap, Loader2, GitCompare } from 'lucide-react';
import { motion } from 'framer-motion';
import { ALL_MODELS, PROVIDERS } from '../utils/models';

const ModelCompare = () => {
  const { apiKey, providerKeys, customModels, showToast } = useContext(AppContext);
  
  const allModels = useMemo(() => [...ALL_MODELS, ...customModels], [customModels]);

  // Dynamically group models by their provider ID from PROVIDERS list
  const groupedModels = useMemo(() => {
    // Create groups for each provider defined in PROVIDERS
    const groups = {};
    
    // Add special group for OpenRouter Free
    groups['openrouter-free'] = { name: '🌌 OpenRouter (Free)', models: [] };

    PROVIDERS.forEach(p => {
      // For OpenRouter, we only put non-free models here (if any)
      // Actually, let's just use the provider names
      groups[p.id] = { name: p.name, models: [] };
    });

    groups['custom'] = { name: '🛠️ Custom Models', models: [] };

    allModels.forEach(m => {
      if (customModels.find(c => c.id === m.id)) {
        groups.custom.models.push(m);
      } else if (m.provider === 'openrouter' && m.tier === 'free') {
        groups['openrouter-free'].models.push(m);
      } else if (groups[m.provider]) {
        groups[m.provider].models.push(m);
      }
    });

    // Convert to array and filter out empty groups
    return Object.entries(groups)
      .filter(([_, data]) => data.models.length > 0)
      .map(([key, data]) => ({ key, ...data }));
  }, [allModels, customModels]);

  const [prompt, setPrompt] = useState('');
  const [modelA, setModelA] = useState('openrouter:meta-llama/llama-3.3-70b-instruct:free');
  const [modelB, setModelB] = useState('llama-3.3-70b-versatile');
  
  const [loading, setLoading] = useState(false);
  const [resultA, setResultA] = useState('');
  const [resultB, setResultB] = useState('');
  const [verdict, setVerdict] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) { showToast('Enter a prompt to compare', 'warn'); return; }
    setLoading(true);
    setResultA('');
    setResultB('');
    setVerdict('');

    const system = 'You are a helpful AI assistant. Provide accurate, high-quality responses.';
    
    try {
      const [resA, resB] = await Promise.allSettled([
        callAI(system, prompt, modelA, null, apiKey, providerKeys, customModels),
        callAI(system, prompt, modelB, null, apiKey, providerKeys, customModels)
      ]);

      const textA = resA.status === 'fulfilled' ? resA.value : '❌ ' + resA.reason.message;
      const textB = resB.status === 'fulfilled' ? resB.value : '❌ ' + resB.reason.message;

      setResultA(textA);
      setResultB(textB);

      // AI Verdict logic
      try {
        const vPrompt = `Evaluate these two AI responses for the prompt: "${prompt}"\n\nResponse A: ${textA.substring(0, 500)}\n\nResponse B: ${textB.substring(0, 500)}\n\nCompare accuracy and detail. Pick a winner.`;
        const v = await callAI('You are an AI evaluator.', vPrompt, 'gpt-4o-mini', null, apiKey, providerKeys, customModels);
        setVerdict(v);
      } catch (ve) { console.error("Verdict error:", ve); }
      
    } catch (e) {
      showToast('Error running comparison', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getModelName = (id) => allModels.find(m => m.id === id)?.name || id;

  const renderDropdown = (val, setVal) => (
    <select className="form-select" value={val} onChange={e => setVal(e.target.value)}>
      {groupedModels.map(group => (
        <optgroup key={group.key} label={group.name}>
          {group.models.map(m => (
            <option key={`${group.key}-${m.id}`} value={m.id}>{m.name}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );

  return (
    <div className="page active">
      <div className="section-header">
        <h2 className="section-title">⚖️ Model Comparison</h2>
        <div className="section-sub">Compare any two models side-by-side to find the best output.</div>
      </div>
      
      <div className="tool-card">
        <div className="form-row cols2">
          <div className="form-group">
            <label className="form-label">Model A</label>
            {renderDropdown(modelA, setModelA)}
          </div>
          <div className="form-group">
            <label className="form-label">Model B</label>
            {renderDropdown(modelB, setModelB)}
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Your Prompt</label>
          <textarea 
            className="form-textarea" 
            rows="4" 
            placeholder="Type your prompt here..."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          ></textarea>
        </div>

        <button className="btn-generate" onClick={handleGenerate} disabled={loading}>
          {loading ? <><Loader2 className="animate-spin" /> Analyzing...</> : <><GitCompare /> Compare Both Models</>}
        </button>

        {(loading || resultA || resultB) && (
          <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
            <div className="compare-col glass-card" style={{ padding: '20px', borderTop: '4px solid #7c5cfc' }}>
              <div className="compare-col-header" style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text3)', marginBottom: '16px' }}>
                {getModelName(modelA).toUpperCase()}
              </div>
              <div className="output-content">
                {loading && !resultA ? <div className="loading-shimmer"></div> : <ReactMarkdown remarkPlugins={[remarkGfm]}>{resultA}</ReactMarkdown>}
              </div>
            </div>
            
            <div className="compare-col glass-card" style={{ padding: '20px', borderTop: '4px solid #34d399' }}>
              <div className="compare-col-header" style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text3)', marginBottom: '16px' }}>
                {getModelName(modelB).toUpperCase()}
              </div>
              <div className="output-content">
                {loading && !resultB ? <div className="loading-shimmer"></div> : <ReactMarkdown remarkPlugins={[remarkGfm]}>{resultB}</ReactMarkdown>}
              </div>
            </div>
          </div>
        )}

        {verdict && !loading && (
          <motion.div 
            className="verdict-box"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: 'rgba(124,92,252,0.05)', border: '1px solid var(--accent2)', borderRadius: '12px', padding: '20px', marginTop: '20px' }}
          >
            <div style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '2px', color: 'var(--accent2)', marginBottom: '10px' }}>🏆 JUDGE'S VERDICT</div>
            <div className="output-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{verdict}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ModelCompare;
