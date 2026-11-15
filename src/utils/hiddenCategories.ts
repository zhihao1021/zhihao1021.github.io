/**
 * 隱藏類別的判斷。
 * 只依賴設定檔、不依賴 astro:content，因此 astro.config.mjs（sitemap 過濾）也能使用。
 */
import { categoryNames, type CategoryName } from "../config/categories";

/** 該類別或任一上層類別設定了 hidden 時回傳 true，例如 "dev/frontend" */
export function isHiddenCategory(path: string): boolean {
    if (!path) return false;
    let level: Record<string, CategoryName> | undefined = categoryNames;
    for (const part of path.split("/")) {
        const entry: CategoryName | undefined = level?.[part];
        if (!entry) return false;
        if (entry.hidden) return true;
        level = entry.sub;
    }
    return false;
}

/** 網址是否為隱藏類別中的文章頁面，例如 https://example.com/articles/dev/frontend/hello/ */
export function isHiddenArticleUrl(url: string): boolean {
    const match = new URL(url).pathname.match(/^\/articles\/(.+)\/[^/]+\/?$/);
    return match ? isHiddenCategory(decodeURIComponent(match[1])) : false;
}
