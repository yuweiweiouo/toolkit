import type { CategoryMeta, ToolMeta } from '../types';

export const categories: CategoryMeta[] = [
  {
    id: 'all',
    label: '全部工具',
    icon: 'Grid2X2',
    description: '所有可用開發者工具',
  },
  {
    id: 'dev-gen',
    label: '開發與生成',
    icon: 'Zap',
    description: 'UUID 生成與 SQL 格式化',
  },
  {
    id: 'convert-format',
    label: '轉換與編碼',
    icon: 'RefreshCw',
    description: '時間戳轉換與 Base64 編解碼',
  },
  {
    id: 'security-auth',
    label: '安全與驗證',
    icon: 'ShieldCheck',
    description: 'JWT 解碼與簽名檢視',
  },
  {
    id: 'network-domain',
    label: '網路與網域',
    icon: 'Globe2',
    description: 'WHOIS 查詢與 IP 檢測',
  },
];

export const tools: ToolMeta[] = [
  {
    id: 'uuid',
    name: 'UUIDs 批次生成器',
    category: 'dev-gen',
    description: '批次產生 v1、v4、v7 UUID，支援大小寫、連字符與符號包裹。',
    icon: 'Hash',
  },
  {
    id: 'sql',
    name: 'SQL 格式化工具',
    category: 'dev-gen',
    description: '排版與美化 SQL 語法，支援資料庫方言與關鍵字大小寫。',
    icon: 'Database',
  },
  {
    id: 'datetime',
    name: '日期時間轉換器',
    category: 'convert-format',
    description: 'Unix 時間戳、ISO 8601、和曆與多時區雙向轉換。',
    icon: 'Clock3',
  },
  {
    id: 'base64',
    name: 'Base64 工具',
    category: 'convert-format',
    description: 'UTF-8 文字編解碼、URL-safe 模式與檔案 Data URI。',
    icon: 'FileCode2',
  },
  {
    id: 'jwt',
    name: 'JWT 工具與調試器',
    category: 'security-auth',
    description: '解碼 JWT，分析 Header、Payload Claims 與簽名狀態。',
    icon: 'KeyRound',
  },
  {
    id: 'whois',
    name: 'WHOIS DNS',
    category: 'network-domain',
    description: '查詢網域與 IP 的註冊商、到期日、DNS 與 RDAP 記錄。',
    icon: 'Globe2',
  },
  {
    id: 'myip',
    name: 'What Is My IP',
    category: 'network-domain',
    description: '檢測公網 IP、地理位置、ISP 電信商與 HTTP 標頭。',
    icon: 'Wifi',
  },
];
