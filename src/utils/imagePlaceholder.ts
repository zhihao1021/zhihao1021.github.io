/**
 * 將 HTML 中的 <img> 改寫為「延後載入 + 佔位符」的形式：
 *
 *   <img src="a.png" width="800" height="600" alt="">
 *   ↓
 *   <span class="img-ph is-loading" data-sized>
 *     <img data-src="a.png" width="800" height="600" alt="" data-ph>
 *     <noscript><img src="a.png" width="800" height="600" alt=""></noscript>
 *   </span>
 *
 * - 移除 src / srcset，瀏覽器解析 HTML 時就不會立即下載圖片；
 *   由 ImagePlaceholder.astro 的腳本在其他資源載入完成後再還原。
 * - 佔位符直接輸出在 HTML 中，第一個畫面就會顯示。
 * - <noscript> 讓停用 JS 的環境仍能看到圖片。
 * - 加上 data-no-placeholder 屬性的 <img> 不會被處理。
 * - loading="eager" 的 <img>（首屏重要圖片，例如頭像）：只包上佔位符、保留 src 立即下載，
 *   已在快取中時會直接顯示。
 */

const IMG_TAG = /<img\b([^>]*?)\s*\/?>/gi;

export function transformImages(html: string): string {
    return html.replace(IMG_TAG, (tag, attrs: string) => {
        if (/\sdata-no-placeholder\b/i.test(attrs) || /\sdata-ph\b/i.test(attrs)) return tag;
        if (!/\ssrc\s*=/i.test(attrs)) return tag;

        const width = attrs.match(/\swidth\s*=\s*["']?(\d+)/i)?.[1];
        const sized = width !== undefined && /\sheight\s*=/i.test(attrs);
        // 只有寬度（例如遠端圖片用 ![說明|400](...) 指定）：佔位區塊至少套用該寬度，高度先以 16:9 估計
        const widthOnly = width !== undefined && !sized ? ` style="width: min(100%, ${width}px)"` : "";
        const wrapStart = `<span class="img-ph is-loading"${sized ? " data-sized" : ""}${widthOnly}>`;

        if (/\sloading\s*=\s*["']?eager\b/i.test(attrs)) {
            return `${wrapStart}<img${attrs} data-ph data-eager></span>`;
        }

        const deferred = attrs.replace(/\s(src|srcset)(\s*=)/gi, " data-$1$2");

        return (
            wrapStart +
            `<img${deferred} data-ph>` +
            `<noscript><img${attrs}></noscript>` +
            `</span>`
        );
    });
}
