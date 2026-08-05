export async function copyText(value: string): Promise<void> {
  if (!navigator.clipboard) {
    throw new Error('目前瀏覽器不允許使用剪貼簿功能');
  }
  await navigator.clipboard.writeText(value);
}

export function downloadText(filename: string, value: string, mime = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([value], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage 可能被瀏覽器隱私設定封鎖，工具本身仍可正常使用。
  }
}

export function encodeBase64Utf8(value: string, urlSafe = false): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  const encoded = btoa(binary);
  return urlSafe ? encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : encoded;
}

export function decodeBase64Utf8(value: string, urlSafe = false): string {
  let normalized = value.trim();
  if (urlSafe || normalized.includes('-') || normalized.includes('_')) {
    normalized = normalized.replace(/-/g, '+').replace(/_/g, '/');
    while (normalized.length % 4) normalized += '=';
  }
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
