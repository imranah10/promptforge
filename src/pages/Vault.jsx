import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, Trash2, Copy, Download, Search, Zap, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { downloadText } from '../utils/helpers';

const Vault = () => {
  const { vaultHistory, clearVault, deleteVaultItem, showToast } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const filteredHistory = vaultHistory.filter(item => 
    item.prompt.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.result.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.toolName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showToast('✓ Copied to clipboard');
  };

  const handleDownload = (item) => {
    const filename = `PromptForge_Vault_${item.toolName.replace(/\s+/g, '_')}_${item.id}.txt`;
    const content = `Date: ${item.date}\nTool: ${item.toolName}\nModel: ${item.model}\n\n--- PROMPT ---\n${item.prompt}\n\n--- RESULT ---\n${item.result}`;
    downloadText(content, filename);
    showToast('✓ Download started');
  };

  return (
    <div className="page active">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="section-title">🗄️ Generation Vault</h2>
          <div className="section-sub">Your personal history of AI generations. Safely stored locally on your device.</div>
        </div>
        
        {vaultHistory.length > 0 && (
          <button className="btn btn-outline" style={{ borderColor: 'var(--pink)', color: 'var(--pink)' }} onClick={() => {
            if(window.confirm('Are you sure you want to clear your entire vault history?')) clearVault();
          }}>
            <Trash2 size={16} /> Clear Vault
          </button>
        )}
      </div>

      <div className="tool-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div className="search-bar">
          <Search size={18} color="var(--text3)" />
          <input 
            type="text" 
            placeholder="Search your vault (prompts, results, tools)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="empty-state">
          <Archive size={48} color="var(--text3)" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3>Your Vault is Empty</h3>
          <p>Generate some content using the tools, and it will automatically be saved here.</p>
        </div>
      ) : (
        <div className="vault-list">
          <AnimatePresence>
            {filteredHistory.map((item, i) => {
              const isExpanded = expandedId === item.id;
              const cleanPrompt = item.prompt.replace(/\*\*|\*/g, '');
              return (
                <motion.div 
                  key={item.id}
                  className="vault-item glass-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="vault-item-header" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                    <div className="vault-item-meta">
                      <span className="vault-tool-badge">{item.toolName}</span>
                      <span className="vault-model"><Zap size={12} /> {item.model}</span>
                      <span className="vault-date"><Clock size={12} /> {item.date}</span>
                    </div>
                    <div className="vault-item-prompt">
                      {cleanPrompt.length > 100 && !isExpanded ? cleanPrompt.substring(0, 100) + '...' : cleanPrompt}
                    </div>
                    <div className="vault-expand-icon">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
 
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        className="vault-item-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <div className="vault-result markdown-body" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', whiteSpace: 'normal', color: 'var(--text)' }}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{(item.result || '').replace(/\*\*|\*/g, '')}</ReactMarkdown>
                        </div>
                        <div className="vault-actions">
                          <button className="btn btn-sm btn-ghost" onClick={() => handleDownload(item)}><Download size={14} /> Download</button>
                          <button className="btn btn-sm btn-ghost" onClick={() => handleCopy((item.result || '').replace(/\*\*|\*/g, ''))}><Copy size={14} /> Copy Result</button>
                          <button className="btn btn-sm btn-ghost" style={{ color: 'var(--pink)' }} onClick={() => deleteVaultItem(item.id)}><Trash2 size={14} /> Delete</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <style jsx>{`
        .search-bar {
          display: flex; align-items: center; gap: 12px;
          background: var(--bg2); border: 1px solid var(--border);
          padding: 12px 16px; border-radius: 12px;
        }
        .search-bar input {
          flex: 1; background: none; border: none; outline: none;
          color: var(--text); font-size: 15px; font-family: var(--font-body);
        }
        .empty-state {
          text-align: center; padding: 60px 20px;
          background: var(--card); border-radius: 16px; border: 1px dashed var(--border);
          color: var(--text3);
        }
        .vault-list { display: flex; flex-direction: column; gap: 16px; }
        .vault-item { padding: 0; overflow: hidden; transition: box-shadow 0.2s; }
        .vault-item:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.2); border-color: rgba(124,92,252,0.3); }
        .vault-item-header { padding: 20px; cursor: pointer; position: relative; }
        .vault-item-meta { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
        .vault-tool-badge { 
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
          background: rgba(124,92,252,0.15); color: var(--accent2); padding: 4px 10px; border-radius: 6px;
        }
        .vault-model { font-size: 12px; color: var(--gold); display: flex; align-items: center; gap: 4px; font-weight: 600; }
        .vault-date { font-size: 12px; color: var(--text3); display: flex; align-items: center; gap: 4px; }
        .vault-item-prompt { font-size: 14px; color: var(--text); line-height: 1.5; padding-right: 30px; }
        .vault-expand-icon { position: absolute; top: 20px; right: 20px; color: var(--text3); }
        
        .vault-item-content { border-top: 1px solid var(--border); background: rgba(0,0,0,0.2); }
        .vault-result { padding: 20px; font-family: var(--font-mono); font-size: 13px; color: var(--text2); white-space: pre-wrap; line-height: 1.6; max-height: 400px; overflow-y: auto; }
        .vault-actions { padding: 12px 20px; display: flex; gap: 8px; border-top: 1px solid var(--border); background: var(--card2); }
      `}</style>
    </div>
  );
};

export default Vault;
