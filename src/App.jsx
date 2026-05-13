import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ModelSelector from './components/ModelSelector';
import Dashboard from './pages/Dashboard';
import AIWriter from './pages/AIWriter';
import CreatorStudio from './pages/CreatorStudio';
import ImagePrompt from './pages/ImagePrompt';
import VideoPrompt from './pages/VideoPrompt';
import ModelCompare from './pages/ModelCompare';
import CodeHelper from './pages/CodeHelper';
import AIChat from './pages/AIChat';
import Translator from './pages/Translator';
import ApiKeys from './pages/ApiKeys';
import SellAndEarn from './pages/SellAndEarn';
import SEOOptimizer from './pages/SEOOptimizer';
import PromptLibrary from './pages/PromptLibrary';
import PromptOptimizer from './pages/PromptOptimizer';
import DataWizard from './pages/DataWizard';
import ChatWithData from './pages/ChatWithData';
import Vault from './pages/Vault';
import Toast from './components/Toast';
import { AppProvider } from './context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import LandingPage from './pages/LandingPage';

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const activePage = location.pathname.split('/').pop() || 'dashboard';

  const titles = {
    dashboard:'Dashboard', optimizer: 'Prompt Optimizer', aiwriter:'AI Writer', 
    creator:'Creator Studio', imageprompt:'Image Prompt', videoprompt:'Video Prompt', 
    compare:'Model Compare', codehelper:'Code Helper', datawizard: 'Data Wizard', chatdata: 'Chat With Data',
    aichat:'AI Personas', vault: 'Generation Vault', translator:'Translator', keys:'API Keys', 
    sellearn:'Sell & Earn', seo: 'SEO Optimizer', library: 'Prompt Library'
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
      />
      
      <div className="main" style={{ 
        marginLeft: window.innerWidth > 900 ? (isDesktopCollapsed ? '80px' : '260px') : '0',
        width: 'auto'
      }}>
        <Topbar title={titles[activePage] || 'Studio'} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
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
                <Route path="/imageprompt" element={<ImagePrompt />} />
                <Route path="/videoprompt" element={<VideoPrompt />} />
                <Route path="/compare" element={<ModelCompare />} />
                <Route path="/codehelper" element={<CodeHelper />} />
                <Route path="/datawizard" element={<DataWizard />} />
                <Route path="/chatdata" element={<ChatWithData />} />
                <Route path="/aichat" element={<AIChat />} />
                <Route path="/vault" element={<Vault />} />
                <Route path="/translator" element={<Translator />} />
                <Route path="/keys" element={<ApiKeys />} />
                <Route path="/sellearn" element={<SellAndEarn />} />
                <Route path="/seo" element={<SEOOptimizer />} />
                <Route path="/library" element={<PromptLibrary onNavigate={handleNavigate} />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <div className="ambient-bg"></div>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard/*" element={<DashboardLayout />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toast />
    </AppProvider>
  );
}
export default App;
