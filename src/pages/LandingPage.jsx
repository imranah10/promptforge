import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Wand2, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Code, 
  Database, 
  MessageSquare, 
  Search, 
  BookOpen, 
  ChevronRight, 
  Play, 
  Sparkles,
  Layers,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import Lenis from 'lenis';
import ExplodingObjects from '../components/landing/ExplodingObjects';
import './LandingPage.css';

// --- ADVANCED UI COMPONENTS ---

const CursorFollower = () => {
  const followerRef = useRef(null);

  useEffect(() => {
    const moveFollower = (e) => {
      if (followerRef.current) {
        followerRef.current.style.transform = `translate3d(${e.clientX - 10}px, ${e.clientY - 10}px, 0)`;
      }
    };
    window.addEventListener('mousemove', moveFollower);
    return () => window.removeEventListener('mousemove', moveFollower);
  }, []);

  return <div ref={followerRef} className="cursor-follower" />;
};

const MagneticButton = ({ children, className, onClick, style }) => {
  const ref = useRef(null);
  const x = useSpring(0, { stiffness: 150, damping: 15 });
  const y = useSpring(0, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    x.set((clientX - centerX) * 0.4);
    y.set((clientY - centerY) * 0.4);
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
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * window.innerWidth, 
            y: Math.random() * window.innerHeight,
            opacity: Math.random() * 0.5 
          }}
          animate={{
            y: [null, Math.random() * -100, Math.random() * 100],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ duration: 5 + Math.random() * 10, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute',
            width: '2px',
            height: '2px',
            background: 'white',
            borderRadius: '50%',
            filter: 'blur(1px)'
          }}
        />
      ))}
    </div>
  );
};

// --- SUB-COMPONENTS ---

const Logo = () => (
  <div className="nav-logo-wrap" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
    <img src="/logo.png" alt="PF" className="nav-logo-img" />
    <span className="nav-logo-text">
      PROMPT<span style={{ color: 'var(--lp-accent)', marginLeft: '4px' }}>FORGE</span>
    </span>
  </div>
);

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="lp-navbar">
      <Logo />
      
      {/* Desktop Links */}
      <div className="nav-links desktop-only">
        <a href="#features" className="nav-link">Features</a>
        <a href="#tools" className="nav-link">Tools</a>
        <a href="#architecture" className="nav-link">Architecture</a>
        <a href="#pricing" className="nav-link">Pricing</a>
        <MagneticButton className="lp-btn lp-btn-primary" onClick={() => navigate('/dashboard')} style={{ padding: '10px 24px', fontSize: '14px' }}>
          Launch App
        </MagneticButton>
      </div>

      {/* Mobile Toggle */}
      <button className="mobile-toggle" onClick={() => setIsOpen(true)}>
        <Menu size={24} />
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="mobile-menu"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="mobile-menu-header">
              <Logo />
              <button className="mobile-close" onClick={() => setIsOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="mobile-links">
              <a href="#features" className="mobile-link" onClick={() => setIsOpen(false)}>Features</a>
              <a href="#tools" className="mobile-link" onClick={() => setIsOpen(false)}>Tools</a>
              <a href="#architecture" className="mobile-link" onClick={() => setIsOpen(false)}>Architecture</a>
              <a href="#pricing" className="mobile-link" onClick={() => setIsOpen(false)}>Pricing</a>
              <button className="lp-btn lp-btn-primary" onClick={() => { setIsOpen(false); navigate('/dashboard'); }} style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}>
                Launch App
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="lp-footer">
    <div className="footer-grid">
      <div className="footer-col">
        <Logo />
        <p style={{ marginTop: '16px', color: 'rgba(255,255,255,0.4)', maxWidth: '250px', fontSize: '13px' }}>
          The definitive AI workbench for creators and engineers. 
          Efficiency, privacy, and power in one studio.
        </p>
      </div>
      <div className="footer-col">
        <h4>Product</h4>
        <div className="footer-links">
          <a href="#" className="footer-link">Features</a>
          <a href="#" className="footer-link">Tools</a>
          <a href="#" className="footer-link">BYOK Model</a>
          <a href="#" className="footer-link">Security</a>
        </div>
      </div>
      <div className="footer-col">
        <h4>Resources</h4>
        <div className="footer-links">
          <a href="#" className="footer-link">Documentation</a>
          <a href="#" className="footer-link">API Guide</a>
          <a href="#" className="footer-link">Prompt Library</a>
          <a href="#" className="footer-link">Community</a>
        </div>
      </div>
      <div className="footer-col">
        <h4>Company</h4>
        <div className="footer-links">
          <a href="#" className="footer-link">About Us</a>
          <a href="#" className="footer-link">Privacy Policy</a>
          <a href="#" className="footer-link">Terms of Service</a>
          <a href="#" className="footer-link">Contact</a>
        </div>
      </div>
    </div>
    <div style={{ borderTop: '1px solid var(--lp-glass-border)', paddingTop: '40px', textAlign: 'center', fontSize: '13px', color: 'var(--lp-text-muted)' }}>
      © 2026 PromptForge. All rights reserved. Your keys, your data.
    </div>
  </footer>
);

const ShowcaseItem = ({ title, desc, features, image, reverse }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div ref={ref} className="showcase-grid" style={{ marginBottom: '120px', direction: reverse ? 'rtl' : 'ltr' }}>
      <motion.div 
        style={{ direction: 'ltr' }}
        initial={{ opacity: 0, x: reverse ? 50 : -50 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.8 }}
      >
        <h3 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', fontWeight: 800, marginBottom: '24px' }}>{title}</h3>
        <p style={{ color: 'var(--lp-text-muted)', fontSize: 'clamp(1rem, 2vw, 1.1rem)', marginBottom: '32px', lineHeight: 1.6 }}>{desc}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {features.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px' }}>
              <div style={{ color: 'var(--lp-accent)' }}><Sparkles size={18} /></div>
              {f}
            </div>
          ))}
        </div>
      </motion.div>
      <motion.div 
        className="showcase-image-wrap"
        initial={{ opacity: 0, scale: 0.9, rotateY: reverse ? -10 : 10 }}
        animate={isInView ? { opacity: 1, scale: 1, rotateY: 0 } : {}}
        transition={{ duration: 1 }}
      >
        <img src={image} alt={title} className="showcase-image" />
      </motion.div>
    </div>
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
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
      style={{ position: 'relative', cursor: 'pointer', padding: '20px', borderBottom: '1px solid var(--lp-glass-border)' }}
    >
      <motion.div
        variants={{
          initial: { y: 0 },
          hover: { y: -10 }
        }}
        style={{ fontSize: '24px', fontWeight: 700 }}
      >
        {text}
      </motion.div>
      <motion.div
        variants={{
          initial: { opacity: 0, y: 10 },
          hover: { opacity: 1, y: 0 }
        }}
        style={{ color: 'var(--lp-accent)', fontSize: '14px', marginTop: '8px' }}
      >
        {subtext}
      </motion.div>
    </motion.div>
  );
};

const CardShuffle = () => {
  const [cards, setCards] = React.useState([
    { id: 1, title: "GPT-4o Elite", desc: "Most intelligent reasoning for complex tasks", color: "#7c5cfc", icon: <Zap size={24} /> },
    { id: 2, title: "Claude 3.5 Pro", desc: "Unmatched creative writing and coding", color: "#38bdf8", icon: <Wand2 size={24} /> },
    { id: 3, title: "Gemini 1.5 Ultra", desc: "Massive 2M context window support", color: "#34d399", icon: <Database size={24} /> },
    { id: 4, title: "Llama 3.3 Open", desc: "Open-source state-of-the-art performance", color: "#f472b6", icon: <Sparkles size={24} /> }
  ]);

  const shuffle = () => {
    setCards([...cards].sort(() => Math.random() - 0.5));
  };

  return (
    <div className="shuffle-container" onClick={shuffle} style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}>
      <div className="ambient-glow" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '400px', height: '400px', opacity: 0.2 }}></div>
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          layout
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: 1 - index * 0.04, 
            opacity: 1,
            y: index * -25,
            x: index * 10,
            zIndex: cards.length - index,
            rotate: index * 2
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{
            position: 'absolute',
            width: '340px',
            height: '220px',
            background: 'linear-gradient(135deg, rgba(20, 20, 35, 0.9) 0%, rgba(10, 10, 20, 0.95) 100%)',
            border: `1px solid ${card.color}44`,
            borderRadius: '24px',
            padding: '30px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxShadow: `0 20px 60px ${card.color}22`,
            backdropFilter: 'blur(20px)',
            borderLeft: `4px solid ${card.color}`
          }}
        >
          <div style={{ color: card.color, marginBottom: '16px' }}>{card.icon}</div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: '22px', marginBottom: '8px' }}>{card.title}</div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{card.desc}</div>
        </motion.div>
      ))}
      <div style={{ position: 'absolute', bottom: '10px', color: 'var(--lp-accent)', fontSize: '13px', fontWeight: 600, letterSpacing: '2px' }}>CLICK TO SHUFFLE MODELS</div>
    </div>
  );
};

const Hover3DCard = ({ children, className }) => {
  const cardRef = useRef(null);
  const x = useSpring(0, { stiffness: 300, damping: 30 });
  const y = useSpring(0, { stiffness: 300, damping: 30 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Limits
    const limitX = 15;
    const limitY = 15;
    
    x.set((mouseY / (rect.height / 2)) * -limitX);
    y.set((mouseX / (rect.width / 2)) * limitY);

    // Set CSS variables for spotlight effect
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
      <div style={{ transform: "translateZ(30px)", height: '100%', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
      <div className="card-glow" />
    </motion.div>
  );
};

const ThreeDSlider = () => {
  const [active, setActive] = useState(0);
  const tools = [
    { title: "Parallel CSV Factory", desc: "Batch process millions of rows with God-mode speed.", icon: <Database />, color: "#7c5cfc", img: "/all_in_one_studio_visual_1778616419210.png" },
    { title: "Prompt Hacker", desc: "Reverse engineer any AI output to find the hidden logic.", icon: <Search />, color: "#38bdf8", img: "/promptforge_hero_visual_1778616354046.png" },
    { title: "The Spider", desc: "Deep-web scraping engine for real-time knowledge synthesis.", icon: <Zap />, color: "#f59e0b", img: "/ai_neural_nodes_visual_1778616393421.png" },
    { title: "Image Studio Pro", desc: "Full control over every pixel with DALL-E & Flux.", icon: <ImageIcon />, color: "#ec4899", img: "/media__1778617138422.png" }
  ];

  return (
    <div className="orbital-showcase-wrap">
      <div className="section-header" style={{ textAlign: 'center', marginBottom: '80px' }}>
        <div className="badge" style={{ margin: '0 auto 16px' }}>MASTER SUITE</div>
        <h2 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 900, letterSpacing: '-2px' }}>
          The Ultimate <span style={{ color: 'var(--lp-accent)' }}>Suite</span>
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem', maxWidth: '600px', margin: '20px auto 0' }}>
          Professional tools designed for elite AI engineering workflows.
        </p>
      </div>

      <div className="orbital-container">
        <div className="orbital-inner">
          {tools.map((tool, i) => {
            const isActive = active === i;
            const offset = i - active;
            return (
              <motion.div
                key={i}
                className={`orbital-card ${isActive ? 'active' : ''}`}
                animate={{
                  scale: isActive ? 1.1 : 0.8,
                  opacity: Math.abs(offset) > 1 ? 0 : 1 - Math.abs(offset) * 0.4,
                  x: offset * 340,
                  z: isActive ? 100 : -100,
                  rotateY: offset * -25,
                }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
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
                  {isActive && <div className="orbital-active-glow" style={{ boxShadow: `0 0 60px ${tool.color}44` }} />}
                </div>
              </motion.div>
            );
          })}
        </div>
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

// --- MAIN PAGE ---

const LandingPage = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  
  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const dashboardY = useTransform(scrollYProgress, [0, 0.25], [100, 0]);
  const dashboardScale = useTransform(scrollYProgress, [0, 0.3], [0.85, 1.1]);

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
      <div className="ambient-glow" style={{ top: '10%', left: '10%' }}></div>
      <div className="ambient-glow" style={{ bottom: '10%', right: '10%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)' }}></div>

      {/* --- HERO SECTION --- */}
      <section ref={heroRef} className="hero" style={{ paddingBottom: '0' }}>
        <motion.div style={{ scale: heroScale, opacity: heroOpacity }}>
          <RevealText>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--lp-accent)', fontWeight: 600, fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>
              <Sparkles size={16} /> Elite AI Workbench
            </div>
          </RevealText>
          <RevealText className="hero-title">
            <span style={{ background: 'linear-gradient(to right, #fff, #7c5cfc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.1em', fontWeight: 900 }}>Your Keys. Your Data.</span> <br /> 
            <span style={{ opacity: 0.9 }}>Your Intelligence.</span>
          </RevealText>
          <RevealText>
            <p className="hero-subtitle" style={{ maxWidth: '750px', margin: '24px auto 48px', fontSize: 'clamp(1rem, 4vw, 1.25rem)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
              The professional All-in-One AI Studio. 
              Switch between 30+ models instantly with BYOK (Bring Your Own Keys) 
              and save up to 90% on subscription costs.
            </p>
          </RevealText>
          <div className="hero-cta-group" style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
            <MagneticButton className="lp-btn lp-btn-primary" onClick={() => navigate('/dashboard')} style={{ padding: '24px 48px', fontSize: '18px', fontWeight: 700 }}>
              Get Started Now <ArrowRight size={20} />
            </MagneticButton>
            <MagneticButton className="lp-btn lp-btn-outline" onClick={() => window.scrollTo({ top: 900, behavior: 'smooth' })} style={{ padding: '24px 48px', fontSize: '18px', fontWeight: 600 }}>
              Explore Tools <ChevronRight size={20} />
            </MagneticButton>
          </div>
        </motion.div>

        {/* Immersive Dashboard Preview Zoom */}
        <motion.div 
          className="dashboard-preview"
          style={{ 
            y: dashboardY, 
            scale: dashboardScale,
            width: '95%',
            maxWidth: '1300px',
            height: '700px',
            background: 'rgba(20, 20, 35, 0.3)',
            borderRadius: '32px',
            border: '1px solid var(--lp-glass-border)',
            boxShadow: '0 50px 150px rgba(0,0,0,0.8)',
            marginBottom: '180px',
            overflow: 'hidden',
            position: 'relative',
            backdropFilter: 'blur(20px)'
          }}
        >
          <img 
            src="/promptforge_hero_visual_1778616354046.png" 
            alt="Dashboard Preview" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
          />
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to top, #030308, transparent)' }}></div>
        </motion.div>
      </section>

      {/* --- FEATURES BENTO --- */}
      <section id="features" className="bento-section" style={{ padding: '60px 20px' }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div className="badge" style={{ margin: '0 auto 16px' }}>ELITE CAPABILITIES</div>
          <h2 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 900, letterSpacing: '-2px' }}>
            Next-Gen <span style={{ color: 'var(--lp-accent)' }}>Features</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.2rem', maxWidth: '600px', margin: '20px auto 0' }}>
            A modular ecosystem designed for the world's most demanding AI engineers.
          </p>
        </div>
        <div className="bento-container" style={{ gap: '24px' }}>
          <Hover3DCard className="bento-card bento-wide">
            <div className="bento-icon"><Zap size={24} /></div>
            <h3 className="bento-title" style={{ fontSize: '28px' }}>BYOK Architecture</h3>
            <p className="bento-desc" style={{ fontSize: '16px' }}>
              Bring Your Own Keys. No monthly subscription markups. 
              You pay the AI providers (OpenAI, Anthropic) directly for what you use. 
              Save up to $200/year while gaining 100% data privacy.
            </p>
          </Hover3DCard>

          <Hover3DCard className="bento-card bento-tall">
            <div className="bento-icon"><Database size={24} /></div>
            <h3 className="bento-title" style={{ fontSize: '28px' }}>Document Intelligence</h3>
            <p className="bento-desc" style={{ fontSize: '16px' }}>
              Upload PDFs, CSVs, and images. Our built-in OCR and Vector Engine 
              allow you to chat with multiple documents simultaneously. 
              Compare data, extract insights, and analyze at scale.
            </p>
          </Hover3DCard>

          <Hover3DCard className="bento-card">
            <div className="bento-icon"><ImageIcon size={24} /></div>
            <h3 className="bento-title">30+ AI Models</h3>
            <p className="bento-desc">Switch between GPT-4o, Claude 3.5, Gemini, and DeepSeek in one click.</p>
          </Hover3DCard>

          <Hover3DCard className="bento-card">
            <div className="bento-icon"><Code size={24} /></div>
            <h3 className="bento-title">Prompt Library</h3>
            <p className="bento-desc">60+ battle-tested prompts across 6 categories ready to deploy.</p>
          </Hover3DCard>

          <Hover3DCard className="bento-card bento-wide">
            <div className="bento-icon"><Sparkles size={24} /></div>
            <h3 className="bento-title">Creator Studio</h3>
            <p className="bento-desc">
              Viral content engine for 7+ platforms. 
              From Instagram Reels to LinkedIn thought-leadership, 
              generate platform-optimized content that actually performs.
            </p>
          </Hover3DCard>
        </div>
      </section>

      {/* --- SHOWCASE SECTION --- */}
      <section className="showcase-section" style={{ padding: '80px 20px' }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '80px' }}>
          <RevealText>
            <h2 style={{ fontSize: 'clamp(2rem, 10vw, 4.5rem)', fontWeight: 900, letterSpacing: '-2px' }}>Professional Tools. <br /> <span style={{ color: 'var(--lp-accent)' }}>Genuine Results.</span></h2>
          </RevealText>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'clamp(1rem, 3vw, 1.4rem)', marginTop: '20px', fontWeight: 500 }}>No gimmicks. No fake features. Pure AI power.</p>
        </div>

        <ShowcaseItem 
          title="Image Studio Pro"
          desc="The ultimate command center for AI visuals. Engineer prompts for Midjourney or generate directly with Flux and DALL-E 3."
          features={[
            "9 Art Styles & 6 Aspect Ratios",
            "Built-in Mood & Lighting controls",
            "High-Res direct downloads",
            "Advanced Prompt Engineering logic"
          ]}
          image="/all_in_one_studio_visual_1778616419210.png"
        />

        <ShowcaseItem 
          reverse
          title="Natural AI Translator"
          desc="Break language barriers with context-aware translation. Not robotic machine translation, but human-quality nuance."
          features={[
            "50+ Languages supported",
            "10 Indian regional languages",
            "6 Translation Styles (Formal to Casual)",
            "Context & Tone preservation"
          ]}
          image="/promptforge_hero_visual_1778616354046.png"
        />

        <ShowcaseItem 
          title="Cinematic Video Engine"
          desc="Master AI video with precision. Create detailed prompts for Sora, Runway, and Kling with cinematic control."
          features={[
            "8 Camera Motion presets",
            "Technical specification output",
            "Duration & Atmosphere controls",
            "Audio/Sound engineering notes"
          ]}
          image="/ai_neural_nodes_visual_1778616393421.png"
        />
      </section>

      {/* --- 3D SLIDER SECTION --- */}
      <section id="tools">
        <ThreeDSlider />
      </section>

      {/* --- SHUFFLE & REVEAL SECTION --- */}
      <section className="shuffle-section" style={{ padding: '40px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', maxWidth: '1200px', margin: '0 auto', alignItems: 'center' }}>
        <div>
          <RevealText>
            <h2 style={{ fontSize: 'clamp(2rem, 8vw, 3rem)', fontWeight: 800, marginBottom: '40px' }}>Built for the <br /> Model Agnostic</h2>
          </RevealText>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <HoverRevealEffect text="Context Precision" subtext="Optimized for massive token windows" />
            <HoverRevealEffect text="Latent Reasoning" subtext="Advanced chain-of-thought support" />
            <HoverRevealEffect text="Global Scaling" subtext="Localized inference at scale" />
          </div>
        </div>
        <CardShuffle />
      </section>

      <section id="architecture" className="architecture-section" style={{ padding: '60px 20px', maxWidth: '1400px', margin: '0 auto' }}>
        <div className="section-divider" />
        <RevealText>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: 'clamp(2.5rem, 10vw, 4rem)', fontWeight: 900, letterSpacing: '-2px' }}>Advanced Architecture</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'clamp(1rem, 3vw, 1.2rem)', marginTop: '10px' }}>Interactive 3D clusters showcasing our core technology.</p>
          </div>
        </RevealText>
        <ExplodingObjects />
      </section>

      {/* --- SAVINGS CALCULATOR --- */}
      <section className="calc-section">
        <div className="calc-container">
          <div className="text-left">
            <div className="badge">ECONOMICS OF AI</div>
            <h2 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '32px' }}>
              Stop Overpaying for <span style={{ color: 'var(--lp-accent)' }}>Access.</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem', lineHeight: 1.6, marginBottom: '40px' }}>
              Big AI companies charge a massive "Convenience Tax". We remove the middleman, 
              connecting you directly to the source. Save thousands over the lifetime of your work.
            </p>
            
            <div className="comparison-box">
              <div className="comp-item">
                <div>
                  <div style={{ fontWeight: 800, fontSize: '18px' }}>Individual Subscriptions</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>ChatGPT + Claude + Gemini</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#f87171' }}>$60.00<span style={{ fontSize: '14px', opacity: 0.5 }}>/mo</span></div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>$720.00 / YEAR</div>
                </div>
              </div>

              <div className="comp-item highlight">
                <div>
                  <div style={{ fontWeight: 800, fontSize: '18px' }}>PromptForge (BYOK)</div>
                  <div style={{ fontSize: '12px', color: 'var(--lp-accent)', marginTop: '4px' }}>Pure API Usage Cost (Average)</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#34d399' }}>~$2.40<span style={{ fontSize: '14px', opacity: 0.5 }}>/mo</span></div>
                  <div className="save-badge">SAVE 96%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="calc-card">
            <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>Savings Calculator</h3>
            <div className="calc-slider-wrap">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Your Monthly Usage</span>
                <span style={{ color: 'var(--lp-accent)', fontWeight: 800 }}>Light to Moderate</span>
              </div>
              <input type="range" className="calc-slider" min="1" max="100" defaultValue="30" />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                <span>CASUAL</span>
                <span>PRO USER</span>
                <span>GOD MODE</span>
              </div>
            </div>

            <div style={{ marginTop: '40px', padding: '24px', background: 'rgba(0,0,0,0.3)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
               <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>YEAR 1 PROJECTED COST</div>
               <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '48px', fontWeight: 900 }}>$78</span>
                  <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)' }}>VS $720</span>
               </div>
               <p style={{ fontSize: '13px', color: '#34d399', fontWeight: 600, marginTop: '16px' }}>
                 *Including $49 one-time lifetime license.
               </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- API ONBOARDING GUIDE --- */}
      <section className="api-guide-section">
        <div className="section-header" style={{ textAlign: 'center' }}>
          <div className="badge" style={{ margin: '0 auto 16px' }}>FRICTIONLESS SETUP</div>
          <h2 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 900, letterSpacing: '-2px' }}>
            New to <span style={{ color: 'var(--lp-accent)' }}>API Keys?</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem', maxWidth: '600px', margin: '20px auto 0' }}>
            We've removed the technical barrier. Getting your keys is now as easy as 1-2-3.
          </p>
        </div>

        <div className="api-steps">
          <div className="api-step-card">
            <div className="step-num">01</div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '24px 0 16px' }}>Choose Provider</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: 1.6 }}>
              Select OpenAI, Anthropic, or Google. We provide direct links to their developer dashboards. No searching required.
            </p>
          </div>
          <div className="api-step-card">
            <div className="step-num">02</div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '24px 0 16px' }}>Generate Key</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: 1.6 }}>
              Click 'Create Secret Key' on their official site. Copy the string. Our visual guide shows you exactly where to click.
            </p>
          </div>
          <div className="api-step-card">
            <div className="api-step-highlight" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: '1px solid var(--lp-accent)', borderRadius: '32px', opacity: 0.2 }}></div>
            <div className="step-num">03</div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '24px 0 16px' }}>Paste & Power Up</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: 1.6 }}>
              Paste the key into PromptForge's secure vault. Your keys stay in your browser, encrypted and private.
            </p>
          </div>
        </div>
      </section>

      {/* --- PARALLAX STORYTELLING --- */}
      <section className="parallax-story" style={{ height: '150vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'sticky', top: '50%', transform: 'translateY(-50%)', textAlign: 'center', maxWidth: '900px', padding: '0 20px' }}>
          <motion.h2 
            style={{ fontSize: 'clamp(2.5rem, 10vw, 5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '40px' }}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            The Future is <br /> <span style={{ color: 'var(--lp-accent)' }}>Decentralized.</span>
          </motion.h2>
          <motion.p 
            style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            PromptForge is more than a dashboard. It’s a commitment to efficiency, 
            privacy, and total control. By removing the middleman, we’ve created 
            a workbench that scales with your ambition, not your subscription plan.
          </motion.p>
        </div>
      </section>

      {/* --- FOOTER CTA --- */}
      <section id="pricing" className="footer-cta" style={{ padding: '150px 20px', textAlign: 'center', background: 'linear-gradient(to top, rgba(124, 92, 252, 0.05), transparent)' }}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <div style={{ fontSize: '14px', color: 'var(--lp-accent)', fontWeight: 700, letterSpacing: '3px', marginBottom: '16px' }}>LIMITED TIME OFFER</div>
          <h2 style={{ fontSize: 'clamp(2.5rem, 10vw, 4rem)', fontWeight: 800, marginBottom: '20px' }}>$49 Lifetime Access</h2>
          <p style={{ color: 'var(--lp-text-muted)', marginBottom: '40px', fontSize: '1.1rem' }}>No monthly fees. No hidden costs. Your own API, your own freedom.</p>
          <button className="lp-btn lp-btn-primary" style={{ margin: '0 auto', fontSize: '20px', padding: '20px 48px' }} onClick={() => navigate('/dashboard')}>
            Claim Your Workbench <ArrowRight size={24} />
          </button>
        </motion.div>
      </section>
      <Footer />
    </div>
  );
};

export default LandingPage;
