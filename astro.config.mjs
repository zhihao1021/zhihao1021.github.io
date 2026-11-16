// @ts-check
import { readFile } from 'node:fs/promises';
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { externalLinks } from './src/plugins/externalLinks';
import { imageSize } from './src/plugins/imageSize';
import { originalImage } from './src/plugins/originalImage';
import { callouts } from './src/plugins/callouts';
import { isHiddenArticleUrl } from './src/utils/hiddenCategories';

/** 建置輸出目錄（Astro 預設的 dist；sitemap 讀取已產生的 HTML 用，若設定了 outDir 需一併修改） */
const outDir = new URL('./dist/', import.meta.url);

/**
 * 從已建置的頁面讀取 <meta property="article:modified_time">（由文章頁面輸出），
 * 讓 sitemap 的 <lastmod> 與頁面上顯示的修改時間一致；沒有的頁面回傳 undefined。
 * @param {string} pageUrl
 * @returns {Promise<string | undefined>}
 */
async function readModifiedTime(pageUrl) {
  const path = new URL(pageUrl).pathname.replace(/^\//, '');
  const candidates = path === '' || path.endsWith('/') ? [`${path}index.html`] : [`${path}.html`, `${path}/index.html`];
  for (const file of candidates) {
    try {
      const html = await readFile(new URL(decodeURIComponent(file), outDir), 'utf8');
      return html.match(/<meta property="article:modified_time" content="([^"]+)"/)?.[1];
    } catch {
      // 試下一個可能的檔名
    }
  }
  return undefined;
}

/** 網站正式網址：sitemap、robots.txt 的絕對網址與外部連結判斷都以此為準（改用自訂網域時記得修改） */
const site = 'https://www.chih-hao.xyz';

// https://astro.build/config
export default defineConfig({
  site,
  markdown: {
    processor: satteri({
      // :::success / info / warning / danger / extend 提示區塊
      features: { directive: true },
      mdastPlugins: [callouts()],
      hastPlugins: [
        // 外部連結在新分頁開啟
        externalLinks({ site }),
        // 圖片寬度語法：![說明|400](./photo.png)
        imageSize(),
        // 記錄本地圖片的原始路徑，放大檢視時顯示原圖
        originalImage(),
      ],
    }),
  },
  integrations: [
    react(),
    // 建置時自動產生 /sitemap-index.xml 與 /sitemap-0.xml
    sitemap({
      // 隱藏類別的文章（noindex）不列入 sitemap
      // 短網址（/s/...）只是轉址頁，也不列入
      filter: (page) => !isHiddenArticleUrl(page) && !new URL(page).pathname.startsWith('/s/'),
      // 文章頁面加上 <lastmod>
      serialize: async (item) => {
        const lastmod = await readModifiedTime(item.url);
        // 與站內連結一致，去掉結尾斜線（首頁除外；deploy/nginx.conf 會把有斜線的網址 301 到無斜線版本）
        const url = new URL(item.url);
        if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/$/, '');
        return { ...item, url: url.href, ...(lastmod && { lastmod }) };
      },
    }),
  ],
});
