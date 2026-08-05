# Wabi Toolkit

以 Vue 3 + Vite 重製的瀏覽器端開發者工具箱。

## 本機開發

```bash
npm install
npm run dev
```

Production build：

```bash
npm run build
npm run preview
```

## GitHub Pages 部署

專案已提供 `.github/workflows/deploy.yml`：

1. 將專案 push 到 GitHub repository 的 `main` branch。
2. 在 repository 的 **Settings → Pages → Build and deployment** 將 Source 設為 **GitHub Actions**。
3. 之後每次 push 到 `main`，Actions 會自動安裝依賴、執行 typecheck/build，並部署 `dist/`。

此專案使用自訂網域 `toolbox.yuweiwei.com`，Vite 的 `base` 固定為 `/`，資源會從 `https://toolbox.yuweiwei.com/assets/` 載入。`public/CNAME` 會在建置時一併複製到 `dist/`，保留 GitHub Pages 的自訂網域設定。

WHOIS 與 IP 查詢會從瀏覽器連線公開 RDAP / IP API；其餘轉換工具均在本機執行。
