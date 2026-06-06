import { usePageTranslate } from '../hooks/usePageTranslate';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import {
  Copy, Zap, Loader2, Camera, PlayCircle, Hash,
  Briefcase, Users, MessageSquare, Music2, Download,
  Flame, CalendarDays, Swords, RefreshCw, Check, ChevronRight,
  AlertCircle, Info, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadText } from '../utils/helpers';

// ── Robust JSON extractor — handles markdown wrapping, AI prefixes, trailing junk ──
const extractJSON = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  let text = raw.trim();

  // Strip code fences
  text = text.replace(/```(?:json|JSON)?\s*/g, '').replace(/```/g, '').trim();

  // Try direct parse first
  try { return JSON.parse(text); } catch (_) {}

  // Find first valid JSON block — could be array [...] or object {...}
  const tryParse = (str) => {
    try { return JSON.parse(str); } catch (_) {
      // Repair common AI quirks
      const repaired = str
        .replace(/,(\s*[}\]])/g, '$1')               // trailing commas
        .replace(/:\s*'([^']*)'/g, ': "$1"')         // single-quoted strings
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3'); // unquoted keys
      try { return JSON.parse(repaired); } catch (_) { return null; }
    }
  };

  // Try array first
  const arrStart = text.indexOf('[');
  const arrEnd   = text.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd > arrStart) {
    const result = tryParse(text.slice(arrStart, arrEnd + 1));
    if (result !== null) return result;
  }

  // Try object
  const objStart = text.indexOf('{');
  const objEnd   = text.lastIndexOf('}');
  if (objStart !== -1 && objEnd > objStart) {
    const result = tryParse(text.slice(objStart, objEnd + 1));
    if (result !== null) return result;
  }

  return null;
};

// ── Heuristic hook fallback when AI returns garbage ──
const heuristicHooks = (topic, lang) => {
  const t = (topic || '').trim().slice(0, 60) || 'this topic';
  return [
    { type: 'question',    hook: `What if everything you knew about ${t} was wrong?` },
    { type: 'stat',        hook: `9 out of 10 people fail at ${t}. Here's why.` },
    { type: 'story',       hook: `I tried ${t} for 30 days. The results shocked me.` },
    { type: 'controversy', hook: `Stop doing ${t}. It's destroying your results.` },
    { type: 'challenge',   hook: `Can you master ${t} in 7 days? Most can't.` },
  ];
};

// ── PLATFORM CONFIG ─────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: 'instagram', icon: Camera,        label: 'Instagram',  color: '#e1306c' },
  { id: 'youtube',   icon: PlayCircle,    label: 'YouTube',    color: '#ff0000' },
  { id: 'tiktok',    icon: Music2,        label: 'TikTok',     color: '#69c9d0' },
  { id: 'twitter',   icon: Hash,          label: 'Twitter/X',  color: '#1da1f2' },
  { id: 'linkedin',  icon: Briefcase,     label: 'LinkedIn',   color: '#0077b5' },
  { id: 'facebook',  icon: Users,         label: 'Facebook',   color: '#1877f2' },
  { id: 'whatsapp',  icon: MessageSquare, label: 'WhatsApp',   color: '#25d366' },
  { id: 'pinterest', icon: Camera,        label: 'Pinterest',  color: '#e60023' },
];

const PLATFORM_GUIDES = {
  instagram: 'Instagram: Visual storytelling, emotion, aspirational. Line breaks for readability. Emojis are powerful. 150-300 chars caption + hashtags.',
  youtube:   'YouTube: Hook in first 3 words, deliver on promise, include timestamps for scripts. Front-load keywords in descriptions.',
  tiktok:    'TikTok: Pattern interrupt opening, fast pace, Gen-Z friendly, trending sounds reference. Scripts must be punchy.',
  twitter:   'Twitter/X: Punchy, controversial, quotable. Threads: 8-15 tweets, each standalone. Hook tweet must stop the scroll.',
  linkedin:  'LinkedIn: Professional but personal. Single sentence opener. Storytelling beats statistics. End with thought-provoking question.',
  facebook:  'Facebook: Conversational, community-focused. Personal stories perform best. Ask questions to boost comments.',
  whatsapp:  'WhatsApp: Personal, direct, conversational. Value-dense, concise messages. No fluff.',
  pinterest: 'Pinterest: SEO-first descriptions, aspirational language, step-by-step value, save-worthy content.',
};

const HOOK_TYPES = [
  { id: 'question',    label: '❓ Question',     desc: 'Makes reader think' },
  { id: 'stat',        label: '📊 Shocking Stat', desc: 'Surprises with data' },
  { id: 'story',       label: '📖 Story',         desc: 'Personal & relatable' },
  { id: 'controversy', label: '🔥 Controversy',   desc: 'Bold & scroll-stopping' },
  { id: 'challenge',   label: '⚡ Challenge',      desc: 'Calls reader to action' },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const CreatorStudio = () => {
  const pageRef = usePageTranslate('creator');
  const { activeModel, apiKey, providerKeys, customModels, showToast, saveToVault } = useContext(AppContext);

  // Active tool tab
  const [activeTool, setActiveTool] = useState('generate'); // generate | hooks | calendar | competitor

  // Shared
  const [platform, setPlatform] = useState('instagram');
  const [topic,    setTopic]    = useState('');
  const [lang,     setLang]     = useState('English');

  // Generate tab
  const [goal,     setGoal]     = useState('Viral / high engagement');
  const [format,   setFormat]   = useState('Caption + hashtags');
  const [tone,     setTone]     = useState('Engaging & conversational');
  const [hashtags, setHashtags] = useState('Yes — maximum reach');
  const [duration, setDuration] = useState('Under 60 seconds');
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState('');
  const [genHistory, setGenHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pf_creator_history') || '[]'); } catch { return []; }
  });
  const [showGenHistory, setShowGenHistory] = useState(false);

  // Hook generator
  const [hookLoading, setHookLoading] = useState(false);
  const [hooks,       setHooks]       = useState([]); // [{type, hook}]
  const [copiedHook,  setCopiedHook]  = useState(null);

  // Calendar
  const [calNiche,    setCalNiche]    = useState('');
  const [calGoal,     setCalGoal]     = useState('Grow followers');
  const [calLoading,  setCalLoading]  = useState(false);
  const [calendar,    setCalendar]    = useState([]); // [{day, time, type, caption, hashtags}]
  const [calendarError, setCalendarError] = useState(null);

  // Competitor angle
  const [compUrl,     setCompUrl]     = useState('');
  const [compLoading, setCompLoading] = useState(false);
  const [compResult,  setCompResult]  = useState('');

  // ── field visibility ─────────────────────────────────────────────────────
  const hideHashtags  = ['whatsapp'].includes(platform);
  const showDuration  = ['youtube', 'tiktok'].includes(platform);
  const hideTone      = ['whatsapp'].includes(platform);

  const getGoals = () => platform === 'whatsapp'
    ? ['Direct promotion / Sales', 'Community / Group update', 'Event invitation', 'Customer Support / FAQ']
    : ['Viral / high engagement', 'Brand awareness', 'Lead generation', 'Product promotion', 'Educational / how-to', 'Storytelling', 'Trending topic'];

  const getFormats = () => platform === 'whatsapp'
    ? ['Short broadcast message', 'Status update (Text)', 'DM / 1-on-1 message template', 'Group announcement']
    : ['Caption + hashtags', 'Full script (video)', 'Hook + body + CTA', 'Thread / carousel (multi-post)', 'Reel script', 'Story sequence', 'Bio / About section', 'DM / message template'];

  const handlePlatformChange = (p) => {
    setPlatform(p);
    setResult(''); setHooks([]); setCalendar([]); setCompResult(''); setCalendarError(null);
    if (p === 'whatsapp') { setGoal('Direct promotion / Sales'); setFormat('Short broadcast message'); }
    else if (platform === 'whatsapp') { setGoal('Viral / high engagement'); setFormat('Caption + hashtags'); }
  };

  // ── 1. GENERATE CONTENT ──────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!topic.trim()) { showToast('Please describe your topic', 'warn'); return; }
    setLoading(true); setResult('');

    const system = `You are a world-class social media strategist and viral content creator with 10+ years experience. You know exactly what makes content go viral on each platform. Write in ${lang}.`;

    let prompt = `Create ${format} for ${platform.toUpperCase()} about: ${topic}\n\n`;
    prompt += `Platform guidelines: ${PLATFORM_GUIDES[platform]}\nGoal: ${goal}\n`;
    if (!hideTone)     prompt += `Tone: ${tone}\n`;
    if (!hideHashtags) prompt += `Hashtags: ${hashtags}\n`;
    if (showDuration)  prompt += `Duration: ${duration}\n`;
    prompt += `\nMake it stop-scroll worthy. Authentic, not AI-sounding. Perfectly formatted for ${platform}.`;

    try {
      const res = await callAI(system, prompt, null, activeModel, apiKey, providerKeys, customModels);
      setResult(res);
      saveToVault?.('Creator Studio', `${platform} | ${goal} | ${topic}`, res);
      const hi = { id: Date.now(), platform, topic: topic.slice(0,50), result: res, time: new Date().toLocaleString() };
      setGenHistory(prev => { const u = [hi,...prev].slice(0,15); try { localStorage.setItem('pf_creator_history', JSON.stringify(u)); } catch(_){} return u; });
    } catch (e) { setResult('❌ Error: ' + e.message); }
    finally { setLoading(false); }
  };

  // ── 2. VIRAL HOOK GENERATOR ──────────────────────────────────────────────
  const handleGenerateHooks = async () => {
    if (!topic.trim()) { showToast('Enter your topic first', 'warn'); return; }
    setHookLoading(true); setHooks([]);

    const system = `You are the world's best viral hook writer. You create opening lines that STOP the scroll instantly.
Every hook you write is based on deep psychology — curiosity gaps, pattern interrupts, emotional triggers.
You write for ${platform} content specifically.

CRITICAL: Respond with ONLY a single JSON array. No markdown code fences. No prose before or after. Just the JSON.

Use this exact shape (5 objects required):
[
  {"type": "question", "hook": "..."},
  {"type": "stat", "hook": "..."},
  {"type": "story", "hook": "..."},
  {"type": "controversy", "hook": "..."},
  {"type": "challenge", "hook": "..."}
]`;

    const prompt = `Create 5 different viral hooks for ${platform} content about: "${topic}"
Language: ${lang}
Each hook must be under 15 words. Make them genuinely shocking, curiosity-inducing, or emotionally powerful.`;

    let raw = '';
    try {
      raw = await callAI(system, prompt, null, activeModel, apiKey, providerKeys, customModels);
      const parsed = extractJSON(raw);

      // Validate: must be an array of 1-10 objects with hook field
      if (Array.isArray(parsed) && parsed.length > 0) {
        const valid = parsed
          .filter(h => h && typeof h.hook === 'string' && h.hook.trim().length > 5)
          .map((h, i) => ({
            type: HOOK_TYPES.find(t => t.id === String(h.type || '').toLowerCase())?.id || HOOK_TYPES[i % HOOK_TYPES.length].id,
            hook: String(h.hook).replace(/^["']|["']$/g, '').trim().slice(0, 200),
          }))
          .slice(0, 5);

        if (valid.length >= 3) {
          setHooks(valid);
          return;
        }
      }

      // JSON parse succeeded but data invalid → try regex extraction from raw
      const regexHooks = [...raw.matchAll(/"hook"\s*:\s*"([^"]+)"/g)]
        .map((m, i) => ({
          type: HOOK_TYPES[i % HOOK_TYPES.length].id,
          hook: m[1].trim().slice(0, 200),
        }))
        .filter(h => h.hook.length > 5)
        .slice(0, 5);

      if (regexHooks.length >= 3) {
        setHooks(regexHooks);
        showToast('AI response was non-standard — extracted hooks via fallback', 'warn');
        return;
      }

      // Final fallback: heuristic hooks (always work, never break the UI)
      setHooks(heuristicHooks(topic, lang));
      showToast('AI returned unreadable response — showing template hooks. Try regenerating.', 'warn');
    } catch (e) {
      // Network / API error
      setHooks(heuristicHooks(topic, lang));
      showToast('API error: ' + e.message + '. Showing template hooks.', 'error');
    } finally {
      setHookLoading(false);
    }
  };

  const copyHook = (hook, idx) => {
    navigator.clipboard.writeText(hook);
    setCopiedHook(idx);
    setTimeout(() => setCopiedHook(null), 2000);
    showToast('Hook copied!');
  };

  const useHook = (hook) => {
    setTopic(prev => hook + (prev ? '\n\n' + prev : ''));
    setActiveTool('generate');
    showToast('Hook added to topic!');
  };

  // ── 3. CONTENT CALENDAR ──────────────────────────────────────────────────
  const handleGenerateCalendar = async () => {
    const niche = calNiche || topic;
    if (!niche.trim()) { showToast('Enter your niche/topic for the calendar', 'warn'); return; }
    setCalLoading(true); setCalendar([]); setCalendarError(null);

    const system = `You are a social media content strategist. Create a 7-day content calendar.

CRITICAL: Respond with ONLY a single JSON array. No markdown code fences. No prose before or after. Just the JSON.

Use this exact shape (exactly 7 objects, one per day):
[
  {
    "day": "Monday",
    "best_time": "9:00 AM",
    "content_type": "Reel",
    "hook": "...",
    "caption": "...",
    "hashtags": "#tag1 #tag2 #tag3",
    "tip": "..."
  }
]

Days must be: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday (in this order).
content_type must be one of: Post, Reel, Story, Carousel, Live, Video, Thread.`;

    const prompt = `Create a 7-day ${platform} content calendar for:
Niche/Topic: ${niche}
Goal: ${calGoal}
Language: ${lang}

Each day needs: best posting time, content type, scroll-stopping hook, full caption, 5-8 hashtags, and one pro tip.`;

    try {
      const raw = await callAI(system, prompt, null, activeModel, apiKey, providerKeys, customModels);
      const parsed = extractJSON(raw);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        setCalendarError('AI did not return a valid calendar structure. Try regenerating or switching models.');
        showToast('Calendar parse failed — try regenerating', 'error');
        return;
      }

      // Sanitize each day — fill missing fields with sensible defaults
      const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const sanitized = parsed.slice(0, 7).map((d, i) => ({
        day:          String(d?.day || DAYS[i] || `Day ${i + 1}`).slice(0, 20),
        best_time:    String(d?.best_time || d?.time || '9:00 AM').slice(0, 30),
        content_type: String(d?.content_type || d?.type || 'Post').slice(0, 30),
        hook:         String(d?.hook || 'Hook missing — regenerate to retry').slice(0, 300),
        caption:      String(d?.caption || 'Caption missing — regenerate to retry').slice(0, 2000),
        hashtags:     String(d?.hashtags || '').slice(0, 500),
        tip:          String(d?.tip || '').slice(0, 300),
      }));

      // Pad up to 7 days if AI gave fewer
      while (sanitized.length < 7) {
        const i = sanitized.length;
        sanitized.push({
          day: DAYS[i] || `Day ${i + 1}`,
          best_time: '9:00 AM',
          content_type: 'Post',
          hook: '⚠️ AI did not generate this day — click regenerate',
          caption: 'Click "Regenerate calendar" to fill missing days.',
          hashtags: '',
          tip: '',
        });
      }

      setCalendar(sanitized);
      saveToVault?.('Content Calendar', `${platform} | ${niche}`, JSON.stringify(sanitized, null, 2));

      if (parsed.length < 7) {
        showToast(`AI only returned ${parsed.length} days — padded to 7. Regenerate for full calendar.`, 'warn');
      }
    } catch (e) {
      setCalendarError(e.message || 'Failed to generate calendar.');
      showToast('Error: ' + (e.message || 'Calendar generation failed'), 'error');
    } finally {
      setCalLoading(false);
    }
  };

  const copyCalendar = () => {
    const text = calendar.map(d =>
      `${d.day} — ${d.best_time} | ${d.content_type}\nHook: ${d.hook}\nCaption: ${d.caption}\n${d.hashtags}${d.tip ? `\nTip: ${d.tip}` : ''}`
    ).join('\n\n─────────────────\n\n');
    navigator.clipboard.writeText(text);
    showToast('Full calendar copied!');
  };

  const downloadCalendarCSV = () => {
    if (!calendar.length) return;
    const escapeCSV = (val) => {
      const s = String(val ?? '');
      if (s.includes('"') || s.includes(',') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const headers = ['Day', 'Best Time', 'Content Type', 'Hook', 'Caption', 'Hashtags', 'Pro Tip'];
    const rows = calendar.map(d => [d.day, d.best_time, d.content_type, d.hook, d.caption, d.hashtags, d.tip]);
    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(escapeCSV).join(','))
    ].join('\n');
    const niche = (calNiche || topic || 'calendar').slice(0, 30).replace(/[^a-z0-9]+/gi, '_');
    downloadText(csv, `${platform}_calendar_${niche}.csv`);
    showToast('Calendar downloaded as CSV!');
  };

  // ── 4. COMPETITOR ANGLE ──────────────────────────────────────────────────
  const handleCompetitor = async () => {
    if (!compUrl.trim() && !topic.trim()) { showToast('Enter competitor info or topic', 'warn'); return; }
    setCompLoading(true); setCompResult('');

    const system = `You are a competitive intelligence expert and viral content strategist. 
You analyze competitor content and create BETTER alternatives that outperform the original.`;

    const prompt = `Competitor info: ${compUrl || 'Not provided'}
My niche/topic: ${topic || 'Same as competitor'}
Platform: ${platform}
Language: ${lang}

Analyze and create:
1. **What they're doing** (2-3 bullet points — strengths/weaknesses)
2. **How I can do it 10x better** (specific angles they missed)
3. **My superior version** (full post/caption that beats theirs)
4. **Unique angle they'll never think of** (my unfair advantage)

Make the "superior version" ready to post — formatted perfectly for ${platform}.`;

    try {
      const res = await callAI(system, prompt, null, activeModel, apiKey, providerKeys, customModels);
      setCompResult(res);
      saveToVault?.('Competitor Analysis', `${platform} | ${topic}`, res);
    } catch (e) { setCompResult('❌ Error: ' + e.message); }
    finally { setCompLoading(false); }
  };

  // ── TOOL TABS CONFIG ─────────────────────────────────────────────────────
  const tools = [
    { id: 'generate',   icon: Zap,         label: 'Generate',        color: '#a78bfa' },
    { id: 'hooks',      icon: Flame,        label: 'Viral Hooks',     color: '#f97316' },
    { id: 'calendar',   icon: CalendarDays, label: 'Content Calendar',color: '#4ade80' },
    { id: 'competitor', icon: Swords,       label: 'Beat Competitor', color: '#f87171' },
  ];

  const activePlatform = PLATFORMS.find(p => p.id === platform);

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="page active" ref={pageRef}>
      <div className="section-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h2 className="section-title">🎨 Creator Studio</h2>
          <div className="section-sub">Generate · Viral Hooks · 7-Day Calendar · Beat Competitors — all platforms, all in one place.</div>
        </div>
        {genHistory.length > 0 && (
          <button onClick={() => setShowGenHistory(h => !h)} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', cursor:'pointer', color:'var(--text2)', fontSize:12, fontWeight:700, position:'relative', flexShrink:0 }}>
            History
            <span style={{ position:'absolute', top:-6, right:-6, background:'#f87171', color:'#fff', borderRadius:'50%', width:16, height:16, fontSize:9, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>{genHistory.length}</span>
          </button>
        )}
      </div>

      {showGenHistory && (
        <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:14, padding:16, marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:800, color:'var(--text3)', letterSpacing:2, marginBottom:12, textTransform:'uppercase' }}>Recent Generations</div>
          {genHistory.map(h => (
            <div key={h.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, marginBottom:8 }}>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{h.platform} — {h.topic}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{h.time}</div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => { setResult(h.result); setShowGenHistory(false); showToast('Restored!'); }} style={{ fontSize:11, color:'#f87171', background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontWeight:700 }}>Restore</button>
                <button onClick={() => { setGenHistory(prev => { const u = prev.filter(i => i.id !== h.id); localStorage.setItem('pf_creator_history', JSON.stringify(u)); return u; }); }} style={{ fontSize:11, color:'var(--text3)', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:6, padding:'4px 8px', cursor:'pointer' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Platform Selector */}
      <div style={{ marginBottom: 20 }}>
        <div className="form-label" style={{ marginBottom: 12 }}>SELECT PLATFORM</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10 }}>
          {PLATFORMS.map(p => {
            const Icon = p.icon;
            const isActive = platform === p.id;
            return (
              <motion.div
                key={p.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePlatformChange(p.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 7, padding: '14px 8px', borderRadius: 12, cursor: 'pointer',
                  border: `1.5px solid ${isActive ? p.color : 'var(--border)'}`,
                  background: isActive ? `${p.color}18` : 'var(--bg2)',
                  color: isActive ? p.color : 'var(--text2)',
                  fontSize: 11, fontWeight: 700, textAlign: 'center',
                  transition: 'all 0.2s',
                  boxShadow: isActive ? `0 4px 16px ${p.color}30` : 'none',
                }}
              >
                <Icon size={22} />
                {p.label}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Tool tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {tools.map(t => {
          const Icon = t.icon;
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                background: isActive ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isActive ? t.color : 'rgba(255,255,255,0.1)'}`,
                color: isActive ? t.color : 'rgba(255,255,255,0.5)',
              }}
            >
              <Icon size={13} />{t.label}
            </button>
          );
        })}
      </div>

      {/* ════ GENERATE TAB ════ */}
      <AnimatePresence mode="wait">
        {activeTool === 'generate' && (
          <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="tool-card">
              <div className="form-row cols2">
                <div className="form-group">
                  <label className="form-label">Content Goal</label>
                  <select className="form-select" value={goal} onChange={e => setGoal(e.target.value)}>
                    {getGoals().map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Content Format</label>
                  <select className="form-select" value={format} onChange={e => setFormat(e.target.value)}>
                    {getFormats().map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Your Topic / Niche / Product</label>
                <textarea
                  className="form-textarea" rows="3"
                  placeholder={`e.g. I'm a fitness coach promoting my 30-day program for working moms...`}
                  value={topic} onChange={e => setTopic(e.target.value)}
                />
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
                      <option>Luxury / Premium</option>
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Language</label>
                  <select className="form-select" value={lang} onChange={e => setLang(e.target.value)}>
                    <option>English</option><option>Hindi</option><option>Hinglish</option>
                    <option>Spanish</option><option>French</option><option>Arabic</option>
                    <option>Portuguese</option><option>German</option>
                  </select>
                </div>
                {!hideHashtags && (
                  <div className="form-group">
                    <label className="form-label">Hashtags</label>
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
                      <option>Under 15 seconds</option>
                      <option>Under 60 seconds</option>
                      <option>1 - 3 minutes</option>
                      <option>3 - 10 minutes</option>
                    </select>
                  </div>
                )}
              </div>

              <button className="btn-generate" onClick={handleGenerate} disabled={loading}>
                {loading
                  ? <><Loader2 className="animate-spin" /> Creating...</>
                  : <><Zap /> Generate {activePlatform?.label} Content</>}
              </button>

              {loading && (
                <div className="output-box">
                  <div className="loading-shimmer" style={{ width: '90%' }} />
                  <div className="loading-shimmer" style={{ width: '70%' }} />
                  <div className="loading-shimmer" style={{ width: '80%' }} />
                </div>
              )}

              {result && !loading && (
                <motion.div className="output-box" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="output-header">
                    <span className="output-label" style={{ color: activePlatform?.color }}>
                      ✓ {activePlatform?.label} Content Ready
                    </span>
                    <div className="output-actions">
                      <button className="btn-copy" onClick={() => downloadText(result, `${platform}_content.txt`)}><Download size={14} /> Download</button>
                      <button className="btn-copy" onClick={() => { navigator.clipboard.writeText(result); showToast('Copied!'); }}><Copy size={14} /> Copy</button>
                    </div>
                  </div>
                  <div className="output-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown></div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ════ VIRAL HOOKS TAB ════ */}
        {activeTool === 'hooks' && (
          <motion.div key="hooks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="tool-card">
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                padding: '10px 14px', background: 'rgba(249,115,22,0.08)',
                border: '1px solid rgba(249,115,22,0.2)', borderRadius: 10,
              }}>
                <Flame size={16} color="#f97316" />
                <div>
                  <span style={{ fontSize: 13, color: '#f97316', fontWeight: 700 }}>Viral Hook Generator</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>
                    5 scroll-stopping opening lines — one for each hook style
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Your topic / niche</label>
                <textarea className="form-textarea" rows="2"
                  placeholder="e.g. I help busy moms lose 10kg in 90 days without gym membership..."
                  value={topic} onChange={e => setTopic(e.target.value)} />
              </div>

              <div className="form-row cols2">
                <div className="form-group">
                  <label className="form-label">Language</label>
                  <select className="form-select" value={lang} onChange={e => setLang(e.target.value)}>
                    <option>English</option><option>Hindi</option><option>Hinglish</option>
                    <option>Spanish</option><option>French</option><option>Arabic</option>
                  </select>
                </div>
              </div>

              <button className="btn-generate" onClick={handleGenerateHooks} disabled={hookLoading}
                style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
                {hookLoading
                  ? <><Loader2 className="animate-spin" /> Generating hooks...</>
                  : <><Flame size={16} /> Generate 5 Viral Hooks</>}
              </button>

              {hookLoading && (
                <div style={{ marginTop: 16 }}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="loading-shimmer" style={{ width: `${85 - i * 5}%`, marginBottom: 12 }} />
                  ))}
                </div>
              )}

              {hooks.length > 0 && !hookLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 16 }}>
                  <div style={{ marginBottom: 12, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    5 HOOKS GENERATED — Click to copy or use as opener
                  </div>
                  {hooks.map((h, i) => {
                    const hookMeta = HOOK_TYPES.find(t => t.id === h.type) || HOOK_TYPES[i] || HOOK_TYPES[0];
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 12,
                          padding: '14px 16px', borderRadius: 12, marginBottom: 10,
                          background: 'rgba(249,115,22,0.06)',
                          border: '1px solid rgba(249,115,22,0.2)',
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(249,115,22,0.2)'}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                              background: 'rgba(249,115,22,0.15)', color: '#f97316',
                              border: '1px solid rgba(249,115,22,0.3)',
                            }}>{hookMeta.label}</span>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{hookMeta.desc}</span>
                          </div>
                          <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.6, fontWeight: 500 }}>
                            "{h.hook}"
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                          <button
                            onClick={() => copyHook(h.hook, i)}
                            style={{
                              padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                              background: copiedHook === i ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)',
                              border: `1px solid ${copiedHook === i ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.12)'}`,
                              color: copiedHook === i ? '#4ade80' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            {copiedHook === i ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                          </button>
                          <button
                            onClick={() => useHook(h.hook)}
                            style={{
                              padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                              background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)',
                              color: '#a78bfa', cursor: 'pointer', fontFamily: 'inherit',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            <ChevronRight size={11} /> Use
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                  <button
                    onClick={handleGenerateHooks}
                    style={{
                      marginTop: 4, padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <RefreshCw size={12} /> Regenerate all hooks
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ════ CONTENT CALENDAR TAB ════ */}
        {activeTool === 'calendar' && (
          <motion.div key="cal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="tool-card">
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                padding: '10px 14px', background: 'rgba(74,222,128,0.08)',
                border: '1px solid rgba(74,222,128,0.2)', borderRadius: 10,
              }}>
                <CalendarDays size={16} color="#4ade80" />
                <div>
                  <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 700 }}>7-Day Content Calendar</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>
                    Full week of {activePlatform?.label} posts — hooks, captions, hashtags, best times
                  </span>
                </div>
              </div>

              <div className="form-row cols2">
                <div className="form-group">
                  <label className="form-label">Your Niche / Topic</label>
                  <input className="form-input"
                    placeholder={topic ? `Default: "${topic.slice(0, 40)}${topic.length > 40 ? '…' : ''}" (or override)` : 'e.g. Personal finance for millennials, fitness coaching, tech reviews...'}
                    value={calNiche}
                    onChange={e => setCalNiche(e.target.value)} />
                  {!calNiche && topic && (
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                      Will use topic from Generate tab if you leave this blank
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Weekly Goal</label>
                  <select className="form-select" value={calGoal} onChange={e => setCalGoal(e.target.value)}>
                    <option>Grow followers</option>
                    <option>Drive sales / conversions</option>
                    <option>Build brand authority</option>
                    <option>Increase engagement</option>
                    <option>Launch a product</option>
                    <option>Build email list</option>
                  </select>
                </div>
              </div>

              <div className="form-row cols2">
                <div className="form-group">
                  <label className="form-label">Language</label>
                  <select className="form-select" value={lang} onChange={e => setLang(e.target.value)}>
                    <option>English</option><option>Hindi</option><option>Hinglish</option>
                    <option>Spanish</option><option>French</option>
                  </select>
                </div>
              </div>

              <button className="btn-generate" onClick={handleGenerateCalendar} disabled={calLoading}
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                {calLoading
                  ? <><Loader2 className="animate-spin" /> Building your week...</>
                  : <><CalendarDays size={16} /> Generate 7-Day Calendar</>}
              </button>

              {calLoading && (
                <div style={{ marginTop: 16 }}>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} style={{ marginBottom: 12, padding: 14, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
                      <div className="loading-shimmer" style={{ width: '30%', marginBottom: 8 }} />
                      <div className="loading-shimmer" style={{ width: '80%', marginBottom: 6 }} />
                      <div className="loading-shimmer" style={{ width: '60%' }} />
                    </div>
                  ))}
                </div>
              )}

              {calendarError && !calLoading && (
                <div style={{
                  marginTop: 16, padding: '14px 16px', borderRadius: 10,
                  background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171', marginBottom: 4 }}>Calendar generation failed</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{calendarError}</div>
                    <button
                      onClick={handleGenerateCalendar}
                      style={{
                        marginTop: 10, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.35)',
                        color: '#f87171', cursor: 'pointer', fontFamily: 'inherit',
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      <RefreshCw size={12} /> Try again
                    </button>
                  </div>
                </div>
              )}

              {calendar.length > 0 && !calLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
                      7 DAYS — {activePlatform?.label.toUpperCase()} CONTENT CALENDAR
                    </span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={downloadCalendarCSV} style={{
                        padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)',
                        color: '#60a5fa', cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}>
                        <Download size={12} /> CSV
                      </button>
                      <button onClick={copyCalendar} style={{
                        padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
                        color: '#4ade80', cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}>
                        <Copy size={12} /> Copy All
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {calendar.map((day, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        style={{
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 12, overflow: 'hidden',
                        }}
                      >
                        {/* Day header */}
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 16px',
                          background: `linear-gradient(135deg, rgba(74,222,128,0.08), rgba(74,222,128,0.03))`,
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#4ade80' }}>{day.day}</span>
                            <span style={{
                              fontSize: 11, padding: '2px 8px', borderRadius: 8,
                              background: 'rgba(74,222,128,0.1)', color: '#4ade80',
                              border: '1px solid rgba(74,222,128,0.2)',
                            }}>{day.content_type}</span>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>🕐 {day.best_time}</span>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${day.hook}\n\n${day.caption}\n\n${day.hashtags}`);
                              showToast(`${day.day} copied!`);
                            }}
                            style={{
                              padding: '4px 10px', borderRadius: 6, fontSize: 11,
                              background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                              color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'inherit',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            <Copy size={10} /> Copy day
                          </button>
                        </div>

                        {/* Day content */}
                        <div style={{ padding: '14px 16px' }}>
                          <div style={{
                            fontSize: 13, fontWeight: 700, color: '#fbbf24',
                            marginBottom: 8, padding: '6px 10px',
                            background: 'rgba(251,191,36,0.06)',
                            borderLeft: '2px solid #fbbf24',
                            borderRadius: '0 6px 6px 0',
                          }}>
                            🎯 Hook: "{day.hook}"
                          </div>
                          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 8 }}>
                            {day.caption}
                          </div>
                          <div style={{ fontSize: 12, color: '#60a5fa', marginBottom: 8 }}>{day.hashtags}</div>
                          {day.tip && (
                            <div style={{
                              fontSize: 11, color: 'rgba(255,255,255,0.45)',
                              padding: '5px 10px', background: 'rgba(255,255,255,0.03)',
                              borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)',
                            }}>
                              💡 Pro tip: {day.tip}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <button onClick={handleGenerateCalendar} style={{
                    marginTop: 12, padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <RefreshCw size={12} /> Regenerate calendar
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ════ COMPETITOR ANGLE TAB ════ */}
        {activeTool === 'competitor' && (
          <motion.div key="comp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="tool-card">
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                padding: '10px 14px', background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10,
              }}>
                <Swords size={16} color="#f87171" />
                <div>
                  <span style={{ fontSize: 13, color: '#f87171', fontWeight: 700 }}>Beat Competitor</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>
                    Paste competitor's post or URL → AI creates something 10x better
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Competitor's post / URL / description</label>
                <textarea className="form-textarea" rows="4"
                  placeholder="Paste their exact post text, or describe their content angle... e.g. 'My competitor posts motivational fitness quotes with generic stock photos and gets 500 likes'"
                  value={compUrl} onChange={e => setCompUrl(e.target.value)} />
              </div>

              <div className="form-row cols2">
                <div className="form-group">
                  <label className="form-label">My niche / What I do</label>
                  <input className="form-input"
                    placeholder="e.g. Fitness coach for new moms..."
                    value={topic} onChange={e => setTopic(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Language</label>
                  <select className="form-select" value={lang} onChange={e => setLang(e.target.value)}>
                    <option>English</option><option>Hindi</option><option>Hinglish</option><option>Spanish</option>
                  </select>
                </div>
              </div>

              <button className="btn-generate" onClick={handleCompetitor} disabled={compLoading}
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                {compLoading
                  ? <><Loader2 className="animate-spin" /> Analyzing & building...</>
                  : <><Swords size={16} /> Analyze & Beat Them</>}
              </button>

              {compLoading && (
                <div className="output-box" style={{ marginTop: 16 }}>
                  <div className="loading-shimmer" style={{ width: '80%' }} />
                  <div className="loading-shimmer" style={{ width: '60%' }} />
                  <div className="loading-shimmer" style={{ width: '70%' }} />
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>Analyzing competitor weaknesses...</p>
                </div>
              )}

              {compResult && !compLoading && (
                <motion.div className="output-box" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ marginTop: 16, borderLeft: '3px solid #f87171' }}>
                  <div className="output-header">
                    <span className="output-label" style={{ color: '#f87171' }}>⚔ Competitive Analysis + Superior Content</span>
                    <div className="output-actions">
                      <button className="btn-copy" onClick={() => { downloadText(compResult, `${platform}_beat_competitor.txt`); showToast('Downloaded!'); }}>
                        <Download size={14} /> Download
                      </button>
                      <button className="btn-copy" onClick={() => { navigator.clipboard.writeText(compResult); showToast('Copied!'); }}>
                        <Copy size={14} /> Copy
                      </button>
                    </div>
                  </div>
                  <div className="output-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{compResult}</ReactMarkdown></div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreatorStudio;