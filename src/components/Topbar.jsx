
import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';

const Topbar = ({ title, onToggleSidebar, theme, onToggleTheme }) => {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <button id="menu-toggle" className="menu-toggle" onClick={onToggleSidebar}>
          <Menu size={24} color="var(--text)" />
        </button>
        <div>
          <div className="page-title">{title}</div>
        </div>
      </div>
      <div className="topbar-right">
        <button onClick={onToggleTheme} className="theme-toggle-btn" title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="status-dot">
          <div className="dot"></div>
          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>All systems live</span>
        </div>
      </div>

      <style jsx>{`
        .topbar {
          background: var(--card);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          padding: 0 32px;
          height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 50;
        }
        .topbar-left { display: flex; align-items: center; gap: 16px; }
        .page-title { font-family: var(--font-head); font-size: 18px; font-weight: 700; color: var(--text); }
        .topbar-right { display: flex; align-items: center; gap: 12px; }
        
        .theme-toggle-btn {
          background: rgba(124, 92, 252, 0.08);
          border: 1px solid var(--border);
          border-radius: 50%;
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
          color: var(--text);
        }
        .theme-toggle-btn:hover {
          background: rgba(124, 92, 252, 0.15);
          border-color: var(--accent);
          box-shadow: 0 0 12px var(--glow);
        }
        
        .menu-toggle { display: none; background: none; border: none; cursor: pointer; padding: 4px; }
        .status-dot {
          display: flex; align-items: center; gap: 8px;
        }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); animation: pulse 2s infinite; }

        @media (max-width: 900px) {
          .menu-toggle { display: flex; }
          .topbar { padding: 0 16px; }
        }
      `}</style>
    </div>
  );
};

export default Topbar;
