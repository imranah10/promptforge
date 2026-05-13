import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { Copy, Zap, Loader2, Camera, PlayCircle, Hash, Briefcase, Users, MessageSquare, Music2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { downloadText } from '../utils/helpers';

const CreatorStudio = () => {
  const { activeModel, apiKey, providerKeys, customModels, showToast, saveToVault } = useContext(AppContext);
  
  const [platform, setPlatform] = useState('instagram');
  const [goal, setGoal] = useState('Viral / high engagement');
  const [format, setFormat] = useState('Caption + hashtags');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Engaging & conversational');
  const [lang, setLang] = useState('English');
  const [hashtags, setHashtags] = useState('Yes — maximum reach');
  const [duration, setDuration] = useState('Under 60 seconds');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const platforms = [
    { id: 'instagram', icon: Camera, label: 'Instagram' },
    { id: 'youtube', icon: PlayCircle, label: 'YouTube' },
    { id: 'tiktok', icon: Music2, label: 'TikTok' },
    { id: 'twitter', icon: Hash, label: 'Twitter/X' },
    { id: 'linkedin', icon: Briefcase, label: 'LinkedIn' },
    { id: 'facebook', icon: Users, label: 'Facebook' },
    { id: 'whatsapp', icon: MessageSquare, label: 'WhatsApp' }
  ];

  // Dynamic field logic based on platform
  const hideHashtags = ['whatsapp'].includes(platform);
  const showDuration = ['youtube', 'tiktok'].includes(platform);
  const hideTone = ['whatsapp'].includes(platform);

  const getGoals = () => {
    if (platform === 'whatsapp') {
      return [
        'Direct promotion / Sales',
        'Community / Group update',
        'Event invitation / Reminder',
        'Personal check-in / Nurturing',
        'Customer Support / FAQ'
      ];
    }
    return [
      'Viral / high engagement',
      'Brand awareness',
      'Lead generation',
      'Product promotion',
      'Educational / how-to',
      'Storytelling',
      'Trending topic'
    ];
  };

  const getFormats = () => {
    if (platform === 'whatsapp') {
      return [
        'Short broadcast message',
        'Status update (Text)',
        'DM / 1-on-1 message template',
        'Group announcement'
      ];
    }
    return [
      'Caption + hashtags',
      'Full script (video)',
      'Hook + body + CTA',
      'Thread / carousel (multi-post)',
      'Reel script',
      'Story sequence',
      'Bio / About section',
      'DM / message template'
    ];
  };

  const handlePlatformChange = (newPlatform) => {
    setPlatform(newPlatform);
    setResult('');
    
    if (newPlatform === 'whatsapp' && platform !== 'whatsapp') {
      setGoal('Direct promotion / Sales');
      setFormat('Short broadcast message');
    } else if (newPlatform !== 'whatsapp' && platform === 'whatsapp') {
      setGoal('Viral / high engagement');
      setFormat('Caption + hashtags');
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) { showToast('Please describe your topic', 'warn'); return; }
    setLoading(true);
    setResult('');

    const platformGuides = {
      instagram: 'Instagram: Focus on visual storytelling, emotion, aspirational content. Use line breaks for readability. Emoji are powerful. Optimal post length: 150-300 characters caption + hashtags.',
      youtube: 'YouTube: Hook in first 3 words, deliver on promise, include chapter timestamps for scripts. For descriptions: front-load keywords.',
      tiktok: 'TikTok: Pattern interrupt opening, fast pace, Gen-Z friendly, trending sounds reference. Scripts should be punchy.',
      twitter: 'Twitter/X: Punchy, controversial, quotable. Threads: 8-15 tweets, each standalone. Hook tweet must stop the scroll.',
      linkedin: 'LinkedIn: Professional but personal. Single sentence opening line. Storytelling beats statistics. End with thought-provoking question.',
      facebook: 'Facebook: Conversational, community-focused. Longer posts allowed. Personal stories perform best. Ask questions to boost comments.',
      whatsapp: 'WhatsApp: Personal, direct, conversational. Groups need value-dense, concise messages.'
    };

    const system = `You are a world-class social media strategist and viral content creator with 10+ years of experience. You know exactly what makes content go viral on each platform. You understand psychology, copywriting, and platform algorithms deeply. Write in ${lang}.`;
    
    let userPrompt = `Create ${format} for ${platform.toUpperCase()} about: ${topic}\n\n`;
    userPrompt += `Platform guidelines: ${platformGuides[platform] || platform}\n`;
    userPrompt += `Goal: ${goal}\n`;
    if (!hideTone) userPrompt += `Tone/Style: ${tone}\n`;
    if (!hideHashtags) userPrompt += `Hashtags: ${hashtags}\n`;
    if (showDuration) userPrompt += `Target Duration: ${duration}\n`;

    userPrompt += `\nThis content should:
1. Stop the scroll immediately with a killer hook
2. Deliver genuine value or emotion
3. Drive the goal (engagement/leads/sales)
4. Feel authentic, not AI-generated
5. Be perfectly formatted for ${platform}

Make it so good that content creators would screenshot it and show others.`;

    try {
      const res = await callAI(system, userPrompt, null, activeModel, apiKey, providerKeys, customModels);
      setResult(res);
      saveToVault('Creator Studio', `Platform: ${platform}\nGoal: ${goal}\nFormat: ${format}\nTopic: ${topic}`, res);
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
    downloadText(result, `PromptForge_${platform}_Content.txt`);
    showToast('✓ Download started');
  };

  return (
    <div className="page active">
      <div className="section-header">
        <h2 className="section-title">🎨 Creator Studio</h2>
        <div className="section-sub">One studio for all your social media platforms — optimized content that actually performs.</div>
      </div>
      
      <div className="tool-card">
        <div className="form-label" style={{ marginBottom: '12px' }}>SELECT PLATFORM</div>
        <div className="platform-grid">
          {platforms.map(p => (
            <div 
              key={p.id} 
              className={`platform-btn ${platform === p.id ? 'active' : ''}`}
              onClick={() => handlePlatformChange(p.id)}
            >
              <p.icon size={24} className="platform-icon" />
              {p.label}
            </div>
          ))}
        </div>

        <div className="form-row cols2">
          <div className="form-group">
            <label className="form-label">Content Goal</label>
            <select className="form-select" value={goal} onChange={e => setGoal(e.target.value)}>
              {getGoals().map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Content Format</label>
            <select className="form-select" value={format} onChange={e => setFormat(e.target.value)}>
              {getFormats().map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Your Topic / Niche / Product</label>
          <textarea 
            className="form-textarea" 
            rows="3" 
            placeholder="e.g. I'm a fitness coach. I want to promote my 30-day weight loss program targeting working moms aged 25-40..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
          ></textarea>
        </div>

        <div className="form-row cols3">
          {!hideTone && (
            <div className="form-group">
              <label className="form-label">Tone / Style</label>
              <select className="form-select" value={tone} onChange={e => setTone(e.target.value)}>
                <option>Engaging & conversational</option>
                <option>Professional</option>
                <option>Funny & relatable</option>
                <option>Bold & provocative</option>
                <option>Inspirational</option>
                <option>Educational</option>
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Language</label>
            <select className="form-select" value={lang} onChange={e => setLang(e.target.value)}>
              <option>English</option><option>Hindi</option><option>Hinglish</option><option>Spanish</option>
            </select>
          </div>
          {!hideHashtags && (
            <div className="form-group">
              <label className="form-label">Include Hashtags?</label>
              <select className="form-select" value={hashtags} onChange={e => setHashtags(e.target.value)}>
                <option>Yes — maximum reach</option>
                <option>Yes — 5-10 targeted only</option>
                <option>No hashtags</option>
              </select>
            </div>
          )}
          {showDuration && (
             <div className="form-group">
             <label className="form-label">Video Duration</label>
             <select className="form-select" value={duration} onChange={e => setDuration(e.target.value)}>
               <option>Under 15 seconds (Shorts/Reels)</option>
               <option>Under 60 seconds</option>
               <option>1 - 3 minutes</option>
               <option>3 - 10 minutes (Long form)</option>
             </select>
           </div>
          )}
        </div>

        <button className="btn-generate" onClick={handleGenerate} disabled={loading}>
          {loading ? <><Loader2 className="animate-spin" /> Creating...</> : <><Zap /> Generate Creator Content</>}
        </button>

        {loading && (
          <div className="output-box">
             <div className="loading-shimmer" style={{ width: '90%' }}></div>
             <div className="loading-shimmer" style={{ width: '70%' }}></div>
             <div className="loading-shimmer" style={{ width: '85%' }}></div>
          </div>
        )}

        {result && !loading && (
          <motion.div 
            className="output-box"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="output-header">
              <span className="output-label">✓ {platform.charAt(0).toUpperCase() + platform.slice(1)} Content Ready</span>
              <div className="output-actions">
                <button className="btn-copy" onClick={handleDownload}><Download size={14} /> Download</button>
                <button className="btn-copy" onClick={handleCopy}><Copy size={14} /> Copy</button>
              </div>
            </div>
            <div className="output-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown></div>
          </motion.div>
        )}
      </div>

      <style jsx>{`
        .platform-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; margin-bottom: 24px; }
        .platform-btn {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          padding: 16px 8px; border-radius: 12px; cursor: pointer;
          border: 1.5px solid var(--border); background: var(--bg2);
          transition: all 0.25s; color: var(--text2); font-size: 12px; font-weight: 600;
          text-align: center; user-select: none;
        }
        .platform-btn:hover { border-color: var(--accent); color: var(--text); background: rgba(124,92,252,0.08); transform: translateY(-2px); }
        .platform-btn.active { border-color: var(--accent); background: rgba(124,92,252,0.15); color: var(--accent2); box-shadow: 0 4px 16px rgba(124,92,252,0.2); }
        .platform-icon { margin-bottom: 4px; }
      `}</style>
    </div>
  );
};

export default CreatorStudio;
