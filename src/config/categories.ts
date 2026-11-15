/**
 * 類別名稱對應表。
 *
 * 類別由文章所在的資料夾決定（相對於 src/content/articles/）：
 *   src/content/articles/dev/frontend/hello.md  →  類別「dev/frontend」
 *   src/content/articles/hello.md               →  未分類
 *
 * 這裡依照資料夾結構設定顯示名稱：key 為資料夾名稱，`sub` 為子資料夾。
 * - 沒有列在這裡的資料夾，會直接使用資料夾名稱顯示。
 * - 同一層的類別會依照這裡的書寫順序排列，未列出的排在後面（依名稱排序）。
 * - `hidden: true`：該類別與其所有子類別的文章不會出現在任何列表
 *   （首頁、文章列表、類別、標籤、搜尋），但文章頁面仍會產生，知道網址的人可以直接開啟。
 */

export type CategoryName = {
    name: string;
    /** 隱藏此類別及其子類別內的文章 */
    hidden?: boolean;
    sub?: Record<string, CategoryName>;
};

export const categoryNames: Record<string, CategoryName> = {
    ncku: {
        name: "成功大學",
        sub: {
            "microprocessor": { name: "微算機" },
        }
    }
};

/** 直接放在 src/content/articles/ 底下（沒有資料夾）的文章 */
export const uncategorizedName = "未分類";
