import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { Copy, Loader2, Video, RefreshCw, Sparkles, Check, Film, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VIDEO_TOOLS = {
  'Sora':         { tip: 'Describe motion explicitly. Specify camera movement.', syntax: 'Natural language scene description with motion details' },
  'Runway Gen-3': { tip: 'Short bursts work best. Use "camera dollies", "zoom in" etc.', syntax: 'Scene + camera instruction + style' },
  'Kling AI':     { tip: 'Very responsive to cinematic language and character descriptions.', syntax: 'Character/subject + action + environment + style' },
  'Pika Labs':    { tip: 'Add motion verbs: "slowly rotates", "walks toward camera".', syntax: 'Detailed scene description with explicit motion' },
  'Luma Dream':   { tip: 'Works great with reference images. Describe the transition.', syntax: 'Scene description + movement + atmosphere' },
  'HeyGen':       { tip: 'Focus on speaker appearance, background, tone, and script.', syntax: 'Avatar description + script + setting' },
  'Invideo AI':   { tip: 'Describe the full video structure: hook, body, CTA.', syntax: 'Topic + target audience + tone + structure' },
  'Synthesia':    { tip: 'Write the full narration script. Describe avatar and backdrop.', syntax: 'Script text + avatar style + background' },
};

const VIDEO_TYPES   = ['Short-form (15-60s Reel/Short)', 'Long-form (YouTube/Documentary)', 'Product demo', 'Explainer / Tutorial', 'Ad / Commercial', 'Cinematic scene', 'Avatar / Talking head', 'Timelapse / Loop'];
const CAMERA_MOVES  = ['Static shot', 'Slow dolly in', 'Pan left to right', 'Aerial drone view', 'Handheld shaky cam', 'Tracking shot', 'Zoom in/out', '360° orbit'];
const VIDEO_STYLES  = ['Cinematic / Film grain', 'Clean & modern', 'Neon cyberpunk', 'Natural documentary', 'Anime / Animated', 'Vintage / Retro', 'Minimalist', '3D rendered'];
const DURATIONS     = ['3-5 seconds', '10-15 seconds', '30 seconds', '60 seconds', '2-3 minutes', '5+ minutes'];

export default function VideoPrompt() {
  const { activeModel, apiKey, providerKeys, customModels, showToast } = useContext(AppContext);

  const [desc,       setDesc]       = useState('');
  const [tool,       setTool]       = useState('Runway Gen-3');
  const [videoType,  setVideoType]  = useState('Short-form (15-60s Reel/Short)');
  const [camera,     setCamera]     = useState('Slow dolly in');
  const [style,      setStyle]      = useState('Cinematic / Film grain');
  const [duration,   setDuration]   = useState('15 seconds');
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState('');
  const [variations, setVariations] = useState([]);
  const [activeVar,  setActiveVar]  = useState(0);
  const [copied,     setCopied]     = useState(false);

  const handleGenerate = async () => {
    if (!desc.trim()) { showToast('Describe your video scene', 'error'); return; }
    setLoading(true); setResult(''); setVariations([]); setActiveVar(0);
    const guide = VIDEO_TOOLS[tool];
    const system = `You are an EXPERT AI video prompt engineer specializing in ${tool}. You craft prompts that generate cinematic, professional-quality video content with perfect motion, lighting, and storytelling.`;
    const userMsg = `Create a highly optimized video prompt for ${tool}.

USER WANTS: ${desc}
VIDEO TYPE: ${videoType}
CAMERA MOVEMENT: ${camera}
VISUAL STYLE: ${style}
DURATION: ${duration}
TOOL SYNTAX: ${guide.syntax}
KEY TIP: ${guide.tip}

PROVIDE:
1. **Main Video Prompt** — in a \`\`\`prompt code block. Include: scene setup, subject/characters, action/motion, camera movement, lighting, atmosphere, style, color palette
2. **Scene Breakdown** — Shot by shot for the duration (e.g. 0-5s: ..., 5-10s: ...)
3. **Camera & Motion Notes** — Specific technical direction
4. **Negative Prompt** — What to avoid
5. **${tool} Specific Settings** — Recommended parameters

Be EXTREMELY detailed. Great video prompts describe motion, not just appearance.`;
    try {
      const res = await callAI(system, userMsg, null, activeModel, apiKey, providerKeys, customModels);
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
    try {
      const system = `You are an expert video prompt engineer. Create a VARIATION — same concept, different angle or pacing.`;
      const res = await callAI(system, `Create a variation of this ${tool} video prompt with different camera work:\n${result.slice(0, 600)}\n\nSame scene but: change camera angle, pacing, or color grading. Wrap prompt in \`\`\`prompt block.`, null, activeModel, apiKey, providerKeys, customModels);
      const newVars = [...variations, res];
      setVariations(newVars);
      setActiveVar(newVars.length - 1);
      setResult(res);
      showToast('Variation ready!');
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
    finally    { setLoading(false); }
  };

  const handleCopy = () => {
    const m = result.match(/```[a-zA-Z]*\n?([\s\S]*?)```/);
    navigator.clipboard.writeText(m ? m[1].trim() : result);
    setCopied(true); showToast('Prompt copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding:'40px', minHeight:'100vh', background:'var(--bg)', boxSizing:'border-box' }}>

      <div style={{ borderLeft:'4px solid var(--accent)', paddingLeft:'20px', marginBottom:'36px' }}>
        <div style={{ fontSize:'10px', fontWeight:900, color:'var(--accent)', letterSpacing:'4px', marginBottom:'8px' }}>🎬 VIDEO STUDIO PRO</div>
        <h2 style={{ fontSize:'34px', fontWeight:900, color:'var(--text)', letterSpacing:'-1.5px', margin:0 }}>
          Video <span style={{ color:'var(--accent)' }}>Prompt</span>
        </h2>
        <p style={{ color:'var(--text3)', fontSize:'14px', marginTop:'6px' }}>
          Engineer cinematic video prompts for Sora, Runway, Kling, Pika, Luma & more. With scene breakdowns and camera direction.
        </p>
      </div>

      <div className="vp-main-grid">

        {/* LEFT */}
        <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
          <div>
            <div style={sLabel}>DESCRIBE YOUR VIDEO</div>
            <textarea rows={4} placeholder="e.g. A lone samurai walks through a bamboo forest in heavy rain, slow motion, with cinematic fog and dramatic lighting..."
              value={desc} onChange={e => setDesc(e.target.value)} style={textareaStyle}/>
          </div>

          <div>
            <div style={sLabel}>TARGET TOOL</div>
            <div className="ip-tool-grid">
              {Object.keys(VIDEO_TOOLS).map(t => (
                <button key={t} onClick={() => setTool(t)} style={{ ...toolBtn, borderColor: tool===t?'var(--accent)':'rgba(255,255,255,0.07)', background: tool===t?'rgba(124,92,252,0.12)':'rgba(255,255,255,0.02)', color: tool===t?'#fff':'#666' }}>
                  {t}
                </button>
              ))}
            </div>
            <div style={{ marginTop:'10px', padding:'10px 14px', background:'rgba(124,92,252,0.06)', border:'1px solid rgba(124,92,252,0.15)', borderRadius:'10px', fontSize:'12px', color:'#777' }}>
              <strong style={{ color:'var(--accent2)' }}>Syntax:</strong> {VIDEO_TOOLS[tool].syntax}<br/>
              <strong style={{ color:'#fbbf24' }}>Tip:</strong> {VIDEO_TOOLS[tool].tip}
            </div>
          </div>

          <div className="ip-style-grid">
            <div>
              <div style={sLabel}>VIDEO TYPE</div>
              <select value={videoType} onChange={e => setVideoType(e.target.value)} style={selectStyle}>
                {VIDEO_TYPES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <div style={sLabel}>DURATION</div>
              <select value={duration} onChange={e => setDuration(e.target.value)} style={selectStyle}>
                {DURATIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="ip-style-grid">
            <div>
              <div style={sLabel}>CAMERA MOVEMENT</div>
              <select value={camera} onChange={e => setCamera(e.target.value)} style={selectStyle}>
                {CAMERA_MOVES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={sLabel}>VISUAL STYLE</div>
              <select value={style} onChange={e => setStyle(e.target.value)} style={selectStyle}>
                {VIDEO_STYLES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={loading} style={{ ...genBtn, opacity:loading?0.6:1 }}>
            {loading ? <><Loader2 size={17} style={{ animation:'spin 1s linear infinite' }}/> Engineering...</> : <><Film size={17}/> Engineer Video Prompt</>}
          </button>
        </div>

        {/* RIGHT */}
        <div>
          <AnimatePresence>
            {(result || loading) && (
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                style={{ background:'var(--card)', border:'2px solid var(--accent)', borderRadius:'20px', overflow:'hidden' }}>
                <div style={{ background:'rgba(124,92,252,0.08)', padding:'13px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'8px' }}>
                  <div style={{ fontSize:'11px', fontWeight:900, color:'var(--accent)', letterSpacing:'2px' }}>🎬 PROMPT FOR {tool.toUpperCase()}</div>
                  <div style={{ display:'flex', gap:'7px' }}>
                    {result && <>
                      <button onClick={handleCopy} style={ribBtn}>{copied ? <><Check size={12}/> Copied!</> : <><Copy size={12}/> Copy</>}</button>
                      <button onClick={handleVariation} disabled={loading} style={ribBtn}><RefreshCw size={12}/> Variation</button>
                    </>}
                  </div>
                </div>

                {variations.length > 1 && (
                  <div style={{ display:'flex', gap:'2px', padding:'6px 10px', background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    {variations.map((_,i) => (
                      <button key={i} onClick={() => { setActiveVar(i); setResult(variations[i]); }}
                        style={{ flex:1, padding:'6px', background:activeVar===i?'var(--accent)':'transparent', border:'none', borderRadius:'7px', color:activeVar===i?'#fff':'#555', fontSize:'11px', fontWeight:700, cursor:'pointer' }}>
                        {i===0?'Original':`Variation ${i}`}
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ padding:'22px', fontSize:'13px', lineHeight:1.75, color:'var(--text)', maxHeight:'580px', overflowY:'auto' }} className="vp-md-body">
                  {loading && !result ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                      {[90,70,85,60,80].map((w,i) => (
                        <div key={i} style={{ height:'12px', background:'rgba(124,92,252,0.08)', borderRadius:'5px', width:`${w}%`, animation:`shimmer 1.5s ${i*0.1}s infinite` }}/>
                      ))}
                    </div>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!result && !loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 20px', textAlign:'center', border:'1px dashed rgba(255,255,255,0.07)', borderRadius:'20px' }}>
              <Video size={44} style={{ color:'#1a1a2e', marginBottom:'14px' }}/>
              <p style={{ color:'#444', fontSize:'13px', maxWidth:'320px', lineHeight:1.7 }}>
                Describe your scene, choose your tool, set camera movement and style. AI engineers a complete video prompt with scene breakdown and technical direction.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes shimmer { 0%{opacity:.05} 50%{opacity:.12} 100%{opacity:.05} }
        .vp-md-body h1,.vp-md-body h2,.vp-md-body h3{color:var(--text);font-weight:800;margin:14px 0 7px}
        .vp-md-body p{margin-bottom:8px;color:var(--text2)}
        .vp-md-body strong{color:var(--accent);font-weight:800}
        .vp-md-body code{background:var(--bg3);color:var(--accent);padding:2px 5px;border-radius:4px;font-family:'DM Mono',monospace;font-size:12px}
        .vp-md-body pre{background:var(--bg3);border:1px solid var(--border);border-radius:9px;padding:13px;overflow-x:auto;margin:10px 0}
        .vp-md-body pre code{background:none;color:var(--text);font-size:13px}
        .vp-md-body ul{padding-left:18px;margin-bottom:9px}
        .vp-md-body li{margin-bottom:4px;color:var(--text2)}
      `}</style>
    </div>
  );
}

const sLabel       = { fontSize:'10px', fontWeight:900, color:'#444', letterSpacing:'3px', marginBottom:'10px', paddingBottom:'7px', borderBottom:'1px solid rgba(255,255,255,.04)' };
const textareaStyle= { background:'rgba(0,0,0,.5)', border:'1px solid rgba(255,255,255,.12)', color:'#fff', padding:'13px 15px', borderRadius:'13px', fontSize:'14px', resize:'none', outline:'none', fontFamily:'inherit', width:'100%', lineHeight:1.6, boxSizing:'border-box' };
const selectStyle  = { background:'rgba(0,0,0,.5)', border:'1px solid rgba(255,255,255,.12)', color:'#fff', padding:'10px 13px', borderRadius:'12px', fontSize:'13px', outline:'none', width:'100%', cursor:'pointer' };
const toolBtn      = { padding:'7px 6px', border:'1px solid', borderRadius:'9px', cursor:'pointer', fontSize:'11px', fontWeight:700, transition:'.2s' };
const genBtn       = { width:'100%', padding:'15px', background:'var(--accent)', border:'none', borderRadius:'13px', color:'#fff', fontSize:'14px', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 8px 25px rgba(124,92,252,.3)' };
const ribBtn       = { background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', color:'#aaa', padding:'6px 12px', borderRadius:'8px', fontSize:'11px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontWeight:600 };