import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { Copy, Zap, Loader2, Wand2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { downloadText } from '../utils/helpers';

const PromptOptimizer = () => {
  const { activeModel, apiKey, providerKeys, customModels, showToast, saveToVault } = useContext(AppContext);
  
  const [basicPrompt, setBasicPrompt] = useState('');
  const [framework, setFramework] = useState('CREATE (Context, Request, Explanation, Action, Tone, Extras)');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleGenerate = async () => {
    if (!basicPrompt.trim()) { showToast('Please enter your basic prompt', 'warn'); return; }
    setLoading(true);
    setResult('');

    const system = `You are a world-class Prompt Engineer. Your job is to take basic, poorly-written user prompts and upgrade them into highly detailed, professional, mega-prompts that yield exceptional results from AI models. Do NOT answer the prompt. Only output the upgraded, enhanced prompt itself.`;
    
    let userPrompt = `I have a basic prompt: "${basicPrompt}"\n\n`;
    userPrompt += `Please rewrite and enhance this using the ${framework} framework. \n`;
    userPrompt += `Make the new prompt extremely detailed, specifying the exact persona, tone, formatting constraints, target audience, and output structure. The output should be ready to copy and paste into an AI. Only output the final enhanced prompt.`;

    try {
      const res = await callAI(system, userPrompt, null, activeModel, apiKey, providerKeys, customModels);
      setResult(res);
      saveToVault('Prompt Optimizer', `Framework: ${framework}\nOriginal: ${basicPrompt}`, res);
    } catch (e) {
      setResult('❌ Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    showToast('✓ Enhanced Prompt Copied!');
  };

  const handleDownload = () => {
    downloadText(result, 'PromptForge_Enhanced_Prompt.txt');
    showToast('✓ Download started');
  };

  return (
    <div className="page active">
      <div className="section-header">
        <h2 className="section-title">🪄 Prompt Optimizer</h2>
        <div className="section-sub">Turn weak, 1-line prompts into professional, expert-level Mega-Prompts.</div>
      </div>
      
      <div className="tool-card">
        <div className="form-group">
          <label className="form-label">Your Basic Prompt</label>
          <textarea 
            className="form-textarea" 
            rows="3" 
            placeholder="e.g. Write a story about a dog in space..."
            value={basicPrompt}
            onChange={e => setBasicPrompt(e.target.value)}
          ></textarea>
        </div>

        <div className="form-group">
          <label className="form-label">Prompt Engineering Framework</label>
          <select className="form-select" value={framework} onChange={e => setFramework(e.target.value)}>
            <option>CREATE (Context, Request, Explanation, Action, Tone, Extras)</option>
            <option>R-T-F (Role, Task, Format)</option>
            <option>Chain of Thought (Step-by-step reasoning)</option>
            <option>Few-Shot (Ask AI to include examples)</option>
            <option>System Prompt (For setting up a Custom GPT/Bot)</option>
          </select>
        </div>

        <button className="btn-generate" onClick={handleGenerate} disabled={loading}>
          {loading ? <><Loader2 className="animate-spin" /> Enhancing Prompt...</> : <><Wand2 /> Enhance Prompt</>}
        </button>

        {loading && (
          <div className="output-box">
             <div className="loading-shimmer" style={{ width: '90%' }}></div>
             <div className="loading-shimmer" style={{ width: '70%' }}></div>
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
              <span className="output-label">✓ Expert-Level Mega Prompt</span>
              <div className="output-actions">
                <button className="btn-copy" onClick={handleDownload}><Download size={14} /> Download</button>
                <button className="btn-copy" onClick={handleCopy}><Copy size={14} /> Copy Prompt</button>
              </div>
            </div>
            <div className="output-content" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}><ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown></div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PromptOptimizer;
