import React, { useState, useEffect } from 'react';
import { FileText, Upload, Copy, Download, Check, RefreshCw, ArrowRightLeft, FileCode, Eye } from 'lucide-react';

interface Base64ToolProps {
  onCopyNotice: (msg: string) => void;
}

export const Base64Tool: React.FC<Base64ToolProps> = ({ onCopyNotice }) => {
  const [tab, setTab] = useState<'text' | 'file'>('text');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [urlSafe, setUrlSafe] = useState<boolean>(false);
  const [input, setInput] = useState<string>('Hello, 和風 IT Tools! 🌸');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // File mode states
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');

  // UTF-8 friendly Base64 encode
  const encodeBase64Utf8 = (str: string, isUrlSafe: boolean) => {
    try {
      const bytes = new TextEncoder().encode(str);
      let binStr = '';
      bytes.forEach((b) => (binStr += String.fromCharCode(b)));
      let base64 = btoa(binStr);
      if (isUrlSafe) {
        base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      }
      return base64;
    } catch (e: any) {
      throw new Error(`编码失败: ${e.message}`);
    }
  };

  // UTF-8 friendly Base64 decode
  const decodeBase64Utf8 = (str: string, isUrlSafe: boolean) => {
    try {
      let cleaned = str.trim();
      if (isUrlSafe || cleaned.includes('-') || cleaned.includes('_')) {
        cleaned = cleaned.replace(/-/g, '+').replace(/_/g, '/');
        while (cleaned.length % 4) {
          cleaned += '=';
        }
      }
      const binStr = atob(cleaned);
      const bytes = Uint8Array.from(binStr, (c) => c.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    } catch (e: any) {
      throw new Error('格式無效，無法進行 Base64 解碼 (Invalid Base64)');
    }
  };

  useEffect(() => {
    if (tab === 'file') return;
    setError('');
    if (!input.trim()) {
      setOutput('');
      return;
    }

    try {
      if (mode === 'encode') {
        const res = encodeBase64Utf8(input, urlSafe);
        setOutput(res);
      } else {
        const res = decodeBase64Utf8(input, urlSafe);
        setOutput(res);
      }
    } catch (err: any) {
      setError(err.message || '處理失敗');
      setOutput('');
    }
  }, [input, mode, urlSafe, tab]);

  // Handle file drop
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (f: File) => {
    setFile(f);
    setFileType(f.type);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFileBase64(result);
    };
    reader.readAsDataURL(f);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    onCopyNotice('已複製到剪貼簿');
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadOutput = () => {
    const textToDownload = tab === 'text' ? output : fileBase64;
    const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `base64-result-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onCopyNotice('檔案已開始下載');
  };

  const getByteSize = (str: string) => {
    return new TextEncoder().encode(str).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            Base64 工具
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            支援 UTF-8 文字編解碼、URL-safe 格式，以及檔案轉換 Data URI / Base64
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-stone-200/60 rounded-lg border border-stone-300/50 self-start sm:self-auto">
          <button
            onClick={() => setTab('text')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              tab === 'text'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            文字編解碼 (Text)
          </button>
          <button
            onClick={() => setTab('file')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              tab === 'file'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            檔案轉 Base64 (File)
          </button>
        </div>
      </div>

      {tab === 'text' ? (
        <div className="space-y-5">
          {/* Controls */}
          <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-lg border border-stone-200">
                <button
                  type="button"
                  onClick={() => setMode('encode')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                    mode === 'encode'
                      ? 'bg-[#4A6B5D] text-white shadow-xs font-semibold'
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  編碼 (Encode)
                </button>
                <button
                  type="button"
                  onClick={() => setMode('decode')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                    mode === 'decode'
                      ? 'bg-[#4A6B5D] text-white shadow-xs font-semibold'
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  解碼 (Decode)
                </button>
              </div>

              <label className="flex items-center gap-2 text-xs text-stone-700 font-medium ml-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={urlSafe}
                  onChange={(e) => setUrlSafe(e.target.checked)}
                  className="rounded border-stone-300 text-[#4A6B5D] focus:ring-[#4A6B5D]"
                />
                URL-Safe 模式 (用 - _ 替換 + /)
              </label>
            </div>

            <button
              onClick={() => {
                const temp = input;
                setInput(output);
                setMode(mode === 'encode' ? 'decode' : 'encode');
              }}
              disabled={!output}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-stone-300 rounded-md bg-stone-50 hover:bg-stone-100 text-stone-700 disabled:opacity-50"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#4A6B5D]" />
              對調輸入輸出
            </button>
          </div>

          {/* Text Editor Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Input Panel */}
            <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs flex flex-col h-96">
              <div className="flex items-center justify-between px-4 py-3 bg-stone-50/80 border-b border-stone-200/80 rounded-t-xl">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  輸入數據 ({mode === 'encode' ? '明文' : 'Base64'})
                </span>
                <span className="text-[11px] font-mono text-stone-600">
                  {input.length} 字元 / {getByteSize(input)} Bytes
                </span>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="在此輸入要處理的文字內容..."
                className="w-full flex-1 p-4 font-mono text-xs border-none outline-none resize-none bg-transparent text-stone-800 placeholder:text-stone-400"
              />
            </div>

            {/* Output Panel */}
            <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs flex flex-col h-96">
              <div className="flex items-center justify-between px-4 py-3 bg-stone-50/80 border-b border-stone-200/80 rounded-t-xl">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  轉換結果 ({mode === 'encode' ? 'Base64' : '解碼明文'})
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-stone-600">
                    {output.length} 字元 / {getByteSize(output)} Bytes
                  </span>
                  <button
                    onClick={() => handleCopy(output)}
                    disabled={!output}
                    className="p-1 text-stone-500 hover:text-stone-900 disabled:opacity-30"
                    title="複製結果"
                  >
                    {copied ? <Check className="w-4 h-4 text-[#4A6B5D]" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleDownloadOutput}
                    disabled={!output}
                    className="p-1 text-stone-500 hover:text-stone-900 disabled:opacity-30"
                    title="下載文本"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {error ? (
                <div className="p-5 text-xs text-rose-600 bg-rose-50/50 flex-1 font-mono">
                  ⚠️ {error}
                </div>
              ) : (
                <textarea
                  readOnly
                  value={output}
                  placeholder="轉換結果將顯示於此..."
                  className="w-full flex-1 p-4 font-mono text-xs border-none outline-none resize-none bg-stone-50/30 text-stone-800"
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        /* File Mode */
        <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs p-6 space-y-6">
          <div className="border-2 border-dashed border-stone-300 hover:border-[#4A6B5D] rounded-xl p-8 text-center bg-stone-50/50 transition-colors relative cursor-pointer">
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-[#EBF2EE] text-[#4A6B5D] rounded-full">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-800">
                  點擊上傳或拖曳檔案至此
                </p>
                <p className="text-xs text-stone-700 mt-1">
                  支援圖片、文件、音訊等任何檔案格式，最大建議 10MB
                </p>
              </div>
            </div>
          </div>

          {file && fileBase64 && (
            <div className="space-y-4 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-800">{file.name}</h4>
                  <p className="text-xs text-stone-700 font-mono">
                    大小: {(file.size / 1024).toFixed(1)} KB | 類型: {fileType || 'Unknown'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(fileBase64)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[#4A6B5D] text-white hover:bg-[#3B574B] transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    複製 Data URI Base64
                  </button>
                  <button
                    onClick={handleDownloadOutput}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-stone-300 hover:bg-stone-50 text-stone-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    下載文本
                  </button>
                </div>
              </div>

              {/* Image preview if applicable */}
              {fileType.startsWith('image/') && (
                <div className="p-4 bg-stone-100 rounded-lg flex items-center justify-center max-h-64 overflow-hidden border border-stone-200">
                  <img
                    src={fileBase64}
                    alt="Preview"
                    className="max-h-56 object-contain rounded shadow-xs"
                  />
                </div>
              )}

              {/* Data URI Output textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Base64 Data URI 字串
                </label>
                <textarea
                  readOnly
                  rows={6}
                  value={fileBase64}
                  className="w-full p-3 font-mono text-xs border border-stone-200 rounded-lg bg-stone-50 text-stone-800 outline-none"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
