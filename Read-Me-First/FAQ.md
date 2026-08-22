# Frequently Asked Questions

### Do I need to pay for AI separately?

Yes. PromptForge does not include any AI provider subscription or API credits. Each end user of your deployed product enters their own API key (OpenAI, Anthropic, Google, Groq, Mistral, Deepseek, or OpenRouter) inside the app. This is the "BYOK" (Bring Your Own Key) model — it's what keeps costs low since there's no markup.

### Is this a hosted service, or do I need to deploy it myself?

This is source code only. You (or a developer you hire) need to deploy it — to Vercel, Netlify, Cloudflare Pages, or any host that supports static React apps. Setup instructions are in README.md.

### I don't know how to code. Can I still use this?

You can still launch this with help from a freelance developer for the initial setup (usually a few hours of work for someone experienced with React). After deployment, day-to-day use of the product requires no coding. Customizing tools, prompts, or design will require basic React knowledge.

### Can I rebrand this and sell it under my own name?

Yes. See LICENSE.txt for full details. You can rebrand, customize, and sell access to your own deployment. You cannot resell the raw source code itself as a template/product.

### Does this store my users' API keys or data anywhere?

No. API keys are encrypted and stored only in each user's own browser (LocalStorage). There is no central database collecting user keys, prompts, or chat history. This is by design.

### What AI providers are supported?

OpenAI, Anthropic, Google (Gemini), Groq, Mistral, Deepseek, and OpenRouter (which gives access to 100+ models through one key).

### What is the "active users" counter on the landing page? Do I need to set it up?

It's an optional live visitor counter powered by Upstash Redis (free tier available). It is NOT required — the app works completely fine without it. See README.md "Environment Variables" section if you want it.

### Why is Supabase listed in package.json if it's not used?

It was included during earlier development but is not currently wired into any active feature. You can safely remove it from package.json if you don't plan to add Supabase-backed features yourself.

### What is the scratch/ folder?

It contains one leftover development utility script not used by the app. Safe to delete before deploying.

### Can I add my own tools to this?

Yes. Each tool lives in its own file under `src/pages/`. Study the pattern used by existing tools (e.g. `DataWizard.jsx` or `AIWriter.jsx`) and follow the same structure to add new ones.

### Does this work on mobile?

The interface is responsive, but it's primarily designed for desktop/laptop use, since most of these tools (code editors, document chat, multi-panel comparisons) work best on larger screens.

### I found a bug. What do I do?

Since this is a one-time source code purchase (not an ongoing SaaS subscription with dedicated support), you are responsible for debugging issues in your own deployment, or hiring a developer to do so. The code is fully open for you to read and modify.

### Can multiple people use my deployed version at once?

Yes — there's no shared backend storing data, so each user's session is independent in their own browser. Any limits would come from your hosting provider's plan, not from the app itself.
