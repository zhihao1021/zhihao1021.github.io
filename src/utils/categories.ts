import { categoryNames, uncategorizedName, type CategoryName } from "../config/categories";
import { toSlug, type Article } from "./articles";
import { isHiddenCategory } from "./hiddenCategories";

/** 必須與 src/content.config.ts 中 glob loader 的 base 一致 */
export const ARTICLES_BASE = "src/content/articles/";

export interface CategoryNode {
    /** 資料夾路徑，例如 "dev/frontend"；根節點為 "" */
    path: string;
    name: string;
    children: CategoryNode[];
    /** 直接位於此資料夾的文章 */
    articles: Article[];
    /** 包含所有子類別的文章總數 */
    total: number;
}

/** 文章所屬的類別路徑（資料夾），根目錄的文章回傳 "" */
export function categoryPath(article: Article): string {
    const file = (article.filePath ?? article.id).replace(/\\/g, "/");
    const rel = file.startsWith(ARTICLES_BASE) ? file.slice(ARTICLES_BASE.length) : file;
    const i = rel.lastIndexOf("/");
    return i === -1 ? "" : rel.slice(0, i);
}

/** 在巢狀對應表中找到該路徑的設定，找不到回傳 undefined */
function lookup(path: string): CategoryName | undefined {
    let level: Record<string, CategoryName> | undefined = categoryNames;
    let entry: CategoryName | undefined;
    for (const part of path.split("/")) {
        entry = level?.[part];
        if (!entry) return undefined;
        level = entry.sub;
    }
    return entry;
}

export { isHiddenCategory };

/** 文章是否位於隱藏類別中 */
export function isHiddenArticle(article: Article): boolean {
    return isHiddenCategory(categoryPath(article));
}

/** 該路徑的父層在對應表中的子項目（用於排序），根層為 categoryNames */
function siblingsOf(path: string): Record<string, CategoryName> | undefined {
    const i = path.lastIndexOf("/");
    return i === -1 ? categoryNames : lookup(path.slice(0, i))?.sub;
}

/** 類別的顯示名稱：對應表 > 資料夾名稱 */
export function categoryName(path: string): string {
    if (!path) return uncategorizedName;
    return lookup(path)?.name ?? path.slice(path.lastIndexOf("/") + 1);
}

/** 從最上層到該類別的每一層，例如 "dev/frontend" → [開發, 前端] */
export function categoryTrail(path: string): { path: string; name: string }[] {
    if (!path) return [{ path: "", name: uncategorizedName }];
    const parts = path.split("/");
    return parts.map((_, i) => {
        const p = parts.slice(0, i + 1).join("/");
        return { path: p, name: categoryName(p) };
    });
}

/** 用於網址錨點，例如 "dev/frontend" → "cat-dev--frontend" */
export function categoryAnchor(path: string): string {
    return path ? "cat-" + path.split("/").map(toSlug).join("--") : "cat-uncategorized";
}

/** 在對應表同一層中的書寫順序，未列出為 -1 */
function orderOf(path: string): number {
    const key = path.slice(path.lastIndexOf("/") + 1);
    return Object.keys(siblingsOf(path) ?? {}).indexOf(key);
}

function compare(a: CategoryNode, b: CategoryNode) {
    const ia = orderOf(a.path);
    const ib = orderOf(b.path);
    if (ia !== ib) return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
    return a.name.localeCompare(b.name);
}

/** 依資料夾結構建立類別樹（文章需已排序） */
export function buildCategoryTree(articles: Article[]): CategoryNode {
    const root: CategoryNode = { path: "", name: uncategorizedName, children: [], articles: [], total: 0 };
    const nodes = new Map<string, CategoryNode>([["", root]]);

    function ensure(path: string): CategoryNode {
        let node = nodes.get(path);
        if (node) return node;
        const parentPath = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
        const parent = ensure(parentPath);
        node = { path, name: categoryName(path), children: [], articles: [], total: 0 };
        parent.children.push(node);
        nodes.set(path, node);
        return node;
    }

    for (const a of articles) {
        ensure(categoryPath(a)).articles.push(a);
    }

    (function finalize(node: CategoryNode): number {
        node.children.sort(compare);
        node.total = node.articles.length + node.children.reduce((sum, c) => sum + finalize(c), 0);
        return node.total;
    })(root);

    return root;
}

/** 類別總數（不含根節點） */
export function countCategories(node: CategoryNode): number {
    return node.children.reduce((sum, c) => sum + 1 + countCategories(c), 0);
}
