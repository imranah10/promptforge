import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, Mail, ShieldAlert, Sparkles, Settings, ArrowRight, Check, Crown, Rocket, Building2, FileCode2, Cloud, Lock, Palette } from 'lucide-react';

const PRICING = [
  {
    id: 'personal',
    name: 'Personal License',
    price: '$49',
    tagline: 'For solo developers & side projects',
    badge: null,
    color: '#38bdf8',
    gumroadUrl: 'https://aureliancanvas.gumroad.com/l/promptforge',
    features: [
      'Complete source code (React + Vite)',
      '1 deployment for personal use',
      '6 months of free updates',
      'Email support (30 days)',
      'Documentation + setup guide',
      'Deploy to Vercel / Netlify / Cloudflare',
    ],
    notIncluded: ['Cannot resell to clients', 'Cannot remove PromptForge branding'],
  },
  {
    id: 'developer',
    name: 'Developer License',
    price: '$149',
    tagline: 'For freelancers & small agencies',
    badge: 'MOST POPULAR',
    color: '#7c5cfc',
    gumroadUrl: 'https://aureliancanvas.gumroad.com/l/promptforge',
    features: [
      'Everything in Personal License',
      '5 client deployments allowed',
      '1 year of free updates',
      'Priority email support (6 months)',
      'Customization guide (PDF)',
      'Branding swap instructions',
    ],
    notIncluded: ['Cannot remove PromptForge branding entirely'],
  },
  {
    id: 'whitelabel',
    name: 'White-Label License',
    price: '$399',
    tagline: 'For agencies, SaaS founders & enterprises',
    badge: 'BEST VALUE',
    color: '#fbbf24',
    gumroadUrl: 'https://aureliancanvas.gumroad.com/l/promptforge',
    features: [
      'Everything in Developer License',
      'Unlimited client deployments',
      'Remove PromptForge branding entirely',
      'Lifetime updates (1 year)',
      '1-on-1 onboarding call (1 hour)',
      'White-label deployment docs',
      'Custom logo + name setup',
    ],
    notIncluded: [],
  },
];

const WHATS_INCLUDED = [
  { icon: FileCode2, label: '14 AI Tools', desc: 'Code Helper, SEO Optimizer, AI Writer, Business Strategist + 10 more' },
  { icon: Sparkles, label: '30+ AI Models', desc: 'GPT-4o, Claude 3.5, Gemini, Llama 3.3, DeepSeek R1, Grok & more' },
  { icon: Lock, label: 'AES-GCM Encryption', desc: 'API keys encrypted in browser, never touch a server' },
  { icon: Cloud, label: 'BYOK Architecture', desc: 'No proxy, no markup — direct-to-API for 90%+ cost savings' },
  { icon: Palette, label: 'Dark + Light Theme', desc: 'Premium UI with Framer Motion + Three.js visuals' },
  { icon: Rocket, label: 'Production Ready', desc: 'Vercel.json with CSP, HSTS, X-Frame-Options preconfigured' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Purchase', desc: 'Buy via Gumroad — instant download link.' },
  { step: '02', title: 'Download', desc: 'Receive ZIP + setup instructions in your inbox.' },
  { step: '03', title: 'Install', desc: 'Run `npm install && npm run dev` — app boots in seconds.' },
  { step: '04', title: 'Customize', desc: 'Replace logo, brand name, colors, default models.' },
  { step: '05', title: 'Deploy', desc: 'Push to Vercel / Netlify / your own server. Done.' },
];

const USE_CASES = [
  { icon: Rocket, who: 'Indie Dev', desc: 'Launch your AI SaaS in a weekend, not 6 months.' },
  { icon: Building2, who: 'Agency Owner', desc: 'Deploy for 5+ clients, charge $99-$499 each.' },
  { icon: Crown, who: 'AI Consultant', desc: 'Offer a private AI portal to your SMB clients.' },
  { icon: Briefcase, who: 'Enterprise', desc: 'Internal AI tool for your team — fully self-hosted.' },
];

const WhiteLabelModal = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [selectedTier, setSelectedTier] = useState('developer');

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('imranaha310@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedPlan = PRICING.find(p => p.id === selectedTier) || PRICING[1];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'rgba(5, 5, 12, 0.85)',
            backdropFilter: 'blur(16px)',
            overflowY: 'auto',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '880px',
              margin: 'auto',
              background: 'linear-gradient(135deg, rgba(16, 16, 35, 0.98) 0%, rgba(8, 8, 18, 0.99) 100%)',
              border: '1px solid rgba(124, 92, 252, 0.25)',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 24px 60px rgba(124, 92, 252, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient background glow */}
            <div
              style={{
                position: 'absolute',
                top: '-20%',
                left: '-20%',
                width: '60%',
                height: '60%',
                background: 'radial-gradient(circle, rgba(124, 92, 252, 0.15) 0%, transparent 70%)',
                pointerEvents: 'none',
                zIndex: 0
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-20%',
                right: '-20%',
                width: '50%',
                height: '50%',
                background: 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)',
                pointerEvents: 'none',
                zIndex: 0
              }}
            />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1, marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(124, 92, 252, 0.15)', border: '1px solid rgba(124, 92, 252, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent2)' }}>
                  <Briefcase size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
                    White-Label Source Code License
                  </h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>
                    Deploy PromptForge under your own brand. 3 license tiers available.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  transition: '0.2s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Intro line */}
            <p style={{ position: 'relative', zIndex: 1, color: '#cbd5e1', fontSize: '13.5px', lineHeight: '1.6', marginBottom: '20px', margin: '0 0 20px' }}>
              Get the complete, production-ready <strong style={{ color: '#fff' }}>PromptForge</strong> codebase — 14 AI tools, 30+ models, BYOK architecture, AES-GCM encryption. Buy once, deploy forever. No subscriptions, no recurring fees.
            </p>

            {/* PRICING TIERS */}
            <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '28px' }}>
              {PRICING.map((tier) => {
                const isSelected = selectedTier === tier.id;
                return (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    style={{
                      position: 'relative',
                      background: isSelected
                        ? `linear-gradient(135deg, ${tier.color}22 0%, ${tier.color}05 100%)`
                        : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected
                        ? `1px solid ${tier.color}`
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '14px',
                      padding: '18px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                      }
                    }}
                  >
                    {tier.badge && (
                      <div style={{
                        position: 'absolute', top: '-8px', right: '12px',
                        background: tier.color, color: '#0a0a14',
                        fontSize: '9px', fontWeight: 800, letterSpacing: '0.5px',
                        padding: '3px 8px', borderRadius: '6px',
                      }}>
                        {tier.badge}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      {tier.id === 'personal' && <Rocket size={16} style={{ color: tier.color }} />}
                      {tier.id === 'developer' && <Sparkles size={16} style={{ color: tier.color }} />}
                      {tier.id === 'whitelabel' && <Crown size={16} style={{ color: tier.color }} />}
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{tier.name}</span>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: tier.color, fontFamily: 'Outfit, sans-serif', lineHeight: 1, margin: '6px 0 4px' }}>
                      {tier.price}
                      <span style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8' }}> one-time</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px', lineHeight: 1.4 }}>
                      {tier.tagline}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {tier.features.slice(0, 4).map((f, i) => (
                        <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                          <Check size={12} style={{ color: tier.color, flexShrink: 0, marginTop: '2px' }} />
                          <span>{f}</span>
                        </div>
                      ))}
                      {tier.features.length > 4 && (
                        <div style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                          + {tier.features.length - 4} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SELECTED TIER DETAILS */}
            <div style={{
              position: 'relative', zIndex: 1,
              background: 'rgba(0, 0, 0, 0.3)',
              border: `1px solid ${selectedPlan.color}33`,
              borderRadius: '14px',
              padding: '18px 20px',
              marginBottom: '24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>{selectedPlan.name} — Full Feature List</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>All features included in this tier</div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: selectedPlan.color, fontFamily: 'Outfit, sans-serif' }}>
                  {selectedPlan.price}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '6px 16px' }}>
                {selectedPlan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '12px', color: '#e2e8f0', lineHeight: 1.4 }}>
                    <Check size={13} style={{ color: selectedPlan.color, flexShrink: 0, marginTop: '2px' }} />
                    <span>{f}</span>
                  </div>
                ))}
                {selectedPlan.notIncluded.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '12px', color: '#64748b', lineHeight: 1.4, textDecoration: 'line-through' }}>
                    <X size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* WHAT'S INCLUDED */}
            <div style={{ position: 'relative', zIndex: 1, marginBottom: '24px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={14} style={{ color: 'var(--accent2)' }} /> What's Included in Every Tier
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                {WHATS_INCLUDED.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '10px', alignItems: 'flex-start',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '10px',
                  }}>
                    <item.icon size={16} style={{ color: 'var(--lp-cyan)', flexShrink: 0, marginTop: '1px' }} />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{item.label}</div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.4 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* HOW IT WORKS */}
            <div style={{ position: 'relative', zIndex: 1, marginBottom: '24px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={14} style={{ color: 'var(--green)' }} /> How It Works
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {HOW_IT_WORKS.map((s, i) => (
                  <div key={i} style={{
                    flex: '1 0 140px',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '10px',
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent2)', marginBottom: '4px' }}>{s.step}</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{s.title}</div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.4 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* USE CASES */}
            <div style={{ position: 'relative', zIndex: 1, marginBottom: '24px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={14} style={{ color: 'var(--lp-accent-light)' }} /> Who Is This For?
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                {USE_CASES.map((u, i) => (
                  <div key={i} style={{
                    padding: '12px',
                    background: 'rgba(124, 92, 252, 0.04)',
                    border: '1px solid rgba(124, 92, 252, 0.15)',
                    borderRadius: '10px',
                  }}>
                    <u.icon size={16} style={{ color: 'var(--accent2)', marginBottom: '6px' }} />
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '3px' }}>{u.who}</div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.4 }}>{u.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Direct Buy Button (Gumroad) — uses selected tier */}
              <a
                href={selectedPlan.gumroadUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: `linear-gradient(135deg, ${selectedPlan.color} 0%, ${selectedPlan.color}cc 100%)`,
                  border: 'none',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  textAlign: 'center',
                  boxShadow: `0 8px 25px ${selectedPlan.color}55`,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 10px 30px ${selectedPlan.color}77`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 8px 25px ${selectedPlan.color}55`; }}
              >
                <Sparkles size={16} /> Buy {selectedPlan.name} — {selectedPlan.price} <ArrowRight size={16} />
              </a>

              {/* Email Inquiry Button */}
              <a
                href="mailto:imranaha310@gmail.com?subject=PromptForge%20Source%20Code%20License%20Inquiry&body=Hello%20Imran%2C%0A%0AI%20am%20interested%20in%20purchasing%20the%20commercial%20source%20code%20license%20for%20PromptForge.%20Please%20provide%20more%20details%20about%20pricing%20and%20the%20licensing%20terms.%0A%0ACompany%20Name%20%2F%20Individual%3A%0APlanned%20Use%20Case%3A%0A%0ABest%20Regards%2C%0A%5BYour%20Name%5D"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '13px 20px',
                  cursor: 'pointer',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  textAlign: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                <Mail size={15} /> Contact via Email (Custom Deals / Enterprise Queries)
              </a>

              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#cbd5e1',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}
              >
                Close
              </button>

              {/* Email Copy fallback UI */}
              <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '11px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <ShieldAlert size={12} style={{ color: 'var(--green)' }} />
                  <span>Secure one-time payment via Gumroad · Instant download · 30-day refund window</span>
                </div>
                <div style={{ marginTop: '4px' }}>
                  Or email directly: <strong style={{ color: '#fff' }}>imranaha310@gmail.com</strong>
                  <button
                    onClick={handleCopyEmail}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: copied ? 'var(--green)' : 'var(--lp-cyan)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '2px 8px',
                      textDecoration: 'underline',
                      marginLeft: '4px'
                    }}
                  >
                    {copied ? '✓ Copied!' : 'Copy Email'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WhiteLabelModal;
