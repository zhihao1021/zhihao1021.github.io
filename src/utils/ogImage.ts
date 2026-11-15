/**
 * 建置時產生 Open Graph 分享圖（1200×630 PNG），供社群平台 / 通訊軟體預覽連結使用。
 *
 * - 版面以 satori 繪製成 SVG，再用 sharp 轉成 PNG
 * - 字體：向 Google Fonts 只下載圖片中用到的字（text= 參數），中文字體不必放進專案
 *   → 建置時需要網路連線
 * - 標題、描述過長時以「…」省略（最多兩行）
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import satori from "satori";
import sharp from "sharp";
import { site } from "../config/site";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export interface OgCard {
    title: string;
    description?: string;
    /** 標題上方的小字，例如類別「成功大學 / 微算機」 */
    eyebrow?: string;
    /** 底部的時間資訊，例如「2026-11-16」 */
    meta?: string[];
}

/* ---------- 顏色（與網站淺色主題一致） ---------- */
const COLORS = {
    text: "#1f1f1f",
    muted: "#6b6b6b",
    line: "#e6e6e4",
    /** 文字用（白底上需夠深） */
    accent: "#6e6e28",
};

/**
 * 背景：主題色 #d8d890 的斜向漸層，疊上左上角的亮光與右下角的深色光暈；
 * 內容放在半透明的白色卡片上，維持文字可讀性。
 */
const BACKGROUND = [
    "radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0) 45%)",
    "radial-gradient(circle at 100% 100%, rgba(110, 110, 40, 0.45) 0%, rgba(110, 110, 40, 0) 55%)",
    "linear-gradient(135deg, #f6f6e4 0%, #e8e8bf 45%, #d8d890 100%)",
].join(", ");

const FONT_FAMILY = "Noto Sans TC";

/* ---------- 字體 ---------- */
const fontCache = new Map<string, Promise<ArrayBuffer>>();

/** 從 Google Fonts 下載只包含指定文字的 TTF（不帶瀏覽器 User-Agent 時會回傳 truetype） */
function loadFont(weight: 400 | 700, text: string): Promise<ArrayBuffer> {
    const chars = [...new Set(text)].sort().join("");
    const key = `${weight}:${chars}`;
    let font = fontCache.get(key);
    if (!font) {
        font = (async () => {
            const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(FONT_FAMILY)}:wght@${weight}&text=${encodeURIComponent(chars)}`;
            const css = await (await fetch(cssUrl)).text();
            const url = css.match(/src:\s*url\(([^)]+)\)\s*format\(['"](?:truetype|opentype)['"]\)/)?.[1];
            if (!url) throw new Error(`[og] 無法從 Google Fonts 取得字體：${cssUrl}`);
            const res = await fetch(url);
            if (!res.ok) throw new Error(`[og] 下載字體失敗（${res.status}）：${url}`);
            return res.arrayBuffer();
        })();
        fontCache.set(key, font);
    }
    return font;
}

/* ---------- 頭像 ---------- */
let avatarPromise: Promise<string> | undefined;

/** 頭像轉成 PNG data URI（satori 只接受 PNG / JPEG / SVG 等常見格式） */
function loadAvatar(): Promise<string> {
    avatarPromise ??= (async () => {
        const png = await sharp(await readFile(resolve(process.cwd(), site.avatarFile)))
            .resize(192, 192, { fit: "cover" })
            .png()
            .toBuffer();
        return `data:image/png;base64,${png.toString("base64")}`;
    })();
    return avatarPromise;
}

/* ---------- 版面 ---------- */
type Child = Node | string | null | undefined | false;
interface Node {
    type: string;
    props: Record<string, unknown> & { children?: Child | Child[] };
}

/** 建立 satori 節點（等同 JSX 的 h()） */
function h(type: string, props: Record<string, unknown>, ...children: Child[]): Node {
    const list = children.filter((c) => c !== null && c !== undefined && c !== false);
    return { type, props: { ...props, children: list.length <= 1 ? list[0] : list } };
}

/** 最多 n 行，超出以「…」省略 */
function clamp(lines: number) {
    return { display: "block", lineClamp: lines, overflow: "hidden" } as const;
}

function layout(card: OgCard, avatar: string): Node {
    const host = new URL(import.meta.env.SITE ?? "https://example.com").host;

    return h(
        "div",
        {
            style: {
                // satori 預設 box-sizing 為 content-box（與瀏覽器相同），padding 會撐大尺寸
                boxSizing: "border-box",
                width: OG_WIDTH,
                height: OG_HEIGHT,
                display: "flex",
                padding: 36,
                backgroundImage: BACKGROUND,
                color: COLORS.text,
                fontFamily: FONT_FAMILY,
            },
        },
        h(
            "div",
            {
                style: {
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                    padding: "40px 56px 0",
                    borderRadius: 28,
                    border: "1px solid rgba(255, 255, 255, 0.9)",
                    background: "rgba(255, 255, 255, 0.82)",
                    boxShadow: "0 24px 60px -20px rgba(70, 70, 20, 0.35)",
                },
            },
        // 頂部：頭像 + 網站名稱
        h(
            "div",
            { style: { display: "flex", alignItems: "center", gap: 18 } },
            h("img", { src: avatar, width: 64, height: 64, style: { borderRadius: 14 } }),
            h(
                "div",
                { style: { display: "flex", flexDirection: "column" } },
                h("div", { style: { fontSize: 26, fontWeight: 700 } }, site.title),
                h("div", { style: { fontSize: 20, color: COLORS.muted } }, site.name),
            ),
        ),

        // 中間：類別、標題、描述
        h(
            "div",
            {
                style: {
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                    justifyContent: "center",
                    paddingBottom: 12,
                },
            },
            card.eyebrow &&
                h("div", { style: { fontSize: 22, color: COLORS.accent, marginBottom: 14 } }, card.eyebrow),
            h(
                "div",
                { style: { ...clamp(2), fontSize: 54, fontWeight: 700, lineHeight: 1.3 } },
                card.title,
            ),
            card.description &&
                h(
                    "div",
                    { style: { ...clamp(2), marginTop: 20, fontSize: 28, lineHeight: 1.5, color: COLORS.muted } },
                    card.description,
                ),
        ),

        // 底部：時間 + 網域
        h(
            "div",
            {
                style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: 80,
                    borderTop: `2px solid ${COLORS.line}`,
                    fontSize: 24,
                    color: COLORS.muted,
                },
            },
            h("div", { style: { display: "flex", gap: 28 } }, ...(card.meta ?? []).map((m) => h("div", {}, m))),
            h("div", {}, host),
        ),
        ),
    );
}

/** 產生分享圖 PNG */
export async function renderOgImage(card: OgCard): Promise<Buffer> {
    const host = new URL(import.meta.env.SITE ?? "https://example.com").host;
    // 圖片中所有文字（字體只下載這些字），加上省略號
    const text = [site.title, site.name, card.title, card.description, card.eyebrow, ...(card.meta ?? []), host, "…"].join("");

    const [avatar, regular, bold] = await Promise.all([loadAvatar(), loadFont(400, text), loadFont(700, text)]);

    const svg = await satori(layout(card, avatar) as Parameters<typeof satori>[0], {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        fonts: [
            { name: FONT_FAMILY, data: regular, weight: 400, style: "normal" },
            { name: FONT_FAMILY, data: bold, weight: 700, style: "normal" },
        ],
    });

    return sharp(Buffer.from(svg)).png().toBuffer();
}
