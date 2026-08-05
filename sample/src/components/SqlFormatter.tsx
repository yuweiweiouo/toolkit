import React, { useState, useEffect } from 'react';
import { format } from 'sql-formatter';
import { Copy, Check, Sparkles, Code2, Minimize2, Trash2 } from 'lucide-react';

interface SqlFormatterProps {
  onCopyNotice: (msg: string) => void;
}

const SAMPLE_SQL = `SELECT u.id, u.username, u.email, p.title, p.created_at FROM users u LEFT JOIN posts p ON u.id = p.user_id WHERE u.status = 'active' AND p.published_at IS NOT NULL ORDER BY p.created_at DESC LIMIT 50;`;

export const SqlFormatter: React.FC<SqlFormatterProps> = ({ onCopyNotice }) => {
  const [inputSql, setInputSql] = useState<string>(SAMPLE_SQL);
  const [formattedSql, setFormattedSql] = useState<string>('');
  const [dialect, setDialect] = useState<string>('sql');
  const [indentSize, setIndentSize] = useState<number>(2);
  const [useUppercase, setUseUppercase] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const handleFormat = () => {
    setError('');
    if (!inputSql.trim()) {
      setFormattedSql('');
      return;
    }

    try {
      const result = format(inputSql, {
        language: dialect as any,
        tabWidth: indentSize,
        keywordCase: useUppercase ? 'upper' : 'preserve',
      });
      setFormattedSql(result);
    } catch (err: any) {
      setError(`SQL 格式化解析錯誤: ${err.message}`);
    }
  };

  useEffect(() => {
    handleFormat();
  }, [inputSql, dialect, indentSize, useUppercase]);

  const handleMinify = () => {
    if (!inputSql.trim()) return;
    try {
      const minified = inputSql
        .replace(/\s+/g, ' ')
        .replace(/\s*([,()=<>])\s*/g, '$1')
        .trim();
      setFormattedSql(minified);
      onCopyNotice('SQL 已單列壓縮 (Minified)');
    } catch (e: any) {
      setError('壓縮失敗');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedSql);
    setCopied(true);
    onCopyNotice('已複製格式化 SQL');
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            SQL 格式化工具
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            將雜亂的 SQL 語法排版美化，支援多種資料庫方言與關鍵字大寫轉換
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleMinify}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 transition-all shadow-2xs"
          >
            <Minimize2 className="w-3.5 h-3.5 text-stone-600" />
            壓縮單列
          </button>
          <button
            onClick={handleCopy}
            disabled={!formattedSql}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md bg-[#323336] hover:bg-stone-800 text-white transition-all shadow-2xs disabled:opacity-50"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '已複製' : '複製 SQL'}
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Dialect */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-stone-700">資料庫方言:</label>
            <select
              value={dialect}
              onChange={(e) => setDialect(e.target.value)}
              className="px-2.5 py-1 text-xs border border-stone-300 rounded-md bg-stone-50 text-stone-800 outline-none focus:border-[#4A6B5D]"
            >
              <option value="sql">Standard SQL</option>
              <option value="mysql">MySQL</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="sqlite">SQLite</option>
              <option value="mariadb">MariaDB</option>
              <option value="tsql">T-SQL (SQL Server)</option>
              <option value="plsql">PL/SQL (Oracle)</option>
            </select>
          </div>

          {/* Indent size */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-stone-700">縮排空格:</label>
            <select
              value={indentSize}
              onChange={(e) => setIndentSize(Number(e.target.value))}
              className="px-2.5 py-1 text-xs border border-stone-300 rounded-md bg-stone-50 text-stone-800 outline-none focus:border-[#4A6B5D]"
            >
              <option value={2}>2 個空格 (2 Spaces)</option>
              <option value={4}>4 個空格 (4 Spaces)</option>
            </select>
          </div>

          {/* Uppercase keywords */}
          <label className="flex items-center gap-2 text-xs text-stone-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={useUppercase}
              onChange={(e) => setUseUppercase(e.target.checked)}
              className="rounded border-stone-300 text-[#4A6B5D] focus:ring-[#4A6B5D]"
            />
            關鍵字大寫 (UPPERCASE)
          </label>
        </div>

        <button
          onClick={() => setInputSql('')}
          className="text-xs text-stone-600 hover:text-rose-600 flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          清空內容
        </button>
      </div>

      {/* Code Editor Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input */}
        <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs flex flex-col h-[420px]">
          <div className="px-4 py-3 bg-stone-50/80 border-b border-stone-200/80 rounded-t-xl flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
              <Code2 className="w-4 h-4 text-stone-500" />
              原始 SQL 語法 (Input SQL)
            </span>
          </div>
          <textarea
            value={inputSql}
            onChange={(e) => setInputSql(e.target.value)}
            placeholder="在此輸入或貼上 SQL 查詢語法..."
            className="w-full flex-1 p-4 font-mono text-xs border-none outline-none resize-none bg-transparent text-stone-800 leading-relaxed"
          />
        </div>

        {/* Output */}
        <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs flex flex-col h-[420px]">
          <div className="px-4 py-3 bg-stone-50/80 border-b border-stone-200/80 rounded-t-xl flex items-center justify-between">
            <span className="text-xs font-bold text-[#2D4A3E] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#4A6B5D]" />
              美化後 SQL (Formatted Result)
            </span>
            <span className="text-[10px] font-mono text-stone-700 uppercase">
              {dialect}
            </span>
          </div>

          {error ? (
            <div className="p-5 text-xs text-rose-600 bg-rose-50/50 flex-1 font-mono">
              ⚠️ {error}
            </div>
          ) : (
            <textarea
              readOnly
              value={formattedSql}
              placeholder="美化後的 SQL 成果將顯示於此..."
              className="w-full flex-1 p-4 font-mono text-xs border-none outline-none resize-none bg-stone-50/30 text-stone-900 leading-relaxed"
            />
          )}
        </div>
      </div>
    </div>
  );
};
