export function getEffectiveKey(activeModel, apiKey, providerKeys, customModels = []) {
  // Check if it's a custom model
  const customModel = customModels.find(m => m.id === activeModel);
  if (customModel && customModel.apiKey) {
    return customModel.apiKey;
  }

  const providerMap = {
    'claude': 'anthropic',
    'gpt': 'openai',
    'o1': 'openai',
    'o3': 'openai',
    'gemini': 'google',
    'mistral': 'mistral',
    'mixtral': 'mistral',
    'llama': 'groq', // Groq acts as main Llama provider
    'deepseek': 'deepseek',
    'grok': 'xai',
    'command': 'cohere',
    'sonar': 'perplexity',
    'openrouter': 'openrouter',
    'qwen': 'openrouter', // Route Qwen via OpenRouter
    'auto': 'openrouter',
    'azure': 'azure',
    'together': 'together'
  };
  
  if (activeModel.startsWith('openrouter:')) {
    return providerKeys['openrouter'] || apiKey || sessionStorage.getItem('pf_key') || '';
  }

  for (const [prefix, provider] of Object.entries(providerMap)) {
    if (activeModel.toLowerCase().includes(prefix) && providerKeys[provider]) {
      return providerKeys[provider];
    }
  }
  return apiKey || sessionStorage.getItem('pf_key') || '';
}

export async function callAI(systemPrompt, userPrompt, modelOverride, activeModel, apiKey, providerKeys, customModels = []) {
  const model = modelOverride || activeModel;
  const key = getEffectiveKey(model, apiKey, providerKeys, customModels);
  
  if (!key) {
    throw new Error('No API key found. Please add your API key in the model bar above or in the API Keys section.');
  }



  // Check if it's a custom model
  const customModel = customModels.find(m => m.id === model);
  if (customModel) {
    return callCustomModel(customModel, systemPrompt, userPrompt, key);
  }

  // Check if it's an OpenRouter prefixed model
  if (model.startsWith('openrouter:')) {
    const actualModelId = model.split('openrouter:')[1];
    return callOpenRouter(actualModelId, systemPrompt, userPrompt, key);
  }

  if (model.startsWith('claude')) {
    return callAnthropic(model, systemPrompt, userPrompt, key);
  } else if (model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('o3')) {
    return callOpenAI(model, systemPrompt, userPrompt, key);
  } else if (model.startsWith('gemini')) {
    return callGemini(model, systemPrompt, userPrompt, key);
  } else if (model.includes('mistral') || model.includes('mixtral')) {
    return callMistral(model, systemPrompt, userPrompt, key);
  } else if (model.startsWith('llama')) {
    return callGroq(model, systemPrompt, userPrompt, key);
  } else if (model.startsWith('deepseek')) {
    return callDeepSeek(model, systemPrompt, userPrompt, key);
  } else if (model.startsWith('grok')) {
    return callXAI(model, systemPrompt, userPrompt, key);
  } else if (model.includes('command')) {
    return callCohere(model, systemPrompt, userPrompt, key);
  } else if (model.includes('sonar')) {
    return callPerplexity(model, systemPrompt, userPrompt, key);
  } else {
    // Default to OpenAI-compatible
    return callOpenAI(model, systemPrompt, userPrompt, key);
  }
}

async function callXAI(model, system, user, key) {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({
      model, max_tokens: 4096,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'xAI error');
  return data.choices[0].message.content;
}

async function callCohere(model, system, user, key) {
  const res = await fetch('https://api.cohere.ai/v1/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({
      model, message: system + '\n\n' + user,
      preamble: system
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Cohere error');
  return data.text;
}

async function callPerplexity(model, system, user, key) {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({
      model, max_tokens: 4096,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Perplexity error');
  return data.choices[0].message.content;
}

async function callOpenRouter(modelId, system, user, key) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + key,
      'HTTP-Referer': 'https://promptforge.ai', // Optional but recommended by OpenRouter
      'X-Title': 'PromptForge Studio' // Optional but recommended by OpenRouter
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 4096,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}

async function callCustomModel(modelObj, system, user, key) {
  // Assume OpenAI compatible endpoint
  const res = await fetch(modelObj.endpoint || 'https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({
      model: modelObj.id, max_tokens: 4096,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}

async function callAnthropic(model, system, user, key) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model, max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: user }]
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content[0].text;
}

async function callOpenAI(model, system, user, key) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({
      model, max_tokens: 4096,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}

async function callGemini(model, system, user, key) {
  let modelId = model;
  if (model === 'gemini-ultra') modelId = 'gemini-1.5-pro-002'; // Fallback for ultra
  
  const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelId}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: system + '\n\n' + user }] }],
      generationConfig: { maxOutputTokens: 4096 }
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates[0].content.parts[0].text;
}

async function callMistral(model, system, user, key) {
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({
      model, max_tokens: 4096,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Mistral error');
  return data.choices[0].message.content;
}

async function callGroq(model, system, user, key) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({
      model, max_tokens: 4096,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Groq error');
  return data.choices[0].message.content;
}

export async function generateImage(prompt, providerKeys, size = '1024x1024', tool = 'DALL-E 3') {
  // Mapping tools to specific API models
  
  // 1. DALL-E 3 (OpenAI)
  if (tool === 'DALL-E 3') {
    const key = providerKeys['openai'];
    if (!key) throw new Error('OpenAI API key required for DALL-E 3');
    
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size, quality: 'standard' })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.data[0].url;
  } 

  // 2. Basic Engine (Stable Fallback) - No Key Required
  if (tool.includes('(Free)') || tool.includes('Basic') || (!providerKeys['together'] && !providerKeys['openai'])) {
    const seed = Math.floor(Math.random() * 1000000);
    const width = size.split('x')[0] || '1024';
    const height = size.split('x')[1] || '1024';
    // Extremely clean prompt for stability
    const cleanPrompt = prompt.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 150).trim();
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;
  }

  // 3. Premium Engines (Together AI - Flux/SDXL)
  const togetherKey = providerKeys['together'];
  if (!togetherKey) throw new Error(`Together AI API key required for ${tool}. Or select a (Free) tool.`);

  let modelId = 'black-forest-labs/FLUX.1-schnell'; 
  if (tool === 'Midjourney' || tool === 'Ideogram' || tool === 'Leonardo AI' || tool.includes('Nano Banana')) {
    modelId = 'black-forest-labs/FLUX.1-schnell';
  } else if (tool === 'Stable Diffusion') {
    modelId = 'stabilityai/stable-diffusion-xl-base-1.0';
  }

  const res = await fetch('https://api.together.xyz/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + togetherKey },
    body: JSON.stringify({
      model: modelId,
      prompt: prompt,
      width: parseInt(size.split('x')[0]),
      height: parseInt(size.split('x')[1]),
      steps: 4,
      n: 1
    })
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Together AI error');
  return data.data[0].url;
}

async function callDeepSeek(model, system, user, key) {
  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({
      model, max_tokens: 4096,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'DeepSeek error');
  return data.choices[0].message.content;
}
