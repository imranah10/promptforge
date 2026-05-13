import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { Copy, Zap, Loader2, Search, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { downloadText } from '../utils/helpers';

const SEOOptimizer = () => {
  const { activeModel, apiKey, providerKeys, customModels, showToast, saveToVault } = useContext(AppContext);
  
  const [task, setTask] = useState('Keyword Research Strategy');
  const [topic, setTopic] = useState('');
  const [competitors, setCompetitors] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) { showToast('Please enter a topic or URL', 'warn'); return; }
    setLoading(true);
    setResult('');

    const system = `You are a world-class SEO expert and Content Strategist. Your goal is to help websites rank #1 on Google by providing highly actionable, data-driven SEO advice and perfectly optimized content.`;
    
    let userPrompt = `Task: ${task}\nTarget Topic / Keyword / URL: ${topic}\n`;
    if (competitors) userPrompt += `Main Competitors: ${competitors}\n`;
    
    if (task === 'Keyword Research Strategy') {
      userPrompt += `\nPlease provide a comprehensive keyword strategy including primary keywords, long-tail variations, LSI keywords, and search intent analysis. Format as a clear, structured table or list.`;
    } else if (task === 'On-Page SEO Audit') {
      userPrompt += `\nPlease provide a checklist of on-page SEO improvements for this topic, including title tags, meta descriptions, H1-H3 structure, and content gap recommendations.`;
    } else {
      userPrompt += `\nPlease provide an optimized structure and recommendations for this topic.`;
    }

    try {
      const res = await callAI(system, userPrompt, null, activeModel, apiKey, providerKeys, customModels);
      setResult(res);
      saveToVault('SEO Optimizer', `Task: ${task}\nTopic: ${topic}\nCompetitors: ${competitors || 'None'}`, res);
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
    downloadText(result, `PromptForge_SEO_${task.replace(/\s+/g, '_')}.txt`);
    showToast('✓ Download started');
  };

  return (
    <div className="page active">
      <div className="section-header">
        <h2 className="section-title">🔍 SEO Optimizer</h2>
        <div className="section-sub">Dominate search rankings with expert keyword strategies, audits, and content optimization.</div>
      </div>
      
      <div className="tool-card">
        <div className="form-group">
          <label className="form-label">SEO Task</label>
          <select className="form-select" value={task} onChange={e => setTask(e.target.value)}>
            <option>Keyword Research Strategy</option>
            <option>On-Page SEO Audit</option>
            <option>Blog Post Outline (SEO Optimized)</option>
            <option>Meta Title & Description Generator</option>
            <option>Topic Cluster Strategy</option>
          </select>
        </div>

        <div className="form-row cols2">
          <div className="form-group">
            <label className="form-label">Target Topic or URL</label>
            <input 
              className="form-input" 
              placeholder="e.g. 'Best CRM for small business' or 'https://mywebsite.com'"
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Competitors (optional)</label>
            <input 
              className="form-input" 
              placeholder="e.g. hubspot.com, salesforce.com"
              value={competitors}
              onChange={e => setCompetitors(e.target.value)}
            />
          </div>
        </div>

        <button className="btn-generate" onClick={handleGenerate} disabled={loading}>
          {loading ? <><Loader2 className="animate-spin" /> Analyzing...</> : <><Search /> Generate SEO Strategy</>}
        </button>

        {loading && (
          <div className="output-box">
             <div className="loading-shimmer" style={{ width: '90%' }}></div>
             <div className="loading-shimmer" style={{ width: '70%' }}></div>
          </div>
        )}

        {result && !loading && (
          <motion.div 
            className="output-box"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="output-header">
              <span className="output-label">✓ SEO Analysis Complete</span>
              <div className="output-actions">
                <button className="btn-copy" onClick={handleDownload}><Download size={14} /> Download</button>
                <button className="btn-copy" onClick={handleCopy}><Copy size={14} /> Copy</button>
              </div>
            </div>
            <div className="output-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown></div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SEOOptimizer;
