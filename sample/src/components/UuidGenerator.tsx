import React, { useState, useEffect } from 'react';
import { v4 as uuidv4, v1 as uuidv1, v7 as uuidv7 } from 'uuid';
import { Copy, Download, RefreshCw, Check, Hash, Sparkles, Filter } from 'lucide-react';

interface UuidGeneratorProps {
  onCopyNotice: (msg: string) => void;
}

export const UuidGenerator: React.FC<UuidGeneratorProps> = ({ onCopyNotice }) => {
  const [version, setVersion] = useState<'v4' | 'v1' | 'v7'>('v4');
  const [quantity, setQuantity] = useState<number>(10);
  const [isUppercase, setIsUppercase] = useState<boolean>(false);
  const [useHyphens, setUseHyphens] = useState<boolean>(true);
  const [wrapper, setWrapper] = useState<'none' | 'double-quote' | 'single-quote' | 'braces'>('none');
  const [separator, setSeparator] = useState<'newline' | 'comma' | 'semicolon'>('newline');
  const [uuids, setUuids] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const generateUuids = () => {
    const list: string[] = [];
    const count = Math.min(Math.max(1, quantity), 500);

    for (let i = 0; i < count; i++) {
      let raw = '';
      if (version === 'v1') raw = uuidv1();
      else if (version === 'v7') raw = uuidv7();
      else raw = uuidv4();

      if (!useHyphens) {
        raw = raw.replace(/-/g, '');
      }

      if (isUppercase) {
        raw = raw.toUpperCase();
      }

      let formatted = raw;
      if (wrapper === 'double-quote') formatted = `"${raw}"`;
      else if (wrapper === 'single-quote') formatted = `'${raw}'`;
      else if (wrapper === 'braces') formatted = `{${raw}}`;

      list.push(formatted);
    }
    setUuids(list);
  };

  useEffect(() => {
    generateUuids();
  }, [version, quantity, isUppercase, useHyphens, wrapper]);

  const getDelimiterString = () => {
    if (separator === 'comma') return wrapper === 'none' ? ', ' : ',\n';
    if (separator === 'semicolon') return ';\n';
    return '\n';
  };

  const formattedOutput = uuids.join(getDelimiterString());

  const handleCopyAll = () => {
    navigator.clipboard.writeText(formattedOutput);
    setCopiedAll(true);
    onCopyNotice(`已複製 ${uuids.length} 個 UUID`);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopySingle = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    onCopyNotice('已複製單個 UUID');
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleDownload = () => {
    const blob = new Blob([formattedOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uuids-${version}-${uuids.length}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onCopyNotice('檔案已開始下載');
  };

  const filteredUuids = uuids.filter((item) =>
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-mono">UUID v1 / v4 / v7</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight mt-1">
            UUIDs 批次生成器
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            批次產生標準 UUID (Universally Unique Identifier)，支援多種版本與格式選項
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={generateUuids}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-[#323336] hover:bg-stone-800 text-white text-xs font-medium rounded-md transition-all shadow-2xs active:scale-[0.98]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            重新生成
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-xl border border-stone-200/80 shadow-2xs p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* UUID Version */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              UUID 版本
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100/80 rounded-lg border border-stone-200/60">
              <button
                type="button"
                onClick={() => setVersion('v4')}
                className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                  version === 'v4'
                    ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                v4 (隨機)
              </button>
              <button
                type="button"
                onClick={() => setVersion('v7')}
                className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                  version === 'v7'
                    ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                v7 (時間)
              </button>
              <button
                type="button"
                onClick={() => setVersion('v1')}
                className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                  version === 'v1'
                    ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                v1 (MAC)
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                生成數量
              </label>
              <span className="text-xs font-mono font-bold text-stone-800">
                {quantity} 個
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={500}
                value={quantity}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setQuantity(isNaN(val) ? 1 : val);
                }}
                className="w-20 px-2.5 py-1.5 text-xs font-mono border border-stone-300 rounded-md focus:ring-1 focus:ring-stone-600 focus:border-stone-600 outline-none transition-all shrink-0"
                placeholder="數量"
              />
              <div className="flex items-center gap-1">
                {[10, 50, 100, 200].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuantity(num)}
                    className={`text-[11px] px-2 py-1 rounded-md border transition-all shrink-0 ${
                      quantity === num
                        ? 'bg-[#323336] border-[#323336] text-white font-medium shadow-2xs'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100 hover:border-stone-300'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Text Style */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              格式選項
            </label>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isUppercase}
                  onChange={(e) => setIsUppercase(e.target.checked)}
                  className="rounded border-stone-300 text-stone-800 focus:ring-stone-600"
                />
                大寫字母
              </label>
              <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useHyphens}
                  onChange={(e) => setUseHyphens(e.target.checked)}
                  className="rounded border-stone-300 text-stone-800 focus:ring-stone-600"
                />
                包含連字符 (-)
              </label>
            </div>
          </div>

          {/* Wrapper & Separator */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              包裹與分隔符號
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={wrapper}
                onChange={(e: any) => setWrapper(e.target.value)}
                className="px-2 py-1.5 text-xs border border-stone-300 rounded-md bg-stone-50 text-stone-700 outline-none focus:border-[#4A6B5D]"
              >
                <option value="none">無引號</option>
                <option value="double-quote">雙引號 "..."</option>
                <option value="single-quote">單引號 '...'</option>
                <option value="braces">大括號 {'{...'}</option>
              </select>
              <select
                value={separator}
                onChange={(e: any) => setSeparator(e.target.value)}
                className="px-2 py-1.5 text-xs border border-stone-300 rounded-md bg-stone-50 text-stone-700 outline-none focus:border-[#4A6B5D]"
              >
                <option value="newline">換行分隔</option>
                <option value="comma">逗號分隔 (,)</option>
                <option value="semicolon">分號分隔 (;)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Output Results Section */}
      <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs overflow-hidden">
        {/* Output Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-5 py-3.5 bg-stone-50/80 border-b border-stone-200/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-stone-700 font-medium">
              <Hash className="w-3.5 h-3.5 text-[#4A6B5D]" />
              共產出 <span className="font-mono font-bold text-stone-800">{uuids.length}</span> 個 UUIDs
            </div>
            {searchQuery && (
              <span className="text-xs text-stone-700">
                (符合搜尋條件: <span className="font-semibold text-stone-800">{filteredUuids.length}</span>)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <input
                type="text"
                placeholder="過濾搜尋..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1 text-xs border border-stone-200 rounded-md bg-white text-stone-800 outline-none focus:border-[#4A6B5D]"
              />
              <Filter className="w-3 h-3 text-stone-700 absolute left-2 top-2.5" />
            </div>

            <button
              onClick={handleCopyAll}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors border ${
                copiedAll
                  ? 'bg-[#EBF2EE] border-[#4A6B5D] text-[#2D4A3E]'
                  : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
              }`}
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-[#4A6B5D]" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedAll ? '已複製全部' : '複製全部'}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-stone-800 hover:bg-stone-900 text-stone-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              下載文件
            </button>
          </div>
        </div>

        {/* List of generated UUIDs */}
        <div className="divide-y divide-stone-100 max-h-[460px] overflow-y-auto font-mono text-xs">
          {filteredUuids.length === 0 ? (
            <div className="p-8 text-center text-stone-400">沒有符合條件的 UUID</div>
          ) : (
            filteredUuids.map((uuid, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-5 py-2.5 hover:bg-[#FAF8F5] transition-colors group"
              >
                <div className="flex items-center gap-3 text-stone-700 min-w-0">
                  <span className="text-[10px] text-stone-600 select-none w-7 text-right font-sans">
                    #{idx + 1}
                  </span>
                  <span className="truncate select-all text-stone-800 font-medium">{uuid}</span>
                </div>
                <button
                  onClick={() => handleCopySingle(uuid, idx)}
                  className={`opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded hover:bg-stone-200/60 ${
                    copiedIndex === idx ? 'opacity-100 text-[#4A6B5D]' : 'text-stone-400'
                  }`}
                  title="複製此項"
                >
                  {copiedIndex === idx ? (
                    <Check className="w-3.5 h-3.5 text-[#4A6B5D]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
