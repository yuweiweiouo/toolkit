export type ToolId =
  | 'uuid'
  | 'datetime'
  | 'base64'
  | 'jwt'
  | 'sql'
  | 'whois'
  | 'myip';

export type CategoryId =
  | 'all'
  | 'dev-gen'
  | 'convert-format'
  | 'security-auth'
  | 'network-domain'
  | 'favorites';

export type ToastType = 'success' | 'info' | 'error';

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  icon: string;
  description: string;
}

export interface ToolMeta {
  id: ToolId;
  name: string;
  category: Exclude<CategoryId, 'all' | 'favorites'>;
  description: string;
  icon: string;
}

export interface ToastMessage {
  id: number;
  title: string;
  type: ToastType;
}
