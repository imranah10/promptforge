import React, { useState, useContext, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Globe, ChevronDown, ChevronUp, Search, Loader2, RefreshCw, X } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';

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

const T = {
  en: {
    title: 'PromptForge Documentation',
    subtitle: 'Complete guide — every tool, every feature, with examples you can copy and try yourself.',
    setup_title: '⚡ Setup in 60 Seconds',
    setup_steps: [
      { n: '1', t: 'Click "API Keys" in the sidebar (bottom)' },
      { n: '2', t: 'Paste your API key (OpenAI / Anthropic / Groq / Google / Deepseek / OpenRouter)' },
      { n: '3', t: 'Click "Change Model / API Key" at the top → select any model' },
      { n: '4', t: 'Done! Open any tool and start generating' },
    ],
    setup_note: '💡 Tip: Groq gives free API keys at console.groq.com — use Llama 3.3 70B for free!',
    tools: [
      {
        id: 'aiwriter',
        emoji: '✍️',
        name: 'AI Writer',
        color: '#a78bfa',
        tagline: 'Write anything — 20 content types, humanize, A/B test, analyze tone',
        what: 'AI Writer generates professional content for any purpose. Choose from 20 content types like blog posts, LinkedIn posts, cold emails, YouTube scripts, and more. It also lets you Humanize AI text, create A/B variants, and analyze tone.',
        tabs: [
          { name: 'Generate', desc: 'Create new content from scratch' },
          { name: 'Humanize', desc: 'Make AI text sound like a real human wrote it' },
          { name: 'A/B Test', desc: 'Get 2 different versions with different angles' },
          { name: 'Analyze Tone', desc: 'Paste any text → get AI probability score + tips' },
        ],
        fields: [
          { name: 'Content Type', desc: 'Pick what you want to create — 20 options from Blog post to Code documentation' },
          { name: 'Tone', desc: 'How should it sound? Professional, Casual, Humorous, Urgent, etc.' },
          { name: 'Output Language', desc: '16 languages — English, Hindi, Spanish, French, Arabic, Japanese, etc.' },
          { name: 'Describe Your Topic', desc: 'Tell AI what to write. Be specific — more detail = better output' },
          { name: 'Length Slider', desc: 'Very Short (100 words) → Short (250) → Medium (500) → Long (1000+)' },
          { name: 'Target Audience', desc: 'Optional — e.g. "startup founders in India" or "fitness beginners"' },
          { name: 'Keywords to Include', desc: 'Optional — words AI must use naturally in the content' },
        ],
        steps: [
          'Select Content Type (e.g. LinkedIn post)',
          'Select Tone (e.g. Professional)',
          'Select Language (e.g. English)',
          'In "Describe Your Topic" — write what you want',
          'Adjust Length slider',
          'Click "Generate Content"',
          'Result shows with word count',
          'Click "Humanize This" to remove AI patterns',
          'Click "Generate A/B Variants" for 2 different angles',
          'Use "Analyze Tone" tab to check any existing text',
        ],
        examples: [
          {
            label: 'LinkedIn Post',
            input: 'Content Type: LinkedIn post\nTone: Professional\nTopic: I just launched my AI SaaS tool called PromptForge that helps creators write content 10x faster. It uses your own API key so no subscription needed.',
            output: 'A LinkedIn post with hook, emojis, hashtags, CTA — ready to copy and post.',
          },
          {
            label: 'Cold Email',
            input: 'Content Type: Cold email\nTone: Friendly\nTopic: I want to pitch my social media management service to local restaurant owners.',
            output: 'A short, direct cold email with subject line, personalized opener, clear CTA.',
          },
          {
            label: 'Tone Analyzer',
            input: 'Tab: Analyze Tone\nPaste: "Leverage cutting-edge AI to unlock unprecedented value and drive transformative outcomes for your business."',
            output: 'AI Probability: 92%, Formality: High, Engagement: Low. Tips: Use simpler words, add specific examples.',
          },
        ],
        tips: [
          'Be specific in your topic — "Write about AI" gives weak output, "Write about how small restaurants use AI to save time on inventory" gives great output',
          'Humanize removes words like "delve", "tapestry", "unleash", "leverage" — always humanize before publishing',
          'A/B Test is perfect for testing which angle gets more response — try both and see',
          'Analyze Tone tab works on anyone\'s text — paste competitor content to understand their style',
        ],
      },
      {
        id: 'codehelper',
        emoji: '💻',
        name: 'Code Helper',
        color: '#60a5fa',
        tagline: 'Fix bugs, explain code, generate git commits, run security audits',
        what: 'Code Helper is your AI pair programmer. It fixes bugs, explains code, writes from scratch, converts between languages, and has two unique features: Git Commit Generator (3 versions) and Security Audit (vulnerability scanner with score).',
        tabs: [
          { name: 'Code Helper', desc: 'Fix, explain, write, convert, optimize code' },
          { name: 'Git Commit', desc: 'Generate professional commit messages in 3 versions' },
          { name: 'Security Audit', desc: 'Scan code for vulnerabilities, get score 0-100' },
        ],
        fields: [
          { name: 'Task', desc: '10 tasks: Fix/Debug, Explain, Write from scratch, Convert language, Optimize, Add comments, Write tests, Review quality, Add error handling, Refactor' },
          { name: 'Language', desc: '18 languages: JavaScript, TypeScript, React, Python, Java, C++, C#, Go, Rust, PHP, Ruby, Swift, Kotlin, SQL, HTML/CSS, Shell, Dart/Flutter' },
          { name: 'Your Code', desc: 'Paste your code here — up to 100,000 characters' },
          { name: 'Additional Context', desc: 'Optional — describe the error, what it should do, which line has the problem' },
          { name: 'Git Diff / Description', desc: 'For Git tab — paste changed code OR describe what you changed in plain words' },
          { name: 'Commit Type', desc: 'Auto-detect, or manual: feat, fix, refactor, perf, docs, test, chore, style, ci' },
        ],
        steps: [
          'Code Helper tab: Select Task → Select Language → Paste code → Click Run',
          'Git Commit tab: Paste your diff or describe changes → Click "Generate Commit Messages"',
          'Security Audit tab: Paste code → Select language → Click "Run Security Audit"',
          'Results show below with copy buttons',
        ],
        examples: [
          {
            label: 'Fix Bug',
            input: `Task: Fix / debug this code
Language: Python
Code:
def calculate_discount(price, discount):
    result = price - (price * discount / 100
    return result`,
            output: 'Fixed code with missing closing parenthesis. Also adds input validation for negative prices and discounts over 100%.',
          },
          {
            label: 'Git Commit',
            input: `Git Commit tab:
Paste or describe: "Added user authentication with JWT tokens. Created /login and /signup endpoints. Password hashing with bcrypt."`,
            output: `3 versions:
• Concise: feat: add user authentication
• Standard ★ RECOMMENDED: feat(auth): add JWT authentication with bcrypt
• Detailed: feat(auth): add user authentication

- Create /login and /signup endpoints
- Add password hashing with bcrypt
- Implement JWT token generation`,
          },
          {
            label: 'Security Audit',
            input: `Security Audit tab:
Language: JavaScript
Code:
const query = "SELECT * FROM users WHERE id = " + userId;
const password = "admin123";`,
            output: 'Score: 15/100 — CRITICAL. Found: SQL Injection (Line 1), Hardcoded Password (Line 2). Provides fixed code for each vulnerability.',
          },
        ],
        tips: [
          'Always add "Additional Context" when fixing bugs — paste the error message you see',
          'Git Commit: Choose "Standard" format — it is the most widely used in professional projects',
          'Security Audit: Run on ALL code before deployment — especially login, payment, and database code',
          'For large codebases: split into sections under 100,000 characters',
        ],
      },
      {
        id: 'creator',
        emoji: '📱',
        name: 'Creator Studio',
        color: '#f472b6',
        tagline: '8 platforms, 4 tools each — Instagram, YouTube, TikTok, Twitter, LinkedIn, Facebook, WhatsApp, Pinterest',
        what: 'Creator Studio creates platform-specific social media content. Each platform has 4 tools: Generate content, Viral Hooks (5 types), 7-Day Content Calendar, and Beat Competitor. Content is customized per platform — WhatsApp gets broadcast messages, Twitter gets threads, etc.',
        tabs: [
          { name: 'Generate', desc: 'Create captions, scripts, posts for selected platform' },
          { name: 'Viral Hooks', desc: '5 hook types: Question, Shocking Stat, Story, Controversy, Challenge' },
          { name: 'Content Calendar', desc: '7-day posting schedule with timing, hooks, captions, hashtags' },
          { name: 'Beat Competitor', desc: 'Paste competitor post → get a better version' },
        ],
        fields: [
          { name: 'Platform', desc: '8 platforms: Instagram, YouTube, TikTok, Twitter/X, LinkedIn, Facebook, WhatsApp, Pinterest' },
          { name: 'Topic / Niche', desc: 'What is your content about? Be specific.' },
          { name: 'Goal', desc: 'Viral engagement, Brand awareness, Lead generation, Product promotion, Educational, Storytelling, Trending' },
          { name: 'Format', desc: 'Caption, Reel script, Thread, Story, Broadcast — changes based on platform' },
          { name: 'Tone', desc: 'Professional, Casual, Inspirational, Humorous, etc.' },
          { name: 'Competitor Post', desc: 'For Beat Competitor tab — paste the exact text of their post' },
          { name: 'Niche for Calendar', desc: 'Your overall topic area for 7-day planning' },
        ],
        steps: [
          'Select Platform (e.g. Instagram)',
          'Select Tool tab: Generate / Viral Hooks / Calendar / Beat Competitor',
          'Enter your Topic/Niche',
          'For Generate: select Goal, Format, Tone → Click Generate',
          'For Viral Hooks: enter topic → get 5 hooks with Copy button each',
          'For Calendar: enter niche → get 7 days with time, hook, caption, hashtags',
          'For Beat Competitor: paste their post → get superior version',
          'Copy or Download your content',
        ],
        examples: [
          {
            label: 'Instagram Viral Hooks',
            input: `Platform: Instagram
Tool: Viral Hooks
Topic: Weight loss journey for busy moms`,
            output: `5 hooks:
❓ Question: "Are you choosing the wrong workout routine?"
📊 Stat: "87% of moms quit fitness in week 2 — here is why"
📖 Story: "I lost 12kg after my second baby with 20 mins a day"
🔥 Controversy: "The gym is NOT where you lose weight"
⚡ Challenge: "Do 10 squats right now. That is your starting point."`,
          },
          {
            label: '7-Day LinkedIn Calendar',
            input: `Platform: LinkedIn
Tool: Content Calendar
Niche: B2B SaaS marketing tips`,
            output: 'Monday 8AM — Hook: "3 things killing your SaaS conversion rate" | Caption | Hashtags | Tip. 7 days each with unique content.',
          },
          {
            label: 'Beat Competitor',
            input: `Platform: LinkedIn
Tool: Beat Competitor
Competitor post: "Happy to share that our company grew 40% this quarter. #Growth"`,
            output: '"This quarter we helped 23 SaaS companies increase trial-to-paid conversion by 41%. Here is exactly what we changed..." (specific, story-driven, data-backed)',
          },
        ],
        tips: [
          'Use Viral Hooks first — then click a hook you like, it loads into Generate tab automatically',
          'Content Calendar: download as CSV, import into scheduling tools like Buffer or Hootsuite',
          'Beat Competitor: works best with exact text — not paraphrased',
          'WhatsApp: use "Broadcast message" format, not caption — it is designed for group/channel messages',
        ],
      },
      {
        id: 'optimizer',
        emoji: '🔮',
        name: 'Prompt Optimizer (The Forge)',
        color: '#a78bfa',
        tagline: 'Turn weak prompts into powerful AI instructions — test live, refine until perfect',
        what: 'The Forge takes your basic prompt and transforms it using the CREATE framework. It shows you exactly what was weak, what was improved, gives a strength score, lets you test the forged prompt live, and refines it automatically if you are not satisfied.',
        tabs: [
          { name: 'Input', desc: 'Enter your weak prompt + set intensity' },
          { name: 'Forged Prompt', desc: 'The optimized prompt, ready to use' },
          { name: 'Test Live', desc: 'Run the forged prompt and see actual AI output' },
          { name: 'Refine', desc: 'Not happy? Auto-improve and test again' },
        ],
        fields: [
          { name: 'Your Weak Prompt', desc: 'Type your basic, unoptimized prompt here — even "write a blog about AI" works' },
          { name: 'Forge Intensity', desc: 'Slider 1-100%: Light (clean up), Standard (add structure), Heavy (full framework), Maximum (expert level)' },
          { name: 'Quick Examples', desc: '6 template buttons: Blog post, Cold email, Fix code, Instagram post, Summarize, Ad copy — click to load' },
        ],
        steps: [
          'Click a Quick Example button OR type your own prompt',
          'Set Forge Intensity (70% is good for most cases)',
          'Click "Forge This Prompt"',
          'Review: Strength Score, Weaknesses Found, Enhancements Applied',
          'Read the Forged Prompt — copy it or use it',
          'Click "Run Test" to see actual AI output',
          'Click "Yes — Save to Vault" if happy',
          'Click "No — Refine More" to auto-improve and try again',
        ],
        examples: [
          {
            label: 'Blog Post Forging',
            input: `Weak prompt: "write a blog post about AI"
Intensity: 85%`,
            output: `Score: 88% — Strong
Weaknesses: Too vague, no audience defined, no format specified
Enhancements: Added expert persona, specified audience (startup founders), set length (800 words), added structure requirements

Forged prompt: "You are a tech journalist with 10 years experience writing for Forbes. Write an 800-word blog post for startup founders explaining the top 3 practical ways AI tools can save 10+ hours per week in their business operations. Include one real example per tip, a compelling intro hook, and end with a specific action they can take today. Avoid jargon."`,
          },
          {
            label: 'Refine Loop',
            input: 'After testing: output was too technical and long',
            output: 'Click "No — Refine More" → New forged prompt adds: "Use simple language, no jargon, max 600 words" — Refine counter shows "Refined 1 time"',
          },
        ],
        tips: [
          'Intensity 70% is ideal for everyday use — 90%+ is for complex, professional prompts',
          'Always test the forged prompt before using it in your workflow',
          'Use the Refine loop 2-3 times if needed — each iteration gets better',
          'Save great prompts to Vault — you can reuse them anytime',
        ],
      },
      {
        id: 'inventor',
        emoji: '💡',
        name: 'The Inventor',
        color: '#fbbf24',
        tagline: '5 AI experts debate your business idea — get a Master Blueprint',
        what: 'The Inventor is a unique multi-agent system. You describe a business idea, and 5 AI experts debate it one after another — each seeing what the previous expert said. You get a Master Blueprint with a 30-60-90 day action plan at the end. No other AI tool has this.',
        tabs: [
          { name: 'Input', desc: 'Describe your idea in detail' },
          { name: 'Council Debate', desc: 'Watch 5 experts analyze your idea live' },
          { name: 'Master Blueprint', desc: 'Final synthesized action plan' },
        ],
        fields: [
          { name: 'Business Idea', desc: 'Describe your idea — include what it does, who it is for, and how you plan to make money. More detail = better analysis.' },
        ],
        agents: [
          { name: '🚀 Visionary (CEO)', desc: 'Big picture thinking, market opportunity, growth potential' },
          { name: '⚙️ Hacker (CTO)', desc: 'Technical feasibility, tech stack, what to build first' },
          { name: '📊 Analyst (CFO)', desc: 'Revenue model, pricing, unit economics, path to profit' },
          { name: '🛡️ Critic (Risk Manager)', desc: 'What can go wrong, competition, failure modes' },
          { name: '🎯 Master (Synthesizer)', desc: 'Combines all views into a 30-60-90 day Master Blueprint' },
        ],
        steps: [
          'Describe your business idea in the text area',
          'Click "Convene The Council"',
          'Watch each of 5 experts analyze your idea (takes 2-3 minutes total)',
          'Each expert card expands — read their analysis',
          'At the end, read the Master Blueprint',
          'Click "Copy Blueprint" or "Save to Vault"',
        ],
        examples: [
          {
            label: 'SaaS Idea Analysis',
            input: 'Business idea: AI-powered resume builder for Indian job seekers. Users pay ₹299/month. Target: freshers and people switching jobs. Differentiator: ATS optimization + Hindi support.',
            output: `Visionary: "Large TAM — 5M+ active job seekers in India. LinkedIn gap for regional language support."
Hacker: "Stack: React + FastAPI + GPT-4. MVP in 6 weeks. ATS parser is key tech risk."
Analyst: "₹299/month × 1000 users = ₹2.99L MRR. CAC via content: ₹150. LTV: ₹1,800."
Critic: "Naukri.com free tools are competition. Risk: users switch after getting job."
Master Blueprint: Month 1: 50 beta users. Month 2: ProductHunt launch, 500 users. Month 3: B2B HR tie-ups.`,
          },
        ],
        tips: [
          'Be specific — include your target city/country, pricing, and who exactly your customer is',
          'Do NOT refresh the page while agents are running — it will stop',
          'The Critic agent is the most valuable — it finds risks you have not thought of',
          'Use the Master Blueprint as your actual execution plan for the next 90 days',
        ],
      },
      {
        id: 'seo',
        emoji: '🔍',
        name: 'SEO Optimizer',
        color: '#22c55e',
        tagline: '7 SEO tools in one: Keyword Lab, SERP Simulator, Topic Clusters, Content Gap, Meta Forge, Schema Generator',
        what: 'SEO Optimizer has 7 specialized tools covering every aspect of SEO — from keyword research to meta tags to structured data. Each tool is focused on one specific SEO task.',
        tabs: [
          { name: 'Keyword Lab', desc: 'Enter a topic → get keywords with intent, difficulty, volume' },
          { name: 'SERP Simulator', desc: 'Preview how your page looks on Google search results' },
          { name: 'Topic Clusters', desc: 'Build pillar + cluster content architecture' },
          { name: 'Content Gap AI', desc: 'Find keywords your competitors rank for but you do not' },
          { name: 'Meta Forge', desc: 'Generate SEO-optimized title + description' },
          { name: 'Schema Generator', desc: 'Generate JSON-LD structured data for rich snippets' },
        ],
        fields: [
          { name: 'Target Keyword or Topic', desc: 'The main keyword or topic you want to optimize for' },
          { name: 'Competitors', desc: 'Optional — paste competitor URLs or domain names' },
          { name: 'Language', desc: 'English, Hindi, Spanish, etc.' },
          { name: 'Target Market', desc: 'Global, India, US, UK, etc.' },
          { name: 'Your URL', desc: 'For SERP Simulator — enter your page URL' },
          { name: 'Meta Title', desc: 'For SERP Simulator — enter your title to preview it' },
          { name: 'Schema Type', desc: 'For Schema Generator — Article, Product, FAQ, LocalBusiness, etc.' },
        ],
        steps: [
          'Click the tool tab you want (Keyword Lab, SERP, etc.)',
          'Fill in the required fields',
          'Click the Generate button for that tool',
          'Results appear below — copy, download, or use in your website',
        ],
        examples: [
          {
            label: 'Keyword Lab',
            input: 'Topic: best project management software for startups\nLanguage: English\nMarket: India',
            output: '20-30 keywords with intent (Informational/Commercial), difficulty (Low/Medium/High), and search volume estimates. Groups: Feature keywords, Comparison keywords, Price keywords.',
          },
          {
            label: 'Meta Forge',
            input: 'Topic: "AI writing tools comparison 2025"\nURL: yoursite.com/ai-writing-tools',
            output: `Title (58 chars): "Best AI Writing Tools 2025 — Detailed Comparison"
Description (156 chars): "Compare the top AI writing tools of 2025. We tested 12 tools on speed, quality, and price. See which one is right for your needs."`,
          },
          {
            label: 'Schema Generator',
            input: 'Schema Type: FAQ\nTopic: AI writing tools',
            output: 'JSON-LD code with FAQ schema — paste it into your website head tag to get FAQ rich snippets on Google.',
          },
        ],
        tips: [
          'Keyword Lab: start with a broad topic, then use the long-tail keywords you find to create specific content',
          'SERP Simulator: keep title under 60 characters and description under 160 — the preview turns red if too long',
          'Schema Generator: copy the JSON-LD and paste inside a <script type="application/ld+json"> tag on your page',
          'Content Gap: find what your competitors rank for, then create better content on those topics',
        ],
      },
      {
        id: 'chatdata',
        emoji: '📊',
        name: 'Chat With Data',
        color: '#8b5cf6',
        tagline: 'Upload PDF, CSV, Excel, or image — ask questions, get charts, analyze data',
        what: 'Chat With Data lets you upload documents and data files, then ask AI questions about them. It can analyze resumes, contracts, sales data, invoices, and any document. Results stay 100% on your device — nothing is sent to any server.',
        fields: [
          { name: 'Upload File', desc: 'Supports: PDF, CSV, Excel (.xlsx), plain text, images (JPG/PNG)' },
          { name: 'Your Question', desc: 'Ask anything about the uploaded file in plain language' },
        ],
        steps: [
          'Click the Upload area or drag and drop your file',
          'Wait for the file to process (a few seconds)',
          'Type your question in the chat box',
          'Press Enter or click Send',
          'View the answer, charts, or extracted data',
          'Ask follow-up questions to dig deeper',
        ],
        examples: [
          {
            label: 'Resume Analysis',
            input: `Upload: resume.pdf
Question: "What are this person's strongest skills? Are there any career gaps?"`,
            output: 'Summary of skills, work history, education. Flags: 8-month gap in 2022. Recommendation: strong in backend, weak in cloud tools.',
          },
          {
            label: 'Sales CSV Analysis',
            input: `Upload: sales_2024.csv
Question: "Which product had the highest revenue in Q3? Show me a chart."`,
            output: 'Bar chart showing revenue by product. "Product A: ₹4.2L in Q3 — highest. Product C declined 23% vs Q2."',
          },
          {
            label: 'Contract Review',
            input: `Upload: contract.pdf
Question: "What are the payment terms and penalty clauses in this contract?"`,
            output: 'Extracted: Payment due 30 days from invoice. Late penalty: 2% per month. Termination: 60 days notice required.',
          },
        ],
        tips: [
          'Ask specific questions — "summarize this" works but "what are the top 3 risks in this contract" works better',
          'For CSV/Excel: ask for charts — "show me a bar chart of monthly sales" will generate a visualization',
          'Large PDFs (50+ pages) take longer to process — be patient',
          'All your data stays in your browser — nothing is uploaded to any server',
        ],
      },
      {
        id: 'datawizard',
        emoji: '🧙',
        name: 'Data Wizard',
        color: '#06b6d4',
        tagline: 'Generate SQL queries, Excel formulas, Python code, Regex, DAX, and more',
        what: 'Data Wizard is an expert formula and query generator. Describe what you need in plain English and it writes the code. Supports SQL (PostgreSQL/MySQL/BigQuery), Excel/Google Sheets, Python (Pandas), Regex, DAX (Power BI), and more.',
        tabs: [
          { name: 'SQL Query', desc: 'PostgreSQL, MySQL, BigQuery, Snowflake' },
          { name: 'Excel / Google Sheets', desc: 'XLOOKUP, SUMIFS, array formulas, pivot' },
          { name: 'Python / Pandas', desc: 'Data manipulation, analysis, cleaning' },
          { name: 'Regex', desc: 'Pattern matching, validation, extraction' },
          { name: 'DAX', desc: 'Power BI measures and calculated columns' },
        ],
        fields: [
          { name: 'Formula Type', desc: 'Select: SQL, Excel, Python, Regex, DAX' },
          { name: 'Optimization Mode', desc: 'Speed (fast), Balanced, Readable (clear), Enterprise (production-grade with error handling)' },
          { name: 'Step-by-Step Explanation', desc: 'Toggle ON to get full breakdown of every part of the formula' },
          { name: 'Table Schema / Column Structure', desc: 'For SQL: paste your table names and columns. For Excel: describe your columns (A=Date, B=Revenue, etc.)' },
          { name: 'Sample Data', desc: 'Optional — paste a few rows of your data for more accurate formulas' },
          { name: 'What do you need?', desc: 'Describe your requirement in plain English — the more specific the better' },
        ],
        steps: [
          'Select formula type (SQL, Excel, Python, etc.)',
          'Choose Optimization Mode',
          'Toggle Step-by-Step if you want explanation',
          'Enter your table/column structure',
          'Paste sample data if you have it',
          'Describe what you need in plain English',
          'Click Generate',
          'Copy the formula and paste into your tool',
        ],
        examples: [
          {
            label: 'SQL Query',
            input: `Type: SQL Query
Schema: orders(id, customer_id, amount, status, created_at), customers(id, name, city)
Need: Show top 10 customers by total order value in the last 30 days, only completed orders`,
            output: `SELECT c.name, c.city, SUM(o.amount) as total_value
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.status = 'completed'
AND o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY c.id, c.name, c.city
ORDER BY total_value DESC
LIMIT 10;`,
          },
          {
            label: 'Excel Formula',
            input: `Type: Excel/Google Sheets
Columns: A=Product, B=Region, C=Revenue
Need: Total revenue only for "North" region where revenue is more than 5000`,
            output: '=SUMPRODUCT((B2:B1000="North")*(C2:C1000>5000)*C2:C1000)',
          },
          {
            label: 'Regex',
            input: `Type: Regex
Need: Extract all email addresses from a block of text`,
            output: `/[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}/g\nExplanation: Matches username@domain.tld pattern`,
          },
        ],
        tips: [
          'Always paste your actual column names — "Col A" vs "revenue_amount" makes a big difference',
          'Use Enterprise mode for production code — it adds error handling and validation',
          'Turn on Step-by-Step when learning — it teaches you how the formula works',
          'For Excel: mention if you use Excel 2019 or older — some functions like XLOOKUP are newer',
        ],
      },
      {
        id: 'spider',
        emoji: '🕷️',
        name: 'The Spider',
        color: '#f59e0b',
        tagline: 'Research any URL, topic, person, or company — get AI-written dossier + clickable sources',
        what: 'The Spider scrapes and researches any URL, topic, company, or person. It fetches live web data and creates a structured AI dossier with key facts, insights, and clickable source links. Ask follow-up questions to dig deeper.',
        fields: [
          { name: 'Search / URL Input', desc: 'Enter a URL (website, article), a topic, a company name, or a person\'s name' },
          { name: 'Follow-up Question', desc: 'After getting the dossier, ask deeper questions about the content' },
        ],
        steps: [
          'Enter a URL, company name, topic, or person\'s name',
          'Click "Research"',
          'Wait for the AI to fetch and analyze the content',
          'Read the Dossier — structured summary with key facts',
          'Click source links to verify information',
          'Type a follow-up question to explore specific details',
          'Ask as many follow-ups as you need',
        ],
        examples: [
          {
            label: 'Research a Company',
            input: 'Input: "OpenAI company overview"',
            output: 'Dossier: Founded 2015, HQ San Francisco, CEO Sam Altman. Products: GPT-4, DALL-E, Sora, ChatGPT. Revenue: $1.6B (2023). Key competitors: Anthropic, Google DeepMind. Sources: 3 clickable links.',
          },
          {
            label: 'Research an Article',
            input: 'Input: https://techcrunch.com/some-article',
            output: 'Dossier with key points from the article, author information, publication date, and main findings. Follow-up: "What are the main risks mentioned?"',
          },
          {
            label: 'Follow-up Question',
            input: `After dossier on OpenAI:
Follow-up: "What are their main competitors and how do they differ?"`,
            output: 'Detailed comparison: Anthropic (Claude), Google (Gemini), Meta (Llama) — each with key differences in approach, pricing, and capabilities.',
          },
        ],
        tips: [
          'For best results: paste full URLs instead of partial website names',
          'Follow-up questions work best when specific: "What is their revenue model?" beats "tell me more"',
          'Research people carefully — verify everything from sources, AI can sometimes mix up similar names',
          'Use Spider to research competitors before writing Beat Competitor content in Creator Studio',
        ],
      },
      {
        id: 'compare',
        emoji: '⚖️',
        name: 'Model Compare',
        color: '#f97316',
        tagline: 'Run the same prompt on 2 AI models and compare results side by side',
        what: 'Model Compare lets you test any prompt on two different AI models at the same time. See both responses side by side and decide which model is better for your specific task.',
        fields: [
          { name: 'Model A', desc: 'Select first AI model — OpenAI, Claude, Gemini, Llama, Mistral, etc.' },
          { name: 'Model B', desc: 'Select second AI model to compare against' },
          { name: 'System Prompt', desc: 'Optional — give the AI a role or instructions that apply to both models' },
          { name: 'Your Prompt', desc: 'The prompt you want to test on both models' },
        ],
        steps: [
          'Select Model A from dropdown (e.g. GPT-4o)',
          'Select Model B from dropdown (e.g. Claude Sonnet)',
          'Optionally add a system prompt',
          'Type your test prompt',
          'Click Compare',
          'Both models respond side by side',
          'Compare quality, style, accuracy',
          'Copy the better response',
        ],
        examples: [
          {
            label: 'Creative Writing',
            input: `Model A: GPT-4o
Model B: Claude Sonnet 4.5
Prompt: "Write a 3-sentence product tagline for a productivity app called FocusFlow"`,
            output: 'Both models generate taglines. GPT-4 might be punchier, Claude might be more nuanced — you pick the winner.',
          },
          {
            label: 'Code Generation',
            input: `Model A: GPT-4o
Model B: Llama 3.3 70B
Prompt: "Write a Python function to check if a string is a valid email address"`,
            output: 'Compare code style, error handling, comments, and edge cases between both models.',
          },
        ],
        tips: [
          'Use Model Compare when you are unsure which model to use for a specific task',
          'Test the same creative brief on 2 models — you will quickly learn which is better for writing vs code',
          'Try GPT-4o vs Claude for complex reasoning tasks',
          'Try Llama 3.3 70B (free via Groq) vs paid models to see if free is good enough',
        ],
      },
      {
        id: 'library',
        emoji: '📚',
        name: 'Prompt Library',
        color: '#ec4899',
        tagline: '60+ ready-made prompts — click and use instantly',
        what: 'Prompt Library contains 60+ curated, tested prompts for common tasks. Browse by category, click any prompt to copy it, then paste into any tool. Saves time when you do not want to write prompts from scratch.',
        fields: [
          { name: 'Search', desc: 'Search by keyword to find specific prompts' },
          { name: 'Categories', desc: 'Filter by: Writing, Coding, Marketing, Business, Creative, SEO, Productivity' },
        ],
        steps: [
          'Browse the prompt cards or use search',
          'Click any prompt card to see the full prompt',
          'Click "Copy Prompt" to copy it',
          'Paste into AI Writer, Code Helper, or any other tool',
          'Customize the [BRACKETS] with your specific details',
          'Generate your content',
        ],
        examples: [
          {
            label: 'Using a Marketing Prompt',
            input: 'Category: Marketing → Click "Product Launch Email Sequence"',
            output: 'Full email prompt with placeholders: "Write a 3-email launch sequence for [PRODUCT] targeting [AUDIENCE]. Email 1: Teaser (3 days before). Email 2: Launch day. Email 3: Last chance (24 hours)."',
          },
        ],
        tips: [
          'All prompts are templates — always replace [BRACKETS] with your actual details',
          'Combine prompts: use a Library prompt in Prompt Optimizer to make it even better',
          'The best prompts are in Business and Marketing categories for professional use',
        ],
      },
      {
        id: 'vault',
        emoji: '🗄️',
        name: 'History Vault',
        color: '#6366f1',
        tagline: 'All your AI generations saved automatically — search, filter, export',
        what: 'History Vault automatically saves everything you generate in PromptForge. You can search, filter by tool, view full content, and export. All data stays on your device — nothing is sent to any server.',
        fields: [
          { name: 'Search', desc: 'Search by keyword across all saved generations' },
          { name: 'Filter by Tool', desc: 'Show only results from a specific tool (AI Writer, Code Helper, etc.)' },
          { name: 'Export', desc: 'Download all your generations as a JSON file' },
        ],
        steps: [
          'Vault fills automatically as you use other tools',
          'Click "History Vault" in sidebar to open',
          'Use search bar to find specific content',
          'Click a card to expand and read the full content',
          'Click the tool badge to filter by that tool only',
          'Click Export to download all as JSON backup',
          'Click Delete (trash icon) to remove individual items',
        ],
        examples: [
          {
            label: 'Find old content',
            input: 'Search bar: type "LinkedIn" → shows all LinkedIn posts you generated',
            output: 'All LinkedIn posts listed with date, content preview. Click to expand full text. Click Copy to reuse.',
          },
          {
            label: 'Filter by tool',
            input: 'Click the purple "Code Helper" badge on any card',
            output: 'Shows only Code Helper results. Click badge again to remove filter.',
          },
        ],
        examples: [
          {
            label: 'Find old content',
            input: 'Search bar: type "LinkedIn"',
            output: 'Shows all LinkedIn posts you generated. Click to expand full text. Click Copy to reuse.',
          },
          {
            label: 'Filter by tool',
            input: 'Click the "Code Helper" badge on any card',
            output: 'Shows only Code Helper results. Click badge again to remove filter.',
          },
        ],
        tips: [
          'Export your vault regularly as a backup — if you clear browser data, vault is erased',
          'Use vault to find prompts that worked well — search for the topic and reuse',
          'Vault saves automatically — you do not need to do anything extra',
        ],
      },
      {
        id: 'apikeys',
        emoji: '🔑',
        name: 'API Keys',
        color: '#94a3b8',
        tagline: 'Bring your own API keys — zero markup, you pay providers directly',
        what: 'PromptForge uses your own API keys from AI providers. This means you pay the provider directly at their price — no middleman markup. Your keys are stored only in your browser, never on any server.',
        supported: [
          { name: 'OpenAI', key: 'sk-...', models: 'GPT-4o, GPT-4 Turbo, GPT-3.5', url: 'platform.openai.com' },
          { name: 'Anthropic', key: 'sk-ant-...', models: 'Claude Opus, Sonnet, Haiku', url: 'console.anthropic.com' },
          { name: 'Google', key: 'AIza...', models: 'Gemini 1.5 Pro, Flash', url: 'aistudio.google.com' },
          { name: 'Groq', key: 'gsk_...', models: 'Llama 3.3 70B (FREE), Mixtral', url: 'console.groq.com' },
          { name: 'Deepseek', key: 'sk-...', models: 'Deepseek V3, Coder', url: 'platform.deepseek.com' },
          { name: 'OpenRouter', key: 'sk-or-...', models: '100+ models in one key', url: 'openrouter.ai' },
          { name: 'Mistral', key: '...', models: 'Mistral Large, Medium', url: 'console.mistral.ai' },
        ],
        steps: [
          'Click "API Keys" in the sidebar',
          'Find your provider (OpenAI, Anthropic, etc.)',
          'Click the link to go to their website and get your API key',
          'Paste the key in the field next to the provider name',
          'Click Save',
          'Click "Change Model / API Key" at the top to select which model to use',
          'Start using any tool — your key is now active',
        ],
        examples: [
          {
            label: 'Add Groq key (Free)',
            input: '1. Go to console.groq.com\n2. Sign up free\n3. Click "Create API Key"\n4. Copy the key (starts with gsk_...)\n5. Paste in PromptForge API Keys page → Save',
            output: 'Top bar shows "Key Ready" badge. Select Llama 3.3 70B model. All tools now work for free.',
          },
          {
            label: 'Add OpenAI key',
            input: '1. Go to platform.openai.com\n2. Sign in → API Keys → Create new key\n3. Copy key (starts with sk-...)\n4. Paste in PromptForge → Save\n5. Select GPT-4o model',
            output: 'All tools work with GPT-4o. You pay OpenAI directly at their rates — no markup from PromptForge.',
          },
        ],
        examples: [
          {
            label: 'Add Groq key (Free)',
            input: '1. Go to console.groq.com\n2. Sign up free\n3. Click Create API Key\n4. Copy key (starts with gsk_...)\n5. Paste in PromptForge API Keys → Save',
            output: 'Top bar shows Key Ready badge. Select Llama 3.3 70B model. All tools work for free.',
          },
          {
            label: 'Add OpenAI key',
            input: '1. Go to platform.openai.com\n2. Create new API key (starts with sk-)\n3. Paste in PromptForge → Save\n4. Select GPT-4o model',
            output: 'All tools work with GPT-4o. You pay OpenAI directly — no markup from PromptForge.',
          },
        ],

        tips: [
          'FREE option: Get a Groq API key at console.groq.com — Llama 3.3 70B is completely free',
          'OpenRouter gives you access to 100+ models with one key',
          'Your keys are stored in browser localStorage — they never leave your device',
          'Losing browser data = losing your keys — keep a safe backup of your keys',
        ],
      },
    ],
  },
  // Other languages handled by AI translation
};

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: copied ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${copied ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.12)'}`, color: copied ? '#4ade80' : 'rgba(255,255,255,0.6)', transition: 'all 0.2s' }}>
      {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy Example</>}
    </button>
  );
};

const ToolCard = ({ tool }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.07)`, borderLeft: `4px solid ${tool.color}`, borderRadius: 16, marginBottom: 16, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding: '18px 22px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, userSelect: 'none' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${tool.color}18`, border: `1px solid ${tool.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{tool.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: tool.color }}>{tool.name}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>{tool.tagline}</div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.3)' }}>{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 22px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

              {/* What it does */}
              <div style={{ margin: '18px 0 14px', fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.75 }}>{tool.what}</div>

              {/* Tabs */}
              {tool.tabs && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Tabs / Sections</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                    {tool.tabs.map((tab, i) => (
                      <div key={i} style={{ padding: '10px 14px', background: `${tool.color}0a`, border: `1px solid ${tool.color}25`, borderRadius: 10 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: tool.color }}>{tab.name}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>{tab.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agents (for Inventor) */}
              {tool.agents && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>5 AI Experts</div>
                  {tool.agents.map((a, i) => (
                    <div key={i} style={{ padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: tool.color, minWidth: 180 }}>{a.name}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{a.desc}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Supported providers (for API Keys) */}
              {tool.supported && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Supported Providers</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                    {tool.supported.map((p, i) => (
                      <div key={i} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Key: <code style={{ color: tool.color }}>{p.key}</code></div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Models: {p.models}</div>
                        <div style={{ fontSize: 11, color: tool.color, marginTop: 4 }}>{p.url}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Fields */}
              {tool.fields && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Input Fields — What to fill in</div>
                  {tool.fields.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: tool.color, minWidth: 180, flexShrink: 0 }}>{f.name}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{f.desc}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Steps */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Step by Step — How to use it</div>
                {(tool.steps || []).map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: `${tool.color}18`, border: `1px solid ${tool.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: tool.color, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.65, paddingTop: 3 }}>{step}</div>
                  </div>
                ))}
              </div>

              {/* Examples */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Real Examples — Copy and Try</div>
                {(tool.examples || []).map((ex, i) => (
                  <div key={i} style={{ marginBottom: 14, padding: 16, background: 'rgba(0,0,0,0.25)', border: `1px solid ${tool.color}20`, borderRadius: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: tool.color, marginBottom: 10 }}>📌 {ex.label}</div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 6 }}>What you type:</div>
                      <pre style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: 8, whiteSpace: 'pre-wrap', fontFamily: 'monospace', margin: 0, lineHeight: 1.65 }}>{ex.input}</pre>
                      <div style={{ marginTop: 8 }}><CopyButton text={ex.input} /></div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 6 }}>What you get:</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{ex.output}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tips */}
              {tool.tips && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>💡 Pro Tips</div>
                  {tool.tips.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 14px', marginBottom: 8, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 9 }}>
                      <span style={{ flexShrink: 0 }}>💡</span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Helper function to parse translated plain text documentation back into T.en structure
const parseTranslatedText = (translatedText, originalContent) => {
  if (!translatedText) return originalContent;

  try {
    const lines = translatedText.split('\n');
    const result = JSON.parse(JSON.stringify(originalContent)); // Deep clone
    
    let currentSection = ''; // 'TITLE', 'SUBTITLE', 'SETUP', 'TOOL'
    let currentTool = null;
    let toolIndex = -1;
    let currentMode = ''; // 'TABS', 'FIELDS', 'STEPS', 'EXAMPLES', 'TIPS', 'INFO'
    let exampleIndex = -1;
    let currentExample = null;
    let exampleSubMode = ''; // 'INPUT', 'OUTPUT'
    let setupStepIndex = 0;
    let stepIndex = 0;
    let tipIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const upperLine = line.toUpperCase();

      if (line === 'TITLE') {
        currentSection = 'TITLE';
        continue;
      }
      if (line === 'SUBTITLE') {
        currentSection = 'SUBTITLE';
        continue;
      }
      if (line === 'SETUP') {
        currentSection = 'SETUP';
        setupStepIndex = 0;
        continue;
      }

      if (line.startsWith('=== ') && line.endsWith(' ===')) {
        currentSection = 'TOOL';
        toolIndex++;
        currentTool = result.tools[toolIndex] || null;
        if (currentTool) {
          currentTool.what = ''; // Clear so we can append translated lines
        }
        currentMode = 'INFO';
        stepIndex = 0;
        tipIndex = 0;
        exampleIndex = -1;
        currentExample = null;
        continue;
      }

      if (currentSection === 'TITLE') {
        result.title = line;
        currentSection = '';
        continue;
      }
      if (currentSection === 'SUBTITLE') {
        result.subtitle = line;
        currentSection = '';
        continue;
      }

      if (currentSection === 'SETUP') {
        if (upperLine.startsWith('TIP:')) {
          result.setup_note = line.replace(/^TIP:\s*/i, '').trim();
        } else if (/^\d+\./.test(line)) {
          const text = line.replace(/^\d+\.\s*/, '').trim();
          if (result.setup_steps[setupStepIndex]) {
            result.setup_steps[setupStepIndex].t = text;
            setupStepIndex++;
          }
        } else {
          result.setup_title = line;
        }
      } else if (currentSection === 'TOOL' && currentTool) {
        if (upperLine === 'TABS:') { currentMode = 'TABS'; continue; }
        if (upperLine === 'FIELDS:') { currentMode = 'FIELDS'; continue; }
        if (upperLine === 'STEPS:') { currentMode = 'STEPS'; continue; }
        if (upperLine === 'EXAMPLES:') { currentMode = 'EXAMPLES'; continue; }
        if (upperLine === 'TIPS:') { currentMode = 'TIPS'; continue; }

        if (currentMode === 'INFO') {
          if (!currentTool._taglineSet) {
            currentTool.tagline = line;
            currentTool._taglineSet = true;
          } else {
            currentTool.what = currentTool.what ? currentTool.what + '\n' + line : line;
          }
        } else if (currentMode === 'TABS') {
          if (line.startsWith('- ')) {
            const colonIdx = line.indexOf(':') !== -1 ? line.indexOf(':') : line.indexOf('：');
            let name = '';
            let desc = '';
            if (colonIdx !== -1) {
              name = line.substring(2, colonIdx).trim();
              desc = line.substring(colonIdx + 1).trim();
            } else {
              desc = line.substring(2).trim();
            }

            if (!currentTool._tabIndex) currentTool._tabIndex = 0;
            const targetTab = currentTool.tabs?.[currentTool._tabIndex];
            if (targetTab) {
              if (name) targetTab.name = name;
              targetTab.desc = desc;
              currentTool._tabIndex++;
            }
          }
        } else if (currentMode === 'FIELDS') {
          if (line.startsWith('- ')) {
            const colonIdx = line.indexOf(':') !== -1 ? line.indexOf(':') : line.indexOf('：');
            let name = '';
            let desc = '';
            if (colonIdx !== -1) {
              name = line.substring(2, colonIdx).trim();
              desc = line.substring(colonIdx + 1).trim();
            } else {
              desc = line.substring(2).trim();
            }

            if (!currentTool._fieldIndex) currentTool._fieldIndex = 0;
            const targetField = currentTool.fields?.[currentTool._fieldIndex];
            if (targetField) {
              if (name) targetField.name = name;
              targetField.desc = desc;
              currentTool._fieldIndex++;
            }
          }
        } else if (currentMode === 'STEPS') {
          if (/^\d+\./.test(line)) {
            const text = line.replace(/^\d+\.\s*/, '').trim();
            if (currentTool.steps && currentTool.steps[stepIndex] !== undefined) {
              currentTool.steps[stepIndex] = text;
              stepIndex++;
            }
          }
        } else if (currentMode === 'EXAMPLES') {
          if (line.startsWith('* ')) {
            exampleIndex++;
            currentExample = currentTool.examples?.[exampleIndex] || null;
            if (currentExample) {
              currentExample.label = line.substring(2).trim();
            }
            exampleSubMode = '';
          } else if (upperLine.startsWith('INPUT:')) {
            exampleSubMode = 'INPUT';
            if (currentExample) {
              currentExample.input = line.substring(6).trim();
            }
          } else if (upperLine.startsWith('OUTPUT:')) {
            exampleSubMode = 'OUTPUT';
            if (currentExample) {
              currentExample.output = line.substring(7).trim();
            }
          } else {
            if (currentExample) {
              if (exampleSubMode === 'INPUT') {
                currentExample.input = (currentExample.input ? currentExample.input + '\n' : '') + line;
              } else if (exampleSubMode === 'OUTPUT') {
                currentExample.output = (currentExample.output ? currentExample.output + '\n' : '') + line;
              }
            }
          }
        } else if (currentMode === 'TIPS') {
          if (line.startsWith('- ')) {
            const text = line.substring(2).trim();
            if (currentTool.tips && currentTool.tips[tipIndex] !== undefined) {
              currentTool.tips[tipIndex] = text;
              tipIndex++;
            }
          }
        }
      }
    }

    // cleanup temp fields
    result.tools.forEach(t => {
      delete t._taglineSet;
      delete t._tabIndex;
      delete t._fieldIndex;
    });

    return result;
  } catch (err) {
    console.error('Error parsing translated text:', err);
    return originalContent;
  }
};

const Docs = () => {
  const { activeModel, apiKey, providerKeys, customModels } = useContext(AppContext);
  const [lang, setLang] = useState('en');
  const [search, setSearch] = useState('');
  const [showLang, setShowLang] = useState(false);
  const [otherLang, setOtherLang] = useState('');
  const [translating, setTranslating] = useState(false);
  const [transCache, setTransCache] = useState({});
  const [transError, setTransError] = useState('');

  const currentLangNameEarly = lang === 'other' ? otherLang : (LANGS.find(l => l.code === lang)?.name || 'English');
  const translatedText = lang !== 'en' && transCache[currentLangNameEarly] ? transCache[currentLangNameEarly] : null;

  const content = useMemo(() => {
    return translatedText ? parseTranslatedText(translatedText, T.en) : T.en;
  }, [translatedText]);

  const tools = content.tools;
  const filtered = search.trim()
    ? tools.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.tagline.toLowerCase().includes(search.toLowerCase()))
    : tools;

  // Build plain text version of English docs for AI translation in parts
  const buildEnglishTextParts = () => {
    const serializeTool = (tool) => {
      let text = `=== ${tool.name.toUpperCase()} ===\n`;
      text += `${tool.tagline}\n${tool.what}\n`;
      if (tool.tabs) { text += `TABS:\n`; tool.tabs.forEach(t => { text += `- ${t.name}: ${t.desc}\n`; }); }
      if (tool.fields) { text += `FIELDS:\n`; tool.fields.forEach(f => { text += `- ${f.name}: ${f.desc}\n`; }); }
      if (tool.agents) { text += `AGENTS:\n`; tool.agents.forEach(a => { text += `- ${a.name}: ${a.desc}\n`; }); }
      text += `STEPS:\n`; tool.steps.forEach((s, i) => { text += `${i+1}. ${s}\n`; });
      text += `EXAMPLES:\n`;
      tool.examples.forEach(ex => {
        text += `* ${ex.label}\nINPUT: ${ex.input}\nOUTPUT: ${ex.output}\n`;
      });
      if (tool.tips) { text += `TIPS:\n`; tool.tips.forEach(t => { text += `- ${t}\n`; }); }
      return text;
    };

    // Part 1: Header + Title/Subtitle + Setup + first 4 tools
    let p1 = `=== PROMPTFORGE DOCUMENTATION ===\n\n`;
    p1 += `TITLE\n${T.en.title}\n`;
    p1 += `SUBTITLE\n${T.en.subtitle}\n\n`;
    p1 += `SETUP\n${T.en.setup_title}\n`;
    T.en.setup_steps.forEach(s => { p1 += `${s.n}. ${s.t}\n`; });
    p1 += `\nTIP: ${T.en.setup_note}\n\n`;
    T.en.tools.slice(0, 4).forEach(t => { p1 += serializeTool(t) + '\n'; });

    // Part 2: next 5 tools
    let p2 = '';
    T.en.tools.slice(4, 9).forEach(t => { p2 += serializeTool(t) + '\n'; });

    // Part 3: last tools
    let p3 = '';
    T.en.tools.slice(9).forEach(t => { p3 += serializeTool(t) + '\n'; });

    return [p1.trim(), p2.trim(), p3.trim()];
  };

  // AI Translation
  const translate = useCallback(async (langName) => {
    if (!langName || langName === 'English') return;
    if (transCache[langName]) return;
    setTranslating(true); setTransError('');
    const system = `You are a professional technical documentation translator.
Translate the following PromptForge documentation into ${langName}.
RULES:
1. Translate every word naturally — sound completely native
2. Keep in English: PromptForge, API, URL, CSV, PDF, JSON, HTML, CSS, JavaScript, Python, SQL, OpenAI, Anthropic, Groq, Gemini, Claude, GPT, Llama, OpenRouter, BYOK, TikTok, LinkedIn, Instagram, YouTube, WhatsApp, Twitter, Facebook
3. Keep code examples exactly as-is
4. Keep === markers and bullet format exactly
5. Output ONLY the translated text — no explanations`;
    try {
      const parts = buildEnglishTextParts();
      const results = [];
      for (const part of parts) {
        const r = await callAI(system, 'Translate this part into ' + langName + ':\n' + part, null, activeModel, apiKey, providerKeys, customModels);
        results.push(r);
      }
      setTransCache(prev => ({ ...prev, [langName]: results.join('\n\n') }));
      setTransError('');
    } catch (e) {
      console.error('Translation error:', e);
      setTransError('Translation failed: ' + (e?.message || 'Unknown error. Make sure API key is set.'));
    } finally { setTranslating(false); }
  }, [activeModel, apiKey, providerKeys, customModels, transCache]);

  const handleLangSelect = async (code) => {
    if (code === 'other') { setShowLang(false); return; }
    setLang(code); setShowLang(false);
    if (code === 'en') { setTransError(''); return; }
    const langObj = LANGS.find(l => l.code === code);
    await translate(langObj?.name || code);
  };

  const handleOtherSubmit = async (e) => {
    e.preventDefault();
    if (!otherLang.trim()) return;
    setLang('other'); setShowLang(false);
    await translate(otherLang.trim());
  };

  const currentLangName = lang === 'other' ? otherLang : (LANGS.find(l => l.code === lang)?.name || 'English');
  const isTranslated = lang !== 'en' && transCache[currentLangName];

  return (
    <div className="page active">
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '0 0 32px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', borderRadius: 99, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', fontSize: 11, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>
            📖 Documentation
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, margin: '0 0 10px', background: 'linear-gradient(135deg, #fff, #a78bfa, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {content.title}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', maxWidth: 560, margin: '0 auto 24px' }}>{content.subtitle}</p>

          {/* Language switcher — AI powered */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
            <button onClick={() => setShowLang(p => !p)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10,
              background: lang !== 'en' ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${lang !== 'en' ? '#a78bfa' : 'rgba(255,255,255,0.12)'}`,
              color: lang !== 'en' ? '#a78bfa' : 'rgba(255,255,255,0.7)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700
            }}>
              <Globe size={15} />
              {lang === 'en' ? '🇺🇸 English' : lang === 'other' ? `🌐 ${otherLang}` : LANGS.find(l => l.code === lang)?.label}
              <ChevronDown size={13} />
              {lang !== 'en' && (
                <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: 'rgba(167,139,250,0.25)', color: '#a78bfa', marginLeft: 4 }}>AI TRANSLATED</span>
              )}
            </button>

            <AnimatePresence>
              {showLang && (
                <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  style={{ position: 'absolute', top: '110%', left: 0, zIndex: 999, background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 8, minWidth: 230, boxShadow: '0 8px 30px rgba(0,0,0,0.4)', maxHeight: 320, overflowY: 'auto' }}>
                  {LANGS.map(l => (
                    <div key={l.code}>
                      {l.code === 'other' ? (
                        <form onSubmit={handleOtherSubmit} style={{ padding: '6px 4px', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 4 }}>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 5, paddingLeft: 6 }}>Type any language:</div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <input value={otherLang} onChange={e => setOtherLang(e.target.value)} placeholder="e.g. Swahili, Tamil..." style={{ flex: 1, padding: '6px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
                            <button type="submit" style={{ padding: '6px 12px', borderRadius: 7, background: '#7c3aed', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Go</button>
                          </div>
                        </form>
                      ) : (
                        <button onClick={() => handleLangSelect(l.code)} style={{
                          width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                          background: lang === l.code ? 'rgba(167,139,250,0.15)' : 'transparent',
                          border: 'none', color: lang === l.code ? '#a78bfa' : 'rgba(255,255,255,0.75)',
                          cursor: 'pointer', fontFamily: 'inherit', fontWeight: lang === l.code ? 700 : 400,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                          {l.label}
                          {transCache[l.name] && <span style={{ fontSize: 9, color: '#4ade80' }}>✓ cached</span>}
                        </button>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Translation loading */}
          {translating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontSize: 13, color: '#a78bfa', marginBottom: 16 }}>
              <Loader2 size={15} className="animate-spin" />
              AI is translating into {currentLangName}...
            </div>
          )}
          {transError && (
            <div style={{ fontSize: 12, color: '#f87171', marginBottom: 12 }}>{transError}</div>
          )}
          {isTranslated && !translating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: '#4ade80' }}>✓ Translated to {currentLangName}</span>
              <button onClick={() => { setTransCache(p => ({ ...p, [currentLangName]: null })); translate(currentLangName); }} style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <RefreshCw size={11} /> Retranslate
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Setup */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ marginBottom: 28, padding: '20px 22px', background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.22)', borderRadius: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#a78bfa', marginBottom: 14 }}>{content.setup_title}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 12 }}>
          {content.setup_steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{s.n}</div>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, paddingTop: 3 }}>{s.t}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 13, color: '#4ade80', padding: '8px 14px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8 }}>
          {content.setup_note}
        </div>
      </motion.div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search tools..."
          style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 40, padding: '10px 14px 10px 40px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
        />
      </div>

      {/* Tools */}
      <div>
        {filtered.map((tool, i) => (
          <motion.div key={tool.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <ToolCard tool={tool} />
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 40, padding: '20px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
          PromptForge v2.0 · BYOK · 100% Browser-based · All data stays on your device
        </p>
      </div>
    </div>
  );
};

export default Docs;