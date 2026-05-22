import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { Copy, Zap, Loader2, Download, Sparkles, GitCompare, ScanText, RefreshCw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadText } from '../utils/helpers';

const AIWriter = () => {
  const { activeModel, apiKey, providerKeys, customModels, showToast, saveToVault } = useContext(AppContext);

  const [type, setType]       = useState('Blog post / Article');
  const [tone, setTone]       = useState('Professional');
  const [lang, setLang]       = useState('English');
  const [topic, setTopic]     = useState('');
  const [length, setLength]   = useState(50);
  const [audience, setAudience] = useState('');
  const [keywords, setKeywords] = useState('');

  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState('');

  // Humanize
  const [humanizing, setHumanizing]   = useState(false);
  const [humanized, setHumanized]     = useState('');

  // A/B Variants
  const [varLoading, setVarLoading]   = useState(false);
  const [variants, setVariants]       = useState([]); // [{label, content}]

  // Tone Analyzer
  const [analyzeText, setAnalyzeText] = useState('');
  const [analyzing, setAnalyzing]     = useState(false);
  const [toneReport, setToneReport]   = useState(null);

  // Active tab in output area
  const [activeTab, setActiveTab]     = useState('main'); // main | humanized | variants | analyzer

  // ── field visibility logic ──────────────────────────────────────────────
  const hideTone     = ['SEO meta tags', 'Tagline / Slogan', 'Code documentation'].includes(type);
  const hideKeywords = ['Professional bio', 'Cover letter', 'Customer support reply', 'Cold email', 'Tagline / Slogan'].includes(type);
  const hideAudience = ['SEO meta tags', 'Customer support reply', 'Cold email', 'Tagline / Slogan', 'Professional bio'].includes(type);

  const getLengthText = (val) => {
    if (val < 25) return 'Very Short (~100 words)';
    if (val < 50) return 'Short (~250 words)';
    if (val < 75) return 'Medium (~500 words)';
    return 'Long (~1000+ words)';
  };

  // ── 1. GENERATE ──────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!topic.trim()) { showToast('Please describe your topic', 'warn'); return; }
    setLoading(true);
    setResult(''); setHumanized(''); setVariants([]); setToneReport(null);
    setActiveTab('main');

    const system = `You are an elite copywriter and content strategist. You produce exceptionally high-quality ${type} content that people actually want to read, share, and act on. You never use filler phrases, generic AI-speak, or clichés. Every word earns its place. Write in ${lang}.`;

    let userPrompt = `Write a ${type} about: ${topic}\n\n`;
    if (!hideTone)     userPrompt += `Tone: ${tone}\n`;
    userPrompt += `Length: ${getLengthText(length)}\n`;
    if (audience)      userPrompt += `Target audience: ${audience}\n`;
    if (keywords && !hideKeywords) userPrompt += `Include these keywords naturally: ${keywords}\n`;
    userPrompt += `\nMake this genuinely outstanding. Write something that would make a professional copywriter proud. No fluff, no filler, no generic phrases. Deliver maximum value from the very first word.`;

    try {
      const res = await callAI(system, userPrompt, null, activeModel, apiKey, providerKeys, customModels);
      setResult(res);
      saveToVault?.('AI Writer', `Type: ${type} | Topic: ${topic}`, res);
    } catch (e) {
      setResult('❌ Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── 2. HUMANIZE ──────────────────────────────────────────────────────────
  const handleHumanize = async () => {
    const textToHumanize = result;
    if (!textToHumanize.trim()) return;
    setHumanizing(true);
    setHumanized('');
    setActiveTab('humanized');

    const system = `You are an expert at making AI-generated text sound completely human.
Your rules:
- Remove ALL AI patterns: no em-dashes (—), no "delve", "tapestry", "it's worth noting", "in conclusion", "furthermore", "moreover", "pivotal", "crucial", "vibrant", "unleash", "game-changer", "streamline"
- Vary sentence length dramatically — mix very short punchy sentences with longer ones
- Add natural imperfections: occasional informal phrasing, contractions, direct address
- Keep the exact same meaning and structure
- Make it sound like a real human expert wrote this, not an AI
- Never mention you changed anything — just output the rewritten text`;

    const userMsg = `Rewrite this to sound 100% human. Keep same meaning, same length:\n\n${textToHumanize}`;

    try {
      const res = await callAI(system, userMsg, null, activeModel, apiKey, providerKeys, customModels);
      setHumanized(res);
    } catch (e) {
      setHumanized('❌ Error: ' + e.message);
    } finally {
      setHumanizing(false);
    }
  };

  // ── 3. A/B VARIANTS ──────────────────────────────────────────────────────
  const handleVariants = async () => {
    if (!result.trim()) return;
    setVarLoading(true);
    setVariants([]);
    setActiveTab('variants');

    const system = `You are a master copywriter. Given a piece of content, create 2 completely different versions — same topic, different angles, tones, or hooks. Each version should feel like it was written by a different writer with a different strategy.

FORMAT (strictly follow):
===VARIANT A===
[Label: one-line description of this variant's angle]
[Full content here]
===VARIANT B===
[Label: one-line description of this variant's angle]
[Full content here]`;

    const userMsg = `Create 2 A/B variants of this content:\n\n${result}`;

    try {
      const res = await callAI(system, userMsg, null, activeModel, apiKey, providerKeys, customModels);

      // Parse variants
      const parsed = [];
      const parts = res.split(/===VARIANT [AB]===/);
      parts.forEach((part, i) => {
        if (!part.trim() || i === 0) return;
        const lines = part.trim().split('\n');
        const labelLine = lines[0]?.replace('[Label:', '').replace(']', '').replace('Label:', '').trim();
        const content = lines.slice(1).join('\n').trim();
        parsed.push({
          label: labelLine || `Variant ${i}`,
          content: content || part.trim(),
        });
      });

      setVariants(parsed.length > 0 ? parsed : [
        { label: 'Version A', content: res.split('===VARIANT B===')[0]?.trim() || res },
        { label: 'Version B', content: res.split('===VARIANT B===')[1]?.trim() || '' },
      ]);
    } catch (e) {
      setVariants([{ label: 'Error', content: '❌ ' + e.message }]);
    } finally {
      setVarLoading(false);
    }
  };

  // ── 4. TONE ANALYZER ─────────────────────────────────────────────────────
  const handleAnalyzeTone = async () => {
    if (!analyzeText.trim()) { showToast('Paste some text to analyze', 'warn'); return; }
    setAnalyzing(true);
    setToneReport(null);
    setActiveTab('analyzer');

    const system = `You are an expert linguist and content analyst. Analyze the tone and writing style of the given text.

Respond ONLY in this exact JSON format (no markdown, no extra text):
{
  "primary_tone": "Professional",
  "secondary_tones": ["Persuasive", "Authoritative"],
  "reading_level": "College",
  "emotion": "Confident",
  "formality_score": 78,
  "clarity_score": 85,
  "engagement_score": 72,
  "ai_probability": 65,
  "writing_style": "Third-person formal with strong calls to action",
  "best_suited_for": ["LinkedIn", "Business reports", "Sales emails"],
  "improvement_tips": [
    "Add more personal anecdotes to increase engagement",
    "Vary sentence length for better rhythm",
    "Use more active voice constructions"
  ],
  "detected_patterns": ["Passive voice overuse", "Strong opening hook", "Clear structure"]
}`;

    try {
      const raw = await callAI(system, `Analyze this text:\n\n${analyzeText}`, null, activeModel, apiKey, providerKeys, customModels);
      const clean = raw.replace(/```json|```/g, '').trim();
      const json = JSON.parse(clean);
      setToneReport(json);
    } catch (e) {
      setToneReport({ error: '❌ Parse error: ' + e.message });
    } finally {
      setAnalyzing(false);
    }
  };

  // ── HELPERS ──────────────────────────────────────────────────────────────
  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    showToast('✓ Copied to clipboard');
  };

  const handleDownload = () => {
    const text = activeTab === 'humanized' ? humanized : result;
    downloadText(text, `PromptForge_${type.replace(/\s+/g, '_')}.txt`);
    showToast('✓ Download started');
  };

  const ScoreBar = ({ label, value, color }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
        <span style={{ color: 'var(--text2)' }}>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{value}%</span>
      </div>
      <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 3 }}
        />
      </div>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="page active">
      <div className="section-header">
        <h2 className="section-title">✍️ AI Writer</h2>
        <div className="section-sub">Generate · Humanize · A/B Test · Analyze tone — all in one place.</div>
      </div>

      {/* ── TOOL TABS ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { id: 'write',    icon: '✍️', label: 'Write'         },
          { id: 'analyzer', icon: '🔍', label: 'Tone Analyzer' },
        ].map(tab => {
          const isActive = tab.id === 'write'
            ? activeTab === 'main' || activeTab === 'humanized' || activeTab === 'variants'
            : activeTab === 'analyzer';
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id === 'write' ? 'main' : 'analyzer')}
              style={{
                padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                background: isActive ? 'var(--accent)' : 'var(--bg3)',
                border: '1px solid',
                borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                color: isActive ? '#fff' : 'var(--text2)',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════
          WRITE TAB
      ════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {activeTab !== 'analyzer' && (
          <motion.div key="write" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                    <option>English</option><option>Hindi</option><option>Hinglish</option>
                    <option>Spanish</option><option>French</option><option>Arabic</option>
                    <option>Portuguese</option><option>Russian</option><option>German</option>
                    <option>Japanese</option><option>Chinese (Simplified)</option>
                    <option>Korean</option><option>Italian</option><option>Turkish</option>
                    <option>Dutch</option><option>Bengali</option>
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
                />
              </div>

              <div className="form-row cols3">
                <div className="form-group">
                  <label className="form-label">
                    Length: <span style={{ color: 'var(--accent2)' }}>{getLengthText(length)}</span>
                  </label>
                  <input type="range" min="0" max="100" value={length} onChange={e => setLength(e.target.value)} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
                    <span>Very Short</span><span>Long</span>
                  </div>
                </div>

                {!hideAudience && (
                  <div className="form-group">
                    <label className="form-label">Target Audience (optional)</label>
                    <input className="form-input" placeholder="e.g. startup founders, small biz owners..." value={audience} onChange={e => setAudience(e.target.value)} />
                  </div>
                )}

                {!hideKeywords && (
                  <div className="form-group">
                    <label className="form-label">Keywords to Include (optional)</label>
                    <input className="form-input" placeholder="e.g. AI, productivity, remote work..." value={keywords} onChange={e => setKeywords(e.target.value)} />
                  </div>
                )}
              </div>

              <button className="btn-generate" onClick={handleGenerate} disabled={loading}>
                {loading ? <><Loader2 className="animate-spin" /> Generating...</> : <><Zap /> Generate Content</>}
              </button>

              {/* Loading shimmer */}
              {loading && (
                <div className="output-box">
                  <div className="loading-shimmer" style={{ width: '90%' }} />
                  <div className="loading-shimmer" style={{ width: '70%' }} />
                  <div className="loading-shimmer" style={{ width: '80%' }} />
                </div>
              )}

              {/* Output area */}
              {result && !loading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

                  {/* Output sub-tabs */}
                  <div style={{ display: 'flex', gap: 6, margin: '16px 0 12px', flexWrap: 'wrap' }}>
                    {[
                      { id: 'main',      label: '📄 Original' },
                      { id: 'humanized', label: '🧑 Humanized' },
                      { id: 'variants',  label: '🔀 A/B Variants' },
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setActiveTab(t.id);
                          if (t.id === 'humanized' && !humanized && !humanizing) handleHumanize();
                          if (t.id === 'variants'  && !variants.length && !varLoading) handleVariants();
                        }}
                        style={{
                          padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                          background: activeTab === t.id ? 'rgba(124,92,252,0.15)' : 'var(--bg3)',
                          border: `1px solid ${activeTab === t.id ? 'var(--accent)' : 'var(--border)'}`,
                          color: activeTab === t.id ? 'var(--accent2)' : 'var(--text2)',
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* MAIN OUTPUT */}
                  {activeTab === 'main' && (
                    <div className="output-box">
                      <div className="output-header">
                        <span className="output-label">✓ Generated Content</span>
                        <div className="output-actions">
                          <button className="btn-copy" onClick={handleDownload}><Download size={14} /> Download</button>
                          <button className="btn-copy" onClick={() => copyText(result)}><Copy size={14} /> Copy</button>
                        </div>
                      </div>
                      <div className="output-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown></div>
                    </div>
                  )}

                  {/* HUMANIZED OUTPUT */}
                  {activeTab === 'humanized' && (
                    <div className="output-box">
                      <div className="output-header">
                        <span className="output-label" style={{ color: '#4ade80' }}>
                          <Sparkles size={13} style={{ marginRight: 5 }} />Humanized Version
                        </span>
                        <div className="output-actions">
                          {humanized && (
                            <>
                              <button className="btn-copy" onClick={handleHumanize} disabled={humanizing}>
                                <RefreshCw size={13} /> Redo
                              </button>
                              <button className="btn-copy" onClick={() => copyText(humanized)}><Copy size={14} /> Copy</button>
                            </>
                          )}
                        </div>
                      </div>
                      {humanizing ? (
                        <div>
                          <div className="loading-shimmer" style={{ width: '85%' }} />
                          <div className="loading-shimmer" style={{ width: '65%' }} />
                          <div className="loading-shimmer" style={{ width: '75%' }} />
                          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>Removing AI patterns, adding human touch...</p>
                        </div>
                      ) : humanized ? (
                        <>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
                            padding: '6px 12px', background: 'rgba(74,222,128,0.08)',
                            border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, width: 'fit-content',
                          }}>
                            <Check size={13} color="#4ade80" />
                            <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700 }}>AI patterns removed · Sounds human</span>
                          </div>
                          <div className="output-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{humanized}</ReactMarkdown></div>
                        </>
                      ) : null}
                    </div>
                  )}

                  {/* A/B VARIANTS */}
                  {activeTab === 'variants' && (
                    <div>
                      {varLoading ? (
                        <div className="output-box">
                          <div className="loading-shimmer" style={{ width: '80%' }} />
                          <div className="loading-shimmer" style={{ width: '60%' }} />
                          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>Creating 2 completely different versions...</p>
                        </div>
                      ) : variants.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {variants.map((v, i) => (
                            <motion.div
                              key={i}
                              className="output-box"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                              style={{
                                borderLeft: `3px solid ${i === 0 ? '#a78bfa' : '#4ade80'}`,
                              }}
                            >
                              <div className="output-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{
                                    padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 800,
                                    background: i === 0 ? 'rgba(167,139,250,0.15)' : 'rgba(74,222,128,0.15)',
                                    color: i === 0 ? '#a78bfa' : '#4ade80',
                                    border: `1px solid ${i === 0 ? 'rgba(167,139,250,0.3)' : 'rgba(74,222,128,0.3)'}`,
                                  }}>
                                    {i === 0 ? 'VARIANT A' : 'VARIANT B'}
                                  </span>
                                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{v.label}</span>
                                </div>
                                <button className="btn-copy" onClick={() => copyText(v.content)}><Copy size={13} /> Copy</button>
                              </div>
                              <div className="output-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{v.content}</ReactMarkdown></div>
                            </motion.div>
                          ))}
                          <button
                            onClick={handleVariants}
                            style={{
                              padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                              background: 'var(--bg3)', border: '1px solid var(--border)',
                              color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit',
                              display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content',
                            }}
                          >
                            <RefreshCw size={13} /> Generate New Variants
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════
            TONE ANALYZER TAB
        ════════════════════════════════════════ */}
        {activeTab === 'analyzer' && (
          <motion.div key="analyzer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="tool-card">
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                padding: '10px 14px', background: 'rgba(96,165,250,0.08)',
                border: '1px solid rgba(96,165,250,0.2)', borderRadius: 10,
              }}>
                <ScanText size={16} color="#60a5fa" />
                <span style={{ fontSize: 13, color: '#60a5fa', fontWeight: 600 }}>Tone Analyzer</span>
                <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 4 }}>
                  Paste any text — AI tells you its tone, readability, engagement score &amp; more
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Paste text to analyze</label>
                <textarea
                  className="form-textarea"
                  rows="6"
                  placeholder="Paste any text here — your own content, competitor's copy, an email, a blog post... AI will analyze its tone, style, and give you actionable feedback."
                  value={analyzeText}
                  onChange={e => setAnalyzeText(e.target.value)}
                />
              </div>

              <button className="btn-generate" onClick={handleAnalyzeTone} disabled={analyzing}>
                {analyzing
                  ? <><Loader2 className="animate-spin" /> Analyzing...</>
                  : <><ScanText size={16} /> Analyze Tone &amp; Style</>}
              </button>

              {analyzing && (
                <div className="output-box" style={{ marginTop: 16 }}>
                  <div className="loading-shimmer" style={{ width: '70%' }} />
                  <div className="loading-shimmer" style={{ width: '50%' }} />
                  <div className="loading-shimmer" style={{ width: '60%' }} />
                </div>
              )}

              {toneReport && !analyzing && !toneReport.error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 16 }}>

                  {/* Top badges */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                    {[
                      { label: 'Primary Tone',    value: toneReport.primary_tone,  color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)' },
                      { label: 'Reading Level',   value: toneReport.reading_level, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.3)'  },
                      { label: 'Emotion',         value: toneReport.emotion,       color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)' },
                      { label: 'Writing Style',   value: toneReport.writing_style, color: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.3)'  },
                    ].map((b, i) => (
                      <div key={i} style={{
                        padding: '8px 14px', borderRadius: 10,
                        background: b.bg, border: `1px solid ${b.border}`,
                      }}>
                        <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{b.label}</div>
                        <div style={{ fontSize: 13, color: b.color, fontWeight: 700, marginTop: 3 }}>{b.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="aw-tone-grid">
                    {/* Scores */}
                    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>SCORES</div>
                      <ScoreBar label="Clarity"     value={toneReport.clarity_score}     color="#4ade80" />
                      <ScoreBar label="Engagement"  value={toneReport.engagement_score}  color="#60a5fa" />
                      <ScoreBar label="Formality"   value={toneReport.formality_score}   color="#a78bfa" />
                      <ScoreBar
                        label="AI Probability"
                        value={toneReport.ai_probability}
                        color={toneReport.ai_probability > 70 ? '#f87171' : toneReport.ai_probability > 40 ? '#fbbf24' : '#4ade80'}
                      />
                    </div>

                    {/* Tips & patterns */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>BEST SUITED FOR</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {(toneReport.best_suited_for || []).map((s, i) => (
                            <span key={i} style={{
                              padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                              background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa',
                            }}>{s}</span>
                          ))}
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>IMPROVEMENT TIPS</div>
                        {(toneReport.improvement_tips || []).map((tip, i) => (
                          <div key={i} style={{
                            fontSize: 12, color: 'var(--text)', padding: '6px 10px',
                            borderLeft: '2px solid #fbbf24', background: 'rgba(251,191,36,0.08)',
                            borderRadius: '0 6px 6px 0', marginBottom: 6, lineHeight: 1.5,
                          }}>
                            {tip}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Secondary tones + patterns */}
                  {toneReport.secondary_tones?.length > 0 && (
                    <div style={{ marginTop: 14, padding: 14, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>SECONDARY TONES &amp; PATTERNS</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {[...(toneReport.secondary_tones || []), ...(toneReport.detected_patterns || [])].map((t, i) => (
                          <span key={i} style={{
                            padding: '3px 10px', borderRadius: 12, fontSize: 11,
                            background: 'var(--bg2)', border: '1px solid var(--border)',
                            color: 'var(--text2)',
                          }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {toneReport?.error && (
                <div style={{ color: '#f87171', marginTop: 12, fontSize: 13 }}>{toneReport.error}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIWriter;