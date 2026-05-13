import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { PROVIDERS } from '../utils/models';

const ApiKeys = () => {
  const { providerKeys, setProviderKeys, showToast } = useContext(AppContext);

  const handleSave = (id, value) => {
    if (!value.trim()) return;
    setProviderKeys(prev => ({ ...prev, [id]: value }));
    showToast(`✓ ${id} key saved for this session`);
  };

  const handleClear = (id) => {
    setProviderKeys(prev => {
      const newKeys = { ...prev };
      delete newKeys[id];
      return newKeys;
    });
    showToast(`Key cleared`);
  };

  return (
    <div className="page active">
      <div className="section-header">
        <h2 className="section-title">🔑 API Keys Manager</h2>
        <div className="section-sub">Your keys are stored only in your browser — never sent to our servers. Direct to AI provider.</div>
      </div>
      
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', background: 'rgba(56, 189, 248, 0.05)', borderLeft: '4px solid var(--accent3)' }}>
        <h4 style={{ color: 'var(--accent3)', fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          💡 Pro Tip: One Key Rules Them All
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: '1.6' }}>
          You don't need a separate key for every single model. Keys are grouped by <strong>Provider</strong>. <br/>
          For example: Adding one <strong>OpenAI</strong> key automatically unlocks <em>GPT-4o, o1, o3-mini, and GPT-4 Turbo</em>. Adding one <strong>Google</strong> key unlocks all <em>Gemini</em> models.
        </p>
      </div>

      <div className="keys-grid">
        {PROVIDERS.map((p, i) => {
          const isSaved = !!providerKeys[p.id];
          return (
            <motion.div 
              key={p.id} 
              className="key-card glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="key-card-name">{p.name}</div>
              <div className="key-card-sub">{p.sub}</div>
              <input 
                className="form-input key-card-input" 
                type="password" 
                placeholder={p.placeholder}
                value={providerKeys[p.id] || ''}
                onChange={(e) => setProviderKeys(prev => ({...prev, [p.id]: e.target.value}))}
              />
              <div className="key-btn-row">
                <button className="btn btn-sm btn-primary" onClick={() => handleSave(p.id, providerKeys[p.id] || '')}>Save</button>
                <button className="btn btn-sm btn-ghost" onClick={() => handleClear(p.id)}>Clear</button>
              </div>
              <div className="key-status" style={{ color: isSaved ? 'var(--green)' : 'var(--text3)' }}>
                {isSaved ? '✓ Saved for this session' : 'Not saved'}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="custom-model-info glass-card" style={{ marginTop: '40px', padding: '24px' }}>
        <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', color: 'var(--text)', marginBottom: '12px' }}>Want to use a Custom Model or Local LLM?</h3>
        <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>
          If your model isn't listed here (e.g. Ollama, LMStudio, vLLM, or an OpenAI-compatible endpoint), you can add it directly from the <strong>Top Navigation Bar</strong>. 
          <br/><br/>
          Click the <span style={{ background: 'var(--card2)', border: '1px dashed var(--border)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>+ Custom</span> button next to the model selection chips at the top of the screen. You'll be able to enter your custom API Endpoint URL, Model ID, and API Key there!
        </p>
      </div>

      <style jsx>{`
        .keys-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
        .key-card { padding: 24px; transition: transform 0.2s; }
        .key-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
        .key-card-name { font-family: var(--font-head); font-size: 16px; font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
        .key-card-sub { font-size: 12px; color: var(--text3); margin-bottom: 16px; }
        .key-card-input { font-family: var(--font-mono); margin-bottom: 12px; background: rgba(0,0,0,0.2); }
        .key-btn-row { display: flex; gap: 8px; }
        .key-status { font-size: 11px; margin-top: 12px; font-weight: 600; }
      `}</style>
    </div>
  );
};

export default ApiKeys;
