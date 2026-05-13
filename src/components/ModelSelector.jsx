import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Plus, X, ChevronDown } from 'lucide-react';
import { ALL_MODELS } from '../utils/models';
import { getEffectiveKey } from '../utils/ai';

const ModelSelector = ({ activePage }) => {
  const { 
    activeModel, setActiveModel, 
    activeModelName, setActiveModelName,
    apiKey, setApiKey,
    customModels, addCustomModel, removeCustomModel,
    providerKeys,
    showToast
  } = useContext(AppContext);

  const isKeyConfigured = !!getEffectiveKey(activeModel, apiKey, providerKeys, customModels);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // Auto-collapse when navigating to a new tool
  useEffect(() => {
    setIsExpanded(false);
  }, [activePage]);
  const [customId, setCustomId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [customKey, setCustomKey] = useState('');

  const handleSelect = (id, name) => {
    setActiveModel(id);
    setActiveModelName(name);
  };

  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      showToast('Please enter an API key', 'warn');
      return;
    }
    showToast('✓ API key saved for this session');
  };

  const handleClearKey = () => {
    setApiKey('');
    showToast('Key cleared');
  };

  const handleAddCustomModel = () => {
    if (!customId || !customName) {
      showToast('Model ID and Name are required', 'warn');
      return;
    }
    addCustomModel({
      id: customId,
      name: customName,
      endpoint: customEndpoint,
      apiKey: customKey,
      color: '#fff' // Default white color for custom models
    });
    setIsAddingCustom(false);
    setCustomId(''); setCustomName(''); setCustomEndpoint(''); setCustomKey('');
    showToast('Custom model added successfully');
    handleSelect(customId, customName);
  };

  return (
    <div className={`model-bar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="model-bar-inner">
        <div className="model-bar-header">
          <span className="active-model-label">⚡ Active Model — <span>{activeModelName}</span></span>
          <button className="toggle-btn" onClick={() => setIsExpanded(!isExpanded)}>
            <ChevronDown size={18} className="chevron-icon" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            {isExpanded ? 'Hide Settings' : 'Change Model / API Key'}
          </button>
        </div>

        <div className="model-bar-content" style={{ display: isExpanded ? 'block' : 'none' }}>
          <div className="model-bar-top">
            <div className="model-chips">
              {ALL_MODELS.map(m => (
                <div 
                  key={m.id} 
                  className={`model-chip ${activeModel === m.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(m.id, m.name)}
                >
                  <div className="chip-dot" style={{ background: m.color }}></div> {m.name}
                </div>
              ))}
              
              {customModels.map(m => (
                <div 
                  key={m.id} 
                  className={`model-chip custom-chip ${activeModel === m.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(m.id, m.name)}
                >
                  <div className="chip-dot" style={{ background: m.color }}></div> {m.name}
                  <X size={12} className="remove-custom" onClick={(e) => {
                    e.stopPropagation();
                    removeCustomModel(m.id);
                  }} />
                </div>
              ))}

              <div className="model-chip add-custom" onClick={() => setIsAddingCustom(!isAddingCustom)}>
                <Plus size={14} /> Custom
              </div>
            </div>
          </div>

          {isAddingCustom && (
            <div className="custom-model-form">
              <input className="form-input" placeholder="Model Display Name (e.g. My Custom LLM)" value={customName} onChange={e => setCustomName(e.target.value)} />
              <input className="form-input" placeholder="Model ID (e.g. gpt-4)" value={customId} onChange={e => setCustomId(e.target.value)} />
              <input className="form-input" placeholder="API Endpoint (optional)" value={customEndpoint} onChange={e => setCustomEndpoint(e.target.value)} />
              <input className="form-input" type="password" placeholder="API Key (optional)" value={customKey} onChange={e => setCustomKey(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={handleAddCustomModel}>Add Model</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setIsAddingCustom(false)}>Cancel</button>
            </div>
          )}

          {!isKeyConfigured ? (
            <div className="model-key-row" style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--red)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--red)', fontSize: '13px', fontWeight: '500', lineHeight: '1.4' }}>
                ⚠️ No API Key configured for {activeModelName}. 
                {activeModel.startsWith('openrouter:') ? (
                  <> This model is 100% free, but requires a <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Free OpenRouter API Key</a> to prevent spam. Please generate one and save it in the "API Keys" section.</>
                ) : (
                  <> Please add it in the "API Keys" section.</>
                )}
              </span>
            </div>
          ) : (
            <div className="model-key-row" style={{ padding: '8px 12px', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid var(--green)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--green)', fontSize: '13px', fontWeight: '500' }}>✅ API Key is saved and ready for {activeModelName}</span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .model-bar {
          background: rgba(10, 10, 20, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          position: relative;
          z-index: 40;
          transition: all 0.3s ease;
        }
        .model-bar.collapsed { padding: 12px 32px; }
        .model-bar.expanded { padding: 16px 32px; }
        .model-bar-inner { max-width: 1200px; margin: 0 auto; }
        
        .model-bar-header { display: flex; align-items: center; justify-content: space-between; }
        .active-model-label {
          font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
          color: var(--accent2); background: rgba(124,92,252,0.15); padding: 6px 12px; border-radius: 8px;
          border: 1px solid rgba(124,92,252,0.3);
          box-shadow: 0 0 10px rgba(124,92,252,0.2);
        }
        .toggle-btn {
          display: flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.05); border: 1px solid var(--border);
          color: var(--text2); font-size: 11px; font-weight: 600; text-transform: uppercase;
          padding: 6px 12px; border-radius: 20px; cursor: pointer; transition: all 0.2s;
        }
        .toggle-btn:hover { background: rgba(255,255,255,0.1); color: var(--text); border-color: var(--text3); }
        .chevron-icon { transition: transform 0.3s; }

        .model-bar-content { margin-top: 16px; animation: fadeIn 0.3s ease; }
        
        .model-bar-top { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 14px; flex-wrap: wrap; }
        .model-chips { 
          display: flex; gap: 8px; flex-wrap: wrap; flex: 1;
          max-height: 110px; overflow-y: auto; padding-right: 8px;
        }
        .model-chips::-webkit-scrollbar { width: 4px; }
        .model-chips::-webkit-scrollbar-track { background: transparent; }
        .model-chips::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        .model-chips::-webkit-scrollbar-thumb:hover { background: var(--accent); }

        .model-chip {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 20px;
          font-size: 12px; font-weight: 500; cursor: pointer;
          border: 1px solid var(--border); background: var(--card);
          transition: all 0.2s; color: var(--text2);
          white-space: nowrap;
        }
        .model-chip:hover { border-color: var(--accent); color: var(--text); background: rgba(124,92,252,0.1); }
        .model-chip.selected { background: var(--accent); border-color: var(--accent); color: #fff; box-shadow: 0 0 16px var(--glow); }
        .chip-dot { width: 6px; height: 6px; border-radius: 50%; }
        
        .add-custom { border-style: dashed; }
        .custom-chip { padding-right: 8px; }
        .remove-custom { opacity: 0.5; transition: opacity 0.2s; margin-left: 4px; }
        .remove-custom:hover { opacity: 1; color: var(--pink); }

        .custom-model-form {
          display: flex; gap: 10px; margin-bottom: 14px; padding: 12px;
          background: var(--card2); border-radius: 12px; border: 1px solid var(--border);
          flex-wrap: wrap;
        }
        .custom-model-form .form-input { flex: 1; min-width: 150px; padding: 8px 12px; }

        .model-key-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .key-input {
          flex: 1; min-width: 240px;
          background: var(--card); border: 1px solid var(--border);
          color: var(--text); font-family: var(--font-mono); font-size: 12px;
          padding: 10px 16px; border-radius: 8px; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .key-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(124,92,252,0.2); }
        .key-input::placeholder { color: var(--text3); font-family: var(--font-body); font-size: 12px; }
        .key-note { font-size: 11px; color: var(--text3); margin-top: 10px; }
        .key-note span { color: var(--gold); }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 900px) {
          .model-bar { padding: 16px; }
        }
      `}</style>
    </div>
  );
};

export default ModelSelector;
