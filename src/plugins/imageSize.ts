/**
 * Markdown 圖片寬度語法（Sätteri hast plugin，於 astro.config.mjs 中註冊）。
 *
 *   ![圖片說明|400](./photo.png)   → 寬度 400px，高度依原圖比例自動計算
 *
 * - 在替代文字最後加上 `|寬度`（單位 px），`|` 與後面的數字不會出現在替代文字中
 * - 本地與遠端圖片都會依此寬度產生縮小後的圖片檔（不只是 CSS 縮放），下載量也會變小
 * - 必須在 Astro 的圖片處理（image-marker）之前執行；使用者的 hastPlugins 會排在它前面
 */
import { defineHastPlugin } from "satteri";

const WIDTH_SUFFIX = /\s*\|\s*(\d+)\s*$/;

export function imageSize() {
    return defineHastPlugin({
        name: "image-size",
        element: {
            filter: ["img"],
            visit(node, ctx) {
                const alt = node.properties?.alt;
                if (typeof alt !== "string") return;
                const match = alt.match(WIDTH_SUFFIX);
                if (!match) return;
                ctx.setProperty(node, "alt", alt.slice(0, match.index));
                ctx.setProperty(node, "width", Number(match[1]));
            },
        },
    });
}
