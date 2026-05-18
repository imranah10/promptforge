import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { 
  Database, Table, Code, FileText, Zap, Loader2, 
  Download, Copy, BarChart3, Binary, Workflow, Terminal,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const DataWizard = () => {
  const { activeModel, apiKey, providerKeys, customModels, showToast } = useContext(AppContext);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('Excel / Google Sheets Formula');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const types = [
    { id: 'Excel / Google Sheets Formula', icon: <FileText size={16} />, desc: 'Complex nested formulas & Array logic' },
    { id: 'SQL Query', icon: <Database size={16} />, desc: 'Optimized PostgreSQL, MySQL, BigQuery' },
    { id: 'Python (Pandas / NumPy) Script', icon: <Binary size={16} />, desc: 'High-performance data manipulation' },
    { id: 'Regular Expression (Regex)', icon: <Code size={16} />, desc: 'Advanced pattern matching & validation' },
    { id: 'Data Visualization Code (Matplotlib/D3)', icon: <BarChart3 size={16} />, desc: 'Interactive charts & heatmaps' },
    { id: 'DAX Formula (PowerBI)', icon: <Workflow size={16} />, desc: 'Business Intelligence measures' }
  ];

  const handleGenerate = async () => {
    if (!query.trim()) { showToast('The input anvil is empty.', 'warn'); return; }
    setLoading(true);
    setResult('');

    const system = `You are the ELITE DATA ARCHITECT. Produce the most efficient code/formulas for ${type}.
    You MUST also provide a brief technical audit in JSON format at the end of your response.
    FORMAT:
    ---AUDIT---
    {
      "complexity": "O(n)",
      "security": "Sanitized & Safe",
      "scalability": "Enterprise Ready",
      "efficiency": 98
    }
    -----------`;
    const userMsg = `Type: ${type}\nRequest: ${query}`;

    try {
      const res = await callAI(system, userMsg, null, activeModel, apiKey, providerKeys, customModels);
      
      // Extract Audit
      const auditMatch = res.match(/---AUDIT---[\s\S]*?(\{[\s\S]*?\})[\s\S]*?-----------/);
      let auditData = null;
      if (auditMatch) {
        try { auditData = JSON.parse(auditMatch[1]); } catch(e) {}
      }

      const cleaned = res.replace(/---AUDIT---[\s\S]*?-----------/g, '').trim();
      setResult(cleaned);
      setAudit(auditData);
      showToast('Industrial Logic Architected!');
    } catch (e) {
      setResult('❌ Wizard Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const [audit, setAudit] = useState(null);

  return (
    <div className="page active wizard-studio">
      <div className="wizard-header">
         <div className="header-badge"><Workflow size={12} /> INDUSTRIAL LOGIC MATRIX</div>
         <h2 className="wizard-title">Data Wizard <span className="wizard-sub">Architect of Intelligence</span></h2>
         <p className="wizard-desc">Engineer complex data structures, queries, and predictive scripts with 10x precision.</p>
      </div>

      <div className="wizard-layout">
        <div className="wizard-anvil glass-card">
           <div className="card-tag">LOGIC CONFIGURATION</div>
           <div className="type-selector">
              {types.map(t => (
                <div 
                  key={t.id} 
                  className={`type-pill ${type === t.id ? 'active' : ''}`}
                  onClick={() => setType(t.id)}
                >
                  <span className="pill-icon">{t.icon}</span>
                  <div className="pill-info">
                    <span className="pill-name">{t.id}</span>
                    <span className="pill-desc">{t.desc}</span>
                  </div>
                </div>
              ))}
           </div>

           <div className="card-tag" style={{ marginTop: '40px' }}>INPUT ANVIL</div>
           <textarea 
             className="wizard-input"
             placeholder="Describe the logic you need to build..."
             value={query}
             onChange={e => setQuery(e.target.value)}
           />
           
           <button className="wizard-btn" onClick={handleGenerate} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Terminal />}
              <span>{loading ? 'SYNTHESIZING LOGIC...' : 'GENERATE PRODUCTION ARTIFACT'}</span>
           </button>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="wizard-matrix glass-card"
            >
               <div className="matrix-top-bar">
                  <div className="card-tag">ARCHITECTED ARTIFACT</div>
                  {audit && (
                    <div className="logic-badges">
                       <span className="l-badge"><Zap size={10} /> {audit.complexity}</span>
                       <span className="l-badge"><ShieldAlert size={10} /> {audit.security}</span>
                       <span className="l-badge"><Table size={10} /> {audit.scalability}</span>
                    </div>
                  )}
               </div>

               <div className="artifact-box">
                  <div className="artifact-header">
                     <div className="status-indicator">
                        <div className="pulse-dot"></div>
                        <span>{type.toUpperCase()}_PAYLOAD_v2.0</span>
                     </div>
                     <div className="artifact-actions">
                        <button className="icon-btn" onClick={() => { navigator.clipboard.writeText(result); showToast('Logic Copied!'); }}><Copy size={16} /></button>
                        <button className="icon-btn"><Download size={16} /></button>
                     </div>
                  </div>
                  <div className="artifact-content">
                     <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                  </div>
               </div>

               {audit && (
                 <div className="efficiency-bar-wrap">
                    <div className="eff-label">Logic Efficiency Score: <span>{audit.efficiency}%</span></div>
                    <div className="eff-track">
                       <motion.div 
                         className="eff-fill" 
                         initial={{ width: 0 }}
                         animate={{ width: `${audit.efficiency}%` }}
                       />
                    </div>
                 </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .wizard-studio { display: flex; flex-direction: column; min-height: 100vh; background: #030308; padding: 40px; -webkit-font-smoothing: antialiased; }
        .wizard-header { margin-bottom: 50px; border-left: 5px solid var(--accent); padding-left: 25px; }
        .header-badge { font-size: 12px; font-weight: 900; color: var(--accent); display: flex; align-items: center; gap: 10px; letter-spacing: 4px; margin-bottom: 10px; }
        .wizard-title { font-size: 40px; font-weight: 900; color: #ffffff; line-height: 1; letter-spacing: -2px; }
        .wizard-sub { color: var(--accent); font-weight: 400; font-size: 24px; }
        .wizard-desc { color: #888888; font-size: 16px; margin-top: 8px; }

        .wizard-layout { display: flex; flex-direction: column; gap: 40px; width: 100%; max-width: 1400px; margin: 0 auto; }
        .wizard-anvil { display: flex; flex-direction: column; padding: 40px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); border-radius: 30px; }
        .wizard-matrix { display: flex; flex-direction: column; padding: 40px; border: 2px solid var(--accent); background: rgba(124,92,252,0.02); border-radius: 30px; box-shadow: 0 30px 100px rgba(124,92,252,0.05); }

        .type-selector { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px; }
        .type-pill { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 22px; cursor: pointer; transition: 0.4s; display: flex; align-items: flex-start; gap: 20px; min-height: 100px; }
        .type-pill:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.15); transform: translateY(-2px); }
        .type-pill.active { background: rgba(124,92,252,0.1); border-color: var(--accent); box-shadow: 0 10px 30px rgba(124,92,252,0.15); }
        
        .pill-icon { width: 45px; height: 45px; background: #000000; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--accent); flex-shrink: 0; border: 1px solid rgba(124,92,252,0.2); }
        .pill-info { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .pill-name { display: block; font-size: 16px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; line-height: 1.2; }
        .pill-desc { display: block; font-size: 12px; color: #777777; line-height: 1.4; }

        .card-tag { font-size: 12px; font-weight: 900; color: #555555; margin-bottom: 25px; letter-spacing: 4px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 15px; text-transform: uppercase; }
        
        .wizard-input { background: transparent; border: none; color: #ffffff; font-size: 20px; line-height: 1.8; resize: none; outline: none; min-height: 150px; margin-bottom: 30px; font-family: 'Inter', sans-serif; }
        
        .wizard-btn { background: var(--accent); border: none; padding: 25px; border-radius: 20px; color: #ffffff; font-weight: 900; font-size: 18px; display: flex; align-items: center; justify-content: center; gap: 15px; cursor: pointer; transition: 0.4s; box-shadow: 0 15px 40px rgba(124,92,252,0.3); }
        .wizard-btn:hover { transform: translateY(-5px); box-shadow: 0 20px 60px rgba(124,92,252,0.5); filter: brightness(1.1); }

        .matrix-top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .logic-badges { display: flex; gap: 10px; }
        .l-badge { font-size: 10px; font-weight: 900; color: var(--accent); background: rgba(124,92,252,0.1); padding: 5px 12px; border-radius: 20px; border: 1px solid rgba(124,92,252,0.2); display: flex; align-items: center; gap: 6px; text-transform: uppercase; }

        .artifact-box { background: #000000; border-radius: 30px; overflow: hidden; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 30px 80px rgba(0,0,0,0.6); }
        .artifact-header { background: rgba(124,92,252,0.1); padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .status-indicator { display: flex; align-items: center; gap: 12px; font-size: 13px; font-weight: 900; color: #ffffff; letter-spacing: 1px; }
        .pulse-dot { width: 8px; height: 8px; background: #34d399; border-radius: 50%; box-shadow: 0 0 10px #34d399; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
        
        .artifact-actions { display: flex; gap: 15px; }
        .icon-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #ffffff; padding: 10px; border-radius: 12px; cursor: pointer; transition: 0.3s; }
        .icon-btn:hover { background: var(--accent); border-color: var(--accent); transform: scale(1.1); }
        
        .artifact-content { padding: 40px; font-size: 18px; line-height: 1.9; color: #ffffff; }

        .efficiency-bar-wrap { margin-top: 30px; padding: 25px; background: rgba(255,255,255,0.03); border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
        .eff-label { font-size: 13px; font-weight: 900; color: #aaaaaa; margin-bottom: 12px; display: flex; justify-content: space-between; }
        .eff-label span { color: var(--accent); }
        .eff-track { height: 10px; background: rgba(255,255,255,0.05); border-radius: 5px; overflow: hidden; }
        .eff-fill { height: 100%; background: linear-gradient(90deg, var(--accent), #34d399); }
      `}</style>
    </div>
  );
};

export default DataWizard;
