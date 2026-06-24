# PromptForge

A privacy-first, multi-tool AI workspace. Users bring their own API keys (BYOK) — no subscription, no proxy server, no middleman markup. All AI requests go straight from the browser to the provider.

---

## What's Inside (14 Tools)

- **AI Writer** — 20 content types, humanize, A/B testing, tone analysis
- **Code Helper** — fix/explain/convert code, git commit generator, security audit
- **Creator Studio** — platform-specific social content (8 platforms)
- **Prompt Optimizer** — rewrites weak prompts into structured ones, with live testing
- **The Inventor** — 5-agent AI council that debates a business idea
- **SEO Optimizer** — keyword research, meta tags, schema generator
- **Chat With Data** — upload PDF/CSV/Excel/images, ask questions, get charts
- **Data Wizard** — generates SQL, Excel formulas, Python, Regex, DAX from plain English; also explains existing code/formulas
- **The Spider** — researches any URL/company/topic with sourced results
- **Model Compare** — runs one prompt on two AI models side-by-side, with an AI judge verdict
- **Prompt Library** — 65 ready-made prompts across 6 categories
- **History Vault** — auto-saves every generation, searchable
- **API Keys manager** — supports OpenAI, Anthropic, Google, Groq, Mistral, Deepseek, OpenRouter
- **Documentation Hub** — built-in usage guide for every tool

Plus a marketing landing page, pricing page, and dashboard.

---

## Tech Stack

- React 19 + Vite 8
- React Router 7
- Tailwind CSS 4 (custom dark theme)
- Three.js + React Three Fiber (landing page visuals)
- Framer Motion (animations)
- Lenis (smooth scroll)
- PDF.js, Mammoth.js, SheetJS — client-side document parsing
- Tesseract.js — in-browser OCR
- Recharts — charts
- React Markdown + remark-gfm

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Run locally

```bash
npm run dev
```

Opens at `http://localhost:5173` by default.

### 3. Build for production

```bash
npm run build
```

Output goes to the `dist/` folder — deploy this to any static host.

---

## Environment Variables (Optional)

The `/api/active-users.js` serverless function (used for the "people online" live counter on the landing page) needs an Upstash Redis instance. **This is fully optional** — the app works without it; you'll just lose that one counter.

See `.env.example` for the exact variables. Get a free Upstash Redis instance at https://upstash.com

No other environment variables are required. AI provider API keys are entered by each end user inside the app itself (API Keys page) — they are never stored in your server or `.env` file.

---

## Deployment

This deploys cleanly to:

- **Vercel** — connect the repo, or run `vercel` in the project root (a `vercel.json` with routing/security headers is already included)
- **Netlify** — drag-and-drop the `dist/` folder, or connect the repo
- **Cloudflare Pages** — connect the repo, build command `npm run build`, output directory `dist`

---

## Rebranding / White-Labeling

1. Replace logo/icon files in `public/`
2. Update the name, tagline, and analytics tracking ID in `index.html`
3. Update content in `src/pages/LandingPage.jsx`
4. Update `package.json` `name` field
5. Adjust colors/theme in your CSS/Tailwind config if desired

No license keys or activation steps are required — the code is yours to modify.

---

## Before You Deploy — Housekeeping

- The `index.html` file currently has a Google Analytics tracking script with the original developer's tracking ID (`G-Q9FWNSYE9Z`). Replace it with your own GA4 ID, or remove the script block entirely if you don't want analytics.
- The `scratch/` folder contains a leftover development utility script (`fix_markdown.cjs`). It is not imported or used anywhere in the app — safe to delete.
- `@supabase/supabase-js` is listed in `package.json` but not actively used by any current feature. Safe to remove if you don't plan to add Supabase-backed features yourself.

---

## Important Notes

- This is **source code**, not a hosted SaaS. You are responsible for deploying and maintaining it.
- No AI API keys are included. Your end users provide their own.
- Basic familiarity with React/Node.js is recommended for setup and customization. If you're not a developer, you may need to hire one for initial deployment.
- This is a one-time source code purchase — see FAQ.md for common questions before reaching out for support.
