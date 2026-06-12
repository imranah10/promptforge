import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, ArrowRight, ChevronRight, ChevronLeft, Zap, Database, 
  Image as ImageIcon, Code, ArrowUpRight, CheckCircle2, 
  Search, Brain, Lightbulb, Globe, Menu, X, Wand2, Layers, MessageSquare, Play, Video as VideoIcon, HelpCircle, Shield, Cpu, RefreshCw, Star, ArrowDown, Copy, Terminal, Share2, Briefcase, Mail
} from 'lucide-react';
import Lenis from 'lenis';
import ExplodingObjects from '../components/landing/ExplodingObjects';
import WhiteLabelModal from '../components/WhiteLabelModal';
import { AppContext } from '../context/AppContext';
import './LandingPage.css';

// --- ADVANCED UI SYSTEM COMPONENTS ---

const CursorFollower = () => {
  const followerRef = useRef(null);

  useEffect(() => {
    const moveFollower = (e) => {
      if (followerRef.current) {
        followerRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };
    window.addEventListener('mousemove', moveFollower);
    return () => window.removeEventListener('mousemove', moveFollower);
  }, []);

  return <div ref={followerRef} className="cursor-follower" />;
};

const MagneticButton = ({ children, className, onClick, style }) => {
  const ref = useRef(null);
  const x = useSpring(0, { stiffness: 120, damping: 15 });
  const y = useSpring(0, { stiffness: 120, damping: 15 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    x.set((clientX - centerX) * 0.35);
    y.set((clientY - centerY) * 0.35);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ ...style, x, y, position: 'relative' }}
    >
      {children}
    </motion.div>
  );
};

const BackgroundParticles = () => {
  return (
    <div className="particles-container" style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * window.innerWidth, 
            y: Math.random() * window.innerHeight,
            opacity: Math.random() * 0.5 
          }}
          animate={{
            y: [null, Math.random() * -150, Math.random() * 150],
            x: [null, Math.random() * -80, Math.random() * 80],
            opacity: [0.1, 0.5, 0.1]
          }}
          transition={{ duration: 12 + Math.random() * 15, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute',
            width: '2.5px',
            height: '2.5px',
            background: 'rgba(124, 92, 252, 0.7)',
            borderRadius: '50%',
            filter: 'blur(0.5px)'
          }}
        />
      ))}
    </div>
  );
};

const ShaderLine = () => (
  <div className="shader-line" />
);

const CircleAnimator = () => (
  <div className="circle-animator-wrap">
    <div className="circle-ring ring-1"></div>
    <div className="circle-ring ring-2"></div>
    <div className="circle-ring ring-3"></div>
    <div className="circle-ring ring-4"></div>
  </div>
);

// --- DYNAMIC DIMENSIONAL PARALLAX GLIDE (NEW INVENTED EFFECT) ---
// Seamlessly fuses 3D Mouse Hover Tilt + Scroll-linked Parallax Storytelling layers.
const DimensionalParallaxGlide = () => {
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const yBg = useTransform(scrollYProgress, [0, 1], [-140, 140]);
  const yMid = useTransform(scrollYProgress, [0, 1], [-60, 60]);
  const yFore = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const rotateBg = useTransform(scrollYProgress, [0, 1], [-5, 5]);

  const tiltX = useSpring(0, { stiffness: 180, damping: 25 });
  const tiltY = useSpring(0, { stiffness: 180, damping: 25 });
  
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    
    tiltX.set((mouseY / (height / 2)) * -14);
    tiltY.set((mouseX / (width / 2)) * 14);
  };

  const handleMouseLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  return (
    <div 
      ref={containerRef}
      className="dpg-section-wrap"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="dpg-perspective-box">
        <motion.div 
          className="dpg-scene"
          style={{ 
            rotateX: tiltX,
            rotateY: tiltY,
            transformStyle: "preserve-3d"
          }}
        >
          {/* Background Layer: grid matrix decoration */}
          <motion.div 
            className="dpg-layer dpg-layer-bg"
            style={{ y: yBg, rotate: rotateBg, transformStyle: "preserve-3d", translateZ: -180 }}
          >
            <div className="dpg-tech-grid-art" />
          </motion.div>

          {/* Midground Layer: Glassmorphic high-clarity workbench screenshot */}
          <motion.div 
            className="dpg-layer dpg-layer-mid"
            style={{ y: yMid, transformStyle: "preserve-3d", translateZ: 60 }}
          >
            <div className="dpg-glass-panel">
              <div className="dpg-glass-shine" />
              <img src="/promptforge_nexus_core.png" alt="PromptForge Workbench Core" className="dpg-clear-img" />
              <div className="dpg-floating-tag">PROMPTFORGE CORE WORKBENCH ACTIVE</div>
            </div>
          </motion.div>

          {/* Foreground Layer: Elegant premium storytelling card */}
          <motion.div 
            className="dpg-layer dpg-layer-fore"
            style={{ y: yFore, transformStyle: "preserve-3d", translateZ: 180 }}
          >
            <div className="dpg-narrative-card">
              <span className="tag-premium" style={{ borderColor: 'var(--lp-cyan)', color: '#fff', background: 'rgba(6, 182, 212, 0.08)' }}>
                ⚡ SECURE DECOUPLED OPERATIONS
              </span>
              <h3 style={{ fontSize: '26px', fontWeight: 800, color: 'white', margin: '20px 0 12px', letterSpacing: '-0.03em', fontFamily: 'var(--lp-font)' }}>
                All-in-One AI Studio
              </h3>
              <p style={{ color: 'var(--lp-text-muted)', fontSize: '14px', lineHeight: 1.6, margin: 0, fontFamily: 'var(--lp-font)' }}>
                PromptForge is engineered to give you absolute control over your AI operations. By combining a beautiful client-side workspace with direct BYOK routing, you can run prompts, analyze complex datasets, optimize instructions, and construct secure code in parallel. Since everything executes locally in your browser sandbox, your keys and data never touch third-party servers. It is the ultimate workspace for builders, developers, and creators who value privacy, speed, and cost efficiency.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

// --- QUANTUM ARENA INVENTED COMBINED ANIMATION ---
// Integrates 3D Deck Spread, Interactive Spring Shuffle, Fullscreen Exploding Blueprints, SVG Shader Line mesh paths, concentric Circle Hover Animators, and clipboard prompt copying.

const QuantumArena = () => {
  const navigate = useNavigate();
  const { showToast } = useContext(AppContext);
  const [explodedCard, setExplodedCard] = useState(null);
  const [activeNode, setActiveNode] = useState(0);
  
  const [cards, setCards] = useState([
    {
      id: 0,
      title: "Chat With Data — PDF & File Intelligence",
      desc: "Upload up to 50 pages of local PDF reports, scrape websites with Tesseract.js OCR, and explore structural visual links inside a custom SVG Knowledge mesh.",
      badge: "Chat With Data",
      color: "#06b6d4",
      img: "/local_vector_nexus.png",
      testPrompt: "Analyze the 'Year-over-Year revenue trends' from my uploaded local PDFs and plot them inside a Recharts Area map.",
      nodes: [
        { label: "Local Vector Indexer", desc: "Instantly tokenizes up to 50 pages of raw PDFs entirely within browser client sandbox memory." },
        { label: "Tesseract OCR Engine", desc: "Decodes scanned screenshots or low-res images in a secondary thread with high-speed recognition." },
        { label: "Knowledge Mapping Mesh", desc: "Assembles interactive SVG diagrams linking parsed data concepts automatically." },
        { label: "Recharts Render Center", desc: "Synthesizes real-time client-side interactive Area, Pie, Bar, and Line charts." }
      ]
    },
    {
      id: 1,
      title: "Senior Software Vulnerability Scanner",
      desc: "Analyze source code in 18 common languages, locate exact line numbers of critical security vulnerabilities, and generate verified drop-in refactored boilerplate segments.",
      badge: "Code Helper",
      color: "#10b981",
      img: "/promptforge_nexus_core.png",
      testPrompt: "Audit this React hook code for memory leaks, highlight severe lines, and compile conventional commit messages.",
      nodes: [
        { label: "Syntax Parser", desc: "Checks imports, scope parameters, and potential key leaks across 18 backend/frontend dialects." },
        { label: "Vulnerability Matrices", desc: "Highlights exact lines matching severe vulnerabilities from Critical down to low warning categories." },
        { label: "Drop-in Secure Replacements", desc: "Compiles secure clean code patches ready to be inserted directly into your local codebase." },
        { label: "Conventional Commit Logs", desc: "Evaluates the diff and drafts structured, conventional specification commit logs." }
      ]
    },
    {
      id: 2,
      title: "Specialized Multi-Agent Debate Council",
      desc: "Convene 4 unique expert personas (The Visionary, Hacker, Analyst, Critic) inside live bubbles. Watch them critique ideas, resolve flaws, and export unified 30-60-90 day Master plans.",
      badge: "The Inventor",
      color: "#7c5cfc",
      img: "/neural_agent_synapse.png",
      testPrompt: "Convene a debate on 'Zero-emission urban shipping fleet using hovercrafts'. Let the Analyst audit feasibility, Critic verify risks.",
      nodes: [
        { label: "Visionary & Hacker Persona", desc: "Synthesizes exponential technological fusions and raw engineering architectural paths." },
        { label: "Critic & Analyst Filters", desc: "Detects structural failures, edge cases, financial viability limits, and operational risks." },
        { label: "Staggered Debate Bubble Logs", desc: "Simulates conversational debates dynamically inside visual scrolling bubbles." },
        { label: "Master Plan Exporter", desc: "Assembles complete 30-60-90 day implementation blueprints straight into your history Vault." }
      ]
    },
    {
      id: 3,
      title: "Decentralized Security Vault Console",
      desc: "Add your private provider keys (OpenAI, Anthropic, Gemini, DeepSeek), store them safely under browser-native AES encryption, and route all queries directly without mid-tier markup.",
      badge: "Key Security",
      color: "#f43f5e",
      img: "/private_key_vault_core.png",
      testPrompt: "Inject encrypted keys into browser localStorage and run side-by-side LLM comparisons with independent AI Judge verification.",
      nodes: [
        { label: "Local Vault Encryption", desc: "Secures API keys locally inside the browser using secure local storage configurations." },
        { label: "BYOK Router Interface", desc: "Executes direct HTTPS queries to LLM providers. Zero data scraping, zero logging traces." },
        { label: "AI Judge Compare Center", desc: "Tests prompts side-by-side with Promise.allSettled and evaluates outputs with comparative judgements." },
        { label: "IndexedDB History Tracker", desc: "Tracks active workspace prompts, parameters, and generated copies entirely on your device." }
      ]
    }
  ]);

  const shuffleDeck = (e) => {
    e.stopPropagation();
    setCards([...cards].sort(() => Math.random() - 0.5));
    if (showToast) {
      showToast("3D Stack reshuffled with active spring physics!", "info");
    }
  };

  const handleCopyPrompt = (promptText) => {
    navigator.clipboard.writeText(promptText);
    if (showToast) {
      showToast("Try-out prompt copied to clipboard!", "success");
    }
  };

  return (
    <div className="quantum-arena-wrap">
      <div className="section-header">
        <span className="tag-premium">INVENTED QUANTUM ARENA ARCHITECTURE</span>
        <h2>
          Interactive <span style={{ color: 'var(--lp-accent)' }}>Exploding Blueprints</span>
        </h2>
        <p>
          Hover the deck below to <strong style={{ color: 'var(--lp-cyan)', fontWeight: 700 }}>spread</strong> cards in 3D space. Click <strong style={{ color: 'var(--lp-cyan)', fontWeight: 700 }}>shuffle</strong> to trigger active spring mechanics. <strong style={{ color: 'var(--lp-accent)', fontWeight: 700 }}>Click any card</strong> to explode it into an interactive SVG Neural Node Mesh.
        </p>
      </div>

      {/* Interactive Zone wrapping stack and button */}
      <div className="quantum-interactive-zone">
        <div className="quantum-stack-wrap">
          {cards.map((card, idx) => (
            <motion.div
              key={card.id}
              layout
              className={`quantum-card qcard-${idx}`}
              onClick={() => {
                setExplodedCard(card);
                setActiveNode(0);
              }}
              whileHover={{ scale: 1.05, y: -20, rotate: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 18 }}
            >
              {/* Background image panel with full saturated visibility */}
              <div 
                className="quantum-card-bg"
                style={{ backgroundImage: `url(${card.img})` }}
              />

              <div className="quantum-card-inner">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="tag-premium" style={{ borderColor: card.color, color: '#fff', background: `${card.color}2c`, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{card.badge}</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 800 }}>0{card.id + 1}</span>
                </div>

                {/* Local glassmorphic panel protecting text legibility over beautiful background images */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(4, 4, 10, 0.94) 0%, rgba(1, 1, 3, 0.98) 100%)',
                  backdropFilter: 'blur(20px) saturate(1.2)',
                  WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '24px',
                  padding: '24px 22px',
                  margin: '22px 0 16px 0',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.65)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: 700, 
                    color: '#ffffff', 
                    margin: '0 0 10px 0', 
                    fontFamily: 'var(--lp-font)', 
                    letterSpacing: '-0.015em', 
                    lineHeight: 1.3,
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    textRendering: 'optimizeLegibility'
                  }}>
                    {card.title}
                  </h3>
                  
                  <p style={{ 
                    fontSize: '13px', 
                    color: '#cbd5e1', 
                    lineHeight: 1.65, 
                    margin: 0, 
                    fontWeight: 400,
                    letterSpacing: '0.01em',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    textRendering: 'optimizeLegibility'
                  }}>
                    {card.desc}
                  </p>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: card.color
                  }}>
                    <Zap size={14} />
                  </div>
                  <span style={{ fontSize: '11px', color: card.color, fontWeight: 800, letterSpacing: '2px', fontFamily: 'Space Grotesk' }}>EXPLODE SYSTEM BLUEPRINT →</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '-35px', marginBottom: '15px', zIndex: 50, position: 'relative' }}>
          <button className="lp-btn lp-btn-outline" onClick={shuffleDeck} style={{ fontSize: '13.5px', padding: '12px 28px' }}>
            <RefreshCw size={15} /> Shuffle 3D Deck
          </button>
        </div>
      </div>

      {/* Exploding Fullscreen Glass Blueprint Overlay */}
      <AnimatePresence>
        {explodedCard && (
          <motion.div 
            className="exploded-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="exploded-content"
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
            >
              {/* Close control button */}
              <button className="close-exploded" onClick={() => setExplodedCard(null)} title="Close Blueprint">
                <X size={22} />
              </button>

              {/* Exploded Left Side specifications */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '440px' }}>
                <div>
                  <span className="tag-premium" style={{ borderColor: explodedCard.color, color: explodedCard.color, background: `${explodedCard.color}15` }}>
                    {explodedCard.badge} Architecture
                  </span>
                  <h3 style={{ fontSize: '26px', fontWeight: 800, color: 'white', margin: '18px 0 12px', fontFamily: 'var(--lp-font)', lineHeight: 1.2, letterSpacing: '-0.03em' }}>
                    {explodedCard.title}
                  </h3>
                  <p style={{ color: 'var(--lp-text-muted)', fontSize: '15.5px', lineHeight: 1.6 }}>
                    {explodedCard.desc}
                  </p>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Sparkles size={16} color={explodedCard.color} />
                    <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: explodedCard.color, fontFamily: 'Space Grotesk' }}>Interactive Try-out Trigger</span>
                  </div>
                  <div 
                    className="interactive-prompt-chip" 
                    onClick={() => handleCopyPrompt(explodedCard.testPrompt)}
                  >
                    <p style={{ margin: 0, paddingRight: '36px', color: '#fff', lineHeight: 1.5 }}>{explodedCard.testPrompt}</p>
                    <Copy size={15} style={{ position: 'absolute', right: '16px', top: '18px', opacity: 0.7, color: explodedCard.color }} />
                  </div>
                </div>

                <div style={{ marginTop: '30px' }}>
                  <button className="lp-btn lp-btn-primary" onClick={() => navigate('/dashboard')} style={{ padding: '16px 32px', fontSize: '14.5px' }}>
                    Launch Decoupled Studio <ArrowUpRight size={18} />
                  </button>
                </div>
              </div>

              {/* Exploded Right Side SVG Mesh Graph */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ color: explodedCard.color, fontWeight: 800, letterSpacing: '2px', fontSize: '11px', fontFamily: 'Space Grotesk' }}>
                  ⚡ CLICK MESH NEURONS TO DIAGNOSE ALGORITHMS
                </div>

                <div className="mesh-canvas-wrap">
                  {/* SVG Wires (Shader Lines) */}
                  <svg className="mesh-svg">
                    {/* Glowing moving light pulses inside the paths */}
                    <line x1="25%" y1="25%" x2="75%" y2="25%" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                    <line x1="75%" y1="25%" x2="75%" y2="75%" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                    <line x1="75%" y1="75%" x2="25%" y2="75%" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                    <line x1="25%" y1="75%" x2="25%" y2="25%" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />

                    <line x1="25%" y1="25%" x2="75%" y2="25%" stroke={explodedCard.color} strokeWidth="3.5" className="shader-path" />
                    <line x1="75%" y1="25%" x2="75%" y2="75%" stroke={explodedCard.color} strokeWidth="3.5" className="shader-path" style={{ animationDelay: '4.5s' }} />
                    <line x1="75%" y1="75%" x2="25%" y2="75%" stroke={explodedCard.color} strokeWidth="3.5" className="shader-path" style={{ animationDelay: '9s' }} />
                    <line x1="25%" y1="75%" x2="25%" y2="25%" stroke={explodedCard.color} strokeWidth="3.5" className="shader-path" style={{ animationDelay: '13.5s' }} />
                  </svg>

                  {/* Nodes with concentric Hover-Animators */}
                  <div 
                    className={`mesh-node ${activeNode === 0 ? 'active' : ''}`} 
                    style={{ left: '25%', top: '25%', color: explodedCard.color }}
                    onClick={() => setActiveNode(0)}
                  >
                    <div className="node-pulse-ring" />
                    <div className="node-trigger-circle" style={{ background: activeNode === 0 ? explodedCard.color : '#04040a', color: activeNode === 0 ? '#fff' : explodedCard.color }}>
                      <span style={{ fontSize: '11px', fontWeight: 900, fontFamily: 'Space Grotesk' }}>01</span>
                    </div>
                  </div>

                  <div 
                    className={`mesh-node ${activeNode === 1 ? 'active' : ''}`} 
                    style={{ left: '75%', top: '25%', color: explodedCard.color }}
                    onClick={() => setActiveNode(1)}
                  >
                    <div className="node-pulse-ring" />
                    <div className="node-trigger-circle" style={{ background: activeNode === 1 ? explodedCard.color : '#04040a', color: activeNode === 1 ? '#fff' : explodedCard.color }}>
                      <span style={{ fontSize: '11px', fontWeight: 900, fontFamily: 'Space Grotesk' }}>02</span>
                    </div>
                  </div>

                  <div 
                    className={`mesh-node ${activeNode === 2 ? 'active' : ''}`} 
                    style={{ left: '75%', top: '75%', color: explodedCard.color }}
                    onClick={() => setActiveNode(2)}
                  >
                    <div className="node-pulse-ring" />
                    <div className="node-trigger-circle" style={{ background: activeNode === 2 ? explodedCard.color : '#04040a', color: activeNode === 2 ? '#fff' : explodedCard.color }}>
                      <span style={{ fontSize: '11px', fontWeight: 900, fontFamily: 'Space Grotesk' }}>03</span>
                    </div>
                  </div>

                  <div 
                    className={`mesh-node ${activeNode === 3 ? 'active' : ''}`} 
                    style={{ left: '25%', top: '75%', color: explodedCard.color }}
                    onClick={() => setActiveNode(3)}
                  >
                    <div className="node-pulse-ring" />
                    <div className="node-trigger-circle" style={{ background: activeNode === 3 ? explodedCard.color : '#04040a', color: activeNode === 3 ? '#fff' : explodedCard.color }}>
                      <span style={{ fontSize: '11px', fontWeight: 900, fontFamily: 'Space Grotesk' }}>04</span>
                    </div>
                  </div>

                  {/* Hover-Reveal details card */}
                  <div className="floating-reveal-card" style={{ borderLeft: `5px solid ${explodedCard.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Sparkles size={14} color={explodedCard.color} />
                      <span style={{ fontSize: '14px', fontWeight: 900, color: '#fff', fontFamily: 'Outfit, sans-serif' }}>
                        {explodedCard.nodes[activeNode].label}
                      </span>
                    </div>
                    <p style={{ color: 'var(--lp-text-muted)', fontSize: '13.5px', margin: 0, lineHeight: 1.5 }}>
                      {explodedCard.nodes[activeNode].desc}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- LOGO & NAVBAR SYSTEM ---

const Logo = () => (
  <div className="nav-logo-wrap" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
    <div className="logo-icon">
      <Zap size={18} color="#fff" />
    </div>
    <span className="nav-logo-text">
      Prompt<span className="nav-logo-forge">Forge</span>
    </span>
  </div>
);

const Navbar = () => {
  const navigate = useNavigate();
  const { setWhiteLabelOpen } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="lp-navbar">
      <Logo />
      
      {/* Desktop Links */}
      <div className="nav-links desktop-only">
        <a href="#features" className="nav-link">Capabilities</a>
        <a href="#quantum-arena" className="nav-link">Quantum Arena</a>
        <a href="#tools" className="nav-link">The 11 Tools</a>
        <a href="#architecture" className="nav-link">Architecture Mesh</a>
        <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/dashboard/docs'); }} style={{ color: 'var(--lp-accent-light)', fontWeight: 800 }}>
          Interactive Docs Hub
        </a>
        <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); setWhiteLabelOpen(true); }} style={{ color: 'var(--lp-cyan)', fontWeight: 700 }}>
          Enterprise White-Label
        </a>
        <MagneticButton className="lp-btn lp-btn-primary" onClick={() => navigate('/dashboard')} style={{ padding: '11px 26px', fontSize: '13.5px' }}>
          Launch Studio
        </MagneticButton>
      </div>

      {/* Mobile Toggle */}
      <button className="mobile-toggle" onClick={() => setIsOpen(true)}>
        <Menu size={20} />
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="mobile-menu"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          >
            <div className="mobile-menu-header">
              <Logo />
              <button className="mobile-close" onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="mobile-links">
              <a href="#features" className="mobile-link" onClick={() => setIsOpen(false)}>Capabilities</a>
              <a href="#quantum-arena" className="mobile-link" onClick={() => setIsOpen(false)}>Quantum Arena</a>
              <a href="#tools" className="mobile-link" onClick={() => setIsOpen(false)}>The 11 Tools</a>
              <a href="#architecture" className="mobile-link" onClick={() => setIsOpen(false)}>Architecture Mesh</a>
              <a href="#" className="mobile-link" onClick={(e) => { setIsOpen(false); navigate('/dashboard/docs'); }} style={{ color: 'var(--lp-accent-light)' }}>Interactive Docs Hub</a>
              <a href="#" className="mobile-link" onClick={(e) => { setIsOpen(false); setWhiteLabelOpen(true); }} style={{ color: 'var(--lp-cyan)', fontWeight: 700 }}>Enterprise White-Label</a>
              <button className="lp-btn lp-btn-primary" onClick={() => { setIsOpen(false); navigate('/dashboard'); }} style={{ width: '100%', justifyContent: 'center', marginTop: '24px' }}>
                Launch Studio
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => {
  const navigate = useNavigate();
  const { setWhiteLabelOpen } = useContext(AppContext);
  return (
    <footer className="lp-footer">
      <div className="footer-grid">
        <div className="footer-col">
          <Logo />
          <p style={{ marginTop: '20px', color: 'var(--lp-text-muted)', maxWidth: '300px', fontSize: '14px', lineHeight: 1.6 }}>
            Decoupled local workbench built for advanced software engineers and designers. Zero platform subscriptions. Direct API key security.
          </p>
        </div>
        <div className="footer-col">
          <h4>Capabilities</h4>
          <div className="footer-links">
            <a href="#features" className="footer-link">Capabilities</a>
            <a href="#quantum-arena" className="footer-link">Tool Showcase</a>
            <a href="#tools" className="footer-link">The 11 Tools Suite</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }} className="footer-link">Live Workspace</a>
          </div>
        </div>
        <div className="footer-col">
          <h4>Developer Hub</h4>
          <div className="footer-links">
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard/docs'); }} className="footer-link" style={{ color: 'var(--lp-accent-light)', fontWeight: 800 }}>Documentation Vault</a>
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="footer-link">OpenAI Console</a>
            <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" className="footer-link">Anthropic Console</a>
            <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="footer-link">Google AI Studio</a>
          </div>
        </div>
        <div className="footer-col">
          <h4>Vault & Safety</h4>
          <div className="footer-links">
            <a href="#byok" className="footer-link">BYOK Architecture</a>
            <a href="#" className="footer-link">Zero Server logs</a>
            <a href="#" className="footer-link">Structured Data Exports</a>
            <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); setWhiteLabelOpen(true); }}>Contact Developer (White-Label)</a>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--lp-glass-border)', paddingTop: '40px', textAlign: 'center', fontSize: '13px', color: 'var(--lp-text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span>© 2026 PromptForge. Built for absolute privacy. Bring Your Own Keys.</span>
        <span style={{ fontSize: '11px', opacity: 0.5 }}>All AI requests run entirely client-side. No platform databases, no middleware traces.</span>
      </div>
    </footer>
  );
};

const RevealText = ({ children, className }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  return (
    <div ref={ref} className={`reveal-text ${className}`} style={{ overflow: 'hidden' }}>
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : { y: "100%", opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
};

const HoverRevealEffect = ({ text, subtext }) => {
  return (
    <motion.div 
      className="hover-reveal-item"
      initial="initial"
      whileHover="hover"
    >
      <motion.div
        variants={{
          initial: { y: 0 },
          hover: { y: -3 }
        }}
        style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#fff', letterSpacing: '-0.01em' }}
      >
        {text}
      </motion.div>
      <motion.div
        variants={{
          initial: { opacity: 0, y: 8 },
          hover: { opacity: 1, y: 0 }
        }}
        style={{ color: 'var(--lp-cyan)', fontSize: '12.5px', marginTop: '6px', fontWeight: 700, fontFamily: 'Space Grotesk' }}
      >
        {subtext}
      </motion.div>
    </motion.div>
  );
};

const CardShuffle = () => {
  const { showToast } = useContext(AppContext);
  const [cards, setCards] = useState([
    { id: 1, title: "Claude 3.5 Sonnet", desc: "Supreme coding reasoning and highly detailed structural outputs.", color: "#7c5cfc", icon: <Cpu size={24} /> },
    { id: 2, title: "GPT-4o Omniscient", desc: "Ultra-fast contextual parses and high-volume analytical equations.", color: "#06b6d4", icon: <Zap size={24} /> },
    { id: 3, title: "Gemini 1.5 Pro", desc: "Long-context model with up to 1M token window — ideal for large documents and complex analysis.", color: "#10b981", icon: <Database size={24} /> },
    { id: 4, title: "DeepSeek-V3", desc: "Fast, cost-efficient model for code, math, and structured reasoning tasks.", color: "#f43f5e", icon: <Sparkles size={24} /> }
  ]);

  const shuffle = () => {
    setCards([...cards].sort(() => Math.random() - 0.5));
    if (showToast) {
      showToast("Provider promise route channels re-shuffled!", "success");
    }
  };

  return (
    <div className="shuffle-container" onClick={shuffle}>
      <div className="ambient-glow" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '280px', height: '280px', opacity: 0.2 }}></div>
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          layout
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: 1 - index * 0.04, 
            opacity: 1,
            y: index * -24,
            x: index * 10,
            zIndex: cards.length - index,
            rotate: index * 2.5
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          style={{
            position: 'absolute',
            width: '330px',
            height: '210px',
            background: 'linear-gradient(135deg, rgba(16, 16, 32, 0.98) 0%, rgba(6, 6, 12, 1) 100%)',
            border: `1px solid ${card.color}45`,
            borderRadius: '24px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxShadow: `0 20px 45px ${card.color}18`,
            borderLeft: `4px solid ${card.color}`,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            textRendering: 'optimizeLegibility',
            transformStyle: 'preserve-3d'
          }}
        >
          <div style={{ color: card.color, marginBottom: '14px' }}>{card.icon}</div>
          <div style={{ color: 'white', fontWeight: 900, fontSize: '20px', marginBottom: '8px', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.01em', WebkitFontSmoothing: 'antialiased' }}>{card.title}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.5, WebkitFontSmoothing: 'antialiased' }}>{card.desc}</div>
        </motion.div>
      ))}
      <div style={{ position: 'absolute', bottom: '-24px', color: 'var(--lp-cyan)', fontSize: '10px', fontWeight: 800, letterSpacing: '2px', fontFamily: 'Space Grotesk' }}>⚡ CLICK DECK TO SHUFFLE CHANNELS</div>
    </div>
  );
};

const Hover3DCard = ({ children, className, bgImage }) => {
  const cardRef = useRef(null);
  const x = useSpring(0, { stiffness: 220, damping: 25 });
  const y = useSpring(0, { stiffness: 220, damping: 25 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    x.set((mouseY / (rect.height / 2)) * -14);
    y.set((mouseX / (rect.width / 2)) * 14);

    cardRef.current.style.setProperty('--mouse-x', `${(e.clientX - rect.left)}px`);
    cardRef.current.style.setProperty('--mouse-y', `${(e.clientY - rect.top)}px`);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: x,
        rotateY: y,
        transformStyle: "preserve-3d",
      }}
    >
      {bgImage && (
        <div 
          className="bento-card-bg" 
          style={{ backgroundImage: `url(${bgImage})` }} 
        />
      )}
      {bgImage && <div className="bento-card-glassmask" />}
      <div className="bento-card-inner">
        {children}
      </div>
      <div className="glow-spotlight" />
    </motion.div>
  );
};

const ThreeDSlider = () => {
  const [active, setActive] = useState(0);
  const tools = [
    { title: "Indexed PDF Vector Mesh", desc: "Upload up to 50 pages of local PDF data models, scrape image logs with Tesseract.js OCR, and explore parsed conceptual paths inside a beautiful SVG Knowledge Mesh.", icon: <Database />, color: "#06b6d4", img: "/local_vector_nexus.png" },
    { title: "Senior AI Software Auditor", desc: "Audit source files in 18 common languages, locate exact line numbers of severe bugs/vulnerabilities, and replace code sections with verified drop-in boilerplate segments.", icon: <Code />, color: "#10b981", img: "/promptforge_nexus_core.png" },
    { title: "Multi-Agent Debater Council", desc: "Convene 4 specialized expert personas (Visionary, Hacker, Analyst, Critic) inside live bubbles. Synthesis complete blueprints into an AES-encrypted history vault.", icon: <Lightbulb />, color: "#7c5cfc", img: "/neural_agent_synapse.png" },
    { title: "API Key Vault — Secure BYOK Routing", desc: "BYOK serverless routing. Add API keys directly into local browser sandbox settings, ensuring perfect safety while executing parallel comparative judge debates.", icon: <Shield />, color: "#f43f5e", img: "/private_key_vault_core.png" }
  ];

  const handlePrev = () => {
    setActive((prev) => (prev === 0 ? tools.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActive((prev) => (prev === tools.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="orbital-showcase-wrap">
      <div className="section-header">
        <span className="tag-premium">UPGRADED SYSTEM INTERFACES</span>
        <h2>
          3D Visual <span style={{ color: 'var(--lp-accent)' }}>Interactive Slider</span>
        </h2>
        <p>
          Drag or click items below to inspect PromptForge's most complex local structures with full saturation.
        </p>
      </div>

      <div className="orbital-container">
        {/* Manual Arrow Controls */}
        <button 
          className="orbital-arrow-btn prev" 
          onClick={(e) => { e.stopPropagation(); handlePrev(); }} 
          aria-label="Previous Slide"
        >
          <ChevronLeft size={28} />
        </button>

        <div className="orbital-inner">
          {tools.map((tool, i) => {
            const isActive = active === i;
            const offset = i - active;
            return (
              <motion.div
                key={i}
                className={`orbital-card ${isActive ? 'active' : ''}`}
                animate={{
                  scale: isActive ? 1.05 : 0.72,
                  opacity: Math.abs(offset) > 1 ? 0 : 1 - Math.abs(offset) * 0.45,
                  x: offset * 340,
                  z: isActive ? 80 : -100,
                  rotateY: offset * -25,
                }}
                transition={{ type: "spring", stiffness: 240, damping: 22 }}
                onClick={() => setActive(i)}
                style={{ cursor: 'pointer' }}
              >
                <div className="orbital-card-inner">
                  <div className="orbital-card-bg" style={{ backgroundImage: `url(${tool.img})` }} />
                  <div className="orbital-card-overlay" />
                  <div className="orbital-card-content">
                    <div className="orbital-icon" style={{ background: tool.color }}>{tool.icon}</div>
                    <h3>{tool.title}</h3>
                    <p>{tool.desc}</p>
                  </div>
                  {isActive && <div className="orbital-active-glow" style={{ boxShadow: `0 0 50px ${tool.color}3a`, borderColor: tool.color }} />}
                </div>
              </motion.div>
            );
          })}
        </div>

        <button 
          className="orbital-arrow-btn next" 
          onClick={(e) => { e.stopPropagation(); handleNext(); }} 
          aria-label="Next Slide"
        >
          <ChevronRight size={28} />
        </button>
      </div>

      <div className="orbital-nav">
        {tools.map((_, i) => (
          <button 
            key={i} 
            className={`orbital-dot ${active === i ? 'active' : ''}`} 
            onClick={() => setActive(i)}
          />
        ))}
      </div>
    </div>
  );
};

// --- SAVINGS CALCULATOR ---

const SavingsCalculator = () => {
  return (
    <div className="math-showcase-card">
      <div className="math-showcase-shine" />
      <span className="tag-premium" style={{ color: 'var(--lp-cyan)', borderColor: 'var(--lp-cyan-glow)' }}>
        HOW BYOK SAVES YOU MONEY
      </span>
      <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 900, letterSpacing: '-0.04em', margin: '24px 0', fontFamily: 'var(--lp-font)', textAlign: 'center', lineHeight: 1.1 }}>
        Stop Overpaying <br />For AI <span style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Access.</span>
      </h2>
      <p style={{ color: 'var(--lp-text-muted)', fontSize: '1.25rem', lineHeight: 1.8, maxWidth: '820px', margin: '0 auto 48px', textAlign: 'center', fontFamily: 'var(--lp-font)', fontWeight: 400 }}>
        Traditional SaaS providers charge a hefty monthly markup. <strong style={{ color: '#fff', fontWeight: 700 }}>PromptForge</strong> acts as a serverless router. By adding your own keys, you bypass corporate middleman fees and pay only raw token consumption costs.
      </p>

      {/* Modern Comparative Infographic */}
      <div className="byok-compare-grid">
        {/* Left Side: Traditional SaaS Markup */}
        <div className="compare-card traditional-card">
          <div className="card-header">
            <span className="compare-tag red-tag">TRADITIONAL MIDDLEMAN SUBSCRIPTION</span>
            <h3>Corporate SaaS Tax</h3>
          </div>
          <div className="compare-list">
            <div className="compare-item-detailed">
              <div className="item-marker red-marker">✕</div>
              <div className="item-text">
                <strong>Static $20 - $60/mo Subscription</strong>
                <p>You pay the full rate even if you only prompt a few times a week, subsidizing heavy users.</p>
              </div>
            </div>
            <div className="compare-item-detailed">
              <div className="item-marker red-marker">✕</div>
              <div className="item-text">
                <strong>Privacy & Security Risks</strong>
                <p>Your api keys, custom data index matrices, and prompts are routed through third-party servers.</p>
              </div>
            </div>
            <div className="compare-item-detailed">
              <div className="item-marker red-marker">✕</div>
              <div className="item-text">
                <strong>Artificial Model Restrictions</strong>
                <p>Strict rate limits, prompt length ceilings, and single-model locking to preserve vendor margins.</p>
              </div>
            </div>
          </div>
          <div className="card-bg-glow card-glow-red" />
        </div>

        {/* Right Side: BYOK Advantage */}
        <div className="compare-card promptforge-card">
          <div className="card-header">
            <span className="compare-tag cyan-tag">PROMPTFORGE DECOUPLED ARCHITECTURE</span>
            <h3>Serverless BYOK Routing</h3>
          </div>
          <div className="compare-list">
            <div className="compare-item-detailed">
              <div className="item-marker cyan-marker">✓</div>
              <div className="item-text">
                <strong>Raw Token Consumption Pricing</strong>
                <p>Pay exactly for what you prompt. Typical moderate use results in ~$2/mo instead of $60/mo.</p>
              </div>
            </div>
            <div className="compare-item-detailed">
              <div className="item-marker cyan-marker">✓</div>
              <div className="item-text">
                <strong>Local-First Client Sandbox</strong>
                <p>Keys are encrypted with AES-GCM 256-bit in your browser localStorage, bound to your device. Data never touches external servers.</p>
              </div>
            </div>
            <div className="compare-item-detailed">
              <div className="item-marker cyan-marker">✓</div>
              <div className="item-text">
                <strong>Parallel Concurrency Sandbox</strong>
                <p>Prompt 30+ top-tier models in parallel with no synthetic rate limits or artificial throttles.</p>
              </div>
            </div>
          </div>
          <div className="card-bg-glow card-glow-cyan" />
        </div>
      </div>

      {/* Animated Direct Routing Pipeline Visual */}
      <div className="byok-flow-visualizer-container">
        <h4 className="pipeline-title">DIRECT ROUTING PIPELINE SECURE DATAFLOW</h4>
        <div className="pipeline-visual">
          <div className="pipeline-node local-vault">
            <div className="pulse-dot" />
            <span className="node-icon">🔒</span>
            <span className="node-label">Client Vault</span>
          </div>

          <div className="pipeline-channels">
            <svg width="100%" height="80" viewBox="0 0 400 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* OpenAI Line */}
              <path d="M10 40 C 100 40, 100 15, 390 15" stroke="rgba(16, 163, 127, 0.15)" strokeWidth="2" strokeLinecap="round" />
              <path className="pulse-path openai-pulse" d="M10 40 C 100 40, 100 15, 390 15" stroke="url(#openai-gradient)" strokeWidth="2.5" strokeLinecap="round" />
              
              {/* Anthropic Line */}
              <path d="M10 40 C 100 40, 100 32, 390 32" stroke="rgba(217, 119, 6, 0.15)" strokeWidth="2" strokeLinecap="round" />
              <path className="pulse-path anthropic-pulse" d="M10 40 C 100 40, 100 32, 390 32" stroke="url(#anthropic-gradient)" strokeWidth="2.5" strokeLinecap="round" />

              {/* Gemini Line */}
              <path d="M10 40 C 100 40, 100 48, 390 48" stroke="rgba(66, 133, 244, 0.15)" strokeWidth="2" strokeLinecap="round" />
              <path className="pulse-path gemini-pulse" d="M10 40 C 100 40, 100 48, 390 48" stroke="url(#gemini-gradient)" strokeWidth="2.5" strokeLinecap="round" />

              {/* DeepSeek Line */}
              <path d="M10 40 C 100 40, 100 65, 390 65" stroke="rgba(37, 99, 235, 0.15)" strokeWidth="2" strokeLinecap="round" />
              <path className="pulse-path deepseek-pulse" d="M10 40 C 100 40, 100 65, 390 65" stroke="url(#deepseek-gradient)" strokeWidth="2.5" strokeLinecap="round" />

              <defs>
                <linearGradient id="openai-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7c5cfc" stopOpacity="0" />
                  <stop offset="50%" stopColor="#10a37f" stopOpacity="1" />
                  <stop offset="100%" stopColor="#10a37f" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="anthropic-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7c5cfc" stopOpacity="0" />
                  <stop offset="50%" stopColor="#d97706" stopOpacity="1" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="gemini-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7c5cfc" stopOpacity="0" />
                  <stop offset="50%" stopColor="#4285f4" stopOpacity="1" />
                  <stop offset="100%" stopColor="#4285f4" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="deepseek-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7c5cfc" stopOpacity="0" />
                  <stop offset="50%" stopColor="#2563eb" stopOpacity="1" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="pipeline-targets">
            <div className="pipeline-target-node">
              <span className="target-dot openai-dot" />
              <span className="target-name">OpenAI</span>
            </div>
            <div className="pipeline-target-node">
              <span className="target-dot anthropic-dot" />
              <span className="target-name">Anthropic</span>
            </div>
            <div className="pipeline-target-node">
              <span className="target-dot gemini-dot" />
              <span className="target-name">Gemini</span>
            </div>
            <div className="pipeline-target-node">
              <span className="target-dot deepseek-dot" />
              <span className="target-name">DeepSeek</span>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Visual Decoupled Badges */}
      <div className="math-badges-grid">
        <div className="math-badge-item">
          <div className="math-badge-icon">⚡</div>
          <div className="math-badge-title">Direct API Routing</div>
          <div className="math-badge-desc">Zero platform markup fees. Pay strictly for raw token usage.</div>
        </div>
        <div className="math-badge-item">
          <div className="math-badge-icon">🔒</div>
          <div className="math-badge-title">Absolute Key Safety</div>
          <div className="math-badge-desc">Keys are encrypted local-first. Never touch external servers.</div>
        </div>
        <div className="math-badge-item">
          <div className="math-badge-icon">🛠️</div>
          <div className="math-badge-title">No Limits Sandbox</div>
          <div className="math-badge-desc">Parallel prompts, vector indexing, OCR, and infinite workflows.</div>
        </div>
      </div>
    </div>
  );
};

// --- TERMINAL SIMULATOR FOR ENCRYPTION LOOPS ---

const TerminalSimulator = () => {
  const [lines, setLines] = useState([
    "Initializing secure local Key Vault sandboxing...",
    "Loaded AES-GCM 256-bit client encryption key.",
    "Ready. Direct BYOK local routes fully active."
  ]);

  useEffect(() => {
    const logs = [
      "Securing workspace API tokens in client IndexedDB...",
      "Bypassing provider middlewares: routing via raw HTTPS endpoints.",
      "Parallel promises synchronized: Promise.allSettled active.",
      "Concurring multipersona expert debate bubble compiled.",
      "Scraper radar scan triggered: Scraping dossier packages safely.",
      "Local vector DB index initialized entirely in-browser.",
      "Vulnerability auditor checked: 18 programming scopes loaded."
    ];
    let i = 0;
    const interval = setInterval(() => {
      setLines(prev => [...prev, `[system@promptforge] ~ ${logs[i % logs.length]}`].slice(-4));
      i++;
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="terminal-simulator">
      <div className="terminal-header">
        <div className="terminal-dots">
          <div className="tdot tdot-red"></div>
          <div className="tdot tdot-yellow"></div>
          <div className="tdot tdot-green"></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 700, fontFamily: 'Space Grotesk' }}>
          <Terminal size={12} /> SECURE_SANDBOX_CONSOLES.SH
        </div>
      </div>
      <div className="terminal-body">
        {lines.map((line, idx) => (
          <div key={idx} style={{ color: idx === lines.length - 1 ? '#06b6d4' : 'rgba(255,255,255,0.7)', transition: 'all 0.4s' }}>
            {line}
          </div>
        ))}
        <div style={{ color: 'var(--lp-accent-light)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>$</span> <span style={{ animation: 'pulse 1.2s infinite' }}>█</span>
        </div>
      </div>
    </div>
  );
};

// --- INTERACTIVE 13 SYSTEM TOOLS DISCOVERY ---

const ToolsDiscovery = () => {
  const [activeTool, setActiveTool] = useState(0);

  const toolsData = [
    {
      name: "Chat With Data",
      icon: <Database size={20} />,
      privacy: "Local processing (pdf.js / Tesseract.js OCR). No servers.",
      desc: "Complete client-side vector database indexer. Upload up to 50 pages of PDFs, run OCR image scans locally in a secondary thread, and build custom SVG Knowledge node meshes. Chart trends instantly inside Line, Area, Bar, or Pie recharts modules.",
      testPrompt: "Upload financial statement PDFs and plot 'Year-over-Year revenue trends' directly into a line chart.",
      color: "#06b6d4"
    },
    {
      name: "Prompt Optimizer",
      icon: <Wand2 size={20} />,
      privacy: "Local engine mapping. Stored in browser IndexedDB.",
      desc: "Fine-tune prompts using the structured CREATE framework. Adjust refinement intensity dial from 1-100, view weakness diagnostic scoring gauges, analyze parameter weaknesses, and test variations inside a live comparison playground.",
      testPrompt: "Forge Intensity 85% -> Refine copywriting prompt using Anti-Hallucination and expert roleplay loops.",
      color: "#7c5cfc"
    },
    {
      name: "AI Writer",
      icon: <Layers size={20} />,
      privacy: "API routed via secure local keys.",
      desc: "Elite copywriting suite housing 20 content varieties, 10 dynamic tones, and 16 target languages. Use Content Humanizers to strip AI clichés, check outputs inside A/B comparison screens, and audit engagement metrics in real-time.",
      testPrompt: "Write an authority hook with the Humanizer active, comparing outputs in the A/B side-by-side comparison pane.",
      color: "#10b981"
    },
    {
      name: "Creator Studio",
      icon: <Share2 size={20} />,
      privacy: "Instant clipboard export. Local browser storage.",
      desc: "Social media workspace supporting 8 platforms (Instagram, LinkedIn, YouTube, TikTok, Twitter/X, Facebook, WhatsApp, Pinterest). Generate viral hooks, curiosity-driven captions, platform-specific formats, and schedule drafts inside an interactive 7-Day Content Calendar.",
      testPrompt: "Generate a curiosity-hook caption series for a LinkedIn SaaS launch and push to the 7-day calendar.",
      color: "#e11d48"
    },
    {
      name: "Code Helper",
      icon: <Code size={20} />,
      privacy: "Executed locally inside browser sandbox.",
      desc: "Senior engineering assistant supporting 18 languages. Run static security audits to locate exact vulnerability lines, generate drop-in secure code replacements, write unit tests, and compile formatted conventional commit messages.",
      testPrompt: "Paste React hook code, run a Security Audit scan, and output conventional commit messages for a bugfix.",
      color: "#fb7185"
    },
    {
      name: "The Inventor",
      icon: <Lightbulb size={20} />,
      privacy: "Keys encrypted locally. Zero middleman.",
      desc: "Multi-agent debate council with 4 expert personas (Visionary, Hacker, Analyst, Critic) that debate your idea in real-time chat bubbles. Includes cancel support, session history saved to localStorage, and exports a synthesized 30-60-90 day Master Blueprint as a .md file.",
      testPrompt: "Topic: 'Zero-emission urban shipping fleet'. Trigger live 4-agent council debate and export Master Blueprint.",
      color: "#a78bfa"
    },
    {
      name: "Data Wizard",
      icon: <Database size={20} />,
      privacy: "Client-side output. Private keys.",
      desc: "Developer sandbox generating BigQuery, Postgres, and Snowflake SQL scripts, Pandas dataframes, Excel formulas, DAX PowerBI strings, Regex patterns, and R-code. Compare two approaches side-by-side with integrated efficiency gauges.",
      testPrompt: "Input schema -> compile Postgres query to fetch active subscriptions with side-by-side optimization options.",
      color: "#fbbf24"
    },
    {
      name: "The Spider",
      icon: <Globe size={20} />,
      privacy: "Client-side Jina AI routing. No server logs.",
      desc: "Deep web scraping command center via Jina AI parse engines. Supports URL mode and search mode, cancel mid-crawl, 6 output dossier formats, session history with full restore, verified vs AI-hallucinated source detection, and follow-up Q&A on extracted data.",
      testPrompt: "Scrape 'https://news.ycombinator.com' → export as Markdown dossier → send to Chat With Data.",
      color: "#10b981"
    },
    {
      name: "SEO Optimizer",
      icon: <Search size={20} />,
      privacy: "Local memory. Direct browser rendering.",
      desc: "7-tool SEO suite: Keyword Lab, SERP Simulator (live Google preview), Content Scorer (6-dimension score rings), Topic Clusters, Content Gap AI, Meta Forge (5 title variants with char count), and Schema Generator with individual JSON-LD copy buttons.",
      testPrompt: "Simulate SERP snippet for 'PromptForge AI studio' and compile matching JSON-LD Article schema markup.",
      color: "#60a5fa"
    },
    {
      name: "Model Compare",
      icon: <RefreshCw size={20} />,
      privacy: "Parallel async promises direct to providers.",
      desc: "Test multiple LLMs side-by-side using parallel async Promise.allSettled resolutions. An automated AI Judge panel audits all responses, picks a winner, and generates detailed diagnostic verdict cards with reasoning.",
      testPrompt: "Prompt: 'Explain quantum entanglement' → compare Claude 3.5 vs GPT-4o with AI Judge verdict active.",
      color: "#ec4899"
    },
    {
      name: "Prompt Library",
      icon: <Star size={20} />,
      privacy: "Saved inside browser localStorage.",
      desc: "Template manager preloaded with 60+ battle-tested prompts across 6 category tabs (Writing, Code, Business, SEO, Data, Creative). Save favourites locally, customise parameters, and route any prompt directly into the active workspace tool.",
      testPrompt: "Search 'Refactor' under Code category, favourite the prompt, and pop it into Code Helper.",
      color: "#fbbf24"
    },
    {
      name: "History Vault",
      icon: <Brain size={20} />,
      privacy: "Stored in browser IndexedDB. Never leaves device.",
      desc: "Persistent results archive powered by IndexedDB. Every tool output is auto-tagged with tool name and topic, fully searchable, individually restorable, and exportable. Acts as your private AI work history — no cloud, no sync, no data leaks.",
      testPrompt: "Open Vault → search 'SEO' → restore a previous Content Scorer result directly into SEO Optimizer.",
      color: "#7c5cfc"
    }
  ];

  return (
    <div className="lp-tools-section-wrap">
      <div className="section-header">
        <span className="tag-premium">SYSTEM INTEGRITY INDEX</span>
        <h2>
          Explore The <span style={{ color: 'var(--lp-accent)' }}>11 System Tools</span>
        </h2>
        <p>
          Select any utility to audit its client-side engine features and encryption protocols.
        </p>
      </div>

      <div className="tools-layout-grid">
        {/* Left Side Navigation List */}
        <div className="tools-tab-list">
          {toolsData.map((tool, idx) => (
            <div 
              key={idx}
              className={`tools-tab-button ${activeTool === idx ? 'active' : ''}`}
              onClick={() => setActiveTool(idx)}
            >
              <div style={{ color: activeTool === idx ? tool.color : 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' }}>
                {tool.icon}
              </div>
              <span style={{ fontSize: '14.5px', fontWeight: 700 }}>{tool.name}</span>
            </div>
          ))}
        </div>

        {/* Right Side Frame Viewport */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTool}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="tool-detail-card"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ color: toolsData[activeTool].color }}>
                {React.cloneElement(toolsData[activeTool].icon, { size: 36 })}
              </div>
              <span className="tag-premium" style={{ borderColor: toolsData[activeTool].color, color: '#fff', background: `${toolsData[activeTool].color}1a` }}>
                {toolsData[activeTool].name} ACTIVE
              </span>
            </div>
            
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'white', marginBottom: '12px', fontFamily: 'var(--lp-font)', letterSpacing: '-0.02em' }}>
              {toolsData[activeTool].name}
            </h3>

            {/* Privacy Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.15)', padding: '8px 16px', borderRadius: '12px', marginBottom: '28px', width: 'fit-content' }}>
              <Shield size={16} color="var(--lp-cyan)" />
              <span style={{ fontSize: '12px', color: 'var(--lp-cyan)', fontWeight: 800, fontFamily: 'Space Grotesk' }}>
                {toolsData[activeTool].privacy}
              </span>
            </div>

            <p style={{ color: 'var(--lp-text-muted)', fontSize: '16px', lineHeight: 1.7, marginBottom: '36px' }}>
              {toolsData[activeTool].desc}
            </p>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Sparkles size={16} color="var(--lp-accent)" />
                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--lp-accent)', fontFamily: 'Space Grotesk' }}>Interactive try-out prompt</span>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '18px 24px', borderRadius: '16px', fontSize: '13.5px', color: 'white', fontFamily: 'var(--lp-font-mono)', lineHeight: 1.5, position: 'relative' }}>
                {toolsData[activeTool].testPrompt}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---

const LandingPage = () => {
  const { setWhiteLabelOpen, whiteLabelOpen } = useContext(AppContext);
  const navigate = useNavigate();
  const heroRef = useRef(null);
  
  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.25], [1, 1.03]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const dashboardY = useTransform(scrollYProgress, [0, 0.3], [100, 0]);
  const dashboardScale = useTransform(scrollYProgress, [0, 0.35], [0.88, 1.03]);

  useEffect(() => {
    const lenis = new Lenis();
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <div className="landing-page">
      <div className="noise-overlay" />
      <CursorFollower />
      <BackgroundParticles />
      <Navbar />
      
      {/* Background Ambient Glows */}
      <div className="ambient-glow" style={{ top: '8%', left: '8%' }}></div>
      <div className="ambient-glow" style={{ bottom: '15%', right: '8%', background: 'radial-gradient(circle, rgba(6, 182, 212, 0.18) 0%, transparent 70%)' }}></div>

      {/* --- HERO SECTION --- */}
      <section ref={heroRef} className="hero" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* concentric Circle pulse background */}
        <CircleAnimator />

        <motion.div style={{ scale: heroScale, opacity: heroOpacity, position: 'relative', zIndex: 10 }}>
          <RevealText>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--lp-cyan)', fontWeight: 800, fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '24px', fontFamily: 'Space Grotesk' }}>
              <Sparkles size={16} /> DECOUPLED SERVERLESS WORKSPACE
            </div>
          </RevealText>
          <RevealText className="hero-title">
            <span style={{ background: 'linear-gradient(to right, #fff, var(--lp-accent-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.03em', fontWeight: 900 }}>Your Keys. Your Control.</span> <br /> 
            <span style={{ background: 'linear-gradient(to right, var(--lp-accent-light), var(--lp-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.0em', fontWeight: 900 }}>Decoupled AI Router.</span>
          </RevealText>
          <RevealText>
            <p className="hero-subtitle">
              A private serverless studio workspace. Connect your provider keys directly (OpenAI, Anthropic, Gemini, DeepSeek), skip monthly corporate subscriptions markup, and enjoy absolute data confidentiality.
            </p>
          </RevealText>
          <div className="hero-cta-group">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <MagneticButton className="lp-btn lp-btn-primary" onClick={() => navigate('/dashboard')} style={{ padding: '20px 42px', fontSize: '16.5px' }}>
                Unlock Workspace <ArrowRight size={18} />
              </MagneticButton>
             
            </div>
            <MagneticButton className="lp-btn lp-btn-outline" onClick={() => navigate('/dashboard/docs')} style={{ fontSize: '16.5px' }}>
              Read System Docs <HelpCircle size={18} />
            </MagneticButton>
            <MagneticButton className="lp-btn lp-btn-outline" onClick={() => setWhiteLabelOpen(true)} style={{ fontSize: '16.5px', border: '1px solid rgba(124, 92, 252, 0.4)', color: 'var(--lp-accent-light)' }}>
              Contact Me (White-Label) <Briefcase size={18} style={{ marginLeft: 6 }} />
            </MagneticButton>
          </div>
        </motion.div>
         <div className='text-center' style={{ color: 'var(--lp-cyan)', fontSize: '10px', fontWeight: 800, marginTop: '14px', letterSpacing: '2px', fontFamily: 'Space Grotesk' }}>
                ⚡ BETA VERSION ACTIVE / ZERO MIDDLEMAN MARKUP
              </div>

        {/* Zoom-in device scroll preview viewport */}
        <div className="dashboard-preview-container">
          <motion.div 
            className="dashboard-preview"
            style={{ 
              y: dashboardY, 
              scale: dashboardScale,
            }}
          >
            <img 
              src="/promptforge_nexus_core.png" 
              alt="Dashboard Preview" 
            />
            <div className="dashboard-preview-glow"></div>
          </motion.div>
        </div>
      </section>

      <ShaderLine />

      {/* --- BENTO Grid (Capabilities) --- */}
      <section id="features" className="bento-section">
        <div className="section-header">
          <span className="tag-premium">DECENTRALIZED ARCHITECTURE</span>
          <h2>
            Zero-Trust <span style={{ color: 'var(--lp-accent)' }}>Local Operations</span>
          </h2>
          <p>
            All scraping, formatting, vectoring, and debate compiles proceed entirely inside your local browser memory with crisp high-fidelity previews.
          </p>
        </div>
        
        <div className="bento-container">
          <Hover3DCard className="bento-card bento-wide" bgImage="/promptforge_nexus_core.png">
            <div className="bento-icon"><Zap size={24} /></div>
            <h3 className="bento-title">BYOK Router</h3>
            <p className="bento-desc">
              Your secrets are safe. API credentials are stored securely inside your local browser sandboxed storage under secure parameters. Direct client-side calls route directly to AI systems with zero server databases logs.
            </p>
          </Hover3DCard>

          <Hover3DCard className="bento-card bento-tall" bgImage="/local_vector_nexus.png">
            <div className="bento-icon"><Database size={24} /></div>
            <div>
              <h3 className="bento-title">In-Memory Vectors</h3>
              <p className="bento-desc">
                Load up to 50 pages of local manuals, documentation, or reports. PromptForge constructs a client-side vector database inside IndexedDB using pdf.js, decodes low-res graphs via in-browser Tesseract.js OCR, and outlines concept vectors inside visual graphs.
              </p>
            </div>
          </Hover3DCard>

          <Hover3DCard className="bento-card">
            <div className="bento-icon"><Cpu size={24} /></div>
            <h3 className="bento-title">30+ Model Channels</h3>
            <p className="bento-desc" style={{ fontSize: '14.5px' }}>Route prompts dynamically across GPT-4o, Claude 3.5 Sonnet, Gemini Pro, and DeepSeek backends concurrently.</p>
          </Hover3DCard>

          <Hover3DCard className="bento-card">
            <div className="bento-icon"><Star size={24} /></div>
            <h3 className="bento-title">60+ Custom Library</h3>
            <p className="bento-desc" style={{ fontSize: '14.5px' }}>Access battle-tested templates preloaded across 6 category segments, saving favorite parameters securely.</p>
          </Hover3DCard>

          <Hover3DCard className="bento-card bento-wide" bgImage="/neural_agent_synapse.png">
            <div className="bento-icon"><Sparkles size={24} /></div>
            <h3 className="bento-title">Platform Marketing Studio</h3>
            <p className="bento-desc">
              Generate high-performance marketing copy across 8 major channels. Audit hooks based on pain-point/curiosity structures, customize tones, and drag output components directly into an interactive 7-Day Social Calendar.
            </p>
          </Hover3DCard>
        </div>
      </section>

      <ShaderLine />

      {/* --- INVENTED DYNAMIC QUANTUM ARENA SECTION (Deck Shuffle & Exploding Blueprints) --- */}
      <section id="quantum-arena">
        <QuantumArena />
      </section>

      <ShaderLine />

      {/* --- 13 SYSTEM TOOLS DISCOVERY SECTION --- */}
      <section id="tools" style={{ background: 'rgba(2, 2, 6, 0.35)' }}>
        <ToolsDiscovery />
      </section>

      <ShaderLine />

      {/* --- 3D SLIDER SHOWCASE --- */}
      <section>
        <ThreeDSlider />
      </section>

      <ShaderLine />

      {/* --- NEURAL ARCHITECTURE THREE.JS --- */}
      <section id="architecture" className="architecture-section" style={{ padding: '30px 24px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <span className="tag-premium">SYSTEM DATA MESH</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, marginTop: '16px', letterSpacing: '-0.03em', fontFamily: 'var(--lp-font)' }}>Interactive 3D Blueprint Mesh</h2>
          <p style={{ color: 'var(--lp-text-muted)', fontSize: '1.15rem', marginTop: '12px' }}>Hover or drag custom node rings to evaluate system pipelines.</p>
        </div>
        <ExplodingObjects />
      </section>

      <ShaderLine />

      {/* --- AGNOSTIC MODEL DECK SHUFFLE --- */}
      <section className="shuffle-section" style={{ padding: '35px 24px', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '60px', maxWidth: '1200px', margin: '0 auto', alignItems: 'center', boxSizing: 'border-box' }}>
        <div>
          <span className="tag-premium">DYNAMIC ROUTING GATE</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: '20px', marginTop: '16px', fontFamily: 'var(--lp-font)', letterSpacing: '-0.04em', lineHeight: 1.2 }}>
            Built for the <br />Model Agnostic.
          </h2>
          <p style={{ color: 'var(--lp-text-muted)', fontSize: '1.15rem', lineHeight: 1.7, marginBottom: '36px' }}>
            PromptForge decouples you from single provider silos. Route prompts and data variables across OpenAI, Anthropic, or Google backends in parallel. Let automated AI Judge matrices evaluate outputs, identify weaknesses, and declare winners.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <HoverRevealEffect text="Local Context Streaming" subtext="Feed up to 2,000,000 token structures smoothly via browser IndexedDB." />
            <HoverRevealEffect text="Parallel Promises Resolution" subtext="Evaluate and contrast prompt returns side-by-side using Promise.allSettled." />
            <HoverRevealEffect text="Zero Platform Databases Logs" subtext="All communications proceed purely via sandboxed client-side HTTPS. Absolute data safety." />
          </div>
        </div>
        <CardShuffle />
      </section>

      <ShaderLine />

      {/* --- VALUE PROPOSITION SAVINGS CALCULATOR --- */}
      <section id="byok" className="calc-section">
        <SavingsCalculator />
      </section>

      <ShaderLine />

      {/* --- API ONBOARDING MATRIX & TERMINAL --- */}
      <section className="api-guide-section">
        <div className="section-header" style={{ textAlign: 'center' }}>
          <span className="tag-premium">FRICTIONLESS INTEGRATION</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, marginTop: '16px', letterSpacing: '-0.03em', fontFamily: 'var(--lp-font)' }}>
            Obtaining Keys is <span style={{ color: 'var(--lp-accent)' }}>Easy.</span>
          </h2>
          <p style={{ color: 'var(--lp-text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '20px auto 0', lineHeight: 1.6 }}>
            No technical degrees required. Follow three simple visual loops to secure your developer keys and gain lifetime decoupling.
          </p>
        </div>

        <div className="api-steps">
          <div className="api-step-card">
            <div className="step-num">01</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '22px 0 12px', fontFamily: 'var(--lp-font)', letterSpacing: '-0.01em' }}>Access Provider Consoles</h3>
            <p style={{ color: 'var(--lp-text-muted)', fontSize: '14.5px', lineHeight: 1.6 }}>
              Click directly on any of the official provider dashboard links below. Create your direct developer keys and load a small sandbox balance to run queries without middlemen markups.
            </p>
            <div className="provider-console-grid">
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="provider-console-btn openai-btn">
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <svg className="brand-svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '10px', color: '#10a37f' }}>
                    <path d="M21.3,10.1c0.2-0.6,0.3-1.2,0.1-1.8c-0.2-0.6-0.6-1.1-1.1-1.4l0.1-0.1c0.5-0.3,0.8-0.8,0.9-1.4c0.1-0.6-0.1-1.2-0.4-1.7 c-0.6-0.8-1.7-1.1-2.6-0.6l-2,1.2C15.8,4.1,15.1,4,14.5,4.1c-0.6,0.1-1.2,0.4-1.6,0.8L12.7,4.8C12.4,4.3,11.9,4,11.3,3.9 C10.7,3.8,10.1,4,9.6,4.3c-0.8,0.6-1.1,1.7-0.6,2.6l1.2,2C9.7,9,9.1,9.1,8.5,9c-0.6-0.1-1.2-0.4-1.6-0.8L6.8,8.3 C6.5,8.8,6,9.1,5.4,9.2C4.8,9.3,4.2,9.1,3.7,8.8c-0.8-0.6-1.9-0.3-2.5,0.5c-0.6,0.8-0.3,1.9,0.5,2.5l2,1.2C3.6,13.1,3.5,13.8,3.6,14.4 c0.1,0.6,0.4,1.2,0.8,1.6L4.3,16.1c-0.5,0.3-0.8,0.8-0.9,1.4C3.3,18.1,3.5,18.7,3.8,19.2c0.6,0.8,1.7,1.1,2.6,0.6l2-1.2 c0.5,0.3,1.2,0.4,1.8,0.3c0.6-0.1,1.2-0.4,1.6-0.8l0.2,0.1c0.3,0.5,0.8,0.8,1.4,0.9c0.6,0.1,1.2-0.1,1.7-0.4 c0.8-0.6,1.1-1.7,0.6-2.6l-1.2-2c0.5-0.1,1.1-0.2,1.7-0.1c0.6,0.1,1.2,0.4,1.6,0.8l0.1-0.1c0.3-0.5,0.8-0.8,1.4-0.9 c0.6-0.1,1.2,0.1,1.7,0.4C22.1,12.7,22.1,11.3,21.3,10.1z M12,14c-1.1,0-2-0.9-2-2s0.9-2,2-2s2,0.9,2,2S13.1,14,12,14z" />
                  </svg>
                  OpenAI
                </span>
                <ArrowUpRight size={14} className="console-arrow" />
              </a>
              <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" className="provider-console-btn anthropic-btn">
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <svg className="brand-svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '10px', color: '#d97706' }}>
                    <path d="M17.5,19h-2.2l-1.5-4.5H10.2L8.7,19H6.5L11,5h2L17.5,19z M13.1,12.5L12,9.2l-1.1,3.3H13.1z" />
                  </svg>
                  Anthropic
                </span>
                <ArrowUpRight size={14} className="console-arrow" />
              </a>
              <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="provider-console-btn gemini-btn">
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <svg className="brand-svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '10px', color: '#4285f4' }}>
                    <path d="M12,2c0,0,0,10,10,10c0,0,-10,0,-10,10c0,0,0,-10,-10,-10c0,0,10,0,10,-10Z" />
                  </svg>
                  Gemini
                </span>
                <ArrowUpRight size={14} className="console-arrow" />
              </a>
              <a href="https://platform.deepseek.com/" target="_blank" rel="noreferrer" className="provider-console-btn deepseek-btn">
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <svg className="brand-svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '10px', color: '#2563eb' }}>
                    <path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,17c-2.76,0-5-2.24-5-5s2.24-5,5-5s5,2.24,5,5S14.76,17,12,17z" />
                  </svg>
                  DeepSeek
                </span>
                <ArrowUpRight size={14} className="console-arrow" />
              </a>
              <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="provider-console-btn openrouter-btn">
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <svg className="brand-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px', color: '#7c3aed' }}>
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  OpenRouter
                </span>
                <ArrowUpRight size={14} className="console-arrow" />
              </a>
              <a href="https://console.x.ai/" target="_blank" rel="noreferrer" className="provider-console-btn grok-btn">
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <svg className="brand-svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '10px', color: '#fff' }}>
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Grok (xAI)
                </span>
                <ArrowUpRight size={14} className="console-arrow" />
              </a>
            </div>
          </div>
          
          <div className="api-step-card">
            <div className="step-num">02</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '22px 0 12px', fontFamily: 'var(--lp-font)', letterSpacing: '-0.01em' }}>Generate Secret Key</h3>
            <p style={{ color: 'var(--lp-text-muted)', fontSize: '14.5px', lineHeight: 1.6 }}>
              Click 'Create new secret key' inside their console settings. Copy the private string. Load small funding balances (e.g. $5) to fuel thousands of standard prompts with absolute safety.
            </p>
          </div>

          <div className="api-step-card" style={{ position: 'relative' }}>
            <div className="api-step-highlight"></div>
            <div className="step-num" style={{ color: 'var(--lp-accent-light)' }}>03</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '22px 0 12px', fontFamily: 'var(--lp-font)', letterSpacing: '-0.01em' }}>Lock in Local Vault</h3>
            <p style={{ color: 'var(--lp-text-muted)', fontSize: '14.5px', lineHeight: 1.6 }}>
              Paste your copied keys directly into the local PromptForge Vault console. Keys are encrypted and run locally inside your browser sandbox. No server databases, no middleman scrapes.
            </p>
          </div>
        </div>

        {/* Dynamic secure terminal active loop */}
        <TerminalSimulator />
      </section>

      <ShaderLine />

      {/* --- INVENTED DUAL-SYSTEM MOTION CENTER (DIMENSIONAL PARALLAX GLIDE) --- */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '25px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <span className="tag-premium" style={{ color: 'var(--lp-cyan)', borderColor: 'var(--lp-cyan-glow)' }}>ALL-IN-ONE SYSTEM CORE</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, marginTop: '16px', letterSpacing: '-0.03em', fontFamily: 'var(--lp-font)' }}>Dynamic Studio Control Center</h2>
          <p style={{ color: 'var(--lp-text-muted)', fontSize: '14.5px', marginTop: '8px', maxWidth: '650px', margin: '0 auto', fontFamily: 'var(--lp-font)' }}>
            Hover over the interactive workspace mockup below to see how PromptForge organizes all your AI workflows in a single, high-fidelity browser client.
          </p>
        </div>
        <DimensionalParallaxGlide />
      </section>

      <ShaderLine />

      {/* --- FOOTER CTA SECTION --- */}
      <section className="footer-cta" style={{ background: 'linear-gradient(to top, rgba(124, 92, 252, 0.06) 0%, transparent 100%)' }}>
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <div style={{ fontSize: '11px', color: 'var(--lp-cyan)', fontWeight: 900, letterSpacing: '4px', marginBottom: '20px', fontFamily: 'Space Grotesk' }}>FREE TO USE — BRING YOUR OWN KEYS</div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)', fontWeight: 800, marginBottom: '16px', fontFamily: 'var(--lp-font)', letterSpacing: '-0.03em' }}>Start Building Today</h2>
          <p style={{ color: 'var(--lp-text-muted)', marginBottom: '40px', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto 40px' }}>PromptForge is free to use. Add your own API keys from OpenAI, Anthropic, or Google — pay only raw token costs directly to the provider. No subscription. No platform markup.</p>
          <button className="lp-btn lp-btn-primary" style={{ margin: '0 auto', fontSize: '17px', padding: '18px 46px' }} onClick={() => navigate('/dashboard')}>
            Launch Free Workspace <ArrowRight size={20} />
          </button>
        </motion.div>
      </section>

      <Footer />
      <WhiteLabelModal isOpen={whiteLabelOpen} onClose={() => setWhiteLabelOpen(false)} />
    </div>
  );
};

export default LandingPage;