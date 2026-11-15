/**
 * Markdown 外部連結在新分頁開啟（Sätteri hast plugin，於 astro.config.mjs 中註冊）。
 *
 * - 對象：href 為 http(s):// 且主機不是本站（`site`）的 <a>
 * - 加上 target="_blank" 與 rel="noopener noreferrer"
 *   （noopener：新分頁無法透過 window.opener 操作本頁；noreferrer：不傳送來源網址）
 * - 站內連結、錨點（#...）、mailto: 等維持原本行為
 */
import { defineHastPlugin } from "satteri";

export function externalLinks({ site }: { site?: string } = {}) {
    const ownHost = site ? new URL(site).host : undefined;

    return defineHastPlugin({
        name: "external-links",
        element: {
            filter: ["a"],
            visit(node, ctx) {
                const href = node.properties?.href;
                if (typeof href !== "string" || !/^https?:\/\//i.test(href)) return;
                if (ownHost && new URL(href).host === ownHost) return;
                ctx.setProperty(node, "target", "_blank");
                ctx.setProperty(node, "rel", ["noopener", "noreferrer"]);
            },
        },
    });
}
