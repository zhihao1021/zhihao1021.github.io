/**
 * 每篇文章的分享圖：/og/<文章路徑>.png（建置時產生，見 src/utils/ogImage.ts）
 */
import type { APIRoute, GetStaticPaths } from "astro";
import { formatDate, formatDateTime, getArticles, type Article } from "../../utils/articles";
import { categoryPath, categoryTrail } from "../../utils/categories";
import { lastModified } from "../../utils/lastModified";
import { renderOgImage } from "../../utils/ogImage";

export const getStaticPaths = (async () => {
    // 與文章頁面相同，隱藏類別的文章也有頁面，因此也產生分享圖
    const articles = await getArticles({ includeHidden: true });
    return articles.map((article) => ({ params: { slug: article.id }, props: { article } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ article: Article }> = async ({ props }) => {
    const { title, summary, date } = props.article.data;
    const updated = lastModified(props.article);

    const meta = [formatDate(date)];
    // const meta = [`發布於 ${formatDate(date)}`];
    // if (updated.getTime() > date.getTime()) meta.push(`更新於 ${formatDateTime(updated)}`);

    const png = await renderOgImage({
        title,
        description: summary,
        eyebrow: categoryTrail(categoryPath(props.article))
            .map((c) => c.name)
            .join(" / "),
        meta,
    });

    return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
