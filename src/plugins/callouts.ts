/**
 * HackMD 風格的提示區塊（Sätteri mdast plugin，於 astro.config.mjs 中註冊，需開啟 directive 功能）。
 *
 *   :::success
 *   內容（可使用任何 Markdown）
 *   :::
 *
 *   :::warning[自訂標題]
 *   內容
 *   :::
 *
 * - 支援 success / info / warning / danger，輸出 <div class="callout callout-xxx">
 * - `[...]` 中的文字會成為區塊標題
 * - 其他名稱輸出為 <div class="directive directive-xxx">（不套用樣式，內容照常顯示）
 *
 * 開啟 directive 後，Sätteri 也會把文字中的 `:name`（例如 `18:00`、`note:abc`）
 * 與單獨一行的 `::name` 當成 directive 並吃掉；這裡把它們還原成原本的文字。
 */
import { defineMdastPlugin } from "satteri";

export const CALLOUT_TYPES = ["success", "info", "warning", "danger"] as const;

export function callouts() {
    return defineMdastPlugin({
        name: "callouts",
        // 需要讀取 node.position 來還原原始文字
        options: { position: true },

        containerDirective(node, ctx) {
            const isCallout = (CALLOUT_TYPES as readonly string[]).includes(node.name);
            const className = isCallout ? ["callout", `callout-${node.name}`] : ["directive", `directive-${node.name}`];
            ctx.setField(node, "data", { hName: "div", hProperties: { className } });

            // `:::info[標題]` 的標題段落
            const first = node.children[0];
            if (first?.type === "paragraph" && first.data?.directiveLabel) {
                ctx.setField(first, "data", { hName: "p", hProperties: { className: ["callout-title"] } });
            }
        },

        // 不使用的 directive：還原成原始文字
        textDirective(node, ctx) {
            ctx.replaceNode(node, { type: "text", value: sourceOf(node, ctx.source) });
        },

        leafDirective(node, ctx) {
            ctx.replaceNode(node, {
                type: "paragraph",
                children: [{ type: "text", value: sourceOf(node, ctx.source) }],
            });
        },
    });
}

function sourceOf(node: { position?: { start: { offset?: number }; end: { offset?: number } } }, source: string): string {
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    return start === undefined || end === undefined ? "" : source.slice(start, end);
}
