/**
 * 記錄 Markdown 本地圖片的原始路徑（Sätteri hast plugin，於 astro.config.mjs 中註冊）。
 *
 * Astro 會把 Markdown 圖片轉成縮小 / 壓縮後的版本，輸出的 HTML 中只剩處理後的網址。
 * 這裡先把原本寫在 Markdown 的相對路徑存到 data-original 屬性，
 * 文章頁面（src/pages/articles/[...slug].astro）再據此對應到原始圖片的網址，供放大檢視使用。
 *
 * 必須在 Astro 的圖片處理（image-marker）之前執行；使用者的 hastPlugins 會排在它前面。
 */
import { defineHastPlugin } from "satteri";

export function originalImage() {
    return defineHastPlugin({
        name: "original-image",
        element: {
            filter: ["img"],
            visit(node, ctx) {
                const src = node.properties?.src;
                // 只處理相對路徑（本地圖片）；遠端與 public/ 的圖片不會被轉檔，原本的網址就是原圖
                if (typeof src !== "string" || /^([a-z]+:|\/)/i.test(src)) return;
                // 使用 HTML 屬性名稱（而非 hast 的 dataOriginal）：Astro 會把這些屬性原樣傳給圖片處理後輸出
                ctx.setProperty(node, "data-original", decodeURI(src));
            },
        },
    });
}
