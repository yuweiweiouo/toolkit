export type ToolId = 
  | 'uuid'
  | 'datetime'
  | 'base64'
  | 'jwt'
  | 'sql'
  | 'whois'
  | 'myip';

export type MainCategory = 
  | 'all'
  | 'dev-gen'
  | 'convert-format'
  | 'security-auth'
  | 'network-domain'
  | 'favorites';

export interface MainCategoryMeta {
  id: MainCategory;
  label: string;
  iconName: string;
  description: string;
}

export interface ToolMeta {
  id: ToolId;
  name: string;
  mainCategory: 'dev-gen' | 'convert-format' | 'security-auth' | 'network-domain';
  description: string;
  iconName: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  type?: 'success' | 'info' | 'error';
}
