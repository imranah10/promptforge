import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Zap, Shield, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const PricingPage = () => {
  const navigate = useNavigate();

  const handleSubscribe = () => {
    // In future, redirect to Razorpay/Stripe
    alert('Payment Gateway Integration Coming Soon! For now, contact admin.');
  };

  return (
    <div className="pricing-page">
      <div className="ambient-glow" style={{ top: '20%', left: '30%' }}></div>
      
      <div className="pricing-header">
        <div className="badge">LIFETIME ACCESS</div>
        <h1>Neural Studio <span style={{ color: 'var(--accent)' }}>Elite</span></h1>
        <p>One-time payment. Lifetime sovereignty over your AI intelligence.</p>
      </div>

      <div className="pricing-grid">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pricing-card premium glass-card">
          <div className="card-popular">MOST POPULAR</div>
          <div className="price-head">
            <span className="currency">$</span>
            <span className="amount">49</span>
            <span className="period">/one-time</span>
          </div>
          <h3 className="plan-name">Founders Edition</h3>
          <p className="plan-desc">Perfect for individual engineers and creative architects.</p>
          
          <ul className="feature-list">
            <li><CheckCircle2 size={18} /> Unlimited Dashboard Access</li>
            <li><CheckCircle2 size={18} /> BYOK (Bring Your Own Key) Support</li>
            <li><CheckCircle2 size={18} /> God Mode Intelligence Core</li>
            <li><CheckCircle2 size={18} /> Elite Model Council (Multi-Model)</li>
            <li><CheckCircle2 size={18} /> Custom Neural Personas</li>
            <li><CheckCircle2 size={18} /> Priority Feature Updates</li>
          </ul>

          <button className="subscribe-btn" onClick={handleSubscribe}>
            Claim Lifetime Access <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>

      <div className="trust-section">
        <div className="trust-item"><Shield size={20} /><span>Secured by Neural Encryption</span></div>
        <div className="trust-item"><Zap size={20} /><span>Instant License Activation</span></div>
      </div>

      <style jsx>{`
        .pricing-page { min-height: 100vh; background: #030308; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: #fff; position: relative; overflow: hidden; }
        .pricing-header { text-align: center; margin-bottom: 60px; z-index: 2; }
        .pricing-header h1 { font-size: 56px; font-weight: 900; letter-spacing: -2px; margin: 20px 0; }
        .pricing-header p { font-size: 18px; color: var(--text3); max-width: 500px; margin: 0 auto; }
        
        .pricing-grid { width: 100%; max-width: 450px; z-index: 2; }
        .pricing-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(124,92,252,0.2); padding: 50px; border-radius: 32px; position: relative; overflow: hidden; }
        .pricing-card.premium { border-color: var(--accent); box-shadow: 0 20px 80px rgba(124,92,252,0.15); }
        .card-popular { position: absolute; top: 20px; right: -35px; background: var(--accent); color: #fff; font-size: 10px; font-weight: 900; padding: 8px 40px; transform: rotate(45deg); }
        
        .price-head { display: flex; align-items: baseline; justify-content: center; margin-bottom: 20px; }
        .currency { font-size: 24px; font-weight: 800; color: var(--accent); }
        .amount { font-size: 72px; font-weight: 900; letter-spacing: -3px; }
        .period { font-size: 14px; color: var(--text3); margin-left: 10px; }
        
        .plan-name { font-size: 24px; font-weight: 800; text-align: center; margin-bottom: 10px; }
        .plan-desc { text-align: center; color: var(--text3); font-size: 14px; margin-bottom: 40px; }
        
        .feature-list { list-style: none; padding: 0; margin: 0 0 40px 0; }
        .feature-list li { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; font-size: 15px; color: rgba(255,255,255,0.8); }
        .feature-list li :global(svg) { color: var(--accent); }
        
        .subscribe-btn { width: 100%; background: var(--accent); color: #fff; border: none; padding: 20px; border-radius: 16px; font-weight: 800; font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 12px; cursor: pointer; transition: 0.3s; }
        .subscribe-btn:hover { transform: translateY(-5px); box-shadow: 0 15px 30px var(--glow); }
        
        .trust-section { display: flex; gap: 40px; margin-top: 60px; z-index: 2; opacity: 0.5; }
        .trust-item { display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 600; letter-spacing: 1px; }
      `}</style>
    </div>
  );
};

export default PricingPage;
