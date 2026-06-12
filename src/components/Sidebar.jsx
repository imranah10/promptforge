import React from 'react';
import { 
  LayoutDashboard, PenTool, GitCompare, Code2, MessageSquare, 
  Key, Share2, Languages, DollarSign, Briefcase,
  Zap, Search, Library, Wand2, Database, Archive, FileText,
  PanelLeftClose, PanelRightClose, Globe, Lightbulb, BookOpen,
  Sun, Moon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AppContext } from '../context/AppContext';

const Sidebar = ({ activePage, onNavigate, isOpen, isCollapsed, onToggleCollapse, theme, onToggleTheme }) => {
  const [tooltip, setTooltip] = React.useState(null);
  const { setWhiteLabelOpen } = React.useContext(AppContext);

  const handleMouseEnter = (e, label) => {
    if (!isCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      label,
      top: rect.top + rect.height / 2,
      left: rect.right + 10
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const NavItem = ({ id, icon: Icon, label, badge, badgeClass }) => (
    <div 
      className={`nav-item ${activePage === id ? 'active' : ''}`} 
      onClick={() => onNavigate(id)}
      onMouseEnter={(e) => handleMouseEnter(e, label)}
      onMouseLeave={handleMouseLeave}
    >
      <Icon size={18} className="icon" /> 
      {!isCollapsed && <span className="item-label">{label}</span>}
      {!isCollapsed && badge && <span className={`nav-badge ${badgeClass}`}>{badge}</span>}
    </div>
  );

  return (
    <>
    <nav className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`} id="sidebar">
      <div className="sidebar-logo">
        <a className="logo-mark" href="#" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>
          <div className="logo-icon"><Zap size={20} color="#fff" /></div>
        </a>
        <button className="collapse-toggle" onClick={onToggleCollapse} title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
          {isCollapsed ? <PanelRightClose size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <div className="sidebar-menu-container">
        <div className="nav-section">
          {!isCollapsed && <div className="nav-label">Studio</div>}
          <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="chatdata" icon={FileText} label="Chat With Data" badge="Pro" badgeClass="badge-hot" />
          <NavItem id="optimizer" icon={Wand2} label="Prompt Optimizer" badge="Magic" badgeClass="badge-pro" />
          <NavItem id="aiwriter" icon={PenTool} label="AI Writer" />
          <NavItem id="creator" icon={Share2} label="Social Media AI" />
          <NavItem id="library" icon={Library} label="Prompt Library" badge="60+" badgeClass="badge-pro" />
          <NavItem id="compare" icon={GitCompare} label="Model Compare" />
          <NavItem id="codehelper" icon={Code2} label="Code Helper" />
          <NavItem id="datawizard" icon={Database} label="Data Wizard" badge="New" badgeClass="badge-new" />
          <NavItem id="seo" icon={Search} label="SEO Optimizer" />
          <NavItem id="search" icon={Globe} label="The Spider" badge="Deep" badgeClass="badge-hot" />
          <NavItem id="inventor" icon={Lightbulb} label="The Inventor" badge="Future" badgeClass="badge-new" />
          <NavItem id="vault" icon={Archive} label="History Vault" />
          <NavItem id="keys" icon={Key} label="API Keys" />
          <NavItem id="docs" icon={BookOpen} label="Docs" badge="New" badgeClass="badge-new" />
        </div>

        <div className="nav-section">
          {!isCollapsed && <div className="nav-label">Business</div>}
          <NavItem id="sellearn" icon={DollarSign} label="Sell & Earn" />
          <div 
            className="nav-item" 
            onClick={() => setWhiteLabelOpen(true)}
            onMouseEnter={(e) => handleMouseEnter(e, "White-Label")}
            onMouseLeave={handleMouseLeave}
            style={{ color: 'var(--lp-accent-light)', borderColor: 'rgba(124, 92, 252, 0.15)' }}
          >
            <Briefcase size={18} className="icon" style={{ color: 'var(--accent2)' }} /> 
            {!isCollapsed && <span className="item-label" style={{ fontWeight: 600 }}>White-Label</span>}
            {!isCollapsed && <span className="nav-badge badge-pro">Enterprise</span>}
          </div>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="theme-switcher-wrapper" style={{ marginBottom: isCollapsed ? '16px' : '12px' }}>
          <button onClick={onToggleTheme} className="sidebar-theme-btn" title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {!isCollapsed && <span className="theme-btn-label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
        </div>
        <div className="status-dot">
          <div className="dot"></div> {!isCollapsed && "All systems live"}
        </div>
      </div>
      
      <style jsx="true">{`
        .fixed-tooltip {
          position: fixed;
          transform: translateY(-50%);
          background: rgba(10, 10, 20, 0.95);
          backdrop-filter: blur(8px);
          border: 1px solid var(--accent);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          pointer-events: none;
          z-index: 99999;
          box-shadow: 0 4px 12px rgba(124,92,252,0.3);
          animation: tooltipFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateY(-50%) translateX(-10px); }
          to { opacity: 1; transform: translateY(-50%) translateX(0); }
        }

        .sidebar {
          width: var(--sidebar);
          background: var(--bg2);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 100;
          overflow: hidden;
          transition: width 0.3s ease, transform 0.3s ease;
        }
        .sidebar-menu-container {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color: rgba(124, 92, 252, 0.2) transparent;
        }
        .sidebar-menu-container::-webkit-scrollbar {
          width: 5px;
        }
        .sidebar-menu-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-menu-container::-webkit-scrollbar-thumb {
          background: rgba(124, 92, 252, 0.2);
          border-radius: 10px;
        }
        .sidebar-menu-container::-webkit-scrollbar-thumb:hover {
          background: rgba(124, 92, 252, 0.4);
        }
        .sidebar.collapsed .sidebar-menu-container {
          scrollbar-width: none;
        }
        .sidebar.collapsed .sidebar-menu-container::-webkit-scrollbar {
          display: none;
        }
        .sidebar.collapsed { width: 80px; }
        .sidebar.collapsed .nav-item { justify-content: center !important; padding: 14px 0 !important; }
        .sidebar.collapsed .nav-section { padding: 16px 8px 8px; }
        .sidebar.collapsed .status-dot { justify-content: center; }

        .sidebar-logo {
          padding: 24px 16px 20px;
          border-bottom: 1px solid var(--border2);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sidebar.collapsed .sidebar-logo { padding: 24px 0 20px; flex-direction: column; align-items: center; gap: 24px; }
        .sidebar.collapsed .logo-mark { justify-content: center; width: 100%; }

        .collapse-toggle {
          background: transparent; border: none; color: var(--text3); cursor: pointer;
          display: flex; align-items: center; justify-content: center; padding: 4px;
          border-radius: 6px; transition: 0.2s;
        }
        .collapse-toggle:hover { color: var(--text); background: rgba(255,255,255,0.05); }

        .logo-mark {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .logo-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, var(--accent), var(--accent3));
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 0 16px var(--glow);
        }
        .logo-text { font-family: var(--font-head); font-weight: 800; font-size: 18px; color: var(--text); }
        .logo-text span { color: var(--accent2); }
        .logo-sub { font-size: 10px; color: var(--text3); letter-spacing: 0.5px; margin-top: 2px; }

        .nav-section { padding: 16px 12px 8px; }
        .nav-label { font-size: 10px; font-weight: 600; letter-spacing: 1.5px; color: var(--text3); text-transform: uppercase; padding: 0 8px 8px; }
        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 10px;
          cursor: pointer; transition: all 0.2s;
          color: var(--text2); font-size: 14px; font-weight: 500;
          margin-bottom: 2px;
          border: 1px solid transparent;
          user-select: none;
          position: relative;
        }
        .nav-item:hover { background: rgba(124,92,252,0.1); color: var(--text); border-color: var(--border); }
        
        .nav-item.active {
          background: linear-gradient(135deg, rgba(124,92,252,0.2), rgba(56,189,248,0.1));
          color: var(--accent2);
          border-color: rgba(124,92,252,0.3);
          box-shadow: inset 0 0 20px rgba(124,92,252,0.05);
        }
        .nav-item .icon { flex-shrink: 0; }
        .item-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        .nav-badge {
          margin-left: auto; font-size: 9px; font-weight: 700; letter-spacing: 0.5px;
          padding: 2px 6px; border-radius: 4px; text-transform: uppercase;
        }
        .badge-new { background: rgba(52,211,153,0.2); color: var(--green); }
        .badge-hot { background: rgba(251,191,36,0.2); color: var(--gold); }
        .badge-pro { background: rgba(124,92,252,0.2); color: var(--accent2); }

        .sidebar-footer {
          margin-top: auto; padding: 16px;
          border-top: 1px solid var(--border2);
        }
        .sidebar-theme-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          background: rgba(124, 92, 252, 0.08);
          border: 1px solid var(--border);
          color: var(--text2);
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .sidebar-theme-btn:hover {
          background: rgba(124, 92, 252, 0.15);
          color: var(--text);
          border-color: var(--accent);
        }
        .sidebar.collapsed .sidebar-theme-btn {
          justify-content: center;
          padding: 8px 0;
        }
        .theme-btn-label {
          white-space: nowrap;
        }
        .status-dot {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; color: var(--text3);
        }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); animation: pulse 2s infinite; flex-shrink: 0; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
        
        @media (max-width: 900px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); width: var(--sidebar) !important; }
          .collapse-toggle { display: none; }
          .nav-item { justify-content: flex-start !important; padding: 10px 12px !important; }
          .item-label { display: block !important; }
        }
      `}</style>
    </nav>
    {tooltip && (
      <div 
        className="fixed-tooltip" 
        style={{ top: tooltip.top, left: tooltip.left }}
      >
        {tooltip.label}
      </div>
    )}
    </>
  );
};

export default Sidebar;
