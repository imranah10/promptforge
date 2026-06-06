
import React, { useState, useRef, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Copy, Check, Globe, Loader2, RefreshCw, X, Menu } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';

// ── 20 LANGUAGES + OTHER ──────────────────────────────────────────────────────
const LANGS = [
  { code:'en',    label:'🇺🇸 English',            name:'English' },
  { code:'hi',    label:'🇮🇳 हिंदी',              name:'Hindi' },
  { code:'es',    label:'🇪🇸 Español',            name:'Spanish' },
  { code:'zh',    label:'🇨🇳 中文',               name:'Chinese (Simplified)' },
  { code:'ar',    label:'🇸🇦 العربية',            name:'Arabic' },
  { code:'pt',    label:'🇧🇷 Português',          name:'Portuguese' },
  { code:'fr',    label:'🇫🇷 Français',           name:'French' },
  { code:'de',    label:'🇩🇪 Deutsch',            name:'German' },
  { code:'ja',    label:'🇯🇵 日本語',             name:'Japanese' },
  { code:'ru',    label:'🇷🇺 Русский',            name:'Russian' },
  { code:'ko',    label:'🇰🇷 한국어',             name:'Korean' },
  { code:'it',    label:'🇮🇹 Italiano',           name:'Italian' },
  { code:'tr',    label:'🇹🇷 Türkçe',            name:'Turkish' },
  { code:'nl',    label:'🇳🇱 Nederlands',         name:'Dutch' },
  { code:'pl',    label:'🇵🇱 Polski',             name:'Polish' },
  { code:'vi',    label:'🇻🇳 Tiếng Việt',         name:'Vietnamese' },
  { code:'id',    label:'🇮🇩 Bahasa Indonesia',   name:'Indonesian' },
  { code:'bn',    label:'🇧🇩 বাংলা',              name:'Bengali' },
  { code:'ur',    label:'🇵🇰 اردو',              name:'Urdu' },
  { code:'sw',    label:'🌍 Swahili',             name:'Swahili' },
  { code:'other', label:'🌐 Other language...',   name:'' },
];

// ── NAV SECTIONS ──────────────────────────────────────────────────────────────
const NAV = [
  { label:'GETTING STARTED', items:[
    { id:'intro',   label:'What is PromptForge?' },
    { id:'setup',   label:'Quick Setup (2 min)' },
    { id:'models',  label:'API Keys & Models' },
  ]},
  { label:'STUDIO TOOLS', items:[
    { id:'optimizer',  label:'🎯 Prompt Optimizer' },
    { id:'aiwriter',   label:'✍️ AI Writer' },
    { id:'codehelper', label:'💻 Code Helper' },
    { id:'datawizard', label:'🧙 Data Wizard' },
    { id:'spider',     label:'🕷️ The Spider' },
    { id:'chatdata',   label:'💬 Chat With Data' },
    { id:'inventor',   label:'💡 The Inventor' },
  ]},
  { label:'CREATOR & SEO', items:[
    { id:'creator', label:'🎨 Creator Studio' },
    { id:'seo',     label:'🔍 SEO Optimizer' },
    { id:'compare', label:'⚖️ Model Compare' },
  ]},
  { label:'UTILITIES', items:[
    { id:'library', label:'📚 Prompt Library' },
    { id:'vault',   label:'💾 History Vault' },
    { id:'apikeys', label:'🔑 API Keys' },
  ]},
  { label:'HELP', items:[
    { id:'tips',   label:'⚡ Pro Tips & Combos' },
    { id:'errors', label:'🛠️ Troubleshooting' },
  ]},
];

// ── FULL ENGLISH DOCS CONTENT (plain text, structured) ───────────────────────
const ENGLISH_DOCS = `
=== What is PromptForge? ===
PromptForge is a free AI workspace with 11 specialized tools. Each tool is built for a specific job. You bring your own API key from OpenAI, Anthropic, Groq, or other providers. PromptForge connects directly to that provider. No subscription. No data goes to any server.

Key features:
- Bring Your Own Key (BYOK): OpenAI, Anthropic, Groq, Gemini, OpenRouter — any provider. You pay them directly.
- 11 Expert Tools: Each tool has its own expert AI prompt — not generic chat.
- History Vault: All outputs save locally. Never lost.
- Free to Start: Create a free OpenRouter account, use Llama 3.3 for free.

=== Quick Setup (2 Minutes) ===
Step 1 — Click API Keys in the left sidebar.
Step 2 — Free option with OpenRouter: Go to openrouter.ai, create a free account, copy your API key, paste it in PromptForge under OpenRouter, click Save.
Step 3 — Select your model: Click "Change Model / API Key" at the top of any page. For free usage select: meta-llama/llama-3.3-70b-instruct:free
Step 4 — Open any tool and start!

Best free combo: OpenRouter key + Llama 3.3 70B (free) = all 11 tools completely free.

=== API Keys & Models ===
PromptForge supports 6 providers. You can add more than one and switch between them.

OpenAI — key format: sk-... — No free tier — Best for: GPT-4o, best all-around quality
Anthropic — key format: sk-ant-... — No free tier — Best for: Claude, reasoning and writing
Groq — key format: gsk_... — Free tier available — Best for: Llama 3.3, fastest free option
Google Gemini — key format: AIza... — Free tier available — Best for: long documents
OpenRouter — key format: sk-or-... — Many free models — Best for: beginners, 100+ models
Mistral — No free tier — Best for: European models, fast and cheap

Your keys are stored only in your browser localStorage with AES-GCM encryption. Never sent to any server.

=== Prompt Optimizer ===
What it does: Turns weak or vague prompts into expert-level prompts. Uses the CREATE framework: Character (who the AI should be), Request (what you want), Examples, Adjustments, Type (format), Extras.

Features:
- 6 Quick Templates: Blog Post, Cold Email, Fix Code, Instagram, Summarize, Ad Copy
- Intensity Slider (0-100): Low = gentle fix, High = complete expert rewrite
- Strength Score (0-100%): Shows how strong the forged prompt is
- Weaknesses Panel: Exactly what was wrong with the original
- Test It Button: Run the forged prompt live on your active model
- Refine Again: AI improves its own output up to 3 times

How to use:
1. Choose a template or type your own prompt
2. Set intensity (70-80 for most tasks, 90-100 for maximum power)
3. Click Forge Prompt
4. Click Test It to see the actual output
5. Click Refine Again if needed

Example — paste this weak prompt: "write a blog post about AI" — set intensity to 85 — click Forge Prompt. The result will specify: journalist persona, 800-word target, CTO audience, H2 structure required. Score will be 80-95%.

=== AI Writer ===
What it does: Creates content in 20 types, 16 languages, with humanizer, A/B variants, and tone analyzer.

4 Modes:
- Generate: Creates content from scratch based on type, tone, topic, language, and audience
- Humanizer: Removes AI patterns (no "delve", "moreover", em-dashes). Makes content pass AI detection.
- A/B Variants: Creates 3 different versions with different angles, tones, and approaches
- Tone Analyzer: Scores any text on 6 dimensions plus AI Probability percentage

20 Content Types include: Blog post, Cold email, LinkedIn post, Twitter thread, Product description, Cover letter, Professional bio, Ad copy, Sales page, YouTube script, Newsletter, SEO meta tags, Instagram caption, TikTok script, Press release, and more.

10 Tones: Professional, Friendly, Persuasive, Humorous, Authoritative, Empathetic, Inspirational, Casual, Educational, Urgent.

How to use:
1. Select content type from dropdown
2. Write your topic in the field
3. Set tone and language
4. Click Generate
5. Go to Humanizer tab and paste the output before publishing
6. Try A/B Variants tab for 3 different angle options

Important: Always run Humanizer before publishing. Without it, AI detection tools may flag your content.

=== Code Helper ===
What it does: Fixes, explains, optimizes, and tests code in 18 languages. Also generates Git commits and runs security audits.

Tab 1 — Code Helper with 8 tasks:
- Fix / Debug: Finds all bugs with exact line references and explanation plus complete fixed code
- Explain this code: Overview, key functions, logic flow, edge cases in 4 clear sections
- Write from scratch: Production-ready code with error handling, comments, and type hints
- Convert to another language: Exact logic preserved, target language conventions followed
- Optimize performance: Big-O analysis before and after plus optimized version
- Write unit tests: Happy path plus edge cases plus error cases
- Review code quality: Score 1-10 for Readability, Maintainability, Performance, Security, Best Practices
- Refactor / Clean up: DRY, SOLID principles with better naming and every change explained

Tab 2 — Git Commit Generator: Paste your code or describe what changed. AI generates commits in 3 styles: Concise, Standard (recommended), and Detailed with breaking change notes.

Tab 3 — Security Auditor: Paste any code. AI returns overall Security Score (0-100) with severity badge, every vulnerability with exact line number and fix, and a complete secure version of the code.

18 Supported Languages: JavaScript, TypeScript, Python, Java, C++, C#, Go, Rust, PHP, Ruby, Swift, Kotlin, R, SQL, HTML/CSS, Bash/Shell, Solidity, YAML/Config.

Example — paste this code and choose Fix/Debug with JavaScript:
function calculateTotal(items) {
  let total = 0
  for (let i = 0; i <= items.length; i++) {
    total += items[i].price
  }
  return total
}
AI will find: off-by-one error, missing null check, no input validation — and return complete fixed version.

=== Data Wizard ===
What it does: Generates SQL, Python, Excel formulas, RegEx, R, DAX, MongoDB, and more with audit trail.

10 Artifact Types:
- SQL Query: JOINs, CTEs, index hints, BigQuery/Postgres/Snowflake dialects
- Excel / Sheets Formula: XLOOKUP, LET(), array formulas, named ranges
- Python (Pandas/NumPy): Vectorization, dtype optimization, ETL pipelines
- Regular Expression: Pattern analysis, named groups, all engines
- Data Visualization: Plotly/Matplotlib/Seaborn chart code
- DAX / Power BI: Filter context, VAR/RETURN pattern, VertiPaq
- R Script: Statistical analysis, tidyverse pipes, ggplot2
- Shell / AWK / Sed: Log processing, automation pipelines
- JSON / GraphQL: N+1 prevention, fragments, DataLoader
- MongoDB / NoSQL: Aggregation pipeline, Atlas Search

4 Optimization Modes:
- Speed: Pure performance, vectorize everything, indexes first
- Balanced: Performance plus clean code mix
- Readable: Detailed comments, descriptive names — for learning
- Enterprise: Type hints, error handling, logging, docstrings

Advanced Configuration: Click it to reveal Schema/Structure field (paste your real table columns) and Sample Data field (paste 2-3 rows). AI uses your actual data instead of guessing.

After every generation an Audit Panel shows: Complexity score, Security status, Scalability estimate, and Efficiency percentage.

Example: Type SQL Query, Mode Enterprise, open Advanced Config, paste schema: orders(id INT, customer_id INT, amount DECIMAL, created_at TIMESTAMP, status VARCHAR), then ask for monthly revenue for last 6 months with month-over-month growth percentage.

=== The Spider ===
What it does: Scrapes real live web content using Jina AI. Supports URL mode and Search mode. 6 output formats. History of 25 searches. Follow-up Q&A on extracted data.

2 Input Types:
- URL Mode: Paste any URL like https://openai.com — scrapes that specific page
- Search Mode: Type any topic like "React vs Vue 2025" — searches the web

6 Output Modes:
- Intelligence Dossier: Deep 800+ word report with headers, tables, stats, sources, executive summary
- Quick Summary: TL;DR plus Key Facts plus Critical Numbers plus Who's Involved plus Bottom Line
- Compare and Contrast: Structured comparison table with recommendation section
- Technical Extract: Code samples, API endpoints, docs, version numbers, config examples
- Timeline Analysis: Chronological events with dates on left, key milestones highlighted
- Entity Map: Tables of People with names and roles, Organizations, Technologies

Quick vs Deep:
- Quick (1 pass): Fast, good for simple lookups
- Deep (2 passes): Slower but much richer — for research and comprehensive reports

3 Result Tabs:
- Report tab: AI-synthesized intelligence in your chosen mode
- Follow-up tab: 3 AI-suggested questions plus your own custom question. AI answers instantly from scraped data.
- Raw Feed tab: Actual raw text before AI processing. Copy and Download buttons included.

History saves last 25 searches. Click any item in the Recent dropdown to restore it fully — query, mode, result, raw content, and follow-ups all come back.

Cancel: Click the red Cancel button anytime during scraping to stop immediately.

=== Chat With Data ===
What it does: Upload CSV, PDF, JSON, images and have a full conversation. Charts, stat cards, and knowledge graphs appear automatically.

Supported File Types:
- CSV, TXT, JSON, XML, MD, JS, SQL: Full text read up to 800,000 characters
- PDF: Text extracted from all pages, up to 50 pages
- Images (PNG, JPG, JPEG): OCR with Tesseract.js extracts all text automatically
- Multiple files together: AI cross-references all files at once

8 Quick Action Chips (appear after upload):
Summarize, Key Stats, Find Anomalies, Trends, Compare, SQL Queries, Visualize, Export Plan. Click any chip — no typing needed.

Right Side Visualization Panel:
- Charts tab: Area, Bar, Line, or Pie chart — AI picks the best type automatically
- Stats tab: Key metric cards with values and change percentage indicators
- Mesh tab: Knowledge graph showing entities and their relationships

Session Save/Load: Click Save Session to store everything in localStorage. Load Session later to restore charts and stats too.

=== The Inventor ===
What it does: 4 AI agents debate your idea in real-time. Then a 5th agent synthesizes a complete Master Blueprint with 30-60-90 day action plan.

The 5 Agents:
- The Visionary (CEO/Strategy): Big picture, market opportunity, inspiring pitch
- The Hacker (CTO/Growth): Technical shortcuts, viral loops, unfair advantages, real technical flaws
- The Analyst (CFO/Data): TAM, CAC, LTV, MRR targets, 3-year revenue projections
- The Critic (Risk/Devil's Advocate): Exactly 5 reasons this will fail plus one-line fix for each
- Master Blueprint (Final Synthesis): Mission, growth hacks, metrics dashboard, risk mitigation, 30-60-90 day plan

Each agent reads all previous agents' responses before writing theirs. The Critic can challenge The Visionary directly.

How to use:
1. Type your goal or business idea in the text box. More detail = better results.
2. Click Start Board Session
3. Watch all 5 agents respond in real-time (takes 5-10 minutes)
4. Read the Master Blueprint at the end — especially the 30-60-90 day milestones
5. Download as .md file or Save to Vault

Cancel: Click the red Stop button in the progress bar to stop the debate at any time.

History: Last 8 blueprints are saved. Click History button in header, then click Restore to bring back any previous blueprint instantly.

Example goal: AI-powered resume builder SaaS for Indian job seekers targeting Tier 2 cities

=== Creator Studio ===
What it does: Creates viral social media content for 8 platforms. Captions, hooks, 7-day calendar, and competitor analysis.

8 Supported Platforms: Instagram, YouTube, TikTok, Twitter/X, LinkedIn, Facebook, WhatsApp, Pinterest.

4 Tabs:
- Generate: Creates platform-specific content. Options change per platform. Set Content Goal (Viral/Educational/Promotional), Format (Caption/Script/Thread), Tone, and Topic.
- Viral Hooks: Generates 5 hooks in 5 different styles — Question, Shocking Stat, Story, Controversy, Challenge. Each has a copy button.
- 7-Day Calendar: Full week schedule with day, best posting time, content type, caption, hashtags, and pro tip. Download as CSV.
- Beat Competitor: Paste a competitor URL. Spider scrapes it, AI finds gaps — what they are NOT covering. That becomes your content opportunity.

How to use:
1. Select your platform from the top grid
2. Fill in your Topic/Niche/Product field
3. Generate tab: set Content Goal and Format, click Generate
4. Viral Hooks tab: same topic auto-fills, get 5 different style hooks
5. Content Calendar: confirm niche, click Generate Calendar, download CSV
6. Beat Competitor: paste competitor URL, find their content gaps

=== SEO Optimizer ===
What it does: 7 SEO tools in one. Keyword research, SERP preview, content scoring, topic clusters, gap analysis, meta generation, and schema markup.

Note: This is AI-estimated data — not from live APIs like Ahrefs or Semrush. Estimates are directionally accurate.

The 7 Tools:

1. Keyword Lab — Enter your seed keyword. You get: 10+ target keywords with intent, difficulty, and opportunity scores; long-tail low-competition keywords; LSI and semantic keywords; 8 People Also Ask questions; content strategy recommendation.

2. SERP Simulator — Enter page title and URL. You get a live Google-style preview plus CTR analysis, 5 optimized title alternatives, and featured snippet opportunity assessment.

3. Content Scorer — Paste your existing article. You get scores (0-100) on 6 dimensions: Overall, Keyword Density, Readability, Structure, Semantic Coverage, User Intent. Plus critical issues list, quick wins, missing keywords, content gaps, and structure recommendations.

4. Topic Clusters — Enter main topic. You get: 1 pillar page plus 8 cluster pages architecture, internal linking strategy, 4-week content calendar, and which cluster page will rank fastest.

5. Content Gap AI — Enter your niche and competitor URLs. You get: keywords competitors rank for that you don't, quick wins for 30-60 days, missing content types, featured snippet opportunities, and a 30-day action plan.

6. Meta Forge — Enter page topic. You get 5 title options in different styles (Power+Number, Question, Benefit, Urgency, Specific) with character count showing 60-character limit, CTR prediction, and emotion type. Plus OG title and Twitter card description.

7. Schema Generator — Choose from 19 schema types. You get: why this schema is best, complete JSON-LD with individual Copy JSON button, which rich snippets it unlocks, plus a complementary schema suggestion with its own JSON-LD.

Session History: Last 20 runs saved. Click History button top-right to restore any previous result. Each tool's state is saved separately.

=== Model Compare ===
What it does: Run the same prompt on 2 models simultaneously. Compare response time, token count, cost estimate, and get an AI Judge verdict.

How to use:
1. Select Model A and Model B from dropdowns
2. Choose from 5 preset prompts or type your own
3. Both models run in parallel — responses appear side by side
4. Read the AI Judge verdict: winner, reasoning, each model's strengths, and recommendation for this task type

Each response shows: Response time in milliseconds, approximate token count, approximate cost in USD, and Winner badge if selected.

Pro tip: Compare free Llama vs paid GPT-4o. If quality is similar for your task, use Llama and save money.

=== Prompt Library ===
What it does: 60+ expert prompts in 6 categories. Filter, search, favorite, and copy in one click.

6 Categories: Writing (10+), Marketing (10+), Coding (10+), Business (10+), Education (10+), Creative (10+).

How to use:
1. Click a category pill at the top to filter
2. Use the search box to find specific prompts
3. Click the star to add to Favorites — saved locally
4. Click Copy and Use — prompt goes to clipboard, paste anywhere

Best combo: Copy from Prompt Library, paste into Prompt Optimizer, Forge it — get a 10x better version of an already good prompt.

=== API Keys (Settings) ===
How to add a key:
1. Click API Keys in the sidebar
2. Select your provider tab (OpenAI, Anthropic, Groq, Gemini, OpenRouter, Mistral)
3. Paste your API key in the field
4. Click Save

Security: Keys are stored only in your browser localStorage with AES-GCM encryption. PromptForge server never receives your keys. Requests go directly from your browser to the AI provider.

Warning: If you clear your browser's site data, keys will be deleted. Keep a backup of your keys.

=== History Vault ===
What it does: Saves all your tool outputs permanently in browser IndexedDB. Never sent anywhere.

Features:
- Save: Click Save button in any tool to store output with tool name and topic tag
- Search: Search keywords across all saved items
- Filter by Tool: See only DataWizard outputs, or only AI Writer outputs
- Restore: Click any saved item to reload it in that tool
- Copy: Copy any saved result to clipboard instantly
- Delete: Delete individual items or clear all

Tip: Use Vault especially for The Inventor blueprints and Data Wizard outputs. A 5-agent debate takes 10 minutes — save it so you never have to run it again.

=== Pro Tips and Power Combos ===

Spider + Chat With Data: Research a topic with Spider, click Send to Chat, then ask deep questions about the same data.

Data Wizard + Chat With Data: Build SQL in Data Wizard, run it in your database, export CSV, upload to Chat With Data for analysis.

Prompt Optimizer + AI Writer: Optimize your content brief first, then use the forged prompt in AI Writer.

Model Compare + Key Selection: Find the best model for your task type, then set it as default to save money.

Prompt Library + Optimizer: Copy a library prompt, paste into Optimizer, Forge it — best combo.

SEO Full Workflow: Keyword Lab first, then Topic Clusters, then Content Scorer on your draft, then Meta Forge, then Schema Generator.

Inventor + Vault: Run the 5-agent debate, save Master Blueprint to Vault, restore anytime without re-running.

Best free setup: Create a free account at openrouter.ai, copy your key, paste in PromptForge API Keys, select model meta-llama/llama-3.3-70b-instruct:free — all 11 tools work completely free.

=== Troubleshooting ===

API Key for model is missing — Fix: Go to Settings, API Keys, add the key for that provider.

401 Unauthorized — Fix: Check if your key is correct and has remaining credits.

429 Rate Limited — Fix: Wait 30-60 seconds or switch to a different model.

Connection Blocked or Failed to fetch — Fix: Disable ad-blocker for this site, or temporarily turn off VPN.

Spider: No data retrieved — Fix: Try a specific URL with https://, or use a more specific search term.

PDF not extracting — Fix: Wait 3-5 seconds after page load then re-upload the PDF.

Charts not appearing in Chat — Fix: Ask explicitly for statistics or click the Key Stats chip.

Output has asterisk symbols — Fix: This is a display issue. Copy the text and paste it in another tool.

Response is very slow — Fix: Switch to Groq/Llama 3.3 for speed, or reduce input size.

History Vault is empty — Fix: You must manually click Save button in each tool. Auto-save is not enabled.

If a tool stops working completely: refresh the page, clear browser cache, try a different model, check that your API key has credits.
`;

// ── SMALL UI COMPONENTS ───────────────────────────────────────────────────────
function SectionHeading({ id, text, level = 2 }) {
  const style = {
    2: { fontSize:'clamp(18px,3vw,24px)', fontWeight:800, color:'#fff', margin:'36px 0 12px', letterSpacing:'-0.5px', scrollMarginTop:'80px', display:'flex', alignItems:'center', gap:8 },
    3: { fontSize:'clamp(14px,2.5vw,18px)', fontWeight:700, color:'#e2e8f0', margin:'24px 0 8px', scrollMarginTop:'80px' },
    4: { fontSize:'clamp(13px,2vw,15px)', fontWeight:700, color:'#a78bfa', margin:'18px 0 6px', scrollMarginTop:'80px', textTransform:'uppercase', letterSpacing:'0.5px' },
  };
  return <div id={id} data-section style={style[level]}>
    {level === 2 && <span style={{ color:'var(--accent)', fontSize:'14px' }}>▸</span>}
    {text}
  </div>;
}

// ── MAIN DOCS COMPONENT ───────────────────────────────────────────────────────
const Docs = () => {
  const { activeModel, apiKey, providerKeys, customModels } = useContext(AppContext);

  const [lang,        setLang]        = useState('en');
  const [otherLang,   setOtherLang]   = useState('');
  const [showLang,    setShowLang]    = useState(false);
  const [search,      setSearch]      = useState('');
  const [activeId,    setActiveId]    = useState('intro');
  const [translating, setTranslating] = useState(false);
  const [transCache,  setTransCache]  = useState({});   // { 'Hindi': [chunks] }
  const [transError,  setTransError]  = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const contentRef = useRef(null);

  // ── SCROLL SPY ──────────────────────────────────────────────────────────────
  React.useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handler = () => {
      el.querySelectorAll('[data-section]').forEach(sec => {
        const r = sec.getBoundingClientRect();
        if (r.top < 160 && r.bottom > 0) setActiveId(sec.id);
      });
    };
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior:'smooth' });
    setActiveId(id);
    setSidebarOpen(false);
  };

  // ── AI TRANSLATE ────────────────────────────────────────────────────────────
  const translate = useCallback(async (langName) => {
    if (!langName || langName === 'English') return;
    if (transCache[langName]) return; // already cached

    setTranslating(true);
    setTransError('');

    const system = `You are a professional technical documentation translator.
Translate the following PromptForge documentation into ${langName}.

STRICT RULES:
1. Translate EVERY word naturally — sound completely native, like it was originally written in ${langName}
2. Keep these words in English: PromptForge, API, URL, CSV, PDF, JSON-LD, JSON, HTML, CSS, JavaScript, TypeScript, Python, SQL, R, OpenAI, Anthropic, Groq, Gemini, Claude, GPT, Llama, OpenRouter, Mistral, localStorage, IndexedDB, AES-GCM, BYOK, BigQuery, Postgres, Snowflake, MongoDB, DAX, Power BI, Pandas, NumPy, Plotly, Matplotlib, Seaborn, TikTok, LinkedIn, Instagram, YouTube, Pinterest, WhatsApp, Twitter, Facebook
3. Keep code examples and key formats exactly as-is (sk-..., AIza..., gsk_...)
4. Keep === section markers and bullet format exactly as-is — only translate the text content
5. Output ONLY the translated text — no explanations, no notes, no preamble
6. For ${langName === 'Arabic' || langName === 'Urdu' ? 'RTL language' : 'this language'}: ensure natural reading flow`;

    try {
      // Split into 2 chunks to handle token limits
      const half = Math.floor(ENGLISH_DOCS.length / 2);
      const chunk1 = ENGLISH_DOCS.slice(0, half);
      const chunk2 = ENGLISH_DOCS.slice(half);

      const [r1, r2] = await Promise.all([
        callAI(system, `Translate this part:\n${chunk1}`, null, activeModel, apiKey, providerKeys, customModels),
        callAI(system, `Translate this part:\n${chunk2}`, null, activeModel, apiKey, providerKeys, customModels),
      ]);

      setTransCache(prev => ({ ...prev, [langName]: r1 + '\n' + r2 }));
    } catch (e) {
      setTransError('Translation failed: ' + e.message + '. Showing English.');
    } finally {
      setTranslating(false);
    }
  }, [activeModel, apiKey, providerKeys, customModels, transCache]);

  const handleLangSelect = async (code) => {
    if (code === 'other') return;
    setLang(code);
    setShowLang(false);
    if (code === 'en') { setTransError(''); return; }
    const langObj = LANGS.find(l => l.code === code);
    await translate(langObj?.name || code);
  };

  const handleOtherSubmit = async (e) => {
    e.preventDefault();
    if (!otherLang.trim()) return;
    setLang('other');
    setShowLang(false);
    await translate(otherLang.trim());
  };

  const currentLangName = lang === 'other' ? otherLang : (LANGS.find(l => l.code === lang)?.name || 'English');
  const displayText = (lang === 'en' || !transCache[currentLangName]) ? ENGLISH_DOCS : transCache[currentLangName];

  // ── PARSE & RENDER DOCS ──────────────────────────────────────────────────────
  const renderDocs = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let key = 0;

    // Map section headers to IDs
    const sectionMap = {
      'What is PromptForge': 'intro',
      'Quick Setup': 'setup',
      'API Keys & Models': 'models',
      'Prompt Optimizer': 'optimizer',
      'AI Writer': 'aiwriter',
      'Code Helper': 'codehelper',
      'Data Wizard': 'datawizard',
      'The Spider': 'spider',
      'Chat With Data': 'chatdata',
      'The Inventor': 'inventor',
      'Creator Studio': 'creator',
      'SEO Optimizer': 'seo',
      'Model Compare': 'compare',
      'Prompt Library': 'library',
      'API Keys (Settings)': 'apikeys',
      'History Vault': 'vault',
      'Pro Tips': 'tips',
      'Troubleshooting': 'errors',
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty
      if (!trimmed) { elements.push(<div key={key++} style={{ height: 6 }} />); continue; }

      // Section header ===...===
      if (trimmed.startsWith('===') && trimmed.endsWith('===')) {
        const title = trimmed.replace(/===/g, '').trim();
        const id = Object.keys(sectionMap).find(k => title.includes(k) || (lang !== 'en' && elements.length > 0)) || `sec-${key}`;
        const finalId = Object.keys(sectionMap).find(k => title.toLowerCase().includes(k.toLowerCase().slice(0,8))) 
          ? sectionMap[Object.keys(sectionMap).find(k => title.toLowerCase().includes(k.toLowerCase().slice(0,8)))]
          : `sec-${key}`;
        elements.push(
          <div key={key++}>
            <div style={{ height: 40 }} />
            <div id={finalId} data-section style={{ height: 2, background: 'linear-gradient(90deg, var(--accent), transparent)', marginBottom: 20, borderRadius: 2 }} />
            <h2 style={{ fontSize: 'clamp(18px,3vw,24px)', fontWeight: 800, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--accent)' }}>▸</span> {title}
            </h2>
          </div>
        );
        continue;
      }

      // Code block (indented 4 spaces or starts with function/const etc.)
      if (trimmed.startsWith('function ') || (line.startsWith('  ') && (trimmed.includes('{') || trimmed.includes('=>') || trimmed.includes('let ') || trimmed.includes('const ')))) {
        elements.push(
          <div key={key++} style={{ background: '#0a0a1a', border: '1px solid rgba(124,92,252,0.2)', borderRadius: 10, padding: '14px 16px', margin: '10px 0', fontFamily: "'DM Mono',monospace", fontSize: 12, color: '#a78bfa', lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre' }}>
            {trimmed}
          </div>
        );
        continue;
      }

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        const content = trimmed.replace(/^[-•]\s*/, '');
        const [bold, ...rest] = content.split(':');
        const hasBold = rest.length > 0 && bold.length < 40;
        elements.push(
          <div key={key++} style={{ display: 'flex', gap: 10, margin: '5px 0', paddingLeft: 4 }}>
            <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }}>▪</span>
            <span style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>
              {hasBold ? <><strong style={{ color: '#e2e8f0' }}>{bold}</strong>:{rest.join(':')}</> : content}
            </span>
          </div>
        );
        continue;
      }

      // Numbered steps
      if (/^(Step\s+\d+|[1-9]\d?)\s*[.—–-]\s/.test(trimmed)) {
        const numMatch = trimmed.match(/^(Step\s*\d+|[1-9]\d?)/);
        const content = trimmed.replace(/^(Step\s*\d+|[1-9]\d?)\s*[.—–-]\s*/, '');
        elements.push(
          <div key={key++} style={{ display: 'flex', gap: 12, margin: '8px 0', alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(124,92,252,0.15)', border: '1.5px solid rgba(124,92,252,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: 'var(--accent)', flexShrink: 0 }}>
              {numMatch?.[0]?.replace('Step','').trim() || '•'}
            </div>
            <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, paddingTop: 4 }}>{content}</div>
          </div>
        );
        continue;
      }

      // Sub-label lines (e.g. "Key features:", "Features:", "How to use:")
      if (trimmed.endsWith(':') && trimmed.length < 50 && !trimmed.startsWith('-')) {
        elements.push(
          <div key={key++} style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', letterSpacing: '2px', textTransform: 'uppercase', margin: '20px 0 8px' }}>
            {trimmed.replace(/:$/, '')}
          </div>
        );
        continue;
      }

      // Bold sub-heading (single line, short, ends with —)
      if (trimmed.includes(' — ') && trimmed.split(' — ')[0].length < 50 && !trimmed.startsWith('-')) {
        const [title, ...rest] = trimmed.split(' — ');
        elements.push(
          <div key={key++} style={{ margin: '10px 0 4px', fontSize: 14, color: '#e2e8f0', lineHeight: 1.7 }}>
            <strong style={{ color: '#fff' }}>{title}</strong>
            {rest.length > 0 && <span style={{ color: '#64748b' }}> — {rest.join(' — ')}</span>}
          </div>
        );
        continue;
      }

      // Normal paragraph
      elements.push(
        <p key={key++} style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.8, margin: '6px 0' }}>
          {trimmed}
        </p>
      );
    }
    return elements;
  };

  // ── NAV SEARCH ───────────────────────────────────────────────────────────────
  const filtered = search
    ? NAV.flatMap(g => g.items).filter(i => i.label.toLowerCase().includes(search.toLowerCase()))
    : null;

  const currentLangLabel = lang === 'other'
    ? `🌐 ${otherLang || 'Other'}`
    : (LANGS.find(l => l.code === lang)?.label || '🇺🇸 English');

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', height: '100vh', background: 'var(--bg)',
      color: 'var(--text)', fontFamily: "'DM Sans',sans-serif",
      overflow: 'hidden', position: 'relative',
    }}>

      {/* ── MOBILE MENU BUTTON ── */}
      <button
        onClick={() => setSidebarOpen(p => !p)}
        style={{
          display: 'none', position: 'fixed', top: 16, right: 16, zIndex: 1001,
          background: 'var(--accent)', border: 'none', borderRadius: 10,
          padding: '10px 12px', cursor: 'pointer', color: '#fff',
          ['@media(maxWidth:768px)']: { display: 'flex' },
        }}
        className="docs-mobile-menu"
      >
        {sidebarOpen ? <X size={18}/> : <Menu size={18}/>}
      </button>

      {/* ── SIDEBAR OVERLAY (mobile) ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 998 }}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 260, flexShrink: 0,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        overflowY: 'auto', display: 'flex', flexDirection: 'column',
        transition: 'transform 0.25s ease',
        zIndex: 999,
      }} className="docs-sidebar">

        {/* Logo */}
        <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'var(--accent)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>⚡</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px' }}>PromptForge</div>
              <div style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 700, letterSpacing: 2 }}>DOCS v3.0</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 9, padding: '7px 11px' }}>
            <Search size={12} style={{ color: 'var(--text3)', flexShrink: 0 }}/>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search docs..."
              style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 12, outline: 'none', width: '100%', fontFamily: 'inherit' }}
            />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={12}/></button>}
          </div>
        </div>

        {/* Language Selector */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <button
            onClick={() => setShowLang(p => !p)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: lang !== 'en' ? 'rgba(124,92,252,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${lang !== 'en' ? 'rgba(124,92,252,0.35)' : 'var(--border)'}`,
              borderRadius: 9, padding: '8px 11px', color: lang !== 'en' ? 'var(--accent2)' : 'var(--text2)',
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Globe size={13}/>
              {currentLangLabel}
            </span>
            <ChevronDown size={12} style={{ transform: showLang ? 'rotate(180deg)' : 'none', transition: '.2s', flexShrink: 0 }}/>
          </button>

          <AnimatePresence>
            {showLang && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ paddingTop: 8, maxHeight: 260, overflowY: 'auto' }}>
                  {LANGS.map(l => (
                    l.code === 'other' ? (
                      <form key="other" onSubmit={handleOtherSubmit} style={{ marginTop: 6 }}>
                        <input
                          value={otherLang} onChange={e => setOtherLang(e.target.value)}
                          placeholder="Type any language (e.g. Punjabi, Swahili)..."
                          style={{
                            width: '100%', background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border)', borderRadius: 7,
                            padding: '7px 10px', color: 'var(--text)', fontSize: 12,
                            outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                          }}
                        />
                        <button type="submit" style={{
                          marginTop: 5, width: '100%',
                          background: 'rgba(124,92,252,0.2)', border: '1px solid rgba(124,92,252,0.4)',
                          borderRadius: 7, padding: '7px', color: 'var(--accent2)',
                          fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        }}>
                          Translate with AI →
                        </button>
                      </form>
                    ) : (
                      <button key={l.code} onClick={() => handleLangSelect(l.code)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '7px 9px', borderRadius: 7, border: 'none', cursor: 'pointer',
                          background: lang === l.code ? 'rgba(124,92,252,0.15)' : 'transparent',
                          color: lang === l.code ? 'var(--accent2)' : 'var(--text2)',
                          fontSize: 12, fontWeight: lang === l.code ? 700 : 500,
                          fontFamily: 'inherit', textAlign: 'left', transition: '.12s',
                        }}
                      >
                        {l.label}
                        {lang === l.code && <Check size={11} style={{ color: 'var(--accent)', flexShrink: 0 }}/>}
                      </button>
                    )
                  ))}
                </div>

                {lang !== 'en' && (
                  <button
                    onClick={() => { setLang('en'); setTransError(''); }}
                    style={{
                      width: '100%', marginTop: 6, padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                      borderRadius: 7, color: '#f87171', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <RefreshCw size={10}/> Back to English
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Translation status */}
          {translating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11, color: 'var(--accent)' }}>
              <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }}/>
              Translating full docs...
            </div>
          )}
          {!translating && transCache[currentLangName] && lang !== 'en' && (
            <div style={{ marginTop: 6, fontSize: 10, color: '#34d399', fontWeight: 700 }}>
              ✓ Translated & cached
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: '8px 8px 24px', overflowY: 'auto' }}>
          {(filtered ? [{ label: 'RESULTS', items: filtered }] : NAV).map(group => (
            <div key={group.label}>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text3)', letterSpacing: '3px', padding: '14px 10px 6px', textTransform: 'uppercase' }}>
                {group.label}
              </div>
              {group.items.map(item => (
                <button key={item.id} onClick={() => scrollTo(item.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 11px', borderRadius: 8, border: 'none',
                    background: activeId === item.id ? 'rgba(124,92,252,0.12)' : 'transparent',
                    color: activeId === item.id ? 'var(--accent2)' : 'var(--text2)',
                    fontSize: 12, fontWeight: activeId === item.id ? 700 : 400,
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    borderLeft: `3px solid ${activeId === item.id ? 'var(--accent)' : 'transparent'}`,
                    transition: '.12s',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main ref={contentRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

        {/* Translating banner */}
        <AnimatePresence>
          {translating && (
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              style={{
                position: 'sticky', top: 0, zIndex: 10,
                background: 'rgba(124,92,252,0.15)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(124,92,252,0.3)',
                padding: '12px 24px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <Loader2 size={16} color="#a78bfa" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}/>
              <div>
                <span style={{ fontSize: 13, color: '#a78bfa', fontWeight: 700 }}>
                  AI is translating the complete documentation into {currentLangName}...
                </span>
                <span style={{ fontSize: 11, color: '#6d5e9c', marginLeft: 8 }}>
                  This takes 30-60 seconds. Cached after first time — instant on next visit.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error banner */}
        {transError && (
          <div style={{
            background: 'rgba(248,113,113,0.08)', borderBottom: '1px solid rgba(248,113,113,0.2)',
            padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#f87171',
          }}>
            ⚠️ {transError}
            <button onClick={() => setTransError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* Docs content */}
        <div style={{ maxWidth: 780, margin: '0 auto', padding: 'clamp(24px, 5vw, 60px) clamp(16px, 5vw, 48px) 80px' }}
          dir={['ar','ur'].includes(lang) ? 'rtl' : 'ltr'}
        >
          {/* Hero */}
          <div style={{ marginBottom: 48 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.2)',
              padding: '4px 12px', borderRadius: 20, fontSize: 10, fontWeight: 700,
              color: 'var(--accent)', letterSpacing: 1, marginBottom: 18,
            }}>
              📖 COMPLETE DOCUMENTATION — 11 TOOLS
            </div>
            <h1 style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: 900, color: '#fff', letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 14 }}>
              <span style={{ color: 'var(--accent)' }}>PromptForge</span> Docs
            </h1>
            <p style={{ fontSize: 'clamp(13px,2vw,16px)', color: '#64748b', lineHeight: 1.75, maxWidth: 520, marginBottom: 28 }}>
              Everything you need — from first API key to every tool. So simple a 5-year-old can follow.
            </p>
            <div style={{ display: 'flex', gap: 'clamp(16px,4vw,32px)', flexWrap: 'wrap' }}>
              {[['11','Tools'],['20+','Languages'],['60+','Examples'],['Free','To Use']].map(([n,l]) => (
                <div key={l}>
                  <div style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>{n}</div>
                  <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,var(--accent),transparent)', margin: '32px 0 0' }}/>
          </div>

          {/* Rendered docs content */}
          {renderDocs(displayText)}

          {/* Footer */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 28, textAlign: 'center', color: 'var(--text3)', fontSize: 11, marginTop: 40 }}>
            PromptForge Docs v3.0 · 11 Tools · All outputs generated by your connected AI model · Data stays on your device
          </div>
        </div>
      </main>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .docs-sidebar {
            position: fixed !important;
            top: 0; left: 0; bottom: 0;
            transform: translateX(${sidebarOpen ? '0' : '-100%'}) !important;
            box-shadow: 4px 0 32px rgba(0,0,0,0.5);
          }
          .docs-mobile-menu {
            display: flex !important;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .docs-sidebar::-webkit-scrollbar { width: 4px; }
        .docs-sidebar::-webkit-scrollbar-track { background: transparent; }
        .docs-sidebar::-webkit-scrollbar-thumb { background: rgba(124,92,252,0.3); border-radius: 2px; }
        main::-webkit-scrollbar { width: 5px; }
        main::-webkit-scrollbar-track { background: transparent; }
        main::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
      `}</style>
    </div>
  );
};

export default Docs;