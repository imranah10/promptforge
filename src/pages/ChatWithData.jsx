import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { UploadCloud, FileText, X, Loader2, Send, Bot, User, Trash2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Tesseract from 'tesseract.js';

const ChatWithData = () => {
  const { activeModel, apiKey, providerKeys, customModels, showToast, saveToVault } = useContext(AppContext);
  
  const [files, setFiles] = useState([]); // Array of { name, content, size, type }
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfScriptLoaded, setPdfScriptLoaded] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Load PDF.js dynamically
  useEffect(() => {
    if (!document.getElementById('pdfjs-script')) {
      const script = document.createElement('script');
      script.id = 'pdfjs-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        setPdfScriptLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      setPdfScriptLoaded(true);
    }
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractTextFromPDF = async (fileBuffer) => {
    try {
      const pdf = await window.pdfjsLib.getDocument({ data: fileBuffer }).promise;
      let fullText = '';
      const maxPages = Math.min(pdf.numPages, 50); 
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      return fullText;
    } catch (err) {
      console.error(err);
      throw new Error('Failed to parse PDF file.');
    }
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      showToast('File is too large! Max 10MB.', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      let extractedText = '';

      if (selectedFile.type === 'application/pdf') {
        if (!pdfScriptLoaded) throw new Error('PDF processor loading...');
        const buffer = await selectedFile.arrayBuffer();
        extractedText = await extractTextFromPDF(buffer);
      } else if (selectedFile.type.startsWith('image/')) {
        showToast('Running OCR on image...');
        const result = await Tesseract.recognize(selectedFile, 'eng');
        extractedText = result.data.text;
      } else {
        extractedText = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = () => reject(new Error('Failed to read text file'));
          reader.readAsText(selectedFile);
        });
      }

      const newFileObj = {
        name: selectedFile.name,
        content: extractedText,
        size: selectedFile.size,
        type: selectedFile.type
      };

      setFiles(prev => [...prev, newFileObj]);
      showToast(`Added ${selectedFile.name} to knowledge base!`);
      
      if (messages.length === 0) {
        setMessages([
          { role: 'assistant', text: `I've analyzed **${selectedFile.name}**. You can ask questions about it, or upload more files to compare/refine results.` }
        ]);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsProcessing(false);
      e.target.value = ''; // Reset input
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (files.length === 1) setMessages([]);
  };

  const clearChat = () => {
    setMessages([]);
    showToast('Chat cleared');
  };

  const handleSend = async () => {
    if (!input.trim() || files.length === 0) return;
    
    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', text: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    // Build context from ALL files
    let fullContext = files.map(f => `FILE: ${f.name}\nCONTENT:\n${f.content}`).join('\n\n---\n\n');

    const systemPrompt = `You are an expert Data Analysis Assistant. 
The user has uploaded ${files.length} file(s). 
Your goal is to answer questions, compare data, or refine results based on ALL provided files.

CONTEXT FROM FILES:
${fullContext.substring(0, 500000)}

Answer based ONLY on the provided files. If multiple files are involved, specify which file you are referencing.`;

    let conversation = newMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n\n');

    try {
      const response = await callAI(systemPrompt, conversation + '\n\nAssistant:', null, activeModel, apiKey, providerKeys, customModels);
      setMessages([...newMessages, { role: 'assistant', text: response }]);
      saveToVault('Chat with Data', `Files: ${files.length} | Q: ${userMsg}`, response);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', text: `❌ Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard');
  };

  return (
    <div className="page active" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '0' }}>
      <div className="section-header" style={{ flexShrink: 0, marginBottom: '16px' }}>
        <h2 className="section-title">📊 Multi-File Knowledge Base</h2>
        <div className="section-sub">Upload multiple PDFs, CSVs, or Images and chat with them collectively. Perfect for comparison.</div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden', flexDirection: 'column' }}>
        
        <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
          {/* Small Upload Button */}
          <div className="mini-upload glass-card" style={{ width: '180px' }}>
            <input type="file" id="multi-upload" accept=".pdf,.txt,.csv,.json,.md,.png,.jpg,.jpeg" onChange={handleFileUpload} />
            <label htmlFor="multi-upload" className="mini-upload-label">
              {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <><UploadCloud size={18} /> Add File</>}
            </label>
          </div>

          {/* Files List */}
          <div className="files-list" style={{ display: 'flex', gap: '10px', overflowX: 'auto', flex: 1, paddingBottom: '4px' }}>
            <AnimatePresence>
              {files.map((f, i) => (
                <motion.div 
                  key={i} 
                  className="file-pill"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <FileText size={14} />
                  <span className="pill-name">{f.name}</span>
                  <button onClick={() => removeFile(i)} className="pill-remove"><X size={12} /></button>
                </motion.div>
              ))}
            </AnimatePresence>
            {files.length === 0 && !isProcessing && <div style={{ color: 'var(--text3)', fontSize: '13px', alignSelf: 'center' }}>No files uploaded yet.</div>}
          </div>

          {messages.length > 0 && (
            <button className="btn btn-sm btn-ghost" onClick={clearChat} style={{ alignSelf: 'center' }}><Trash2 size={14} /> Clear</button>
          )}
        </div>

        <div className="tool-card chat-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginTop: '10px' }}>
          <div className="chat-container" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="empty-chat-state">
                  <Bot size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                  <p>Upload files (PDF, CSV, Images) and I will help you analyze, compare, and refine information across all of them.</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`chat-message ${msg.role}`}>
                  <div className="chat-avatar">
                    {msg.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
                  </div>
                  <div className="chat-bubble">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                    {msg.role === 'assistant' && msg.text.length > 10 && (
                      <button className="bubble-copy" onClick={() => copyToClipboard(msg.text)} title="Copy Response">
                        <Copy size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="chat-message assistant">
                  <div className="chat-avatar"><Bot size={20} /></div>
                  <div className="chat-bubble"><Loader2 size={16} className="animate-spin" /></div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          <div className="chat-input-area" style={{ borderTop: '1px solid var(--border)', padding: '16px', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <textarea 
              className="chat-input"
              style={{
                flex: 1, minHeight: '44px', maxHeight: '150px', resize: 'none', padding: '12px 16px',
                borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: '14px', outline: 'none'
              }}
              placeholder={files.length > 0 ? "Ask a question..." : "Please upload a file first"}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={files.length === 0 || isLoading}
            />
            <button 
              className="chat-send" 
              onClick={handleSend} 
              disabled={files.length === 0 || isLoading || !input.trim()}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .mini-upload { position: relative; overflow: hidden; height: 40px; display: flex; }
        .mini-upload input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        .mini-upload-label { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--accent2); cursor: pointer; }
        
        .file-pill {
          display: flex; align-items: center; gap: 8px; background: rgba(124,92,252,0.1);
          border: 1px solid var(--accent); padding: 6px 12px; border-radius: 20px;
          color: var(--text); font-size: 13px; white-space: nowrap; height: 32px; align-self: center;
        }
        .pill-name { max-width: 150px; overflow: hidden; text-overflow: ellipsis; }
        .pill-remove { background: none; border: none; color: var(--text3); cursor: pointer; display: flex; align-items: center; padding: 2px; }
        .pill-remove:hover { color: var(--pink); }

        .chat-message { display: flex; gap: 12px; margin-bottom: 20px; }
        .chat-message.user { flex-direction: row-reverse; }
        .chat-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .chat-message.assistant .chat-avatar { background: var(--accent); }
        .chat-message.user .chat-avatar { background: var(--card2); border: 1px solid var(--border); }
        
        .chat-bubble { 
          max-width: 80%; padding: 14px 18px; border-radius: 16px; position: relative;
          background: var(--card2); border: 1px solid var(--border);
        }
        .chat-message.user .chat-bubble { background: var(--accent); color: #fff; border-bottom-right-radius: 4px; }
        .chat-message.assistant .chat-bubble { border-bottom-left-radius: 4px; }
        
        .bubble-copy {
          position: absolute; bottom: -20px; right: 0; background: none; border: none;
          color: var(--text3); cursor: pointer; font-size: 10px; display: flex; align-items: center; gap: 4px;
        }
        .bubble-copy:hover { color: var(--accent2); }

        .chat-send {
          background: var(--accent); color: #fff; border: none; width: 44px; height: 44px;
          border-radius: 12px; cursor: pointer; transition: 0.2s;
        }
        .chat-send:disabled { opacity: 0.5; cursor: not-allowed; }
        .chat-send:hover:not(:disabled) { background: var(--accent2); box-shadow: 0 0 15px var(--glow); }

        .empty-chat-state { 
          height: 100%; display: flex; flex-direction: column; align-items: center; 
          justify-content: center; color: var(--text3); text-align: center; padding: 40px;
        }
      `}</style>
    </div>
  );
};

export default ChatWithData;
