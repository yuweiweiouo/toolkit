import React, { useState, useEffect } from 'react';
import { Wifi, MapPin, Globe, Server, Copy, Check, RefreshCw, Cpu, Activity, Search } from 'lucide-react';

interface WhatIsMyIpProps {
  onCopyNotice: (msg: string) => void;
}

export const WhatIsMyIp: React.FC<WhatIsMyIpProps> = ({ onCopyNotice }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [ipData, setIpData] = useState<any>(null);
  const [customIpInput, setCustomIpInput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Ping latencies state
  const [pings, setPings] = useState<{ [key: string]: number | string }>({
    'Cloudflare (1.1.1.1)': '檢測中...',
    'Google DNS (8.8.8.8)': '檢測中...',
    'Quad9 (9.9.9.9)': '檢測中...',
  });

  const fetchIpData = async (targetIp?: string) => {
    setLoading(true);
    setError('');
    try {
      const url = targetIp ? `/api/ip?ip=${encodeURIComponent(targetIp)}` : '/api/ip';
      const res = await fetch(url);
      if (!res.ok) throw new Error('無法擷取 IP 資訊');
      const result = await res.json();
      setIpData(result);
    } catch (err: any) {
      setError(err.message || '無法連線至 IP 檢測服務');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIpData();
    runPingTests();
  }, []);

  // Measure HTTP ping latencies
  const runPingTests = async () => {
    const targets = [
      { name: 'Cloudflare (1.1.1.1)', url: 'https://1.1.1.1/cdn-cgi/trace' },
      { name: 'Google DNS (8.8.8.8)', url: 'https://dns.google' },
      { name: 'Quad9 (9.9.9.9)', url: 'https://quad9.net' },
    ];

    const results: { [key: string]: number | string } = {};

    for (const t of targets) {
      const start = performance.now();
      try {
        await fetch(t.url, { mode: 'no-cors', cache: 'no-store' });
        const elapsed = Math.round(performance.now() - start);
        results[t.name] = `${elapsed} ms`;
      } catch (e) {
        results[t.name] = '逾時 / 阻擋';
      }
    }
    setPings(results);
  };

  const handleCopyIp = () => {
    if (ipData?.ip) {
      navigator.clipboard.writeText(ipData.ip);
      setCopied(true);
      onCopyNotice('已複製 IP 位址');
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleSearchCustomIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (customIpInput.trim()) {
      fetchIpData(customIpInput.trim());
    }
  };

  // Convert country code to emoji flag
  const getCountryFlagEmoji = (countryCode: string) => {
    if (!countryCode || countryCode.length !== 2) return '🌐';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            What Is My IP 工具
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            檢測您當前的公網 IP 位址、地理位置、ISP 電信商與網路延遲
          </p>
        </div>

        <button
          onClick={() => {
            fetchIpData();
            runPingTests();
          }}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-[#323336] hover:bg-stone-800 text-white text-xs font-medium rounded-md transition-all shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          重新檢測
        </button>
      </div>

      {/* Query Bar */}
      <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs p-4">
        <form onSubmit={handleSearchCustomIp} className="flex gap-2">
          <input
            type="text"
            value={customIpInput}
            onChange={(e) => setCustomIpInput(e.target.value)}
            placeholder="輸入指定 IP 進行查詢 (例如 8.8.8.8)..."
            className="flex-1 px-4 py-2 text-xs font-mono border border-stone-300 rounded-lg bg-stone-50/50 text-stone-900 focus:bg-white focus:border-[#4A6B5D] outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-stone-100 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            查詢指定 IP
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs p-12 text-center text-stone-400 font-mono text-xs">
          正在檢測您的 IP 位址與網路路由...
        </div>
      ) : ipData ? (
        <div className="space-y-6">
          {/* Main Hero IP Card */}
          <div className="bg-gradient-to-br from-[#1E232A] to-[#2B323D] text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-mono tracking-widest uppercase bg-stone-700/80 text-stone-200 px-2.5 py-0.5 rounded-full border border-stone-600">
                    YOUR PUBLIC IP
                  </span>
                  <span className="text-[11px] font-mono text-[#7BB38E] bg-[#7BB38E]/10 px-2 py-0.5 rounded border border-[#7BB38E]/20">
                    {ipData.isIpv6 ? 'IPv6' : 'IPv4'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white select-all">
                    {ipData.ip}
                  </span>
                  <button
                    onClick={handleCopyIp}
                    className="p-2 rounded-lg bg-stone-700/60 hover:bg-stone-600/80 transition-colors text-stone-200"
                    title="複製 IP"
                  >
                    {copied ? <Check className="w-5 h-5 text-[#7BB38E]" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-stone-300">
                  <span className="flex items-center gap-1.5">
                    <span className="text-lg">{getCountryFlagEmoji(ipData.geo.countryCode)}</span>
                    {ipData.geo.country} ({ipData.geo.countryCode})
                  </span>
                  <span>•</span>
                  <span>{ipData.geo.city || ipData.geo.region || '城市未知'}</span>
                  <span>•</span>
                  <span>{ipData.geo.isp}</span>
                </div>
              </div>

              <div className="shrink-0 p-4 bg-stone-800/80 rounded-xl border border-stone-700/60 font-mono text-xs space-y-1">
                <div className="text-stone-400 text-[10px] uppercase tracking-wider">網路與時區</div>
                <div className="text-stone-200 font-semibold">{ipData.geo.org || ipData.geo.isp}</div>
                <div className="text-stone-400 text-[11px]">{ipData.geo.timezone || '時區未知'}</div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Geolocation Card */}
            <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs p-5 space-y-3">
              <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#4A6B5D]" />
                地理位置 (Geolocation)
              </h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-700 font-sans">國家 / 地區:</span>
                  <span className="font-semibold text-stone-800">
                    {getCountryFlagEmoji(ipData.geo.countryCode)} {ipData.geo.country}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-700 font-sans">省份 / 州:</span>
                  <span className="font-semibold text-stone-800">{ipData.geo.region || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-700 font-sans">城市:</span>
                  <span className="font-semibold text-stone-800">{ipData.geo.city || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-700 font-sans">郵遞區號:</span>
                  <span className="font-semibold text-stone-800">{ipData.geo.zip || '-'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-stone-700 font-sans">經緯度:</span>
                  <span className="font-semibold text-stone-800">
                    {ipData.geo.lat}, {ipData.geo.lon}
                  </span>
                </div>
              </div>
            </div>

            {/* Network / ISP Card */}
            <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs p-5 space-y-3">
              <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                <Server className="w-4 h-4 text-[#4A6B5D]" />
                網路與電信商 (ISP / ASN)
              </h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-700 font-sans">網路服務商 (ISP):</span>
                  <span className="font-semibold text-stone-800 truncate max-w-[160px] text-right">
                    {ipData.geo.isp}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-700 font-sans">組織 (Organization):</span>
                  <span className="font-semibold text-stone-800 truncate max-w-[160px] text-right">
                    {ipData.geo.org || ipData.geo.isp}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-700 font-sans">自治系統 (AS Number):</span>
                  <span className="font-semibold text-stone-800">{ipData.geo.as || '-'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-stone-700 font-sans">時區:</span>
                  <span className="font-semibold text-stone-800">{ipData.geo.timezone || '-'}</span>
                </div>
              </div>
            </div>

            {/* Network Latency Ping */}
            <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs p-5 space-y-3">
              <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#4A6B5D]" />
                網路回應延遲 (Ping Latency)
              </h3>
              <div className="space-y-2 text-xs font-mono">
                {Object.entries(pings).map(([srv, time]) => (
                  <div key={srv} className="flex justify-between py-1.5 border-b border-stone-100">
                    <span className="text-stone-700 font-sans">{srv}:</span>
                    <span className="font-bold text-[#2D4A3E]">{time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* User-Agent & HTTP Request Headers Inspector */}
          <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs p-5 space-y-3">
            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#4A6B5D]" />
              HTTP 請求標頭 (Request Headers & User-Agent)
            </h3>
            <div className="p-4 bg-stone-50/70 rounded-lg border border-stone-200 font-mono text-xs space-y-2 text-stone-800">
              <div>
                <span className="text-stone-700 font-bold block mb-1">User-Agent:</span>
                <span className="text-stone-900 select-all break-all">{ipData.headers['user-agent']}</span>
              </div>
              <div className="pt-2 border-t border-stone-200/60 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-stone-700 font-semibold">Accept-Language:</span>{' '}
                  {ipData.headers['accept-language']}
                </div>
                <div>
                  <span className="text-stone-700 font-semibold">Protocol:</span>{' '}
                  {ipData.headers['x-forwarded-proto']}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
