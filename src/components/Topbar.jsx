import React from 'react';
import { Menu } from 'lucide-react';

const Topbar = ({ title, onToggleSidebar }) => {
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
        <div className="status-dot">
          <div className="dot"></div>
          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>All systems live</span>
        </div>
      </div>

      <style jsx>{`
        .topbar {
          background: rgba(5, 5, 8, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          padding: 0 32px;
          height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 50;
        }
        .topbar-left { display: flex; align-items: center; gap: 16px; }
        .page-title { font-family: var(--font-head); font-size: 18px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        .topbar-right { display: flex; align-items: center; gap: 12px; }
        
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
