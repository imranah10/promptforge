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

// ── AES-GCM ENCRYPTION HELPERS ─────────────────────────────────────────────
// Device-bound key derived from browser fingerprint — keys never stored as plain text
const getEncKey = async () => {
  const fp = [navigator.userAgent, navigator.language, screen.colorDepth, screen.width, screen.height, Intl.DateTimeFormat().resolvedOptions().timeZone].join('|');
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(fp), 'PBKDF2', false, ['deriveKey']);
  const salt = enc.encode('pf_salt_v1');
  return crypto.subtle.deriveKey(
    { name:'PBKDF2', salt, iterations:100000, hash:'SHA-256' },
    keyMaterial, { name:'AES-GCM', length:256 }, false, ['encrypt','decrypt']
  );
};

const encryptData = async (plainText) => {
  if (!plainText) return '';
  try {
    const key = await getEncKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, enc.encode(plainText));
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0); combined.set(new Uint8Array(encrypted), iv.length);
    return btoa(String.fromCharCode(...combined));
  } catch { return plainText; }
};

const decryptData = async (cipherText) => {
  if (!cipherText) return '';
  try {
    const key = await getEncKey();
    const combined = Uint8Array.from(atob(cipherText), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const dec = new TextDecoder();
    const decrypted = await crypto.subtle.decrypt({ name:'AES-GCM', iv }, key, data);
    return dec.decode(decrypted);
  } catch { return cipherText; } // fallback if already plain (migration)
};

const encryptKeys = async (keysObj) => {
  const result = {};
  for (const [k, v] of Object.entries(keysObj)) {
    result[k] = v ? await encryptData(v) : '';
  }
  return result;
};

const decryptKeys = async (keysObj) => {
  const result = {};
  for (const [k, v] of Object.entries(keysObj)) {
    result[k] = v ? await decryptData(v) : '';
  }
  return result;
};

export const AppProvider = ({ children }) => {
  // Load & decrypt keys on init
  const [keysReady, setKeysReady] = useState(false);
  const initialGlobalKey = ''; // will be loaded async
  const [activeModel, setActiveModel] = useState(() => {
    const savedModelId = localStorage.getItem('pf_active_model') || '';
    return savedModelId && isProbablyChatModel(savedModelId) ? savedModelId : SAFE_DEFAULT_ID;
  });
  const [activeModelName, setActiveModelName] = useState(() => localStorage.getItem('pf_active_model_name') || SAFE_DEFAULT_NAME);
  const [apiKey, setApiKey] = useState('');
  const [providerKeys, setProviderKeys] = useState({});

  // Custom models state
  const [customModels, setCustomModels] = useState(
    JSON.parse(localStorage.getItem('pf_custom_models') || '[]')
  );

  // Vault / History State
  const [vaultHistory, setVaultHistory] = useState(
    JSON.parse(localStorage.getItem('pf_vault_history') || '[]')
  );

  // ── CONTEXT MEMORY: a small, user-controlled "active project" memory ──────
  // Separate from vaultHistory (which is a full log). This is just the
  // current business/project facts the user wants every tool to remember,
  // stored only in this browser's localStorage — no server, no account.
  const [savedContext, setSavedContext] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pf_saved_context') || 'null'); }
    catch (_) { return null; }
  });

  // Decrypt keys on mount
  useEffect(() => {
    const loadKeys = async () => {
      try {
        const encGlobal = localStorage.getItem('pf_key') || '';
        const encProvider = JSON.parse(localStorage.getItem('pf_provider_keys') || '{}');
        const [dGlobal, dProvider] = await Promise.all([
          decryptData(encGlobal),
          decryptKeys(encProvider),
        ]);
        if (dGlobal) setApiKey(dGlobal);
        if (Object.keys(dProvider).length) setProviderKeys(dProvider);
      } catch(e) { console.warn('Key decrypt failed:', e); }
      finally { setKeysReady(true); }
    };
    loadKeys();

    // Session timeout — clear keys from memory after 2 hours inactivity
    let inactivityTimer;
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        setApiKey('');
        setProviderKeys({});
        console.info('PromptForge: Keys cleared from memory after inactivity.');
      }, 2 * 60 * 60 * 1000); // 2 hours
    };
    const events = ['mousemove','keydown','click','touchstart','scroll'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive:true }));
    resetTimer();
    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, []);

  const [toastMsg, setToastMsg] = useState(null);
  const [uiLang, setUiLang] = useState(() => localStorage.getItem('pf_ui_lang') || 'en');
  const [translateEnabled, setTranslateEnabled] = useState(() => localStorage.getItem('pf_translate_enabled') === 'true');
  const [whiteLabelOpen, setWhiteLabelOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('pf_ui_lang', uiLang);
  }, [uiLang]);

  useEffect(() => {
    localStorage.setItem('pf_translate_enabled', translateEnabled);
  }, [translateEnabled]);

  // Save apiKey encrypted
  useEffect(() => {
    if (!keysReady) return;
    encryptData(apiKey).then(enc => localStorage.setItem('pf_key', enc));
  }, [apiKey, keysReady]);

  // Save providerKeys encrypted
  useEffect(() => {
    if (!keysReady) return;
    encryptKeys(providerKeys).then(enc => localStorage.setItem('pf_provider_keys', JSON.stringify(enc)));
  }, [providerKeys, keysReady]);

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

  // ── CONTEXT MEMORY helpers ──────────────────────────────────────────────
  useEffect(() => {
    try {
      if (savedContext) localStorage.setItem('pf_saved_context', JSON.stringify(savedContext));
      else localStorage.removeItem('pf_saved_context');
    } catch (_) {}
  }, [savedContext]);

  const setActiveContext = (summary, sourceTool) => {
    setSavedContext({
      summary,
      sourceTool,
      savedAt: new Date().toLocaleString(),
    });
  };

  const clearActiveContext = () => setSavedContext(null);

  return (
    <AppContext.Provider
      value={{
        activeModel, setActiveModel,
        activeModelName, setActiveModelName,
        apiKey, setApiKey,
        providerKeys, setProviderKeys,
        customModels, addCustomModel, removeCustomModel,
        vaultHistory, saveToVault, clearVault, deleteVaultItem,
        savedContext, setActiveContext, clearActiveContext,
        toastMsg, showToast,
        uiLang, setUiLang,
        translateEnabled, setTranslateEnabled,
        whiteLabelOpen, setWhiteLabelOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};