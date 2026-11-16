/**
 * nginx 的短網址對照表（/short-links.map），供 deploy/nginx.conf 以 map 做 301 轉址。
 * 每個代碼輸出有無結尾斜線兩種寫法。
 */
import type { APIRoute } from "astro";
import { articlePath, getShortLinks, shortPath } from "../utils/shortLinks";

export const GET: APIRoute = async () => {
    const lines = (await getShortLinks()).flatMap(({ code, article }) => {
        const from = shortPath(code);
        // Location 標頭需為編碼後的網址（中文路徑等）
        const to = encodeURI(articlePath(article));
        return [`${from} ${to};`, `${from}/ ${to};`];
    });
    return new Response(lines.join("\n") + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
