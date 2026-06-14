import { useContext, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI, getEffectiveKey } from '../utils/ai';

// In-memory cache for translations to avoid redundant AI calls
// Format: { [lang]: { [originalText]: translatedText } }
const translationCache = {};

export function usePageTranslate(pageKey) {
  const pageRef = useRef(null);
  const { uiLang, translateEnabled, activeModel, apiKey, providerKeys, customModels } = useContext(AppContext);

  useEffect(() => {
    const element = pageRef.current;
    if (!element) return;

    let isMounted = true;

    // Helper to walk the DOM and find all text nodes
    const getTextNodes = (root) => {
      const nodes = [];
      const walk = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            
            // Skip code, pre, script, style, etc.
            const tagName = parent.tagName.toLowerCase();
            if (['script', 'style', 'code', 'pre', 'noscript'].includes(tagName)) {
              return NodeFilter.FILTER_REJECT;
            }
            
            // Skip nodes that are purely whitespace/numbers/symbols
            const text = node.nodeValue.trim();
            if (!text || !/[a-zA-Z]/.test(text) || text.length < 2) {
              return NodeFilter.FILTER_REJECT;
            }
            
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      let currentNode;
      while ((currentNode = walk.nextNode())) {
        nodes.push(currentNode);
      }
      return nodes;
    };

    const restoreEnglish = () => {
      const textNodes = getTextNodes(element);
      textNodes.forEach(node => {
        if (node.__originalText !== undefined) {
          node.nodeValue = node.__originalText;
        }
      });
    };

    const translatePage = async () => {
      const effectiveKey = getEffectiveKey(activeModel, apiKey, providerKeys, customModels);
      if (!translateEnabled || uiLang === 'en' || !effectiveKey) {
        restoreEnglish();
        return;
      }

      const textNodes = getTextNodes(element);
      if (textNodes.length === 0) return;

      const textsToTranslate = [];
      const nodeMap = []; // Keep track of which node gets which translation

      if (!translationCache[uiLang]) {
        translationCache[uiLang] = {};
      }

      for (const node of textNodes) {
        // Save the original text on first encounter
        if (node.__originalText === undefined) {
          node.__originalText = node.nodeValue;
        }

        const originalText = node.__originalText.trim();
        if (!originalText) continue;

        // Check if we already have it in cache
        if (translationCache[uiLang][originalText]) {
          // Replace immediately
          node.nodeValue = node.__originalText.replace(originalText, translationCache[uiLang][originalText]);
        } else {
          textsToTranslate.push(originalText);
          nodeMap.push({ node, originalText });
        }
      }

      // If nothing new to translate, we are done
      if (textsToTranslate.length === 0) return;

      // Remove duplicates
      const uniqueTexts = Array.from(new Set(textsToTranslate));

      // Translate in batches of e.g. 30 items
      const batchSize = 30;
      for (let i = 0; i < uniqueTexts.length; i += batchSize) {
        if (!isMounted) return;
        const batch = uniqueTexts.slice(i, i + batchSize);

        try {
          const systemPrompt = `You are a professional UI translator. Translate the following list of UI text strings into the language: ${uiLang}.
STRICT RULES:
1. Return a valid JSON array of strings, where each element is the translation of the corresponding index in the input array.
2. Maintain all capitalization, punctuation, and style of the original.
3. Keep product names like "PromptForge", "AI Writer", "Social Media AI", "History Vault", "Data Wizard" in English.
4. Output ONLY the JSON array. Do not include any explanations, markdown code blocks, or extra text. Example output: ["translation1", "translation2"]`;

          const userPrompt = JSON.stringify(batch);
          const response = await callAI(systemPrompt, userPrompt, null, activeModel, apiKey, providerKeys, customModels);

          if (!isMounted) return;

          let translations;
          try {
            const cleanResponse = response.replace(/```json/g, '').replace(/```/g, '').trim();
            translations = JSON.parse(cleanResponse);
          } catch (e) {
            console.error('Failed to parse translation JSON:', response, e);
            continue;
          }

          if (Array.isArray(translations) && translations.length === batch.length) {
            batch.forEach((original, idx) => {
              translationCache[uiLang][original] = translations[idx];
            });

            // Update DOM nodes
            nodeMap.forEach(({ node, originalText }) => {
              if (translationCache[uiLang][originalText]) {
                node.nodeValue = node.__originalText.replace(originalText, translationCache[uiLang][originalText]);
              }
            });
          }
        } catch (err) {
          console.error('Translation error:', err);
        }
      }
    };

    // Run initial translation
    translatePage();

    // Use MutationObserver to translate dynamic updates
    const observer = new MutationObserver((mutations) => {
      // Avoid infinite loop since we modify node.nodeValue ourselves
      // We only care if nodes are added, or if text content changed but not to its translated value
      let shouldTranslate = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldTranslate = true;
          break;
        }
        if (mutation.type === 'characterData') {
          // If the text was changed by React and is not equal to its cached translation, we need to re-translate
          const node = mutation.target;
          const currentText = node.nodeValue.trim();
          const orig = node.__originalText ? node.__originalText.trim() : null;
          const cachedTrans = orig && translationCache[uiLang] ? translationCache[uiLang][orig] : null;
          
          if (currentText !== cachedTrans && currentText !== orig) {
            // It was updated with new English content by React
            node.__originalText = node.nodeValue;
            shouldTranslate = true;
            break;
          }
        }
      }

      if (shouldTranslate) {
        clearTimeout(element._translateTimeout);
        element._translateTimeout = setTimeout(() => {
          if (isMounted) {
            translatePage();
          }
        }, 300);
      }
    });

    observer.observe(element, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      isMounted = false;
      observer.disconnect();
      clearTimeout(element._translateTimeout);
    };
  }, [uiLang, translateEnabled, activeModel, apiKey, providerKeys, customModels]);

  return pageRef;
}
