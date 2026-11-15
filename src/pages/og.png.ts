/**
 * 網站預設的分享圖：/og.png（首頁與其他非文章頁面使用）
 */
import type { APIRoute } from "astro";
import { site } from "../config/site";
import { renderOgImage } from "../utils/ogImage";

export const GET: APIRoute = async () => {
    const png = await renderOgImage({ title: site.title, description: site.intro });
    return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
