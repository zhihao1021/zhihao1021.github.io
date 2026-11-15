import type { Article } from "./articles";

export function lastModified(article: Article): Date {
    if (article.data.updated) return article.data.updated;
    return article.data.date;
}
