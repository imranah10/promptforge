import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { 
  Copy, Zap, Loader2, Download, Sparkles, GitCompare, ScanText, RefreshCw, Check, AlertCircle, Info, 
  Briefcase, Camera, Hash, Mail, Globe, Search, Award, FileText, ChevronRight, Play, Terminal, 
  BookOpen, MessageSquare, CheckCircle, Heart, User, CheckCircle2, FileSpreadsheet, Eye, HelpCircle, 
  ArrowRight, Share2, MessageCircle, ExternalLink, Flame, ThumbsUp, ShieldAlert, Paperclip, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadText } from '../utils/helpers';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CONTENT_TYPES = [
  { id: 'Blog post / Article', label: '📝 Blog post / Article', format: 'Use clear paragraphs, bold key terms naturally, headers for structure, bullet lists where helpful. Start with compelling hook.' },
  { id: 'LinkedIn post', label: '💼 LinkedIn post', format: 'Line breaks every 1-2 sentences. Use 2-4 emojis strategically. Hashtags at end (3-5). Hook in first line. CTA at end.' },
  { id: 'Twitter/X thread', label: '🐦 Twitter/X thread', format: 'Tweet 1: Hook (max 280 chars). Numbered tweets (2/7, 3/7). One idea per tweet. Last tweet: CTA + "Like/RT if helpful".' },
  { id: 'Instagram caption', label: '📸 Instagram caption', format: 'Hook first line. Story/value in 3-5 lines. Line breaks. 5-8 emojis. Hashtags at end (10-15). Max 2200 chars.' },
  { id: 'Cold email', label: '📧 Cold email', format: 'Personalized opener. Problem → Solution → Proof → CTA. Max 150 words. No fluff. One CTA only.' },
  { id: 'Product description', label: '🛍️ Product description', format: 'Benefit-focused headline. 3-5 key benefits (not features). Specs in bullets. Emotional hook. Trust signals. Clear CTA.' },
  { id: 'Ad copy (Facebook/Google)', label: '🎯 Ad copy (Facebook/Google)', format: 'Headline: Benefit + urgency (max 40 chars). Primary text: Problem → Solution → CTA (max 125 chars). Clear, direct, action-oriented.' },
  { id: 'Social media post', label: '📱 Social media post', format: 'Hook first sentence. Value/entertainment. 2-3 emojis. Hashtags optional. Call to action. 100-150 words.' },
  { id: 'YouTube script', label: '🎥 YouTube script', format: 'INTRO (hook + promise, 15 sec). MAIN (numbered points, timestamps). OUTRO (recap + CTA). Conversational tone. Read-aloud friendly.' },
  { id: 'TikTok script', label: '📹 TikTok script', format: 'HOOK (first 3 seconds, visual + text). BODY (15-20 sec value). CTA (5 sec). On-screen text cues. Trend-aware language.' },
  { id: 'Sales page / Landing page', label: '💰 Sales page / Landing page', format: 'Hero headline (benefit). Subhead (who/problem). Social proof. Features → Benefits. Objection handling. Urgency/scarcity. Multiple CTAs.' },
  { id: 'Professional bio', label: '👤 Professional bio', format: 'Third-person. Current role + company. Key achievement/expertise. Human touch (1 personal detail). CTA/contact. 50-100 words.' },
  { id: 'Cover letter', label: '📄 Cover letter', format: 'Opening: Why this company/role excites you. Body: 2-3 relevant achievements with metrics. Closing: Enthusiasm + availability. 250-300 words.' },
  { id: 'Press release', label: '📰 Press release', format: 'Headline (newsworthy angle). Dateline (city, date). Lead (who/what/when/where/why). Quote. Boilerplate. Contact.' },
  { id: 'Newsletter', label: '📬 Newsletter', format: 'Subject line. Personal intro. 3-5 sections with headers. Value-first (teach, entertain, inspire). Links/CTAs. Sign-off with personality.' },
  { id: 'SEO meta tags', label: '🔍 SEO meta tags', format: 'Title (55-60 chars, keyword first). Description (150-160 chars, benefit + CTA). Both compelling for clicks, keyword-optimized.' },
  { id: 'Tagline / Slogan', label: '✨ Tagline / Slogan', format: 'Memorable, 3-7 words. Benefit or emotion-focused. Unique to brand. Easy to say/remember. Avoids clichés.' },
  { id: 'Customer support reply', label: '🤝 Customer support reply', format: 'Empathy first. Acknowledge issue. Provide solution (step-by-step if needed). Apologize if applicable. Follow-up offer. Warm close.' },
  { id: 'Code documentation', label: '💻 Code documentation', format: 'Purpose (what it does). Parameters (type, description). Return value. Usage example (code block). Edge cases/errors. Clear, concise.' },
  { id: 'Video script', label: '🎬 Video script', format: 'VISUAL + AUDIO columns. Timestamps. Scene descriptions. On-screen text notes. Tone notes (upbeat, serious). B-roll suggestions.' },
];

const TONES = ['Professional', 'Casual', 'Friendly', 'Persuasive', 'Informative', 'Inspirational', 'Humorous', 'Empathetic', 'Urgent', 'Educational'];
const LANGUAGES = ['English', 'Hindi', 'Hinglish', 'Spanish', 'French', 'German', 'Portuguese', 'Italian', 'Japanese', 'Korean', 'Chinese', 'Arabic', 'Russian', 'Turkish', 'Polish', 'Dutch'];

const stripMarkdown = (text) => {
  if (!text) return '';
  return text.trim();
};

const cleanTextDisplay = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/`{1,3}/g, '')
    .replace(/_{1,2}/g, '')
    .trim();
};

const countWords = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

const extractJSON = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  let text = raw.trim().replace(/```(?:json|JSON)?\s*/g, '').replace(/```/g, '').trim();
  
  // Custom repair for literal unescaped newlines/tabs inside JSON string properties
  const repairJSON = (str) => {
    let insideString = false;
    let result = '';
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      // Check if double quote is not escaped
      if (char === '"' && (i === 0 || str[i-1] !== '\\')) {
        insideString = !insideString;
      }
      if (insideString && char === '\n') {
        result += '\\n';
      } else if (insideString && char === '\r') {
        result += '\\r';
      } else if (insideString && char === '\t') {
        result += '\\t';
      } else {
        result += char;
      }
    }
    return result;
  };

  const repairedText = repairJSON(text);
  try { return JSON.parse(repairedText); } catch (_) {}
  
  const firstBrace = repairedText.indexOf('{');
  const lastBrace = repairedText.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) return null;
  let candidate = repairedText.slice(firstBrace, lastBrace + 1);
  try { return JSON.parse(candidate); } catch (_) {}
  return null;
};

const safeScore = (val, fallback = 50) => {
  const n = typeof val === 'number' ? val : parseInt(String(val ?? '').replace(/[^\d-]/g, ''), 10);
  if (isNaN(n)) return fallback;
  return Math.max(0, Math.min(100, n));
};

// ── DYNAMIC ACCENT SELECTOR (Consistent but randomized per content) ──────────
const getDynamicAccent = (str) => {
  if (!str) return {
    gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    color: '#a78bfa',
    bgLight: 'rgba(167, 139, 250, 0.08)',
    bgSolid: 'rgba(20, 20, 37, 0.98)',
    border: 'rgba(167, 139, 250, 0.25)',
    glow: 'rgba(167, 139, 250, 0.15)',
    accentName: 'purple'
  };
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const presets = [
    {
      gradient: 'linear-gradient(135deg, #7c3aed, #c084fc)',
      color: '#c084fc',
      bgLight: 'rgba(192, 132, 252, 0.06)',
      bgSolid: '#0f0f1c',
      border: 'rgba(192, 132, 252, 0.2)',
      glow: 'rgba(192, 132, 252, 0.2)',
      accentName: 'purple'
    },
    {
      gradient: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
      color: '#38bdf8',
      bgLight: 'rgba(56, 189, 248, 0.06)',
      bgSolid: '#091524',
      border: 'rgba(56, 189, 248, 0.2)',
      glow: 'rgba(56, 189, 248, 0.2)',
      accentName: 'cyan'
    },
    {
      gradient: 'linear-gradient(135deg, #059669, #34d399)',
      color: '#34d399',
      bgLight: 'rgba(52, 211, 153, 0.06)',
      bgSolid: '#091c12',
      border: 'rgba(52, 211, 153, 0.2)',
      glow: 'rgba(52, 211, 153, 0.2)',
      accentName: 'emerald'
    },
    {
      gradient: 'linear-gradient(135deg, #db2777, #f472b6)',
      color: '#f472b6',
      bgLight: 'rgba(244, 114, 182, 0.06)',
      bgSolid: '#1e0a19',
      border: 'rgba(244, 114, 182, 0.2)',
      glow: 'rgba(244, 114, 182, 0.2)',
      accentName: 'pink'
    },
    {
      gradient: 'linear-gradient(135deg, #d97706, #fbbf24)',
      color: '#fbbf24',
      bgLight: 'rgba(251, 191, 36, 0.06)',
      bgSolid: '#1c150b',
      border: 'rgba(251, 191, 36, 0.2)',
      glow: 'rgba(251, 191, 36, 0.2)',
      accentName: 'amber'
    },
    {
      gradient: 'linear-gradient(135deg, #4f46e5, #818cf8)',
      color: '#818cf8',
      bgLight: 'rgba(129, 140, 248, 0.06)',
      bgSolid: '#0d0d24',
      border: 'rgba(129, 140, 248, 0.2)',
      glow: 'rgba(129, 140, 248, 0.2)',
      accentName: 'indigo'
    }
  ];
  
  const index = Math.abs(hash) % presets.length;
  return presets[index];
};

// ── CUSTOM MARKDOWN COMPONENT BUILDER ──────────────────────────────────────────
const RichMarkdownRenderer = ({ content, presetOverrides = {}, themeIndex = 0, dropCap = false, appTheme }) => {
  // Pre-process content:
  // 1. Insert blank line before headings, lists, blockquotes, and code blocks to force correct parsing
  // 2. Add trailing spaces to non-special lines for hard-breaks
  let isFirstParagraph = true;
  
  const activeTheme = appTheme || (typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : 'dark');
  const isLightTheme = activeTheme === 'light';
  
  const processedContent = content
    ? content
        .replace(/\r\n/g, '\n')
        .split('\n')
        .reduce((acc, line, idx) => {
          const trimmed = line.trim();
          if (trimmed === '') {
            acc.push(line);
            return acc;
          }
          
          const isHeading = /^#{1,6}\s/.test(trimmed);
          const isBulletList = /^[-*+]\s/.test(trimmed);
          const isNumList = /^\d+\.\s/.test(trimmed);
          const isBlockquote = /^>\s/.test(trimmed);
          const isCodeBlock = /^```/.test(trimmed);
          const isSpecial = isHeading || isBulletList || isNumList || isBlockquote || isCodeBlock;
          
          if (idx > 0 && isSpecial) {
            const prevLine = acc[acc.length - 1].trim();
            if (prevLine !== '') {
              const prevIsHeading = /^#{1,6}\s/.test(prevLine);
              const prevIsBullet = /^[-*+]\s/.test(prevLine);
              const prevIsNum = /^\d+\.\s/.test(prevLine);
              const prevIsBlockquote = /^>\s/.test(prevLine);
              const prevIsCodeBlock = /^```/.test(prevLine);
              
              const isSameListType = (isBulletList && prevIsBullet) || 
                                     (isNumList && prevIsNum) || 
                                     (isBlockquote && prevIsBlockquote) ||
                                     (isHeading && prevIsHeading) ||
                                     (isCodeBlock && prevIsCodeBlock);
              
              if (!isSameListType) {
                acc.push('');
              }
            }
          }
          
          acc.push(line);
          return acc;
        }, [])
        .map((line, idx, arr) => {
          const trimmed = line.trim();
          if (trimmed === '') return line;
          
          const isSpecialLine = /^(?:[-*+]\s|\d+\.\s|#{1,6}\s|>\s|```)/.test(trimmed);
          const nextLine = arr[idx + 1] ? arr[idx + 1].trim() : '';
          const isNextSpecial = /^(?:[-*+]\s|\d+\.\s|#{1,6}\s|>\s|```)/.test(nextLine);
          
          if (!isSpecialLine && !isNextSpecial && nextLine !== '') {
            return line + '  ';
          }
          return line;
        })
        .join('\n')
    : '';

  // Theme-specific inline style mappings for standard markdown elements
  const getH2Style = () => {
    if (themeIndex === 0) { // Modern Editorial
      return {
        fontSize: '17px', fontWeight: 800, color: isLightTheme ? (presetOverrides.color || '#7c5cfc') : (presetOverrides.color || '#a78bfa'),
        borderLeft: `4px solid ${isLightTheme ? (presetOverrides.color || '#7c5cfc') : (presetOverrides.color || '#a78bfa')}`, paddingLeft: '10px',
        marginTop: '22px', marginBottom: '10px', display: 'block'
      };
    }
    if (themeIndex === 1) { // Cyberpunk Tech
      return {
        fontSize: '14.5px', fontWeight: 700, color: isLightTheme ? '#0f766e' : '#34d399', fontFamily: 'monospace',
        background: isLightTheme ? 'rgba(15,118,110,0.05)' : 'rgba(52,211,153,0.05)', 
        border: `1px solid ${isLightTheme ? 'rgba(15,118,110,0.15)' : 'rgba(52,211,153,0.2)'}`,
        padding: '6px 12px', borderRadius: '8px', marginTop: '20px', marginBottom: '10px', display: 'block'
      };
    }
    if (themeIndex === 2) { // Startup Creative
      return {
        fontSize: '18px', fontWeight: 900, background: isLightTheme ? 'linear-gradient(135deg, #6d28d9, #4f46e5)' : (presetOverrides.gradient || 'linear-gradient(135deg, #7c3aed, #a78bfa)'),
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        marginTop: '22px', marginBottom: '10px', display: 'block'
      };
    }
    if (themeIndex === 3) { // Classic Elegance
      return {
        fontSize: '18px', fontWeight: 700, color: isLightTheme ? '#b45309' : '#d97706', fontFamily: 'Georgia, serif',
        borderBottom: `1px solid ${isLightTheme ? 'rgba(180,83,9,0.2)' : 'rgba(217,119,6,0.25)'}`, paddingBottom: '4px',
        marginTop: '22px', marginBottom: '10px', display: 'block'
      };
    }
    return {
      fontSize: '16px', fontWeight: 800, color: presetOverrides.color || '#a78bfa',
      marginTop: '16px', marginBottom: '8px', paddingBottom: '4px',
      borderBottom: `1.5px solid ${presetOverrides.border || 'rgba(167,139,250,0.15)'}`
    };
  };

  const getBlockquoteStyle = () => {
    if (themeIndex === 0) { // Modern Editorial
      return {
        borderLeft: 'none', borderTop: isLightTheme ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)', 
        borderBottom: isLightTheme ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)',
        padding: '14px 0', margin: '20px 0', textAlign: 'center', fontStyle: 'italic', fontSize: '15px', color: isLightTheme ? '#2d3748' : '#e2e8f0'
      };
    }
    if (themeIndex === 1) { // Cyberpunk Tech
      return {
        background: isLightTheme ? '#f1f5f9' : '#05070c', borderLeft: '4px solid #38bdf8', padding: '12px 16px', borderRadius: '0 8px 8px 0',
        fontStyle: 'italic', color: isLightTheme ? '#475569' : '#94a3b8', margin: '14px 0'
      };
    }
    if (themeIndex === 2) { // Startup Creative
      return {
        background: isLightTheme ? 'rgba(124,58,237,0.04)' : 'rgba(255,255,255,0.03)', borderLeft: `4px solid ${presetOverrides.color || '#7c5cfc'}`,
        padding: '14px 18px', borderRadius: '12px', boxShadow: isLightTheme ? '0 4px 12px rgba(0,0,0,0.03)' : '0 4px 15px rgba(0,0,0,0.15)',
        color: isLightTheme ? '#2d3748' : 'rgba(254, 254, 254, 0.99)', fontStyle: 'italic', margin: '16px 0'
      };
    }
    if (themeIndex === 3) { // Classic Elegance
      return {
        background: isLightTheme ? '#fafaf6' : '#23211f', borderLeft: '3px solid #d97706', color: isLightTheme ? '#475569' : '#cfc7c0',
        padding: '14px 18px', fontFamily: 'Georgia, serif', fontStyle: 'italic', margin: '16px 0'
      };
    }
    return {
      borderLeft: `3px solid ${presetOverrides.color || '#7c5cfc'}`, paddingLeft: '12px',
      margin: '12px 0', color: isLightTheme ? '#475569' : 'rgba(254, 254, 254, 0.77)', fontStyle: 'italic'
    };
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ node, ...props }) => {
          let className = "";
          if (themeIndex === 1) className = "cyberpunk-h1";
          else if (themeIndex === 2) className = "startup-h1";
          return (
            <h1 className={className} style={{
              fontSize: themeIndex === 3 ? '22px' : '20px',
              fontWeight: 800,
              color: isLightTheme ? '#0f172a' : 'rgba(254, 254, 254, 0.99)',
              fontFamily: themeIndex === 3 ? 'Georgia, serif' : 'inherit',
              marginTop: '20px', marginBottom: '12px', ...props.style
            }} {...props} />
          );
        },
        h2: ({ node, ...props }) => {
          let className = "";
          if (themeIndex === 1) className = "cyberpunk-h2";
          else if (themeIndex === 2) className = "startup-h2";
          return (
            <h2 className={className} style={{ ...getH2Style(), ...props.style }} {...props} />
          );
        },
        h3: ({ node, ...props }) => {
          let className = "";
          if (themeIndex === 1) className = "cyberpunk-h3";
          else if (themeIndex === 2) className = "startup-h3";
          return (
            <h3 className={className} style={{
              fontSize: '14px', fontWeight: 700,
              color: themeIndex === 3 ? '#b45309' : isLightTheme ? '#1a202c' : 'rgba(254, 254, 254, 0.99)',
              fontFamily: themeIndex === 3 ? 'Georgia, serif' : 'inherit',
              marginTop: '12px', marginBottom: '6px', ...props.style
            }} {...props} />
          );
        },
        p: ({ node, ...props }) => {
          if (dropCap && isFirstParagraph) {
            isFirstParagraph = false;
            let textContent = '';
            React.Children.forEach(props.children, child => {
              if (typeof child === 'string') textContent += child;
            });
            if (textContent.length > 2) {
              const firstLetter = textContent.charAt(0);
              const rest = textContent.substring(1);
              return (
                <p style={{ marginBottom: '10px', lineHeight: '1.75', color: isLightTheme ? '#2d3748' : 'rgba(254, 254, 254, 0.95)', ...props.style }}>
                  <span style={{
                    float: 'left', fontSize: '38px', fontWeight: 900, lineHeight: '30px',
                    paddingTop: '4px', paddingRight: '8px', paddingLeft: '3px',
                    color: presetOverrides.color || '#a78bfa', fontFamily: 'Georgia, serif'
                  }}>{firstLetter}</span>
                  {rest}
                </p>
              );
            }
          }
          return (
            <p style={{
              marginBottom: '10px', lineHeight: '1.75',
              color: isLightTheme ? '#2d3748' : 'rgba(254, 254, 254, 0.95)',
              fontFamily: themeIndex === 3 ? 'Georgia, serif' : 'inherit', ...props.style
            }} {...props} />
          );
        },
        strong: ({ node, ...props }) => (
          <strong style={{
            color: isLightTheme ? '#0f172a' : presetOverrides.color || '#38bdf8',
            fontWeight: 700, ...props.style
          }} {...props} />
        ),
        em: ({ node, ...props }) => (
          <em style={{ fontStyle: 'italic', color: isLightTheme ? '#1a202c' : 'rgba(254, 254, 254, 0.95)', ...props.style }} {...props} />
        ),
        blockquote: ({ node, ...props }) => (
          <blockquote style={{ ...getBlockquoteStyle(), ...props.style }} {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul style={{ listStyleType: themeIndex === 2 ? 'none' : 'disc', paddingLeft: themeIndex === 2 ? '0' : '18px', marginBottom: '10px', ...props.style }} {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol style={{ listStyleType: 'decimal', paddingLeft: '18px', marginBottom: '10px', ...props.style }} {...props} />
        ),
        li: ({ node, ...props }) => {
          if (themeIndex === 2) {
            return (
              <li style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start', color: 'rgba(254, 254, 254, 0.95)' }}>
                <span style={{ color: '#22c55e', fontWeight: 800 }}>✓</span>
                <span style={{ lineHeight: '1.65' }} {...props} />
              </li>
            );
          }
          return (
            <li style={{
              marginBottom: '4px', lineHeight: '1.65',
              color: isLightTheme ? '#2d3748' : 'rgba(254, 254, 254, 0.95)',
              fontFamily: themeIndex === 3 ? 'Georgia, serif' : 'inherit', ...props.style
            }} {...props} />
          );
        },
        code: ({ node, inline, ...props }) => (
          inline 
            ? <code style={{ fontFamily: 'monospace', fontSize: '11.5px', background: 'rgba(255,255,255,0.06)', padding: '2px 5px', borderRadius: '4px', color: '#f472b6' }} {...props} />
            : <pre style={{ background: '#05070c', padding: '12px', borderRadius: '8px', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.06)', margin: '10px 0' }}><code style={{ fontFamily: 'monospace', fontSize: '12px', color: '#34d399' }} {...props} /></pre>
        )
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
};

const getLandingPageImage = (topic) => {
  const t = (topic || '').toLowerCase();
  if (t.includes('food') || t.includes('restaurant') || t.includes('cafe') || t.includes('bakery')) {
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80';
  }
  if (t.includes('real estate') || t.includes('home') || t.includes('house') || t.includes('property') || t.includes('apartment')) {
    return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=80';
  }
  if (t.includes('fitness') || t.includes('gym') || t.includes('workout') || t.includes('health') || t.includes('yoga')) {
    return 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80';
  }
  if (t.includes('fashion') || t.includes('clothes') || t.includes('store') || t.includes('boutique') || t.includes('brand')) {
    return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80';
  }
  if (t.includes('finance') || t.includes('crypto') || t.includes('bitcoin') || t.includes('money') || t.includes('bank')) {
    return 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&auto=format&fit=crop&q=80';
  }
  if (t.includes('travel') || t.includes('hotel') || t.includes('resort') || t.includes('beach') || t.includes('tour')) {
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80';
};

const generateLandingPageHtml = (title, body, cta, image, preset) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Outfit', sans-serif;
      background-color: #05070f;
      color: #f8fafc;
      overflow-x: hidden;
    }
    .font-space { font-family: 'Space Grotesk', sans-serif; }
    .glass {
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .glow-accent {
      box-shadow: 0 0 50px rgba(124, 58, 237, 0.25);
    }
    .shader-line {
      height: 1px;
      background: linear-gradient(90deg, transparent, #a78bfa, #38bdf8, transparent);
      animation: pulseLine 4s infinite linear;
    }
    @keyframes pulseLine {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .shuffle-container {
      position: relative;
      height: 380px;
      perspective: 1000px;
    }
    .shuffle-card {
      position: absolute;
      left: 50%;
      top: 10%;
      transform: translateX(-50%);
      transition: all 0.6s cubic-bezier(0.2, 1, 0.3, 1);
    }
    .shuffle-container:hover .card-1 {
      transform: translateX(-120%) rotate(-10deg) scale(0.95);
    }
    .shuffle-container:hover .card-2 {
      transform: translateX(-50%) translateY(-10px) rotate(0deg) scale(1.05);
      z-index: 10;
      border-color: #a78bfa;
      box-shadow: 0 20px 40px rgba(124,58,237,0.2);
    }
    .shuffle-container:hover .card-3 {
      transform: translateX(20%) rotate(10deg) scale(0.95);
    }
    #cursor-trail {
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(167, 139, 250, 0.08) 0%, rgba(56, 189, 248, 0.03) 50%, transparent 100%);
      pointer-events: none;
      position: fixed;
      transform: translate(-50%, -50%);
      z-index: 0;
      transition: width 0.3s, height 0.3s;
    }
  </style>
</head>
<body class="relative">
  <div id="cursor-trail"></div>

  <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0 pointer-events-none"></div>

  <nav class="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center relative z-10">
    <div class="text-2xl font-black tracking-wider bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent font-space">PROMPTFORGE</div>
    <div class="hidden md:flex gap-8 text-sm font-semibold text-slate-300">
      <a href="#features" class="hover:text-purple-400 transition">Features</a>
      <a href="#demo" class="hover:text-purple-400 transition">Interactive Demo</a>
      <a href="#cta" class="hover:text-purple-400 transition">Get Started</a>
    </div>
    <a href="#cta" class="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 rounded-full font-bold text-sm transition shadow-lg shadow-purple-500/20 relative overflow-hidden group">
      <span class="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition duration-300"></span>
      <span class="relative">Launch Website</span>
    </a>
  </nav>

  <section class="max-w-7xl mx-auto px-6 pt-16 pb-32 grid lg:grid-cols-2 gap-16 items-center relative z-10">
    <div class="hero-left">
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold tracking-widest uppercase mb-8">
        <span class="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
        Elite High-Converting Landing Page
      </div>
      <h1 class="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-8 bg-gradient-to-r from-white via-slate-100 to-purple-300 bg-clip-text text-transparent font-space">
        ${title}
      </h1>
      <p class="text-slate-400 text-lg sm:text-xl leading-relaxed mb-10 max-w-xl">
        Transform standard traffic into high-paying, lifelong customers with responsive GSAP motion elements and modern 3D alignments.
      </p>
      <div class="flex flex-wrap gap-4">
        <a href="#cta" class="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 rounded-xl font-bold text-base transition shadow-xl shadow-purple-500/30">
          Get Started Now
        </a>
        <a href="#features" class="px-8 py-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl font-bold text-base transition">
          View Animations
        </a>
      </div>
    </div>
    <div class="relative lg:pl-10 hero-right">
      <div class="absolute -inset-4 bg-purple-600/10 rounded-3xl filter blur-3xl opacity-50 animate-pulse"></div>
      <div class="relative rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden glass p-4">
        <div class="h-6 w-full bg-slate-950/80 rounded-t-lg border-b border-slate-900 flex items-center gap-2 px-3 mb-4">
          <div class="w-2.5 h-2.5 rounded-full bg-red-500"></div>
          <div class="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
          <div class="w-2.5 h-2.5 rounded-full bg-green-500"></div>
        </div>
        <img src="${image}" alt="Mockup Illustration" class="rounded-xl w-full object-cover h-[380px] shadow-lg transform hover:scale-[1.02] transition duration-500">
      </div>
    </div>
  </section>

  <div class="shader-line"></div>

  <section id="features" class="py-32 bg-slate-950/40 relative z-10">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center max-w-2xl mx-auto mb-20">
        <h2 class="text-4xl font-black mb-4 font-space">3D Hover Card Spread</h2>
        <p class="text-slate-400">Hover over the cards below to witness an immersive 3D shuffle expansion effect designed to capture customer attention instantly.</p>
      </div>

      <div class="shuffle-container hidden md:block">
        <div class="shuffle-card card-1 glass p-8 rounded-2xl w-[320px] h-[280px] -ml-[120px] transform rotate-[-6deg]">
          <span class="text-3xl">🚀</span>
          <h3 class="text-xl font-bold mt-4 mb-2 text-purple-400">GSAP Animations</h3>
          <p class="text-slate-400 text-sm leading-relaxed">Silky smooth scrolling and timeline orchestration using standard high-performance GSAP frameworks.</p>
        </div>
        <div class="shuffle-card card-2 glass p-8 rounded-2xl w-[320px] h-[280px] transform rotate-[1deg] border border-cyan-500/20">
          <span class="text-3xl">💎</span>
          <h3 class="text-xl font-bold mt-4 mb-2 text-cyan-400">Bespoke UX Designs</h3>
          <p class="text-slate-400 text-sm leading-relaxed">High-fidelity typography, harmonious colors, and perfect spacing optimized for professional conversions.</p>
        </div>
        <div class="shuffle-card card-3 glass p-8 rounded-2xl w-[320px] h-[280px] ml-[120px] transform rotate-[8deg]">
          <span class="text-3xl">🔥</span>
          <h3 class="text-xl font-bold mt-4 mb-2 text-pink-400">High Conversion</h3>
          <p class="text-slate-400 text-sm leading-relaxed">Tested copy and layouts built purely to retain visitors and accelerate user actions.</p>
        </div>
      </div>

      <div class="grid md:hidden gap-6">
        <div class="glass p-6 rounded-xl">
          <span class="text-2xl">🚀</span>
          <h3 class="text-lg font-bold mt-2 mb-1 text-purple-400">GSAP Animations</h3>
          <p class="text-slate-400 text-xs">Silky smooth scroll reveals.</p>
        </div>
        <div class="glass p-6 rounded-xl border border-cyan-500/20">
          <span class="text-2xl">💎</span>
          <h3 class="text-lg font-bold mt-2 mb-1 text-cyan-400">Bespoke UX Designs</h3>
          <p class="text-slate-400 text-xs">High-fidelity optimized layouts.</p>
        </div>
        <div class="glass p-6 rounded-xl">
          <span class="text-2xl">🔥</span>
          <h3 class="text-lg font-bold mt-2 mb-1 text-pink-400">High Conversion</h3>
          <p class="text-slate-400 text-xs">Tested copy designed to convert.</p>
        </div>
      </div>
    </div>
  </section>

  <section id="demo" class="py-24 max-w-7xl mx-auto px-6 relative z-10">
    <div class="glass p-12 rounded-3xl relative overflow-hidden">
      <div class="absolute -right-20 -top-20 w-80 h-80 bg-cyan-600/10 rounded-full filter blur-3xl"></div>
      
      <div class="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 class="text-3xl font-extrabold mb-6 font-space">Immersive Click-to-Explode Info Box</h2>
          <p class="text-slate-400 mb-8 leading-relaxed">
            Click any button below to trigger an "exploding information" box, simulating next-generation interactive components that keep users fully engaged on your client's page.
          </p>
          <div class="flex flex-wrap gap-4" id="explode-triggers">
            <button class="px-5 py-2.5 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/40 rounded-xl text-purple-300 font-bold transition text-sm" onclick="showExplode('speed')">⚡ Interactive Speed</button>
            <button class="px-5 py-2.5 bg-cyan-600/20 border border-cyan-500/30 hover:bg-cyan-600/40 rounded-xl text-cyan-300 font-bold transition text-sm" onclick="showExplode('design')">🎨 Shader Effects</button>
            <button class="px-5 py-2.5 bg-pink-600/20 border border-pink-500/30 hover:bg-pink-600/40 rounded-xl text-pink-300 font-bold transition text-sm" onclick="showExplode('code')">💻 Vanilla HTML/CSS</button>
          </div>
        </div>
        <div class="h-[220px] flex items-center justify-center relative">
          <div id="explode-box" class="w-full glass p-8 rounded-2xl border border-purple-500/30 text-center transform scale-90 opacity-0 transition duration-500 glow-accent">
            <h3 id="explode-title" class="text-xl font-bold mb-3 text-purple-300">Exploding Info</h3>
            <p id="explode-desc" class="text-slate-300 text-sm">Select an interactive button to explode info details.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section id="cta" class="max-w-4xl mx-auto px-6 py-32 text-center relative z-10">
    <div class="glass p-16 rounded-3xl glow-purple relative overflow-hidden">
      <div class="absolute -right-32 -bottom-32 w-[400px] h-[400px] bg-purple-600/10 rounded-full filter blur-3xl animate-pulse"></div>
      <span class="text-4xl mb-4 inline-block animate-bounce">⚡</span>
      <h2 class="text-3xl sm:text-5xl font-black mb-6 font-space">${cta || 'Ready to Scale Conversions?'}</h2>
      <p class="text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
        Integrate elite animations and modern designs. Launch your $2000 professional single-page layout now!
      </p>
      <a href="#" class="inline-flex px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 rounded-xl font-bold text-base transition shadow-xl shadow-purple-500/30 transform hover:scale-105 duration-300">
        Activate Premium Offer
      </a>
    </div>
  </section>

  <footer class="border-t border-slate-900/50 py-12 text-center text-slate-500 text-sm relative z-10">
    <p>&copy; ${new Date().getFullYear()} PROMPTFORGE Studio. Elite conversions guaranteed.</p>
  </footer>

  <script>
    const trail = document.getElementById('cursor-trail');
    window.addEventListener('mousemove', (e) => {
      gsap.to(trail, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.8,
        ease: 'power3.out'
      });
    });

    const explodeBox = document.getElementById('explode-box');
    const explodeTitle = document.getElementById('explode-title');
    const explodeDesc = document.getElementById('explode-desc');

    const details = {
      speed: {
        title: '⚡ Interactive Speed',
        desc: 'GSAP and Tailwind are optimized for absolute maximum lightweight speed. Zero bundle bloat, yielding 100/100 Lighthouse performance metrics.',
        color: '#a78bfa',
        border: 'rgba(167, 139, 250, 0.3)'
      },
      design: {
        title: '🎨 Custom Shader Effects',
        desc: 'Implements dynamic custom gradient overlays and sleek glassmorphism lines that flow perfectly based on user scroll triggers.',
        color: '#22d3ee',
        border: 'rgba(34, 211, 238, 0.3)'
      },
      code: {
        title: '💻 Vanilla HTML/CSS',
        desc: 'Production-ready code including lightweight GSAP scripts. Copy it, paste it, double click to run. Zero compile or setup overhead required!',
        color: '#f472b6',
        border: 'rgba(244, 114, 182, 0.3)'
      }
    };

    function showExplode(key) {
      const data = details[key];
      gsap.to(explodeBox, {
        scale: 0.7,
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
          explodeTitle.innerText = data.title;
          explodeTitle.style.color = data.color;
          explodeDesc.innerText = data.desc;
          explodeBox.style.borderColor = data.border;
          explodeBox.style.boxShadow = '0 0 40px ' + data.border.replace('0.3', '0.15');
          
          gsap.to(explodeBox, {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: 'back.out(1.7)'
          });
        }
      });
    }

    gsap.registerPlugin(ScrollTrigger);

    gsap.from('.hero-left', {
      x: -100,
      opacity: 0,
      duration: 1.2,
      ease: 'power4.out'
    });

    gsap.from('.hero-right', {
      x: 100,
      opacity: 0,
      duration: 1.2,
      ease: 'power4.out',
      delay: 0.2
    });

    gsap.from('#features h2, #features p', {
      scrollTrigger: {
        trigger: '#features',
        start: 'top 80%'
      },
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2
    });
  </script>
</body>
</html>`;
};

const LandingPageRenderer = ({ content, preset, topic }) => {
  const [landingTab, setLandingTab] = useState('preview');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [explodeKey, setExplodeKey] = useState(null);

  const blocks = content.split('\n\n').filter(b => b.trim());
  const mainTitle = blocks[0] || 'Unlock Premium Freedom!';
  const bodyContent = blocks.slice(1);
  const imageUrl = getLandingPageImage(topic || mainTitle);

  const ctaIndex = bodyContent.findIndex(b => b.toLowerCase().includes('click') || b.toLowerCase().includes('get started') || b.toLowerCase().includes('buy now') || b.toLowerCase().includes('sign up') || b.toLowerCase().includes('sincerely'));
  let ctaBlock = '';
  if (ctaIndex !== -1) {
    ctaBlock = bodyContent[ctaIndex];
  }
  const cleanBody = bodyContent.filter((_, idx) => idx !== ctaIndex).join('\n\n');

  const fullHtml = generateLandingPageHtml(
    cleanTextDisplay(mainTitle.replace(/^#\s*/, '')),
    cleanBody,
    ctaBlock ? cleanTextDisplay(ctaBlock.replace(/^cta:?/i, '')) : '',
    imageUrl,
    preset
  );

  const explodeDetails = {
    speed: {
      title: '⚡ Interactive Speed',
      desc: 'GSAP and Tailwind are optimized for absolute maximum lightweight speed. Zero bundle bloat, yielding 100/100 Lighthouse performance metrics.',
      color: '#a78bfa',
      border: 'rgba(167, 139, 250, 0.3)'
    },
    design: {
      title: '🎨 Custom Shader Effects',
      desc: 'Implements dynamic custom gradient overlays and sleek glassmorphism lines that flow perfectly based on user scroll triggers.',
      color: '#22d3ee',
      border: 'rgba(34, 211, 238, 0.3)'
    },
    code: {
      title: '💻 Vanilla HTML/CSS',
      desc: 'Production-ready code including lightweight GSAP scripts. Copy it, paste it, double click to run. Zero compile or setup overhead required!',
      color: '#f472b6',
      border: 'rgba(244, 114, 182, 0.3)'
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(fullHtml);
      alert('Copied 2000$ landing page code successfully! Paste it into a local HTML file to witness the GSAP animations!');
    } catch (_) {
      alert('Failed to copy code');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '10px', width: 'fit-content' }}>
        <button
          onClick={() => setLandingTab('preview')}
          style={{
            background: landingTab === 'preview' ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
            border: 'none', color: landingTab === 'preview' ? '#a78bfa' : 'rgba(255,255,255,0.5)',
            padding: '6px 14px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
          }}
        >
          🌐 Interactive Live Preview
        </button>
        <button
          onClick={() => setLandingTab('code')}
          style={{
            background: landingTab === 'code' ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
            border: 'none', color: landingTab === 'code' ? '#a78bfa' : 'rgba(255,255,255,0.5)',
            padding: '6px 14px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
          }}
        >
          💻 2000$ HTML/GSAP Source Code
        </button>
      </div>

      {landingTab === 'preview' ? (
        <div style={{
          background: '#05070f', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px', padding: '24px', overflow: 'hidden', position: 'relative',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px',
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '0 0 16px 0',
            borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
            </div>
            <div style={{
              flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '6px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', textAlign: 'center',
              padding: '2px 0', fontFamily: 'monospace'
            }}>
              🌐 https://bespoke-landingpage.live/preview
            </div>
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', padding: '1px 5px', borderRadius: '3px' }}>GSAP LIVE</span>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span style={{
              fontSize: '9px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase',
              color: '#a78bfa', background: 'rgba(167,139,250,0.1)', padding: '3px 10px', borderRadius: '15px'
            }}>
              ✨ $2000 High-End Motion UX
            </span>
            <h1 style={{
              fontSize: '28px', fontWeight: 900, lineHeight: '1.2', marginTop: '14px', marginBottom: '10px',
              background: 'linear-gradient(135deg, #fff, #c084fc, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              textShadow: '0 0 20px rgba(167, 139, 250, 0.15)'
            }}>
              {cleanTextDisplay(mainTitle.replace(/^#\s*/, ''))}
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '80%', margin: '0 auto 18px', lineHeight: '1.6' }}>
              Transform standard traffic into loyal customers using responsive scrolling layouts, high contrast typography, and custom visuals.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button style={{ background: preset.gradient || 'linear-gradient(135deg, #7c3aed, #c084fc)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 15px rgba(124,58,237,0.3)' }}>Get Started Now</button>
              <button style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '10px 20px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>View Details</button>
            </div>
          </div>

          <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '32px' }}>
            <img src={imageUrl} alt="Dynamic visual mockup" style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #05070f, transparent)' }} />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>Interactive 3D Feature Card Spread</h3>
              <p style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>Hover over features to see bespoke card shuffle revelations!</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              {[
                { title: '🚀 GSAP Motion', text: 'Silky smooth scroll and spring mechanics.', color: '#a78bfa' },
                { title: '🎨 Shaders & Lines', text: 'Gorgeous animated particle line dividers.', color: '#22d3ee' },
                { title: '🔥 Conversion UX', text: 'Proven alignment formats to secure actions.', color: '#f472b6' }
              ].map((card, idx) => (
                <div 
                  key={idx}
                  onMouseEnter={() => setHoveredCard(idx)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    background: hoveredCard === idx ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255,255,255,0.02)',
                    border: `1.5px solid ${hoveredCard === idx ? card.color : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '12px', padding: '14px', transition: 'all 0.3s cubic-bezier(0.2, 1, 0.3, 1)',
                    transform: hoveredCard === idx ? 'translateY(-6px) scale(1.03)' : 'none',
                    boxShadow: hoveredCard === idx ? `0 8px 24px ${card.color}15` : 'none'
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '12.5px', color: card.color, marginBottom: '6px' }}>{card.title}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>{card.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>Interactive Click-to-Explode detail box</h4>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {['speed', 'design', 'code'].map(key => (
                <button
                  key={key}
                  onClick={() => setExplodeKey(key)}
                  style={{
                    background: explodeKey === key ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${explodeKey === key ? '#a78bfa' : 'rgba(255,255,255,0.1)'}`,
                    color: explodeKey === key ? '#a78bfa' : '#94a3b8', padding: '4px 10px', borderRadius: '8px',
                    fontSize: '11px', fontWeight: 700, cursor: 'pointer', outline: 'none'
                  }}
                >
                  {key === 'speed' ? '⚡ Speed' : key === 'design' ? '🎨 Shader' : '💻 Vanilla'}
                </button>
              ))}
            </div>
            {explodeKey && (
              <div style={{
                background: 'rgba(0,0,0,0.2)', border: `1px solid ${explodeDetails[explodeKey].border}`,
                borderRadius: '10px', padding: '12px', boxShadow: `0 0 15px ${explodeDetails[explodeKey].border}10`
              }}>
                <div style={{ fontWeight: 800, fontSize: '12px', color: explodeDetails[explodeKey].color, marginBottom: '4px' }}>{explodeDetails[explodeKey].title}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.4' }}>{explodeDetails[explodeKey].desc}</div>
              </div>
            )}
          </div>

          {ctaBlock && (
            <div style={{
              background: 'rgba(124, 58, 237, 0.05)', border: `1.5px dashed ${preset.border || 'rgba(167,139,250,0.3)'}`,
              borderRadius: '16px', padding: '20px', textAlign: 'center'
            }}>
              <p style={{ fontSize: '12px', color: '#fff', fontStyle: 'italic', marginBottom: '12px' }}>
                {cleanTextDisplay(ctaBlock.replace(/^cta:?/i, ''))}
              </p>
              <button style={{
                background: preset.gradient || 'linear-gradient(135deg, #7c3aed, #38bdf8)', color: '#fff',
                border: 'none', borderRadius: '10px', padding: '10px 24px', fontSize: '13px', fontWeight: 900,
                cursor: 'pointer', boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)'
              }}>
                Activate Bespoke Offer Now
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <button
            onClick={handleCopyCode}
            style={{
              position: 'absolute', top: '12px', right: '12px', zIndex: 10,
              background: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px',
              padding: '6px 14px', fontSize: '11px', fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 4px 12px rgba(34,197,94,0.3)'
            }}
          >
            <Copy size={12} /> Copy Code
          </button>
          <pre style={{
            background: '#05070c', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '16px', overflowX: 'auto', maxHeight: '500px',
            fontSize: '11.5px', color: '#34d399', fontFamily: 'monospace', textAlign: 'left', margin: 0
          }}>
            <code>{fullHtml}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

// ── Render content based on type with DYNAMIC visual decoration ─────────────
const renderFormattedContent = (content, contentType, selectedSeoIdx, setSelectedSeoIdx, topic, appTheme = 'dark') => {
  if (!content) return null;

  const isLight = appTheme === 'light';

  // Obtain consistent but dynamic presets based on content hash
  const preset = getDynamicAccent(content);

  // 1. 📝 Blog post / Article
  if (contentType === 'Blog post / Article') {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      hash = content.charCodeAt(i) + ((hash << 5) - hash);
    }
    const themeIndex = Math.abs(hash) % 4;
    
    // Theme 0: Magazine Editorial
    if (themeIndex === 0) {
      return (
        <div style={{
          background: isLight ? '#fcfbf7' : '#121214',
          border: `1px solid ${isLight ? '#ebdcb9' : '#2d2d34'}`,
          borderRadius: '12px', padding: '28px 24px', position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`, paddingBottom: '10px', marginBottom: '18px' }}>
            <span style={{ fontSize: '10px', fontWeight: 900, color: isLight ? (preset.color || '#7c3aed') : (preset.color || '#a78bfa'), letterSpacing: '1.5px', textTransform: 'uppercase', background: isLight ? 'rgba(124,58,237,0.06)' : 'rgba(167,139,250,0.1)', padding: '3px 10px', borderRadius: '4px' }}>EDITORIAL INSIGHT</span>
            <span style={{ fontSize: '11px', color: isLight ? '#64748b' : '#94a3b8' }}>⏱️ {Math.max(1, Math.round(content.split(/\s+/).length / 200))} min read</span>
          </div>
          <RichMarkdownRenderer content={content} presetOverrides={preset} themeIndex={0} dropCap={true} appTheme={appTheme} />
        </div>
      );
    }
    
    // Theme 1: Cyberpunk Tech
    if (themeIndex === 1) {
      return (
        <div className={isLight ? "" : "dark-theme-card"} style={{
          background: isLight ? '#f8fafc' : '#0a0b10', border: `1.5px solid ${isLight ? '#cbd5e1' : preset.border}`,
          borderRadius: '16px', padding: '24px', boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.04)' : `0 8px 30px rgba(0,0,0,0.5)`,
          position: 'relative', overflow: 'hidden'
        }}>
          {/* Tech Grid Background pattern */}
          <div style={{
            position: 'absolute', inset: 0, 
            backgroundImage: isLight ? 'radial-gradient(rgba(15, 118, 110, 0.08) 1px, transparent 0)' : 'radial-gradient(rgba(56, 189, 248, 0.15) 1px, transparent 0)', 
            backgroundSize: '16px 16px', opacity: 0.25, pointerEvents: 'none'
          }} />
          <div style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            background: isLight ? '#e2e8f0' : '#0b0f19', 
            border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'}`, 
            padding: '10px 16px', borderRadius: '10px', marginBottom: '20px', position: 'relative', zIndex: 1 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isLight ? '#0f766e' : '#10b981', boxShadow: isLight ? 'none' : '0 0 8px #10b981' }} />
              <span className="cyber-engine-text" style={{ fontSize: '11px', color: isLight ? '#0f766e' : '#10b981', fontFamily: 'monospace', fontWeight: 700 }}>CORE_ENGINE // STABLE</span>
            </div>
            <span className="cyber-words-text" style={{ fontSize: '11px', color: isLight ? '#64748b' : '#94a3b8', fontFamily: 'monospace' }}>WORDS: {content.split(/\s+/).length}</span>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <RichMarkdownRenderer content={content} presetOverrides={preset} themeIndex={1} appTheme={appTheme} />
          </div>
        </div>
      );
    }
    
    // Theme 2: Startup Creative Pitch
    if (themeIndex === 2) {
      return (
        <div className={isLight ? "" : "dark-theme-card"} style={{
          background: isLight ? '#ffffff' : 'linear-gradient(135deg, #0f0a1c, #1a0f30)', border: `1.5px solid ${isLight ? '#cbd5e1' : preset.border}`,
          borderRadius: '20px', padding: '28px', boxShadow: isLight ? '0 10px 25px rgba(0,0,0,0.05)' : `0 12px 32px ${preset.glow}`,
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: preset.gradient, filter: 'blur(50px)', opacity: isLight ? 0.08 : 0.15, pointerEvents: 'none' }} />
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '6px', 
            background: isLight ? 'rgba(109, 40, 217, 0.08)' : 'rgba(255,255,255,0.04)', 
            padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 800, 
            color: isLight ? '#6d28d9' : '#f3e8ff', letterSpacing: '0.5px', marginBottom: '18px' 
          }}>
            🚀 CREATIVE STARTUP BLOG
          </div>
          <RichMarkdownRenderer content={content} presetOverrides={preset} themeIndex={2} appTheme={appTheme} />
        </div>
      );
    }
    
    // Theme 3: Classic Elegance
    if (themeIndex === 3) {
      return (
        <div style={{
          background: isLight ? '#fdfdfb' : '#1a1816', border: `1px solid ${isLight ? '#ebdcb9' : '#3c3835'}`,
          borderRadius: '16px', padding: '36px 30px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
          fontFamily: 'Georgia, serif', color: isLight ? '#1c1917' : '#e7e5e4'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: isLight ? '#b45309' : '#d97706', textTransform: 'uppercase' }}>Belles-Lettres Archive</span>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', margin: '12px 0 0 0', color: isLight ? 'rgba(180,83,9,0.3)' : 'rgba(217,119,6,0.2)', fontSize: '11px' }}>
              <span style={{ height: '1px', width: '30px', background: isLight ? 'rgba(180,83,9,0.3)' : 'rgba(217,119,6,0.2)' }} />
              <span>◆   ◆   ◆</span>
              <span style={{ height: '1px', width: '30px', background: isLight ? 'rgba(180,83,9,0.3)' : 'rgba(217,119,6,0.2)' }} />
            </div>
          </div>
          <RichMarkdownRenderer content={content} presetOverrides={preset} themeIndex={3} appTheme={appTheme} />
        </div>
      );
    }
  }

  // 2. 💼 LinkedIn post
  if (contentType === 'LinkedIn post') {
    const initials = preset.accentName.substring(0, 2).toUpperCase();
    return (
      <div style={{
        background: 'rgba(255,255,255,0.02)', border: '1.5px solid rgba(255,255,255,0.06)',
        borderRadius: '16px', padding: '20px', fontFamily: 'inherit'
      }}>
        {/* Mock LinkedIn Profile Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', background: preset.gradient,
            display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 900, color: '#fff', boxShadow: `0 0 10px ${preset.glow}`
          }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>AI Content Architect</span>
              <span style={{
                background: '#0a66c2', color: '#fff', fontSize: '9px', fontWeight: 800,
                padding: '1px 5px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center'
              }}>IN</span>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
              Executive Creator • 2nd • Following
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
              <span>1h • Edited • </span><Globe size={10} />
            </div>
          </div>
          <Briefcase size={18} style={{ color: '#0a66c2' }} />
        </div>
        
        {/* Post text */}
        <div style={{ fontSize: '14px', lineHeight: '1.9', color: isLight ? '#1e293b' : 'rgba(255,255,255,0.95)' }}>
          <RichMarkdownRenderer content={content} presetOverrides={{ color: '#38bdf8', border: 'rgba(56,189,248,0.2)' }} appTheme={appTheme} />
        </div>
        
        {/* Post footer likes */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '18px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button style={{ background: 'none', border: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><ThumbsUp size={14} style={{ color: '#0a66c2' }} /> Like</button>
            <button style={{ background: 'none', border: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><MessageCircle size={14} /> Comment</button>
            <button style={{ background: 'none', border: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><Share2 size={14} /> Repost</button>
          </div>
          <button style={{ background: 'none', border: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><Send size={14} /> Send</button>
        </div>
      </div>
    );
  }

  // 3. 🐦 Twitter/X thread
  if (contentType === 'Twitter/X thread') {
    // Parse individual tweets (usually split by double newline or numbered prefixes)
    let tweets = content.split(/\n\n(?=\d+\/|\[\d+\]|Tweet \d+:|\d+\.)/i).filter(t => t.trim());
    if (tweets.length <= 1) {
      // Fallback: split by double newlines if no numbering is present
      tweets = content.split('\n\n').filter(t => t.trim());
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tweets.map((tweet, i) => {
          const len = tweet.length;
          const limit = 280;
          const pct = Math.min(100, (len / limit) * 100);
          const isOver = len > limit;
          
          return (
            <div key={i} className={isLight ? "" : "dark-theme-card"} style={{
              background: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)', 
              border: `1.5px solid ${isOver ? '#ef4444' : isLight ? '#cbd5e1' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: '16px', padding: '16px', position: 'relative',
              boxShadow: isOver ? '0 0 10px rgba(239, 68, 68, 0.1)' : isLight ? '0 4px 12px rgba(0,0,0,0.03)' : 'none'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', background: preset.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 900, color: '#fff'
                }}>X</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="twitter-name" style={{ fontWeight: 700, fontSize: '13px', color: isLight ? '#0f1419' : '#fff' }}>Writer Core</span>
                    <CheckCircle2 size={12} style={{ color: '#1d9bf0', fill: '#1d9bf0' }} />
                    <span className="twitter-handle" style={{ color: isLight ? '#536471' : 'rgba(255,255,255,0.4)', fontSize: '12px' }}>@promptforge · {i + 1}</span>
                  </div>
                </div>
                <Hash size={15} style={{ color: '#1d9bf0' }} />
              </div>
              
              {/* Tweet content */}
              <div style={{ fontSize: '13.5px', lineHeight: '1.75', color: isLight ? '#0f1419' : '#fff', whiteSpace: 'pre-wrap' }}>
                <RichMarkdownRenderer content={tweet} presetOverrides={{ color: '#1d9bf0', border: 'rgba(29,155,240,0.2)' }} appTheme={appTheme} />
              </div>
              
              {/* Progress counter */}
              <div style={{ 
                borderTop: `1px solid ${isLight ? '#e1e8ed' : 'rgba(255,255,255,0.04)'}`, marginTop: '14px', paddingTop: '10px', 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                fontSize: '11px', color: isOver ? '#ef4444' : isLight ? '#536471' : 'rgba(255,255,255,0.4)' 
              }}>
                <div style={{ display: 'flex', gap: '14px' }}>
                  <span>💬 4</span><span>🔁 12</span><span>❤️ 58</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '40px', height: '4px', background: isLight ? '#e1e8ed' : 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: isOver ? '#ef4444' : preset.color }} />
                  </div>
                  <span style={{ fontWeight: 700 }}>{len} / {limit} chars</span>
                  {isOver && <ShieldAlert size={12} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 4. 📸 Instagram caption
  if (contentType === 'Instagram caption') {
    const lines = content.split('\n');
    // Separate hashtags
    const textLines = lines.filter(l => !l.trim().startsWith('#'));
    const hashLines = lines.filter(l => l.trim().startsWith('#'));
    
    return (
      <div style={{
        background: 'rgba(255,255,255,0.02)', border: '1.5px solid rgba(255,255,255,0.06)',
        borderRadius: '16px', overflow: 'hidden'
      }}>
        {/* Inst Mock Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
            padding: '1.5px'
          }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#10101c', border: '1px solid #10101c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 900, color: '#fff' }}>IG</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>creativestudio.ai</div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>Engineered Inspiration</div>
          </div>
          <Camera size={16} style={{ color: '#e1306c' }} />
        </div>
        
        {/* Caption Area */}
        <div style={{ padding: '16px' }}>
          <div style={{ fontSize: '13.5px', lineHeight: '1.8', color: '#fff' }}>
            <RichMarkdownRenderer content={textLines.join('\n')} presetOverrides={preset} />
          </div>
          
          {hashLines.length > 0 && (
            <div style={{ 
              marginTop: '16px', fontSize: '13px', color: '#38bdf8', 
              wordBreak: 'break-word', whiteSpace: 'pre-wrap', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '10px' 
            }}>
              {cleanTextDisplay(hashLines.join(' '))}
            </div>
          )}
        </div>
        
        {/* Interactive feedback footer */}
        <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Heart size={14} style={{ color: '#ef4444', fill: '#ef4444' }} />
            <span>1,438 Likes</span>
          </div>
          <span>Add comments...</span>
        </div>
      </div>
    );
  }

  // 5. 📱 Social media post
  if (contentType === 'Social media post') {
    return (
      <div style={{
        background: preset.bgLight, border: `1.5px solid ${preset.border}`,
        borderRadius: '16px', padding: '24px', boxShadow: `0 8px 32px ${preset.glow}`,
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Glow corner decorative */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px',
          borderRadius: '50%', background: preset.gradient, filter: 'blur(30px)', opacity: 0.15
        }} />
        
        {/* Dynamic header badge */}
        <div style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '6px', 
          background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '20px', 
          fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: preset.color, 
          letterSpacing: '1px', marginBottom: '16px' 
        }}>
          <Sparkles size={11} /> Multi-Channel Post
        </div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <RichMarkdownRenderer content={content} presetOverrides={preset} />
        </div>
      </div>
    );
  }

  // 6. 📧 Cold email
  if (contentType === 'Cold email') {
    const lines = content.split('\n');
    const subjectLine = lines.find(l => l.toLowerCase().startsWith('subject:') || l.toLowerCase().startsWith('subject line:'));
    const bodyLines = lines.filter(l => l !== subjectLine);
    const bodyText = bodyLines.join('\n').trim();

    return (
      <div style={{
        background: 'rgba(255,255,255,0.02)', border: '1.5px solid rgba(255,255,255,0.08)',
        borderRadius: '16px', overflow: 'hidden'
      }}>
        {/* Email Client Bar */}
        <div style={{ 
          background: 'rgba(255,255,255,0.03)', padding: '12px 16px', 
          borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', 
          alignItems: 'center', justifyContent: 'space-between' 
        }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
          </div>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Cold Email Sandbox</span>
          <Mail size={14} style={{ color: preset.color }} />
        </div>
        
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Mock Headers */}
          <div style={{ fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>To:</span> <span style={{ color: '#fff' }}>prospective_client@domain.com</span></div>
            <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>From:</span> <span style={{ color: '#fff' }}>expert_outreach@promptforge.ai</span></div>
          </div>
          
          {/* Highlighted Subject Line Card */}
          {subjectLine && (
            <div style={{
              background: preset.bgLight, border: `1px solid ${preset.border}`,
              borderRadius: '10px', padding: '12px', display: 'flex', gap: '10px', alignItems: 'center',
              boxShadow: `0 0 10px ${preset.glow}`
            }}>
              <span style={{ 
                fontSize: '10px', fontWeight: 800, background: preset.gradient, 
                color: '#fff', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' 
              }}>Subject</span>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>
                {cleanTextDisplay(subjectLine.replace(/^subject line:?/i, '').replace(/^subject:?/i, ''))}
              </span>
            </div>
          )}
          
          {/* Email Body */}
          <div style={{ 
            fontSize: '13.5px', lineHeight: '1.8', color: 'rgba(255,255,255,0.9)', 
            padding: '8px', minHeight: '120px' 
          }}>
            <RichMarkdownRenderer content={bodyText} presetOverrides={preset} />
          </div>
        </div>
      </div>
    );
  }

  // 7. 🛍️ Product description
  if (contentType === 'Product description') {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.01)', border: `1.5px solid ${preset.border}`,
        borderRadius: '16px', overflow: 'hidden', boxShadow: `0 4px 20px ${preset.glow}`
      }}>
        {/* Dynamic accent top strip */}
        <div style={{ background: preset.gradient, height: '4px' }} />
        
        <div style={{ padding: '20px' }}>
          {/* Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{
              fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
              color: '#34d399', background: 'rgba(52,211,153,0.1)',
              padding: '4px 10px', borderRadius: '20px'
            }}>🛍️ Sales copy</span>
            <div style={{ display: 'flex', gap: '2px', color: '#fbbf24', fontSize: '12px' }}>⭐⭐⭐⭐⭐</div>
          </div>
          
          <RichMarkdownRenderer content={content} presetOverrides={preset} themeIndex={2} />
        </div>
      </div>
    );
  }

  // 8. 🎯 Ad copy (Facebook/Google)
  if (contentType === 'Ad copy (Facebook/Google)') {
    const lines = content.split('\n').filter(l => l.trim());
    const headline = lines[0] || 'Exclusive Deal Inside!';
    const restOfAd = lines.slice(1).join('\n');

    return (
      <div style={{
        background: 'rgba(255,255,255,0.02)', border: '1.5px solid rgba(255,255,255,0.06)',
        borderRadius: '16px', overflow: 'hidden'
      }}>
        {/* Ad Mock Top Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%', background: preset.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 900, color: '#fff'
          }}>AD</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>Brand Advertiser</div>
            <div style={{ fontSize: '9px', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span>Sponsored</span> · <Globe size={8} />
            </div>
          </div>
          <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', color: 'rgba(255,255,255,0.4)' }}>Google/FB Ad</span>
        </div>
        
        {/* Main Ad Text */}
        <div style={{ padding: '16px' }}>
          {/* Main Copy */}
          <div style={{ fontSize: '13.5px', lineHeight: '1.75', color: '#fff', marginBottom: '16px' }}>
            <RichMarkdownRenderer content={restOfAd} presetOverrides={preset} />
          </div>
          
          {/* Headline highlighted in purple accent card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(167,139,250,0.12))',
            border: '1.5px solid rgba(167,139,250,0.3)', borderRadius: '12px', padding: '16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 0 15px rgba(124,92,252,0.1)'
          }}>
            <div style={{ flex: 1, paddingRight: '12px' }}>
               <div style={{ fontSize: '10px', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>HIGH-CONVERTING HEADLINE</div>
              <div style={{ fontWeight: 800, fontSize: '15px', color: '#fff', lineHeight: '1.3' }}>
                {cleanTextDisplay(headline.replace(/^headline:?/i, ''))}
              </div>
            </div>
            <button style={{
              background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px',
              padding: '8px 14px', fontSize: '11px', fontWeight: 800, cursor: 'pointer',
              whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px',
              boxShadow: '0 0 10px rgba(124,58,237,0.4)'
            }}>
              Learn More <ExternalLink size={10} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 9. 🎥 YouTube script / 📹 TikTok script / Video script
  if (['YouTube script', 'TikTok script', 'Video script'].includes(contentType)) {
    const blocks = content.split('\n\n').filter(b => b.trim());
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {blocks.map((block, i) => {
          const text = block.trim();
          
          // Case A: Section heading like [INTRO], INTRO:, HOOK:, SCENE 1:
          const isHeader = /^(INTRO|OUTRO|HOOK|BODY|MAIN|CTA|SECTION|SCENE\s*\d+)/i.test(text) || (text.startsWith('[') && text.endsWith(']') && text.length < 30);
          
          if (isHeader) {
            return (
              <div key={i} style={{
                background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                color: '#fff', padding: '8px 16px', borderRadius: '8px',
                fontSize: '12px', fontWeight: 900, textTransform: 'uppercase',
                letterSpacing: '1.5px', display: 'inline-flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.2)', width: 'fit-content'
              }}>
                <Play size={12} fill="#fff" /> {cleanTextDisplay(text)}
              </div>
            );
          }
          
          // Case B: Visual cue like [Visual: Screen shows SASS dashboard]
          const isVisualCue = text.startsWith('[') && text.includes(']');
          
          if (isVisualCue) {
            return (
              <div key={i} style={{
                background: 'rgba(56, 189, 248, 0.05)', borderLeft: '4px solid #0ea5e9',
                borderRadius: '0 12px 12px 0', padding: '14px 18px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', gap: '12px', alignItems: 'flex-start'
              }}>
                <Camera size={16} style={{ color: '#0ea5e9', marginTop: '3px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#0ea5e9', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>Visual Scene Cue</div>
                  <div style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', lineHeight: '1.7' }}>
                    {cleanTextDisplay(text)}
                  </div>
                </div>
              </div>
            );
          }
          
          // Case C: Dialogue block like Host: "Hello everyone..."
          const speakerMatch = text.match(/^([^:\n]+):/);
          if (speakerMatch) {
            const speaker = speakerMatch[1];
            const dialogue = text.substring(speaker.length + 1).trim();
            return (
              <div key={i} style={{
                background: 'rgba(167, 139, 250, 0.05)', borderLeft: '4px solid #7c3aed',
                borderRadius: '0 12px 12px 0', padding: '14px 18px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', gap: '12px', alignItems: 'flex-start'
              }}>
                <MessageSquare size={16} style={{ color: '#a78bfa', marginTop: '3px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#a78bfa', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>{speaker}</div>
                  <div style={{ fontSize: '13.5px', color: '#fff', lineHeight: '1.7', fontWeight: 500 }}>
                    <RichMarkdownRenderer content={dialogue} presetOverrides={{ color: '#a78bfa', border: 'rgba(167,139,250,0.2)' }} />
                  </div>
                </div>
              </div>
            );
          }
          
          // Default block
          return (
            <div key={i} style={{ 
              fontSize: '13.5px', lineHeight: '1.8', color: 'rgba(255,255,255,0.9)', 
              background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', 
              padding: '14px 18px', borderRadius: '12px' 
            }}>
              <RichMarkdownRenderer content={text} presetOverrides={preset} />
            </div>
          );
        })}
      </div>
    );
  }

  // 10. 💰 Sales page / Landing page
  if (contentType === 'Sales page / Landing page') {
    return <LandingPageRenderer content={content} preset={preset} topic={topic} />;
  }

  // 11. 👤 Professional bio
  if (contentType === 'Professional bio') {
    const initials = preset.accentName.substring(0, 2).toUpperCase();
    return (
      <div style={{
        background: 'rgba(255,255,255,0.02)', border: `1.5px solid ${preset.border}`,
        borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
        boxShadow: `0 8px 24px ${preset.glow}`
      }}>
        {/* Business card header profile info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '54px', height: '54px', borderRadius: '50%', background: preset.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 900, color: '#fff', boxShadow: `0 0 12px ${preset.glow}`
          }}>{initials}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 800, fontSize: '16px', color: '#fff' }}>Professional Profile</span>
              <Award size={15} style={{ color: preset.color }} />
            </div>
            <div style={{ fontSize: '11px', color: preset.color, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: '2px' }}>
              Verified Subject Matter Expert
            </div>
          </div>
        </div>

        {/* Bio Text */}
        <div style={{ fontSize: '14px', lineHeight: '1.9', color: 'rgba(255,255,255,0.9)' }}>
          <RichMarkdownRenderer content={content} presetOverrides={preset} />
        </div>

        {/* Connect Action Badge */}
        <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px' }}>
          <button style={{
            flex: 1, background: preset.gradient, color: '#fff', border: 'none',
            borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 800,
            cursor: 'pointer', textAlign: 'center', boxShadow: `0 2px 10px ${preset.glow}`
          }}>Connect Directly</button>
          <button style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', borderRadius: '8px', padding: '8px 16px', fontSize: '12px',
            fontWeight: 800, cursor: 'pointer'
          }}>Save Vcard</button>
        </div>
      </div>
    );
  }

  // 12. 📄 Cover letter
  if (contentType === 'Cover letter') {
    return (
      <div style={{
        background: '#ffffff', color: '#1e293b', border: '1px solid #cbd5e1',
        borderRadius: '16px', padding: '36px 30px', fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)', maxWidth: '100%', boxSizing: 'border-box'
      }}>
        {/* Cover Letter paper mockup details */}
        <div style={{ fontSize: '10px', letterSpacing: '1px', fontWeight: 700, fontFamily: 'sans-serif', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
          <span>📄 HIGH-FIDELITY CANDIDATE CORRESPONDENCE</span>
          <span>DATE: {new Date().toLocaleDateString()}</span>
        </div>

        <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#334155', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <RichMarkdownRenderer 
            content={content} 
            presetOverrides={{ 
              color: '#475569', 
              border: '#cbd5e1' 
            }} 
            style={{ color: '#334155' }} 
          />
        </div>
        
        {/* Signature Box */}
        <div style={{ marginTop: '28px', borderTop: '2px solid #e2e8f0', paddingTop: '16px', fontSize: '11px', letterSpacing: '0.5px', fontWeight: 600, fontFamily: 'sans-serif', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
          <span>Formal Candidate Application</span>
          <span style={{ fontStyle: 'italic', color: '#64748b' }}>Verified Digital Signature</span>
        </div>
      </div>
    );
  }

  // 13. 📰 Press release
  if (contentType === 'Press release') {
    const blocks = content.split('\n\n').filter(b => b.trim());
    const h1 = blocks[0] || 'MAJOR BRAND BREAKTHROUGH';
    const bodyBlocks = blocks.slice(1);

    return (
      <div style={{
        background: 'rgba(255,255,255,0.01)', border: '1.5px solid rgba(255,255,255,0.06)',
        borderRadius: '16px', padding: '24px'
      }}>
        {/* Header */}
        <div style={{ borderBottom: '2px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ 
            fontSize: '11px', fontWeight: 800, background: 'rgba(239,68,68,0.15)', 
            color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', 
            padding: '3px 10px', borderRadius: '4px', display: 'inline-block', 
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' 
          }}>
            📰 For Immediate Release
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', lineHeight: '1.4', margin: 0 }}>
            {cleanTextDisplay(h1.replace(/^#\s*/, ''))}
          </h1>
        </div>

        {/* Dateline and media paragraphs */}
        <div style={{ fontSize: '13.5px', lineHeight: '1.8', color: 'rgba(255,255,255,0.9)' }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              blockquote: ({ node, ...props }) => (
                <blockquote style={{ 
                  borderLeft: `3px solid ${preset.color}`, paddingLeft: '16px', 
                  margin: '18px 0', color: 'rgba(255,255,255,0.75)', fontStyle: 'italic', 
                  background: 'rgba(255,255,255,0.01)', padding: '10px 16px', borderRadius: '0 8px 8px 0'
                }} {...props} />
              ),
              p: ({ node, ...props }) => <p style={{ marginBottom: '14px', lineHeight: '1.8' }} {...props} />,
              strong: ({ node, ...props }) => <strong style={{ color: preset.color, fontWeight: 700 }} {...props} />
            }}
          >
            {bodyBlocks.join('\n\n')}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  // 14. 📰 Newsletter
  if (contentType === 'Newsletter') {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.01)', border: `1.5px solid ${preset.border}`,
        borderRadius: '16px', overflow: 'hidden'
      }}>
        {/* Newsletter Header banner */}
        <div style={{ 
          background: preset.gradient, padding: '20px', textAlign: 'center', 
          boxShadow: `0 4px 15px ${preset.glow}` 
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>
            ⚡ The Weekly Synapse
          </h2>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px', display: 'block' }}>
            Exclusive Insights Delivered Direct
          </span>
        </div>

        {/* Newsletter Yellow Accent Headers */}
        <div style={{ padding: '20px' }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ node, ...props }) => (
                <div style={{ 
                  fontWeight: 800, color: '#fbbf24', fontSize: '15px', marginTop: '22px', 
                  marginBottom: '10px', paddingBottom: '6px', borderBottom: '1.5px solid rgba(251,191,36,0.2)',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <Sparkles size={13} style={{ color: '#fbbf24' }} /> <span {...props} />
                </div>
              ),
              p: ({ node, ...props }) => <p style={{ marginBottom: '12px', fontSize: '13.5px', lineHeight: '1.8', color: 'rgba(255,255,255,0.9)' }} {...props} />,
              strong: ({ node, ...props }) => <strong style={{ color: '#fbbf24', fontWeight: 700 }} {...props} />
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  // 15. 🔍 SEO meta tags
  if (contentType === 'SEO meta tags') {
    // Parse multiple options
    const optionsRaw = content.split(/--- OPTION \d+ ---|OPTION \d+:|Option \d+/i).filter(opt => opt.includes('Title:') || opt.includes('Description:'));
    
    let parsedOptions = [];
    if (optionsRaw.length > 0) {
      optionsRaw.forEach((opt, idx) => {
        const lines = opt.split('\n').filter(l => l.trim());
        let title = lines.find(l => l.toLowerCase().includes('title:')) || '';
        let desc = lines.find(l => l.toLowerCase().includes('description:')) || '';
        
        if (title || desc) {
          title = cleanTextDisplay(title.replace(/^title:?/i, ''));
          desc = cleanTextDisplay(desc.replace(/^description:?/i, '').replace(/^meta description:?/i, ''));
          parsedOptions.push({
            id: idx + 1,
            title: title || 'Perfect SEO Headline',
            description: desc || 'Meta description goes here with value.'
          });
        }
      });
    }
    
    // Fallback if splitting fails
    if (parsedOptions.length === 0) {
      const lines = content.split('\n').filter(l => l.trim());
      let title = lines.find(l => l.toLowerCase().includes('title:')) || lines[0] || 'Perfect SEO Headline';
      let desc = lines.find(l => l.toLowerCase().includes('description:')) || lines[1] || 'Meta description goes here with value.';
      
      title = cleanTextDisplay(title.replace(/^title:?/i, ''));
      desc = cleanTextDisplay(desc.replace(/^description:?/i, '').replace(/^meta description:?/i, ''));
      
      parsedOptions.push({
        id: 1,
        title,
        description: desc
      });
    }

    // Safely clamp the selected index
    const activeIdx = Math.max(0, Math.min(parsedOptions.length - 1, selectedSeoIdx || 0));
    const activeOption = parsedOptions[activeIdx] || parsedOptions[0];

    const titleLength = activeOption.title.length;
    const isTitleOptimal = titleLength >= 50 && titleLength <= 60;
    
    const descLength = activeOption.description.length;
    const isDescOptimal = descLength >= 120 && descLength <= 160;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Option Tabs Selector */}
        {parsedOptions.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '10px', width: 'fit-content' }}>
            {parsedOptions.map((opt, i) => {
              const isSelected = i === activeIdx;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedSeoIdx && setSelectedSeoIdx(i)}
                  style={{
                    background: isSelected ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
                    border: 'none',
                    color: isSelected ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                >
                  ✨ Option {opt.id}
                </button>
              );
            })}
          </div>
        )}

        {/* Live Google Search Mockup Card */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1.5px solid rgba(255,255,255,0.06)',
          borderRadius: '16px', padding: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
            🔍 Live Google Search SERP Simulator
          </div>
          
          <div style={{ background: '#1c1c2e', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '14px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              <Globe size={10} /> <span>https://yourwebsite.com/solutions</span>
            </div>
            <div style={{ 
              fontSize: '16px', color: '#60a5fa', fontWeight: 600, marginTop: '4px', 
              cursor: 'pointer', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
            }}>
              {activeOption.title}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '6px', lineHeight: '1.45' }}>
              {activeOption.description}
            </div>
          </div>
        </div>

        {/* Technical Detail Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Title tag details */}
          <div style={{
            background: 'rgba(255,255,255,0.01)', border: `1.5px solid ${isTitleOptimal ? '#22c55e' : '#fbbf24'}`,
            borderRadius: '12px', padding: '12px', position: 'relative'
          }}>
            <span style={{
              fontSize: '8px', fontWeight: 800, textTransform: 'uppercase',
              background: isTitleOptimal ? 'rgba(34,197,94,0.15)' : 'rgba(251,191,36,0.15)',
              color: isTitleOptimal ? '#22c55e' : '#fbbf24', padding: '2px 6px', borderRadius: '4px',
              position: 'absolute', top: '8px', right: '8px'
            }}>
              {isTitleOptimal ? 'OPTIMAL' : 'ADJUST'}
            </span>
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '6px' }}>Title Tag</div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '12.5px', wordBreak: 'break-word', lineHeight: '1.45' }}>{activeOption.title}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>{titleLength} characters (target: 50-60)</div>
          </div>

          {/* Meta Description details */}
          <div style={{
            background: 'rgba(255,255,255,0.01)', border: `1.5px solid ${isDescOptimal ? '#22c55e' : '#fbbf24'}`,
            borderRadius: '12px', padding: '12px', position: 'relative'
          }}>
            <span style={{
              fontSize: '8px', fontWeight: 800, textTransform: 'uppercase',
              background: isDescOptimal ? 'rgba(34,197,94,0.15)' : 'rgba(251,191,36,0.15)',
              color: isDescOptimal ? '#22c55e' : '#fbbf24', padding: '2px 6px', borderRadius: '4px',
              position: 'absolute', top: '8px', right: '8px'
            }}>
              {isDescOptimal ? 'OPTIMAL' : 'ADJUST'}
            </span>
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '6px' }}>Meta Description</div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '12.5px', wordBreak: 'break-word', lineHeight: '1.45' }}>{activeOption.description}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>{descLength} characters (target: 120-160)</div>
          </div>
        </div>
      </div>
    );
  }

  // 16. ✨ Tagline / Slogan
  if (contentType === 'Tagline / Slogan') {
    const lines = content.split('\n').filter(l => l.trim());
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {lines.map((line, i) => {
          // Unique random hash preset per line to make tags look beautifully diverse
          const linePreset = getDynamicAccent(line + i);
          
          return (
            <div key={i} style={{
              background: linePreset.bgLight, border: `1.5px solid ${linePreset.border}`,
              borderRadius: '16px', padding: '18px 24px', textAlign: 'center',
              boxShadow: `0 4px 15px ${linePreset.glow}`, position: 'relative', overflow: 'hidden'
            }}>
              <div style={{
                fontSize: '18px', fontWeight: 800, color: '#fff',
                letterSpacing: '0.5px', textShadow: `0 0 10px ${linePreset.glow}`
              }}>
                {cleanTextDisplay(line.replace(/^[-•\s\d]+/g, '').replace(/["']/g, ''))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 17. 🤝 Customer support reply
  if (contentType === 'Customer support reply') {
    return (
      <div style={{
        background: 'rgba(74,222,128,0.03)', border: '1.5px solid rgba(74,222,128,0.2)',
        borderRadius: '16px', overflow: 'hidden'
      }}>
        {/* Support Banner header */}
        <div style={{ 
          background: 'rgba(74,222,128,0.08)', padding: '12px 18px', 
          borderBottom: '1px solid rgba(74,222,128,0.15)', display: 'flex', 
          alignItems: 'center', justifyContent: 'space-between' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px' }}>🤝</span>
            <span style={{ fontWeight: 800, fontSize: '12px', color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Verified Support Agent Reply
            </span>
          </div>
          <span style={{ fontSize: '10px', color: '#4ade80', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(74,222,128,0.1)' }}>TICKET ASSIGNED</span>
        </div>

        {/* Content reply */}
        <div style={{ padding: '18px', fontSize: '13.5px', lineHeight: '1.8', color: 'rgba(255,255,255,0.9)' }}>
          <RichMarkdownRenderer content={content} presetOverrides={{ color: '#4ade80', border: 'rgba(74,222,128,0.2)' }} />
        </div>
      </div>
    );
  }

  // 18. 💻 Code documentation
  if (contentType === 'Code documentation') {
    return (
      <div style={{
        background: '#0b0f19', color: '#e2e8f0', border: '1px solid rgba(56,189,248,0.2)',
        borderRadius: '16px', overflow: 'hidden', boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {/* Editor header bar */}
        <div style={{ 
          background: '#070a12', padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
            </div>
            <span style={{ 
              fontSize: '11px', color: '#38bdf8', fontFamily: 'monospace', 
              fontWeight: 700, marginLeft: '8px', background: 'rgba(56,189,248,0.08)', padding: '2px 8px', borderRadius: '4px' 
            }}>
              📁 API_DOCUMENTATION.md
            </span>
          </div>
          <Terminal size={14} style={{ color: '#38bdf8' }} />
        </div>

        {/* Editor Body */}
        <div style={{ padding: '22px', fontSize: '13.5px', lineHeight: '1.8', textAlign: 'left' }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ node, ...props }) => <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8', marginTop: '20px', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '4px' }} {...props} />,
              h3: ({ node, ...props }) => <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: '#34d399', marginTop: '16px', marginBottom: '6px' }} {...props} />,
              p: ({ node, ...props }) => <p style={{ color: '#94a3b8', marginBottom: '12px' }} {...props} />,
              ul: ({ node, ...props }) => <ul style={{ listStyleType: 'circle', paddingLeft: '20px', marginBottom: '12px', color: '#cbd5e1' }} {...props} />,
              ol: ({ node, ...props }) => <ol style={{ listStyleType: 'decimal', paddingLeft: '20px', marginBottom: '12px', color: '#cbd5e1' }} {...props} />,
              li: ({ node, ...props }) => <li style={{ marginBottom: '4px', color: '#cbd5e1' }} {...props} />,
              strong: ({ node, ...props }) => <strong style={{ color: '#f472b6', fontWeight: 700 }} {...props} />,
              code: ({ node, inline, ...props }) => (
                inline 
                  ? <code style={{ fontFamily: 'monospace', fontSize: '12px', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', color: '#f472b6' }} {...props} />
                  : <pre style={{ background: '#05070c', padding: '14px', borderRadius: '8px', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.08)', margin: '12px 0' }}><code style={{ fontFamily: 'monospace', fontSize: '12.5px', color: '#34d399' }} {...props} /></pre>
              )
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  // Default: Plain text fallback
  return (
    <div style={{ fontSize: '14px', lineHeight: '1.9', color: 'rgba(255,255,255,0.9)', whiteSpace: 'pre-wrap' }}>
      <RichMarkdownRenderer content={content} presetOverrides={preset} />
    </div>
  );
};

const AIWriter = () => {
  const { activeModel, apiKey, providerKeys, customModels, showToast, saveToVault } = useContext(AppContext);

  const [appTheme, setAppTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'dark');

  useEffect(() => {
    // Initial sync
    setAppTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    
    // Watch for attribute changes on the html tag
    const observer = new MutationObserver(() => {
      setAppTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
    
    return () => observer.disconnect();
  }, []);

  const [type, setType] = useState('Blog post / Article');
  const [tone, setTone] = useState('Professional');
  const [lang, setLang] = useState('English');
  const [topic, setTopic] = useState('');
  const [length, setLength] = useState(50);
  const [audience, setAudience] = useState('');
  const [keywords, setKeywords] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [wordCount, setWordCount] = useState(0);

  const [humanizing, setHumanizing] = useState(false);
  const [humanized, setHumanized] = useState('');

  const [varLoading, setVarLoading] = useState(false);
  const [variants, setVariants] = useState([]);

  const [analyzeText, setAnalyzeText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [toneReport, setToneReport] = useState(null);

  const [activeTab, setActiveTab] = useState('main');
  const [selectedSeoIdx, setSelectedSeoIdx] = useState(0);
  const [generatedType, setGeneratedType] = useState('Blog post / Article');
  
  // Custom manual word length toggle
  const [customLengthEnabled, setCustomLengthEnabled] = useState(false);

  const hideTone = ['SEO meta tags', 'Tagline / Slogan', 'Code documentation'].includes(type);
  const hideKeywords = ['Professional bio', 'Cover letter', 'Customer support reply', 'Cold email', 'Tagline / Slogan'].includes(type);
  const hideAudience = ['SEO meta tags', 'Customer support reply', 'Cold email', 'Tagline / Slogan', 'Professional bio'].includes(type);
  const hideLength = ![
    'Blog post / Article',
    'YouTube script',
    'Sales page / Landing page',
    'Press release',
    'Newsletter',
    'Code documentation',
    'Video script'
  ].includes(type);

  const shouldShowLength = !hideLength || (customLengthEnabled && type !== 'SEO meta tags');

  const getTargetWords = (val) => {
    if (val < 25) return 100;
    if (val < 50) return 250;
    if (val < 75) return 500;
    return 1000;
  };

  const getLengthText = (val) => {
    if (val < 25) return 'Very Short (~100 words)';
    if (val < 50) return 'Short (~250 words)';
    if (val < 75) return 'Medium (~500 words)';
    return 'Long (~1000+ words)';
  };

  const contentType = CONTENT_TYPES.find(ct => ct.id === type) || CONTENT_TYPES[0];

  const handleGenerate = async () => {
    if (!topic.trim()) { showToast('Please describe your topic', 'warn'); return; }
    setLoading(true);
    setResult(''); setHumanized(''); setVariants([]); setToneReport(null); setWordCount(0);
    setSelectedSeoIdx(0);
    setActiveTab('main');

    let targetWords = getTargetWords(length);
    
    // Explicit overrides for the 13 content types where length slider is hidden
    const fixedWordCounts = {
      'LinkedIn post': 150,
      'Twitter/X thread': 220,
      'Instagram caption': 100,
      'Cold email': 120,
      'Product description': 150,
      'Ad copy (Facebook/Google)': 60,
      'Social media post': 120,
      'TikTok script': 80,
      'Professional bio': 80,
      'Cover letter': 250,
      'SEO meta tags': 150,
      'Tagline / Slogan': 50,
      'Customer support reply': 100
    };
    
    if (fixedWordCounts[type] !== undefined && (!customLengthEnabled || type === 'SEO meta tags')) {
      targetWords = fixedWordCounts[type];
    }
    
    const system = `You are an elite ${type} writer. You produce exceptionally high-quality content that people actually want to read, share, and act on.

CRITICAL RULES:
1. WORD COUNT: You MUST write EXACTLY ${targetWords} words (±10%). This is highly strict. Even if this content type (${type}) is usually shorter or longer, you must expand or contract your writing to meet EXACTLY ${targetWords} words. Do not ignore this! Count your words carefully.
2. RICH FORMATTING & STRUCTURE EXCEPTIONS:
   - For SEO meta tags: You MUST output exactly 4 diverse alternative options (Option 1 to 4) of Title Tags and Meta Descriptions. DO NOT write a full article. DO NOT write paragraphs of explanations. Use the exact format below, keeping values precise and separating each option clearly:
     
     Option 1:
     Title: [Title Here, 55-60 characters]
     Description: [Description Here, 140-150 characters]
     
     Option 2:
     Title: [Title Here, 55-60 characters]
     Description: [Description Here, 140-150 characters]
     
     Option 3:
     Title: [Title Here, 55-60 characters]
     Description: [Description Here, 140-150 characters]
     
     Option 4:
     Title: [Title Here, 55-60 characters]
     Description: [Description Here, 140-150 characters]
   - For Tagline / Slogan: Generate a clean numbered list of 10 distinct, memorable slogans or taglines. DO NOT include introductions or explanations. Just list them vertically.
   - For Ad copy (Facebook/Google): You MUST output ONLY the headline and the primary body text. Use the exact following format:
     Headline: [Headline Here, max 40 characters]
     Primary Text: [Primary Ad Copy text here, benefit-focused, max 125 characters, ending with a strong CTA]
   - For Cold emails: You MUST start the response with a 'Subject: [Subject Line Here]' line at the very top. Then double newline, then the salutation (e.g., 'Dear [Supervisor/Recipient],'). Do NOT use markdown headings (## or ###) or title headers inside the body content. Write them strictly as genuine, professional emails.
     
     CRITICAL SIGNATURE RULE: You MUST write the ending closing, thank you note, and signature block at the bottom on completely separate lines, using double newlines. NEVER merge them into a single line with commas. They must be formatted vertically, exactly like this:
     
     Thank you for your time and consideration.
     
     Sincerely,
     
     [Your Name]
     
     [Your Title / Role]
     
     [Your Contact Info]
   - For Cover letters and Customer support replies: Start with a standard salutation. Do NOT use markdown headings (## or ###). Ensure that the ending closing, thank you note, and signature block are on separate lines at the bottom separated by double newlines.
   - For YouTube script, TikTok script, and Video script: Do NOT write general paragraphs or article headings. Structure it as a genuine, professional script with Visual Scene Cues in brackets (e.g., '[Visual: Screen shows SASS metrics dashboard]') and Spoken Audio Dialogue blocks with speaker tags (e.g., 'Host: "Hey everyone, today we are going to..."). DO NOT write any letters, salutations, or signature sign-offs at the bottom.
   - For all other content types (including Sales page, Blog post, Product description, etc.): Use Markdown structure naturally (e.g. ## for headings, **bold** for key terms, *italics* for emphasis, and bullet lists). Add emojis and beautiful decoration. DO NOT write a letter or email. DO NOT include any salutations (like 'Dear...'), thank you closings, or signature sign-offs (like 'Sincerely, [Name]') at the bottom. Start directly with the main heading and end with content/CTA.
3. FORMAT: ${contentType.format}
4. LANGUAGE: ${lang}
5. TONE: ${tone}
6. NO AI CLICHÉS: Avoid "delve", "tapestry", "unleash", "game-changer", "robust", "leverage", "streamline", "it's worth noting"

Output ONLY the final content — no preamble, no explanations.`;

    let userPrompt = `Topic: ${topic}\n`;
    if (!hideTone) userPrompt += `Tone: ${tone}\n`;
    userPrompt += `Target word count: EXACTLY ${targetWords} words (STRICTLY ENFORCED. Expand or contract the content as necessary to meet this target. Do not use default/standard lengths!)\n`;
    if (audience) userPrompt += `Audience: ${audience}\n`;
    if (keywords && !hideKeywords) userPrompt += `Keywords to include naturally: ${keywords}\n`;
    
    // Custom instructions based on category to prevent signature leakage
    if (type === 'SEO meta tags') {
      userPrompt += `\nWrite the ${type} now. Remember: EXACTLY ${targetWords} words. You MUST generate exactly 4 distinct alternative options (Option 1 to 4), each with a Title (55-60 characters) and a Meta Description (140-150 characters). Format them exactly as:
      
Option 1:
Title: [compelling title tag, 55-60 chars]
Description: [benefit-driven description tag, 140-150 chars]

Option 2:
... (continue for Option 2, 3, and 4)`;
    } else if (type === 'Tagline / Slogan') {
      userPrompt += `\nWrite the ${type} now. Remember: EXACTLY ${targetWords} words. Generate exactly 10 short slogans (3-7 words each) as a clean list.`;
    } else if (['Cold email', 'Cover letter', 'Customer support reply'].includes(type)) {
      userPrompt += `\nWrite the ${type} now. Remember: EXACTLY ${targetWords} words. Enforce professional email/letter format (with salutations and a signature block). Ensure double newlines are used between paragraphs, closing notes, and each line of your signature sign-off.`;
    } else if (['YouTube script', 'TikTok script', 'Video script'].includes(type)) {
      userPrompt += `\nWrite the ${type} now. Remember: EXACTLY ${targetWords} words. Enforce clapperboard script format (with Visual: scene cues in brackets and spoken Audio: dialogue speaker tags). DO NOT write general article text. DO NOT include any letters, salutations, or signatures.`;
    } else {
      userPrompt += `\nWrite the ${type} now. Remember: EXACTLY ${targetWords} words. Enforce a premium, high-converting ${type} structure using natural markdown headers (##), benefit-focused bullet lists, and strong CTAs. DO NOT include any salutations (like 'Dear...'), thank you closings, or signature blocks (like 'Sincerely, [Name]') at the bottom. Start directly with the main heading and end with your main content/CTA.`;
    }

    try {
      let res = await callAI(system, userPrompt, null, activeModel, apiKey, providerKeys, customModels);
      let words = countWords(res);
      
      // Smart correction pass if word count deviates by more than 20%
      if (words > targetWords * 1.25 && type !== 'Tagline / Slogan' && type !== 'SEO meta tags') {
        showToast(`Draft is too long (${words} words). Condensing to match target ~${targetWords} words...`, 'info');
        const condenseSystem = `You are an elite copy editor. Condense the provided text to be closer to EXACTLY ${targetWords} words (current size is ${words} words). You MUST preserve all markdown headings (##), bold texts (**), bullet lists, and visual emojis. Do not truncate mid-sentence. Keep the writing style beautiful and engaging but completely remove redundant fluff. Output ONLY the final condensed content.`;
        res = await callAI(condenseSystem, `Text to condense:\n\n${res}`, null, activeModel, apiKey, providerKeys, customModels);
        words = countWords(res);
      } else if (words < targetWords * 0.75 && type !== 'Tagline / Slogan' && type !== 'SEO meta tags') {
        showToast(`Draft is too short (${words} words). Expanding to match target ~${targetWords} words...`, 'info');
        const expandSystem = `You are an elite copy writer. Expand the provided text to be closer to EXACTLY ${targetWords} words (current size is ${words} words). You MUST preserve all markdown headings (##), bold texts (**), bullet lists, and visual emojis. Add deep insights, highly value-driven points, details, and engaging context without changing the core message. Output ONLY the final expanded content.`;
        res = await callAI(expandSystem, `Text to expand:\n\n${res}`, null, activeModel, apiKey, providerKeys, customModels);
        words = countWords(res);
      }
      
      const formatted = stripMarkdown(res);
      setResult(formatted);
      setGeneratedType(type);
      setWordCount(words);
      saveToVault?.('AI Writer', `${type}: ${topic}`, formatted);
      
      if (Math.abs(words - targetWords) <= targetWords * 0.2) {
        showToast(`Perfect! Generated ${words} words`);
      } else {
        showToast(`Generated ${words} words (target: ${targetWords})`, 'warn');
      }
    } catch (e) {
      setResult('❌ Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHumanize = async () => {
    if (!result.trim()) return;
    setHumanizing(true); setHumanized(''); setActiveTab('humanized');

    const system = `You are an expert at making AI text sound completely human.
RULES:
- Remove ALL AI patterns: "delve", "tapestry", "it's worth noting", "in conclusion", "furthermore", "pivotal", "crucial", "vibrant", "unleash", "game-changer", "streamline", "robust", "leverage"
- Vary sentence length: mix short (5-8 words) with longer (15-20 words)
- Add natural imperfections: contractions, conversational phrases
- RETAIN & ENHANCE ORIGINAL STYLE: Keep the original markdown headings (##), bold text (**), lists, emojis, and layouts intact to keep the premium visual design.
- Keep exact same meaning and length
- Sound like a real human expert

Output ONLY the rewritten text.`;

    try {
      const res = await callAI(system, `Rewrite this to sound 100% human:\n\n${result}`, null, activeModel, apiKey, providerKeys, customModels);
      setHumanized(stripMarkdown(res));
    } catch (e) {
      setHumanized('❌ Error: ' + e.message);
    } finally {
      setHumanizing(false);
    }
  };

  const handleVariants = async () => {
    if (!result.trim()) return;
    setVarLoading(true); setVariants([]); setActiveTab('variants');

    const system = `You are a master copywriter. Create 2 completely different versions of the given content.
RULES:
- Version A and B must take DIFFERENT approaches
- Same core message, different angles
- RETAIN ORIGINAL FORMAT: Use appropriate markdown formatting (headings, bold, lists, emojis) to make each variant visually distinct and beautifully styled.
- Keep similar length to original

Respond in JSON:
{
  "variants": [
    {"label": "Version A - [angle]", "content": "full content here"},
    {"label": "Version B - [angle]", "content": "full content here"}
  ]
}`;

    try {
      const res = await callAI(system, `Create 2 different versions:\n\n${result}`, null, activeModel, apiKey, providerKeys, customModels);
      const parsed = extractJSON(res);
      let clean = [];
      if (parsed?.variants && Array.isArray(parsed.variants)) {
        clean = parsed.variants.map(v => ({
          label: v.label || 'Version',
          content: v.content || ''
        }));
      } else {
        // FALLBACK TEXT PARSER (Gives 100% guarantee that A/B variants work even with broken JSON!)
        const text = res.trim();
        const aIndex = text.search(/Version A|### Version A|## Version A/i);
        const bIndex = text.search(/Version B|### Version B|## Version B/i);
        
        if (aIndex !== -1 && bIndex !== -1) {
          let aContent = text.slice(aIndex, bIndex).replace(/^(?:Version A|### Version A|## Version A)[^\n]*/i, '').trim();
          let bContent = text.slice(bIndex).replace(/^(?:Version B|### Version B|## Version B)[^\n]*/i, '').trim();
          
          // Clean up brackets or trailing JSON elements
          aContent = aContent.replace(/^["'\s,:]+|["'\s,}]+$/g, '').trim();
          bContent = bContent.replace(/^["'\s,:]+|["'\s,}]+$/g, '').trim();
          
          clean = [
            { label: 'Version A', content: aContent },
            { label: 'Version B', content: bContent }
          ];
        } else {
          // If no structural cues, split in half as a last-resort safety measure
          const mid = Math.floor(text.length / 2);
          clean = [
            { label: 'Version A', content: text.slice(0, mid) },
            { label: 'Version B', content: text.slice(mid) }
          ];
        }
      }
      setVariants(clean);
    } catch (e) {
      showToast('Variant generation failed', 'error');
    } finally {
      setVarLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!analyzeText.trim()) { showToast('Paste text to analyze', 'warn'); return; }
    setAnalyzing(true); setToneReport(null); setActiveTab('analyzer');

    const system = `You are a writing analysis expert. Analyze the given text and respond in JSON:
{
  "primary_tone": "Professional",
  "formality_score": 75,
  "clarity_score": 82,
  "engagement_score": 68,
  "ai_probability": 85,
  "reading_level": "High School",
  "emotion": "Neutral",
  "improvement_tips": ["tip 1", "tip 2", "tip 3"],
  "best_suited_for": ["LinkedIn", "Blog posts"]
}
Scores are 0-100.`;

    try {
      const res = await callAI(system, `Analyze this text:\n\n${analyzeText}`, null, activeModel, apiKey, providerKeys, customModels);
      const parsed = extractJSON(res);
      if (parsed) {
        setToneReport({
          primary_tone: parsed.primary_tone || 'Unknown',
          formality_score: safeScore(parsed.formality_score),
          clarity_score: safeScore(parsed.clarity_score),
          engagement_score: safeScore(parsed.engagement_score),
          ai_probability: safeScore(parsed.ai_probability),
          reading_level: parsed.reading_level || 'Unknown',
          emotion: parsed.emotion || 'Unknown',
          improvement_tips: Array.isArray(parsed.improvement_tips) ? parsed.improvement_tips : [],
          best_suited_for: Array.isArray(parsed.best_suited_for) ? parsed.best_suited_for : [],
        });
      }
    } catch (e) {
      showToast('Analysis failed', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const cleanMarkdownForCopy = (text) => {
    if (!text) return '';
    let clean = text;
    // 1. Remove Markdown headers (e.g. ## Heading)
    clean = clean.replace(/#{1,6}\s+(.*)/g, '$1');
    // 2. Remove Markdown bold and italics (**bold**, *italic*, _italic_)
    clean = clean.replace(/\*\*(.*?)\*\*/g, '$1');
    clean = clean.replace(/\*(.*?)\*/g, '$1');
    clean = clean.replace(/_(.*?)_/g, '$1');
    // 3. Remove inline code backticks (`code`)
    clean = clean.replace(/`(.*?)`/g, '$1');
    // 4. Clean up blockquotes (e.g. > Quote)
    clean = clean.replace(/^\s*>\s*/gm, '');
    // 5. Aggressively strip any residual asterisks so they NEVER leak into copied text
    clean = clean.replace(/\*\*/g, '').replace(/\*/g, '');
    return clean.trim();
  };

  const convertMarkdownToHtml = (markdown, contentType) => {
    if (!markdown) return '';
    const preset = getDynamicAccent(markdown);
    let html = markdown.trim();
    
    // Compute dynamic theme index for Article/Blog styling
    let hash = 0;
    for (let i = 0; i < markdown.length; i++) {
      hash = markdown.charCodeAt(i) + ((hash << 5) - hash);
    }
    const themeIndex = Math.abs(hash) % 4;

    const activeTheme = appTheme || (typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : 'dark');
    const isLight = activeTheme === 'light';

    // Accent mappings for solid hex colors to guarantee rich styling in Google Docs & Blogger
    const getAccentStyles = (accentName) => {
      switch (accentName) {
        case 'cyan':
          return {
            bgLight: isLight ? '#f0f9ff' : '#061b2c',
            border: isLight ? '#bae6fd' : '#0c4a6e',
            color: '#38bdf8'
          };
        case 'emerald':
          return {
            bgLight: isLight ? '#f0fdf4' : '#042417',
            border: isLight ? '#d1fae5' : '#064e3b',
            color: '#34d399'
          };
        case 'pink':
          return {
            bgLight: isLight ? '#fdf2f8' : '#2c0b1e',
            border: isLight ? '#fbcfe8' : '#701a4f',
            color: '#f472b6'
          };
        case 'amber':
          return {
            bgLight: isLight ? '#fffbeb' : '#271804',
            border: isLight ? '#fef3c7' : '#78350f',
            color: '#fbbf24'
          };
        case 'indigo':
          return {
            bgLight: isLight ? '#eef2ff' : '#0f1035',
            border: isLight ? '#c7d2fe' : '#1e1b4b',
            color: '#818cf8'
          };
        case 'purple':
        default:
          return {
            bgLight: isLight ? '#f5f3ff' : '#170c2a',
            border: isLight ? '#e9d5ff' : '#3d1f6d',
            color: '#a78bfa'
          };
      }
    };

    const presetStyles = getAccentStyles(preset.accentName);
    const headColor = themeIndex === 3 
      ? (isLight ? '#b45309' : '#fbbf24') 
      : presetStyles.color;

    const textColor = themeIndex === 3
      ? (isLight ? '#334155' : '#e7e5e4')
      : (isLight ? '#333333' : '#e2e8f0');

    const headingFont = themeIndex === 3 ? 'Georgia, serif' : 'system-ui, -apple-system, sans-serif';
    const bodyFont = themeIndex === 3 ? 'Georgia, serif' : 'system-ui, -apple-system, sans-serif';

    // Escape HTML tags slightly but keep standard characters
    html = html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Replace Markdown headers
    html = html.replace(/^#{6}\s+(.*)$/gm, `<h6 style="color: ${isLight ? '#64748b' : '#94a3b8'}; font-family: ${headingFont}; font-size: 13px; margin: 12px 0 6px 0; font-weight: 700;">$1</h6>`);
    html = html.replace(/^#{5}\s+(.*)$/gm, `<h5 style="color: ${isLight ? '#475569' : '#cbd5e1'}; font-family: ${headingFont}; font-size: 14px; margin: 14px 0 6px 0; font-weight: 700;">$1</h5>`);
    html = html.replace(/^#{4}\s+(.*)$/gm, `<h4 style="color: ${isLight ? '#334155' : '#e2e8f0'}; font-family: ${headingFont}; font-size: 15px; margin: 16px 0 8px 0; font-weight: 700;">$1</h4>`);
    html = html.replace(/^#{3}\s+(.*)$/gm, `<h3 style="color: ${headColor}; font-family: ${headingFont}; font-size: 16px; font-weight: 700; margin-top: 18px; margin-bottom: 8px;">$1</h3>`);
    
    // Dynamic heading styles for H2 and H1
    if (themeIndex === 0) { // Editorial
      html = html.replace(/^#{2}\s+(.*)$/gm, `<h2 style="color: ${headColor}; font-family: ${headingFont}; font-size: 18px; font-weight: 800; margin-top: 22px; margin-bottom: 12px; border-left: 4px solid ${headColor}; padding-left: 10px; display: block;">$1</h2>`);
      html = html.replace(/^#{1}\s+(.*)$/gm, `<h1 style="color: ${headColor}; font-family: ${headingFont}; font-size: 22px; font-weight: 900; margin-top: 24px; margin-bottom: 14px; border-left: 5px solid ${headColor}; padding-left: 12px; display: block;">$1</h1>`);
    } else if (themeIndex === 1) { // Cyberpunk
      const cyberBg = isLight ? '#f0fbf9' : '#051610';
      const cyberBorder = isLight ? '#bfebe4' : '#0d4f3a';
      html = html.replace(/^#{2}\s+(.*)$/gm, `<h2 style="color: ${isLight ? '#0f766e' : '#34d399'}; font-family: monospace; font-size: 15px; font-weight: 700; margin-top: 20px; margin-bottom: 10px; background: ${cyberBg}; border: 1px solid ${cyberBorder}; padding: 6px 12px; border-radius: 8px; display: block;">$1</h2>`);
      html = html.replace(/^#{1}\s+(.*)$/gm, `<h1 style="color: ${isLight ? '#0f766e' : '#34d399'}; font-family: monospace; font-size: 18px; font-weight: 800; margin-top: 22px; margin-bottom: 12px; background: ${isLight ? '#e6f7f4' : '#08251b'}; border: 1.5px solid ${cyberBorder}; padding: 8px 14px; border-radius: 10px; display: block;">$1</h1>`);
    } else if (themeIndex === 2) { // Startup
      const textFill = isLight ? '#7c3aed' : '#a78bfa';
      html = html.replace(/^#{2}\s+(.*)$/gm, `<h2 style="font-family: ${headingFont}; font-size: 19px; font-weight: 900; margin-top: 22px; margin-bottom: 10px; color: ${textFill}; display: block;">$1</h2>`);
      html = html.replace(/^#{1}\s+(.*)$/gm, `<h1 style="font-family: ${headingFont}; font-size: 24px; font-weight: 900; margin-top: 24px; margin-bottom: 14px; color: ${textFill}; border-bottom: 2px solid ${isLight ? '#ddd6fe' : '#4c3a80'}; padding-bottom: 8px; display: block;">$1</h1>`);
    } else { // Classic Elegance
      html = html.replace(/^#{2}\s+(.*)$/gm, `<h2 style="color: ${headColor}; font-family: ${headingFont}; font-size: 19px; font-weight: 700; margin-top: 22px; margin-bottom: 10px; border-bottom: 1px solid ${isLight ? '#ebdcb9' : '#573003'}; padding-bottom: 4px; display: block;">$1</h2>`);
      html = html.replace(/^#{1}\s+(.*)$/gm, `<h1 style="color: ${headColor}; font-family: ${headingFont}; font-size: 24px; font-weight: 700; margin-top: 24px; margin-bottom: 14px; border-bottom: 2px solid ${headColor}; padding-bottom: 6px; text-align: center; display: block;">$1</h1>`);
    }

    // Replace Markdown bold & italic
    html = html.replace(/\*\*(.*?)\*\*/g, `<strong style="color: ${isLight ? '#0f172a' : headColor}; font-weight: 700;">$1</strong>`);
    html = html.replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>');
    html = html.replace(/_(.*?)_/g, '<em style="font-style: italic;">$1</em>');

    // Replace Blockquotes based on dynamic active themes
    if (themeIndex === 0) { // Editorial Quote
      const editBorder = isLight ? '#cbd5e1' : '#334155';
      html = html.replace(/^\s*&gt;\s+(.*)$/gm, `<div style="width: 100%; text-align: center; margin: 18px 0;"><table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; border-top: 1.5px solid ${editBorder}; border-bottom: 1.5px solid ${editBorder}; margin: 0 auto;"><tr><td style="padding: 14px 0; text-align: center; font-style: italic; font-size: 15px; color: ${textColor}; font-family: ${bodyFont};">$1</td></tr></table></div>`);
    } else if (themeIndex === 1) { // Cyberpunk Quote
      const quoteBg = isLight ? '#f1f5f9' : '#090d16';
      const quoteBorder = isLight ? '#0f766e' : '#34d399';
      html = html.replace(/^\s*&gt;\s+(.*)$/gm, `<div style="width: 100%; text-align: center; margin: 14px 0;"><table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; background-color: ${quoteBg}; border-left: 4px solid ${quoteBorder}; margin: 0 auto;"><tr><td style="padding: 12px 16px; font-style: italic; color: ${textColor}; font-family: Courier New, Courier, monospace; text-align: left;">$1</td></tr></table></div>`);
    } else if (themeIndex === 2) { // Startup Quote
      const quoteBg = isLight ? '#f5f3ff' : '#140e28';
      const quoteBorder = presetStyles.color;
      html = html.replace(/^\s*&gt;\s+(.*)$/gm, `<div style="width: 100%; text-align: center; margin: 16px 0;"><table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; background-color: ${quoteBg}; border-left: 4px solid ${quoteBorder}; margin: 0 auto;"><tr><td style="padding: 14px 18px; color: ${textColor}; font-style: italic; font-family: system-ui, sans-serif; text-align: left;">$1</td></tr></table></div>`);
    } else { // Classic Quote
      const quoteBg = isLight ? '#fafaf6' : '#23211f';
      const quoteBorder = isLight ? '#d97706' : '#fbbf24';
      html = html.replace(/^\s*&gt;\s+(.*)$/gm, `<div style="width: 100%; text-align: center; margin: 16px 0;"><table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; background-color: ${quoteBg}; border-left: 3px solid ${quoteBorder}; margin: 0 auto;"><tr><td style="padding: 14px 18px; font-family: Georgia, serif; font-style: italic; color: ${textColor}; text-align: left;">$1</td></tr></table></div>`);
    }

    // Replace Inline Code
    const codeBg = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)';
    const codeColor = isLight ? '#db2777' : '#f472b6';
    html = html.replace(/`(.*?)`/g, `<code style="font-family: monospace; font-size: 12px; background: ${codeBg}; padding: 2px 6px; border-radius: 4px; color: ${codeColor};">$1</code>`);

    // Parse list items with layout styles
    const lines = html.split('\n');
    let inList = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        let content = line.replace(/^[-*]\s+/, '');
        
        let bulletPrefix = '• ';
        if (contentType === 'Product description' || contentType === 'Sales page / Landing page' || themeIndex === 2) {
          bulletPrefix = '<span style="color: #22c55e; margin-right: 6px; font-weight: bold;">✓</span> ';
        } else if (contentType === 'Customer support reply') {
          bulletPrefix = `<span style="color: ${isLight ? '#10b981' : '#4ade80'}; margin-right: 6px; font-weight: bold;">✓</span> `;
        } else {
          bulletPrefix = `<span style="color: ${headColor}; margin-right: 6px;">•</span> `;
        }
        
        if (!inList) {
          lines[i] = `<ul style="margin: 0 0 14px 0; padding-left: ${themeIndex === 2 ? '0' : '20px'}; list-style: none; font-family: ${bodyFont};">\n<li style="margin-bottom: 6px; line-height: 1.7; color: ${textColor};">${bulletPrefix}${content}</li>`;
          inList = true;
        } else {
          lines[i] = `<li style="margin-bottom: 6px; line-height: 1.7; color: ${textColor};">${bulletPrefix}${content}</li>`;
        }
      } else {
        if (inList) {
          lines[i-1] = lines[i-1] + '\n</ul>';
          inList = false;
        }
        
        const trimmed = line.trim();
        if (trimmed !== '' && 
            !trimmed.startsWith('<h') && 
            !trimmed.startsWith('<blockquote') && 
            !trimmed.startsWith('<ul') && 
            !trimmed.startsWith('<li') &&
            !trimmed.startsWith('<div')) {
          lines[i] = `<p style="margin-bottom: 14px; line-height: 1.8; color: ${textColor}; font-family: ${bodyFont};">${line}</p>`;
        }
      }
    }
    if (inList) {
      lines[lines.length - 1] = lines[lines.length - 1] + '\n</ul>';
    }
    
    html = lines.join('\n');
    
    // Aggressively clean up residual asterisks before continuing HTML formatting
    html = html.replace(/\*\*/g, '').replace(/\*/g, '');
    
    // Apply Drop-Cap to the first paragraph in Theme 0 (Editorial)
    if (contentType === 'Blog post / Article' && themeIndex === 0) {
      const pMatch = html.match(/<p[^>]*>([^<]+)/);
      if (pMatch && pMatch[1]) {
        const fullText = pMatch[1];
        const firstChar = fullText.charAt(0);
        const rest = fullText.substring(1);
        const dropCapSpan = `<span style="float: left; font-size: 38px; font-weight: 900; line-height: 30px; padding-top: 4px; padding-right: 8px; padding-left: 3px; color: ${headColor}; font-family: Georgia, serif;">${firstChar}</span>`;
        html = html.replace(pMatch[0], pMatch[0].replace(fullText, dropCapSpan + rest));
      }
    }

    // Dynamic formatting based on content types
    if (contentType === 'Blog post / Article') {
      if (themeIndex === 0) { // Editorial
        const cardBg = isLight ? '#fafaf9' : '#0a0a0f';
        const cardBorder = isLight ? '#cbd5e1' : '#232329';
        return `<div class="rich-copy-wrapper" style="width: 100%; clear: both; margin: 0 auto; text-align: center;">
          <div style="background-color: ${cardBg}; border-left: 5px solid ${presetStyles.color}; border-top: 1px solid ${cardBorder}; border-right: 1px solid ${cardBorder}; border-bottom: 1px solid ${cardBorder}; border-radius: 4px; padding: 24px; font-family: ${bodyFont}; font-size: 14px; line-height: 1.85; color: ${textColor}; text-align: left; max-width: 650px; margin: 0 auto; display: inline-block; box-sizing: border-box; width: 100%;">
            <div style="border-bottom: 1.5px solid ${isLight ? '#cbd5e1' : '#232329'}; padding-bottom: 8px; margin-bottom: 16px; font-size: 10px; font-weight: 900; color: ${presetStyles.color}; letter-spacing: 1px; text-transform: uppercase; font-family: system-ui, sans-serif;">EDITORIAL INSIGHT</div>
            ${html}
          </div>
        </div>`;
      }
      if (themeIndex === 1) { // Cyberpunk
        const cardBg = isLight ? '#f8fafc' : '#05070c';
        const borderCol = isLight ? '#cbd5e1' : '#34d399';
        const codeRowBg = isLight ? '#0f172a' : '#0a0f1d';
        return `<div class="rich-copy-wrapper" style="width: 100%; clear: both; margin: 0 auto; text-align: center;">
          <div style="background-color: ${cardBg}; border: 1.5px solid ${borderCol}; border-radius: 8px; padding: 24px; font-family: Courier New, Courier, monospace; font-size: 13.5px; line-height: 1.8; color: ${textColor}; text-align: left; max-width: 650px; margin: 0 auto; display: inline-block; box-sizing: border-box; width: 100%;">
            <table cellpadding="0" cellspacing="0" style="background-color: ${codeRowBg}; border-radius: 6px; margin-bottom: 16px;">
              <tr>
                <td style="padding: 6px 12px; color: #10b981; font-weight: bold; font-size: 11px; font-family: Courier New, Courier, monospace;">CORE_ENGINE // STABLE</td>
              </tr>
            </table>
            ${html}
          </div>
        </div>`;
      }
      if (themeIndex === 2) { // Startup
        const cardBg = isLight ? '#ffffff' : '#0b0c16';
        const cardBorder = isLight ? '#cbd5e1' : '#4c3a80';
        return `<div class="rich-copy-wrapper" style="width: 100%; clear: both; margin: 0 auto; text-align: center;">
          <div style="background-color: ${cardBg}; border: 1.5px solid ${cardBorder}; border-radius: 16px; padding: 28px; font-family: ${bodyFont}; font-size: 14px; line-height: 1.8; color: ${textColor}; text-align: left; max-width: 650px; margin: 0 auto; display: inline-block; box-sizing: border-box; width: 100%;">
            <table cellpadding="0" cellspacing="0" style="background-color: ${presetStyles.bgLight}; border-radius: 20px; margin-bottom: 16px;">
              <tr>
                <td style="padding: 4px 10px; color: ${presetStyles.color}; font-size: 10px; font-weight: 800; text-transform: uppercase; font-family: system-ui, sans-serif;">🚀 CREATIVE STARTUP BLOG</td>
              </tr>
            </table>
            ${html}
          </div>
        </div>`;
      }
      if (themeIndex === 3) { // Classic
        const cardBg = isLight ? '#fdfdfb' : '#1a1816';
        const cardBorder = isLight ? '#ebdcb9' : '#573003';
        return `<div class="rich-copy-wrapper" style="width: 100%; clear: both; margin: 0 auto; text-align: center;">
          <div style="background-color: ${cardBg}; border: 1px solid ${cardBorder}; padding: 36px; font-family: Georgia, serif; font-size: 15.5px; line-height: 1.9; color: ${textColor}; text-align: left; max-width: 650px; margin: 0 auto; display: inline-block; box-sizing: border-box; width: 100%;">
            <div style="text-align: center; margin-bottom: 24px; font-family: Georgia, serif;">
              <span style="font-size: 10px; font-weight: 700; color: ${headColor}; text-transform: uppercase; letter-spacing: 2px;">Belles-Lettres Archive</span>
              <div style="margin: 8px 0 0 0; color: ${headColor}; font-size: 11px;">◆   ◆   ◆</div>
            </div>
            ${html}
          </div>
        </div>`;
      }
    }
    
    if (contentType === 'Cold email') {
      const emailLines = html.split('\n');
      const subjectIdx = emailLines.findIndex(l => l.toLowerCase().includes('subject:'));
      if (subjectIdx !== -1) {
        const rawSub = emailLines[subjectIdx];
        let cleanedSub = rawSub.replace(/<p style=".*?">/g, '').replace(/<\/p>/g, '').replace(/^subject line:?/i, '').replace(/^subject:?/i, '').trim();
        cleanedSub = cleanTextDisplay(cleanedSub);
        emailLines[subjectIdx] = `<table cellpadding="0" cellspacing="0" style="background-color: ${isLight ? '#f5f3ff' : '#170c2a'}; border: 1.5px solid ${isLight ? '#e9d5ff' : '#3d1f6d'}; border-radius: 10px; margin-bottom: 16px; width: 100%;">
          <tr>
            <td style="padding: 12px; font-weight: bold; font-size: 14px; color: ${isLight ? '#111' : '#fff'}; font-family: system-ui, sans-serif;">📧 Subject: ${cleanedSub}</td>
          </tr>
        </table>`;
      }
      return `<div class="rich-copy-wrapper" style="width: 100%; clear: both; margin: 0 auto; text-align: center;">
        <div style="background-color: ${isLight ? '#ffffff' : '#0f0f1c'}; border: 1px solid ${isLight ? '#cbd5e1' : '#232328'}; border-radius: 16px; padding: 24px; font-family: system-ui, -apple-system, sans-serif; font-size: 14px; line-height: 1.8; color: ${textColor}; text-align: left; max-width: 600px; margin: 0 auto; display: inline-block; box-sizing: border-box; width: 100%;">
          <div style="font-size: 9px; font-weight: bold; color: ${isLight ? '#94a3b8' : '#64748b'}; border-bottom: 1px solid ${isLight ? '#e2e8f0' : '#232328'}; padding-bottom: 8px; margin-bottom: 16px; letter-spacing: 1px; font-family: system-ui, sans-serif;">📧 EMAIL CORRESPONDENCE SANDBOX</div>
          ${html}
        </div>
      </div>`;
    }
    
    if (contentType === 'LinkedIn post') {
      const initials = preset.accentName.substring(0, 2).toUpperCase();
      const cardBg = isLight ? '#ffffff' : '#0f0f1c';
      const borderCol = isLight ? '#e2e8f0' : '#4c3a80';
      const mainNameCol = isLight ? '#000000' : '#ffffff';
      const subTextCol = isLight ? '#666' : '#94a3b8';
      const lineCol = isLight ? '#f3f4f6' : '#232328';
      return `<div class="rich-copy-wrapper" style="width: 100%; clear: both; margin: 0 auto; text-align: center;">
        <div style="background-color: ${cardBg}; border: 1px solid ${borderCol}; border-radius: 16px; padding: 20px; font-family: system-ui, -apple-system, sans-serif; font-size: 14px; line-height: 1.85; color: ${textColor}; text-align: left; max-width: 550px; margin: 0 auto; display: inline-block; box-sizing: border-box; width: 100%;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;">
            <tr>
              <td style="width: 42px; vertical-align: top; padding: 0;">
                <table cellpadding="0" cellspacing="0" style="width: 40px; height: 40px; border-radius: 50%; background-color: ${presetStyles.color};">
                  <tr>
                    <td style="text-align: center; vertical-align: middle; font-size: 14px; font-weight: 900; color: #fff; font-family: system-ui, sans-serif;">${initials}</td>
                  </tr>
                </table>
              </td>
              <td style="padding-left: 12px; vertical-align: top;">
                <div style="font-weight: 700; font-size: 14px; color: ${mainNameCol}; font-family: system-ui, sans-serif;">AI Content Architect <span style="background-color: #0a66c2; color: #fff; font-size: 8px; font-weight: 800; padding: 1px 4px; border-radius: 2px; margin-left: 4px;">IN</span></div>
                <div style="font-size: 11px; color: ${subTextCol}; margin-top: 1px; font-family: system-ui, sans-serif;">Executive Copywriter • Following</div>
                <div style="font-size: 10px; color: ${subTextCol}; margin-top: 1px; font-family: system-ui, sans-serif;">1h • Edited • 🌐</div>
              </td>
            </tr>
          </table>
          <div style="border-top: 1px solid ${lineCol}; padding-top: 12px; color: ${textColor}; font-family: system-ui, sans-serif;">
            ${html}
          </div>
        </div>
      </div>`;
    }
    
    if (contentType === 'Twitter/X thread') {
      let tweets = html.split(/<p[^>]*>\s*\d+\/|\[\d+\]|Tweet \d+:|\d+\./i).filter(t => t.trim());
      if (tweets.length <= 1) {
        tweets = html.split(/<\/p>\s*<p[^>]*>/).filter(t => t.trim());
      }
      
      const cardBg = isLight ? '#ffffff' : '#07090e';
      const borderCol = isLight ? '#e1e8ed' : '#0c4a6e';
      const mainNameCol = isLight ? '#0f1419' : '#ffffff';
      const handleCol = isLight ? '#5b7083' : '#8899a6';
      
      const tweetsHtml = tweets.map((tweet, i) => {
        let cleanTweet = tweet.replace(/<p[^>]*>/g, '').replace(/<\/p>/g, '').trim();
        if (cleanTweet.startsWith('ul') || cleanTweet.startsWith('&lt;ul')) return '';
        return `<table cellpadding="0" cellspacing="0" style="width: 100%; max-width: 550px; border-collapse: collapse; margin-bottom: 12px; margin-left: auto; margin-right: auto; text-align: left;">
          <tr>
            <td style="background-color: ${cardBg}; border: 1px solid ${borderCol}; border-radius: 16px; padding: 16px; font-family: system-ui, -apple-system, sans-serif; font-size: 14px; line-height: 1.6; color: ${textColor}; text-align: left; vertical-align: top;">
              <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 8px;">
                <tr>
                  <td style="width: 34px; padding: 0; vertical-align: middle;">
                    <table cellpadding="0" cellspacing="0" style="width: 32px; height: 32px; border-radius: 50%; background-color: #1d9bf0;">
                      <tr>
                        <td style="text-align: center; vertical-align: middle; font-size: 11px; font-weight: 900; color: #fff; font-family: system-ui, sans-serif;">X</td>
                      </tr>
                    </table>
                  </td>
                  <td style="padding-left: 10px; vertical-align: middle;">
                    <div style="font-weight: 700; font-size: 13.5px; color: ${mainNameCol}; font-family: system-ui, sans-serif;">Writer Core <span style="color: #1d9bf0;">✓</span></div>
                    <div style="font-size: 11.5px; color: ${handleCol}; margin-top: 1px; font-family: system-ui, sans-serif;">@promptforge · Tweet ${i + 1}</div>
                  </td>
                </tr>
              </table>
              <div style="color: ${textColor}; font-size: 14px; line-height: 1.6; font-family: system-ui, sans-serif;">
                ${cleanTweet}
              </div>
            </td>
          </tr>
        </table>`;
      }).filter(Boolean).join('\n');
      
      return `<div class="rich-copy-wrapper" style="width: 100%; clear: both; margin: 0 auto; text-align: center;">
        <div style="max-width: 550px; margin: 0 auto; text-align: left; display: inline-block; width: 100%;">${tweetsHtml}</div>
      </div>`;
    }
    
    if (['YouTube script', 'TikTok script', 'Video script'].includes(contentType)) {
      const rawBlocks = markdown.split('\n\n').filter(b => b.trim());
      const blocksHtml = rawBlocks.map((block, i) => {
        const text = block.trim();
        const isHeader = /^(INTRO|OUTRO|HOOK|BODY|MAIN|CTA|SECTION|SCENE\s*\d+)/i.test(text) || (text.startsWith('[') && text.endsWith(']') && text.length < 30);
        
        if (isHeader) {
          return `<div style="background: #d97706; color: #fff; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; display: inline-block; margin-bottom: 12px; font-family: system-ui, sans-serif; box-shadow: 0 4px 10px rgba(217, 119, 6, 0.15);">${cleanTextDisplay(text)}</div>`;
        }
        
        const isVisualCue = text.startsWith('[') && text.includes(']');
        if (isVisualCue) {
          const cueBg = isLight ? '#f0f9ff' : '#081d33';
          const cueText = isLight ? '#0369a1' : '#bae6fd';
          return `<div style="background: ${cueBg}; border-left: 4px solid #0ea5e9; border-radius: 0 8px 8px 0; padding: 12px 16px; margin-bottom: 12px; font-family: system-ui, sans-serif; color: ${cueText};">
            <div style="font-size: 9px; font-weight: bold; color: #0ea5e9; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">📹 VISUAL SCENE CUE</div>
            <div style="font-style: italic; font-size: 13.5px; line-height: 1.65;">${cleanTextDisplay(text)}</div>
          </div>`;
        }
        
        const speakerMatch = text.match(/^([^:\n]+):/);
        if (speakerMatch) {
          const speaker = speakerMatch[1];
          const dialogue = text.substring(speaker.length + 1).trim();
          const speakerBg = isLight ? '#f5f3ff' : '#140c2b';
          const speakerText = isLight ? '#1e1b4b' : '#e2e8f0';
          return `<div style="background: ${speakerBg}; border-left: 4px solid #7c3aed; border-radius: 0 8px 8px 0; padding: 12px 16px; margin-bottom: 12px; font-family: system-ui, sans-serif; color: ${speakerText};">
            <div style="font-size: 9px; font-weight: bold; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">🎙️ ${speaker}</div>
            <div style="font-size: 13.5px; line-height: 1.65; font-weight: 500;">${cleanTextDisplay(dialogue)}</div>
          </div>`;
        }
        
        const textBg = isLight ? '#f8fafc' : '#0d0d12';
        const textBorder = isLight ? '#e2e8f0' : '#232328';
        return `<div style="background: ${textBg}; border: 1px solid ${textBorder}; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; font-size: 13.5px; line-height: 1.7; color: ${textColor}; font-family: system-ui, sans-serif;">${cleanTextDisplay(text)}</div>`;
      }).join('\n');
      
      const scriptBg = isLight ? '#ffffff' : '#0a0a14';
      const scriptBorder = isLight ? '#e2e8f0' : '#232328';
      return `<div class="rich-copy-wrapper" style="width: 100%; clear: both; margin: 0 auto; text-align: center;">
        <div style="max-width: 600px; padding: 16px; border: 1px solid ${scriptBorder}; border-radius: 12px; background: ${scriptBg}; margin: 0 auto; text-align: left; display: inline-block; width: 100%;">
          <div style="font-size: 9px; font-weight: bold; color: #b45309; border-bottom: 1px solid ${isLight ? '#e2e8f0' : '#232328'}; padding-bottom: 8px; margin-bottom: 16px; letter-spacing: 1px; font-family: system-ui, sans-serif;">🎬 PRODUCTION SCREENPLAY SCRIPT</div>
          ${blocksHtml}
        </div>
      </div>`;
    }
    
    if (contentType === 'Cover letter') {
      const letterBg = isLight ? '#ffffff' : '#0b0f19';
      const letterBorder = isLight ? '#cbd5e1' : '#232328';
      const barCol = isLight ? '#e2e8f0' : '#232328';
      return `<div class="rich-copy-wrapper" style="width: 100%; clear: both; margin: 0 auto; text-align: center;">
        <div style="background: ${letterBg}; color: ${textColor}; border: 1px solid ${letterBorder}; border-radius: 16px; padding: 36px 30px; font-family: system-ui, -apple-system, sans-serif; max-width: 600px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); margin: 0 auto; text-align: left; display: inline-block; width: 100%;">
          <div style="font-size: 9px; letter-spacing: 1px; font-weight: 700; border-bottom: 2px solid ${barCol}; padding-bottom: 8px; margin-bottom: 24px; color: ${isLight ? '#94a3b8' : '#64748b'}; display: flex; justify-content: space-between;">
            <span>📄 HIGH-FIDELITY CANDIDATE CORRESPONDENCE</span>
            <span>DATE: ${new Date().toLocaleDateString()}</span>
          </div>
          <div style="font-size: 13.5px; line-height: 1.8; color: ${textColor}; text-align: left;">
            ${html}
          </div>
          <div style="margin-top: 28px; border-top: 2px solid ${barCol}; padding-top: 16px; font-size: 10px; font-weight: 600; color: ${isLight ? '#94a3b8' : '#64748b'}; display: flex; justify-content: space-between;">
            <span>Formal Candidate Application</span>
            <span style="font-style: italic; color: #64748b;">Verified Digital Signature</span>
          </div>
        </div>
      </div>`;
    }
    
    if (contentType === 'Code documentation') {
      const docBg = isLight ? '#f8fafc' : '#05070c';
      const docBorder = isLight ? '#e2e8f0' : '#232328';
      const docTitleLine = isLight ? '#e2e8f0' : '#232328';
      return `<div class="rich-copy-wrapper" style="width: 100%; clear: both; margin: 0 auto; text-align: center;">
        <div style="font-family: monospace; font-size: 13px; line-height: 1.8; color: ${textColor}; background: ${docBg}; border: 1px solid ${docBorder}; border-radius: 12px; padding: 24px; text-align: left; max-width: 650px; margin: 0 auto; display: inline-block; width: 100%;">
          <div style="font-size: 10px; font-weight: bold; color: ${isLight ? '#0284c7' : '#38bdf8'}; border-bottom: 1.5px solid ${docTitleLine}; padding-bottom: 8px; margin-bottom: 16px; letter-spacing: 0.5px;">📁 SOURCE_CODE_DOCUMENTATION.md</div>
          ${html}
        </div>
      </div>`;
    }

    const simpleBg = isLight ? '#ffffff' : '#0a0a0f';
    const simpleBorder = isLight ? '#e2e8f0' : '#232328';
    return `<div class="rich-copy-wrapper" style="width: 100%; clear: both; margin: 0 auto; text-align: center;">
      <div style="font-family: system-ui, sans-serif; font-size: 14px; line-height: 1.85; color: ${textColor}; max-width: 650px; text-align: left; padding: 20px; border: 1px solid ${simpleBorder}; border-radius: 12px; background: ${simpleBg}; margin: 0 auto; display: inline-block; width: 100%;">${html}</div>
    </div>`;
  };

  const copyText = (text) => {
    let plainText = cleanMarkdownForCopy(text);
    const activeType = generatedType || type;
    let htmlText = convertMarkdownToHtml(text, activeType);
    
    if (activeType === 'SEO meta tags') {
      const optionsRaw = text.split(/--- OPTION \d+ ---|OPTION \d+:|Option \d+/i).filter(opt => opt.includes('Title:') || opt.includes('Description:'));
      let parsedOptions = [];
      optionsRaw.forEach((opt, idx) => {
        const lines = opt.split('\n').filter(l => l.trim());
        let title = lines.find(l => l.toLowerCase().includes('title:')) || '';
        let desc = lines.find(l => l.toLowerCase().includes('description:')) || '';
        if (title || desc) {
          title = cleanTextDisplay(title.replace(/^title:?/i, ''));
          desc = cleanTextDisplay(desc.replace(/^description:?/i, '').replace(/^meta description:?/i, ''));
          parsedOptions.push({ id: idx + 1, title, description: desc });
        }
      });
      
      const activeIdx = Math.max(0, Math.min(parsedOptions.length - 1, selectedSeoIdx));
      const activeOption = parsedOptions[activeIdx];
      if (activeOption) {
        plainText = `Title: ${activeOption.title}\nDescription: ${activeOption.description}`;
        htmlText = `<div style="font-family: system-ui, sans-serif; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <p style="margin: 0 0 8px 0; color: #1e293b; font-size: 14px; font-family: system-ui, sans-serif;"><strong>Title:</strong> ${activeOption.title}</p>
          <p style="margin: 0; color: #1e293b; font-size: 14px; font-family: system-ui, sans-serif;"><strong>Description:</strong> ${activeOption.description}</p>
        </div>`;
      }
    }
    
    // Attempt 1: Modern Clipboard API with synchronous ClipboardItem creation (highly preferred by modern browsers inside click gestural actions)
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        const clipboardItem = new ClipboardItem({
          'text/html': new Blob([htmlText], { type: 'text/html' }),
          'text/plain': new Blob([plainText], { type: 'text/plain' })
        });
        
        navigator.clipboard.write([clipboardItem]).then(() => {
          showToast('Copied beautiful Rich Text!');
        }).catch(err => {
          console.warn('Modern Clipboard API failed, trying fallback...', err);
          fallbackCopyText(htmlText, plainText);
        });
        return; // Synchronously completed initial attempt, rest is promise-chain based
      } catch (err) {
        console.warn('Failed to build ClipboardItem, trying fallback...', err);
      }
    }
    
    // Fallback: Selection-based copy
    fallbackCopyText(htmlText, plainText);
  };

  const fallbackCopyText = (htmlText, plainText) => {
    let copySuccessful = false;
    
    try {
      const tempDiv = document.createElement('div');
      tempDiv.contentEditable = 'true';
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '10px';
      tempDiv.style.whiteSpace = 'pre-wrap';
      tempDiv.innerHTML = htmlText;
      document.body.appendChild(tempDiv);

      const range = document.createRange();
      range.selectNodeContents(tempDiv);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      const copyListener = (e) => {
        e.clipboardData.setData('text/html', htmlText);
        e.clipboardData.setData('text/plain', plainText);
        e.preventDefault();
      };

      document.addEventListener('copy', copyListener);
      copySuccessful = document.execCommand('copy');
      document.removeEventListener('copy', copyListener);

      selection.removeAllRanges();
      document.body.removeChild(tempDiv);
      
      if (copySuccessful) {
        showToast('Copied beautiful Rich Text!');
      }
    } catch (err) {
      console.warn('Selection-based rich text copy failed', err);
    }

    if (!copySuccessful) {
      try {
        navigator.clipboard.writeText(plainText).then(() => {
          showToast('Copied clean plain text!');
        }).catch(() => {
          showToast('Failed to copy', 'error');
        });
      } catch (e) {
        showToast('Failed to copy', 'error');
      }
    }
  };

  return (
    <div className="page active">
      <style dangerouslySetInnerHTML={{ __html: `
        /* Avoid Light Mode global overrides inside dark-theme-card */
        :root[data-theme="light"] .dark-theme-card {
          background: #0a0b10 !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35) !important;
        }
        :root[data-theme="light"] .dark-theme-card h1,
        :root[data-theme="light"] .dark-theme-card h2,
        :root[data-theme="light"] .dark-theme-card h3,
        :root[data-theme="light"] .dark-theme-card h4,
        :root[data-theme="light"] .dark-theme-card h5,
        :root[data-theme="light"] .dark-theme-card h6 {
          color: rgba(254, 254, 254, 0.99) !important;
        }
        :root[data-theme="light"] .dark-theme-card p,
        :root[data-theme="light"] .dark-theme-card li,
        :root[data-theme="light"] .dark-theme-card span,
        :root[data-theme="light"] .dark-theme-card div {
          color: rgba(254, 254, 254, 0.95) !important;
        }
        
        /* Cyberpunk specific heading override */
        :root[data-theme="light"] .dark-theme-card .cyberpunk-h2 {
          color: #34d399 !important;
          background: rgba(52, 211, 153, 0.05) !important;
          border: 1px solid rgba(52, 211, 153, 0.2) !important;
        }
        
        /* Startup specific heading override */
        :root[data-theme="light"] .dark-theme-card .startup-h2 {
          background: linear-gradient(135deg, #7c3aed, #a78bfa) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent !important;
        }
        
        /* Strong tag accent overrides in dark cards */
        :root[data-theme="light"] .dark-theme-card strong {
          color: #38bdf8 !important;
        }
        
        /* Specific elements inside cyberpunk card header */
        :root[data-theme="light"] .dark-theme-card .cyber-engine-text {
          color: #10b981 !important;
        }
        :root[data-theme="light"] .dark-theme-card .cyber-words-text {
          color: #94a3b8 !important;
        }
        
        /* Twitter specific element overrides */
        :root[data-theme="light"] .dark-theme-card .twitter-name {
          color: #ffffff !important;
        }
        :root[data-theme="light"] .dark-theme-card .twitter-handle {
          color: rgba(255, 255, 255, 0.5) !important;
        }
      ` }} />
      <div className="section-header">
        <h2 className="section-title">
          <Zap size={20} style={{ color: '#a78bfa', marginRight: 8, verticalAlign: 'middle' }} />
          AI Writer
        </h2>
        <div className="section-sub">
          Generate · Humanize · A/B Test · Analyze tone — all in one place.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { id: 'generate', icon: Zap, label: 'Generate' },
          { id: 'humanize', icon: Sparkles, label: 'Humanize' },
          { id: 'variants', icon: GitCompare, label: 'A/B Test' },
          { id: 'analyzer', icon: ScanText, label: 'Analyze Tone' },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = (tab.id === 'generate' && activeTab === 'main') ||
                          (tab.id === 'humanize' && activeTab === 'humanized') ||
                          (tab.id === 'variants' && activeTab === 'variants') ||
                          (tab.id === 'analyzer' && activeTab === 'analyzer');
          return (
            <button key={tab.id} onClick={() => {
              if (tab.id === 'generate') setActiveTab('main');
              else if (tab.id === 'humanize' && result) handleHumanize();
              else if (tab.id === 'variants' && result) handleVariants();
              else setActiveTab(tab.id);
            }} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s',
              background: isActive ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${isActive ? '#a78bfa' : 'rgba(255,255,255,0.1)'}`,
              color: isActive ? '#a78bfa' : 'rgba(255,255,255,0.6)',
            }}>
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {(activeTab === 'main' || activeTab === 'humanized' || activeTab === 'variants') && (
        <div className="tool-card" style={{ marginBottom: 16 }}>
          <div className="form-row cols3">
            <div class="form-group">
              <label className="form-label">Content Type</label>
              <select className="form-select" value={type} onChange={e => { setType(e.target.value); setCustomLengthEnabled(false); }}>
                {CONTENT_TYPES.map(ct => (
                  <option key={ct.id} value={ct.id}>{ct.label}</option>
                ))}
              </select>
            </div>
            {!hideTone && (
              <div className="form-group">
                <label className="form-label">Tone</label>
                <select className="form-select" value={tone} onChange={e => setTone(e.target.value)}>
                  {TONES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Output Language</label>
              <select className="form-select" value={lang} onChange={e => setLang(e.target.value)}>
                {LANGUAGES.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Describe Your Topic, Product, or Goal</label>
            <textarea
              className="form-textarea" rows="4"
              placeholder="e.g. I run a SaaS tool for project management. Write a LinkedIn post announcing our new AI feature..."
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
          </div>

          {/* Custom length toggle switcher for hidden sliders */}
          {type !== 'SEO meta tags' && hideLength && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '12px 16px', 
              background: 'rgba(124, 58, 237, 0.05)', 
              border: '1.5px solid rgba(124, 58, 237, 0.2)', 
              borderRadius: '12px', 
              marginBottom: '16px',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={14} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 700 }}>
                  Adjust content length manually?
                </span>
              </div>
              <button 
                onClick={() => setCustomLengthEnabled(!customLengthEnabled)}
                style={{
                  width: '44px', 
                  height: '22px', 
                  borderRadius: '11px',
                  background: customLengthEnabled ? 'var(--accent)' : 'rgba(124, 58, 237, 0.15)',
                  border: 'none', 
                  cursor: 'pointer', 
                  position: 'relative',
                  transition: 'all 0.2s', 
                  padding: 0, 
                  outline: 'none'
                }}
              >
                <div style={{
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%',
                  background: '#fff', 
                  position: 'absolute', 
                  top: '3px',
                  left: customLengthEnabled ? '25px' : '3px',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.25)'
                }} />
              </button>
            </div>
          )}

          {shouldShowLength && (
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">
                Length: <span style={{ color: '#a78bfa', fontWeight: 700 }}>{getLengthText(length)}</span>
              </label>
              <input type="range" min="0" max="100" value={length} onChange={e => setLength(+e.target.value)} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                <span>Very Short</span><span>Short</span><span>Medium</span><span>Long</span>
              </div>
            </div>
          )}

          <div className="form-row cols2">
            {!hideAudience && (
              <div className="form-group">
                <label className="form-label">Target Audience (Optional)</label>
                <input className="form-input" placeholder="e.g. startup founders, small biz owners..." value={audience} onChange={e => setAudience(e.target.value)} />
              </div>
            )}
            {!hideKeywords && (
              <div className="form-group">
                <label className="form-label">Keywords to Include (Optional)</label>
                <input className="form-input" placeholder="e.g. AI, productivity, remote work..." value={keywords} onChange={e => setKeywords(e.target.value)} />
              </div>
            )}
          </div>

          <button className="btn-generate" onClick={handleGenerate} disabled={loading}
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}>
            {loading ? <><Loader2 className="animate-spin" /> Generating...</> : <><Zap size={16} /> Generate Content</>}
          </button>
        </div>
      )}

      {activeTab === 'analyzer' && (
        <div className="tool-card" style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Paste Text to Analyze</label>
            <textarea
              className="form-textarea" rows="6"
              placeholder="Paste any text here to analyze its tone, clarity, engagement, and AI probability..."
              value={analyzeText}
              onChange={e => setAnalyzeText(e.target.value)}
            />
          </div>
          <button className="btn-generate" onClick={handleAnalyze} disabled={analyzing}
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #60a5fa)' }}>
            {analyzing ? <><Loader2 className="animate-spin" /> Analyzing...</> : <><ScanText size={16} /> Analyze Tone</>}
          </button>
        </div>
      )}

      {loading && (
        <div className="tool-card" style={{ textAlign: 'center', padding: '28px 20px' }}>
          <div className="loading-shimmer" style={{ width: '80%', margin: '0 auto 10px' }} />
          <div className="loading-shimmer" style={{ width: '60%', margin: '0 auto 10px' }} />
          <div className="loading-shimmer" style={{ width: '70%', margin: '0 auto' }} />
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 12 }}>
            Crafting your content... (enforcing {getTargetWords(length)} words)
          </p>
        </div>
      )}

      {result && activeTab === 'main' && !loading && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="output-box">
            <div className="output-header">
              <div>
                <span className="output-label">Generated Content</span>
                {wordCount > 0 && (
                  <span style={{ marginLeft: 10, fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(167,139,250,0.15)', color: '#a78bfa', fontWeight: 700 }}>
                    {wordCount} words
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-copy" onClick={() => { downloadText(cleanMarkdownForCopy(result), `${generatedType || type}.txt`); showToast('Downloaded!'); }}>
                  <Download size={13} /> Download
                </button>
                <button className="btn-copy" onClick={() => copyText(result)}>
                  <Copy size={13} /> Copy
                </button>
              </div>
            </div>
            {renderFormattedContent(result, generatedType || type, selectedSeoIdx, setSelectedSeoIdx, topic, appTheme)}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button onClick={handleHumanize} disabled={humanizing} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: humanizing ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
              color: '#fbbf24',
            }}>
              {humanizing ? <><Loader2 size={13} className="animate-spin" /> Humanizing...</> : <><Sparkles size={13} /> Humanize This</>}
            </button>
            <button onClick={handleVariants} disabled={varLoading} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: varLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)',
              color: '#60a5fa',
            }}>
              {varLoading ? <><Loader2 size={13} className="animate-spin" /> Creating...</> : <><GitCompare size={13} /> Generate A/B Variants</>}
            </button>
          </div>
        </motion.div>
      )}

      {humanized && activeTab === 'humanized' && !humanizing && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="output-box">
            <div className="output-header">
              <span className="output-label">✨ Humanized Version</span>
              <button className="btn-copy" onClick={() => copyText(humanized)}>
                <Copy size={13} /> Copy
              </button>
            </div>
            {renderFormattedContent(humanized, generatedType || type, selectedSeoIdx, setSelectedSeoIdx, topic, appTheme)}
          </div>
        </motion.div>
      )}

      {variants.length > 0 && activeTab === 'variants' && !varLoading && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {variants.map((v, i) => (
            <div key={i} className="output-box" style={{ marginBottom: 12 }}>
              <div className="output-header">
                <span className="output-label">{v.label}</span>
                <button className="btn-copy" onClick={() => copyText(v.content)}>
                  <Copy size={13} /> Copy
                </button>
              </div>
              {renderFormattedContent(v.content, generatedType || type, selectedSeoIdx, setSelectedSeoIdx, topic, appTheme)}
            </div>
          ))}
        </motion.div>
      )}

      {toneReport && activeTab === 'analyzer' && !analyzing && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'AI Probability', value: `${toneReport.ai_probability}%`, color: toneReport.ai_probability > 70 ? '#f87171' : toneReport.ai_probability > 40 ? '#fbbf24' : '#4ade80' },
              { label: 'Formality', value: `${toneReport.formality_score}%`, color: '#a78bfa' },
              { label: 'Clarity', value: `${toneReport.clarity_score}%`, color: '#60a5fa' },
              { label: 'Engagement', value: `${toneReport.engagement_score}%`, color: '#4ade80' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Tone</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{toneReport.primary_tone}</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Reading Level</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{toneReport.reading_level}</div>
            </div>
          </div>

          {toneReport.improvement_tips?.length > 0 && (
            <div style={{ padding: '14px 16px', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', marginBottom: 8 }}>💡 Improvement Tips</div>
              {toneReport.improvement_tips.map((tip, i) => (
                <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', padding: '4px 0', display: 'flex', gap: 8 }}>
                  <span>•</span><span>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Interactive Rich Paste Sandbox */}
      {(result || humanized || variants.length > 0) && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: '24px', width: '100%', boxSizing: 'border-box' }}
        >
          <div className="output-box" style={{ 
            padding: '24px', 
            border: '2.5px dashed var(--accent)', 
            background: 'rgba(167, 139, 250, 0.03)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(167, 139, 250, 0.05)',
            width: '100%',
            boxSizing: 'border-box',
            marginTop: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '18px' }}>📋</span>
              <span style={{ fontWeight: 800, fontSize: '14.5px', color: 'var(--text)' }}>Clipboard Rich Paste Sandbox</span>
              <span style={{
                fontSize: '9px',
                fontWeight: 900,
                color: '#fff',
                background: 'var(--accent)',
                padding: '2px 8px',
                borderRadius: '20px',
                textTransform: 'uppercase',
                marginLeft: 'auto'
              }}>Verify Real-Time Styling</span>
            </div>
            
            <p style={{ fontSize: '12.5px', color: 'var(--text-sub)', marginBottom: '16px', lineHeight: '1.5' }}>
              <strong>Immediate Local Test:</strong> Press <strong>Ctrl+V</strong> inside the container below. If it pastes with beautiful custom backgrounds, border grids, fonts, and drop-caps, it will paste exactly the same in <strong>Google Docs, Notion, MS Word, and WordPress!</strong>
            </p>
            
            <div
              contentEditable="true"
              placeholder="Click here and press Ctrl+V to verify styling..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                minHeight: '200px',
                maxHeight: '600px',
                overflowY: 'auto',
                background: 'var(--bg)',
                border: '1.5px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
                color: 'var(--text)',
                fontSize: '13.5px',
                outline: 'none',
                transition: 'all 0.2s',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent)';
                e.target.style.boxShadow = '0 0 0 3px rgba(167, 139, 250, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AIWriter;