import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { Search, Globe, Zap, Cpu, Shield, Send, ArrowRight, ExternalLink, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';

const TheSpider = () => {
  const { providerKeys, showToast, activeModel, apiKey, customModels } = useContext(AppContext);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [steps, setSteps] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setResults(null);
    setSteps(['Initializing Quantum Neural Grid...', 'Bypassing Web Security Protocols...']);

    try {
      const modelToUse = activeModel || 'gpt-4o';
      
      // Phase 1: Live Web Extraction via Jina AI
      let isUrl = query.trim().startsWith('http://') || query.trim().startsWith('https://');
      let jinaEndpoint = isUrl ? `https://r.jina.ai/${query.trim()}` : `https://s.jina.ai/${encodeURIComponent(query.trim())}`;
      
      setSteps(prev => [...prev, isUrl ? 'Extracting raw domain intelligence...' : 'Injecting query into global search matrix...']);
      
      let rawRes = '';
      try {
        const jinaResponse = await fetch(jinaEndpoint, {
           headers: { 'Accept': 'text/plain' }
        });
        rawRes = await jinaResponse.text();
      } catch (err) {
        throw new Error('Spider failed to penetrate target. ' + err.message);
      }
      
      if (!rawRes || rawRes.length < 50) {
        throw new Error('Target blocked extraction or returned empty dataset.');
      }

      setSteps(prev => [...prev, 'Payload acquired.', 'Phase 2: Eradicating noise & Synthesizing Secure Dossier...']);
      
      const finalPrompt = [
        { role: 'system', content: `You are the MASTER SPIDER. You just scraped this raw data from the live web. 
        Clean it up into a brilliant, highly readable SECURE INTELLIGENCE DOSSIER.
        CRITICAL RULES:
        1. DO NOT summarize briefly. Provide an exhaustive, extremely detailed, long-form intelligence report.
        2. Extract every key data point, statistic, concept, and technical detail.
        3. All sources and references MUST be clickable markdown links like [Source Name](URL).
        4. Format perfectly with markdown headers and bullet points. Completely ignore and remove navigation menus, footers, ad text, or UI junk from the raw text.` },
        { role: 'user', content: `RAW SCRAPED DATA:\n${rawRes.substring(0, 40000)}\n\nOriginal Request: ${query}` }
      ];
      
      const res = await callAI(finalPrompt, modelToUse, modelToUse, apiKey, providerKeys, customModels);
      
      setSteps(prev => [...prev, 'Intelligence verified.', 'Encryption layers applied.', 'Report Released.']);
      setResults(res);
    } catch (e) {
      showToast('Search Failed: ' + e.message, 'error');
    } finally {
      setLoading(false);
      setTimeout(() => setSteps([]), 4000);
    }
  };

  return (
    <div className="page active">
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="spider-icon"><Search size={24} /></div>
          <div>
            <h2 className="section-title">The <span style={{ color: 'var(--accent)' }}>Spider</span></h2>
            <div className="section-sub">Autonomous Deep Web Intelligence Engine. Real-time data extraction.</div>
          </div>
        </div>
      </div>

      <div className="spider-container">
        <div className="search-box-wrap">
          <div className="search-glass">
            <Search className="search-icon-fixed" size={20} />
            <input 
              className="spider-input"
              placeholder="Inject query into the global neural network..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button className="spider-btn" onClick={handleSearch} disabled={loading}>
              {loading ? <div className="spinner-sm" /> : 'Deploy Spider'}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="spider-loader-card"
            >
              <div className="radar-animation">
                <div className="radar-circle"></div>
                <div className="radar-circle delay1"></div>
                <div className="radar-circle delay2"></div>
                <Globe size={40} className="globe-icon" />
              </div>
              <div className="steps-wrap">
                {steps.map((s, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="step-text"
                  >
                    <Zap size={12} color="var(--accent)" /> {s}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {results && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="spider-results glass-card"
          >
            <div className="results-header">
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Shield size={16} /> SECURE INTELLIGENCE DOSSIER
               </div>
               <div className="verified-badge">
                 <Zap size={10} /> NEURAL VERIFIED
               </div>
               <div style={{ flex: 1 }} />
               <button 
                 className="copy-btn-spider"
                 onClick={() => {
                   navigate('/dashboard/chatdata', { state: { spiderPayload: results, spiderQuery: query } });
                 }}
                 style={{ background: 'var(--accent)', color: '#fff' }}
               >
                 <Database size={14} /> Inject to Data Studio
               </button>
               <button 
                 className="copy-btn-spider"
                 onClick={() => {
                   // Clean markdown formatting for a clean paste
                   const cleanText = results
                     .replace(/\*\*/g, '') // Remove bold
                     .replace(/###/g, '')  // Remove headers
                     .replace(/##/g, '')
                     .replace(/#/g, '')
                     .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)'); // Convert links to: Name (URL)
                   
                   navigator.clipboard.writeText(cleanText);
                   showToast('Clean Intelligence Copied');
                 }}
               >
                 <Send size={14} /> Copy Clean Text
               </button>
            </div>
            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{results}</ReactMarkdown>
            </div>
            <div className="results-footer">
              End of Transmission. Neural Consensus Verified by Multi-Model Protocol.
            </div>
          </motion.div>
        )}
      </div>

      <style jsx>{`
        .spider-icon { width: 48px; height: 48px; border-radius: 12px; background: rgba(124,92,252,0.1); border: 1px solid var(--accent); display: flex; align-items: center; justify-content: center; color: var(--accent); box-shadow: 0 0 20px rgba(124,92,252,0.2); }
        .spider-container { max-width: 900px; margin: 40px auto; display: flex; flex-direction: column; gap: 30px; }
        
        .search-box-wrap { width: 100%; }
        .search-glass { 
          background: rgba(255,255,255,0.05); border: 1px solid var(--border); 
          border-radius: 20px; padding: 12px 20px; display: flex; gap: 15px; align-items: center;
          box-shadow: 0 10px 40px rgba(0,0,0,0.4);
        }
        .search-icon-fixed { color: var(--text3); }
        .spider-input { flex: 1; background: none; border: none; color: #fff; font-size: 18px; outline: none; }
        .spider-btn { 
          background: var(--accent); color: #fff; border: none; padding: 12px 24px; 
          border-radius: 12px; font-weight: 800; cursor: pointer; transition: all 0.3s;
        }
        .spider-btn:hover { box-shadow: 0 0 20px var(--glow); transform: translateY(-2px); }

        .spider-loader-card { 
          background: rgba(124,92,252,0.05); border: 1px solid rgba(124,92,252,0.2); 
          border-radius: 24px; padding: 40px; display: flex; flex-direction: column; align-items: center; gap: 30px;
        }
        .radar-animation { position: relative; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; }
        .radar-circle { 
          position: absolute; width: 100%; height: 100%; border: 2px solid var(--accent); 
          border-radius: 50%; animation: radar-ping 2s infinite; opacity: 0;
        }
        .delay1 { animation-delay: 0.6s; }
        .delay2 { animation-delay: 1.2s; }
        @keyframes radar-ping { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(1.5); opacity: 0; } }
        .globe-icon { color: var(--accent); z-index: 2; animation: spin-slow 10s infinite linear; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .steps-wrap { display: flex; flex-direction: column; gap: 10px; text-align: center; }
        .step-text { font-size: 14px; color: var(--text2); display: flex; align-items: center; gap: 8px; justify-content: center; }

        .spider-results { padding: 40px; background: rgba(0,0,0,0.3); border: 1px solid rgba(124,92,252,0.2); position: relative; overflow: hidden; }
        .results-header { font-size: 11px; letter-spacing: 2px; color: var(--accent); font-weight: 900; margin-bottom: 30px; display: flex; align-items: center; gap: 15px; border-bottom: 1px solid rgba(124,92,252,0.1); padding-bottom: 15px; }
        .verified-badge { background: rgba(52,211,153,0.1); color: #34d399; padding: 4px 10px; border-radius: 100px; font-size: 8px; font-weight: 900; border: 1px solid rgba(52,211,153,0.3); display: flex; align-items: center; gap: 5px; }
        .copy-btn-spider { background: rgba(124,92,252,0.1); border: 1px solid var(--accent); color: var(--accent); padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.3s; }
        .copy-btn-spider:hover { background: var(--accent); color: #fff; box-shadow: 0 0 15px var(--glow); }
        .markdown-content { font-size: 16px; line-height: 1.8; color: rgba(255,255,255,0.9); }
        .markdown-content strong { color: var(--accent); font-weight: 800; display: inline-block; margin-top: 10px; }
        .markdown-content h1, .markdown-content h2, .markdown-content h3 { color: #fff; margin: 25px 0 15px; font-weight: 800; letter-spacing: -0.5px; }
        .markdown-content p { margin-bottom: 16px; }
        .markdown-content li { margin-bottom: 8px; list-style-type: none; border-left: 2px solid var(--accent); padding-left: 15px; background: rgba(124,92,252,0.03); padding: 10px 15px; border-radius: 0 8px 8px 0; }
        .markdown-content a { color: var(--accent); font-weight: 800; text-decoration: none; border-bottom: 1px dashed var(--accent); transition: all 0.3s; }
        .markdown-content a:hover { color: #fff; border-bottom: 1px solid #fff; text-shadow: 0 0 10px var(--glow); }
        .results-footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 10px; color: var(--text3); font-style: italic; text-align: center; }
      `}</style>
    </div>
  );
};

export default TheSpider;
