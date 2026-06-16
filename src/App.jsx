import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import WhiteLabelModal from './components/WhiteLabelModal';
import Topbar from './components/Topbar';
import ModelSelector from './components/ModelSelector';
import Dashboard from './pages/Dashboard';
import AIWriter from './pages/AIWriter';
import CreatorStudio from './pages/CreatorStudio';
import ModelCompare from './pages/ModelCompare';
import CodeHelper from './pages/CodeHelper';
import ApiKeys from './pages/ApiKeys';
import PricingPage from './pages/PricingPage';
import SellAndEarn from './pages/SellAndEarn';
import SEOOptimizer from './pages/SEOOptimizer';
import PromptLibrary from './pages/PromptLibrary';
import PromptOptimizer from './pages/PromptOptimizer';
import DataWizard from './pages/DataWizard';
import ChatWithData from './pages/ChatWithData';
import Vault from './pages/Vault';
import TheSpider from './pages/TheSpider';
import TheInventor from './pages/TheInventor';
import Docs from './pages/Docs';
import Toast from './components/Toast';
import { AppProvider, AppContext } from './context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import LandingPage from './pages/LandingPage';

function DashboardLayout({ theme, onToggleTheme }) {
  const { whiteLabelOpen, setWhiteLabelOpen } = useContext(AppContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const activePage = location.pathname.split('/').pop() || 'dashboard';

  const titles = {
    dashboard:'Dashboard', optimizer: 'Prompt Optimizer', aiwriter:'AI Writer', 
    creator:'Creator Studio',
    compare:'Model Compare', codehelper:'Code Helper', datawizard: 'Data Wizard', chatdata: 'Chat With Data',
    vault: 'Generation Vault', keys:'API Keys', 
    sellearn:'Sell & Earn', seo: 'SEO Optimizer', library: 'Prompt Library', search: 'The Spider',
    inventor: 'The Inventor', docs: 'Documentation Hub'
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (sidebarOpen && window.innerWidth <= 900) {
        const sidebarEl = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('menu-toggle');
        if (sidebarEl && !sidebarEl.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target))) {
          setSidebarOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [sidebarOpen]);

  const handleNavigate = (page) => {
    navigate(`/dashboard/${page}`);
    if (window.innerWidth <= 900) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="app">
      <Sidebar 
        activePage={activePage} 
        onNavigate={handleNavigate} 
        isOpen={sidebarOpen} 
        isCollapsed={isDesktopCollapsed}
        onToggleCollapse={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      
      <div className="main" style={{ 
        '--sidebar-width': isDesktopCollapsed ? '80px' : '260px',
        '--content-max-width': isDesktopCollapsed ? '100%' : '1650px'
      }}>
        <Topbar title={titles[activePage] || 'Studio'} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} theme={theme} onToggleTheme={onToggleTheme} />
        <ModelSelector activePage={activePage} />
        
        <div className="content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <Routes>
                <Route path="/" element={<Dashboard onNavigate={handleNavigate} />} />
                <Route path="/optimizer" element={<PromptOptimizer />} />
                <Route path="/aiwriter" element={<AIWriter />} />
                <Route path="/creator" element={<CreatorStudio />} />
                <Route path="/compare" element={<ModelCompare />} />
                <Route path="/codehelper" element={<CodeHelper />} />
                <Route path="/datawizard" element={<DataWizard />} />
                <Route path="/chatdata" element={<ChatWithData />} />
                <Route path="/vault" element={<Vault />} />
                <Route path="/keys" element={<ApiKeys />} />
                <Route path="/sellearn" element={<SellAndEarn />} />
                <Route path="/seo" element={<SEOOptimizer />} />
                <Route path="/library" element={<PromptLibrary onNavigate={handleNavigate} />} />
                <Route path="/search" element={<TheSpider />} />
                <Route path="/inventor" element={<TheInventor />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <WhiteLabelModal isOpen={whiteLabelOpen} onClose={() => setWhiteLabelOpen(false)} />
    </div>
  );
}

function AnalyticsTracker() {
  const location = useLocation();
  useEffect(() => {
    if (window.gtag) {
      window.gtag('config', 'G-Q9FWNSYE9Z', {
        page_path: location.pathname + location.search
      });
    }
  }, [location]);
  return null;
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <AppProvider>
      <div className="ambient-bg"></div>
      <Router>
        <AnalyticsTracker />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route 
            path="/dashboard/*" 
            element={<DashboardLayout theme={theme} onToggleTheme={handleToggleTheme} />} 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toast />
    </AppProvider>
  );
}
export default App;
