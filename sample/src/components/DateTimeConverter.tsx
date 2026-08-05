import React, { useState, useEffect } from 'react';
import { Clock, Copy, Check, Calendar, Globe, Sparkles, RefreshCw } from 'lucide-react';

interface DateTimeConverterProps {
  onCopyNotice: (msg: string) => void;
}

export const DateTimeConverter: React.FC<DateTimeConverterProps> = ({ onCopyNotice }) => {
  const [timestampInput, setTimestampInput] = useState<string>(() =>
    Math.floor(Date.now() / 1000).toString()
  );
  const [unit, setUnit] = useState<'seconds' | 'milliseconds'>('seconds');
  const [isLiveClock, setIsLiveClock] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Timezone selection
  const [selectedTz, setSelectedTz] = useState<string>('Asia/Taipei');

  // Live clock tick
  useEffect(() => {
    if (!isLiveClock) return;
    const interval = setInterval(() => {
      const nowSec = Math.floor(Date.now() / 1000);
      const nowMs = Date.now();
      setTimestampInput(unit === 'seconds' ? nowSec.toString() : nowMs.toString());
    }, 1000);

    return () => clearInterval(interval);
  }, [isLiveClock, unit]);

  // Convert raw timestamp input into valid Date object
  const parseCurrentDate = (): Date | null => {
    if (!timestampInput.trim()) return null;
    const num = Number(timestampInput.trim());
    if (isNaN(num)) return null;

    if (unit === 'seconds') {
      return new Date(num * 1000);
    } else {
      return new Date(num);
    }
  };

  const currentDate = parseCurrentDate();
  const isValidDate = currentDate !== null && !isNaN(currentDate.getTime());

  // Handle manual input change
  const handleInputChange = (val: string) => {
    setIsLiveClock(false);
    setTimestampInput(val);
  };

  // Preset button action
  const applyPreset = (type: 'now' | 'todayStart' | 'todayEnd' | 'monthStart' | 'hourAgo' | 'dayLater') => {
    setIsLiveClock(type === 'now');
    const now = new Date();
    let targetDate = new Date();

    if (type === 'todayStart') {
      targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (type === 'todayEnd') {
      targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (type === 'monthStart') {
      targetDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    } else if (type === 'hourAgo') {
      targetDate = new Date(now.getTime() - 3600 * 1000);
    } else if (type === 'dayLater') {
      targetDate = new Date(now.getTime() + 86400 * 1000);
    }

    const val = unit === 'seconds' ? Math.floor(targetDate.getTime() / 1000) : targetDate.getTime();
    setTimestampInput(val.toString());
  };

  // Convert Date to Japanese Reiwa Era string
  const getJapaneseEraString = (date: Date): string => {
    try {
      const year = date.getFullYear();
      if (year >= 2019) {
        const reiwaYear = year - 2018;
        const eraLabel = reiwaYear === 1 ? '元年' : `${reiwaYear}年`;
        return `令和 ${eraLabel} ${date.getMonth() + 1}月${date.getDate()}日 (${getDayOfWeekJp(date)})`;
      } else if (year >= 1989) {
        const heiseiYear = year - 1988;
        return `平成 ${heiseiYear}年 ${date.getMonth() + 1}月${date.getDate()}日 (${getDayOfWeekJp(date)})`;
      }
      return `${year}年 ${date.getMonth() + 1}月${date.getDate()}日`;
    } catch (e) {
      return '';
    }
  };

  const getDayOfWeekJp = (d: Date) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[d.getDay()];
  };

  // Calculate relative time string
  const getRelativeTimeString = (d: Date): string => {
    const diffSec = Math.floor((d.getTime() - Date.now()) / 1000);
    const absDiff = Math.abs(diffSec);

    if (absDiff < 60) return diffSec >= 0 ? `${absDiff} 秒後` : `${absDiff} 秒前`;
    if (absDiff < 3600) {
      const min = Math.floor(absDiff / 60);
      return diffSec >= 0 ? `${min} 分後` : `${min} 分前`;
    }
    if (absDiff < 86400) {
      const hours = Math.floor(absDiff / 3600);
      return diffSec >= 0 ? `${hours} 小時後` : `${hours} 小時前`;
    }
    const days = Math.floor(absDiff / 86400);
    return diffSec >= 0 ? `${days} 天後` : `${days} 天前`;
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onCopyNotice(`已複製: ${text}`);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Date picker handler
  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    setIsLiveClock(false);
    const dt = new Date(e.target.value);
    if (!isNaN(dt.getTime())) {
      const val = unit === 'seconds' ? Math.floor(dt.getTime() / 1000) : dt.getTime();
      setTimestampInput(val.toString());
    }
  };

  // Formatted representations
  const isoStr = isValidDate ? currentDate.toISOString() : '-';
  const utcStr = isValidDate ? currentDate.toUTCString() : '-';

  const tzFormatted = isValidDate
    ? new Intl.DateTimeFormat('zh-TW', {
        timeZone: selectedTz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(currentDate)
    : '-';

  const jpEraStr = isValidDate ? getJapaneseEraString(currentDate) : '-';
  const relativeStr = isValidDate ? getRelativeTimeString(currentDate) : '-';
  const secValue = isValidDate ? Math.floor(currentDate.getTime() / 1000).toString() : '-';
  const msValue = isValidDate ? currentDate.getTime().toString() : '-';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            日期時間轉換器
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Unix 時間戳記與標準 ISO 8601、和曆、多時區雙向精確轉換
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsLiveClock(!isLiveClock)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all border ${
              isLiveClock
                ? 'bg-[#323336] border-[#323336] text-white'
                : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${isLiveClock ? 'animate-spin text-white' : ''}`} />
            {isLiveClock ? '實時更新中' : '暫停實時'}
          </button>
        </div>
      </div>

      {/* Main Input Box */}
      <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Timestamp Input */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="flex items-center justify-between text-xs font-semibold text-stone-700 uppercase tracking-wider">
              <span>Unix 時間戳記</span>
              <span className="text-[11px] font-normal text-stone-700">
                {unit === 'seconds' ? '10 位數 (秒)' : '13 位數 (毫秒)'}
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={timestampInput}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="輸入時間戳記..."
                className="w-full px-4 py-2.5 font-mono text-sm border border-stone-300 rounded-lg bg-stone-50/50 text-stone-900 focus:bg-white focus:ring-1 focus:ring-stone-600 focus:border-stone-600 outline-none"
              />
              <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setUnit(unit === 'seconds' ? 'milliseconds' : 'seconds')}
                  className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold"
                >
                  {unit}
                </button>
              </div>
            </div>
          </div>

          {/* Date Picker Direct Select */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
              或直接選擇日期時間
            </label>
            <input
              type="datetime-local"
              onChange={handleDatePickerChange}
              className="w-full px-4 py-2.5 font-mono text-xs border border-stone-300 rounded-lg bg-stone-50/50 text-stone-800 focus:bg-white focus:border-stone-600 outline-none"
            />
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="pt-2 border-t border-stone-100">
          <div className="text-xs text-stone-600 font-medium mb-2">快速設值：</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyPreset('now')}
              className="px-3 py-1 text-xs rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors border border-stone-200"
            >
              現在
            </button>
            <button
              onClick={() => applyPreset('todayStart')}
              className="px-3 py-1 text-xs rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors border border-stone-200"
            >
              本日起始 (00:00:00)
            </button>
            <button
              onClick={() => applyPreset('todayEnd')}
              className="px-3 py-1 text-xs rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors border border-stone-200"
            >
              本日結束 (23:59:59)
            </button>
            <button
              onClick={() => applyPreset('monthStart')}
              className="px-3 py-1 text-xs rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors border border-stone-200"
            >
              今月 1 日
            </button>
            <button
              onClick={() => applyPreset('hourAgo')}
              className="px-3 py-1 text-xs rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors border border-stone-200"
            >
              1 小時前
            </button>
            <button
              onClick={() => applyPreset('dayLater')}
              className="px-3 py-1 text-xs rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors border border-stone-200"
            >
              1 天後
            </button>
          </div>
        </div>
      </div>

      {/* Timezone Selector & Output Cards */}
      <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
            <Globe className="w-4 h-4 text-stone-600" />
            轉換結果與時區設定
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-600 font-medium">時區：</span>
            <select
              value={selectedTz}
              onChange={(e) => setSelectedTz(e.target.value)}
              className="px-2.5 py-1 text-xs font-mono border border-stone-300 rounded-md bg-stone-50 text-stone-800 outline-none focus:border-stone-600"
            >
              <option value="Asia/Tokyo">Asia/Tokyo (JST, UTC+9)</option>
              <option value="Asia/Taipei">Asia/Taipei (CST, UTC+8)</option>
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York">America/New_York (EST/EDT)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
            </select>
          </div>
        </div>

        {!isValidDate ? (
          <div className="p-8 text-center text-rose-500 bg-rose-50/50 rounded-lg border border-rose-100 text-xs">
            請輸入有效的數字時間戳記
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {/* Timestamp Seconds */}
            <div className="p-3.5 rounded-lg border border-stone-200/80 bg-stone-50/40 hover:bg-white transition-colors">
              <div className="flex items-center justify-between text-stone-600 mb-1">
                <span className="font-sans font-semibold text-[11px] uppercase">
                  Unix 時間戳記 (秒)
                </span>
                <button
                  onClick={() => handleCopy('sec', secValue)}
                  className="hover:text-stone-900 p-1 rounded"
                >
                  {copiedKey === 'sec' ? (
                    <Check className="w-3.5 h-3.5 text-stone-800" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="text-sm font-bold text-stone-900 select-all">{secValue}</div>
            </div>

            {/* Timestamp Milliseconds */}
            <div className="p-3.5 rounded-lg border border-stone-200/80 bg-stone-50/40 hover:bg-white transition-colors">
              <div className="flex items-center justify-between text-stone-600 mb-1">
                <span className="font-sans font-semibold text-[11px] uppercase">
                  Unix 時間戳記 (毫秒)
                </span>
                <button
                  onClick={() => handleCopy('ms', msValue)}
                  className="hover:text-stone-900 p-1 rounded"
                >
                  {copiedKey === 'ms' ? (
                    <Check className="w-3.5 h-3.5 text-stone-800" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="text-sm font-bold text-stone-900 select-all">{msValue}</div>
            </div>

            {/* Selected Timezone Formatted */}
            <div className="p-3.5 rounded-lg border border-stone-200/80 bg-stone-50/40 hover:bg-white transition-colors md:col-span-2">
              <div className="flex items-center justify-between text-stone-600 mb-1">
                <span className="font-sans font-semibold text-[11px] uppercase">
                  所選時區時間 ({selectedTz})
                </span>
                <button
                  onClick={() => handleCopy('tz', tzFormatted)}
                  className="hover:text-stone-900 p-1 rounded"
                >
                  {copiedKey === 'tz' ? (
                    <Check className="w-3.5 h-3.5 text-stone-800" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="text-base font-bold text-stone-900 select-all">{tzFormatted}</div>
            </div>

            {/* Japanese Era (和暦) */}
            <div className="p-3.5 rounded-lg border border-stone-200/80 bg-stone-50/40 hover:bg-white transition-colors">
              <div className="flex items-center justify-between text-stone-600 mb-1">
                <span className="font-sans font-semibold text-[11px] uppercase">
                  日本和曆表記
                </span>
                <button
                  onClick={() => handleCopy('jpera', jpEraStr)}
                  className="hover:text-stone-900 p-1 rounded"
                >
                  {copiedKey === 'jpera' ? (
                    <Check className="w-3.5 h-3.5 text-stone-800" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="text-sm font-semibold text-stone-800 select-all">{jpEraStr}</div>
            </div>

            {/* Relative Time */}
            <div className="p-3.5 rounded-lg border border-stone-200/80 bg-stone-50/40 hover:bg-white transition-colors">
              <div className="flex items-center justify-between text-stone-600 mb-1">
                <span className="font-sans font-semibold text-[11px] uppercase">
                  相對時間
                </span>
                <button
                  onClick={() => handleCopy('relative', relativeStr)}
                  className="hover:text-stone-900 p-1 rounded"
                >
                  {copiedKey === 'relative' ? (
                    <Check className="w-3.5 h-3.5 text-[#4A6B5D]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="text-sm font-semibold text-stone-800 select-all">{relativeStr}</div>
            </div>

            {/* ISO 8601 */}
            <div className="p-3.5 rounded-lg border border-stone-200/80 bg-stone-50/40 hover:bg-white transition-colors">
              <div className="flex items-center justify-between text-stone-600 mb-1">
                <span className="font-sans font-semibold text-[11px] uppercase">
                  ISO 8601 String
                </span>
                <button
                  onClick={() => handleCopy('iso', isoStr)}
                  className="hover:text-stone-900 p-1 rounded"
                >
                  {copiedKey === 'iso' ? (
                    <Check className="w-3.5 h-3.5 text-[#4A6B5D]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="text-xs font-semibold text-stone-800 select-all truncate">{isoStr}</div>
            </div>

            {/* UTC String */}
            <div className="p-3.5 rounded-lg border border-stone-200/80 bg-stone-50/40 hover:bg-white transition-colors">
              <div className="flex items-center justify-between text-stone-600 mb-1">
                <span className="font-sans font-semibold text-[11px] uppercase">
                  UTC String
                </span>
                <button
                  onClick={() => handleCopy('utc', utcStr)}
                  className="hover:text-stone-900 p-1 rounded"
                >
                  {copiedKey === 'utc' ? (
                    <Check className="w-3.5 h-3.5 text-[#4A6B5D]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="text-xs font-semibold text-stone-800 select-all truncate">{utcStr}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
