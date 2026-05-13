import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { Copy, Zap, Loader2, Video as VideoIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const VideoPrompt = () => {
  const { activeModel, apiKey, providerKeys, customModels, showToast } = useContext(AppContext);
  
  const [desc, setDesc] = useState('');
  const [tool, setTool] = useState('Sora');
  const [duration, setDuration] = useState('5 seconds');
  const [style, setStyle] = useState('Cinematic');
  const [camera, setCamera] = useState('Slow camera push-in');
  const [mood, setMood] = useState('Dramatic / moody');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleGenerate = async () => {
    if (!desc.trim()) { showToast('Describe what you want to create', 'warn'); return; }
    setLoading(true);
    setResult('');

    const system = 'You are an expert AI video prompt engineer and cinematographer. You understand how to describe motion, camera movement, timing, and atmosphere in precise cinematic language that video AI models understand perfectly.';
    
    const userPrompt = `Create a detailed, optimized video generation prompt for ${tool}.

Scene: ${desc}
Duration: ${duration}
Visual style: ${style}
Camera motion: ${camera}
Mood: ${mood}

Provide:
1. The main video prompt (optimized for ${tool})
2. Technical specifications (camera, motion, lighting)
3. Audio/Sound notes (if applicable)
4. Any specific settings for ${tool}

The prompt should describe motion, timing, transitions, and atmosphere with cinematic precision.`;

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

  return (
    <div className="page active">
      <div className="section-header">
        <h2 className="section-title">🎬 Video Prompt Generator</h2>
        <div className="section-sub">Create perfect prompts for Sora, Kling, Runway, Pika, Luma, and other AI video generators.</div>
      </div>
      
      <div className="tool-card">
        <div className="form-group">
          <label className="form-label">What do you want to create?</label>
          <textarea 
            className="form-textarea" 
            rows="3" 
            placeholder="e.g. A slow-motion shot of a samurai drawing his katana in a bamboo forest at sunrise..."
            value={desc}
            onChange={e => setDesc(e.target.value)}
          ></textarea>
        </div>
        
        <div className="form-row cols3">
          <div className="form-group">
            <label className="form-label">Target Tool</label>
            <select className="form-select" value={tool} onChange={e => setTool(e.target.value)}>
              <option>Sora</option>
              <option>Kling</option>
              <option>Runway Gen-3</option>
              <option>Pika</option>
              <option>Luma Dream Machine</option>
              <option>Stable Video</option>
              <option>HeyGen</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Duration</label>
            <select className="form-select" value={duration} onChange={e => setDuration(e.target.value)}>
              <option>5 seconds</option>
              <option>10 seconds</option>
              <option>15 seconds</option>
              <option>30 seconds</option>
              <option>60 seconds</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Visual Style</label>
            <select className="form-select" value={style} onChange={e => setStyle(e.target.value)}>
              <option>Cinematic</option>
              <option>Documentary</option>
              <option>Commercial / Ad</option>
              <option>Anime</option>
              <option>Hyperrealistic</option>
              <option>Abstract</option>
              <option>Found footage</option>
            </select>
          </div>
        </div>
        
        <div className="form-row cols2">
          <div className="form-group">
            <label className="form-label">Camera Motion</label>
            <select className="form-select" value={camera} onChange={e => setCamera(e.target.value)}>
              <option>Slow camera push-in</option>
              <option>Drone aerial shot</option>
              <option>Handheld / shaky</option>
              <option>Static / locked</option>
              <option>360° orbit</option>
              <option>Tracking shot</option>
              <option>Extreme close-up</option>
              <option>Wide establishing shot</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Mood / Atmosphere</label>
            <select className="form-select" value={mood} onChange={e => setMood(e.target.value)}>
              <option>Dramatic / moody</option>
              <option>Epic / grand</option>
              <option>Peaceful / calm</option>
              <option>Tense / thriller</option>
              <option>Joyful / upbeat</option>
              <option>Dark / horror</option>
              <option>Romantic</option>
            </select>
          </div>
        </div>

        <button className="btn-generate" onClick={handleGenerate} disabled={loading}>
          {loading ? <><Loader2 className="animate-spin" /> Crafting...</> : <><VideoIcon /> Generate Video Prompt</>}
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
              <span className="output-label">✓ Video Prompt Ready</span>
              <div className="output-actions">
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

export default VideoPrompt;
