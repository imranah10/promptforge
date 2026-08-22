import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Bot, Globe, Zap, Code, FileText, Search, Lightbulb, Database } from 'lucide-react';

const Dashboard = ({ onNavigate }) => {
  return (
    <div className="page active" id="page-dashboard">
      <div className="hero">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="hero-badge"
        >
          <Sparkles size={14} /> Your Private, Multi-Model Studio Workspace
        </motion.div>
        
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Empower your workflow<br/>with unified AI intelligence
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Switch between 10+ AI models, write content in 50+ languages, compare outputs, fix code, generate viral social media — all in one place.
        </motion.p>
        
        <motion.div 
          className="hero-cta"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <button className="btn btn-primary btn-lg" onClick={() => onNavigate('aiwriter')}>
            Start Writing <ArrowRight size={18} />
          </button>
          <button className="btn btn-outline btn-lg" onClick={() => onNavigate('creator')}>
            Creator Studio <Sparkles size={18} />
          </button>
        </motion.div>
      </div>

      <div className="stats-row">
        {[
          { num: '10+', label: 'AI Models', icon: Bot },
          { num: '50+', label: 'Languages', icon: Globe },
          { num: '20+', label: 'Use Cases', icon: Zap },
          { num: '∞', label: 'Possibilities', icon: Sparkles }
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            className="stat-card glass-card"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 + (i * 0.1) }}
            whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(124,92,252,0.2)' }}
          >
            <stat.icon size={24} color="var(--accent)" style={{ margin: '0 auto 12px' }} />
            <div className="stat-num">{stat.num}</div>
            <div className="stat-label">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        className="section-card"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        style={{ marginTop: '20px' }}
      >
        <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
          ✦ Elite Command Center
        </h3>
        <div className="quickstart-chips">
          {[
            { label: 'Chat With Data', id: 'chatdata', icon: FileText },
            { label: 'The Inventor', id: 'inventor', icon: Lightbulb },
            { label: 'The Spider', id: 'search', icon: Globe },
            { label: 'Data Wizard', id: 'datawizard', icon: Database },
            { label: 'Prompt Optimizer', id: 'optimizer', icon: Zap },
            { label: 'Staff Engineer Code', id: 'codehelper', icon: Code },
            { label: 'SEO Optimizer', id: 'seo', icon: Search },
            { label: 'Model Compare', id: 'compare', icon: Bot }
          ].map((item, i) => (
            <motion.div 
              key={i} 
              className="qs-chip" 
              onClick={() => onNavigate(item.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <item.icon size={14} /> {item.label}
            </motion.div>
          ))}
        </div>
      </motion.div>

      <style jsx>{`
        .hero {
          text-align: center; padding: 80px 20px 60px;
          position: relative; overflow: hidden;
        }
        .hero::before {
          content: '';
          position: absolute; top: -100px; left: 50%; transform: translateX(-50%);
          width: 800px; height: 800px;
          background: radial-gradient(circle, rgba(124,92,252,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(124,92,252,0.1); border: 1px solid rgba(124,92,252,0.3);
          padding: 8px 20px; border-radius: 30px; font-size: 13px; color: var(--accent2);
          margin-bottom: 24px; font-weight: 600;
          box-shadow: 0 0 20px rgba(124,92,252,0.2);
        }
        .hero h1 {
          font-family: var(--font-head); font-size: clamp(40px, 6vw, 72px); font-weight: 800;
          line-height: 1.1; margin-bottom: 24px;
          background: linear-gradient(135deg, #fff 0%, var(--accent2) 50%, var(--accent3) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          text-shadow: 0 0 40px rgba(124,92,252,0.3);
        }
        .hero p { 
          font-size: 18px; color: var(--text2); max-width: 600px; 
          margin: 0 auto 40px; line-height: 1.6; 
        }
        .hero-cta { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        
        .stats-row {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;
          margin: 40px 0;
        }
        .stat-card {
          padding: 30px 20px; text-align: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .stat-num { font-family: var(--font-head); font-size: 36px; font-weight: 800; color: var(--accent2); }
        .stat-label { font-size: 13px; color: var(--text3); margin-top: 8px; letter-spacing: 0.5px; text-transform: uppercase; font-weight: 700; }

        .quickstart-chips { display: flex; flex-wrap: wrap; gap: 12px; }
        .qs-chip {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 18px; border-radius: 20px; font-size: 13px; font-weight: 500;
          background: rgba(20, 20, 37, 0.5); border: 1px solid var(--border); color: var(--text2);
          cursor: pointer; transition: all 0.2s;
        }
        .qs-chip:hover { border-color: var(--accent); color: var(--accent2); background: rgba(124,92,252,0.15); box-shadow: 0 4px 12px rgba(124,92,252,0.2); }

        @media (max-width: 900px) {
          .stats-row { grid-template-columns: repeat(2, 1fr); }
        }
        .brain-glow { 
          width: 80px; height: 80px; border-radius: 50%; background: rgba(124,92,252,0.1); 
          display: flex; align-items: center; justify-content: center; border: 1px solid var(--accent);
          box-shadow: 0 0 30px rgba(124,92,252,0.3); animation: pulse-brain 3s infinite;
        }
        .brain-glow.singularity { border-color: #ef4444; box-shadow: 0 0 30px rgba(239,68,68,0.3); }
        @keyframes pulse-brain { 0% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 50px rgba(239,68,68,0.5); } 100% { transform: scale(1); opacity: 0.8; } }
      `}</style>
    </div>
  );
};

export default Dashboard;
