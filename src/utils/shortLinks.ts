/**
 * 建置時產生的短網址：/s/<代碼> → 文章。
 *
 * - 代碼：文章路徑（id）的 SHA-1 取前段轉 base62，固定 6 碼；路徑不變代碼就不變
 * - 文章 frontmatter 可用 `short: xxx` 自訂代碼（搬移 / 改名文章後仍有效）
 * - 代碼重複時建置失敗，避免短網址指到錯的文章
 *
 * 產生的檔案：
 * - /s/<代碼>/index.html：轉址頁（src/pages/s/[code].astro）
 * - /short-links.map：給 nginx 做 301 轉址（src/pages/short-links.map.ts，用法見 deploy/nginx.conf）
 */
import { createHash } from "node:crypto";
import { getArticles, type Article } from "./articles";

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LENGTH = 6;

/** 文章的短網址代碼 */
export function shortCode(article: Article): string {
    if (article.data.short) return article.data.short;
    // 取 SHA-1 前 8 bytes 轉 base62
    let n = createHash("sha1").update(article.id).digest().readBigUInt64BE(0);
    let code = "";
    for (let i = 0; i < LENGTH; i++) {
        code += ALPHABET[Number(n % 62n)];
        n /= 62n;
    }
    return code;
}

export function shortPath(code: string): string {
    return `/s/${code}`;
}

export function articlePath(article: Article): string {
    return `/articles/${article.id}`;
}

/** 所有短網址（含隱藏類別的文章，與文章頁面一致）；代碼重複時拋出錯誤 */
export async function getShortLinks(): Promise<{ code: string; article: Article }[]> {
    const articles = await getArticles({ includeHidden: true });
    const seen = new Map<string, Article>();
    for (const article of articles) {
        const code = shortCode(article);
        const other = seen.get(code);
        if (other) {
            throw new Error(
                `[short-links] 短網址代碼「${code}」重複：${other.id} 與 ${article.id}，請在其中一篇的 frontmatter 設定不同的 short`,
            );
        }
        seen.set(code, article);
    }
    return [...seen].map(([code, article]) => ({ code, article }));
}
