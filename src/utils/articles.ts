import { getCollection, type CollectionEntry } from "astro:content";
import { isHiddenArticle } from "./categories";
import { site } from "../config/site";

export type Article = CollectionEntry<"articles">;

/**
 * 取得所有已發布文章，依日期新到舊排序。
 * 預設排除隱藏類別（見 src/config/categories.ts 的 hidden）中的文章；
 * `includeHidden: true` 用於產生文章頁面本身。
 */
export async function getArticles({ includeHidden = false } = {}): Promise<Article[]> {
    const all = await getCollection(
        "articles",
        (entry) => !entry.data.draft && (includeHidden || !isHiddenArticle(entry)),
    );
    return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** 取得日期時間在網站時區中的各個欄位 */
function parts(date: Date): Record<string, string> {
    const fmt = new Intl.DateTimeFormat("en-CA", {
        timeZone: site.timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    });
    return Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
}

/** YYYY-MM-DD（網站時區） */
export function formatDate(date: Date): string {
    const p = parts(date);
    return `${p.year}-${p.month}-${p.day}`;
}

/** YYYY-MM-DD HH:mm（網站時區） */
export function formatDateTime(date: Date): string {
    const p = parts(date);
    return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

/** 用於網址錨點的代稱，例如 "Web Dev" -> "web-dev" */
export function toSlug(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, "-");
}

/** 依 key 分組，回傳 [名稱, 文章[]]，依文章數多到少排序 */
export function groupBy(articles: Article[], keys: (a: Article) => string[]): [string, Article[]][] {
    const map = new Map<string, Article[]>();
    for (const a of articles) {
        for (const k of keys(a)) {
            if (!map.has(k)) map.set(k, []);
            map.get(k)!.push(a);
        }
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
}
