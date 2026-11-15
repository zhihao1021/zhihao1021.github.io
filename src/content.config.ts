import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { site } from "./config/site";

/**
 * 只寫日期（例如 `2026-11-16`）時，YAML 會解析成 UTC 午夜，在台灣是早上 8 點；
 * 這裡改成網站時區（site.timezone）的午夜。有寫時間的值維持原樣。
 */
function atSiteMidnight(date: Date): Date {
    const isDateOnly =
        date.getUTCHours() === 0 &&
        date.getUTCMinutes() === 0 &&
        date.getUTCSeconds() === 0 &&
        date.getUTCMilliseconds() === 0;
    if (!isDateOnly) return date;

    // 網站時區在該時刻與 UTC 的差距
    const p = Object.fromEntries(
        new Intl.DateTimeFormat("en-US", {
            timeZone: site.timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hourCycle: "h23",
        })
            .formatToParts(date)
            .map(({ type, value }) => [type, Number(value)]),
    );
    const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    return new Date(date.getTime() - (wall - date.getTime()));
}

const siteDate = z.coerce.date().transform(atSiteMidnight);

/**
 * 文章：放在 src/content/articles/ 底下的 Markdown 檔。
 * - 網址：/articles/<資料夾>/<檔名>
 * - 類別：由所在資料夾決定，顯示名稱在 src/config/categories.ts 設定
 */
const articles = defineCollection({
    // 若修改 base，請一併修改 src/utils/categories.ts 的 ARTICLES_BASE
    loader: glob({ pattern: "**/*.md", base: "./src/content/articles" }),
    schema: z.object({
        title: z.string(),
        date: siteDate,
        /** 上次修改時間，選填（例如 `2026-11-16T04:51:00+08:00`）；未填時視為與 date 相同 */
        updated: siteDate.optional(),
        summary: z.string(),
        tags: z.array(z.string()).default([]),
        /** true 時不會出現在網站上 */
        draft: z.boolean().default(false),
    }),
});

export const collections = { articles };
