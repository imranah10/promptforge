// ── ALL MODELS — Verified, real model IDs (2024–2025) ────────────────────────
// Models are kept current. ModelCompare also fetches live lists from the
// provider APIs (OpenAI, Groq, Google, OpenRouter, Mistral, DeepSeek, xAI),
// so newly released models appear automatically there. This static list is
// the safe fallback / topbar default selection.
export const ALL_MODELS = [
  // ─── ANTHROPIC (Claude) ──────────────────────────────────────────────────
  { id: 'claude-opus-4-5',              name: 'Claude Opus 4.5',           color: '#7c5cfc', provider: 'anthropic' },
  { id: 'claude-sonnet-4-5',            name: 'Claude Sonnet 4.5',         color: '#8b5cf6', provider: 'anthropic' },
  { id: 'claude-3-5-sonnet-20241022',   name: 'Claude 3.5 Sonnet',         color: '#a78bfa', provider: 'anthropic' },
  { id: 'claude-3-5-haiku-20241022',    name: 'Claude 3.5 Haiku',          color: '#c4b5fd', provider: 'anthropic' },
  { id: 'claude-3-opus-20240229',       name: 'Claude 3 Opus',             color: '#9333ea', provider: 'anthropic' },

  // ─── OPENAI ──────────────────────────────────────────────────────────────
  { id: 'gpt-4o',                       name: 'GPT-4o',                    color: '#10b981', provider: 'openai' },
  { id: 'gpt-4o-mini',                  name: 'GPT-4o Mini',               color: '#34d399', provider: 'openai' },
  { id: 'gpt-4-turbo',                  name: 'GPT-4 Turbo',               color: '#059669', provider: 'openai' },
  { id: 'o1-preview',                   name: 'o1-Preview (Reasoning)',    color: '#2dd4bf', provider: 'openai' },
  { id: 'o1-mini',                      name: 'o1-Mini',                   color: '#5eead4', provider: 'openai' },
  { id: 'o3-mini',                      name: 'o3-Mini',                   color: '#14b8a6', provider: 'openai' },

  // ─── GROQ (Ultra Fast — Free tier available) ─────────────────────────────
  // Static fallback only — live fetch from Groq API replaces this on app load.
  // Decommissioned models (gemma2-9b-it, mixtral-8x7b-32768) removed.
  { id: 'llama-3.3-70b-versatile',      name: 'Llama 3.3 70B (Groq)',      color: '#f97316', provider: 'groq', tier: 'free' },
  { id: 'llama-3.1-8b-instant',         name: 'Llama 3.1 8B Instant (Groq)', color: '#fdba74', provider: 'groq', tier: 'free' },

  // ─── GOOGLE GEMINI ───────────────────────────────────────────────────────
  { id: 'gemini-2.0-flash-exp',         name: 'Gemini 2.0 Flash',          color: '#fbbf24', provider: 'google' },
  { id: 'gemini-1.5-pro-002',           name: 'Gemini 1.5 Pro',            color: '#fde047', provider: 'google' },
  { id: 'gemini-1.5-flash',             name: 'Gemini 1.5 Flash',          color: '#facc15', provider: 'google' },

  // ─── DEEPSEEK ────────────────────────────────────────────────────────────
  { id: 'deepseek-chat',                name: 'DeepSeek V3 Chat',          color: '#f472b6', provider: 'deepseek' },
  { id: 'deepseek-reasoner',            name: 'DeepSeek R1 (Reasoner)',    color: '#ec4899', provider: 'deepseek' },

  // ─── XAI (GROK) ──────────────────────────────────────────────────────────
  { id: 'grok-2-latest',                name: 'Grok 2',                    color: '#22d3ee', provider: 'xai' },
  { id: 'grok-2-vision-latest',         name: 'Grok 2 Vision',             color: '#67e8f9', provider: 'xai' },

  // ─── MISTRAL ─────────────────────────────────────────────────────────────
  { id: 'mistral-large-latest',         name: 'Mistral Large',             color: '#5b8def', provider: 'mistral' },
  { id: 'mistral-small-latest',         name: 'Mistral Small',             color: '#7dd3fc', provider: 'mistral' },

  // ─── PERPLEXITY ──────────────────────────────────────────────────────────
  { id: 'sonar-pro',                    name: 'Sonar Pro (Web Search)',    color: '#6366f1', provider: 'perplexity' },
  { id: 'sonar',                        name: 'Sonar',                     color: '#818cf8', provider: 'perplexity' },

  // ─── OPENROUTER (Free models — no separate paid key needed) ──────────────
  { id: 'openrouter:meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free via OR)', color: '#84cc16', provider: 'openrouter', tier: 'free' },
  { id: 'openrouter:google/gemma-2-9b-it:free',              name: 'Gemma 2 9B (Free via OR)',    color: '#a3e635', provider: 'openrouter', tier: 'free' },
  { id: 'openrouter:mistralai/mistral-7b-instruct:free',     name: 'Mistral 7B (Free via OR)',    color: '#bef264', provider: 'openrouter', tier: 'free' },
];

// ── PROVIDERS — Keys configurable in API Keys page ───────────────────────────
// All providers below are text/chat LLMs.
export const PROVIDERS = [
  { id: 'openai',     name: '🟢 OpenAI',           sub: 'GPT-4o, o1, o3',                     placeholder: 'sk-...',         category: 'text' },
  { id: 'anthropic',  name: '🟣 Anthropic (Claude)', sub: 'Claude Opus 4.5, Sonnet 4.5, 3.5', placeholder: 'sk-ant-...',     category: 'text' },
  { id: 'deepseek',   name: '🩷 DeepSeek',         sub: 'DeepSeek V3, R1 Reasoner',           placeholder: 'sk-...',         category: 'text' },
  { id: 'google',     name: '🟡 Google (Gemini)',  sub: 'Gemini 2.0 Flash, 1.5 Pro',          placeholder: 'AIza...',        category: 'text' },
  { id: 'groq',       name: '🟠 Groq (Hyper-Speed)', sub: 'Llama 3.3, Qwen, GPT-OSS',         placeholder: 'gsk_...',        category: 'text' },
  { id: 'openrouter', name: '🌌 OpenRouter',       sub: 'Any model (free options available)', placeholder: 'sk-or-v1-...',   category: 'text' },
  { id: 'mistral',    name: '🔵 Mistral',          sub: 'Mistral Large, Small',               placeholder: '...',            category: 'text' },
  { id: 'xai',        name: '⚫ xAI (Grok)',       sub: 'Grok 2, Grok 2 Vision',              placeholder: 'xai-...',        category: 'text' },
  { id: 'perplexity', name: '🌐 Perplexity',       sub: 'Sonar Pro (web search)',             placeholder: 'pplx-...',       category: 'text' },
  { id: 'together',   name: '☁️ Together AI',      sub: 'Llama 3.3 70B and more',             placeholder: '...',            category: 'text' },
  { id: 'azure',      name: '🔷 Azure OpenAI',     sub: 'Enterprise GPT (custom endpoint)',   placeholder: '...',            category: 'text' },
];

// ── PROVIDER metadata for grouping in UI (icon, color, display name) ─────────
export const PROVIDER_META = {
  anthropic:  { name: 'Anthropic',        emoji: '🟣', color: '#8b5cf6' },
  openai:     { name: 'OpenAI',           emoji: '🟢', color: '#10b981' },
  groq:       { name: 'Groq',             emoji: '🟠', color: '#f97316' },
  google:     { name: 'Google Gemini',    emoji: '🟡', color: '#fbbf24' },
  deepseek:   { name: 'DeepSeek',         emoji: '🩷', color: '#ec4899' },
  xai:        { name: 'xAI (Grok)',       emoji: '⚫', color: '#22d3ee' },
  mistral:    { name: 'Mistral',          emoji: '🔵', color: '#3b82f6' },
  perplexity: { name: 'Perplexity',       emoji: '🌐', color: '#6366f1' },
  openrouter: { name: 'OpenRouter',       emoji: '🌌', color: '#c084fc' },
  cohere:     { name: 'Cohere',           emoji: '🟤', color: '#a16207' },
  together:   { name: 'Together AI',      emoji: '☁️', color: '#38bdf8' },
  custom:     { name: 'Custom Models',    emoji: '🛠️', color: '#94a3b8' },
};
