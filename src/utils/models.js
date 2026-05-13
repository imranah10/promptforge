export const ALL_MODELS = [
  // OpenRouter (Free Models - Placed at top for visibility)
  { id: 'openrouter:meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', color: '#f97316', provider: 'openrouter' },
  { id: 'openrouter:nousresearch/hermes-3-llama-3.1-405b:free', name: 'Hermes 405B (Free)', color: '#ea580c', provider: 'openrouter' },
  { id: 'openrouter:qwen/qwen3-coder:free', name: 'Qwen 3 Coder (Free)', color: '#fb923c', provider: 'openrouter' },
  { id: 'openrouter:nvidia/nemotron-3-super-120b-a12b:free', name: 'Nemotron 120B (Free)', color: '#a3e635', provider: 'openrouter' },
  { id: 'openrouter:openrouter/free', name: 'OpenRouter (Auto Free)', color: '#c084fc', provider: 'openrouter' },

  // Anthropic
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', color: '#7c5cfc', provider: 'anthropic' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', color: '#8b5cf6', provider: 'anthropic' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', color: '#c4b5fd', provider: 'anthropic' },
  
  // OpenAI
  { id: 'gpt-4o', name: 'GPT-4o', color: '#34d399', provider: 'openai' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', color: '#6ee7b7', provider: 'openai' },
  { id: 'o1-preview', name: 'o1 (Reasoning)', color: '#2dd4bf', provider: 'openai' },
  { id: 'o3-mini', name: 'o3-mini', color: '#14b8a6', provider: 'openai' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', color: '#10b981', provider: 'openai' },
  
  // Google
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', color: '#fbbf24', provider: 'google' },
  { id: 'gemini-1.5-pro-002', name: 'Gemini 1.5 Pro', color: '#fde047', provider: 'google' },
  { id: 'gemini-ultra', name: 'Gemini Ultra', color: '#f59e0b', provider: 'google' },
  
  // Llama / Groq / Meta / Google (via Groq)
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', color: '#f97316', provider: 'groq' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', color: '#fdba74', provider: 'groq' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B', color: '#fbbf24', provider: 'groq' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', color: '#60a5fa', provider: 'groq' },
  
  // Mistral
  { id: 'mistral-large-latest', name: 'Mistral Large', color: '#5b8def', provider: 'mistral' },
  { id: 'mistral-medium-latest', name: 'Mistral Medium', color: '#93c5fd', provider: 'mistral' },
  { id: 'mixtral-8x22b-instruct', name: 'Mixtral 8x22B', color: '#60a5fa', provider: 'mistral' },
  
  // DeepSeek
  { id: 'deepseek-chat', name: 'DeepSeek V3', color: '#f472b6', provider: 'deepseek' },
  { id: 'deepseek-reasoner', name: 'DeepSeek R1', color: '#ec4899', provider: 'deepseek' },
  { id: 'deepseek-coder', name: 'DeepSeek Coder', color: '#f9a8d4', provider: 'deepseek' },
  
  // xAI
  { id: 'grok-2', name: 'Grok 2', color: '#22d3ee', provider: 'xai' },
  { id: 'grok-1.5', name: 'Grok 1.5', color: '#67e8f9', provider: 'xai' },

  // Cohere
  { id: 'command-r-plus', name: 'Cohere Command R+', color: '#a3e635', provider: 'cohere' },
  { id: 'command-r', name: 'Cohere Command R', color: '#bef264', provider: 'cohere' },

  // Perplexity
  { id: 'llama-3.1-sonar-huge-128k-online', name: 'Perplexity Sonar', color: '#818cf8', provider: 'perplexity' },
  
  // Other Services
  { id: 'azure-gpt-4o', name: 'Azure OpenAI GPT-4o', color: '#0078d4', provider: 'azure' },
  { id: 'together-llama-3', name: 'Together AI (Llama 3)', color: '#38bdf8', provider: 'together' },
];

export const PROVIDERS = [
  { id: 'anthropic', name: '🟣 Anthropic (Claude)', sub: 'Claude 3.5 Sonnet, Haiku', placeholder: 'sk-ant-...' },
  { id: 'openai', name: '🟢 OpenAI', sub: 'GPT-4o, o1, o3-mini', placeholder: 'sk-...' },
  { id: 'google', name: '🟡 Google (Gemini)', sub: 'Gemini 1.5 Pro, Flash', placeholder: 'AIza...' },
  { id: 'mistral', name: '🔵 Mistral', sub: 'Mistral Large, Mixtral', placeholder: '...' },
  { id: 'groq', name: '🟠 Groq (Llama)', sub: 'Llama 3.1 405B/70B', placeholder: 'gsk_...' },
  { id: 'deepseek', name: '🩷 DeepSeek', sub: 'DeepSeek-V3, R1', placeholder: 'sk-...' },
  { id: 'xai', name: '⚫ xAI (Grok)', sub: 'Grok 2', placeholder: 'xai-...' },
  { id: 'cohere', name: '🌿 Cohere', sub: 'Command R+', placeholder: '...' },
  { id: 'perplexity', name: '🌐 Perplexity', sub: 'Sonar Online', placeholder: 'pplx-...' },
  { id: 'openrouter', name: '🌌 OpenRouter', sub: 'Any Model', placeholder: 'sk-or-v1-...' },
  { id: 'azure', name: '🔷 Azure OpenAI', sub: 'Enterprise GPT', placeholder: '...' },
  { id: 'together', name: '☁️ Together AI', sub: 'Open Source Models', placeholder: '...' }
];
