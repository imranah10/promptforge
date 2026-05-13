import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { Trash2, Copy, Send, Bot, User } from 'lucide-react';
import { motion } from 'framer-motion';

const AIChat = () => {
  const { activeModel, apiKey, providerKeys, customModels, showToast } = useContext(AppContext);
  
  const [sysPrompt, setSysPrompt] = useState('');
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setInput('');
    const newHistory = [...chatHistory, { role: 'user', content: userMsg }];
    setChatHistory(newHistory);
    setLoading(true);

    try {
      // Very basic multi-turn support by sending the history as a string (since our AI utility takes a single string for user prompt)
      // For a real production app, the AI utility should accept an array of messages.
      // We'll format the history into the prompt for now to keep it compatible with our unified callAI.
      
      let conversationContext = newHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');
      conversationContext += '\n\nAssistant:';

      const res = await callAI(
        sysPrompt || 'You are a helpful AI assistant.', 
        conversationContext, 
        null, activeModel, apiKey, providerKeys, customModels
      );
      
      setChatHistory([...newHistory, { role: 'assistant', content: res }]);
    } catch (e) {
      setChatHistory([...newHistory, { role: 'assistant', content: '❌ Error: ' + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setChatHistory([]);
    showToast('Chat cleared');
  };

  const copyChat = () => {
    const text = chatHistory.map(m => (m.role === 'user' ? 'You: ' : 'AI: ') + m.content).join('\n\n');
    navigator.clipboard.writeText(text);
    showToast('Conversation copied');
  };

  return (
    <div className="page active">
      <div className="section-header">
        <h2 className="section-title">💬 AI Chat</h2>
        <div className="section-sub">Full multi-turn conversation with your selected AI model. Give it a role, context, or just start talking.</div>
      </div>
      
      <div className="tool-card chat-wrapper">
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label">Select Expert Persona</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select 
              className="form-select" 
              style={{ flex: 1, minWidth: '200px' }}
              onChange={(e) => {
                const personas = {
                  default: 'You are a highly capable AI assistant.',
                  cto: 'You are an Elite Staff Engineer and CTO. You give highly optimized, production-ready code. You explain architectural decisions, point out security flaws, and suggest scalable patterns.',
                  marketing: 'You are a CMO and elite copywriter. You write persuasive, high-converting copy using proven psychological triggers. You focus on ROI, brand voice, and engagement.',
                  socrates: 'You are Socrates. You answer questions using the Socratic method, guiding the user to their own realization by asking profound, challenging questions rather than just giving the answer.',
                  stevejobs: 'You are Steve Jobs. You are obsessed with design, simplicity, and user experience. You are direct, sometimes blunt, and focus on creating magical, revolutionary products.',
                  tutor: 'You are a world-class teacher. You explain complex topics simply using analogies, breaking them down step-by-step. You always check for understanding.'
                };
                setSysPrompt(personas[e.target.value] || personas.default);
              }}
            >
              <option value="default">General AI Assistant</option>
              <option value="cto">Senior CTO / Staff Engineer</option>
              <option value="marketing">Marketing Guru / Copywriter</option>
              <option value="socrates">Socrates (Philosophy/Logic)</option>
              <option value="stevejobs">Steve Jobs (Product/Design)</option>
              <option value="tutor">World-Class Tutor (Learning)</option>
            </select>
            <input 
              className="form-input sys-prompt-input" 
              style={{ flex: 2, minWidth: '300px', marginBottom: 0 }}
              placeholder="Or write a custom system prompt..."
              value={sysPrompt}
              onChange={e => setSysPrompt(e.target.value)}
            />
          </div>
        </div>
        
        <div className="chat-container">
          <div className="chat-messages">
            {chatHistory.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '13px', margin: 'auto' }}>
                Start a conversation ↓
              </div>
            )}
            
            {chatHistory.map((m, i) => (
              <motion.div 
                key={i} 
                className={`chat-msg ${m.role === 'user' ? 'user' : 'ai'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className={`chat-avatar ${m.role === 'user' ? 'user-av' : 'ai'}`}>
                  {m.role === 'user' ? <User size={16} /> : <Bot size={16} color="#fff" />}
                </div>
                <div className="chat-bubble"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown></div>
              </motion.div>
            ))}
            
            {loading && (
              <div className="chat-msg ai">
                <div className="chat-avatar ai"><Bot size={16} color="#fff" /></div>
                <div className="chat-bubble">
                  <span className="typing-dots"><span>●</span><span>●</span><span>●</span></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          
          <div className="chat-input-row">
            <textarea 
              className="form-textarea chat-input" 
              rows="1" 
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            ></textarea>
            <button className="btn-send" onClick={handleSend} disabled={loading}>
              <Send size={20} />
            </button>
          </div>
        </div>
        
        <div className="chat-actions">
          <button className="btn btn-sm btn-ghost" onClick={clearChat}><Trash2 size={14} /> Clear chat</button>
          <button className="btn btn-sm btn-ghost" onClick={copyChat}><Copy size={14} /> Copy conversation</button>
        </div>
      </div>

      <style jsx>{`
        .chat-wrapper { padding: 24px; display: flex; flex-direction: column; height: calc(100vh - 200px); min-height: 500px; }
        .sys-prompt-input { margin-bottom: 16px; background: var(--bg2); }
        .chat-container { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .chat-messages { 
          flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; 
          background: rgba(10, 10, 20, 0.5); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 16px; 
        }
        .chat-msg { display: flex; gap: 12px; }
        .chat-msg.user { flex-direction: row-reverse; }
        .chat-avatar { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .chat-avatar.ai { background: linear-gradient(135deg, var(--accent), var(--accent3)); box-shadow: 0 0 10px var(--glow); }
        .chat-avatar.user-av { background: var(--card2); border: 1px solid var(--border); }
        .chat-bubble { max-width: 75%; padding: 14px 18px; border-radius: 16px; font-size: 14px; line-height: 1.6; }
        .chat-bubble p { margin-bottom: 12px; }
        .chat-bubble p:last-child { margin-bottom: 0; }
        .chat-bubble h1, .chat-bubble h2, .chat-bubble h3, .chat-bubble h4 { font-family: var(--font-head); margin-top: 16px; margin-bottom: 8px; color: var(--accent2); }
        .chat-bubble h1 { font-size: 1.3em; }
        .chat-bubble h2 { font-size: 1.2em; }
        .chat-bubble h3 { font-size: 1.1em; }
        .chat-bubble ul, .chat-bubble ol { margin-bottom: 12px; padding-left: 20px; }
        .chat-bubble li { margin-bottom: 4px; }
        .chat-bubble pre { background: var(--bg); padding: 10px; border-radius: 8px; border: 1px solid var(--border); overflow-x: auto; margin-bottom: 12px; font-family: var(--font-mono); font-size: 12px; }
        .chat-bubble code { font-family: var(--font-mono); font-size: 12px; color: var(--pink); background: rgba(244,114,182,0.1); padding: 2px 4px; border-radius: 4px; }
        .chat-bubble pre code { color: var(--text); background: none; padding: 0; }
        .chat-bubble strong { color: var(--accent3); font-weight: 700; letter-spacing: 0.2px; }
        .chat-msg.user .chat-bubble strong { color: #fff; }
        .chat-msg.ai .chat-bubble { background: var(--card2); border: 1px solid var(--border); border-top-left-radius: 4px; }
        .chat-msg.user .chat-bubble { background: linear-gradient(135deg, var(--accent), rgba(124,92,252,0.7)); color: #fff; border-top-right-radius: 4px; }
        
        .chat-input-row { display: flex; gap: 10px; align-items: flex-end; }
        .chat-input { flex: 1; min-height: 50px; max-height: 150px; padding: 14px 16px; resize: none; }
        .btn-send { 
          padding: 14px 20px; height: 50px;
          background: var(--accent); color: #fff; border: none; border-radius: 12px; cursor: pointer; 
          display: flex; align-items: center; justify-content: center; transition: all 0.2s; 
        }
        .btn-send:hover:not(:disabled) { background: var(--accent2); box-shadow: 0 0 16px var(--glow); }
        .btn-send:disabled { opacity: 0.6; cursor: not-allowed; }
        .chat-actions { display: flex; gap: 10px; margin-top: 12px; }
      `}</style>
    </div>
  );
};

export default AIChat;
