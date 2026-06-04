import React, { createContext, useState, useEffect } from 'react';
import { ALL_MODELS } from '../utils/models';
import { isChatCapable } from '../utils/modelFetcher';

export const AppContext = createContext();

// Known-good fallback if a user has a stale/invalid activeModel saved
const SAFE_DEFAULT_ID   = 'claude-3-5-sonnet-20241022';
const SAFE_DEFAULT_NAME = 'Claude 3.5 Sonnet';

// ID safety check — strict validation against ALL_MODELS or chat-capable patterns
function isProbablyChatModel(id) {
  if (!id) return false;
  // Static known models always pass
  if (ALL_MODELS.some(m => m.id === id)) return true;
  // Custom models pass (they're user-defined)
  if (id.startsWith('custom:') || id === 'singularity' || id === 'inventor') return true;
  // OpenRouter prefixed models — check the inner id
  if (id.startsWith('openrouter:')) return isChatCapable('openrouter', id.split(':')[1] || '');
  // Otherwise check provider-specific patterns
  for (const provider of ['openai', 'groq', 'google', 'anthropic', 'mistral', 'deepseek', 'xai', 'perplexity']) {
    if (isChatCapable(provider, id)) return true;
  }
  return false;
}

export const AppProvider = ({ children }) => {
  const initialProviderKeys = JSON.parse(localStorage.getItem('pf_provider_keys') || '{}');
  const initialGlobalKey = localStorage.getItem('pf_key') || '';

  // Restore previously selected model if it's still valid; else fall back safely
  const savedModelId   = localStorage.getItem('pf_active_model')      || '';
  const savedModelName = localStorage.getItem('pf_active_model_name') || '';

  let initialModelId   = SAFE_DEFAULT_ID;
  let initialModelName = SAFE_DEFAULT_NAME;

  if (savedModelId && isProbablyChatModel(savedModelId)) {
    initialModelId   = savedModelId;
    initialModelName = savedModelName || savedModelId;
  } else if (!initialGlobalKey) {
    const savedProviders = Object.keys(initialProviderKeys).filter(k => initialProviderKeys[k]);
    if (savedProviders.length > 0) {
      const firstProvider = savedProviders[0];
      const model = ALL_MODELS.find(m => m.provider === firstProvider);
      if (model) {
        initialModelId = model.id;
        initialModelName = model.name;
      }
    }
  }

  const [activeModel, setActiveModel] = useState(initialModelId);
  const [activeModelName, setActiveModelName] = useState(initialModelName);
  const [apiKey, setApiKey] = useState(initialGlobalKey);
  const [providerKeys, setProviderKeys] = useState(initialProviderKeys);
  
  // Custom models state
  const [customModels, setCustomModels] = useState(
    JSON.parse(localStorage.getItem('pf_custom_models') || '[]')
  );

  // Vault / History State
  const [vaultHistory, setVaultHistory] = useState(
    JSON.parse(localStorage.getItem('pf_vault_history') || '[]')
  );

  const [toastMsg, setToastMsg] = useState(null);
  const [uiLang, setUiLang] = useState(() => localStorage.getItem('pf_ui_lang') || 'en');

  useEffect(() => {
    localStorage.setItem('pf_ui_lang', uiLang);
  }, [uiLang]);

  useEffect(() => {
    localStorage.setItem('pf_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('pf_provider_keys', JSON.stringify(providerKeys));
  }, [providerKeys]);

  useEffect(() => {
    localStorage.setItem('pf_custom_models', JSON.stringify(customModels));
  }, [customModels]);

  useEffect(() => {
    localStorage.setItem('pf_vault_history', JSON.stringify(vaultHistory));
  }, [vaultHistory]);

  // Persist active model selection across reloads
  useEffect(() => {
    if (activeModel) localStorage.setItem('pf_active_model', activeModel);
  }, [activeModel]);

  useEffect(() => {
    if (activeModelName) localStorage.setItem('pf_active_model_name', activeModelName);
  }, [activeModelName]);

  const showToast = (message, type = 'success') => {
    setToastMsg({ message, type, id: Date.now() });
  };

  const addCustomModel = (model) => {
    setCustomModels(prev => [...prev, model]);
  };

  const removeCustomModel = (modelId) => {
    setCustomModels(prev => prev.filter(m => m.id !== modelId));
    if (activeModel === modelId) {
      setActiveModel('claude-3-5-sonnet-20241022');
      setActiveModelName('Claude 3.5 Sonnet');
    }
  };

  const saveToVault = (toolName, prompt, result) => {
    const newItem = {
      id: Date.now().toString(),
      date: new Date().toLocaleString(),
      toolName,
      prompt,
      result,
      model: activeModelName
    };
    setVaultHistory(prev => [newItem, ...prev].slice(0, 100)); // Keep last 100 items
  };

  const clearVault = () => {
    setVaultHistory([]);
  };

  const deleteVaultItem = (id) => {
    setVaultHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        activeModel, setActiveModel,
        activeModelName, setActiveModelName,
        apiKey, setApiKey,
        providerKeys, setProviderKeys,
        customModels, addCustomModel, removeCustomModel,
        vaultHistory, saveToVault, clearVault, deleteVaultItem,
        toastMsg, showToast,
        uiLang, setUiLang,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};