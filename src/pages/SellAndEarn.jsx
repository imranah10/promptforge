import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const SellAndEarn = () => {
  return (
    <div className="page active">
      <div className="section-header">
        <h2 className="section-title">💰 Sell & Earn</h2>
        <div className="section-sub">How to turn PromptForge into a real income stream — starting today.</div>
      </div>
      
      <div className="section-card glass-card">
        <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>💡 Revenue strategies</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { title: 'White-label SaaS', badge: 'DAY 1', badgeClass: 'badge-new', desc: 'Rename it "YourBrand AI Studio". Sell subscriptions at $9–$49/month. This file is your product — no coding needed.' },
            { title: 'Freelance service', badge: 'IMMEDIATE', badgeClass: 'badge-hot', desc: 'Use PromptForge to deliver content, copywriting, translation, code help at $50–$500/project while it does the heavy lifting.' },
            { title: 'Agency offering', badge: '$$$', badgeClass: 'badge-pro', desc: 'Bundle as "AI Content Package" for businesses. $200–$1,000/month retainer. Show them the model comparison feature.' },
            { title: 'AppSumo / Gumroad launch', badge: 'VIRAL', badgeClass: 'badge-hot', desc: 'List on AppSumo as lifetime deal at $49. 500 buyers = $24,500 one-time. Product Hunt launch = thousands of free users.' }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '12px' }}
            >
              <div style={{ fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {item.title} <span className={`nav-badge ${item.badgeClass}`} style={{ marginLeft: 0, display: 'inline-block' }}>{item.badge}</span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.6 }}>{item.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="pricing-grid">
        {[
          { tier: 'Free', price: '$0', desc: 'For individuals just getting started', features: ['Any AI model (own API key)', 'AI Writer', 'AI Chat', '50 generations/month'] },
          { tier: 'Pro', price: '$19', featured: true, desc: 'For professionals and creators', features: ['All 10 AI models', 'Unlimited generations', 'Creator Studio (all platforms)', 'Model Comparison', 'Code Helper', 'Image & Video Prompts', '50+ languages'] },
          { tier: 'Agency', badge: 'BEST VALUE', price: '$49', desc: 'For agencies and resellers', features: ['Everything in Pro', 'White-label rights', '5 team seats', 'Priority support', 'Reseller license', 'Custom branding'] }
        ].map((p, i) => (
          <motion.div 
            key={i} 
            className={`price-card glass-card ${p.featured ? 'featured' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (i * 0.1) }}
          >
            <div className="price-tier">
              {p.tier} {p.badge && <span className="nav-badge badge-new" style={{ marginLeft: '8px' }}>{p.badge}</span>}
            </div>
            <div className="price-amount">{p.price}<span>/mo</span></div>
            <div className="price-desc">{p.desc}</div>
            <div style={{ marginTop: '24px' }}>
              {p.features.map((f, j) => (
                <div key={j} className="price-feature">
                  <Check size={14} color="var(--green)" /> {f}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <style jsx>{`
        .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin: 32px 0; }
        .price-card { padding: 32px; text-align: center; position: relative; overflow: hidden; transition: all 0.3s; }
        .price-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(124,92,252,0.15); }
        .price-card.featured { border-color: var(--accent); box-shadow: 0 8px 32px rgba(124,92,252,0.1); }
        .price-card.featured::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, var(--accent), var(--accent3)); }
        .price-tier { font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--text3); margin-bottom: 12px; display: flex; justify-content: center; align-items: center; }
        .price-amount { font-family: var(--font-head); font-size: 48px; font-weight: 800; color: var(--text); }
        .price-amount span { font-size: 16px; color: var(--text3); font-weight: 500; }
        .price-desc { font-size: 13px; color: var(--text3); margin: 12px 0 0; }
        .price-feature { font-size: 14px; color: var(--text2); padding: 12px 0; border-bottom: 1px solid var(--border2); display: flex; align-items: center; gap: 10px; text-align: left; }
        .price-feature:last-child { border-bottom: none; }

        @media (max-width: 900px) {
          .pricing-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default SellAndEarn;
