import React, { createContext, useState, useEffect } from 'react';
import { ALL_MODELS } from '../utils/models';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const initialProviderKeys = JSON.parse(localStorage.getItem('pf_provider_keys') || '{}');
  const initialGlobalKey = localStorage.getItem('pf_key') || '';
  
  let initialModelId = 'claude-3-5-sonnet-20241022';
  let initialModelName = 'Claude 3.5 Sonnet';

  if (!initialGlobalKey) {
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
        toastMsg, showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
