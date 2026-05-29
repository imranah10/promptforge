// ─── Shared live model fetcher ───────────────────────────────────────────────
// Used by ModelSelector (topbar) and ModelCompare so they show the EXACT same
// list. Strict allowlist filtering — only chat-completion-capable models pass
// through. Audio (Whisper, Orpheus, TTS), embeddings, safety classifiers
// (Llama Guard, Prompt Guard, gpt-oss-safeguard), image (DALL-E, SDXL),
// moderation, and reranker models are excluded so users never accidentally
// pick a non-chat model and hit a 400 "invalid for chat completions" error.

// Patterns excluded across ALL providers (case-insensitive)
const NON_CHAT_PATTERNS = /\b(whisper|tts|dall-?e|text-embed|embedding|moderation|prompt-guard|llama-?guard|safeguard|orpheus|stable-diffusion|sd-?xl|playai|vision-?embed|reranker|rerank|search-rank|asr|speech-to-text|text-to-speech)\b/i;

// Allowlist per provider — only model families known to support chat
export function isChatCapable(provider, modelId) {
  const id = String(modelId || '').toLowerCase();
  if (!id) return false;
  if (NON_CHAT_PATTERNS.test(id)) return false;

  switch (provider) {
    case 'openai':
      // GPT family + reasoning (o1, o3, o4) only
      return /^(gpt-|o[1-9](-|$)|chatgpt-)/i.test(id);
    case 'groq':
      // Llama, Mixtral, Gemma, Qwen, GPT-OSS, DeepSeek-R1-distill, Compound (Groq's chat router), Allam
      return /(llama|mixtral|gemma|qwen|gpt-oss|deepseek|compound|allam)/i.test(id);
    case 'google':
      // Gemini chat models (excludes embedding-* and aqa)
      return /^gemini-/i.test(id) && !/embedding|aqa/i.test(id);
    case 'openrouter':
      // OpenRouter aggregates everything — extra modality check is done in fetchOpenRouter
      return true;
    case 'mistral':
      // Skip embed and OCR models
      return !/embed|ocr|moderation/i.test(id);
    case 'deepseek':
      return /^deepseek-(chat|reasoner|coder|v\d)/i.test(id);
    case 'xai':
      return /^grok-/i.test(id);
    case 'perplexity':
      return /^sonar/i.test(id);
    default:
      return true;
  }
}

// ─── Provider fetchers ───────────────────────────────────────────────────────
export async function fetchProviderModels(providerId, key) {
  if (!key) return [];
  try {
    switch (providerId) {
      case 'openai': {
        const res = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${key}` } });
        const data = await res.json();
        if (!data?.data) return [];
        return data.data
          .filter(m => isChatCapable('openai', m.id))
          .sort((a, b) => (b.created || 0) - (a.created || 0))
          .slice(0, 25)
          .map(m => ({ id: m.id, name: m.id, provider: 'openai' }));
      }
      case 'groq': {
        const res = await fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: `Bearer ${key}` } });
        const data = await res.json();
        return (data?.data || [])
          .filter(m => isChatCapable('groq', m.id))
          .sort((a, b) => (b.created || 0) - (a.created || 0))
          .map(m => ({ id: m.id, name: m.id, provider: 'groq' }));
      }
      case 'google': {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await res.json();
        return (data?.models || [])
          .filter(m => {
            const id = (m.name || '').replace('models/', '');
            return isChatCapable('google', id) && m.supportedGenerationMethods?.includes('generateContent');
          })
          .map(m => ({
            id: m.name.replace('models/', ''),
            name: m.displayName || m.name.replace('models/', ''),
            provider: 'google',
          }));
      }
      case 'openrouter': {
        const res = await fetch('https://openrouter.ai/api/v1/models', { headers: { Authorization: `Bearer ${key}` } });
        const data = await res.json();
        return (data?.data || [])
          .filter(m => {
            // STRICT modality filter — accept ONLY models that:
            //   - input  includes 'text' (or unspecified)
            //   - output includes 'text' (NOT just 'audio'/'image')
            const inputs  = m.architecture?.input_modalities  || [];
            const outputs = m.architecture?.output_modalities || [];
            const hasTextInput  = inputs.length === 0  || inputs.includes('text');
            const hasTextOutput = outputs.length === 0 || outputs.includes('text');
            if (!hasTextInput || !hasTextOutput) return false;

            // Block obvious non-chat names even if metadata is missing/wrong
            const id   = String(m.id   || '').toLowerCase();
            const name = String(m.name || '').toLowerCase();
            const blocklist = /\b(lyria|tts|whisper|dall-?e|stable-diffusion|sd-?xl|flux-image|imagen|veo|sora|runway|pika|kling|musicgen|audiogen|riffusion|bark|orpheus|playai|reranker|rerank|embed|moderation|guard|safeguard|ocr|asr|speech-to-text|text-to-speech|musicbox|soundbox|image-?gen|image-?2|video-?gen|clip-preview|pro-preview)\b/i;
            if (blocklist.test(id) || blocklist.test(name)) return false;

            return true;
          })
          .sort((a, b) => (b.created || 0) - (a.created || 0))
          .slice(0, 60)
          .map(m => ({
            id: `openrouter:${m.id}`,
            name: m.name || m.id,
            provider: 'openrouter',
            free: m.pricing?.prompt === '0' || /:free$/i.test(m.id),
          }));
      }
      case 'mistral': {
        const res = await fetch('https://api.mistral.ai/v1/models', { headers: { Authorization: `Bearer ${key}` } });
        const data = await res.json();
        return (data?.data || [])
          .filter(m => isChatCapable('mistral', m.id))
          .map(m => ({ id: m.id, name: m.id, provider: 'mistral' }));
      }
      case 'deepseek': {
        const res = await fetch('https://api.deepseek.com/models', { headers: { Authorization: `Bearer ${key}` } });
        const data = await res.json();
        return (data?.data || [])
          .filter(m => isChatCapable('deepseek', m.id))
          .map(m => ({ id: m.id, name: m.id, provider: 'deepseek' }));
      }
      case 'xai': {
        const res = await fetch('https://api.x.ai/v1/models', { headers: { Authorization: `Bearer ${key}` } });
        const data = await res.json();
        return (data?.data || [])
          .filter(m => isChatCapable('xai', m.id))
          .map(m => ({ id: m.id, name: m.id, provider: 'xai' }));
      }
      default:
        return [];
    }
  } catch (e) {
    console.warn(`[modelFetcher] ${providerId} fetch failed:`, e?.message);
    return [];
  }
}
