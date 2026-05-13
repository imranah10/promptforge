import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { Copy, Zap, Loader2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { downloadText } from '../utils/helpers';

const AIWriter = () => {
  const { activeModel, apiKey, providerKeys, customModels, showToast, saveToVault } = useContext(AppContext);
  
  const [type, setType] = useState('Blog post / Article');
  const [tone, setTone] = useState('Professional');
  const [lang, setLang] = useState('English');
  const [topic, setTopic] = useState('');
  const [length, setLength] = useState(50); // 0-100 scale
  const [audience, setAudience] = useState('');
  const [keywords, setKeywords] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  // Determine which fields to show based on Content Type
  const hideTone = ['SEO meta tags', 'Tagline / Slogan', 'Code documentation'].includes(type);
  const hideKeywords = ['Professional bio', 'Cover letter', 'Customer support reply', 'Cold email', 'Tagline / Slogan'].includes(type);
  const hideAudience = ['SEO meta tags', 'Customer support reply', 'Cold email', 'Tagline / Slogan', 'Professional bio'].includes(type);

  const lengthLabels = {
    0: 'Very Short',
    33: 'Short',
    66: 'Medium',
    100: 'Long'
  };

  const getLengthText = (val) => {
    if (val < 25) return 'Very Short (~100 words)';
    if (val < 50) return 'Short (~250 words)';
    if (val < 75) return 'Medium (~500 words)';
    return 'Long (~1000+ words)';
  };

  const handleGenerate = async () => {
    if (!topic.trim()) { showToast('Please describe your topic', 'warn'); return; }
    
    setLoading(true);
    setResult('');

    const system = `You are an elite copywriter and content strategist. You produce exceptionally high-quality ${type} content that people actually want to read, share, and act on. You never use filler phrases, generic AI-speak, or clichés. Every word earns its place. Write in ${lang}.`;
    
    let userPrompt = `Write a ${type} about: ${topic}\n\n`;
    if (!hideTone) userPrompt += `Tone: ${tone}\n`;
    userPrompt += `Length: ${getLengthText(length)}\n`;
    if (audience) userPrompt += `Target audience: ${audience}\n`;
    if (keywords && !hideKeywords) userPrompt += `Include these keywords naturally: ${keywords}\n`;
    
    userPrompt += `\nMake this genuinely outstanding. Write something that would make a professional copywriter proud. No fluff, no filler, no generic phrases. Deliver maximum value from the very first word.`;

    try {
      const res = await callAI(system, userPrompt, null, activeModel, apiKey, providerKeys, customModels);
      setResult(res);
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
    downloadText(result, `PromptForge_${type.replace(/\s+/g, '_')}.txt`);
    showToast('✓ Download started');
  };

  return (
    <div className="page active">
      <div className="section-header">
        <h2 className="section-title">✍️ AI Writer</h2>
        <div className="section-sub">Generate any content in any language — blogs, emails, ads, scripts, proposals and more.</div>
      </div>
      
      <div className="tool-card">
        <div className="form-row cols3">
          <div className="form-group">
            <label className="form-label">Content Type</label>
            <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
              <option>Blog post / Article</option>
              <option>Cold email</option>
              <option>Ad copy (Facebook/Google)</option>
              <option>Social media post</option>
              <option>Instagram caption</option>
              <option>LinkedIn post</option>
              <option>Twitter/X thread</option>
              <option>YouTube script</option>
              <option>TikTok script</option>
              <option>Product description</option>
              <option>Sales page / Landing page</option>
              <option>Professional bio</option>
              <option>Cover letter</option>
              <option>Press release</option>
              <option>Newsletter</option>
              <option>SEO meta tags</option>
              <option>Tagline / Slogan</option>
              <option>Proposal / Pitch deck</option>
              <option>Customer support reply</option>
              <option>Business plan section</option>
            </select>
          </div>
          
          {!hideTone && (
            <div className="form-group">
              <label className="form-label">Tone</label>
              <select className="form-select" value={tone} onChange={e => setTone(e.target.value)}>
                <option>Professional</option>
                <option>Conversational & friendly</option>
                <option>Persuasive</option>
                <option>Authoritative</option>
                <option>Humorous & witty</option>
                <option>Inspirational</option>
                <option>Empathetic</option>
                <option>Formal</option>
                <option>Casual / Gen-Z</option>
                <option>Luxury / Premium</option>
              </select>
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">Output Language</label>
            <select className="form-select" value={lang} onChange={e => setLang(e.target.value)}>
              <option>English</option><option>Hindi</option><option>Spanish</option><option>French</option><option>Arabic</option><option>Portuguese</option><option>Russian</option><option>German</option><option>Japanese</option><option>Chinese (Simplified)</option><option>Korean</option><option>Italian</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Describe your topic, product, or goal</label>
          <textarea 
            className="form-textarea" 
            rows="4" 
            placeholder="e.g. I run a SaaS tool for project management. Write a LinkedIn post announcing our new AI feature..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
          ></textarea>
        </div>

        <div className="form-row cols3">
          <div className="form-group">
            <label className="form-label">Length: <span style={{color: 'var(--accent2)'}}>{getLengthText(length)}</span></label>
            <input 
              type="range" 
              min="0" max="100" 
              value={length} 
              onChange={e => setLength(e.target.value)}
            />
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'10px', color:'var(--text3)', marginTop:'4px'}}>
              <span>Very Short</span>
              <span>Long</span>
            </div>
          </div>
          
          {!hideAudience && (
            <div className="form-group">
              <label className="form-label">Target Audience (optional)</label>
              <input 
                className="form-input" 
                placeholder="e.g. startup founders, small biz owners..."
                value={audience}
                onChange={e => setAudience(e.target.value)}
              />
            </div>
          )}
          
          {!hideKeywords && (
            <div className="form-group">
              <label className="form-label">Keywords to Include (optional)</label>
              <input 
                className="form-input" 
                placeholder="e.g. AI, productivity, remote work..."
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
              />
            </div>
          )}
        </div>

        <button className="btn-generate" onClick={handleGenerate} disabled={loading}>
          {loading ? <><Loader2 className="animate-spin" /> Generating...</> : <><Zap /> Generate Content</>}
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
              <span className="output-label">✓ Generated Content</span>
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

export default AIWriter;
