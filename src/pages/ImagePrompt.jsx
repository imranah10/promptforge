import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI, generateImage } from '../utils/ai';
import { Copy, Zap, Loader2, Image as ImageIcon, Download, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ImagePrompt = () => {
  const { activeModel, apiKey, providerKeys, customModels, showToast } = useContext(AppContext);
  
  const [desc, setDesc] = useState('');
  const [tool, setTool] = useState('Midjourney');
  const [style, setStyle] = useState('Photorealistic');
  const [mood, setMood] = useState('Golden hour / warm');
  const [aspectRatio, setAspectRatio] = useState('1024x1024');
  
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleGenerate = async () => {
    if (!desc.trim()) { showToast('Describe what you want to create', 'warn'); return; }
    setLoading(true);
    setResult('');
    setImageUrl('');

    const toolGuides = {
      'Midjourney': 'Use :: weighting, --ar aspect ratio, --v 6.1, --style raw for realism, --q 2 for quality',
      'DALL-E 3': 'Descriptive natural language works best. Be very specific about style and composition.',
      'Stable Diffusion': 'Use parentheses for emphasis (important:1.3), include negative prompts',
      'Adobe Firefly': 'Focus on descriptive adjectives and clear subject matter',
      'Ideogram': 'Excellent for text in images, be explicit about text content',
      'Leonardo AI': 'Good with cinematic quality, specify camera lens and f-stop'
    };

    const system = 'You are an expert AI image prompt engineer. You create prompts that consistently produce stunning, professional-quality images. You understand lighting, composition, color theory, and artistic styles deeply.';
    
    const userPrompt = `Create a highly detailed, optimized image generation prompt for ${tool}.

User wants: ${desc}
Art style: ${style}
Mood/Lighting: ${mood}

Tool-specific guidance: ${toolGuides[tool] || 'Be descriptive and specific'}

Provide:
1. The main prompt (MUST be wrapped inside a markdown code block like \`\`\`prompt ... \`\`\`)
2. Negative prompt (what to avoid)
3. Recommended settings

Make the prompt so detailed that it generates an absolutely stunning result on the first try.`;

    try {
      const res = await callAI(system, userPrompt, null, activeModel, apiKey, providerKeys, customModels);
      setResult(res);
    } catch (e) {
      setResult('❌ Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVisual = async () => {
    // Extract prompt from code block or use whole result
    let promptToUse = '';
    const match = result.match(/```[a-zA-Z]*\n?([\s\S]*?)```/);
    if (match && match[1]) {
      promptToUse = match[1].trim();
    } else {
      promptToUse = result;
    }

    if (!promptToUse) {
      showToast('Generate a prompt first!', 'warn');
      return;
    }

    setIsGenerating(true);
    try {
      const url = await generateImage(promptToUse, providerKeys, aspectRatio, tool);
      setImageUrl(url);
      showToast('Image generated successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    const match = result.match(/```[a-zA-Z]*\n?([\s\S]*?)```/);
    if (match && match[1]) {
      navigator.clipboard.writeText(match[1].trim());
      showToast('✓ Only Image Prompt copied!');
    } else {
      navigator.clipboard.writeText(result);
      showToast('✓ Copied to clipboard');
    }
  };

  const downloadImage = async () => {
    if (!imageUrl) return;
    try {
      showToast('Downloading image...', 'info');
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `PromptForge_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback: Open in new tab if blob fetch fails
      window.open(imageUrl, '_blank');
      showToast('Download failed. Image opened in new tab.', 'warn');
    }
  };

  return (
    <div className="page active">
      <div className="section-header">
        <h2 className="section-title">🖼️ Image Studio Pro</h2>
        <div className="section-sub">Engineer perfect prompts and generate high-fidelity visuals instantly using DALL-E 3 & Flux.</div>
      </div>
      
      <div className="tool-card">
        <div className="form-group">
          <label className="form-label">What do you want to create?</label>
          <textarea 
            className="form-textarea" 
            rows="3" 
            placeholder="e.g. A futuristic city at sunset with flying cars and neon lights, cyberpunk style..."
            value={desc}
            onChange={e => setDesc(e.target.value)}
          ></textarea>
        </div>
        
        <div className="form-row cols2">
          <div className="form-group">
            <label className="form-label">Target Tool</label>
            <select className="form-select" value={tool} onChange={e => setTool(e.target.value)}>
              <optgroup label="✨ Premium Engines (API Key Required)">
                <option>Nano Banana Pro</option>
                <option>Nano Banana 2</option>
                <option>Nano Banana Elite</option>
                <option>Midjourney</option>
                <option>DALL-E 3</option>
                <option>Ideogram</option>
                <option>Leonardo AI</option>
                <option>Stable Diffusion</option>
              </optgroup>
              <optgroup label="🟢 Basic Engines (Free / No Key)">
                <option>Nano Banana Basic</option>
                <option>Flux Basic</option>
                <option>Standard (Free)</option>
              </optgroup>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Art Style</label>
            <select className="form-select" value={style} onChange={e => setStyle(e.target.value)}>
              <option>Photorealistic</option>
              <option>Cinematic / Film</option>
              <option>Digital art</option>
              <option>Oil painting</option>
              <option>Watercolor</option>
              <option>Anime / Manga</option>
              <option>3D render</option>
              <option>Neon / Cyberpunk</option>
              <option>Concept art</option>
            </select>
          </div>
        </div>

        <div className="form-row cols2">
          <div className="form-group">
            <label className="form-label">Mood / Lighting</label>
            <select className="form-select" value={mood} onChange={e => setMood(e.target.value)}>
              <option>Golden hour / warm</option>
              <option>Dramatic / moody</option>
              <option>Bright & vibrant</option>
              <option>Dark & mysterious</option>
              <option>Neon glow</option>
              <option>Natural / soft light</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Dimensions & Aspect Ratio</label>
            <select className="form-select" value={aspectRatio} onChange={e => setAspectRatio(e.target.value)}>
              <option value="1024x1024">Square (1:1) - Post</option>
              <option value="1792x1024">Landscape (16:9) - YouTube/HD</option>
              <option value="1024x1792">Portrait (9:16) - Reels/TikTok</option>
              <option value="1792x768">Ultrawide (21:9) - Cinematic</option>
              <option value="1216x832">Classic (3:2) - Photography</option>
              <option value="1024x1280">Vertical (4:5) - IG Portrait</option>
            </select>
          </div>
        </div>

        <div className="engine-guide-card" style={{ marginTop: '20px', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px border rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={14} /> Engine Selection Guide
            </h4>
            <button className="btn-copy" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => window.location.hash = '#api-keys'}>
              Setup API Keys
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12px', color: 'var(--text2)' }}>
            <div style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>🟢 Free Forever</strong>
              No API Key needed. Unlimited usage. Best for experiments and social media.
            </div>
            <div style={{ padding: '8px', background: 'rgba(var(--accent-rgb), 0.1)', borderRadius: '8px' }}>
              <strong style={{ color: 'var(--accent)', display: 'block', marginBottom: '4px' }}>⭐ Pro (Together/OpenAI)</strong>
              Requires your own API Key. Ultra-realistic Flux & DALL-E 3 models. Commercial quality.
            </div>
          </div>
        </div>

        <button className="btn-generate" style={{ marginTop: '20px' }} onClick={handleGenerate} disabled={loading}>
          {loading ? <><Loader2 className="animate-spin" /> Engineering...</> : <><Zap /> Engineer Expert Prompt</>}
        </button>

        <AnimatePresence>
          {(result || loading) && (
            <motion.div 
              className="output-box"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="output-header">
                <span className="output-label">{loading ? 'Working...' : '✓ Prompt Engineered'}</span>
                {!loading && (
                  <div className="output-actions" style={{ gap: '10px' }}>
                    <button className="btn-copy" onClick={handleCopy}><Copy size={14} /> Copy Prompt</button>
                    <button 
                      className="btn-copy" 
                      style={{ background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }} 
                      onClick={handleGenerateVisual}
                      disabled={isGenerating}
                    >
                      {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} 
                      Visualize Now
                    </button>
                  </div>
                )}
              </div>
              
              {loading ? (
                <div style={{ padding: '20px 0' }}>
                  <div className="loading-shimmer" style={{ width: '95%' }}></div>
                  <div className="loading-shimmer" style={{ width: '75%' }}></div>
                </div>
              ) : (
                <div className="output-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                </div>
              )}
            </motion.div>
          )}

          {(imageUrl || isGenerating) && (
            <motion.div 
              className="image-result-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ marginTop: '24px', textAlign: 'center' }}
            >
              <div className="glass-card" style={{ padding: '12px', position: 'relative', overflow: 'hidden' }}>
                {isGenerating ? (
                  <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyCenter: 'center', gap: '20px', background: 'rgba(0,0,0,0.3)' }}>
                    <Loader2 size={48} className="animate-spin text-accent" />
                    <p style={{ color: 'var(--text2)' }}>Creating your masterpiece with DALL-E 3...</p>
                  </div>
                ) : (
                  <>
                    <img 
                      key={imageUrl}
                      src={imageUrl} 
                      alt="Generated" 
                      style={{ width: '100%', borderRadius: '8px', maxHeight: '600px', objectFit: 'contain', display: isGenerating ? 'none' : 'block' }} 
                      referrerPolicy="no-referrer"
                      onLoad={() => setIsGenerating(false)}
                      onError={() => {
                        // Keep the URL but allow manual opening
                        setIsGenerating(false);
                      }}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', marginTop: '16px', padding: '8px' }}>
                      <button className="btn btn-lg btn-primary" onClick={downloadImage}>
                        <Download size={18} /> Download High-Res
                      </button>
                      <button className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={() => window.open(imageUrl, '_blank')}>
                        <ImageIcon size={18} /> View Direct Link
                      </button>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '10px' }}>
                      Note: Free engine can be unstable. For 100% reliability and 4K quality, use <strong>Pro Tools</strong> with a Together AI key.
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ImagePrompt;
