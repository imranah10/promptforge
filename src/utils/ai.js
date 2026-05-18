export function getEffectiveKey(activeModel, apiKey, providerKeys, customModels = []) {
  const modelsArr = Array.isArray(customModels) ? customModels : [];
  const customModel = modelsArr.find(m => m.id === activeModel);
  if (customModel && customModel.apiKey) return customModel.apiKey;

  const pKeys = providerKeys || {};
  const model = (activeModel || '').toLowerCase();

  // If it's explicitly an OpenRouter model
  if (model.startsWith('openrouter:')) return pKeys.openrouter || apiKey || '';

  // Explicit Provider Checks
  if (model.includes('gpt') || model.includes('o1') || model.includes('o3')) return pKeys.openai || apiKey || '';
  if (model.includes('claude')) return pKeys.anthropic || apiKey || '';
  if (model.includes('gemini')) return pKeys.google || apiKey || '';
  if (model.includes('llama') || model.includes('gemma') || model.includes('mixtral')) return pKeys.groq || pKeys.openrouter || apiKey || '';
  if (model.includes('deepseek')) return pKeys.deepseek || pKeys.openrouter || apiKey || '';
  if (model.includes('grok')) return pKeys.xai || pKeys.openrouter || apiKey || '';
  if (model.includes('mistral')) return pKeys.mistral || pKeys.groq || pKeys.openrouter || apiKey || '';
  if (model.includes('sonar')) return pKeys.perplexity || apiKey || '';
  if (model.includes('command')) return pKeys.cohere || apiKey || '';
  
  return pKeys.openrouter || pKeys.openai || apiKey || '';
}

async function safeFetch(url, options, provider) {
  try {
    const res = await fetch(url, options);
    let data;
    try {
      data = await res.json();
    } catch (e) {
      if (!res.ok) throw new Error(`${provider} Error (${res.status}): Connection Failed`);
      throw new Error(`${provider} returned invalid JSON`);
    }

    if (!res.ok) {
      const msg = data.error?.message || data.error || (typeof data === 'string' ? data : null) || res.statusText || 'Unknown error';
      throw new Error(`${provider} Error (${res.status}): ${msg}`);
    }
    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error(`${provider} Connection Blocked: Check your internet or disable Ad-blocker/VPN.`);
    }
    throw err;
  }
}

export async function callAI(arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
  let messages = [];
  let modelOverride, activeModel, apiKey, providerKeys, customModels;

  if (Array.isArray(arg1)) {
    // callAI(messages, modelOverride, activeModel, apiKey, providerKeys, customModels)
    messages = arg1; 
    modelOverride = arg2; 
    activeModel = arg3; 
    apiKey = arg4; 
    providerKeys = arg5; 
    customModels = arg6;
  } else if (typeof arg1 === 'string') {
    // callAI(systemPrompt, userPrompt, modelOverride, activeModel, apiKey, providerKeys, customModels)
    messages = [{ role: 'system', content: arg1 }, { role: 'user', content: arg2 }];
    modelOverride = arg3; 
    activeModel = arg4; 
    apiKey = arg5; 
    providerKeys = arg6; 
    customModels = arg7;
  }

  let model = modelOverride || activeModel;
  let key = getEffectiveKey(model, apiKey, providerKeys, customModels);
  const pKeys = providerKeys || {};

  if (!key && model !== 'singularity' && model !== 'inventor') {
    throw new Error(`API Key for ${model} is missing. Please add it in Settings.`);
  }

  const mLower = (model || '').toLowerCase();

  // ROUTING LOGIC
  if (model === 'singularity') return callSingularityCore(messages, apiKey, pKeys, customModels);
  if (model === 'inventor') return callInventor(messages, apiKey, pKeys, customModels);

  if (model.startsWith('openrouter:')) return callOpenRouter(model.split('openrouter:')[1], messages, key);
  if (mLower.includes('claude')) return callAnthropic(model, messages, key);
  if (mLower.includes('gpt') || mLower.startsWith('o1') || mLower.startsWith('o3')) return callOpenAI(model, messages, key);
  if (mLower.includes('gemini')) return callGemini(model, messages, key);
  
  // Groq Priority for Llama/Gemma/Mixtral
  if (mLower.includes('llama') || mLower.includes('gemma') || mLower.includes('mixtral')) {
    if (pKeys.groq) return callGroq(model, messages, pKeys.groq);
    return callOpenRouter(model, messages, key);
  }
  
  if (mLower.includes('deepseek')) {
    if (pKeys.deepseek) return callDeepSeek(model, messages, pKeys.deepseek);
    return callOpenRouter(model, messages, key);
  }

  if (mLower.includes('mistral')) {
    if (pKeys.mistral) return callMistral(model, messages, pKeys.mistral);
    if (pKeys.groq) return callGroq(model, messages, pKeys.groq);
    return callOpenRouter(model, messages, key);
  }

  if (mLower.includes('grok')) return callXAI(model, messages, key);
  if (mLower.includes('command')) return callCohere(model, messages, key);
  if (mLower.includes('sonar')) return callPerplexity(model, messages, key);
  
  // Default fallback
  if (key && (key.startsWith('sk-or-') || model.includes('/'))) return callOpenRouter(model, messages, key);
  return callOpenAI(model, messages, key);
}

function parseResponse(data, provider) {
  if (!data) throw new Error(`${provider} returned no data.`);
  if (data.choices && data.choices[0]) {
    if (data.choices[0].message) return data.choices[0].message.content;
    if (data.choices[0].text) return data.choices[0].text;
  }
  if (data.content && data.content[0]) return data.content[0].text;
  if (data.candidates && data.candidates[0]) return data.candidates[0].content.parts[0].text;
  return 'Invalid response structure from ' + provider;
}

async function callXAI(model, messages, key) {
  const data = await safeFetch('https://api.x.ai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key }, body: JSON.stringify({ model, messages }) }, 'xAI');
  return parseResponse(data, 'xAI');
}

async function callCohere(model, messages, key) {
  const system = messages.find(m => m.role === 'system')?.content || '';
  const lastUser = messages.findLast(m => m.role === 'user')?.content || '';
  const data = await safeFetch('https://api.cohere.ai/v1/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key }, body: JSON.stringify({ model, message: lastUser, preamble: system }) }, 'Cohere');
  return parseResponse(data, 'Cohere');
}

async function callPerplexity(model, messages, key) {
  const data = await safeFetch('https://api.perplexity.ai/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key }, body: JSON.stringify({ model, messages }) }, 'Perplexity');
  return parseResponse(data, 'Perplexity');
}

async function callOpenRouter(modelId, messages, key) {
  if (!key) throw new Error('OpenRouter key is missing.');
  const data = await safeFetch('https://openrouter.ai/api/v1/chat/completions', { 
    method: 'POST', 
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': 'Bearer ' + key,
      'HTTP-Referer': 'https://promptforge.ai', 
      'X-Title': 'PromptForge'
    }, 
    body: JSON.stringify({ model: modelId, messages }) 
  }, 'OpenRouter');
  return parseResponse(data, 'OpenRouter');
}

async function callAnthropic(model, messages, key) {
  const system = messages.find(m => m.role === 'system')?.content || '';
  const filteredMessages = messages.filter(m => m.role !== 'system');
  const data = await safeFetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model, max_tokens: 4096, system, messages: filteredMessages }) }, 'Anthropic');
  return parseResponse(data, 'Anthropic');
}

async function callOpenAI(model, messages, key) {
  const data = await safeFetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key }, body: JSON.stringify({ model, messages }) }, 'OpenAI');
  return parseResponse(data, 'OpenAI');
}

async function callGemini(model, messages, key) {
  const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const data = await safeFetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${key}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents }) }, 'Google Gemini');
  return parseResponse(data, 'Google Gemini');
}

async function callMistral(model, messages, key) {
  const data = await safeFetch('https://api.mistral.ai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key }, body: JSON.stringify({ model, messages }) }, 'Mistral');
  return parseResponse(data, 'Mistral');
}

async function callGroq(model, messages, key) {
  if (!key) throw new Error('Groq key is missing.');
  const data = await safeFetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key }, body: JSON.stringify({ model, messages }) }, 'Groq');
  return parseResponse(data, 'Groq');
}

async function callDeepSeek(model, messages, key) {
  const data = await safeFetch('https://api.deepseek.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key }, body: JSON.stringify({ model, messages }) }, 'DeepSeek');
  return parseResponse(data, 'DeepSeek');
}

async function callSingularityCore(messages, apiKey, providerKeys, customModels) {
  const pKeys = providerKeys || {};
  const useOR = !pKeys.openai && !pKeys.anthropic && pKeys.openrouter;
  
  // Dynamic Model Council - Prioritizes available keys
  let models = [];
  if (pKeys.openai) models.push('gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo');
  else if (pKeys.anthropic) models.push('claude-3-5-sonnet-latest', 'claude-3-opus-latest', 'claude-3-haiku-20240307');
  else if (pKeys.groq) models.push('llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768');
  else if (pKeys.openrouter) models.push('meta-llama/llama-3.3-70b-instruct', 'google/gemma-2-9b-it:free', 'mistralai/mistral-7b-instruct:free');
  else models.push('llama-3.3-70b-versatile', 'llama-3.3-70b-versatile', 'llama-3.3-70b-versatile'); // Hard fallback to Groq if key exists

  const perspectives = await Promise.all(models.slice(0, 3).map(async (m, idx) => {
    try {
      // Add a role prefix to the user message to simulate different council members
      const roles = [
        "LOGICAL CORE: Focus on technical structure and efficiency.",
        "CREATIVE CORE: Focus on innovative features and user experience.",
        "SECURITY CORE: Focus on risks, vulnerabilities, and hardening."
      ];
      const roleMessages = [{ role: 'system', content: roles[idx] }, ...messages];
      return await callAI(roleMessages, m, m, apiKey, providerKeys, customModels);
    } catch (e) { 
      console.warn(`Singularity Core: Member ${idx+1} (${m}) failed.`, e);
      return `[Council Perspective Restricted: ${e.message}]`; 
    }
  }));
  
  const synthesisPrompt = [
    { 
      role: 'system', 
      content: `You are the SINGULARITY ARCHITECT. You must synthesize the Council's perspectives into a "Final Sovereign Solution".
      
      OUTPUT PROTOCOLS (MANDATORY):
      1. DOSSIER STYLE: Use markdown # Headers, tables for comparisons, and [x] checklists.
      2. INDUSTRIAL GRANULARITY: Provide extreme detail. Never be brief. If a topic has 10 layers, analyze all 10. Use specific protocols, versions, and architectural patterns.
      3. EXECUTIVE TONE: No "AI fluff". Start with a "MISSION SUMMARY".
      4. TRIPLE-LAYER SECURITY: Always include a "Security Matrix".
      5. COMPETITIVE MOAT: For business/strategy, include a "Flywheel Analysis".
      6. UNIVERSAL EXPERTISE: You are an expert in ALL domains (Legal, Medical, Finance, Tech, Strategy). Provide deep-dive research for every request.
      7. STRICT LANGUAGE: Latin script only (English/Hinglish). NO DEVNAGRI.
      8. MANDATORY VISUAL ARTIFACT: You MUST provide a directory/file structure at the end of every technical or organizational plan. This structure MUST be encapsulated in a \`\`\`tree\`\`\` code block. No other format is allowed.
      9. EXHAUSTIVE DEPTH: Every response must be a minimum of 800 words if the topic is complex. Never summarize. Analyze every micro-component. Use industrial terminology.`
    }, 
    { role: 'user', content: `Neural Perspectives:\n${perspectives.join('\n\n')}` }
  ];
  
  const synthModel = models[0];
  const synthesis = await callAI(synthesisPrompt, synthModel, '', apiKey, providerKeys, customModels);

  const judgePrompt = [
    { role: 'system', content: 'You are the SINGULARITY JUDGE. Critically audit the synthesis for errors, hallucinations, or missing details. If perfect, reply ONLY with "PERFECT". Otherwise, list necessary fixes. STRICT: No Devnagri.' }, 
    { role: 'user', content: `Synthesis to Audit:\n${synthesis}` }
  ];
  
  const judgeModel = models[1] || models[0];
  const critique = await callAI(judgePrompt, judgeModel, '', apiKey, providerKeys, customModels);
  
  if (critique.trim().toUpperCase() === 'PERFECT') return synthesis;

  const refinementPrompt = [
    { 
      role: 'system', 
      content: `You are the MASTER REFINER. Your mission is to fix all flaws identified by the Judge and deliver the "Final Sovereign Solution". 
      STRICT: Latin script only. Hinglish/English. No Devnagri.` 
    }, 
    { role: 'user', content: `Draft: ${synthesis}\n\nRequired Fixes: ${critique}` }
  ];
  return await callAI(refinementPrompt, synthModel, '', apiKey, providerKeys, customModels);
}

async function callInventor(messages, apiKey, providerKeys, customModels) {
  const pKeys = providerKeys || {};
  // Priority: 1. Claude (Best for Invention), 2. GPT-4o, 3. Groq (Llama 3.3), 4. OpenRouter Free
  let model = 'claude-3-5-sonnet-latest';
  if (!pKeys.anthropic) {
    if (pKeys.openai) model = 'gpt-4o';
    else if (pKeys.groq) model = 'llama-3.3-70b-versatile';
    else if (pKeys.openrouter) model = 'openrouter:meta-llama/llama-3.1-8b-instruct:free';
    else model = 'llama-3.3-70b-versatile'; // Fallback to Groq if everything fails
  }

  const prompt = [
    { role: 'system', content: 'You are THE INVENTOR. You are a world-class cross-domain innovator. When given two domains, create a detailed, realistic, and groundbreaking invention that fuses them. Include Name, Concept, Technical Mechanism, and Potential Impact.' },
    { role: 'user', content: messages[messages.length - 1].content }
  ];
  return callAI(prompt, model, '', apiKey, providerKeys, customModels);
}

export async function generateImage(prompt, providerKeys, size = '1024x1024', tool = 'DALL-E 3') {
  const pKeys = providerKeys || {};
  if (tool === 'DALL-E 3') {
    const key = pKeys.openai;
    const res = await fetch('https://api.openai.com/v1/images/generations', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key }, 
      body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size }) 
    });
    const data = await res.json(); 
    if (data.error) throw new Error(`DALL-E Error: ${data.error.message}`);
    return data.data[0].url;
  } 
  const seed = Math.floor(Math.random() * 1000000);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${size.split('x')[0]}&height=${size.split('x')[1]}&seed=${seed}&nologo=true&model=flux`;
}
