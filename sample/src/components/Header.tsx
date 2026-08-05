import React from 'react';
import { Search, Grid, Zap, RefreshCw, Shield, Globe, Star } from 'lucide-react';
import { MainCategory, MainCategoryMeta } from '../types';

interface HeaderProps {
  activeCategory: MainCategory;
  onSelectCategory: (cat: MainCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories: MainCategoryMeta[];
  favoriteCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  categories,
  favoriteCount,
}) => {
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Grid':
        return <Grid className="w-3.5 h-3.5" />;
      case 'Zap':
        return <Zap className="w-3.5 h-3.5" />;
      case 'RefreshCw':
        return <RefreshCw className="w-3.5 h-3.5" />;
      case 'Shield':
        return <Shield className="w-3.5 h-3.5" />;
      case 'Globe':
        return <Globe className="w-3.5 h-3.5" />;
      case 'Star':
        return <Star className="w-3.5 h-3.5" />;
      default:
        return <Grid className="w-3.5 h-3.5" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-[#E7E3DC] px-4 sm:px-6 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        {/* Simple Brand Title */}
        <div className="flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => onSelectCategory('all')}
            className="text-stone-900 font-bold text-sm tracking-tight hover:opacity-80 transition-opacity"
          >
            IT Tools
          </button>

          {/* Mobile Search Input */}
          <div className="relative lg:hidden flex-1 max-w-xs">
            <input
              type="text"
              placeholder="搜尋工具..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs border border-stone-300/80 rounded-md bg-white text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-600"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
          </div>
        </div>

        {/* Major Category Navigation Bar */}
        <nav className="flex items-center gap-1 overflow-x-auto py-0.5 border-t lg:border-t-0 border-stone-200/60 scrollbar-none">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            const isFav = cat.id === 'favorites';

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 border ${
                  isActive
                    ? 'bg-[#323336] text-white border-[#323336] shadow-2xs font-medium'
                    : 'bg-white/80 text-stone-700 border-stone-200/90 hover:bg-white hover:text-stone-900 hover:border-stone-300'
                }`}
              >
                <span className={isActive ? 'text-white' : isFav ? 'text-amber-500' : 'text-stone-500'}>
                  {getCategoryIcon(cat.iconName)}
                </span>
                <span>{cat.label}</span>
                {isFav && favoriteCount > 0 && (
                  <span
                    className={`ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {favoriteCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Desktop Global Search Bar */}
        <div className="hidden lg:block relative w-60 shrink-0">
          <input
            type="text"
            placeholder="搜尋工具..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs border border-stone-300/80 rounded-md bg-white text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-600 focus:ring-1 focus:ring-stone-600 transition-all"
          />
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
        </div>
      </div>
    </header>
  );
};
