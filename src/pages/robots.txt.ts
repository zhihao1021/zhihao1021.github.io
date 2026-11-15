import type { APIRoute } from "astro";

/** 建置時產生 /robots.txt，告訴搜尋引擎 sitemap 的位置 */
export const GET: APIRoute = ({ site }) => {
    const sitemap = new URL("sitemap-index.xml", site);
    return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap.href}\n`, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
};
