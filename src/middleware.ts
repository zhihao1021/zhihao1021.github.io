import { defineMiddleware } from "astro:middleware";
import { transformImages } from "./utils/imagePlaceholder";

/**
 * 改寫所有 HTML 頁面中的 <img>，讓圖片在其他資源載入完成後才開始下載，
 * 並在載入前顯示佔位符（詳見 src/utils/imagePlaceholder.ts）。
 * 開發模式與靜態建置（預先渲染）都會執行。
 */
export const onRequest = defineMiddleware(async (_context, next) => {
    const response = await next();
    if (!response.headers.get("content-type")?.includes("text/html")) return response;

    const html = transformImages(await response.text());
    const headers = new Headers(response.headers);
    headers.delete("content-length");

    return new Response(html, { status: response.status, statusText: response.statusText, headers });
});
