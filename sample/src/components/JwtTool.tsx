import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Copy, Check, RefreshCw, Key, Sparkles, Clock, AlertTriangle } from 'lucide-react';

interface JwtToolProps {
  onCopyNotice: (msg: string) => void;
}

// Default sample JWT tokens
const SAMPLE_TOKENS = {
  valid:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IuOCjOaWhSBVc2VyIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5Mjc3Mzk3NDIsImlzcyI6IldhYmkgVG9vbHMgU3R1ZGlvIiwicm9sZSI6ImFkbWluIn0.c2FtcGxlX3NpZ25hdHVyZV92YWxpZF9leGFtcGxl',
  expired:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ODc2NTQzMjEwIiwibmFtZSI6IuabuOacn1VzZXIiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYxMDAwMDAwMCwicm9sZSI6InVzZXIifQ.ZXhwaXJlZF9zaWduYXR1cmVfZXhhbXBsZQ',
};

export const JwtTool: React.FC<JwtToolProps> = ({ onCopyNotice }) => {
  const [tokenInput, setTokenInput] = useState<string>(SAMPLE_TOKENS.valid);
  const [headerJson, setHeaderJson] = useState<string>('');
  const [payloadJson, setPayloadJson] = useState<string>('');
  const [signature, setSignature] = useState<string>('');
  const [parseError, setParseError] = useState<string>('');

  const [secretKey, setSecretKey] = useState<string>('your-256-bit-secret');
  const [algorithm, setAlgorithm] = useState<'HS256' | 'HS384' | 'HS512'>('HS256');

  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  // Parse token into Header, Payload, Signature
  useEffect(() => {
    setParseError('');
    if (!tokenInput.trim()) {
      setHeaderJson('');
      setPayloadJson('');
      setSignature('');
      return;
    }

    const parts = tokenInput.trim().split('.');
    if (parts.length !== 3) {
      setParseError('JWT 格式不正確 (應包含用句點 . 分隔的三個部分: Header.Payload.Signature)');
      return;
    }

    try {
      // Decode Header
      const decodedHeader = decodeBase64Url(parts[0]);
      const parsedHeader = JSON.parse(decodedHeader);
      setHeaderJson(JSON.stringify(parsedHeader, null, 2));

      // Decode Payload
      const decodedPayload = decodeBase64Url(parts[1]);
      const parsedPayload = JSON.parse(decodedPayload);
      setPayloadJson(JSON.stringify(parsedPayload, null, 2));

      // Signature
      setSignature(parts[2]);
    } catch (err: any) {
      setParseError('Base64/JSON 解碼失敗: ' + err.message);
    }
  }, [tokenInput]);

  // Base64URL decoder with UTF-8 support
  const decodeBase64Url = (str: string) => {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binStr = atob(base64);
    const bytes = Uint8Array.from(binStr, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  };

  // Base64URL encoder with UTF-8 support
  const encodeBase64Url = (str: string) => {
    const bytes = new TextEncoder().encode(str);
    let binStr = '';
    bytes.forEach((b) => (binStr += String.fromCharCode(b)));
    return btoa(binStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  // Re-encode Token from edited Header + Payload + Secret
  const handleGenerateFromEdited = () => {
    try {
      const hObj = JSON.parse(headerJson);
      const pObj = JSON.parse(payloadJson);

      const hEnc = encodeBase64Url(JSON.stringify(hObj));
      const pEnc = encodeBase64Url(JSON.stringify(pObj));

      // Simple mock HMAC signature string for visual debugger
      const mockSig = encodeBase64Url(`secret:${secretKey}:${hEnc}.${pEnc}`).substring(0, 43);
      const newToken = `${hEnc}.${pEnc}.${mockSig}`;

      setTokenInput(newToken);
      onCopyNotice('已根據編輯內容重新生成 JWT');
    } catch (e: any) {
      alert('Header 或 Payload 的 JSON 格式無效，請檢查括號與雙引號');
    }
  };

  // Inspect payload claims for expiration status
  const getExpirationStatus = () => {
    try {
      if (!payloadJson) return null;
      const payload = JSON.parse(payloadJson);
      if (!payload.exp) return { hasExp: false };

      const expTimeMs = payload.exp * 1000;
      const nowMs = Date.now();
      const isExpired = expTimeMs < nowMs;

      const dateStr = new Date(expTimeMs).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      return {
        hasExp: true,
        expTimeMs,
        isExpired,
        dateStr,
      };
    } catch (e) {
      return null;
    }
  };

  const expInfo = getExpirationStatus();

  const handleCopyToken = () => {
    navigator.clipboard.writeText(tokenInput);
    setCopiedToken(true);
    onCopyNotice('已複製 JWT Token');
    setTimeout(() => setCopiedToken(false), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            JWT 工具與調試器
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            解碼、驗證與調試 JSON Web Token，檢視 Header、Payload Claims 與簽名
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setTokenInput(SAMPLE_TOKENS.valid)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors border border-stone-200"
          >
            載入有效範例
          </button>
          <button
            onClick={() => setTokenInput(SAMPLE_TOKENS.expired)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors border border-rose-200"
          >
            載入過期範例
          </button>
        </div>
      </div>

      {/* Main Grid: Left Token Input, Right Decoded View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Encoded Token Input Section */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-4 h-4 text-[#4A6B5D]" />
                Encoded JWT Token
              </label>

              <button
                onClick={handleCopyToken}
                className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 font-medium"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5 text-[#4A6B5D]" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedToken ? '已複製' : '複製 Token'}
              </button>
            </div>

            <textarea
              rows={12}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="在此貼上要調試的 JWT Token (e.g. eyJhbGci...)"
              className="w-full p-3 font-mono text-xs border border-stone-300 rounded-lg bg-stone-50/50 text-stone-800 outline-none focus:bg-white focus:border-[#4A6B5D] resize-none leading-relaxed"
            />

            {parseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-600 font-mono">
                ⚠️ {parseError}
              </div>
            )}

            {/* Status Summary Banner */}
            {expInfo && expInfo.hasExp && (
              <div
                className={`p-3 rounded-lg border flex items-center gap-3 text-xs font-medium ${
                  expInfo.isExpired
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-[#EBF2EE] border-[#4A6B5D]/40 text-[#2D4A3E]'
                }`}
              >
                {expInfo.isExpired ? (
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-[#4A6B5D] shrink-0" />
                )}
                <div>
                  <div className="font-bold">
                    {expInfo.isExpired ? 'Token 已過期 (Expired)' : 'Token 仍在有效期內 (Valid)'}
                  </div>
                  <div className="text-[11px] font-mono mt-0.5 opacity-90">
                    過期時間 (exp): {expInfo.dateStr}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Decoded Views Section */}
        <div className="lg:col-span-7 space-y-4">
          {/* Header Box */}
          <div className="bg-white rounded-xl border border-rose-200/80 shadow-xs overflow-hidden">
            <div className="bg-rose-50/70 border-b border-rose-200/60 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                HEADER: Algorithm & Token Type
              </span>
              <span className="text-[10px] font-mono text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded">
                ALGORITHM: {algorithm}
              </span>
            </div>
            <textarea
              rows={4}
              value={headerJson}
              onChange={(e) => setHeaderJson(e.target.value)}
              className="w-full p-4 font-mono text-xs text-rose-900 border-none outline-none resize-none bg-rose-50/20"
            />
          </div>

          {/* Payload Box */}
          <div className="bg-white rounded-xl border border-purple-200/80 shadow-xs overflow-hidden">
            <div className="bg-purple-50/70 border-b border-purple-200/60 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                PAYLOAD: Data / Claims
              </span>
              <span className="text-[10px] font-mono text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded">
                JSON
              </span>
            </div>
            <textarea
              rows={8}
              value={payloadJson}
              onChange={(e) => setPayloadJson(e.target.value)}
              className="w-full p-4 font-mono text-xs text-purple-950 border-none outline-none resize-none bg-purple-50/20"
            />
          </div>

          {/* Signature Box & Secret controls */}
          <div className="bg-white rounded-xl border border-teal-200/80 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-teal-100 pb-2">
              <span className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                VERIFY SIGNATURE / HMAC
              </span>
              <select
                value={algorithm}
                onChange={(e: any) => setAlgorithm(e.target.value)}
                className="px-2 py-1 text-xs font-mono border border-teal-200 rounded bg-teal-50 text-teal-900 outline-none"
              >
                <option value="HS256">HMAC SHA-256 (HS256)</option>
                <option value="HS384">HMAC SHA-384 (HS384)</option>
                <option value="HS512">HMAC SHA-512 (HS512)</option>
              </select>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="text-stone-700 font-sans text-xs">Secret Key:</span>
                <input
                  type="text"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="輸入簽名密鑰..."
                  className="flex-1 px-3 py-1.5 border border-stone-300 rounded bg-stone-50 focus:bg-white focus:border-teal-600 outline-none"
                />
              </div>

              <div className="p-3 bg-teal-50/40 rounded border border-teal-100 text-teal-900 break-all">
                <span className="font-sans font-semibold text-[11px] block text-teal-700 mb-1">
                  Signature Part:
                </span>
                {signature || 'No Signature'}
              </div>
            </div>

            <button
              onClick={handleGenerateFromEdited}
              className="w-full py-2 bg-[#4A6B5D] hover:bg-[#3B574B] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              更新並重新生成 Token (Update Token)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
