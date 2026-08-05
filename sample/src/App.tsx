import React, { useState } from 'react';
import { Header } from './components/Header';
import { SidebarNav } from './components/SidebarNav';
import { ToastContainer } from './components/Toast';
import { UuidGenerator } from './components/UuidGenerator';
import { DateTimeConverter } from './components/DateTimeConverter';
import { Base64Tool } from './components/Base64Tool';
import { JwtTool } from './components/JwtTool';
import { SqlFormatter } from './components/SqlFormatter';
import { WhoisLookup } from './components/WhoisLookup';
import { WhatIsMyIp } from './components/WhatIsMyIp';
import { ToolId, ToolMeta, MainCategory, MainCategoryMeta, ToastMessage } from './types';
import { ArrowRight } from 'lucide-react';

const MAIN_CATEGORIES: MainCategoryMeta[] = [
  {
    id: 'all',
    label: '全部工具',
    iconName: 'Grid',
    description: '所有可用開發者工具',
  },
  {
    id: 'dev-gen',
    label: '開發與生成',
    iconName: 'Zap',
    description: 'UUIDs 生成與 SQL 格式化',
  },
  {
    id: 'convert-format',
    label: '轉換與編碼',
    iconName: 'RefreshCw',
    description: '時間戳轉換與 Base64 編解碼',
  },
  {
    id: 'security-auth',
    label: '安全與驗證',
    iconName: 'Shield',
    description: 'JWT 解碼與驗證',
  },
  {
    id: 'network-domain',
    label: '網路與網域',
    iconName: 'Globe',
    description: 'WHOIS 查詢與 IP 檢測',
  },
  {
    id: 'favorites',
    label: '我的最愛',
    iconName: 'Star',
    description: '已收藏的工具',
  },
];

const TOOLS: ToolMeta[] = [
  {
    id: 'uuid',
    name: 'UUIDs 批次生成器',
    mainCategory: 'dev-gen',
    description: '批次產生 v1, v4, v7 UUID，支援大小寫、連字符與符號包裹轉換',
    iconName: 'Hash',
  },
  {
    id: 'sql',
    name: 'SQL 格式化工具',
    mainCategory: 'dev-gen',
    description: '排版與美化 SQL 語法，支援多種資料庫方言與關鍵字大寫轉換',
    iconName: 'Database',
  },
  {
    id: 'datetime',
    name: '日期時間轉換器',
    mainCategory: 'convert-format',
    description: 'Unix 時間戳記與 ISO 8601、和曆/和暦與多時區雙向精確轉換',
    iconName: 'Clock',
  },
  {
    id: 'base64',
    name: 'Base64 工具',
    mainCategory: 'convert-format',
    description: '支援 UTF-8 文字編解碼、URL-safe 模式，以及檔案 Base64 Data URI',
    iconName: 'FileCode',
  },
  {
    id: 'jwt',
    name: 'JWT 工具與調試器',
    mainCategory: 'security-auth',
    description: '解碼與調試 JWT，分析 Header, Payload Claims 與簽名狀態',
    iconName: 'Key',
  },
  {
    id: 'whois',
    name: 'WHOIS 系列查詢',
    mainCategory: 'network-domain',
    description: '查詢網域與 IP 註冊商、到期倒數、DNS 與權威 RDAP 記錄',
    iconName: 'Globe',
  },
  {
    id: 'myip',
    name: 'What Is My IP',
    mainCategory: 'network-domain',
    description: '檢測當前公網 IP 位址、地理位置、ISP 電信商與 User-Agent 標頭',
    iconName: 'Wifi',
  },
];

export default function App() {
  const [activeCategory, setActiveCategory] = useState<MainCategory>('all');
  const [activeTool, setActiveTool] = useState<ToolId>('uuid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Favorite tools in localStorage
  const [favorites, setFavorites] = useState<ToolId[]>(() => {
    try {
      const saved = localStorage.getItem('wabi_favs');
      return saved ? JSON.parse(saved) : ['uuid', 'jwt', 'myip'];
    } catch (e) {
      return ['uuid', 'jwt', 'myip'];
    }
  });

  const showNotice = (title: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, title, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToggleFavorite = (id: ToolId) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem('wabi_favs', JSON.stringify(next));
      return next;
    });
  };

  // Get tools for current category
  const getCategoryTools = (cat: MainCategory) => {
    if (cat === 'all') return TOOLS;
    if (cat === 'favorites') return TOOLS.filter((t) => favorites.includes(t.id));
    return TOOLS.filter((t) => t.mainCategory === cat);
  };

  const currentCategoryTools = getCategoryTools(activeCategory);

  // Switch category and adjust active tool if needed
  const handleSelectCategory = (cat: MainCategory) => {
    setActiveCategory(cat);
    const catTools = getCategoryTools(cat);
    if (catTools.length > 0 && !catTools.some((t) => t.id === activeTool)) {
      setActiveTool(catTools[0].id);
    }
  };

  // When clicking a tool in sidebar, automatically ensure active category contains it or update category
  const handleSelectTool = (id: ToolId) => {
    setActiveTool(id);
    const targetTool = TOOLS.find((t) => t.id === id);
    if (targetTool && activeCategory !== 'all' && activeCategory !== 'favorites' && targetTool.mainCategory !== activeCategory) {
      setActiveCategory(targetTool.mainCategory);
    }
  };

  // Search filter matching
  const matchingTools = TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCategoryMeta = MAIN_CATEGORIES.find((c) => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-800 font-sans flex flex-col selection:bg-[#323336] selection:text-white">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* Header Bar */}
      <Header
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={MAIN_CATEGORIES}
        favoriteCount={favorites.length}
      />

      {/* Main Body Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 md:py-8">
        {/* Search Results Mode */}
        {searchQuery.trim() !== '' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h2 className="text-sm font-bold text-stone-700">
                搜尋結果 ({matchingTools.length} 個符合工具)
              </h2>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-stone-600 font-medium hover:text-stone-900 hover:underline"
              >
                清空搜尋
              </button>
            </div>

            {matchingTools.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-stone-400 border border-stone-200/80 text-xs">
                沒有找到與 "{searchQuery}" 相關的工具
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchingTools.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      handleSelectTool(t.id);
                      setSearchQuery('');
                    }}
                    className="p-5 bg-white rounded-xl border border-stone-200/80 shadow-2xs hover:border-stone-500 hover:shadow-xs text-left transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-stone-900">{t.name}</span>
                      <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-stone-600 line-clamp-2">{t.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left Sidebar Nav */}
            <SidebarNav
              tools={currentCategoryTools}
              activeTool={activeTool}
              onSelectTool={handleSelectTool}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              categoryTitle={activeCategoryMeta?.label || '選單項'}
            />

            {/* Right Tool Content Stage */}
            <section className="flex-1 w-full min-w-0 bg-transparent">
              {activeTool === 'uuid' && <UuidGenerator onCopyNotice={showNotice} />}
              {activeTool === 'datetime' && <DateTimeConverter onCopyNotice={showNotice} />}
              {activeTool === 'base64' && <Base64Tool onCopyNotice={showNotice} />}
              {activeTool === 'jwt' && <JwtTool onCopyNotice={showNotice} />}
              {activeTool === 'sql' && <SqlFormatter onCopyNotice={showNotice} />}
              {activeTool === 'whois' && <WhoisLookup onCopyNotice={showNotice} />}
              {activeTool === 'myip' && <WhatIsMyIp onCopyNotice={showNotice} />}
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-[#E7E3DC] bg-[#F5F2EC] py-6 text-center text-xs text-stone-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-800">IT Tools</span>
            <span>•</span>
            <span>日系簡約開發者工具箱</span>
          </div>
          <div className="text-stone-500">
            Inspired by <a href="https://it-tools.tech" target="_blank" rel="noreferrer" className="underline hover:text-stone-800">it-tools.tech</a> & jwt.io
          </div>
        </div>
      </footer>
    </div>
  );
}
