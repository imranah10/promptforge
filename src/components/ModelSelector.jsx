import React, { useContext, useState, useEffect, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Plus, X, ChevronDown, Lock, Check, Search, RefreshCw, Loader2 } from 'lucide-react';
import { ALL_MODELS, PROVIDER_META } from '../utils/models';
import { getEffectiveKey } from '../utils/ai';
import { fetchProviderModels } from '../utils/modelFetcher';

const ModelSelector = ({ activePage }) => {
  const {
    activeModel, setActiveModel,
    activeModelName, setActiveModelName,
    apiKey,
    customModels, addCustomModel, removeCustomModel,
    providerKeys,
    showToast,
  } = useContext(AppContext);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [search, setSearch] = useState('');
  const [liveModels, setLiveModels] = useState({});  // { openai: [...], groq: [...], ... }
  const [fetchStatus, setFetchStatus] = useState({}); // { openai: 'loading'|'done'|'error' }

  // Custom model form
  const [customId, setCustomId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [customKey, setCustomKey] = useState('');

  const isKeyConfigured = !!getEffectiveKey(activeModel, apiKey, providerKeys, customModels);

  // Auto-collapse on page change
  useEffect(() => { setIsExpanded(false); setSearch(''); }, [activePage]);

  // ── Live fetch from providers with saved keys ──
  const fetchAllLive = async () => {
    const keys = providerKeys || {};
    const providers = Object.keys(keys).filter(k => keys[k] && PROVIDER_META[k]);
    if (apiKey && !keys.openai) providers.push('openai');

    for (const pid of providers) {
      setFetchStatus(prev => ({ ...prev, [pid]: 'loading' }));
      const list = await fetchProviderModels(pid, keys[pid] || (pid === 'openai' ? apiKey : ''));
      setFetchStatus(prev => ({ ...prev, [pid]: list.length ? 'done' : 'error' }));
      if (list.length) {
        setLiveModels(prev => ({ ...prev, [pid]: list }));
      }
    }
  };

  // Fetch once when expanded for the first time
  useEffect(() => {
    if (isExpanded && Object.keys(liveModels).length === 0) {
      fetchAllLive();
    }
  }, [isExpanded]);

  // ── Build provider-grouped model list ──
  const groupedModels = useMemo(() => {
    const groups = {};

    // Seed with static ALL_MODELS — but ONLY for providers that haven't been
    // live-fetched successfully. Live data is the source of truth for what
    // actually works in production (no decommissioned IDs).
    ALL_MODELS.forEach(m => {
      const liveSuccess = fetchStatus[m.provider] === 'done' && (liveModels[m.provider]?.length > 0);
      if (liveSuccess) return; // skip — live list will replace it below
      if (!groups[m.provider]) groups[m.provider] = [];
      groups[m.provider].push({ ...m, source: 'static' });
    });

    // Merge in live-fetched models (these are the canonical truth)
    Object.entries(liveModels).forEach(([pid, models]) => {
      if (!groups[pid]) groups[pid] = [];
      const existingIds = new Set(groups[pid].map(m => m.id));
      models.forEach(m => {
        if (!existingIds.has(m.id)) {
          groups[pid].push({ ...m, source: 'live', color: PROVIDER_META[pid]?.color || '#94a3b8' });
        }
      });
    });

    // Apply search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      Object.keys(groups).forEach(pid => {
        groups[pid] = groups[pid].filter(m =>
          (m.name || '').toLowerCase().includes(q) || (m.id || '').toLowerCase().includes(q)
        );
        if (groups[pid].length === 0) delete groups[pid];
      });
    }

    return groups;
  }, [liveModels, fetchStatus, search]);

  const handleSelect = (id, name) => {
    setActiveModel(id);
    setActiveModelName(name);
  };

  const handleAddCustomModel = () => {
    if (!customId || !customName) { showToast('Model ID and Name are required', 'warn'); return; }
    addCustomModel({
      id: customId, name: customName,
      endpoint: customEndpoint, apiKey: customKey,
      color: '#94a3b8',
    });
    setIsAddingCustom(false);
    setCustomId(''); setCustomName(''); setCustomEndpoint(''); setCustomKey('');
    showToast('Custom model added');
    handleSelect(customId, customName);
  };

  // Provider key check — STRICT.
  // OpenRouter key only works for `openrouter:*` models (NOT for direct provider endpoints).
  // The legacy global apiKey only counts as an OpenAI fallback if no specific openai key is set.
  const hasProviderKey = (providerId) => {
    if (!providerId) return false;
    const pk = providerKeys || {};
    if (pk[providerId]) return true;
    if (apiKey && providerId === 'openai' && !pk.openai) return true; // legacy global key
    return false;
  };

  // Sorted provider order — by key-availability first, then alphabetical
  const providerOrder = useMemo(() => {
    const ids = Object.keys(groupedModels);
    return ids.sort((a, b) => {
      const aHas = hasProviderKey(a) ? 0 : 1;
      const bHas = hasProviderKey(b) ? 0 : 1;
      if (aHas !== bHas) return aHas - bHas;
      return (PROVIDER_META[a]?.name || a).localeCompare(PROVIDER_META[b]?.name || b);
    });
  }, [groupedModels, providerKeys, apiKey]);

  return (
    <div className={`model-bar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="model-bar-inner">
        <div className="model-bar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="active-model-label">⚡ Active Model — <span>{activeModelName}</span></span>
            {isKeyConfigured ? (
              <span className="key-status-pill ok">
                <Check size={11} /> Key Ready
              </span>
            ) : (
              <span className="key-status-pill missing">
                <Lock size={11} /> Key Missing
              </span>
            )}
          </div>
          <button className="toggle-btn" onClick={() => setIsExpanded(!isExpanded)}>
            <ChevronDown size={18} className="chevron-icon" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            {isExpanded ? 'Hide Settings' : 'Change Model / API Key'}
          </button>
        </div>

        {isExpanded && (
          <div className="model-bar-content">
            {/* Search + Refresh + Add Custom */}
            <div className="ms-toolbar">
              <div className="ms-search">
                <Search size={14} />
                <input
                  placeholder="Search models by name or ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && <X size={14} className="clear-search" onClick={() => setSearch('')} />}
              </div>
              <button className="ms-refresh" onClick={fetchAllLive} title="Fetch latest models from your saved API keys">
                <RefreshCw size={12} /> Refresh live
              </button>
              <button className="ms-add-custom" onClick={() => setIsAddingCustom(!isAddingCustom)}>
                <Plus size={12} /> Custom
              </button>
            </div>

            {/* Custom model form */}
            {isAddingCustom && (
              <div className="custom-model-form">
                <input className="form-input" placeholder="Display Name (e.g. My Local LLM)" value={customName} onChange={e => setCustomName(e.target.value)} />
                <input className="form-input" placeholder="Model ID (e.g. llama-3.1-70b)" value={customId} onChange={e => setCustomId(e.target.value)} />
                <input className="form-input" placeholder="API Endpoint (optional, OpenAI-compatible)" value={customEndpoint} onChange={e => setCustomEndpoint(e.target.value)} />
                <input className="form-input" type="password" placeholder="API Key (optional)" value={customKey} onChange={e => setCustomKey(e.target.value)} />
                <div className="custom-form-buttons">
                  <button className="btn btn-primary btn-sm" onClick={handleAddCustomModel}>Add Model</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setIsAddingCustom(false)}>Cancel</button>
                </div>
              </div>
            )}

            {/* Live fetch status bar */}
            {Object.keys(fetchStatus).length > 0 && (
              <div className="ms-fetch-status">
                {Object.entries(fetchStatus).map(([pid, status]) => {
                  const meta = PROVIDER_META[pid] || { name: pid, emoji: '•' };
                  const count = liveModels[pid]?.length || 0;
                  return (
                    <span key={pid} className={`fetch-pill ${status}`}>
                      {status === 'loading' && <Loader2 size={9} className="spin" />}
                      {status === 'done'    && <Check size={9} />}
                      {meta.emoji} {meta.name}
                      {status === 'done' && ` · ${count} live`}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Provider-grouped model list */}
            <div className="ms-providers">
              {providerOrder.length === 0 && (
                <div className="ms-empty">No models match "{search}"</div>
              )}
              {providerOrder.map(pid => {
                const meta = PROVIDER_META[pid] || { name: pid, emoji: '•', color: '#94a3b8' };
                const models = groupedModels[pid] || [];
                if (models.length === 0) return null;
                const keyAvailable = hasProviderKey(pid);
                return (
                  <div key={pid} className="ms-provider-group">
                    <div className="ms-provider-header">
                      <span className="ms-provider-name" style={{ color: meta.color }}>
                        {meta.emoji} {meta.name}
                      </span>
                      <span className="ms-provider-count">{models.length} model{models.length > 1 ? 's' : ''}</span>
                      {keyAvailable ? (
                        <span className="ms-provider-key ok"><Check size={9} /> Key OK</span>
                      ) : (
                        <span className="ms-provider-key missing"><Lock size={9} /> Add key</span>
                      )}
                    </div>
                    <div className="ms-chip-row">
                      {models.map(m => {
                        const isSelected = activeModel === m.id;
                        const isLocked = !keyAvailable && !isSelected;
                        return (
                          <div
                            key={m.id}
                            className={`model-chip ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
                            onClick={() => handleSelect(m.id, m.name)}
                            title={isLocked ? `Add ${meta.name} key in API Keys page to use this model` : m.id}
                          >
                            <div className="chip-dot" style={{ background: m.color || meta.color }}></div>
                            <span className="chip-name">{m.name}</span>
                            {m.tier === 'free' || m.free ? <span className="chip-badge free">FREE</span> : null}
                            {m.source === 'live' && <span className="chip-badge live">LIVE</span>}
                            {isLocked && <Lock size={10} className="chip-lock" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Custom models (always shown if any) */}
              {customModels && customModels.length > 0 && (
                <div className="ms-provider-group">
                  <div className="ms-provider-header">
                    <span className="ms-provider-name" style={{ color: '#94a3b8' }}>
                      🛠️ Custom Models
                    </span>
                    <span className="ms-provider-count">{customModels.length}</span>
                  </div>
                  <div className="ms-chip-row">
                    {customModels.map(m => (
                      <div
                        key={m.id}
                        className={`model-chip custom-chip ${activeModel === m.id ? 'selected' : ''}`}
                        onClick={() => handleSelect(m.id, m.name)}
                      >
                        <div className="chip-dot" style={{ background: m.color || '#94a3b8' }}></div>
                        <span className="chip-name">{m.name}</span>
                        <X size={11} className="remove-custom" onClick={(e) => { e.stopPropagation(); removeCustomModel(m.id); }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom status banner */}
            {!isKeyConfigured ? (
              <div className="ms-status-banner missing">
                ⚠️ <strong>{activeModelName}</strong> needs an API key.&nbsp;
                {activeModel.startsWith('openrouter:')
                  ? <>Get a free key at <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">openrouter.ai/keys</a> and save it in API Keys page.</>
                  : <>Add it in the API Keys page from the sidebar.</>}
              </div>
            ) : (
              <div className="ms-status-banner ok">
                ✅ <strong>{activeModelName}</strong> ready — all tools (Writer, Code Helper, Compare, Spider, etc.) will use this model.
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .model-bar {
          background: var(--card);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          position: relative;
          z-index: 40;
          transition: padding 0.3s ease;
        }
        .model-bar.collapsed { padding: 12px 32px; }
        .model-bar.expanded  { padding: 16px 32px 20px; }
        .model-bar-inner { max-width: var(--content-max-width, 1650px); margin: 0 auto; }

        .model-bar-header {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 10px;
        }
        .active-model-label {
          font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
          color: var(--text2); background: var(--border2); padding: 6px 12px; border-radius: 8px;
          border: 1px solid var(--border);
        }
        .active-model-label span { color: var(--accent); font-weight: 800; }

        .key-status-pill {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 10px; font-weight: 800; letter-spacing: 0.5px;
          padding: 3px 9px; border-radius: 12px;
        }
        .key-status-pill.ok      { background: rgba(74,222,128,0.12); color: #4ade80; border: 1px solid rgba(74,222,128,0.3); }
        .key-status-pill.missing { background: rgba(248,113,113,0.12); color: #f87171; border: 1px solid rgba(248,113,113,0.3); }

        .toggle-btn {
          display: flex; align-items: center; gap: 6px;
          background: var(--bg3); border: 1px solid var(--border);
          color: var(--text2); font-size: 11px; font-weight: 600; text-transform: uppercase;
          padding: 6px 12px; border-radius: 20px; cursor: pointer; transition: all 0.2s;
        }
        .toggle-btn:hover { background: var(--border); color: var(--text); border-color: var(--accent); }
        .chevron-icon { transition: transform 0.3s; }

        .model-bar-content { margin-top: 14px; animation: fadeIn 0.3s ease; }

        .ms-toolbar {
          display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; align-items: center;
        }
        .ms-search {
          flex: 1; min-width: 220px;
          display: flex; align-items: center; gap: 8px;
          background: var(--bg3); border: 1px solid var(--border);
          padding: 6px 12px; border-radius: 10px;
          color: var(--text3);
        }
        .ms-search input {
          flex: 1; background: none; border: none; outline: none;
          color: var(--text); font-size: 13px; font-family: inherit;
        }
        .ms-search input::placeholder { color: var(--text3); }
        .clear-search { cursor: pointer; opacity: 0.6; }
        .clear-search:hover { opacity: 1; color: var(--text); }

        .ms-refresh, .ms-add-custom {
          display: flex; align-items: center; gap: 5px;
          background: var(--bg3); border: 1px solid var(--border);
          color: var(--text2); font-size: 11px; font-weight: 700;
          padding: 6px 12px; border-radius: 10px; cursor: pointer;
          font-family: inherit; transition: all 0.2s;
        }
        .ms-refresh:hover, .ms-add-custom:hover { border-color: var(--accent); color: var(--accent); }

        .custom-model-form {
          display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
          margin-bottom: 14px; padding: 14px;
          background: var(--card2); border-radius: 12px; border: 1px solid var(--border);
        }
        .custom-model-form .form-input { padding: 8px 12px; font-size: 13px; }
        .custom-form-buttons { grid-column: 1/-1; display: flex; gap: 8px; }

        .ms-fetch-status {
          display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px;
        }
        .fetch-pill {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 10px; font-weight: 700;
          padding: 3px 8px; border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--bg3); color: var(--text3);
        }
        .fetch-pill.loading { background: rgba(124,92,252,0.08); color: var(--accent); border-color: rgba(124,92,252,0.3); }
        .fetch-pill.done    { background: rgba(74,222,128,0.08); color: #4ade80; border-color: rgba(74,222,128,0.3); }
        .fetch-pill.error   { background: rgba(248,113,113,0.08); color: #f87171; border-color: rgba(248,113,113,0.3); }
        .spin { animation: spin 1s linear infinite; }

        .ms-providers {
          max-height: 380px; overflow-y: auto; padding-right: 6px;
          display: flex; flex-direction: column; gap: 14px;
        }
        .ms-providers::-webkit-scrollbar { width: 6px; }
        .ms-providers::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

        .ms-empty {
          text-align: center; padding: 30px; color: var(--text3); font-size: 13px;
        }

        .ms-provider-group {
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 10px 12px;
        }
        .ms-provider-header {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 8px; flex-wrap: wrap;
        }
        .ms-provider-name {
          font-size: 12px; font-weight: 800;
          letter-spacing: 0.5px;
        }
        .ms-provider-count {
          font-size: 10px; color: var(--text3); font-weight: 600;
          background: var(--bg3); padding: 2px 7px; border-radius: 8px;
        }
        .ms-provider-key {
          margin-left: auto;
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 9px; font-weight: 800; letter-spacing: 0.5px;
          padding: 2px 8px; border-radius: 10px; border: 1px solid;
        }
        .ms-provider-key.ok      { color: #4ade80; border-color: rgba(74,222,128,0.3); background: rgba(74,222,128,0.08); }
        .ms-provider-key.missing { color: #fbbf24; border-color: rgba(251,191,36,0.3); background: rgba(251,191,36,0.08); }

        .ms-chip-row { display: flex; gap: 6px; flex-wrap: wrap; }

        .model-chip {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 18px;
          font-size: 12px; font-weight: 500;
          border: 1px solid var(--border); background: var(--bg3);
          transition: all 0.2s; color: var(--text2);
          white-space: nowrap; cursor: pointer;
        }
        .model-chip:hover { border-color: var(--accent); color: var(--text); background: var(--border2); }
        .model-chip.selected { background: var(--accent); border-color: var(--accent); color: #fff; box-shadow: 0 0 12px var(--glow); }
        .model-chip.locked { opacity: 0.55; }
        .model-chip.locked:hover { opacity: 0.85; border-color: rgba(251,191,36,0.4); }
        .chip-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .chip-name { max-width: 220px; overflow: hidden; text-overflow: ellipsis; }
        .chip-badge {
          font-size: 8px; font-weight: 800; letter-spacing: 0.4px;
          padding: 1px 5px; border-radius: 6px;
        }
        .chip-badge.free { background: rgba(74,222,128,0.18); color: #4ade80; border: 1px solid rgba(74,222,128,0.3); }
        .chip-badge.live { background: rgba(34,211,238,0.15); color: #22d3ee; border: 1px solid rgba(34,211,238,0.3); }
        .chip-lock { opacity: 0.7; }

        .custom-chip { padding-right: 6px; }
        .remove-custom { opacity: 0.5; transition: opacity 0.2s; }
        .remove-custom:hover { opacity: 1; color: #f87171; }

        .ms-status-banner {
          margin-top: 14px;
          padding: 10px 14px; border-radius: 10px;
          font-size: 12.5px; line-height: 1.6;
        }
        .ms-status-banner.ok      { background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.25); color: rgba(255,255,255,0.85); }
        .ms-status-banner.missing { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.25); color: rgba(255,255,255,0.85); }
        .ms-status-banner a { color: var(--accent); text-decoration: underline; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 900px) {
          .model-bar.collapsed, .model-bar.expanded { padding: 12px 16px; }
          .custom-model-form { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default ModelSelector;
