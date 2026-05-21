import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import {
  Search, Loader2, Copy, Download, RefreshCw,
  Target, TrendingUp, FileText, Layers, Globe,
  BarChart2, Zap, Check, AlertCircle, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadText } from '../utils/helpers';

// ── Strip markdown ────────────────────────────────────────────────────────────
const strip = (t = '') =>
  t.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s?/g, '')
   .replace(/`{1,3}/g, '').replace(/_{1,2}/g, '').trim();

// ── Score ring ────────────────────────────────────────────────────────────────
const ScoreRing = ({ score, label, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{
      width: 72, height: 72, borderRadius: '50%', margin: '0 auto 8px',
      border: `4px solid ${color}`,
      background: `${color}12`,
      boxShadow: `0 0 20px ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: 20, fontWeight: 800, color }}>{score}</span>
    </div>
    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{label}</div>
  </div>
);

// ── Tools config ──────────────────────────────────────────────────────────────
const TOOLS = [
  { id: 'keyword',  icon: Search,     label: 'Keyword Lab',       color: '#60a5fa', desc: 'Deep keyword research + intent + difficulty' },
  { id: 'serp',     icon: Globe,      label: 'SERP Simulator',    color: '#a78bfa', desc: 'Simulate how your page appears on Google' },
  { id: 'audit',    icon: BarChart2,  label: 'Content Scorer',    color: '#4ade80', desc: 'Score & fix your existing content for SEO' },
  { id: 'cluster',  icon: Layers,     label: 'Topic Clusters',    color: '#fbbf24', desc: 'Build full topic authority architecture' },
  { id: 'gap',      icon: Target,     label: 'Content Gap AI',    color: '#f97316', desc: 'Find what competitors rank for but you don\'t' },
  { id: 'meta',     icon: FileText,   label: 'Meta Forge',        color: '#f472b6', desc: 'Generate click-worthy titles & descriptions' },
  { id: 'schema',   icon: TrendingUp, label: 'Schema Generator',  color: '#22d3ee', desc: 'Generate JSON-LD structured data for rich snippets' },
];

// ── Main ──────────────────────────────────────────────────────────────────────
const SEOOptimizer = () => {
  const { activeModel, apiKey, providerKeys, customModels, showToast, saveToVault } = useContext(AppContext);

  const [activeTool, setActiveTool] = useState('keyword');
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState('');
  const [scores,     setScores]     = useState(null); // for content scorer

  // Shared inputs
  const [topic,       setTopic]       = useState('');
  const [url,         setUrl]         = useState('');
  const [competitors, setCompetitors] = useState('');
  const [lang,        setLang]        = useState('English');
  const [country,     setCountry]     = useState('Global');

  // Tool-specific
  const [content,     setContent]     = useState(''); // for audit
  const [metaTitle,   setMetaTitle]   = useState('');
  const [schemaType,  setSchemaType]  = useState('Article');

  const seed = () => Math.random().toString(36).slice(2, 8);

  // ── AI Call ──────────────────────────────────────────────────────────────────
  const run = async (system, userMsg) => {
    setLoading(true); setResult(''); setScores(null);
    try {
      const res = await callAI(system, userMsg, null, activeModel, apiKey, providerKeys, customModels);
      setResult(res);
      saveToVault?.('SEO Optimizer', `${activeTool} | ${topic || url}`, res);
      return res;
    } catch (e) {
      setResult('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── 1. KEYWORD LAB ──────────────────────────────────────────────────────────
  const runKeyword = async () => {
    if (!topic.trim()) { showToast('Enter your topic or keyword', 'warn'); return; }
    const s = seed();
    const system = `You are a senior SEO strategist with 15 years of experience. Session: ${s}.
Provide deep, actionable keyword research. Language: ${lang}. Target market: ${country}.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS (use plain text, no asterisks):

PRIMARY KEYWORD ANALYSIS
[Analyze the main keyword — search intent, competition level, opportunity score]

TOP 10 TARGET KEYWORDS
1. [keyword] | [intent: informational/commercial/transactional] | [difficulty: easy/medium/hard] | [opportunity: high/medium/low]
2. [repeat for 10 keywords]

LONG-TAIL GOLDMINES (Low competition, high intent)
[List 8 long-tail keywords that are easier to rank for]

LSI & SEMANTIC KEYWORDS
[List 10 semantically related terms Google expects to see in this content]

PEOPLE ALSO ASK — Questions to answer
[List 8 questions your content must answer]

CONTENT STRATEGY RECOMMENDATION
[2-3 sentences on the best approach to rank for this topic]

QUICK WIN OPPORTUNITIES
[3 specific tactics to start ranking faster]`;

    await run(system, `Target keyword/topic: "${topic}"\nCompetitors to beat: ${competitors || 'Not specified'}\nLanguage: ${lang}\nTarget country: ${country}\nSession: ${s}`);
  };

  // ── 2. SERP SIMULATOR ──────────────────────────────────────────────────────
  const runSERP = async () => {
    if (!topic.trim()) { showToast('Enter your page title or topic', 'warn'); return; }
    const s = seed();
    const system = `You are a Google search result expert and click-through rate specialist. Session: ${s}.
Simulate how this page would appear in Google search results and analyze its click appeal.

OUTPUT FORMAT (plain text, no markdown symbols):

CURRENT SERP PREVIEW
Title: [the title as it would appear — max 60 chars]
URL: [how the URL should look]  
Description: [the meta description as it would appear — max 160 chars]
Rich snippet: [any rich snippet that could appear — ratings, FAQ, etc]

CTR ANALYSIS
Current estimated CTR: [X%]
Industry average CTR for position 1: [X%]
Gap: [what you're missing]

WHAT GOOGLE USERS SEE
[Describe exactly what emotional/rational trigger this result hits for the searcher]

OPTIMIZED VERSION
Title: [new optimized title — power word + number + keyword]
Description: [new meta description — benefit + CTA + keyword]
Expected CTR improvement: [X%]
Reason: [why this version performs better]

TITLE ALTERNATIVES (test these)
Option A: [title]
Option B: [title]  
Option C: [title]

FEATURED SNIPPET OPPORTUNITY
[Can this page win a featured snippet? What format should the answer be?]`;

    await run(system, `Page topic/title: "${topic}"\nTarget keyword: "${topic}"\nCurrent URL: ${url || 'Not provided'}\nSession: ${s}`);
  };

  // ── 3. CONTENT SCORER ──────────────────────────────────────────────────────
  const runAudit = async () => {
    if (!content.trim() && !topic.trim()) { showToast('Paste your content or enter a topic', 'warn'); return; }
    const s = seed();

    const system = `You are an expert SEO content auditor. Session: ${s}.
Analyze the provided content and score it across multiple dimensions.

YOU MUST OUTPUT THIS EXACT FORMAT (no asterisks, no markdown):

SCORES
OVERALL: [0-100]
KEYWORD_DENSITY: [0-100]
READABILITY: [0-100]
STRUCTURE: [0-100]
SEMANTIC_COVERAGE: [0-100]
USER_INTENT: [0-100]

CRITICAL ISSUES
[List 3-5 most important problems hurting SEO — be specific]

QUICK WINS (fix today)
[List 5 specific, actionable improvements with expected impact]

MISSING KEYWORDS
[List 8 keywords/phrases this content should include but doesn't]

CONTENT GAPS
[What questions is the user asking that this content doesn't answer?]

STRUCTURE RECOMMENDATIONS
[H1, H2, H3 structure — what it should look like]

COMPETITOR ADVANTAGE
[What would make this content better than any competitor result]`;

    const res = await run(system, `Content to audit:\n"${content || topic}"\n\nTarget keyword: ${topic || 'extract from content'}\nLanguage: ${lang}\nSession: ${s}`);

    // Parse scores from response
    if (res) {
      const overall   = res.match(/OVERALL:\s*(\d+)/)?.[1];
      const keyword   = res.match(/KEYWORD_DENSITY:\s*(\d+)/)?.[1];
      const readabil  = res.match(/READABILITY:\s*(\d+)/)?.[1];
      const structure = res.match(/STRUCTURE:\s*(\d+)/)?.[1];
      const semantic  = res.match(/SEMANTIC_COVERAGE:\s*(\d+)/)?.[1];
      const intent    = res.match(/USER_INTENT:\s*(\d+)/)?.[1];
      if (overall) {
        setScores({
          overall:   parseInt(overall),
          keyword:   parseInt(keyword  || 70),
          readabil:  parseInt(readabil || 70),
          structure: parseInt(structure|| 70),
          semantic:  parseInt(semantic || 70),
          intent:    parseInt(intent   || 70),
        });
      }
    }
  };

  // ── 4. TOPIC CLUSTERS ──────────────────────────────────────────────────────
  const runCluster = async () => {
    if (!topic.trim()) { showToast('Enter your main topic', 'warn'); return; }
    const s = seed();
    const system = `You are a content strategist and SEO architect. Session: ${s}.
Build a complete topic cluster strategy that establishes full topical authority.

OUTPUT FORMAT (plain text, no asterisks or markdown symbols):

PILLAR PAGE (The Hub)
Topic: [main pillar page topic]
Target keyword: [primary keyword]
Goal: [what this page achieves]

CLUSTER PAGES (Spokes — these link back to pillar)
Cluster 1: [topic] | Keyword: [keyword] | Intent: [intent type]
Cluster 2: [topic] | Keyword: [keyword] | Intent: [intent type]
Cluster 3: [topic] | Keyword: [keyword] | Intent: [intent type]
Cluster 4: [topic] | Keyword: [keyword] | Intent: [intent type]
Cluster 5: [topic] | Keyword: [keyword] | Intent: [intent type]
Cluster 6: [topic] | Keyword: [keyword] | Intent: [intent type]
Cluster 7: [topic] | Keyword: [keyword] | Intent: [intent type]
Cluster 8: [topic] | Keyword: [keyword] | Intent: [intent type]

INTERNAL LINKING STRATEGY
[How pillar and cluster pages should link to each other]

CONTENT CALENDAR (production order)
Week 1: [which piece to create first and why]
Week 2: [next piece]
Week 3: [next piece]
Week 4: [next piece]

TOPICAL AUTHORITY SCORE
[Estimated months to achieve topical authority if this cluster is built]

QUICK WIN CLUSTER PAGE
[Which one cluster page would rank fastest and why]`;

    await run(system, `Main topic: "${topic}"\nCompetitors: ${competitors || 'Not specified'}\nTarget language: ${lang}\nMarket: ${country}\nSession: ${s}`);
  };

  // ── 5. CONTENT GAP AI ──────────────────────────────────────────────────────
  const runGap = async () => {
    if (!topic.trim()) { showToast('Enter your website topic or niche', 'warn'); return; }
    const s = seed();
    const system = `You are a competitive SEO analyst specializing in content gap analysis. Session: ${s}.
Find what competitors likely rank for that the user is missing.

OUTPUT FORMAT (plain text only, no asterisks):

CONTENT GAP SUMMARY
[2 sentences describing the overall opportunity]

HIGH-VALUE GAPS (your competitors rank, you don't)
Gap 1: [keyword/topic] | Estimated monthly searches: [number] | Difficulty: [easy/medium/hard]
Gap 2: [keyword/topic] | Estimated monthly searches: [number] | Difficulty: [easy/medium/hard]
Gap 3: [keyword/topic] | Estimated monthly searches: [number] | Difficulty: [easy/medium/hard]
Gap 4: [keyword/topic] | Estimated monthly searches: [number] | Difficulty: [easy/medium/hard]
Gap 5: [keyword/topic] | Estimated monthly searches: [number] | Difficulty: [easy/medium/hard]

QUICK WIN GAPS (easy to rank, high value)
[List 5 lower-competition topics you could rank for in 30-60 days]

CONTENT TYPES YOU'RE MISSING
[What formats are performing well for competitors that you haven't tried?]

FEATURED SNIPPET OPPORTUNITIES
[3 questions where competitors have snippets you could steal]

30-DAY ACTION PLAN
[Prioritized list of content to create this month to close the biggest gaps]

ESTIMATED TRAFFIC OPPORTUNITY
[If you closed these gaps, estimated additional monthly organic traffic]`;

    await run(system, `My website/niche: "${topic}"\nMain competitors: ${competitors || 'Top industry competitors'}\nLanguage: ${lang}\nMarket: ${country}\nSession: ${s}`);
  };

  // ── 6. META FORGE ──────────────────────────────────────────────────────────
  const runMeta = async () => {
    if (!topic.trim()) { showToast('Enter your page topic or keyword', 'warn'); return; }
    const s = seed();
    const system = `You are a conversion copywriter specialized in Google search CTR optimization. Session: ${s}.
Generate multiple high-performing meta title and description options.

OUTPUT FORMAT (plain text, no asterisks):

OPTION 1 — Power + Number
Title: [title with power word and number — max 60 chars]
Description: [benefit-driven description with CTA — max 160 chars]
CTR prediction: [high/medium] | Emotion: [curiosity/urgency/benefit]

OPTION 2 — Question Format
Title: [question-based title]
Description: [answer-teasing description]
CTR prediction: [high/medium] | Emotion: [curiosity/problem-solving]

OPTION 3 — Benefit Forward
Title: [leading with the main benefit]
Description: [specific outcome + social proof element]
CTR prediction: [high/medium] | Emotion: [desire/aspiration]

OPTION 4 — Urgency/FOMO
Title: [urgency or exclusivity angle]
Description: [scarcity or time-sensitive description]
CTR prediction: [high/medium] | Emotion: [urgency/fomo]

OPTION 5 — Local/Specific
Title: [highly specific, long-tail friendly title]
Description: [detailed, specific description for high-intent searchers]
CTR prediction: [high/medium] | Emotion: [trust/specificity]

BEST PICK
[Which option to use and why — based on search intent for this keyword]

OG TITLE (for social sharing)
[Optimized Open Graph title for social media clicks]

TWITTER CARD DESCRIPTION  
[140-char Twitter-optimized description]`;

    await run(system, `Page topic: "${topic}"\nCurrent title: ${metaTitle || 'Not provided'}\nTarget keyword: ${topic}\nLanguage: ${lang}\nMarket: ${country}\nSession: ${s}`);
  };

  // ── 7. SCHEMA GENERATOR ────────────────────────────────────────────────────
  const runSchema = async () => {
    if (!topic.trim()) { showToast('Enter your page topic', 'warn'); return; }
    const s = seed();
    const system = `You are a technical SEO expert specializing in structured data and rich snippets. Session: ${s}.
Generate production-ready JSON-LD schema markup.

OUTPUT:
1. First explain WHY this schema type is best for this content (2 sentences, plain text)
2. Then provide the complete JSON-LD code block
3. Then list which rich snippet features this will unlock in Google
4. Then provide one additional schema type that would complement this one

Make all values realistic and helpful — not placeholder text. Base them on the topic provided.`;

    await run(system, `Page topic: "${topic}"\nSchema type requested: ${schemaType}\nURL: ${url || 'https://example.com/page'}\nLanguage: ${lang}\nSession: ${s}`);
  };

  // ── Handle generate ────────────────────────────────────────────────────────
  const handleGenerate = () => {
    const handlers = { keyword: runKeyword, serp: runSERP, audit: runAudit, cluster: runCluster, gap: runGap, meta: runMeta, schema: runSchema };
    handlers[activeTool]?.();
  };

  const activeTool_ = TOOLS.find(t => t.id === activeTool);

  // ── Score color ────────────────────────────────────────────────────────────
  const sc = (v) => v >= 70 ? '#4ade80' : v >= 40 ? '#fbbf24' : '#f87171';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page active">
      <div className="section-header">
        <h2 className="section-title">🔍 SEO Optimizer</h2>
        <div className="section-sub">7 AI-powered SEO tools — Keyword Lab · SERP Simulator · Content Scorer · Topic Clusters · Gap AI · Meta Forge · Schema</div>
      </div>

      {/* Tool selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
        {TOOLS.map(t => {
          const Icon = t.icon;
          const isActive = activeTool === t.id;
          return (
            <motion.div key={t.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setActiveTool(t.id); setResult(''); setScores(null); }}
              style={{
                padding: '12px 10px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                border: `1.5px solid ${isActive ? t.color : 'rgba(255,255,255,0.1)'}`,
                background: isActive ? `${t.color}14` : 'rgba(255,255,255,0.03)',
                boxShadow: isActive ? `0 4px 16px ${t.color}25` : 'none',
                transition: 'all 0.2s',
              }}>
              <Icon size={20} color={isActive ? t.color : 'rgba(255,255,255,0.4)'} style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? t.color : 'rgba(255,255,255,0.6)', lineHeight: 1.3 }}>{t.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Tool description */}
      <div style={{ padding: '10px 14px', marginBottom: 16, background: `${activeTool_?.color}10`, border: `1px solid ${activeTool_?.color}30`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        {activeTool_ && React.createElement(activeTool_.icon, { size: 15, color: activeTool_?.color })}
        <span style={{ fontSize: 13, fontWeight: 600, color: activeTool_?.color }}>{activeTool_?.label}</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>{activeTool_?.desc}</span>
      </div>

      {/* Inputs */}
      <div className="tool-card">
        <AnimatePresence mode="wait">
          <motion.div key={activeTool} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            {/* Main topic/keyword input — all tools */}
            <div className="form-group">
              <label className="form-label">
                {activeTool === 'audit' ? 'Target Keyword (for this content)' :
                 activeTool === 'serp'  ? 'Page Title or Topic' :
                 activeTool === 'meta'  ? 'Page Topic or Target Keyword' :
                 activeTool === 'schema'? 'Page Topic or Content Title' :
                 activeTool === 'gap'   ? 'Your Website Topic / Niche' :
                 'Target Keyword or Topic'}
              </label>
              <input className="form-input"
                placeholder={
                  activeTool === 'audit'   ? 'e.g. best project management tools for startups' :
                  activeTool === 'serp'    ? 'e.g. Best CRM Software for Small Business 2025' :
                  activeTool === 'meta'    ? 'e.g. project management tools for remote teams' :
                  activeTool === 'schema'  ? 'e.g. How to make sourdough bread at home' :
                  activeTool === 'gap'     ? 'e.g. email marketing software, SaaS productivity tools' :
                  activeTool === 'cluster' ? 'e.g. content marketing, digital marketing, SEO' :
                  'e.g. best CRM software for small business'
                }
                value={topic} onChange={e => setTopic(e.target.value)}
              />
            </div>

            {/* Content textarea — audit only */}
            {activeTool === 'audit' && (
              <div className="form-group">
                <label className="form-label">Paste Your Content to Score</label>
                <textarea className="form-textarea" rows="6"
                  placeholder="Paste your blog post, page content, or article here... AI will score it across 6 dimensions and give specific improvement recommendations."
                  value={content} onChange={e => setContent(e.target.value)} />
              </div>
            )}

            {/* URL input — serp, schema */}
            {(activeTool === 'serp' || activeTool === 'schema') && (
              <div className="form-group">
                <label className="form-label">Your Page URL (optional)</label>
                <input className="form-input" placeholder="https://yourwebsite.com/page"
                  value={url} onChange={e => setUrl(e.target.value)} />
              </div>
            )}

            {/* Current title — meta */}
            {activeTool === 'meta' && (
              <div className="form-group">
                <label className="form-label">Current Title (optional — for comparison)</label>
                <input className="form-input" placeholder="e.g. Project Management Tools | MyBrand"
                  value={metaTitle} onChange={e => setMetaTitle(e.target.value)} />
              </div>
            )}

            {/* Schema type — schema */}
            {activeTool === 'schema' && (
              <div className="form-group">
                <label className="form-label">Schema Type</label>
                <select className="form-select" value={schemaType} onChange={e => setSchemaType(e.target.value)}>
                  <option>Article</option>
                  <option>BlogPosting</option>
                  <option>Product</option>
                  <option>FAQPage</option>
                  <option>HowTo</option>
                  <option>LocalBusiness</option>
                  <option>Review</option>
                  <option>Recipe</option>
                  <option>Event</option>
                  <option>Person</option>
                  <option>Organization</option>
                  <option>VideoObject</option>
                  <option>Course</option>
                  <option>JobPosting</option>
                </select>
              </div>
            )}

            {/* Competitors — keyword, cluster, gap */}
            {(activeTool === 'keyword' || activeTool === 'cluster' || activeTool === 'gap') && (
              <div className="form-group">
                <label className="form-label">Main Competitors (optional)</label>
                <input className="form-input" placeholder="e.g. hubspot.com, salesforce.com, monday.com"
                  value={competitors} onChange={e => setCompetitors(e.target.value)} />
              </div>
            )}

            {/* Language + Country */}
            <div className="form-row cols2">
              <div className="form-group">
                <label className="form-label">Language</label>
                <select className="form-select" value={lang} onChange={e => setLang(e.target.value)}>
                  <option>English</option><option>Hindi</option><option>Spanish</option>
                  <option>French</option><option>German</option><option>Portuguese</option>
                  <option>Arabic</option><option>Japanese</option><option>Chinese</option>
                  <option>Italian</option><option>Dutch</option><option>Russian</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Target Market</label>
                <select className="form-select" value={country} onChange={e => setCountry(e.target.value)}>
                  <option>Global</option><option>United States</option><option>India</option>
                  <option>United Kingdom</option><option>Canada</option><option>Australia</option>
                  <option>Germany</option><option>France</option><option>Brazil</option>
                  <option>Japan</option><option>UAE</option><option>Singapore</option>
                </select>
              </div>
            </div>

          </motion.div>
        </AnimatePresence>

        <button className="btn-generate" onClick={handleGenerate} disabled={loading}
          style={{ background: `linear-gradient(135deg, ${activeTool_?.color || '#60a5fa'}, ${activeTool_?.color || '#60a5fa'}99)` }}>
          {loading
            ? <><Loader2 className="animate-spin" /> Analyzing with AI...</>
            : <><Zap size={16} /> Run {activeTool_?.label}</>}
        </button>

        {/* Loading */}
        {loading && (
          <div style={{ marginTop: 16 }}>
            <div className="loading-shimmer" style={{ width: '90%', marginBottom: 8 }} />
            <div className="loading-shimmer" style={{ width: '75%', marginBottom: 8 }} />
            <div className="loading-shimmer" style={{ width: '85%', marginBottom: 8 }} />
            <div className="loading-shimmer" style={{ width: '60%' }} />
          </div>
        )}

        {/* Content Scores */}
        {scores && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: 20, padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 20, textAlign: 'center' }}>
              CONTENT SEO SCORES
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
              <ScoreRing score={scores.overall}   label="Overall"    color={sc(scores.overall)} />
              <ScoreRing score={scores.keyword}   label="Keywords"   color={sc(scores.keyword)} />
              <ScoreRing score={scores.readabil}  label="Readability"color={sc(scores.readabil)} />
              <ScoreRing score={scores.structure} label="Structure"  color={sc(scores.structure)} />
              <ScoreRing score={scores.semantic}  label="Semantic"   color={sc(scores.semantic)} />
              <ScoreRing score={scores.intent}    label="Intent"     color={sc(scores.intent)} />
            </div>
          </motion.div>
        )}

        {/* Result */}
        {result && !loading && (
          <motion.div className="output-box" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: 16, borderLeft: `3px solid ${activeTool_?.color || '#60a5fa'}` }}>
            <div className="output-header">
              <span className="output-label" style={{ color: activeTool_?.color }}>
                ✓ {activeTool_?.label} Complete
              </span>
              <div className="output-actions">
                <button className="btn-copy" onClick={() => { downloadText(result, `seo_${activeTool}.txt`); showToast('Downloaded!'); }}>
                  <Download size={14} /> Download
                </button>
                <button className="btn-copy" onClick={() => { navigator.clipboard.writeText(result); showToast('Copied!'); }}>
                  <Copy size={14} /> Copy
                </button>
                <button className="btn-copy" onClick={handleGenerate}>
                  <RefreshCw size={13} /> Regenerate
                </button>
              </div>
            </div>
            <div className="output-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SEOOptimizer;