import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI, generateImage } from '../utils/ai';
import { Copy, Zap, Loader2, Image as ImageIcon, Download, Wand2, RefreshCw, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TOOL_GUIDES = {
  'Midjourney':        { tip: 'Use --ar for ratio, --v 6.1, --style raw, --q 2', syntax: 'Descriptive words separated by commas + params at end' },
  'DALL-E 3':          { tip: 'Natural language works best. Be very specific about style and composition.', syntax: 'Full sentences describing every visual detail' },
  'Stable Diffusion':  { tip: 'Use (important:1.3) for emphasis. Always add negative prompt.', syntax: 'Comma-separated keywords + negative prompt section' },
  'Adobe Firefly':     { tip: 'Focus on descriptive adjectives. Avoid celebrity names.', syntax: 'Descriptive natural language, style references' },
  'Ideogram':          { tip: 'Best for text-in-images. Be explicit about any text content.', syntax: 'Natural language + specify exact text in quotes' },
  'Leonardo AI':       { tip: 'Specify camera lens and f-stop for photorealism.', syntax: 'Subject + style + technical camera specs' },
  'Flux':              { tip: 'Very responsive to style adjectives. Clean natural language.', syntax: 'Natural language, detailed scene description' },
};

const STYLES = ['Photorealistic','Cinematic / Film','Digital art','Oil painting','Watercolor','Anime / Manga','3D render','Neon / Cyberpunk','Concept art','Sketch / Line art','Impressionist','Surrealist'];
const MOODS  = ['Golden hour / warm','Dramatic / moody','Bright & vibrant','Dark & mysterious','Neon glow','Natural / soft light','Foggy / ethereal','Studio lighting','Backlit / silhouette'];
const RATIOS = [
  { label: 'Square (1:1) — Post',           value: '1024x1024' },
  { label: 'Landscape (16:9) — YouTube/HD', value: '1792x1024' },
  { label: 'Portrait (9:16) — Reels/TikTok',value: '1024x1792' },
  { label: 'Ultrawide (21:9) — Cinematic',  value: '1792x768'  },
  { label: 'Classic (3:2) — Photography',   value: '1216x832'  },
  { label: 'Vertical (4:5) — IG Portrait',  value: '1024x1280' },
];

export default function ImagePrompt() {
  const { activeModel, apiKey, providerKeys, customModels, showToast } = useContext(AppContext);

  const [desc,         setDesc]         = useState('');
  const [tool,         setTool]         = useState('Midjourney');
  const [style,        setStyle]        = useState('Photorealistic');
  const [mood,         setMood]         = useState('Golden hour / warm');
  const [aspectRatio,  setAspectRatio]  = useState('1024x1024');
  const [loading,      setLoading]      = useState(false);
  const [generating,   setGenerating]   = useState(false);
  const [result,       setResult]       = useState('');
  const [imageUrl,     setImageUrl]     = useState('');
  const [copied,       setCopied]       = useState(false);
  const [variations,   setVariations]   = useState([]);
  const [activeVar,    setActiveVar]    = useState(0);

  const extractPrompt = (text) => {
    const m = text.match(/```[a-zA-Z]*\n?([\s\S]*?)```/);
    return m ? m[1].trim() : text.trim();
  };

  const handleGenerate = async () => {
    if (!desc.trim()) { showToast('Describe what you want to create', 'error'); return; }
    setLoading(true); setResult(''); setImageUrl(''); setVariations([]); setActiveVar(0);

    const guide = TOOL_GUIDES[tool] || { tip: 'Be descriptive and specific', syntax: 'Detailed description' };

    const system = `You are an EXPERT AI image prompt engineer with deep knowledge of ${tool}, lighting, composition, color theory, and artistic styles. You create prompts that generate stunning, professional-quality images on the first try.`;

    const userPrompt = `Create a highly detailed, optimized image prompt for ${tool}.

USER WANTS: ${desc}
ART STYLE: ${style}
MOOD / LIGHTING: ${mood}
ASPECT RATIO: ${aspectRatio}
TOOL SYNTAX: ${guide.syntax}
TIP: ${guide.tip}

PROVIDE (in this exact format):
1. **Main Prompt** — wrap it in a \`\`\`prompt code block. Make it extremely detailed: subject, composition, lighting, colors, camera angle, texture, atmosphere.
2. **Negative Prompt** — what to exclude (for SD/MJ) — use plain text
3. **Recommended Settings** — specific parameters for ${tool}
4. **Why This Works** — 1-2 sentences on key choices

Make it so detailed it generates a stunning result on the first attempt.`;

    try {
      const res = await callAI(system, userPrompt, null, activeModel, apiKey, providerKeys, customModels);
      setResult(res);
      setVariations([res]);
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVariation = async () => {
    if (!result) return;
    setLoading(true);
    const system = `You are an expert AI image prompt engineer. Create a VARIATION of the given prompt — same subject but with different angle, lighting, or style interpretation.`;
    const userPrompt = `Create a creative variation of this image prompt for ${tool}:\n${extractPrompt(result)}\n\nKeep the same subject but change: camera angle, color palette, or mood. Wrap the new prompt in a \`\`\`prompt code block.`;
    try {
      const res = await callAI(system, userPrompt, null, activeModel, apiKey, providerKeys, customModels);
      const newVars = [...variations, res];
      setVariations(newVars);
      setActiveVar(newVars.length - 1);
      setResult(res);
      showToast('Variation created!');
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVisual = async () => {
    const prompt = extractPrompt(result);
    if (!prompt) { showToast('Generate a prompt first!', 'error'); return; }
    setGenerating(true); setImageUrl('');
    try {
      const url = await generateImage(prompt, providerKeys, aspectRatio, tool);
      setImageUrl(url);
      showToast('Image generated!');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    const prompt = extractPrompt(result);
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    showToast('Prompt copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadImage = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: `PromptForge_${Date.now()}.png` });
      a.click(); window.URL.revokeObjectURL(url);
    } catch {
      window.open(imageUrl, '_blank');
      showToast('Opened in new tab', 'info');
    }
  };

  const guide = TOOL_GUIDES[tool];

  return (
    <div style={{ padding: '40px', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', boxSizing: 'border-box' }}>

      {/* HEADER */}
      <div style={{ borderLeft: '4px solid var(--accent)', paddingLeft: '20px', marginBottom: '36px' }}>
        <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '4px', marginBottom: '8px' }}>🖼️ IMAGE STUDIO PRO</div>
        <h2 style={{ fontSize: '34px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-1.5px', margin: 0 }}>
          Image <span style={{ color: 'var(--accent)' }}>Prompt</span>
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '6px' }}>
          Engineer expert prompts for Midjourney, DALL-E 3, Stable Diffusion, Flux & more. Generate images directly when API key available.
        </p>
      </div>

      <div className="ip-main-grid">

        {/* LEFT — CONFIG */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Description */}
          <div>
            <div style={sLabel}>DESCRIBE YOUR IMAGE</div>
            <textarea rows={4} placeholder="e.g. A futuristic city at sunset with flying cars and neon lights, cyberpunk style, ultra-detailed..."
              value={desc} onChange={e => setDesc(e.target.value)}
              style={textareaStyle}/>
          </div>

          {/* Tool selector */}
          <div>
            <div style={sLabel}>TARGET TOOL</div>
            <div className="ip-tool-grid">
              {Object.keys(TOOL_GUIDES).map(t => (
                <button key={t} onClick={() => setTool(t)} style={{ ...toolBtn, borderColor: tool === t ? 'var(--accent)' : 'var(--border)', background: tool === t ? 'var(--border2)' : 'var(--bg3)', color: tool === t ? 'var(--accent)' : 'var(--text2)' }}>
                  {t}
                </button>
              ))}
            </div>
            {guide && (
              <div style={{ marginTop: '10px', padding: '10px 14px', background: 'var(--border2)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '12px', color: 'var(--text2)' }}>
                <strong style={{ color: 'var(--accent)' }}>Syntax:</strong> {guide.syntax}<br/>
                <strong style={{ color: '#fbbf24' }}>Tip:</strong> {guide.tip}
              </div>
            )}
          </div>

          {/* Style + Mood */}
          <div className="ip-style-grid">
            <div>
              <div style={sLabel}>ART STYLE</div>
              <select value={style} onChange={e => setStyle(e.target.value)} style={selectStyle}>
                {STYLES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={sLabel}>MOOD / LIGHTING</div>
              <select value={mood} onChange={e => setMood(e.target.value)} style={selectStyle}>
                {MOODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Aspect ratio */}
          <div>
            <div style={sLabel}>ASPECT RATIO</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {RATIOS.map(r => (
                <button key={r.value} onClick={() => setAspectRatio(r.value)} style={{ ...radioBtn, borderColor: aspectRatio === r.value ? 'var(--accent)' : 'var(--border)', background: aspectRatio === r.value ? 'var(--border2)' : 'var(--bg3)', color: aspectRatio === r.value ? 'var(--accent)' : 'var(--text2)' }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleGenerate} disabled={loading} style={{ ...genBtn, opacity: loading ? 0.6 : 1 }}>
            {loading ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }}/> Engineering...</> : <><Sparkles size={17}/> Engineer Expert Prompt</>}
          </button>
        </div>

        {/* RIGHT — OUTPUT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <AnimatePresence>
            {(result || loading) && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'var(--card)', border: '2px solid var(--accent)', borderRadius: '20px', overflow: 'hidden', backdropFilter: 'blur(16px)' }}>

                {/* Output header */}
                <div style={{ background: 'rgba(124,92,252,0.08)', padding: '13px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '2px' }}>
                    ✓ PROMPT FOR {tool.toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', gap: '7px' }}>
                    {result && <>
                      <button onClick={handleCopy} style={ribBtn}>
                        {copied ? <><Check size={12}/> Copied!</> : <><Copy size={12}/> Copy Prompt</>}
                      </button>
                      <button onClick={handleVariation} disabled={loading} style={ribBtn}><RefreshCw size={12}/> Variation</button>
                      <button onClick={handleGenerateVisual} disabled={generating} style={{ ...ribBtn, background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }}>
                        {generating ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }}/> Generating...</> : <><Wand2 size={12}/> Visualize Now</>}
                      </button>
                    </>}
                  </div>
                </div>

                {/* Variation tabs */}
                {variations.length > 1 && (
                  <div style={{ display: 'flex', gap: '2px', padding: '6px 10px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                    {variations.map((_, i) => (
                      <button key={i} onClick={() => { setActiveVar(i); setResult(variations[i]); }}
                        style={{ flex: 1, padding: '6px', background: activeVar === i ? 'var(--accent)' : 'transparent', border: 'none', borderRadius: '7px', color: activeVar === i ? '#fff' : 'var(--text3)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                        {i === 0 ? 'Original' : `Variation ${i}`}
                      </button>
                    ))}
                  </div>
                )}

                {/* Content */}
                <div style={{ padding: '22px', fontSize: '13px', lineHeight: 1.75, color: 'var(--text)', maxHeight: '450px', overflowY: 'auto' }} className="ip-md-body">
                  {loading && !result ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[90, 70, 85, 60].map((w, i) => (
                        <div key={i} style={{ height: '12px', background: 'var(--border2)', borderRadius: '5px', width: `${w}%`, animation: `shimmer 1.5s ${i * 0.1}s infinite` }}/>
                      ))}
                    </div>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generated image */}
          <AnimatePresence>
            {(imageUrl || generating) && (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                style={{ background: 'var(--card)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '18px', overflow: 'hidden', backdropFilter: 'blur(16px)' }}>
                <div style={{ background: 'rgba(52,211,153,0.06)', padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: '11px', fontWeight: 900, color: '#34d399', letterSpacing: '2px' }}>
                  🎨 GENERATED IMAGE
                </div>
                <div style={{ padding: '16px' }}>
                  {generating ? (
                    <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: 'var(--bg3)', borderRadius: '12px' }}>
                      <Loader2 size={40} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }}/>
                      <p style={{ color: 'var(--text2)', fontSize: '13px' }}>Creating your image...</p>
                    </div>
                  ) : (
                    <>
                      <img src={imageUrl} alt="Generated" referrerPolicy="no-referrer"
                        style={{ width: '100%', borderRadius: '10px', maxHeight: '500px', objectFit: 'contain', display: 'block' }}
                        onError={() => showToast('Image display blocked. Use View Direct Link.', 'warn')}/>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '14px', justifyContent: 'center' }}>
                        <button onClick={downloadImage} style={{ ...genBtn, flex: 1, padding: '11px' }}>
                          <Download size={15}/> Download
                        </button>
                        <button onClick={() => window.open(imageUrl, '_blank')} style={{ ...ribBtn, padding: '11px 18px' }}>
                          <ImageIcon size={14}/> Open
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!result && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '20px' }}>
              <ImageIcon size={44} style={{ color: 'var(--text3)', marginBottom: '14px', opacity: 0.5 }}/>
              <p style={{ color: 'var(--text2)', fontSize: '13px', maxWidth: '320px', lineHeight: 1.7 }}>
                Configure your settings and click "Engineer Expert Prompt". The AI creates optimized prompts specifically for your chosen tool's syntax and style.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{opacity:.05} 50%{opacity:.12} 100%{opacity:.05} }
        .ip-md-body h1,.ip-md-body h2,.ip-md-body h3{color:var(--accent);font-weight:800;margin:14px 0 7px}
        .ip-md-body p{margin-bottom:8px;color:var(--text)}
        .ip-md-body strong{color:var(--accent);font-weight:800}
        .ip-md-body code{background:var(--border2);color:var(--accent);padding:2px 5px;border-radius:4px;font-family:'DM Mono',monospace;font-size:12px}
        .ip-md-body pre{background:var(--bg3);border:1px solid var(--border);border-radius:9px;padding:13px;overflow-x:auto;margin:10px 0}
        .ip-md-body pre code{background:none;color:var(--text);font-size:13px}
        .ip-md-body ul{padding-left:18px;margin-bottom:9px}
        .ip-md-body li{margin-bottom:4px;color:var(--text)}
      `}</style>
    </div>
  );
}

const sLabel      = { fontSize:'10px', fontWeight:900, color:'var(--text3)', letterSpacing:'3px', marginBottom:'10px', paddingBottom:'7px', borderBottom:'1px solid var(--border)' };
const textareaStyle={ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', padding:'13px 15px', borderRadius:'13px', fontSize:'14px', resize:'none', outline:'none', fontFamily:'inherit', width:'100%', lineHeight:1.6, boxSizing:'border-box' };
const selectStyle = { background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', padding:'10px 13px', borderRadius:'12px', fontSize:'13px', outline:'none', width:'100%', cursor:'pointer' };
const toolBtn     = { padding:'7px 6px', border:'1px solid', borderRadius:'9px', cursor:'pointer', fontSize:'11px', fontWeight:700, transition:'.2s' };
const radioBtn    = { padding:'9px 14px', border:'1px solid', borderRadius:'10px', cursor:'pointer', fontSize:'12px', fontWeight:600, transition:'.2s', textAlign:'left' };
const genBtn      = { width:'100%', padding:'15px', background:'var(--accent)', border:'none', borderRadius:'13px', color:'#fff', fontSize:'14px', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', justifycontent:'center', gap:'8px', boxShadow:'0 8px 25px rgba(124,92,252,.3)' };
const ribBtn      = { background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text2)', padding:'6px 12px', borderRadius:'8px', fontSize:'11px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontWeight:600 };