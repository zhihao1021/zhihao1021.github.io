/**
 * 文章中本地圖片的「原始檔」對照表，供放大檢視（Lightbox）顯示原圖。
 *
 * - key：Markdown 中寫的相對路徑（與 src/plugins/originalImage.ts 輸出的 data-original 相同）
 * - value：原始圖片的網址與尺寸
 *
 * 透過 import.meta.glob 取得圖片後讀取 `.src`，Astro 才會在建置時保留（輸出）原始檔；
 * 只讀取文章實際用到的圖片，未使用的原始檔不會被輸出。
 */
import type { Article } from "./articles";

export interface OriginalImage {
    src: string;
    width: number;
    height: number;
}

const images = import.meta.glob<{ default: ImageMetadata }>(
    "/src/content/articles/**/*.{png,jpg,jpeg,webp,gif,avif,tif,tiff,PNG,JPG,JPEG,WEBP,GIF,AVIF,TIF,TIFF}",
);

/** 將 POSIX 路徑中的 . 與 .. 正規化 */
function normalize(path: string): string {
    const out: string[] = [];
    for (const part of path.split("/")) {
        if (part === "" || part === ".") continue;
        if (part === "..") out.pop();
        else out.push(part);
    }
    return "/" + out.join("/");
}

export async function originalImages(article: Article): Promise<Record<string, OriginalImage>> {
    const file = (article.filePath ?? "").replace(/\\/g, "/");
    const dir = file.slice(0, file.lastIndexOf("/"));
    const used = article.rendered?.metadata?.imagePaths ?? [];

    const map: Record<string, OriginalImage> = {};
    for (const rel of used) {
        if (/^([a-z]+:|\/)/i.test(rel)) continue; // 遠端或 public/ 圖片
        const image = (await images[normalize(`${dir}/${rel}`)]?.())?.default;
        if (image) map[rel] = { src: image.src, width: image.width, height: image.height };
    }
    return map;
}
