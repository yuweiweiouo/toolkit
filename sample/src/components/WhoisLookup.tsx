import React, { useState, useEffect } from 'react';
import { Search, Globe, Shield, Calendar, Server, AlertCircle, History, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface WhoisLookupProps {
  onCopyNotice: (msg: string) => void;
}

export const WhoisLookup: React.FC<WhoisLookupProps> = ({ onCopyNotice }) => {
  const [query, setQuery] = useState<string>('github.com');
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [showRaw, setShowRaw] = useState<boolean>(false);
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('whois_history');
      return saved ? JSON.parse(saved) : ['github.com', 'google.com', '1.1.1.1'];
    } catch (e) {
      return ['github.com', 'google.com', '1.1.1.1'];
    }
  });

  const [copiedRaw, setCopiedRaw] = useState<boolean>(false);

  const performLookup = async (target: string) => {
    const cleanTarget = target.trim();
    if (!cleanTarget) return;

    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch(`/api/whois?query=${encodeURIComponent(cleanTarget)}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'WHOIS 查詢失敗');
      }

      setData(result);

      // Save history
      setHistory((prev) => {
        const next = [cleanTarget, ...prev.filter((item) => item.toLowerCase() !== cleanTarget.toLowerCase())].slice(0, 10);
        localStorage.setItem('whois_history', JSON.stringify(next));
        return next;
      });
    } catch (err: any) {
      setError(err.message || '無法連線至 WHOIS / RDAP 伺服器');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performLookup('github.com');
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(query);
  };

  const getDaysUntilExp = (expDateStr: string | null) => {
    if (!expDateStr) return null;
    const exp = new Date(expDateStr);
    const now = new Date();
    const diffMs = exp.getTime() - now.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '無資料';
    try {
      return new Date(dateStr).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const daysRemaining = data ? getDaysUntilExp(data.expiresDate) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            WHOIS 系列查詢工具
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            查詢網域名稱與 IP 位址的註冊商、到期日、DNS 伺服器與權威 RDAP 記錄
          </p>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs p-5 space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="輸入網域名稱 (e.g. github.com) 或 IP 位址 (e.g. 1.1.1.1)"
              className="w-full pl-10 pr-4 py-2.5 text-sm font-mono border border-stone-300 rounded-lg bg-stone-50/50 text-stone-900 focus:bg-white focus:border-[#4A6B5D] focus:ring-1 focus:ring-[#4A6B5D] outline-none"
            />
            <Globe className="w-4 h-4 text-stone-600 absolute left-3.5 top-3.5" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#4A6B5D] hover:bg-[#3B574B] text-white text-sm font-semibold rounded-lg transition-colors shadow-xs shrink-0 disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            {loading ? '查詢中...' : '進行 WHOIS 查詢'}
          </button>
        </form>

        {/* Search History Chips */}
        {history.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-stone-100 flex-wrap">
            <span className="text-xs text-stone-600 font-medium flex items-center gap-1">
              <History className="w-3 h-3 text-stone-600" />
              近期查詢:
            </span>
            {history.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setQuery(item);
                  performLookup(item);
                }}
                className="px-2.5 py-0.5 text-xs font-mono rounded bg-stone-100 hover:bg-[#EBF2EE] hover:text-[#2D4A3E] text-stone-700 transition-colors border border-stone-200"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Section */}
      {data && (
        <div className="space-y-5">
          {/* Main Info Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Target Domain */}
            <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block">
                查詢對象 ({data.type})
              </span>
              <div className="text-base font-bold text-stone-900 font-mono truncate">
                {data.ldhName || data.query}
              </div>
              <div className="text-xs text-stone-700 font-mono">Handle: {data.handle || 'N/A'}</div>
            </div>

            {/* Registrar */}
            <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block">
                註冊商 (Registrar)
              </span>
              <div className="text-sm font-bold text-stone-800 truncate">{data.registrar}</div>
            </div>

            {/* Registration Date */}
            <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block">
                註冊時間 (Created)
              </span>
              <div className="text-xs font-semibold font-mono text-stone-800">
                {formatDate(data.createdDate)}
              </div>
            </div>

            {/* Expiration Date */}
            <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block">
                到期時間 (Expires)
              </span>
              <div className="text-xs font-semibold font-mono text-stone-800">
                {formatDate(data.expiresDate)}
              </div>
              {daysRemaining !== null && (
                <div
                  className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                    daysRemaining < 30
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-[#EBF2EE] text-[#2D4A3E]'
                  }`}
                >
                  {daysRemaining > 0 ? `剩餘 ${daysRemaining} 天` : '已到期'}
                </div>
              )}
            </div>
          </div>

          {/* Detailed Info Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Nameservers */}
            <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs p-5 space-y-3">
              <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                <Server className="w-4 h-4 text-[#4A6B5D]" />
                DNS 名稱伺服器 (Name Servers)
              </h3>
              {data.nameServers && data.nameServers.length > 0 ? (
                <ul className="space-y-1.5 font-mono text-xs">
                  {data.nameServers.map((ns: string, idx: number) => (
                    <li key={idx} className="px-3 py-1.5 bg-stone-50 rounded border border-stone-200 text-stone-800">
                      {ns}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-stone-600">無公佈 Name Server 資料</div>
              )}
            </div>

            {/* Statuses */}
            <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs p-5 space-y-3">
              <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#4A6B5D]" />
                網域狀態標籤 (Domain Statuses)
              </h3>
              {data.status && data.status.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                  {data.status.map((st: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded border border-stone-200"
                    >
                      {st}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-stone-600">無 Domain Status 資料</div>
              )}
            </div>
          </div>

          {/* Raw RDAP Tree */}
          <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs overflow-hidden">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="w-full px-5 py-3 bg-stone-50/80 border-b border-stone-200/80 flex items-center justify-between text-xs font-bold text-stone-700 uppercase tracking-wider hover:bg-stone-100 transition-colors"
            >
              <span>原始 RDAP JSON 資料 (Raw RDAP Response)</span>
              {showRaw ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showRaw && (
              <div className="p-4 bg-stone-900 text-stone-200 font-mono text-xs max-h-96 overflow-y-auto">
                <pre>{JSON.stringify(data.rawRdap, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
