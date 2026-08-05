import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  // 自訂網域使用站台根目錄，不應帶入 repository 名稱。
  base: '/',
});
