import React from 'react';
import {
  Hash,
  Clock,
  FileCode,
  Key,
  Database,
  Globe,
  Wifi,
  Star,
  Sparkles,
} from 'lucide-react';
import { ToolId, ToolMeta } from '../types';

interface SidebarNavProps {
  tools: ToolMeta[];
  activeTool: ToolId;
  onSelectTool: (id: ToolId) => void;
  favorites: ToolId[];
  onToggleFavorite: (id: ToolId) => void;
  categoryTitle: string;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  tools,
  activeTool,
  onSelectTool,
  favorites,
  onToggleFavorite,
  categoryTitle,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Hash':
        return <Hash className="w-4 h-4" />;
      case 'Clock':
        return <Clock className="w-4 h-4" />;
      case 'FileCode':
        return <FileCode className="w-4 h-4" />;
      case 'Key':
        return <Key className="w-4 h-4" />;
      case 'Database':
        return <Database className="w-4 h-4" />;
      case 'Globe':
        return <Globe className="w-4 h-4" />;
      case 'Wifi':
        return <Wifi className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-4">
      {/* Sub-Tools Card Panel */}
      <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs p-3.5 space-y-2">
        <div className="flex items-center justify-between px-2 py-1 border-b border-stone-100 pb-2">
          <span className="text-xs font-bold text-stone-800 tracking-tight">
            {categoryTitle}
          </span>
          <span className="text-[10px] font-mono font-semibold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
            {tools.length} 個工具
          </span>
        </div>

        {tools.length === 0 ? (
          <div className="p-6 text-center text-xs text-stone-400">
            此分類下尚無工具，請切換其他大類
          </div>
        ) : (
          <div className="space-y-1 pt-1">
            {tools.map((t) => {
              const isActive = activeTool === t.id;
              const isFav = favorites.includes(t.id);

              return (
                <div
                  key={t.id}
                  className={`group relative flex items-center justify-between rounded-md transition-all ${
                    isActive
                      ? 'bg-[#323336] text-white shadow-2xs font-medium'
                      : 'text-stone-700 hover:bg-stone-100/80 hover:text-stone-900'
                  }`}
                >
                  <button
                    onClick={() => onSelectTool(t.id)}
                    className="flex-1 flex items-center gap-2.5 px-3 py-2 text-xs text-left min-w-0"
                  >
                    <span className={isActive ? 'text-white' : 'text-stone-500'}>
                      {getIcon(t.iconName)}
                    </span>
                    <span className="truncate min-w-0 flex-1">{t.name}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(t.id);
                    }}
                    className={`p-2 transition-colors ${
                      isActive ? 'text-white/70 hover:text-white' : 'text-stone-300 hover:text-amber-500'
                    }`}
                    title={isFav ? '取消最愛' : '加入最愛'}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        isFav ? 'fill-amber-400 text-amber-500' : ''
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
