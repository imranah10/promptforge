export const ALL_MODELS = [
  // --- OPENROUTER FREE (Verified Stable) ---
  { id: 'openrouter:nvidia/nemotron-3-super-120b-a12b:free', name: 'Nemotron 3 120B (Free)', color: '#84cc16', provider: 'openrouter', tier: 'free' },
  { id: 'openrouter:openrouter/free', name: 'OpenRouter (Auto Free)', color: '#c084fc', provider: 'openrouter', tier: 'free' },

  // --- GROQ (Ultra Fast & Verified) ---
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq Fast)', color: '#f97316', provider: 'groq', tier: 'free' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Groq Fast)', color: '#fdba74', provider: 'groq', tier: 'free' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B (Groq Fast)', color: '#fbbf24', provider: 'groq', tier: 'free' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (Groq Fast)', color: '#60a5fa', provider: 'groq', tier: 'free' },

  // --- ANTHROPIC (2026 & Classic Flagships) ---
  { id: 'claude-4-7-opus-20260416', name: 'Claude Opus 4.7 (2026)', color: '#7c5cfc', provider: 'anthropic' },
  { id: 'claude-4-6-sonnet-20260217', name: 'Claude Sonnet 4.6 (2026)', color: '#8b5cf6', provider: 'anthropic' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Classic)', color: '#a78bfa', provider: 'anthropic' },
  
  // --- OPENAI (2026 & Classic Flagships) ---
  { id: 'gpt-5-5-latest', name: 'GPT-5.5 (2026)', color: '#34d399', provider: 'openai' },
  { id: 'gpt-5-o-latest', name: 'GPT-5o (Omni 2)', color: '#10b981', provider: 'openai' },
  { id: 'o1-pro-max', name: 'o1-Pro Max (Latest Reasoning)', color: '#2dd4bf', provider: 'openai' },
  { id: 'gpt-4o-2024-11-20', name: 'GPT-4o (Classic)', color: '#059669', provider: 'openai' },
  
  // --- DEEPSEEK (New King of AI) ---
  { id: 'deepseek-v4-pro', name: 'DeepSeek V4-Pro (2026)', color: '#f472b6', provider: 'deepseek' },
  { id: 'deepseek-r2-thinking', name: 'DeepSeek R2 (Thinking)', color: '#ec4899', provider: 'deepseek' },
  { id: 'deepseek-v3', name: 'DeepSeek V3 (Classic)', color: '#fb7185', provider: 'deepseek' },
  
  // --- GOOGLE ---
  { id: 'gemini-3-1-pro', name: 'Gemini 3.1 Pro (2026)', color: '#fbbf24', provider: 'google' },
  { id: 'gemini-1.5-pro-002', name: 'Gemini 1.5 Pro (Classic)', color: '#fde047', provider: 'google' },
  
  // --- XAI (GROK) ---
  { id: 'grok-4-3-latest', name: 'Grok 4.3 (2026)', color: '#22d3ee', provider: 'xai' },
  { id: 'grok-2', name: 'Grok 2 (Classic)', color: '#67e8f9', provider: 'xai' },

  // --- MISTRAL ---
  { id: 'mistral-large-3', name: 'Mistral Large 3 (2026)', color: '#5b8def', provider: 'mistral' },

  // --- PERPLEXITY ---
  { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro', color: '#6366f1', provider: 'perplexity' },

  // --- TOGETHER AI ---
  { id: 'together-llama-3-3-70b', name: 'Llama 3.3 70B', color: '#38bdf8', provider: 'together' },
];

export const PROVIDERS = [
  { id: 'openai', name: '🟢 OpenAI', sub: 'GPT-5.5, 5o, GPT-4o', placeholder: 'sk-...' },
  { id: 'anthropic', name: '🟣 Anthropic (Claude)', sub: 'Claude 4.7 Opus, Sonnet, v3.5', placeholder: 'sk-ant-...' },
  { id: 'deepseek', name: '🩷 DeepSeek', sub: 'DeepSeek V4-Pro, V3, R2', placeholder: 'sk-...' },
  { id: 'google', name: '🟡 Google (Gemini)', sub: 'Gemini 3.1 Pro, 1.5 Pro', placeholder: 'AIza...' },
  { id: 'groq', name: '🟠 Groq (Hyper-Speed)', sub: 'Llama 3.3, Llama 3.1', placeholder: 'gsk_...' },
  { id: 'openrouter', name: '🌌 OpenRouter', sub: 'Any Model (Free available)', placeholder: 'sk-or-v1-...' },
  { id: 'mistral', name: '🔵 Mistral', sub: 'Mistral Large 3', placeholder: '...' },
  { id: 'xai', name: '⚫ xAI (Grok)', sub: 'Grok 4.3, Grok 2', placeholder: 'xai-...' },
  { id: 'perplexity', name: '🌐 Perplexity', sub: 'Sonar Pro', placeholder: 'pplx-...' },
  { id: 'together', name: '☁️ Together AI', sub: 'Llama 3.3 70B', placeholder: '...' },
  { id: 'azure', name: '🔷 Azure OpenAI', sub: 'Enterprise GPT-5', placeholder: '...' }
];







