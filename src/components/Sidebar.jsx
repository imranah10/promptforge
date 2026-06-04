import React from 'react';
import { 
  LayoutDashboard, PenTool, GitCompare, Code2, MessageSquare, 
  Key, Share2, Languages, DollarSign,
  Zap, Search, Library, Wand2, Database, Archive, FileText,
  PanelLeftClose, PanelRightClose, Globe, Lightbulb, BookOpen,
  Sun, Moon, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../context/AppContext';

const UI_LANGS = [
  { code:'en', label:'🇺🇸 English' },
  { code:'hi', label:'🇮🇳 हिंदी' },
  { code:'es', label:'🇪🇸 Español' },
  { code:'zh', label:'🇨🇳 中文' },
  { code:'ar', label:'🇸🇦 العربية' },
  { code:'pt', label:'🇧🇷 Português' },
  { code:'fr', label:'🇫🇷 Français' },
  { code:'de', label:'🇩🇪 Deutsch' },
  { code:'ja', label:'🇯🇵 日本語' },
  { code:'ru', label:'🇷🇺 Русский' },
];

// Pre-built translations for all UI strings
const UI_T = {
  en: { studio:'Studio', business:'Business', dashboard:'Dashboard', chatdata:'Chat With Data', optimizer:'Prompt Optimizer', aiwriter:'AI Writer', creator:'Creator Studio', library:'Prompt Library', compare:'Model Compare', codehelper:'Code Helper', datawizard:'Data Wizard', seo:'SEO Optimizer', spider:'The Spider', inventor:'The Inventor', vault:'History Vault', keys:'API Keys', docs:'Docs', sellearn:'Sell & Earn', lightMode:'Light Mode', darkMode:'Dark Mode', systems:'All systems live', langLabel:'Language' },
  hi: { studio:'स्टूडियो', business:'बिज़नेस', dashboard:'डैशबोर्ड', chatdata:'डेटा से चैट', optimizer:'प्रॉम्प्ट ऑप्टिमाइज़र', aiwriter:'AI राइटर', creator:'क्रिएटर स्टूडियो', library:'प्रॉम्प्ट लाइब्रेरी', compare:'मॉडल कम्पेयर', codehelper:'कोड हेल्पर', datawizard:'डेटा विज़ार्ड', seo:'SEO ऑप्टिमाइज़र', spider:'द स्पाइडर', inventor:'द इन्वेंटर', vault:'हिस्ट्री वॉल्ट', keys:'API कीज़', docs:'डॉक्स', sellearn:'बेचो & कमाओ', lightMode:'लाइट मोड', darkMode:'डार्क मोड', systems:'सभी सिस्टम चालू', langLabel:'भाषा' },
  es: { studio:'Estudio', business:'Negocio', dashboard:'Panel', chatdata:'Chat con Datos', optimizer:'Optimizador', aiwriter:'Escritor IA', creator:'Estudio Creador', library:'Biblioteca', compare:'Comparar Modelos', codehelper:'Ayuda de Código', datawizard:'Mago de Datos', seo:'SEO', spider:'La Araña', inventor:'El Inventor', vault:'Bóveda', keys:'Claves API', docs:'Docs', sellearn:'Vender & Ganar', lightMode:'Modo Claro', darkMode:'Modo Oscuro', systems:'Todos los sistemas activos', langLabel:'Idioma' },
  zh: { studio:'工作室', business:'商业', dashboard:'仪表盘', chatdata:'数据对话', optimizer:'提示优化器', aiwriter:'AI写作', creator:'创作工作室', library:'提示库', compare:'模型对比', codehelper:'代码助手', datawizard:'数据巫师', seo:'SEO优化', spider:'蜘蛛', inventor:'发明家', vault:'历史库', keys:'API密钥', docs:'文档', sellearn:'销售赚钱', lightMode:'浅色模式', darkMode:'深色模式', systems:'所有系统正常', langLabel:'语言' },
  ar: { studio:'الاستوديو', business:'الأعمال', dashboard:'لوحة التحكم', chatdata:'الدردشة مع البيانات', optimizer:'محسّن الأوامر', aiwriter:'الكاتب الذكي', creator:'استوديو المبدع', library:'مكتبة الأوامر', compare:'مقارنة النماذج', codehelper:'مساعد الكود', datawizard:'معالج البيانات', seo:'تحسين محركات البحث', spider:'العنكبوت', inventor:'المخترع', vault:'خزينة التاريخ', keys:'مفاتيح API', docs:'الوثائق', sellearn:'بيع واكسب', lightMode:'الوضع الفاتح', darkMode:'الوضع الداكن', systems:'جميع الأنظمة تعمل', langLabel:'اللغة' },
  pt: { studio:'Estúdio', business:'Negócio', dashboard:'Painel', chatdata:'Chat com Dados', optimizer:'Otimizador', aiwriter:'Escritor IA', creator:'Estúdio Criador', library:'Biblioteca', compare:'Comparar Modelos', codehelper:'Ajudante de Código', datawizard:'Mago de Dados', seo:'SEO', spider:'A Aranha', inventor:'O Inventor', vault:'Cofre', keys:'Chaves API', docs:'Docs', sellearn:'Vender & Ganhar', lightMode:'Modo Claro', darkMode:'Modo Escuro', systems:'Todos sistemas ativos', langLabel:'Idioma' },
  fr: { studio:'Studio', business:'Commerce', dashboard:'Tableau de bord', chatdata:'Chat avec Données', optimizer:'Optimiseur', aiwriter:'Rédacteur IA', creator:'Studio Créatif', library:'Bibliothèque', compare:'Comparer Modèles', codehelper:'Aide Code', datawizard:'Magicien Données', seo:'SEO', spider:'L\'Araignée', inventor:'L\'Inventeur', vault:'Coffre', keys:'Clés API', docs:'Docs', sellearn:'Vendre & Gagner', lightMode:'Mode Clair', darkMode:'Mode Sombre', systems:'Tous systèmes actifs', langLabel:'Langue' },
  de: { studio:'Studio', business:'Business', dashboard:'Dashboard', chatdata:'Chat mit Daten', optimizer:'Optimierer', aiwriter:'KI-Autor', creator:'Kreativstudio', library:'Bibliothek', compare:'Modelle Vergleichen', codehelper:'Code-Hilfe', datawizard:'Daten-Assistent', seo:'SEO', spider:'Die Spinne', inventor:'Der Erfinder', vault:'Tresor', keys:'API-Schlüssel', docs:'Docs', sellearn:'Verkaufen & Verdienen', lightMode:'Heller Modus', darkMode:'Dunkler Modus', systems:'Alle Systeme aktiv', langLabel:'Sprache' },
  ja: { studio:'スタジオ', business:'ビジネス', dashboard:'ダッシュボード', chatdata:'データチャット', optimizer:'プロンプト最適化', aiwriter:'AIライター', creator:'クリエイタースタジオ', library:'ライブラリ', compare:'モデル比較', codehelper:'コードヘルパー', datawizard:'データウィザード', seo:'SEO最適化', spider:'スパイダー', inventor:'インベンター', vault:'履歴', keys:'APIキー', docs:'ドキュメント', sellearn:'販売・収益', lightMode:'ライトモード', darkMode:'ダークモード', systems:'全システム稼働中', langLabel:'言語' },
  ru: { studio:'Студия', business:'Бизнес', dashboard:'Панель', chatdata:'Чат с данными', optimizer:'Оптимизатор', aiwriter:'ИИ-автор', creator:'Студия создателя', library:'Библиотека', compare:'Сравнить модели', codehelper:'Помощник кода', datawizard:'Мастер данных', seo:'SEO', spider:'Паук', inventor:'Изобретатель', vault:'Хранилище', keys:'API ключи', docs:'Документы', sellearn:'Продавать & Зарабатывать', lightMode:'Светлый режим', darkMode:'Тёмный режим', systems:'Все системы работают', langLabel:'Язык' },
};

const Sidebar = ({ activePage, onNavigate, isOpen, isCollapsed, onToggleCollapse, theme, onToggleTheme }) => {
  const [tooltip, setTooltip] = React.useState(null);
  const [showLangPicker, setShowLangPicker] = React.useState(false);
  const { uiLang, setUiLang } = React.useContext(AppContext);
  const T = UI_T[uiLang] || UI_T.en;

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
          {!isCollapsed && <div className="nav-label">{T.studio}</div>}
          <NavItem id="dashboard" icon={LayoutDashboard} label={T.dashboard} />
          <NavItem id="chatdata" icon={FileText} label={T.chatdata} badge="Pro" badgeClass="badge-hot" />
          <NavItem id="optimizer" icon={Wand2} label={T.optimizer} badge="Magic" badgeClass="badge-pro" />
          <NavItem id="aiwriter" icon={PenTool} label={T.aiwriter} />
          <NavItem id="creator" icon={Share2} label={T.creator} />
          <NavItem id="library" icon={Library} label={T.library} badge="60+" badgeClass="badge-pro" />
          <NavItem id="compare" icon={GitCompare} label={T.compare} />
          <NavItem id="codehelper" icon={Code2} label={T.codehelper} />
          <NavItem id="datawizard" icon={Database} label={T.datawizard} badge="New" badgeClass="badge-new" />
          <NavItem id="seo" icon={Search} label={T.seo} />
          <NavItem id="search" icon={Globe} label={T.spider} badge="Deep" badgeClass="badge-hot" />
          <NavItem id="inventor" icon={Lightbulb} label={T.inventor} badge="Future" badgeClass="badge-new" />
          <NavItem id="vault" icon={Archive} label={T.vault} />
          <NavItem id="keys" icon={Key} label={T.keys} />
          <NavItem id="docs" icon={BookOpen} label={T.docs} badge="New" badgeClass="badge-new" />
        </div>

        <div className="nav-section">
          {!isCollapsed && <div className="nav-label">{T.business}</div>}
          <NavItem id="sellearn" icon={DollarSign} label={T.sellearn} />
        </div>
      </div>

      <div className="sidebar-footer">

        {/* Language Picker */}
        <div style={{ marginBottom: 10, position: 'relative' }}>
          <button
            onClick={() => setShowLangPicker(p => !p)}
            title={T.langLabel}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: 8, padding: isCollapsed ? '8px 0' : '8px 12px',
              borderRadius: 8, cursor: 'pointer',
              background: 'rgba(124,92,252,0.06)',
              border: '1px solid var(--border)',
              color: 'var(--text2)', fontSize: 13, fontWeight: 500,
              justifyContent: isCollapsed ? 'center' : 'space-between',
              fontFamily: 'inherit', transition: 'all 0.2s',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={15} />
              {!isCollapsed && (UI_LANGS.find(l => l.code === uiLang)?.label || '🇺🇸 English')}
            </span>
            {!isCollapsed && <ChevronDown size={13} style={{ transform: showLangPicker ? 'rotate(180deg)' : 'none', transition: '.2s' }} />}
          </button>

          <AnimatePresence>
            {showLangPicker && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                style={{
                  position: 'absolute', bottom: '110%', left: 0, right: 0,
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: 8, zIndex: 999,
                  boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
                  maxHeight: 300, overflowY: 'auto',
                }}
              >
                <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text3)', letterSpacing: 2, padding: '4px 8px 8px', textTransform: 'uppercase' }}>
                  {T.langLabel}
                </div>
                {UI_LANGS.map(l => (
                  <button key={l.code} onClick={() => { setUiLang(l.code); setShowLangPicker(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: uiLang === l.code ? 'rgba(124,92,252,0.2)' : 'transparent',
                      color: uiLang === l.code ? 'var(--accent2)' : 'var(--text2)',
                      fontSize: 13, fontWeight: uiLang === l.code ? 700 : 500,
                      fontFamily: 'inherit', textAlign: 'left', transition: '.15s',
                    }}
                  >
                    {l.label}
                    {uiLang === l.code && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--accent)' }}>✓</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="theme-switcher-wrapper" style={{ marginBottom: isCollapsed ? '16px' : '12px' }}>
          <button onClick={onToggleTheme} className="sidebar-theme-btn" title={theme === 'dark' ? T.lightMode : T.darkMode}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {!isCollapsed && <span className="theme-btn-label">{theme === 'dark' ? T.lightMode : T.darkMode}</span>}
          </button>
        </div>
        <div className="status-dot">
          <div className="dot"></div> {!isCollapsed && T.systems}
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