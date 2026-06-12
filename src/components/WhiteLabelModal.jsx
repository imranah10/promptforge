import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, Mail, ShieldAlert, Sparkles, Settings, ArrowRight } from 'lucide-react';

const WhiteLabelModal = ({ isOpen, onClose }) => {
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
              maxWidth: '560px',
              background: 'linear-gradient(135deg, rgba(16, 16, 35, 0.98) 0%, rgba(8, 8, 18, 0.99) 100%)',
              border: '1px solid rgba(124, 92, 252, 0.25)',
              borderRadius: '24px',
              padding: '36px',
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

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1, marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(124, 92, 252, 0.15)', border: '1px solid rgba(124, 92, 252, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent2)' }}>
                  <Briefcase size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
                    Commercial Codebase License
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text3)', margin: '4px 0 0' }}>
                    Purchase the full source code to host and customize yourself.
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
                  color: 'var(--text3)',
                  cursor: 'pointer',
                  transition: '0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Body */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ color: 'var(--text2)', fontSize: '13.5px', lineHeight: '1.6', marginBottom: '24px' }}>
                Want to buy the complete, production-ready <strong>PromptForge</strong> codebase? We offer commercial source code licenses for developers, startups, and agencies who want to host and customize it themselves:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--lp-cyan)', marginTop: '2px', flexShrink: 0 }}><Sparkles size={16} /></div>
                  <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.5' }}>
                    <strong>Full Source Code Access:</strong> Obtain the complete, clean React + Vite codebase. Easily deploy and host it on Vercel, Netlify, or your own private servers.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--green)', marginTop: '2px', flexShrink: 0 }}><Settings size={16} /></div>
                  <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.5' }}>
                    <strong>100% Customizable:</strong> You get complete freedom to change branding, logos, default models, default system prompts, or integrate your own backend APIs.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--accent2)', marginTop: '2px', flexShrink: 0 }}><ShieldAlert size={16} /></div>
                  <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.5' }}>
                    <strong>Self-Hosted & Private:</strong> Keep 100% control of your deployment and data privacy. Includes basic installation support to get your local build running.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a 
                  href="mailto:imranaha310@gmail.com?subject=PromptForge%20Source%20Code%20License%20Inquiry&body=Hello%20Imran%2C%0A%0AI%20am%20interested%20in%20purchasing%20the%20commercial%20source%20code%20license%20for%20PromptForge.%20Please%20provide%20more%20details%20about%20pricing%20and%20the%20licensing%20terms.%0A%0ACompany%20Name%20%2F%20Individual%3A%0APlanned%20Use%20Case%3A%0A%0ABest%20Regards%2C%0A%5BYour%20Name%5D"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'var(--accent)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '12px',
                    padding: '14px 20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    textAlign: 'center',
                    boxShadow: '0 8px 20px rgba(124, 92, 252, 0.35)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent2)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(124, 92, 252, 0.5)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(124, 92, 252, 0.35)'; }}
                >
                  <Mail size={16} /> Inquire for Source Code License <ArrowRight size={16} />
                </a>
                
                <button 
                  onClick={onClose}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'var(--text2)',
                    borderRadius: '12px',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WhiteLabelModal;
