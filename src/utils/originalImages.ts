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

/**
 * MDX 在建置頁面時才轉譯，文章資料中沒有 rendered.metadata.imagePaths，
 * 改從原始內容找出圖片路徑：Markdown 的 ![說明](路徑) 與 JSX / HTML 的 src="路徑"。
 */
function imagePathsFromBody(body: string): string[] {
    const paths = new Set<string>();
    for (const m of body.matchAll(/!\[[^\]]*\]\(\s*(?:<([^>]+)>|([^)\s]+))/g)) paths.add(m[1] ?? m[2]);
    for (const m of body.matchAll(/\bsrc\s*=\s*["']([^"']+)["']/g)) paths.add(m[1]);
    return [...paths].map((p) => {
        try {
            // 與 src/plugins/originalImage.ts 的 data-original 一致（decodeURI 後的路徑）
            return decodeURI(p);
        } catch {
            return p;
        }
    });
}

export async function originalImages(article: Article): Promise<Record<string, OriginalImage>> {
    const file = (article.filePath ?? "").replace(/\\/g, "/");
    const dir = file.slice(0, file.lastIndexOf("/"));
    const used = article.rendered?.metadata?.imagePaths ?? imagePathsFromBody(article.body ?? "");

    const map: Record<string, OriginalImage> = {};
    for (const rel of used) {
        if (/^([a-z]+:|\/)/i.test(rel)) continue; // 遠端或 public/ 圖片
        const image = (await images[normalize(`${dir}/${rel}`)]?.())?.default;
        if (image) map[rel] = { src: image.src, width: image.width, height: image.height };
    }
    return map;
}
