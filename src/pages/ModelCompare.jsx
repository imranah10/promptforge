import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { Zap, Loader2, GitCompare } from 'lucide-react';
import { motion } from 'framer-motion';
import { ALL_MODELS } from '../utils/models';

const ModelCompare = () => {
  const { apiKey, providerKeys, customModels, showToast } = useContext(AppContext);
  
  const allModels = [...ALL_MODELS, ...customModels];
  
  const getAvailableModels = () => {
    if (apiKey) return allModels;
    const available = allModels.filter(m => {
      const custom = customModels.find(c => c.id === m.id);
      if (custom && custom.apiKey) return true;
      return !!providerKeys[m.provider];
    });
    return available.length > 0 ? available : allModels;
  };

  const [prompt, setPrompt] = useState('');
  const [modelA, setModelA] = useState(() => {
    const avail = getAvailableModels();
    return avail[0]?.id || 'claude-3-5-sonnet-20241022';
  });
  const [modelB, setModelB] = useState(() => {
    const avail = getAvailableModels();
    return avail.length > 1 ? avail[1].id : (avail[0]?.id || 'gpt-4o');
  });
  
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

      const textA = resA.status === 'fulfilled' ? resA.value : '❌ Error: ' + resA.reason.message;
      const textB = resB.status === 'fulfilled' ? resB.value : '❌ Error: ' + resB.reason.message;

      setResultA(textA);
      setResultB(textB);

      // AI Verdict
      const verdictSystem = 'You are an expert AI evaluator. Be concise and direct.';
      const verdictUser = `Compare these two AI responses to the prompt: "${prompt}"\n\nResponse A:\n${textA.substring(0, 1000)}\n\nResponse B:\n${textB.substring(0, 1000)}\n\nGive a quick verdict: which is better and why? Score each /10 on: accuracy, clarity, depth, creativity. End with a clear winner.`;

      try {
        const v = await callAI(verdictSystem, verdictUser, 'gpt-4o-mini', null, apiKey, providerKeys, customModels);
        setVerdict(v);
      } catch (ve) {
        // ignore verdict error or fallback to a fast model
        console.error("Verdict error:", ve);
      }
    } catch (e) {
      showToast('Error running comparison', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getModelName = (id) => allModels.find(m => m.id === id)?.name || id;

  return (
    <div className="page active">
      <div className="section-header">
        <h2 className="section-title">⚖️ Model Comparison</h2>
        <div className="section-sub">Run the same prompt on 2 models simultaneously. Get an AI verdict on which response is better.</div>
      </div>
      
      <div className="tool-card">
        <div className="form-row cols2">
          <div className="form-group">
            <label className="form-label">Model A</label>
            <select className="form-select" value={modelA} onChange={e => setModelA(e.target.value)}>
              {allModels.map(m => <option key={`a-${m.id}`} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Model B</label>
            <select className="form-select" value={modelB} onChange={e => setModelB(e.target.value)}>
              {allModels.map(m => <option key={`b-${m.id}`} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Your Prompt (will be sent to both models)</label>
          <textarea 
            className="form-textarea" 
            rows="4" 
            placeholder="e.g. Write a compelling 3-sentence elevator pitch for a B2B SaaS tool..."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          ></textarea>
        </div>

        <button className="btn-generate" onClick={handleGenerate} disabled={loading}>
          {loading ? <><Loader2 className="animate-spin" /> Running comparison...</> : <><GitCompare /> Compare Both Models</>}
        </button>

        {(loading || resultA || resultB) && (
          <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px', marginTop: '20px' }}>
            <div className="compare-col glass-card" style={{ padding: '20px', minWidth: 0 }}>
              <div className="compare-col-header" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="chip-dot" style={{ background: '#7c5cfc', width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 }}></div>
                <span>{getModelName(modelA)}</span>
              </div>
              <div className="output-content" style={{ overflowX: 'auto', wordBreak: 'break-word' }}>
                {loading && !resultA ? (
                  <><div className="loading-shimmer" style={{ width: '90%' }}></div><div className="loading-shimmer" style={{ width: '70%' }}></div></>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{resultA}</ReactMarkdown>
                )}
              </div>
            </div>
            
            <div className="compare-col glass-card" style={{ padding: '20px', minWidth: 0 }}>
              <div className="compare-col-header" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="chip-dot" style={{ background: '#34d399', width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 }}></div>
                <span>{getModelName(modelB)}</span>
              </div>
              <div className="output-content" style={{ overflowX: 'auto', wordBreak: 'break-word' }}>
                {loading && !resultB ? (
                  <><div className="loading-shimmer" style={{ width: '85%' }}></div><div className="loading-shimmer" style={{ width: '75%' }}></div></>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{resultB}</ReactMarkdown>
                )}
              </div>
            </div>
          </div>
        )}

        {verdict && !loading && (
          <motion.div 
            className="verdict-box"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: 'linear-gradient(135deg, rgba(124,92,252,0.1), rgba(56,189,248,0.05))', border: '1px solid rgba(124,92,252,0.3)', borderRadius: '12px', padding: '20px', marginTop: '20px' }}
          >
            <div className="verdict-label" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent2)', marginBottom: '10px' }}>🏆 AI Verdict</div>
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
