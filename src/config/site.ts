/**
 * 網站全域設定。
 * 想新增 / 移除 / 調整導覽列，只要修改 `nav` 陣列即可（側邊欄與 TopBar 共用）。
 */

import avatar from "../assets/avatar.jfif";

export interface NavItem {
    /** 顯示文字 */
    label: string;
    /** Google Material Symbols 圖示名稱，可在 https://fonts.google.com/icons 查詢 */
    icon: string;
    /** 連結，站內路徑（/articles）或外部網址（https://...） */
    href: string;
}

export const site = {
    /** 網站標題（瀏覽器分頁、TopBar 左上角） */
    title: "ZhiHao's Blog",
    /** 顯示在 Avatar 下方的名稱 */
    name: "CHIH-HAO, CHUANG",
    /** 名稱下方的一句話簡介 */
    tagline: "Developer",
    /**
     * 頭像圖片：放在 src/assets/ 並於檔案開頭 import（換成 .jpg / .png 也可以）。
     * 建置時會輸出含雜湊的檔名，瀏覽器可長期快取。
     */
    avatar,
    /**
     * 分享圖（OG image，見 src/utils/ogImage.ts）使用的頭像原始檔，相對於專案根目錄。
     * 建置時需直接讀取檔案，請與上方 avatar 指向同一張圖。
     */
    avatarFile: "src/assets/avatar.jfif",
    intro: "拖了好久總算是把這個 Blog 弄起來了。",
	aboutMe: "你好，我是莊智皓，目前就讀於成功大學資訊工程學系，平常的興趣兼專長是前後端、嵌入式系統、網通及基礎建設等相關領域，同時還會一點 3D 建模、PCB Layout 之類的技能。",

    /**
     * 顯示日期 / 時間使用的時區（IANA 名稱）。
     * 建置環境（例如 GitHub Actions）通常是 UTC，因此需要明確指定。
     */
    timezone: "Asia/Taipei",

    /**
     * 頁尾版權標註：© {since}–{建置年份} {holder}. {notice}
     * since 與建置年份相同時只顯示一個年份。
     */
    copyright: {
        holder: "CHIH-HAO, CHUANG",
        since: 2026,
        notice: "All rights reserved.",
    },

    /** 導覽列：由上到下（TopBar 中由左到右）依序顯示 */
    nav: [
        { label: "Home", icon: "home", href: "/" },
        { label: "Articles", icon: "article", href: "/articles" },
        { label: "Category", icon: "folder", href: "/categories" },
        { label: "Tags", icon: "sell", href: "/tags" },
        { label: "Contact", icon: "mail", href: "/contact" },
    ] satisfies NavItem[],
};
