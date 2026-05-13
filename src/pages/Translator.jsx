import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { Copy, Zap, Loader2, Globe, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { downloadText } from '../utils/helpers';

const Translator = () => {
  const { activeModel, apiKey, providerKeys, customModels, showToast } = useContext(AppContext);
  
  const [text, setText] = useState('');
  const [from, setFrom] = useState('Auto-detect');
  const [to, setTo] = useState('English');
  const [style, setStyle] = useState('Natural & fluent');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const languages = [
    'Auto-detect', 'English', 'Hindi', 'Spanish', 'French', 'Arabic', 'Portuguese', 'Russian', 'German', 'Japanese', 
    'Chinese (Simplified)', 'Chinese (Traditional)', 'Korean', 'Italian', 'Dutch', 'Turkish', 'Bengali', 'Urdu', 
    'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Punjabi', 'Kannada', 'Malayalam', 'Polish', 'Swedish', 'Norwegian', 
    'Danish', 'Finnish', 'Greek', 'Hebrew', 'Thai', 'Vietnamese', 'Indonesian', 'Malay', 'Filipino/Tagalog', 
    'Swahili', 'Yoruba', 'Hausa', 'Amharic', 'Afrikaans', 'Nepali', 'Sinhala', 'Burmese', 'Khmer', 'Lao', 
    'Persian/Farsi', 'Pashto', 'Kurdish', 'Azerbaijani', 'Uzbek', 'Kazakh'
  ];

  const handleGenerate = async () => {
    if (!text.trim()) { showToast('Enter text to translate', 'warn'); return; }
    setLoading(true);
    setResult('');

    const system = `You are an expert linguist and professional translator. You produce translations that are indistinguishable from native writing — never robotic, never literal to a fault. You preserve tone, cultural nuance, idioms, and intent.`;
    const userPrompt = `Translate the following text ${from !== 'Auto-detect' ? 'from ' + from : ''} to ${to}.\nTranslation style: ${style}\n\nText to translate:\n${text}\n\nProvide only the translation — no explanations, no notes, no prefixes. Just the translated text.`;

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
    downloadText(result, `PromptForge_Translation_${to}.txt`);
    showToast('✓ Download started');
  };

  return (
    <div className="page active">
      <div className="section-header">
        <h2 className="section-title">🌐 AI Translator</h2>
        <div className="section-sub">Translate any text naturally — not robotic machine translation. Preserves tone, context, and cultural nuance.</div>
      </div>
      
      <div className="tool-card">
        <div className="form-group">
          <label className="form-label">Text to Translate</label>
          <textarea 
            className="form-textarea" 
            rows="5" 
            placeholder="Paste any text here — articles, emails, captions, documents, conversations..."
            value={text}
            onChange={e => setText(e.target.value)}
          ></textarea>
        </div>
        
        <div className="form-row cols3">
          <div className="form-group">
            <label className="form-label">From Language</label>
            <select className="form-select" value={from} onChange={e => setFrom(e.target.value)}>
              {languages.map(l => <option key={`f-${l}`}>{l}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">To Language</label>
            <select className="form-select" value={to} onChange={e => setTo(e.target.value)}>
              {languages.filter(l => l !== 'Auto-detect').map(l => <option key={`t-${l}`}>{l}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Translation Style</label>
            <select className="form-select" value={style} onChange={e => setStyle(e.target.value)}>
              <option>Natural & fluent</option>
              <option>Formal / professional</option>
              <option>Casual / conversational</option>
              <option>Literal (word-for-word)</option>
              <option>Simplified (easy to understand)</option>
              <option>Preserve original tone exactly</option>
            </select>
          </div>
        </div>

        <button className="btn-generate" onClick={handleGenerate} disabled={loading}>
          {loading ? <><Loader2 className="animate-spin" /> Translating...</> : <><Globe /> Translate</>}
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
              <span className="output-label">✓ Translation</span>
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

export default Translator;
